import {
  ESTADOS_ACTIVIDAD,
  etiquetaEstadoActividad,
  normalizarEstadoActividad,
} from "./actividadConstants.js";
import {
  ESTADOS_PROYECTO,
  ROLES_PROYECTO,
  normalizarEstadoProyecto,
} from "./proyectoConstants.js";
import {
  RESULTADOS_PREFERENCIA,
  formatearDesvioMinutos,
} from "./disponibilidadConstants.js";

/*
 * Reglas y textos de UC-70 (ficha técnica `ficha-tecnica-asignar-actividad.md`).
 *
 * El backend es la fuente de verdad:
 * - la asignación se crea sólo con `POST .../asignaciones`;
 * - `idRequerimientoActividad` puede ser null (director o sin coincidencia);
 * - `provisional = true` no es un error;
 * - la disponibilidad y el cupo los calcula el sistema.
 *
 * El frontend sólo decide qué mostrar y qué habilitar.
 */

export const PERMISO_ASIGNAR_ACTIVIDAD = "ASIGNAR_ACTIVIDAD";

export const ESTADOS_PROYECTO_ASIGNABLES = [
  ESTADOS_PROYECTO.BORRADOR,
  ESTADOS_PROYECTO.PUBLICADO,
  ESTADOS_PROYECTO.CONFIRMADO,
];

export const ESTADOS_ACTIVIDAD_NO_ASIGNABLES = [
  ESTADOS_ACTIVIDAD.CANCELADA,
  ESTADOS_ACTIVIDAD.FINALIZADA,
];

export const TIPOS_ERROR_ASIGNACION = {
  SESION: "SESION",
  CUENTA: "CUENTA",
  CSRF: "CSRF",
  SIN_PERMISO: "SIN_PERMISO",
  PERFIL_INVALIDO: "PERFIL_INVALIDO",
  VALIDACION: "VALIDACION",
  SIN_FECHA_ENTREGA: "SIN_FECHA_ENTREGA",
  PERFIL_ACTIVO_NO_ENCONTRADO: "PERFIL_ACTIVO_NO_ENCONTRADO",
  PERFIL_NO_ENCONTRADO: "PERFIL_NO_ENCONTRADO",
  PROYECTO_NO_ENCONTRADO: "PROYECTO_NO_ENCONTRADO",
  RECURSO_NO_ENCONTRADO: "RECURSO_NO_ENCONTRADO",
  MIEMBRO_INACTIVO: "MIEMBRO_INACTIVO",
  PERFIL_INACTIVO: "PERFIL_INACTIVO",
  DUPLICADO: "DUPLICADO",
  ESTADO_INVALIDO: "ESTADO_INVALIDO",
  SIN_AGENDA: "SIN_AGENDA",
  SIN_DISPONIBILIDAD: "SIN_DISPONIBILIDAD",
  CONFLICTO: "CONFLICTO",
  DESCONOCIDO: "DESCONOCIDO",
};

export const TEXTOS_ASIGNACION = {
  SIN_PERMISO:
    "No tenés permiso para asignar miembros a actividades en este proyecto.",
  SIN_FECHA_ENTREGA:
    "El proyecto no tiene fecha de entrega. Definila antes de asignar una actividad.",
  SIN_DIRECTOR: "Sólo el director activo del proyecto puede asignar miembros.",
  SIN_MIEMBRO: "Seleccioná un miembro activo del proyecto.",
  SIN_DISPONIBILIDAD:
    "El miembro no tiene disponibilidad suficiente dentro del rango factible de la actividad.",
  DUPLICADO: "El miembro ya está asignado a esta actividad.",
  MIEMBRO_INACTIVO: "El perfil no es miembro activo del proyecto.",
  PERFIL_INACTIVO: "El usuario del miembro no se encuentra activo.",
  SIN_AGENDA:
    "El miembro no tiene agenda configurada para verificar disponibilidad.",
  ERROR_GENERICO: "No se pudo asignar la actividad.",
};

/**
 * ¿El proyecto y la actividad admiten una asignación directa?
 *
 * `actividad` puede omitirse para evaluar sólo el contexto del proyecto (por
 * ejemplo, para habilitar la acción en la tabla). El estado de la actividad se
 * evalúa cuando se pasa una.
 *
 * @param {{
 *   proyecto?: object|null,
 *   actividad?: object|null,
 *   tieneFechaEntrega?: boolean
 * }} [contexto]
 * @returns {boolean}
 */
export function puedeAsignarActividad({
  proyecto = null,
  actividad = null,
  tieneFechaEntrega,
} = {}) {
  if (!proyecto) return false;
  if (proyecto.rolUsuario !== ROLES_PROYECTO.DIRECTOR) return false;

  const permisos = Array.isArray(proyecto.permisos) ? proyecto.permisos : [];
  if (!permisos.includes(PERMISO_ASIGNAR_ACTIVIDAD)) return false;

  const estadoProyecto = normalizarEstadoProyecto(proyecto.estado);
  if (!ESTADOS_PROYECTO_ASIGNABLES.includes(estadoProyecto)) return false;

  if (
    actividad &&
    ESTADOS_ACTIVIDAD_NO_ASIGNABLES.includes(
      normalizarEstadoActividad(actividad.estado)
    )
  ) {
    return false;
  }

  const hayFecha =
    typeof tieneFechaEntrega === "boolean"
      ? tieneFechaEntrega
      : !!proyecto.fechaEntregaEstipulada;
  return hayFecha;
}

/**
 * Motivo por el que la acción está deshabilitada. Vacío si se puede asignar.
 * @param {{proyecto?: object|null, actividad?: object|null, tieneFechaEntrega?: boolean}} [contexto]
 * @returns {string}
 */
export function motivoNoAsignable({
  proyecto = null,
  actividad = null,
  tieneFechaEntrega,
} = {}) {
  if (puedeAsignarActividad({ proyecto, actividad, tieneFechaEntrega })) {
    return "";
  }
  if (!proyecto) return "No se pudo cargar el proyecto.";

  if (proyecto.rolUsuario !== ROLES_PROYECTO.DIRECTOR) {
    return TEXTOS_ASIGNACION.SIN_DIRECTOR;
  }

  const permisos = Array.isArray(proyecto.permisos) ? proyecto.permisos : [];
  if (!permisos.includes(PERMISO_ASIGNAR_ACTIVIDAD)) {
    return TEXTOS_ASIGNACION.SIN_PERMISO;
  }

  const estadoProyecto = normalizarEstadoProyecto(proyecto.estado);
  if (!ESTADOS_PROYECTO_ASIGNABLES.includes(estadoProyecto)) {
    return `El proyecto está ${estadoProyecto.toLowerCase()} y no admite asignaciones.`;
  }

  if (actividad) {
    const estadoActividad = normalizarEstadoActividad(actividad.estado);
    if (ESTADOS_ACTIVIDAD_NO_ASIGNABLES.includes(estadoActividad)) {
      return `La actividad está ${etiquetaEstadoActividad(estadoActividad).toLowerCase()} y no se puede asignar.`;
    }
  }

  const hayFecha =
    typeof tieneFechaEntrega === "boolean"
      ? tieneFechaEntrega
      : !!proyecto.fechaEntregaEstipulada;
  if (!hayFecha) return TEXTOS_ASIGNACION.SIN_FECHA_ENTREGA;

  return "No se puede asignar la actividad.";
}

/**
 * Perfiles ya vinculados a la actividad, sin duplicados. Acepta tanto el shape
 * de Planificación (`responsables`) como el detalle (`profesionalesAsignados`).
 * @param {object|null|undefined} actividad
 * @returns {Array<number|string>}
 */
export function perfilesAsignadosDe(actividad) {
  const ids = [];
  const agregar = (elemento) => {
    const id = elemento?.idPerfil;
    if (id == null || id === "") return;
    if (ids.some((existente) => String(existente) === String(id))) return;
    ids.push(id);
  };

  const responsables = Array.isArray(actividad?.responsables)
    ? actividad.responsables
    : [];
  const profesionales = Array.isArray(actividad?.profesionalesAsignados)
    ? actividad.profesionalesAsignados
    : [];

  responsables.forEach(agregar);
  profesionales.forEach(agregar);
  return ids;
}

/**
 * @param {object|null|undefined} actividad
 * @param {number|string|null|undefined} idPerfil
 * @returns {boolean}
 */
export function estaPerfilAsignado(actividad, idPerfil) {
  if (idPerfil == null || idPerfil === "") return false;
  return perfilesAsignadosDe(actividad).some(
    (id) => String(id) === String(idPerfil)
  );
}

/**
 * Normaliza la respuesta del POST con defaults seguros.
 * @param {object|null|undefined} data
 * @returns {{
 *   idAsignacionActividad: number|null,
 *   idProyecto: number|null,
 *   idActividad: number|null,
 *   idMiembro: number|null,
 *   idPerfil: number|null,
 *   idUsuario: number|null,
 *   idRequerimientoActividad: number|null,
 *   requerimientoSatisfecho: boolean,
 *   provisional: boolean,
 *   inicioSeleccionado: string|null,
 *   finSeleccionado: string|null,
 *   resultadoPreferencia: string|null,
 *   desvioMinutos: number|null
 * }}
 */
export function normalizarAsignacion(data) {
  const asignacion = data && typeof data === "object" ? data : {};
  return {
    idAsignacionActividad: asignacion.idAsignacionActividad ?? null,
    idProyecto: asignacion.idProyecto ?? null,
    idActividad: asignacion.idActividad ?? null,
    idMiembro: asignacion.idMiembro ?? null,
    idPerfil: asignacion.idPerfil ?? null,
    idUsuario: asignacion.idUsuario ?? null,
    idRequerimientoActividad: asignacion.idRequerimientoActividad ?? null,
    requerimientoSatisfecho: asignacion.requerimientoSatisfecho === true,
    provisional: asignacion.provisional === true,
    inicioSeleccionado: asignacion.inicioSeleccionado ?? null,
    finSeleccionado: asignacion.finSeleccionado ?? null,
    resultadoPreferencia: asignacion.resultadoPreferencia ?? null,
    desvioMinutos: asignacion.desvioMinutos ?? null,
  };
}

/**
 * Clasifica el error del POST para que la vista decida si mantiene el modal
 * abierto, refresca listados o vuelve a consultar disponibilidad.
 *
 * No usa una lista cerrada de motivos: la presencia de `motivo` o
 * `inicioEvaluado` identifica el 409 de disponibilidad.
 *
 * @param {object} error error Axios
 * @returns {{
 *   tipo: string,
 *   status: number|null,
 *   mensaje: string,
 *   mensajeCampo: string,
 *   motivo: string|null,
 *   provisional: boolean,
 *   inicioEvaluado: string|null,
 *   finEvaluado: string|null,
 *   miembrosBloqueantes: Array<number|string>,
 *   erroresCampo: Record<string, string>
 * }}
 */
export function clasificarErrorAsignacion(error) {
  const status = error?.response?.status ?? null;
  const data = error?.response?.data;
  const payload = data && typeof data === "object" ? data : {};
  const mensajeBackend =
    typeof payload.message === "string" ? payload.message.trim() : "";
  const erroresCampo =
    payload.errores && typeof payload.errores === "object"
      ? payload.errores
      : {};
  const mensajeCampo =
    typeof erroresCampo.idPerfil === "string"
      ? erroresCampo.idPerfil.trim()
      : "";

  const base = {
    status,
    mensaje: mensajeBackend,
    mensajeCampo,
    motivo: payload.motivo ?? null,
    provisional: payload.provisional === true,
    inicioEvaluado: payload.inicioEvaluado ?? null,
    finEvaluado: payload.finEvaluado ?? null,
    miembrosBloqueantes: Array.isArray(payload.miembrosBloqueantes)
      ? payload.miembrosBloqueantes
      : [],
    erroresCampo,
  };

  const crear = (tipo, mensaje) => ({
    ...base,
    tipo,
    mensaje: mensaje || mensajeBackend || TEXTOS_ASIGNACION.ERROR_GENERICO,
  });

  if (error?._esSesionExpirada) {
    return crear(
      TIPOS_ERROR_ASIGNACION.SESION,
      "Tu sesión expiró. Volvé a iniciar sesión."
    );
  }

  if (error?._esCuentaNoActiva || status === 401) {
    return crear(
      TIPOS_ERROR_ASIGNACION.CUENTA,
      mensajeBackend || "Tu cuenta no se encuentra activa."
    );
  }

  if (
    error?._esCsrf &&
    !/permiso|no ten[eé]s|acceso denegado|prohibido/i.test(mensajeBackend)
  ) {
    return crear(
      TIPOS_ERROR_ASIGNACION.CSRF,
      "No se pudo completar la asignación. Recargá la página e intentá nuevamente."
    );
  }

  if (status === 400) {
    if (mensajeCampo) {
      return crear(TIPOS_ERROR_ASIGNACION.PERFIL_INVALIDO, mensajeCampo);
    }
    if (/fecha.*entrega|FechaEntrega|fecha de entrega/i.test(mensajeBackend)) {
      return crear(
        TIPOS_ERROR_ASIGNACION.SIN_FECHA_ENTREGA,
        mensajeBackend || TEXTOS_ASIGNACION.SIN_FECHA_ENTREGA
      );
    }
    return crear(
      TIPOS_ERROR_ASIGNACION.VALIDACION,
      mensajeBackend || "Revisá los datos de la asignación."
    );
  }

  if (status === 403) {
    return crear(
      TIPOS_ERROR_ASIGNACION.SIN_PERMISO,
      mensajeBackend || TEXTOS_ASIGNACION.SIN_PERMISO
    );
  }

  if (status === 404) {
    if (/perfil\s*activo|no hay un perfil activo|perfil activo no seleccionado/i.test(mensajeBackend)) {
      return crear(
        TIPOS_ERROR_ASIGNACION.PERFIL_ACTIVO_NO_ENCONTRADO,
        mensajeBackend || "No hay un perfil activo seleccionado."
      );
    }
    if (/perfil/i.test(mensajeBackend)) {
      return crear(
        TIPOS_ERROR_ASIGNACION.PERFIL_NO_ENCONTRADO,
        mensajeBackend || "El perfil ya no está disponible."
      );
    }
    if (/proyecto/i.test(mensajeBackend)) {
      return crear(
        TIPOS_ERROR_ASIGNACION.PROYECTO_NO_ENCONTRADO,
        mensajeBackend || "El proyecto ya no está disponible."
      );
    }
    return crear(
      TIPOS_ERROR_ASIGNACION.RECURSO_NO_ENCONTRADO,
      mensajeBackend || "La actividad o el perfil ya no están disponibles."
    );
  }

  if (status === 409) {
    if (/agenda/i.test(mensajeBackend)) {
      return crear(
        TIPOS_ERROR_ASIGNACION.SIN_AGENDA,
        mensajeBackend || TEXTOS_ASIGNACION.SIN_AGENDA
      );
    }

    if (/ya\s+est\S*\s+asignado|ya existe una asignaci[oó]n|duplicad/i.test(mensajeBackend)) {
      return crear(
        TIPOS_ERROR_ASIGNACION.DUPLICADO,
        mensajeBackend || TEXTOS_ASIGNACION.DUPLICADO
      );
    }

    if (/no es miembro activo/i.test(mensajeBackend)) {
      return crear(
        TIPOS_ERROR_ASIGNACION.MIEMBRO_INACTIVO,
        mensajeBackend || TEXTOS_ASIGNACION.MIEMBRO_INACTIVO
      );
    }

    if (
      /usuario del miembro.*activo|perfil.*inactiv|miembro.*inactiv/i.test(
        mensajeBackend
      )
    ) {
      return crear(
        TIPOS_ERROR_ASIGNACION.PERFIL_INACTIVO,
        mensajeBackend || TEXTOS_ASIGNACION.PERFIL_INACTIVO
      );
    }

    if (
      payload.motivo != null ||
      payload.inicioEvaluado != null ||
      /disponibilidad suficiente|sin disponibilidad|sin hueco|hueco com[uú]n|tolerancia/i.test(
        mensajeBackend
      )
    ) {
      return crear(
        TIPOS_ERROR_ASIGNACION.SIN_DISPONIBILIDAD,
        mensajeBackend || TEXTOS_ASIGNACION.SIN_DISPONIBILIDAD
      );
    }

    if (
      /estado|no admite|no permite|no se puede asignar|borrador|publicado|confirmado|cancelad|finalizad/i.test(
        mensajeBackend
      )
    ) {
      return crear(
        TIPOS_ERROR_ASIGNACION.ESTADO_INVALIDO,
        mensajeBackend || "El proyecto o la actividad no admiten asignaciones."
      );
    }

    return crear(
      TIPOS_ERROR_ASIGNACION.CONFLICTO,
      mensajeBackend || TEXTOS_ASIGNACION.ERROR_GENERICO
    );
  }

  if (!status || status >= 500) {
    return crear(
      TIPOS_ERROR_ASIGNACION.DESCONOCIDO,
      "Ocurrió un error al asignar la actividad. Inténtalo nuevamente."
    );
  }

  return crear(TIPOS_ERROR_ASIGNACION.DESCONOCIDO, mensajeBackend);
}

/**
 * Texto del toast de éxito. Incluye los resultados que el director debe
 * conocer: requerimiento cubierto, asignación provisional y ajuste horario.
 * @param {object|null|undefined} data respuesta del POST
 * @param {{nombreArtistico?: string}|null|undefined} miembro
 * @param {{nombre?: string}|null|undefined} actividad
 * @returns {string}
 */
export function mensajeExitoAsignacion(data, miembro, actividad) {
  const asignacion = normalizarAsignacion(data);
  const nombreActividad = String(actividad?.nombre || "").trim();
  const nombreMiembro =
    String(miembro?.nombreArtistico || "").trim() ||
    (asignacion.idPerfil != null
      ? `el perfil #${asignacion.idPerfil}`
      : "el miembro seleccionado");

  const partes = [
    nombreActividad
      ? `Actividad "${nombreActividad}" asignada a ${nombreMiembro}.`
      : `Actividad asignada a ${nombreMiembro}.`,
  ];

  if (asignacion.requerimientoSatisfecho) {
    partes.push("El requerimiento quedó cubierto.");
  } else if (asignacion.idRequerimientoActividad == null) {
    partes.push("No se vinculó un requerimiento.");
  }

  if (asignacion.resultadoPreferencia === RESULTADOS_PREFERENCIA.DESVIO) {
    const ajuste = formatearDesvioMinutos(asignacion.desvioMinutos);
    if (ajuste) partes.push(`Horario con ajuste: ${ajuste}.`);
  } else if (asignacion.resultadoPreferencia === RESULTADOS_PREFERENCIA.EXACTO) {
    partes.push("Se respetó el horario preferido.");
  }

  if (asignacion.provisional) {
    partes.push(
      "La disponibilidad se validó de forma provisional; se revalidará al confirmar el proyecto."
    );
  }

  return partes.join(" ");
}
