const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

const CANDIDATOS_VALIDOS = ['fuerza_popular', 'juntos_por_el_peru'];

/**
 * POST /api/votos
 * Registra un voto de la encuesta publica (dato ESTRUCTURADO -> Supabase/Postgres).
 * Un voto = una fila en la tabla votos_encuesta.
 */
router.post('/', async (req, res) => {
  try {
    const { candidato, region, comentario, session_id } = req.body;

    if (!CANDIDATOS_VALIDOS.includes(candidato)) {
      return res.status(400).json({
        error: 'candidato invalido. Debe ser "fuerza_popular" o "juntos_por_el_peru"'
      });
    }

    if (!session_id) {
      return res.status(400).json({ error: 'session_id es requerido (evita votos duplicados)' });
    }

    // Evitamos que la misma sesion de navegador vote dos veces
    const { data: existente, error: errBusqueda } = await supabase
      .from('votos_encuesta')
      .select('id')
      .eq('session_id', session_id)
      .maybeSingle();

    if (errBusqueda) throw errBusqueda;

    if (existente) {
      return res.status(409).json({ error: 'Esta sesion ya registro un voto' });
    }

    const { data, error } = await supabase
      .from('votos_encuesta')
      .insert([{
        candidato,
        region: region || 'No especificado',
        comentario: comentario ? comentario.slice(0, 280) : null,
        session_id,
        ip_hash: req.ip ? Buffer.from(req.ip).toString('base64').slice(0, 20) : null,
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ ok: true, voto: data });
  } catch (err) {
    console.error('[votos][POST] Error:', err.message);
    res.status(500).json({ error: 'Error al registrar el voto' });
  }
});

/**
 * GET /api/votos/resultados
 * Devuelve el conteo agregado por candidato para el dashboard publico.
 */
router.get('/resultados', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('votos_encuesta')
      .select('candidato');

    if (error) throw error;

    const conteo = { fuerza_popular: 0, juntos_por_el_peru: 0 };
    data.forEach(row => {
      if (conteo[row.candidato] !== undefined) conteo[row.candidato]++;
    });

    const total = conteo.fuerza_popular + conteo.juntos_por_el_peru;

    res.json({
      total,
      conteo,
      porcentaje: {
        fuerza_popular: total ? +(conteo.fuerza_popular / total * 100).toFixed(1) : 0,
        juntos_por_el_peru: total ? +(conteo.juntos_por_el_peru / total * 100).toFixed(1) : 0,
      },
      actualizado: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[votos][resultados] Error:', err.message);
    res.status(500).json({ error: 'Error al obtener resultados' });
  }
});

/**
 * GET /api/votos/resultados-por-region
 * Desglose por region para graficos mas detallados.
 */
router.get('/resultados-por-region', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('votos_encuesta')
      .select('candidato, region');

    if (error) throw error;

    const porRegion = {};
    data.forEach(({ candidato, region }) => {
      if (!porRegion[region]) {
        porRegion[region] = { fuerza_popular: 0, juntos_por_el_peru: 0 };
      }
      porRegion[region][candidato]++;
    });

    res.json(porRegion);
  } catch (err) {
    console.error('[votos][por-region] Error:', err.message);
    res.status(500).json({ error: 'Error al obtener resultados por region' });
  }
});

module.exports = router;
