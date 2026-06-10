const XLSX = require('xlsx');
const Reporte = require('../models/Reporte');

const MESES = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];

const TIPOS_REPORTE = {
  presupuesto: procesarPresupuesto,
};

function limpiarMonto(val) {
  if (!val && val !== 0) return 0;
  if (typeof val === 'number') return val;
  const str = String(val).replace(/\$/g,'').replace(/\./g,'').replace(',','.').trim();
  const n = parseFloat(str);
  return isNaN(n) ? 0 : n;
}

function procesarPresupuesto(workbook) {
  const hoja  = workbook.Sheets[workbook.SheetNames[0]];
  const filas = XLSX.utils.sheet_to_json(hoja, { header: 1, defval: '' });

  // Detectar fila de encabezado buscando "ENERO" o "CATEGORIA"
  let filaEncabezado = -1;
  let colMeses = {};

  for (let i = 0; i < filas.length; i++) {
    const fila = filas[i].map(c => String(c).toUpperCase().trim());
    const tieneEnero = fila.some(c => c.includes('ENERO'));
    if (tieneEnero) {
      filaEncabezado = i;
      fila.forEach((cel, idx) => {
        MESES.forEach(mes => {
          if (cel.includes(mes)) colMeses[mes] = idx;
        });
      });
      break;
    }
  }

  if (filaEncabezado === -1) return { tipo: 'presupuesto', datos: [], resumen: { totalMonto: 0, totalFilas: 0, grupos: [], trimestres: [], periodo: '' } };

  const datos = [];
  let grupoActual = '';

  for (let i = filaEncabezado + 1; i < filas.length; i++) {
    const fila = filas[i];
    const concepto = String(fila[0] || '').trim();
    if (!concepto) continue;

    // Detectar fila de grupo (tiene montos en meses y texto en mayúsculas)
    const esGrupo = concepto === concepto.toUpperCase() && concepto.length > 3;
    if (esGrupo && Object.values(colMeses).some(col => limpiarMonto(fila[col]) > 0)) {
      grupoActual = concepto;
      continue;
    }
    if (esGrupo && !Object.values(colMeses).some(col => limpiarMonto(fila[col]) > 0)) {
      grupoActual = concepto;
      continue;
    }

    // Filas de detalle
    MESES.forEach((mes, idx) => {
      const col = colMeses[mes];
      if (col === undefined) return;
      const monto = limpiarMonto(fila[col]);
      if (monto === 0) return;

      const trimestre = idx < 3 ? 'Q1' : idx < 6 ? 'Q2' : idx < 9 ? 'Q3' : 'Q4';

      datos.push({
        trimestre,
        mes,
        grupo: grupoActual,
        concepto,
        monto
      });
    });
  }

  const totalMonto  = datos.reduce((s, d) => s + d.monto, 0);
  const grupos      = [...new Set(datos.map(d => d.grupo))].filter(Boolean);
  const trimestres  = [...new Set(datos.map(d => d.trimestre))];

  return {
    tipo: 'presupuesto',
    datos,
    resumen: {
      totalMonto,
      totalFilas:  datos.length,
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

    if (!procesador) return res.status(400).json({ error: `Tipo de reporte no soportado: ${tipoReporte}` });

    const workbook  = XLSX.read(req.file.buffer, { type: 'buffer' });
    const resultado = procesador(workbook);

    const reporte = await Reporte.create({
      nombre:          req.body.nombre || req.file.originalname,
      tipo:            tipoReporte,
      archivoOriginal: { nombre: req.file.originalname, tamaño: req.file.size },
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
      mensaje:   'Reporte procesado correctamente',
      reporteId: reporte._id,
      resumen:   resultado.resumen
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al procesar el archivo' });
  }
};

// ── LISTAR ────────────────────────────────────────────────────────────
const listarReportes = async (req, res) => {
  try {
    let query = {};
    if (req.usuario.rol === 'visor') query._id = { $in: req.usuario.reportesAsignados };
    const reportes = await Reporte.find(query)
      .select('-datos')
      .populate('creadoPor', 'nombre email')
      .sort({ createdAt: -1 });
    res.json(reportes);
  } catch { res.status(500).json({ error: 'Error al obtener reportes' }); }
};

// ── OBTENER ───────────────────────────────────────────────────────────
const obtenerReporte = async (req, res) => {
  try {
    const reporte = await Reporte.findById(req.params.id).populate('creadoPor', 'nombre email');
    if (!reporte) return res.status(404).json({ error: 'Reporte no encontrado' });
    if (req.usuario.rol === 'visor' && !req.usuario.reportesAsignados.includes(reporte._id))
      return res.status(403).json({ error: 'No tenés acceso a este reporte' });
    res.json(reporte);
  } catch { res.status(500).json({ error: 'Error al obtener reporte' }); }
};

// ── ELIMINAR ──────────────────────────────────────────────────────────
const eliminarReporte = async (req, res) => {
  try {
    await Reporte.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Reporte eliminado' });
  } catch { res.status(500).json({ error: 'Error al eliminar reporte' }); }
};

module.exports = { subirReporte, listarReportes, obtenerReporte, eliminarReporte };