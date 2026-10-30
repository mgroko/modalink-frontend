export const UNIDADES_DURACION = {
  HORAS: "HORAS",
  MINUTOS: "MINUTOS",
};

export const ETIQUETAS_UNIDAD_DURACION = {
  [UNIDADES_DURACION.HORAS]: "Horas",
  [UNIDADES_DURACION.MINUTOS]: "Minutos",
};

export const MINUTOS_POR_UNIDAD = {
  [UNIDADES_DURACION.HORAS]: 60,
  [UNIDADES_DURACION.MINUTOS]: 1,
};

export const LIMITES_ACTIVIDAD = {
  NOMBRE: 100,
  DESCRIPCION: 200,
  REQUERIMIENTO_DESCRIPCION: 200,
};

export const ESTADOS_ACTIVIDAD = {
  PENDIENTE: "PENDIENTE",
  EN_CURSO: "EN_CURSO",
  FINALIZADA: "FINALIZADA",
  CANCELADA: "CANCELADA",
};

export const ETIQUETAS_ESTADO_ACTIVIDAD = {
  [ESTADOS_ACTIVIDAD.PENDIENTE]: "Pendiente",
  [ESTADOS_ACTIVIDAD.EN_CURSO]: "En curso",
  [ESTADOS_ACTIVIDAD.FINALIZADA]: "Finalizada",
  [ESTADOS_ACTIVIDAD.CANCELADA]: "Cancelada",
};

export const OPCIONES_ESTADO_ACTIVIDAD = Object.values(ESTADOS_ACTIVIDAD).map(
  (value) => ({ value, text: ETIQUETAS_ESTADO_ACTIVIDAD[value] })
);

export const TRANSICIONES_ESTADO_ACTIVIDAD = {
  [ESTADOS_ACTIVIDAD.PENDIENTE]: [
    ESTADOS_ACTIVIDAD.PENDIENTE,
    ESTADOS_ACTIVIDAD.EN_CURSO,
    ESTADOS_ACTIVIDAD.CANCELADA,
  ],
  [ESTADOS_ACTIVIDAD.EN_CURSO]: [
    ESTADOS_ACTIVIDAD.EN_CURSO,
    ESTADOS_ACTIVIDAD.FINALIZADA,
    ESTADOS_ACTIVIDAD.CANCELADA,
  ],
  [ESTADOS_ACTIVIDAD.FINALIZADA]: [],
  [ESTADOS_ACTIVIDAD.CANCELADA]: [],
};

export const ESTADOS_CRONOGRAMA = {
  NORMAL: "NORMAL",
  ALERTA_DESBORDE: "ALERTA_DESBORDE",
};

export const ETIQUETAS_ESTADO_CRONOGRAMA = {
  [ESTADOS_CRONOGRAMA.NORMAL]: "Normal",
  [ESTADOS_CRONOGRAMA.ALERTA_DESBORDE]: "Alerta por desborde",
};

export const COLORES_ESTADO_ACTIVIDAD = {
  [ESTADOS_ACTIVIDAD.PENDIENTE]: {
    fondo: "var(--color-warning-soft)",
    texto: "var(--color-warning-text)",
    borde: "var(--color-warning-border)",
  },
  [ESTADOS_ACTIVIDAD.EN_CURSO]: {
    fondo: "var(--color-info-soft)",
    texto: "var(--color-info-text)",
    borde: "var(--color-info-border)",
  },
  [ESTADOS_ACTIVIDAD.FINALIZADA]: {
    fondo: "var(--color-success-soft)",
    texto: "var(--color-success-text)",
    borde: "var(--color-success-border)",
  },
  [ESTADOS_ACTIVIDAD.CANCELADA]: {
    fondo: "var(--color-danger-soft)",
    texto: "var(--color-danger-text)",
    borde: "var(--color-danger-border)",
  },
};

const COLORES_ESTADO_ACTIVIDAD_POR_DEFECTO =
  COLORES_ESTADO_ACTIVIDAD[ESTADOS_ACTIVIDAD.PENDIENTE];

export function normalizarEstadoActividad(estado) {
  if (!estado) return ESTADOS_ACTIVIDAD.PENDIENTE;
  const clave = Object.keys(ESTADOS_ACTIVIDAD).find(
    (k) => k.toLowerCase() === String(estado).toLowerCase()
  );
  return clave || String(estado).toUpperCase();
}

/**
 * Estados destino válidos desde el estado actual (UC-50 §7.1).
 * @param {string} estadoActual
 * @returns {string[]}
 */
export function estadosPermitidosActividad(estadoActual) {
  const clave = normalizarEstadoActividad(estadoActual);
  return TRANSICIONES_ESTADO_ACTIVIDAD[clave] || [];
}

/**
 * Sólo las actividades PENDIENTE o EN_CURSO pueden modificarse.
 * @param {string} estado
 * @returns {boolean}
 */
export function puedeEditarActividad(estado) {
  const clave = normalizarEstadoActividad(estado);
  return [ESTADOS_ACTIVIDAD.PENDIENTE, ESTADOS_ACTIVIDAD.EN_CURSO].includes(clave);
}

/**
 * El estado de actividad llega normalizado en mayúsculas desde el sistema y
 * los formularios, así que la comparación directa es suficiente.
 * @param {object|null|undefined} actividad
 * @returns {boolean}
 */
export function esActividadCancelada(actividad) {
  return actividad?.estado === ESTADOS_ACTIVIDAD.CANCELADA;
}

/**
 * Reconstruye duración y unidad desde `duracionMinutos`.
 * Los múltiplos de 60 se muestran en HORAS; el resto en MINUTOS.
 * @param {number} duracionMinutos
 * @returns {{duracion: number|string, unidadDuracion: "HORAS"|"MINUTOS"}}
 */
export function descomponerDuracionMinutos(duracionMinutos) {
  const total = Math.round(Number(duracionMinutos));
  if (!Number.isFinite(total) || total <= 0) {
    return { duracion: "", unidadDuracion: UNIDADES_DURACION.HORAS };
  }

  if (total % MINUTOS_POR_UNIDAD.HORAS === 0) {
    return {
      duracion: total / MINUTOS_POR_UNIDAD.HORAS,
      unidadDuracion: UNIDADES_DURACION.HORAS,
    };
  }

  return {
    duracion: total,
    unidadDuracion: UNIDADES_DURACION.MINUTOS,
  };
}

/**
 * Convierte una cantidad entre unidades preservando el total de minutos.
 * Devuelve null si la conversión no produce un entero.
 * @param {number|string} duracion
 * @param {"HORAS"|"MINUTOS"} unidadOrigen
 * @param {"HORAS"|"MINUTOS"} unidadDestino
 * @returns {number|null}
 */
export function convertirDuracion(duracion, unidadOrigen, unidadDestino) {
  const cantidad = Number(duracion);
  const origen = MINUTOS_POR_UNIDAD[unidadOrigen];
  const destino = MINUTOS_POR_UNIDAD[unidadDestino];

  if (
    !Number.isFinite(cantidad) ||
    cantidad <= 0 ||
    !origen ||
    !destino
  ) {
    return null;
  }

  const total = cantidad * origen;
  return total % destino === 0 ? total / destino : null;
}

export function etiquetaEstadoActividad(estado) {
  const clave = normalizarEstadoActividad(estado);
  return ETIQUETAS_ESTADO_ACTIVIDAD[clave] || String(estado || "");
}

export function coloresEstadoActividad(estado) {
  const clave = normalizarEstadoActividad(estado);
  return COLORES_ESTADO_ACTIVIDAD[clave] || COLORES_ESTADO_ACTIVIDAD_POR_DEFECTO;
}

/**
 * "1 h", "1 h 30 min", "45 min". Devuelve "—" si no hay duración válida.
 * @param {number} minutos
 * @returns {string}
 */
export function formatearDuracionMinutos(minutos) {
  const total = Math.round(Number(minutos));
  if (!Number.isFinite(total) || total <= 0) return "—";

  const horas = Math.floor(total / MINUTOS_POR_UNIDAD.HORAS);
  const mins = total % MINUTOS_POR_UNIDAD.HORAS;

  const partes = [];
  if (horas) partes.push(`${horas} h`);
  if (mins) partes.push(`${mins} min`);
  return partes.join(" ");
}

/**
 * Parsea fechas locales ISO-8601 (`YYYY-MM-DDTHH:mm:ss`) sin asumir UTC.
 * @param {string|Date|null|undefined} valor
 * @returns {Date|null}
 */
export function parseFechaLocal(valor) {
  if (valor instanceof Date) {
    return Number.isNaN(valor.getTime()) ? null : valor;
  }
  if (valor == null || valor === "") return null;

  const [fecha, hora = ""] = String(valor).split("T");
  const [anio, mes, dia] = fecha.split("-").map(Number);
  if (!anio || !mes || !dia) return null;

  const [h = 0, m = 0, s = 0] = hora.split(":").map(Number);
  const resultado = new Date(anio, mes - 1, dia, h || 0, m || 0, s || 0);
  return Number.isNaN(resultado.getTime()) ? null : resultado;
}

/**
 * Fin del día de entrega, tal como programa el sistema (23:59).
 * @param {string|Date|null|undefined} fechaEntrega
 * @returns {Date|null}
 */
export function finDelDiaEntrega(fechaEntrega) {
  const fecha = parseFechaLocal(fechaEntrega);
  if (!fecha) return null;
  fecha.setHours(23, 59, 0, 0);
  return fecha;
}

/**
 * Inicio estimado de la nueva actividad: entrega 23:59 - duración.
 * @param {string} fechaEntrega "YYYY-MM-DD" o ISO local
 * @param {number|string} duracion
 * @param {"HORAS"|"MINUTOS"} unidadDuracion
 * @returns {Date|null}
 */
export function calcularInicioEstimado(fechaEntrega, duracion, unidadDuracion) {
  const fin = finDelDiaEntrega(fechaEntrega);
  const cantidad = Number(duracion);
  const minutosPorUnidad = MINUTOS_POR_UNIDAD[unidadDuracion];
  if (!fin || !Number.isFinite(cantidad) || cantidad <= 0 || !minutosPorUnidad) {
    return null;
  }
  return new Date(fin.getTime() - cantidad * minutosPorUnidad * 60000);
}


