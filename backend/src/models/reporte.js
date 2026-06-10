const mongoose = require('mongoose');

const reporteSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  tipo: {
    type: String,
    enum: ['presupuesto', 'pagos', 'ocupacion', 'mixto'],
    required: true
  },
  archivoOriginal: {
    nombre: String,
    tamaño: Number
  },
  archivosResultado: {
    limpio: String,
    eliminados: String
  },
  estadisticas: {
    totalFilas:      { type: Number, default: 0 },
    filasLimpias:    { type: Number, default: 0 },
    filasEliminadas: { type: Number, default: 0 },
    montoLimpio:     { type: Number, default: 0 },
    montoEliminado:  { type: Number, default: 0 }
  },
  // Datos procesados del Excel
  datos: [{
    trimestre: String,
    mes:       String,
    grupo:     String,
    concepto:  String,
    monto:     Number
  }],
  // Resumen calculado
  resumen: {
    totalMonto:  Number,
    totalFilas:  Number,
    grupos:      [String],
    trimestres:  [String],
    periodo:     String
  },
  criteriosAplicados: [{
    type: String
  }],
  estado: {
    type: String,
    enum: ['pendiente', 'procesando', 'completado', 'error'],
    default: 'pendiente'
  },
  creadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  // Visores que pueden ver este reporte
  visoresAsignados: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Reporte', reporteSchema);