const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { b2Client, BUCKET_NAME } = require('../config/b2');
const supabase = require('../config/supabase');

// Guardamos el archivo en memoria temporalmente (no en disco) antes de subirlo a B2.
// Limite de 15MB por archivo, y solo aceptamos PDF e imagenes.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const tiposPermitidos = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (tiposPermitidos.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo PDF, JPG, PNG o WEBP.'));
    }
  }
});

/**
 * POST /api/archivos/acta
 * Sube una foto o PDF de un acta electoral al bucket PRIVADO de Backblaze B2.
 * El bucket nunca se expone publicamente: cada archivo se sirve despues
 * mediante una URL firmada (presigned URL) con expiracion corta.
 */
router.post('/acta', upload.single('archivo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibio ningun archivo (campo "archivo")' });
    }

    const { mesa_votacion, region } = req.body;
    if (!mesa_votacion) {
      return res.status(400).json({ error: 'mesa_votacion es requerido' });
    }

    // Generamos una clave (key) unica y organizada por carpeta dentro del bucket
    const extension = req.file.originalname.split('.').pop();
    const key = `actas/${region || 'sin-region'}/${mesa_votacion}-${uuidv4()}.${extension}`;

    await b2Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      Metadata: {
        mesa_votacion: String(mesa_votacion),
        region: region || 'no-especificado',
        subido_en: new Date().toISOString(),
      }
    }));

    // Guardamos la referencia (metadata) del archivo en Supabase,
    // tabla estructurada que relaciona la mesa con su archivo en B2.
    const { data: registro, error } = await supabase
      .from('actas_archivos')
      .insert([{
        mesa_votacion,
        region: region || null,
        b2_key: key,
        nombre_original: req.file.originalname,
        tipo_mime: req.file.mimetype,
        tamano_bytes: req.file.size,
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      ok: true,
      archivo: registro,
      mensaje: 'Archivo almacenado en bucket privado de Backblaze B2'
    });
  } catch (err) {
    console.error('[archivos][POST acta] Error:', err.message);
    res.status(500).json({ error: err.message || 'Error al subir el archivo' });
  }
});

/**
 * GET /api/archivos/:id/url
 * Genera una URL firmada temporal (15 minutos) para ver/descargar un archivo
 * privado de B2. Esto es lo que permite que un bucket PRIVADO sea consumido
 * de forma segura desde una app publica, sin exponer credenciales ni hacer
 * el bucket publico.
 */
router.get('/:id/url', async (req, res) => {
  try {
    const { data: archivo, error } = await supabase
      .from('actas_archivos')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !archivo) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }

    const comando = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: archivo.b2_key,
    });

    const urlFirmada = await getSignedUrl(b2Client, comando, { expiresIn: 900 }); // 15 min

    res.json({
      url: urlFirmada,
      expira_en_segundos: 900,
      archivo: { nombre: archivo.nombre_original, mesa_votacion: archivo.mesa_votacion }
    });
  } catch (err) {
    console.error('[archivos][GET url] Error:', err.message);
    res.status(500).json({ error: 'Error al generar la URL del archivo' });
  }
});

/**
 * GET /api/archivos
 * Lista los archivos subidos (metadata desde Supabase), util para el panel de actas.
 */
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('actas_archivos')
      .select('*')
      .order('creado_en', { ascending: false })
      .limit(50);

    if (error) throw error;
    res.json({ total: data.length, archivos: data });
  } catch (err) {
    console.error('[archivos][GET] Error:', err.message);
    res.status(500).json({ error: 'Error al listar archivos' });
  }
});

module.exports = router;
