import {
  esCuentaNoActiva,
  esSesionExpirada,
  mensajeErrorApi,
} from "./apiError.js";
import { normalizarBloqueos } from "./confirmacionConstants.js";

/*
 * Utilidades de UC-61: reprogramación automática de proyectos confirmados y
 * reintento manual.
 *
 * El backend es la fuente de verdad. El frontend sólo normaliza la respuesta,
 * muestra el resumen y refresca las vistas; no recalcula horarios ni márgenes.
 */

export const TIPOS_ERROR_REPROGRAMACION = {
  SESION: "SESION",
  CUENTA: "CUENTA",
  PERMISO: "PERMISO",
  NO_ENCONTRADO: "NO_ENCONTRADO",
  BLOQUEO: "BLOQUEO",
  DESCONOCIDO: "DESCONOCIDO",
};

/**
 * Normaliza un bloqueo de reprogramación. Acepta `entidad`/`idEntidad` y los
 * alias `entidadTipo`/`entidadId` que devuelve el flujo de confirmación.
 * @param {object|null|undefined} bloqueo
 * @returns {{codigo: string, mensaje: string, entidad: string|null, idEntidad: number|null}}
 */
export function normalizarBloqueoReprogramacion(bloqueo) {
  if (typeof bloqueo === "string") {
    return {
      codigo: "",
      mensaje: bloqueo.trim(),
      entidad: null,
      idEntidad: null,
    };
  }

  const normalizado = normalizarBloqueos([bloqueo])[0];
  if (!normalizado) {
    return { codigo: "", mensaje: "", entidad: null, idEntidad: null };
  }
  return {
    codigo: normalizado.codigo,
    mensaje: normalizado.mensaje,
    entidad: normalizado.entidadTipo,
    idEntidad: normalizado.entidadId,
  };
}

/**
 * @param {unknown} lista
 * @returns {Array<{codigo:string, mensaje:string, entidad:string|null, idEntidad:number|null}>}
 */
export function normalizarBloqueosReprogramacion(lista) {
  if (!Array.isArray(lista)) return [];
  return lista
    .map(normalizarBloqueoReprogramacion)
    .filter((bloqueo) => bloqueo.mensaje || bloqueo.codigo);
}

/**
 * @param {unknown} actividad
 * @returns {{idActividad:number|null, nombre:string, estado:string, inicioAnterior:string|null, inicioNuevo:string|null}}
 */
export function normalizarActividadReprogramada(actividad) {
  const dato = actividad && typeof actividad === "object" ? actividad : {};
  const id = Number(dato.idActividad);
  return {
    idActividad: Number.isFinite(id) ? id : null,
    nombre: String(dato.nombre || "").trim(),
    estado: String(dato.estado || "").trim(),
    inicioAnterior: dato.inicioAnterior ?? null,
    inicioNuevo: dato.inicioNuevo ?? null,
  };
}

/**
 * @param {unknown} exito
 * @returns {object|null}
 */
export function normalizarExitoReprogramacion(exito) {
  const dato = exito && typeof exito === "object" ? exito : {};
  const id = Number(dato.idProyecto);
  if (!Number.isFinite(id) || id <= 0) return null;

  return {
    idProyecto: id,
    nombreProyecto: String(dato.nombreProyecto || "").trim(),
    motivo: String(dato.motivo || "").trim(),
    fechaEntrega: dato.fechaEntrega ?? null,
    actividades: Array.isArray(dato.actividades)
      ? dato.actividades.map(normalizarActividadReprogramada)
      : [],
    conflictosFijos: normalizarBloqueosReprogramacion(dato.conflictosFijos),
  };
}

/**
 * @param {unknown} fallido
 * @returns {object|null}
 */
export function normalizarFallidoReprogramacion(fallido) {
  const dato = fallido && typeof fallido === "object" ? fallido : {};
  const id = Number(dato.idProyecto);
  if (!Number.isFinite(id) || id <= 0) return null;

  return {
    idProyecto: id,
    nombreProyecto: String(dato.nombreProyecto || "").trim(),
    codigo: String(dato.codigo || "").trim(),
    mensaje: String(dato.mensaje || dato.message || "").trim(),
    bloqueos: normalizarBloqueosReprogramacion(dato.bloqueos),
  };
}

/**
 * Normaliza `reprogramacion` de `PUT /calendario/jornada`. Devuelve `null`
 * cuando el backend no envía el campo (compatibilidad con versiones viejas).
 * @param {unknown} data
 * @returns {{totalProyectos:number, exitosos:object[], fallidos:object[]}|null}
 */
export function normalizarReprogramacion(data) {
  if (!data || typeof data !== "object") return null;

  const exitosos = Array.isArray(data.exitosos)
    ? data.exitosos.map(normalizarExitoReprogramacion).filter(Boolean)
    : [];
  const fallidos = Array.isArray(data.fallidos)
    ? data.fallidos.map(normalizarFallidoReprogramacion).filter(Boolean)
    : [];
  const total = Number(data.totalProyectos);

  return {
    totalProyectos:
      data.totalProyectos != null && data.totalProyectos !== "" && Number.isFinite(total)
        ? total
        : exitosos.length + fallidos.length,
    exitosos,
    fallidos,
  };
}

/**
 * @param {object|null|undefined} exito
 * @returns {number}
 */
export function cantidadActividadesMovidas(exito) {
  return Array.isArray(exito?.actividades) ? exito.actividades.length : 0;
}

/**
 * @param {{totalProyectos:number, exitosos:object[], fallidos:object[]}|null} reprogramacion
 * @returns {string}
 */
export function mensajeResumenJornada(reprogramacion) {
  if (
    !reprogramacion ||
    (reprogramacion.totalProyectos <= 0 &&
      !reprogramacion.exitosos?.length &&
      !reprogramacion.fallidos?.length)
  ) {
    return "Jornada actualizada. No hubo proyectos confirmados afectados.";
  }

  const exitosos = reprogramacion.exitosos.length;
  const fallidos = reprogramacion.fallidos.length;

  if (fallidos === 0) {
    return exitosos === 1
      ? "Jornada actualizada. Se reprogramó 1 proyecto."
      : `Jornada actualizada. Se reprogramaron ${exitosos} proyectos.`;
  }

  if (exitosos === 0) {
    return "Jornada actualizada. Ningún proyecto pudo reprogramarse.";
  }

  const exitososTexto =
    exitosos === 1
      ? "Se reprogramó 1 proyecto"
      : `Se reprogramaron ${exitosos} proyectos`;
  const fallidosTexto =
    fallidos === 1
      ? "1 no pudo reprogramarse"
      : `${fallidos} no pudieron reprogramarse`;

  return `Jornada actualizada. ${exitososTexto} y ${fallidosTexto}.`;
}

/**
 * Clasifica el error de `POST /proyectos/{idProyecto}/reprogramar`.
 * @param {object} error error Axios
 * @returns {{tipo:string, status:number|null, codigo:string, mensaje:string, bloqueos:object[]}}
 */
export function clasificarErrorReintento(error) {
  const status = error?.response?.status ?? null;
  const data = error?.response?.data;
  const payload = data && typeof data === "object" ? data : {};
  const mensajeBackend =
    typeof payload.message === "string" ? payload.message.trim() : "";
  const codigo = payload.codigo ? String(payload.codigo) : "";

  if (esSesionExpirada(error)) {
    return {
      tipo: TIPOS_ERROR_REPROGRAMACION.SESION,
      status,
      codigo,
      mensaje: "Tu sesión expiró. Volvé a iniciar sesión.",
      bloqueos: [],
    };
  }

  if (esCuentaNoActiva(error)) {
    return {
      tipo: TIPOS_ERROR_REPROGRAMACION.CUENTA,
      status,
      codigo,
      mensaje: mensajeBackend || "Tu cuenta no se encuentra activa.",
      bloqueos: [],
    };
  }

  if (status === 403) {
    return {
      tipo: TIPOS_ERROR_REPROGRAMACION.PERMISO,
      status,
      codigo,
      mensaje:
        mensajeBackend ||
        "Solo un director activo del proyecto puede reintentar la reprogramación.",
      bloqueos: [],
    };
  }

  if (status === 404) {
    return {
      tipo: TIPOS_ERROR_REPROGRAMACION.NO_ENCONTRADO,
      status,
      codigo,
      mensaje: mensajeBackend || "El proyecto ya no existe.",
      bloqueos: [],
    };
  }

  if (status === 409) {
    return {
      tipo: TIPOS_ERROR_REPROGRAMACION.BLOQUEO,
      status,
      codigo,
      mensaje:
        mensajeBackend ||
        "El proyecto no tiene un plan viable con la disponibilidad actual.",
      bloqueos: normalizarBloqueosReprogramacion(payload.bloqueos),
    };
  }

  return {
    tipo: TIPOS_ERROR_REPROGRAMACION.DESCONOCIDO,
    status,
    codigo,
    mensaje: mensajeErrorApi(
      error,
      "No se pudo reintentar la reprogramación. Inténtalo nuevamente."
    ),
    bloqueos: [],
  };
}
