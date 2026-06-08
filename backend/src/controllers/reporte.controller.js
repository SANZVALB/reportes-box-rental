const XLSX = require('xlsx');
const Reporte = require('../models/Reporte');

// Tipos de reporte registrados — se agregan acá a medida que crecen
const TIPOS_REPORTE = {
  presupuesto: procesarPresupuesto,
};

// ── PROCESADOR: PRESUPUESTO ANUAL ─────────────────────────────────────
function procesarPresupuesto(workbook) {
  const hoja = workbook.Sheets[workbook.SheetNames[0]];
  const filas = XLSX.utils.sheet_to_json(hoja, { defval: '' });

  const datos = [];

  filas.forEach(fila => {
    // Normalizar claves (quita espacios, pasa a minúsculas)
    const keys = Object.keys(fila).reduce((acc, k) => {
      acc[k.trim().toLowerCase()] = fila[k];
      return acc;
    }, {});

    const trimestre = keys['trimestre'] || keys['tri'] || '';
    const mes       = keys['mes'] || '';
    const grupo     = keys['grupo'] || keys['centro de gasto'] || '';
    const concepto  = keys['concepto'] || keys['descripcion'] || '';
    const monto     = parseFloat(keys['monto'] || keys['importe'] || 0);

    if (!concepto || isNaN(monto)) return;

    datos.push({ trimestre, mes, grupo, concepto, monto });
  });

  // Estadísticas generales
  const totalMonto = datos.reduce((s, d) => s + d.monto, 0);
  const grupos     = [...new Set(datos.map(d => d.grupo))];
  const trimestres = [...new Set(datos.map(d => d.trimestre))];

  return {
    tipo: 'presupuesto',
    datos,
    resumen: {
      totalMonto,
      totalFilas:   datos.length,
      grupos,
      trimestres,
      periodo: trimestres.join(' - ')
    }
  };
}

// ── UPLOAD Y PROCESAMIENTO ────────────────────────────────────────────
const subirReporte = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' });

    const tipoReporte = req.body.tipo || 'presupuesto';
    const procesador  = TIPOS_REPORTE[tipoReporte];

    if (!procesador) {
      return res.status(400).json({ error: `Tipo de reporte no soportado: ${tipoReporte}` });
    }

    // Leer Excel desde buffer
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const resultado = procesador(workbook);

    // Guardar en MongoDB
    const reporte = await Reporte.create({
      nombre:          req.body.nombre || req.file.originalname,
      tipo:            tipoReporte,
      archivoOriginal: {
        nombre: req.file.originalname,
        tamaño: req.file.size
      },
      estadisticas: {
        totalFilas:  resultado.resumen.totalFilas,
        montoLimpio: resultado.resumen.totalMonto
      },
      datos:    resultado.datos,
      resumen:  resultado.resumen,
      estado:   'completado',
      creadoPor: req.usuario._id
    });

    res.status(201).json({
      mensaje:  'Reporte procesado correctamente',
      reporteId: reporte._id,
      resumen:  resultado.resumen
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al procesar el archivo' });
  }
};

// ── LISTAR REPORTES ───────────────────────────────────────────────────
const listarReportes = async (req, res) => {
  try {
    let query = {};

    // Visor solo ve sus reportes asignados
    if (req.usuario.rol === 'visor') {
      query._id = { $in: req.usuario.reportesAsignados };
    }

    const reportes = await Reporte.find(query)
      .select('-datos')
      .populate('creadoPor', 'nombre email')
      .sort({ createdAt: -1 });

    res.json(reportes);
  } catch {
    res.status(500).json({ error: 'Error al obtener reportes' });
  }
};

// ── OBTENER REPORTE POR ID ────────────────────────────────────────────
const obtenerReporte = async (req, res) => {
  try {
    const reporte = await Reporte.findById(req.params.id)
      .populate('creadoPor', 'nombre email');

    if (!reporte) return res.status(404).json({ error: 'Reporte no encontrado' });

    // Visor solo puede ver si está asignado
    if (req.usuario.rol === 'visor' &&
        !req.usuario.reportesAsignados.includes(reporte._id)) {
      return res.status(403).json({ error: 'No tenés acceso a este reporte' });
    }

    res.json(reporte);
  } catch {
    res.status(500).json({ error: 'Error al obtener reporte' });
  }
};

// ── ELIMINAR REPORTE ──────────────────────────────────────────────────
const eliminarReporte = async (req, res) => {
  try {
    await Reporte.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Reporte eliminado' });
  } catch {
    res.status(500).json({ error: 'Error al eliminar reporte' });
  }
};

module.exports = { subirReporte, listarReportes, obtenerReporte, eliminarReporte };