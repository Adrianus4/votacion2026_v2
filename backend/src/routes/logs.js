const express = require('express');
const router = express.Router();
const { getDb } = require('../config/mongodb');

/**
 * POST /api/logs
 * Registra un evento de auditoria (ej: "voto registrado", "acta subida", "error de validacion").
 * Estos logs tambien son datos SEMIESTRUCTURADOS -> MongoDB, porque cada tipo de
 * evento puede traer campos distintos en su "detalle".
 */
router.post('/', async (req, res) => {
  try {
    const db = getDb();
    const { tipo_evento, detalle } = req.body;

    if (!tipo_evento) {
      return res.status(400).json({ error: 'tipo_evento es requerido' });
    }

    const log = {
      tipo_evento,
      detalle: detalle || {},
      ip: req.ip,
      user_agent: req.headers['user-agent'] || null,
      creado_en: new Date(),
    };

    await db.collection('logs_eventos').insertOne(log);
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('[logs][POST] Error:', err.message);
    res.status(500).json({ error: 'Error al registrar el log' });
  }
});

/**
 * GET /api/logs/resumen
 * Pequeño resumen de actividad reciente, util para un panel de monitoreo.
 */
router.get('/resumen', async (req, res) => {
  try {
    const db = getDb();
    const pipeline = [
      { $group: { _id: '$tipo_evento', total: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ];
    const resumen = await db.collection('logs_eventos').aggregate(pipeline).toArray();
    res.json({ resumen });
  } catch (err) {
    console.error('[logs][resumen] Error:', err.message);
    res.status(500).json({ error: 'Error al obtener resumen de logs' });
  }
});

module.exports = router;
