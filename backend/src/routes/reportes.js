const express = require('express');
const router = express.Router();
const { getDb } = require('../config/mongodb');

/**
 * POST /api/reportes
 * Guarda un reporte semiestructurado (JSON flexible) sobre una acta electoral.
 * A diferencia de Supabase, aqui el "esquema" puede variar de un documento a otro
 * (ej: a veces hay testigos, a veces no; a veces hay observaciones, etc).
 * Esto es justamente lo que MongoDB hace bien: dato SEMIESTRUCTURADO -> colecion JSON.
 */
router.post('/', async (req, res) => {
  try {
    const db = getDb();
    const coleccion = db.collection('reportes_acta');

    const reporte = {
      mesa_votacion: req.body.mesa_votacion,
      ubigeo: req.body.ubigeo || null,
      region: req.body.region || null,
      candidato_ganador_mesa: req.body.candidato_ganador_mesa || null,
      votos: req.body.votos || {},          // objeto libre: { fuerza_popular: 120, juntos_por_el_peru: 98, blanco: 3, nulo: 5 }
      observaciones: req.body.observaciones || [],
      testigos: req.body.testigos || [],     // array libre, estructura variable
      metadata_extra: req.body.metadata_extra || {}, // cualquier campo adicional sin esquema fijo
      acta_b2_key: req.body.acta_b2_key || null, // referencia al archivo subido en Backblaze B2
      creado_en: new Date(),
    };

    if (!reporte.mesa_votacion) {
      return res.status(400).json({ error: 'mesa_votacion es requerido' });
    }

    const resultado = await coleccion.insertOne(reporte);

    res.status(201).json({ ok: true, id: resultado.insertedId, reporte });
  } catch (err) {
    console.error('[reportes][POST] Error:', err.message);
    res.status(500).json({ error: 'Error al guardar el reporte' });
  }
});

/**
 * GET /api/reportes
 * Lista los reportes mas recientes (paginado simple).
 */
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const limite = Math.min(parseInt(req.query.limite) || 20, 100);

    const reportes = await db.collection('reportes_acta')
      .find({})
      .sort({ creado_en: -1 })
      .limit(limite)
      .toArray();

    res.json({ total: reportes.length, reportes });
  } catch (err) {
    console.error('[reportes][GET] Error:', err.message);
    res.status(500).json({ error: 'Error al listar reportes' });
  }
});

/**
 * GET /api/reportes/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { ObjectId } = require('mongodb');
    const db = getDb();
    const reporte = await db.collection('reportes_acta')
      .findOne({ _id: new ObjectId(req.params.id) });

    if (!reporte) return res.status(404).json({ error: 'Reporte no encontrado' });
    res.json(reporte);
  } catch (err) {
    console.error('[reportes][GET id] Error:', err.message);
    res.status(400).json({ error: 'ID invalido o error al buscar el reporte' });
  }
});

module.exports = router;
