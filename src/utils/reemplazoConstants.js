import { ETIQUETAS_CARAC, normCodigo } from "./perfilConstants.js";

/*
 * Contrato del módulo de reemplazo automático.
 *
 * Los estados y códigos provienen del backend
 * (org.mgroko.backend.reemplazos). Los componentes no deben hardcodear
 * etiquetas, rutas ni reglas de presentación: todo se centraliza acá.
 */

export const TIPOS_REEMPLAZO = {
  ACTIVIDAD: "ACTIVIDAD",
  GENERAL: "GENERAL",
};

export const ORIGENES_REEMPLAZO = {
  BAJA_VOLUNTARIA: "BAJA_VOLUNTARIA",
  ELIMINACION: "ELIMINACION",
};

export const ESTADOS_REEMPLAZO = {
  PENDIENTE_CONFIRMACION_DIRECTOR: "PENDIENTE_CONFIRMACION_DIRECTOR",
  INVITACIONES_ENVIADAS: "INVITACIONES_ENVIADAS",
  PENDIENTE_APROBACION: "PENDIENTE_APROBACION",
  CUBIERTO: "CUBIERTO",
  SIN_CANDIDATOS: "SIN_CANDIDATOS",
  CANCELADO: "CANCELADO",
  EXPIRADO: "EXPIRADO",
};

export const ESTADOS_CANDIDATO_REEMPLAZO = {
  PROPUESTO: "PROPUESTO",
  INVITADO: "INVITADO",
  ACEPTADO_PENDIENTE_APROBACION: "ACEPTADO_PENDIENTE_APROBACION",
  APROBADO: "APROBADO",
  RECHAZADO: "RECHAZADO",
  RECHAZADO_ADMIN: "RECHAZADO_ADMIN",
  EXPIRADO: "EXPIRADO",
  CANCELADO: "CANCELADO",
};

export const NIVELES_UBICACION_REEMPLAZO = {
  MISMA_CIUDAD: "MISMA_CIUDAD",
  MISMA_PROVINCIA: "MISMA_PROVINCIA",
  OTRA: "OTRA",
};

export const TIPOS_DISPONIBILIDAD_REEMPLAZO = {
  EXACTA: "EXACTA",
  CON_REPROGRAMACION: "CON_REPROGRAMACION",
  NO_APLICA: "NO_APLICA",
  NO_DISPONIBLE: "NO_DISPONIBLE",
};

export const ACCIONES_GESTION_REEMPLAZO = {
  ACEPTAR: "ACEPTAR",
  RECHAZAR: "RECHAZAR",
};

export const ACCIONES_DECISION_REEMPLAZO = {
  APROBAR: "APROBAR",
  RECHAZAR: "RECHAZAR",
};

export const ESTADOS_REEMPLAZO_FINALES = [
  ESTADOS_REEMPLAZO.CUBIERTO,
  ESTADOS_REEMPLAZO.CANCELADO,
  ESTADOS_REEMPLAZO.EXPIRADO,
];

export const ESTADOS_CANDIDATO_INVITACION = [
  ESTADOS_CANDIDATO_REEMPLAZO.INVITADO,
  ESTADOS_CANDIDATO_REEMPLAZO.ACEPTADO_PENDIENTE_APROBACION,
];

export const LIMITE_MENSAJE_REEMPLAZO = 200;
export const LIMITE_MOTIVO_REEMPLAZO = 200;

const ETIQUETAS_ESTADO_REEMPLAZO = {
  [ESTADOS_REEMPLAZO.PENDIENTE_CONFIRMACION_DIRECTOR]:
    "Pendiente de confirmación",
  [ESTADOS_REEMPLAZO.INVITACIONES_ENVIADAS]: "Invitaciones enviadas",
  [ESTADOS_REEMPLAZO.PENDIENTE_APROBACION]: "Pendiente de aprobación",
  [ESTADOS_REEMPLAZO.CUBIERTO]: "Cubierto",
  [ESTADOS_REEMPLAZO.SIN_CANDIDATOS]: "Sin candidatos",
  [ESTADOS_REEMPLAZO.CANCELADO]: "Cancelado",
  [ESTADOS_REEMPLAZO.EXPIRADO]: "Expirado",
};

const TONOS_ESTADO_REEMPLAZO = {
  [ESTADOS_REEMPLAZO.PENDIENTE_CONFIRMACION_DIRECTOR]: "warning",
  [ESTADOS_REEMPLAZO.INVITACIONES_ENVIADAS]: "info",
  [ESTADOS_REEMPLAZO.PENDIENTE_APROBACION]: "warning",
  [ESTADOS_REEMPLAZO.CUBIERTO]: "success",
  [ESTADOS_REEMPLAZO.SIN_CANDIDATOS]: "danger",
  [ESTADOS_REEMPLAZO.CANCELADO]: "neutral",
  [ESTADOS_REEMPLAZO.EXPIRADO]: "neutral",
};

const ETIQUETAS_ESTADO_CANDIDATO = {
  [ESTADOS_CANDIDATO_REEMPLAZO.PROPUESTO]: "Propuesto",
  [ESTADOS_CANDIDATO_REEMPLAZO.INVITADO]: "Invitado",
  [ESTADOS_CANDIDATO_REEMPLAZO.ACEPTADO_PENDIENTE_APROBACION]:
    "Aceptó, pendiente de aprobación",
  [ESTADOS_CANDIDATO_REEMPLAZO.APROBADO]: "Aprobado",
  [ESTADOS_CANDIDATO_REEMPLAZO.RECHAZADO]: "Rechazó la invitación",
  [ESTADOS_CANDIDATO_REEMPLAZO.RECHAZADO_ADMIN]: "Rechazado por el director",
  [ESTADOS_CANDIDATO_REEMPLAZO.EXPIRADO]: "Expirado",
  [ESTADOS_CANDIDATO_REEMPLAZO.CANCELADO]: "Cancelado",
};

const TONOS_ESTADO_CANDIDATO = {
  [ESTADOS_CANDIDATO_REEMPLAZO.PROPUESTO]: "info",
  [ESTADOS_CANDIDATO_REEMPLAZO.INVITADO]: "warning",
  [ESTADOS_CANDIDATO_REEMPLAZO.ACEPTADO_PENDIENTE_APROBACION]: "warning",
  [ESTADOS_CANDIDATO_REEMPLAZO.APROBADO]: "success",
  [ESTADOS_CANDIDATO_REEMPLAZO.RECHAZADO]: "danger",
  [ESTADOS_CANDIDATO_REEMPLAZO.RECHAZADO_ADMIN]: "danger",
  [ESTADOS_CANDIDATO_REEMPLAZO.EXPIRADO]: "neutral",
  [ESTADOS_CANDIDATO_REEMPLAZO.CANCELADO]: "neutral",
};

const ETIQUETAS_TIPO = {
  [TIPOS_REEMPLAZO.ACTIVIDAD]: "Actividad",
  [TIPOS_REEMPLAZO.GENERAL]: "Requerimiento general",
};

const ETIQUETAS_ORIGEN = {
  [ORIGENES_REEMPLAZO.BAJA_VOLUNTARIA]: "Baja voluntaria",
  [ORIGENES_REEMPLAZO.ELIMINACION]: "Eliminación",
};

const ETIQUETAS_NIVEL_UBICACION = {
  [NIVELES_UBICACION_REEMPLAZO.MISMA_CIUDAD]: "Misma ciudad",
  [NIVELES_UBICACION_REEMPLAZO.MISMA_PROVINCIA]: "Misma provincia",
  [NIVELES_UBICACION_REEMPLAZO.OTRA]: "Otra ubicación",
};

const ETIQUETAS_DISPONIBILIDAD = {
  [TIPOS_DISPONIBILIDAD_REEMPLAZO.EXACTA]: "Disponible",
  [TIPOS_DISPONIBILIDAD_REEMPLAZO.CON_REPROGRAMACION]:
    "Requiere reprogramación",
  [TIPOS_DISPONIBILIDAD_REEMPLAZO.NO_APLICA]: "No aplica",
  [TIPOS_DISPONIBILIDAD_REEMPLAZO.NO_DISPONIBLE]: "Sin disponibilidad",
};

export const CODIGOS_ERROR_REEMPLAZO = {
  REEMPLAZO_NO_ENCONTRADO: "REEMPLAZO_NO_ENCONTRADO",
  CANDIDATO_REEMPLAZO_NO_ENCONTRADO: "CANDIDATO_REEMPLAZO_NO_ENCONTRADO",
  REEMPLAZO_NO_PENDIENTE_CONFIRMACION: "REEMPLAZO_NO_PENDIENTE_CONFIRMACION",
  REEMPLAZO_CON_CANDIDATOS: "REEMPLAZO_CON_CANDIDATOS",
  PROYECTO_NO_CONFIRMADO: "PROYECTO_NO_CONFIRMADO",
  ACTIVIDAD_NO_GESTIONABLE: "ACTIVIDAD_NO_GESTIONABLE",
  REQUERIMIENTO_NO_ACTIVO: "REQUERIMIENTO_NO_ACTIVO",
  VACANTE_YA_CUBIERTA: "VACANTE_YA_CUBIERTA",
  CANDIDATO_NO_DISPONIBLE_PARA_INVITAR:
    "CANDIDATO_NO_DISPONIBLE_PARA_INVITAR",
  CANDIDATO_INACTIVO: "CANDIDATO_INACTIVO",
  CANDIDATO_YA_ES_MIEMBRO: "CANDIDATO_YA_ES_MIEMBRO",
  CANDIDATO_CON_INVITACION_ACTIVA: "CANDIDATO_CON_INVITACION_ACTIVA",
  CANDIDATO_SIN_DISPONIBILIDAD: "CANDIDATO_SIN_DISPONIBILIDAD",
  INCORPORACION_NO_PENDIENTE: "INCORPORACION_NO_PENDIENTE",
  CANDIDATO_YA_ASIGNADO: "CANDIDATO_YA_ASIGNADO",
  INVITACION_NO_PERTENECE_AL_PERFIL: "INVITACION_NO_PERTENECE_AL_PERFIL",
  INVITACION_NO_PENDIENTE: "INVITACION_NO_PENDIENTE",
  REEMPLAZO_CON_CANDIDATO_PENDIENTE: "REEMPLAZO_CON_CANDIDATO_PENDIENTE",
  REEMPLAZO_NO_ADMITE_RESPUESTAS: "REEMPLAZO_NO_ADMITE_RESPUESTAS",
  CONTENT_TYPE_NO_SOPORTADO: "CONTENT_TYPE_NO_SOPORTADO",
  CUENTA_PENDIENTE_BAJA: "CUENTA_PENDIENTE_BAJA",
};

export const TIPOS_ERROR_REEMPLAZO = {
  SESION: "sesion",
  CUENTA: "cuenta",
  PERFIL_ACTIVO: "perfil-activo",
  PERFIL_NO_ENCONTRADO: "perfil-no-encontrado",
  PROYECTO_NO_ENCONTRADO: "proyecto-no-encontrado",
  PERMISO: "permiso",
  NO_ENCONTRADO: "no-encontrado",
  CONFLICTO: "conflicto",
  VALIDACION: "validacion",
  SERVIDOR: "servidor",
  GENERICO: "generico",
};

/**
 * Etiqueta legible de un estado de proceso.
 * @param {string|null|undefined} estado
 * @returns {string}
 */
export function etiquetaEstadoReemplazo(estado) {
  return ETIQUETAS_ESTADO_REEMPLAZO[estado] || estado || "—";
}

/**
 * Tono visual de un estado de proceso.
 * @param {string|null|undefined} estado
 * @returns {"warning"|"info"|"success"|"danger"|"neutral"}
 */
export function tonoEstadoReemplazo(estado) {
  return TONOS_ESTADO_REEMPLAZO[estado] || "neutral";
}

/**
 * Etiqueta legible de un estado de candidato.
 * @param {string|null|undefined} estado
 * @returns {string}
 */
export function etiquetaEstadoCandidatoReemplazo(estado) {
  return ETIQUETAS_ESTADO_CANDIDATO[estado] || estado || "—";
}

/**
 * Tono visual de un estado de candidato.
 * @param {string|null|undefined} estado
 * @returns {"warning"|"info"|"success"|"danger"|"neutral"}
 */
export function tonoEstadoCandidatoReemplazo(estado) {
  return TONOS_ESTADO_CANDIDATO[estado] || "neutral";
}

export function etiquetaTipoReemplazo(tipo) {
  return ETIQUETAS_TIPO[tipo] || tipo || "—";
}

export function etiquetaOrigenReemplazo(origen) {
  return ETIQUETAS_ORIGEN[origen] || origen || "—";
}

export function etiquetaNivelUbicacion(nivel) {
  return ETIQUETAS_NIVEL_UBICACION[nivel] || "—";
}

export function etiquetaDisponibilidad(tipo) {
  return ETIQUETAS_DISPONIBILIDAD[tipo] || "—";
}

/**
 * Texto principal de la vacante: nombre de actividad o profesión.
 * @param {object|null|undefined} reemplazo
 * @returns {string}
 */
export function descripcionVacante(reemplazo) {
  if (!reemplazo) return "—";
  if (reemplazo.tipo === TIPOS_REEMPLAZO.ACTIVIDAD) {
    return reemplazo.nombreActividad || "Actividad";
  }
  return reemplazo.profesion || "Requerimiento general";
}

/**
 * Texto secundario de la vacante.
 * @param {object|null|undefined} reemplazo
 * @returns {string}
 */
export function detalleVacante(reemplazo) {
  if (!reemplazo) return "";
  if (reemplazo.tipo === TIPOS_REEMPLAZO.ACTIVIDAD) {
    return reemplazo.profesion
      ? `Profesión: ${reemplazo.profesion}`
      : "Actividad del proyecto";
  }
  return "Requerimiento general del proyecto";
}

/**
 * Texto principal de una invitación de reemplazo.
 * @param {object|null|undefined} invitacion
 * @returns {string}
 */
export function descripcionInvitacionReemplazo(invitacion) {
  if (!invitacion) return "—";
  if (invitacion.tipo === TIPOS_REEMPLAZO.ACTIVIDAD) {
    return invitacion.nombreActividad || "Actividad";
  }
  return invitacion.profesion || "Requerimiento general";
}

export function esEstadoReemplazoFinal(estado) {
  return ESTADOS_REEMPLAZO_FINALES.includes(estado);
}

export function puedeConfirmarReemplazo(estado) {
  return estado === ESTADOS_REEMPLAZO.PENDIENTE_CONFIRMACION_DIRECTOR;
}

export function puedeRegenerarReemplazo(estado) {
  return estado === ESTADOS_REEMPLAZO.SIN_CANDIDATOS;
}

export function puedeCancelarReemplazo(estado) {
  return !!estado && !esEstadoReemplazoFinal(estado);
}

export function puedeAprobarCandidatoReemplazo(
  estadoReemplazo,
  estadoCandidato
) {
  return (
    estadoReemplazo === ESTADOS_REEMPLAZO.PENDIENTE_APROBACION &&
    estadoCandidato ===
      ESTADOS_CANDIDATO_REEMPLAZO.ACEPTADO_PENDIENTE_APROBACION
  );
}

export function puedeGestionarInvitacionReemplazo(invitacion) {
  return invitacion?.estado === ESTADOS_CANDIDATO_REEMPLAZO.INVITADO;
}

/**
 * Resumen del listado de procesos para el badge del director.
 * @param {object[]|null|undefined} reemplazos
 * @returns {{pendienteConfirmacion:number, pendienteAprobacion:number,
 *            sinCandidatos:number, invitacionesEnviadas:number,
 *            totalAccionesPendientes:number}}
 */
export function calcularResumenReemplazos(reemplazos) {
  const resumen = {
    pendienteConfirmacion: 0,
    pendienteAprobacion: 0,
    sinCandidatos: 0,
    invitacionesEnviadas: 0,
    totalAccionesPendientes: 0,
  };

  const lista = Array.isArray(reemplazos) ? reemplazos : [];
  lista.forEach((reemplazo) => {
    switch (reemplazo?.estado) {
      case ESTADOS_REEMPLAZO.PENDIENTE_CONFIRMACION_DIRECTOR:
        resumen.pendienteConfirmacion += 1;
        break;
      case ESTADOS_REEMPLAZO.PENDIENTE_APROBACION:
        resumen.pendienteAprobacion += 1;
        break;
      case ESTADOS_REEMPLAZO.SIN_CANDIDATOS:
        resumen.sinCandidatos += 1;
        break;
      case ESTADOS_REEMPLAZO.INVITACIONES_ENVIADAS:
        resumen.invitacionesEnviadas += 1;
        break;
      default:
        break;
    }
  });

  resumen.totalAccionesPendientes =
    resumen.pendienteConfirmacion + resumen.pendienteAprobacion;
  return resumen;
}

/**
 * Normaliza un motivo/mensaje opcional: trim y null si queda vacío.
 * El máximo se valida en el modal; el backend también lo valida.
 * @param {unknown} valor
 * @returns {string|null}
 */
export function normalizarTextoReemplazo(valor) {
  const texto = String(valor ?? "").trim();
  return texto || null;
}

/**
 * Formatea el puntaje de concordancia (0–100).
 * @param {number|string|null|undefined} valor
 * @returns {string}
 */
export function formatearPuntajeReemplazo(valor) {
  if (valor == null || valor === "") return "—";
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return "—";
  return `${numero.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} / 100`;
}

/**
 * Etiqueta de una característica del candidato.
 * @param {object|null|undefined} caracteristica
 * @returns {string}
 */
export function etiquetaCaracteristicaReemplazo(caracteristica) {
  const codigo = normCodigo(caracteristica?.codigo);
  return (
    ETIQUETAS_CARAC[codigo] ||
    caracteristica?.codigo ||
    "Característica"
  );
}

/**
 * Valor visible de una característica del candidato.
 * @param {object|null|undefined} caracteristica
 * @returns {string}
 */
export function valorCaracteristicaReemplazo(caracteristica) {
  return (
    caracteristica?.valor ||
    caracteristica?.codigoValor ||
    "—"
  );
}

/**
 * Clasifica un error Axios del módulo de reemplazo.
 * @param {object} error
 * @returns {{tipo:string, codigo:string|null, mensaje:string}}
 */
export function clasificarErrorReemplazo(error) {
  const status = error?.response?.status;
  const data = error?.response?.data || {};
  const codigo = data?.codigo || null;
  const mensaje = data?.message || "";

  if (error?._esSesionExpirada || status === 401) {
    return { tipo: TIPOS_ERROR_REEMPLAZO.SESION, codigo, mensaje };
  }

  if (
    error?._esCuentaNoActiva ||
    codigo === CODIGOS_ERROR_REEMPLAZO.CUENTA_PENDIENTE_BAJA
  ) {
    return { tipo: TIPOS_ERROR_REEMPLAZO.CUENTA, codigo, mensaje };
  }

  if (status === 400) {
    return { tipo: TIPOS_ERROR_REEMPLAZO.VALIDACION, codigo, mensaje };
  }

  if (status === 415) {
    return {
      tipo: TIPOS_ERROR_REEMPLAZO.VALIDACION,
      codigo: codigo || CODIGOS_ERROR_REEMPLAZO.CONTENT_TYPE_NO_SOPORTADO,
      mensaje:
        mensaje ||
        "El contenido enviado no es compatible con esta operación. Actualizá la página e intentá nuevamente.",
    };
  }

  if (status === 403) {
    return { tipo: TIPOS_ERROR_REEMPLAZO.PERMISO, codigo, mensaje };
  }

  if (status === 404) {
    if (/perfil\s*activo/i.test(mensaje)) {
      return { tipo: TIPOS_ERROR_REEMPLAZO.PERFIL_ACTIVO, codigo, mensaje };
    }
    if (/perfil/i.test(mensaje)) {
      return {
        tipo: TIPOS_ERROR_REEMPLAZO.PERFIL_NO_ENCONTRADO,
        codigo,
        mensaje,
      };
    }
    if (/proyecto/i.test(mensaje)) {
      return {
        tipo: TIPOS_ERROR_REEMPLAZO.PROYECTO_NO_ENCONTRADO,
        codigo,
        mensaje,
      };
    }
    return { tipo: TIPOS_ERROR_REEMPLAZO.NO_ENCONTRADO, codigo, mensaje };
  }

  if (status === 409) {
    if (/^el perfil no se encuentra activo\.?$/i.test(mensaje)) {
      return {
        tipo: TIPOS_ERROR_REEMPLAZO.PERFIL_NO_ENCONTRADO,
        codigo,
        mensaje,
      };
    }
    return { tipo: TIPOS_ERROR_REEMPLAZO.CONFLICTO, codigo, mensaje };
  }

  if (!status || status >= 500) {
    return { tipo: TIPOS_ERROR_REEMPLAZO.SERVIDOR, codigo, mensaje };
  }

  return { tipo: TIPOS_ERROR_REEMPLAZO.GENERICO, codigo, mensaje };
}
