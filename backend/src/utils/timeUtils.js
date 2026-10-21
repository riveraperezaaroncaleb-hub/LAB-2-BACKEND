// Utilidades para cálculo de horarios y días de la semana

const DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

// Obtiene el día de la semana en español a partir de una fecha YYYY-MM-DD
function obtenerDiaSemana(fechaStr) {
  // Parsing explícito para evitar desfase de zona horaria
  const [año, mes, dia] = fechaStr.split('-').map(Number);
  const fecha = new Date(año, mes - 1, dia);
  return DIAS_SEMANA[fecha.getDay()];
}

// Normaliza formato de hora a HH:MM:SS
function normalizarHora(horaStr) {
  if (!horaStr) return '00:00:00';
  const partes = horaStr.trim().split(':');
  const h = partes[0].padStart(2, '0');
  const m = (partes[1] || '00').padStart(2, '0');
  const s = (partes[2] || '00').padStart(2, '0');
  return `${h}:${m}:${s}`;
}

// Suma N horas a una hora HH:MM[:SS] y retorna HH:MM:SS
function calcularHoraFin(horaInicioStr, horasASumar = 2) {
  const [h, m] = horaInicioStr.split(':').map(Number);
  let finH = h + horasASumar;
  const finHStr = String(finH).padStart(2, '0');
  const finMStr = String(m || 0).padStart(2, '0');
  return `${finHStr}:${finMStr}:00`;
}

// Comprueba si un intervalo [inicio, fin] cae dentro de [apertura, cierre]
function intervaloDentroDeHorario(inicio, fin, apertura, cierre) {
  return inicio >= apertura && fin <= cierre;
}

module.exports = {
  DIAS_SEMANA,
  obtenerDiaSemana,
  normalizarHora,
  calcularHoraFin,
  intervaloDentroDeHorario
};
