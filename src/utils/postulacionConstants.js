import {
  ESTADOS_ACTIVIDAD,
  normalizarEstadoActividad,
} from "./actividadConstants.js";
import {
  ESTADOS_PROYECTO,
  ROLES_PROYECTO,
  normalizarEstadoProyecto,
} from "./proyectoConstants.js";

/*
 * Reglas y textos de UC-26 (docs/backend/ficha-tecnica-postular-a-proyecto.md).
 * Se centralizan acá para no repetir la matriz de habilitación en la vista y
 * poder probarlas de forma aislada.
 *
 * El sistema es la fuente de verdad:
 * - `requerimiento.puedePostularse` es la fuente de verdad por requerimiento.
 *   Ya contempla estado del proyecto/actividad, membresía/rol, profesión y
 *   cupo. El front no debe replicar esas reglas.
 * - `elegibleParaPostularse` queda como resumen global deprecado para el
 *   gating; no debe usarse para habilitar el botón de un requerimiento.
 * - Si el sistema todavía no expone `puedePostularse` (rollout), se usa
 *   `elegibleParaPostularse`/`hayCupo` como fallback.
 * - El cupo se lee de `satisfecho`/`faltantes` (definición §11 de la ficha:
 *   `satisfecho = cubiertos >= cantidad`). El front no lo deriva de `cantidad`
 *   ni de asignaciones.
 */

export const TIPOS_POSTULACION = {
  GENERAL: "GENERAL",
  ACTIVIDAD: "ACTIVIDAD",
};

/** Acciones de UC-34 sobre una postulación. */
export const ACCIONES_GESTION = {
  ACEPTAR: "ACEPTAR",
  RECHAZAR: "RECHAZAR",
};

export const ESTADOS_POSTULACION = {
  PENDIENTE: "PENDIENTE",
  ACEPTADA: "ACEPTADA",
  RECHAZADA: "RECHAZADA",
};

export const ETIQUETAS_ESTADO_POSTULACION = {
  [ESTADOS_POSTULACION.PENDIENTE]: "Pendiente",
  [ESTADOS_POSTULACION.ACEPTADA]: "Aceptada",
  [ESTADOS_POSTULACION.RECHAZADA]: "Rechazada",
};

export const COLORES_ESTADO_POSTULACION = {
  [ESTADOS_POSTULACION.PENDIENTE]: {
    fondo: "var(--color-warning-soft)",
    texto: "var(--color-warning-text)",
    borde: "var(--color-warning-border)",
  },
  [ESTADOS_POSTULACION.ACEPTADA]: {
    fondo: "var(--color-success-soft)",
    texto: "var(--color-success-text)",
    borde: "var(--color-success-border)",
  },
  [ESTADOS_POSTULACION.RECHAZADA]: {
    fondo: "var(--color-danger-soft)",
    texto: "var(--color-danger-text)",
    borde: "var(--color-danger-border)",
  },
};

export const ETIQUETAS_TIPO_POSTULACION = {
  [TIPOS_POSTULACION.GENERAL]: "General",
  [TIPOS_POSTULACION.ACTIVIDAD]: "Actividad",
};

/**
 * Origen que se muestra en "Mis postulaciones": una postulación general
 * pertenece al proyecto; una de actividad, a una actividad concreta.
 */
export const ETIQUETAS_ORIGEN_POSTULACION = {
  [TIPOS_POSTULACION.GENERAL]: "Proyecto",
  [TIPOS_POSTULACION.ACTIVIDAD]: "Actividad",
};

/**
 * Textos fijos de la pestaña Postulaciones y de "Mis postulaciones".
 * Se centralizan para no repetirlos en los componentes.
 */
export const TEXTOS_POSTULACIONES = {
  VACIO_PERSONAL_REQUERIDO:
    "Este proyecto todavía no tiene personal requerido.",
  VACIO_MIS_POSTULACIONES:
    "Todavía no te postulaste a ningún proyecto.",
  VACIO_PROYECTO_ESTADO: "No hay postulaciones en este estado.",
  ERROR_PROYECTO: "No pudimos cargar las postulaciones.",
  AVISO_MIEMBRO_INACTIVO:
    "El miembro ya no está activo; el cupo puede estar libre.",
  AVISO_ACTIVIDAD_CERRADA: "Esta actividad ya no acepta postulaciones.",
  CUPO_COMPLETO: "Cupo completo",
  NO_DISPONIBLE: "No disponible para tu perfil",
  DAR_DE_BAJA: "Dar de baja",
};

export const AVISO_DISPONIBILIDAD_PROVISORIA =
  "Tu disponibilidad fue verificada de forma provisoria. Se confirmará cuando el proyecto defina su fecha de inicio.";

/** Estados de proyecto que aceptan postulaciones a actividades. */
const ESTADOS_CON_POSTULACION = [
  ESTADOS_PROYECTO.PUBLICADO,
  ESTADOS_PROYECTO.CONFIRMADO,
];

/**
 * Clave estable para recordar qué requerimientos ya recibieron una postulación
 * durante la sesión de la vista.
 * @param {string} tipo TipoPostulacion
 * @param {number|string|null|undefined} idRequerimiento
 * @returns {string}
 */
export function clavePostulacion(tipo, idRequerimiento) {
  if (!tipo || idRequerimiento == null) return "";
  return `${tipo}:${idRequerimiento}`;
}

/**
 * ¿Queda cupo en el requerimiento? (ficha §4.4 y §11)
 *
 * - `satisfecho === true` → no hay cupo.
 * - `faltantes` numérico → hay cupo si es mayor a 0.
 * - Sin `satisfecho`/`faltantes` (p. ej. actividades hasta que el sistema
 *   exponga los campos) → no se bloquea la acción; el `409` es la red de
 *   seguridad.
 * @param {object|null|undefined} requerimiento
 * @returns {boolean}
 */
export function hayCupo(requerimiento) {
  if (!requerimiento) return false;
  if (requerimiento.satisfecho === true) return false;

  if (requerimiento.faltantes != null) {
    const faltantes = Number(requerimiento.faltantes);
    if (Number.isFinite(faltantes)) return faltantes > 0;
  }

  return true;
}

/**
 * Cupo completo según el sistema (o marca local tras un 409 de cupo).
 * @param {object|null|undefined} requerimiento
 * @returns {boolean}
 */
export function esCupoCompleto(requerimiento) {
  return !!requerimiento && !hayCupo(requerimiento);
}

/**
 * ¿El sistema habilitó este requerimiento para el perfil activo?
 *
 * `puedePostularse` es la fuente de verdad de Fase 1/2. Si el sistema todavía
 * no lo expone (rollout), se usa el cupo como fallback.
 * @param {object|null|undefined} requerimiento
 * @returns {boolean}
 */
export function puedePostularRequerimiento(requerimiento) {
  if (!requerimiento) return false;
  if (typeof requerimiento.puedePostularse === "boolean") {
    return requerimiento.puedePostularse;
  }
  return hayCupo(requerimiento);
}

/**
 * Texto para explicar por qué no se muestra la acción de postulación.
 * No intenta adivinar la causa cuando el sistema sólo devuelve `false`.
 * @param {object|null|undefined} requerimiento
 * @returns {string}
 */
export function motivoNoPostulable(requerimiento) {
  if (!requerimiento) return "";
  if (esCupoCompleto(requerimiento)) return "Cupo completo";
  if (requerimiento.puedePostularse === false) {
    return "No disponible para tu perfil";
  }
  return "";
}

/**
 * Postulación general (ficha §4.4): si el sistema expone `puedePostularse`,
 * esa es la fuente de verdad. Si no, se conserva el fallback histórico con
 * `elegibleParaPostularse` + cupo.
 * @param {object|null|undefined} proyecto ProyectoResponse
 * @param {object|null|undefined} requerimiento RequerimientoGralResponse
 * @returns {boolean}
 */
export function puedePostularGeneral(proyecto, requerimiento) {
  if (!proyecto || !requerimiento) return false;
  if (typeof requerimiento.puedePostularse === "boolean") {
    return requerimiento.puedePostularse;
  }
  return proyecto.elegibleParaPostularse === true && hayCupo(requerimiento);
}

/**
 * Habilitación de la pestaña de actividades (ficha §4.3/§4.4): proyecto
 * Publicado o Confirmado y perfil no director. Un miembro activo `MIEMBRO`
 * puede postularse; los no miembros (`rolUsuario: null`) también.
 * No depende de `aceptaPostulacionGral`.
 * @param {object|null|undefined} proyecto ProyectoResponse
 * @returns {boolean}
 */
export function proyectoAdmitePostulacionesActividad(proyecto) {
  if (!proyecto) return false;
  const estado = normalizarEstadoProyecto(proyecto.estado);
  return (
    ESTADOS_CON_POSTULACION.includes(estado) &&
    (!proyecto.esMiembro || proyecto.rolUsuario === ROLES_PROYECTO.MIEMBRO)
  );
}

/**
 * Postulación a una actividad concreta (ficha §4.4): si el sistema expone
 * `puedePostularse`, esa es la fuente de verdad. Si no, se conserva el
 * fallback histórico: proyecto Publicado/Confirmado, perfil no director,
 * actividad PENDIENTE y cupo disponible.
 *
 * La profesión, el duplicado y la disponibilidad los sigue validando el
 * sistema; `puedePostularse` no garantiza el éxito de la request.
 * @param {object|null|undefined} proyecto ProyectoResponse
 * @param {object|null|undefined} actividad ActividadBusquedaResponse
 * @param {object|null|undefined} requerimiento requerimiento de la actividad
 * @returns {boolean}
 */
export function puedePostularActividad(proyecto, actividad, requerimiento) {
  if (!proyecto || !actividad || !requerimiento) return false;
  if (typeof requerimiento.puedePostularse === "boolean") {
    return requerimiento.puedePostularse;
  }
  return (
    proyectoAdmitePostulacionesActividad(proyecto) &&
    normalizarEstadoActividad(actividad.estado) === ESTADOS_ACTIVIDAD.PENDIENTE &&
    hayCupo(requerimiento)
  );
}

/**
 * Detecta el 409 de postulación duplicada para deshabilitar la acción local.
 * @param {object} error error Axios
 * @returns {boolean}
 */
export function esErrorPostulacionDuplicada(error) {
  const mensaje = error?.response?.data?.message || "";
  return (
    error?.response?.status === 409 &&
    /ya existe una postulaci[oó]n/i.test(mensaje)
  );
}

/**
 * Detecta el 409 de cupo completo. Se registra localmente para ocultar la
 * acción aunque la respuesta del sistema todavía no traiga `satisfecho`
 * (caso de actividades).
 * @param {object} error error Axios
 * @returns {boolean}
 */
export function esErrorCupoCompleto(error) {
  const mensaje = error?.response?.data?.message || "";
  return (
    error?.response?.status === 409 &&
    /requerimiento.*ya est[áa] satisfecho/i.test(mensaje)
  );
}

/**
 * Detecta el 409 de disponibilidad insuficiente. Ese error mantiene el modal
 * abierto para que el usuario pueda leerlo y revisar su calendario.
 * @param {object} error error Axios
 * @returns {boolean}
 */
export function esErrorDisponibilidad(error) {
  const mensaje = error?.response?.data?.message || "";
  return (
    error?.response?.status === 409 &&
    /disponibilidad/i.test(mensaje)
  );
}

/**
 * Texto del toast de éxito. En actividad se incluye el nombre cuando existe.
 * @param {string} tipo TipoPostulacion
 * @param {string} [nombreActividad]
 * @returns {string}
 */
export function mensajeExitoPostulacion(tipo, nombreActividad = "") {
  if (tipo === TIPOS_POSTULACION.ACTIVIDAD) {
    const nombre = String(nombreActividad || "").trim();
    return nombre
      ? `Postulación enviada para la actividad '${nombre}'.`
      : "Postulación enviada para la actividad.";
  }
  return "Postulación enviada. El director del proyecto recibirá tu postulación.";
}

/**
 * Normaliza el estado de una postulación al enum canónico.
 * @param {string|null|undefined} estado
 * @returns {string}
 */
export function normalizarEstadoPostulacion(estado) {
  if (!estado) return ESTADOS_POSTULACION.PENDIENTE;
  const clave = Object.keys(ESTADOS_POSTULACION).find(
    (k) => k.toLowerCase() === String(estado).toLowerCase()
  );
  return clave || String(estado).toUpperCase();
}

/**
 * @param {string|null|undefined} estado
 * @returns {string}
 */
export function etiquetaEstadoPostulacion(estado) {
  const clave = normalizarEstadoPostulacion(estado);
  return ETIQUETAS_ESTADO_POSTULACION[clave] || String(estado || "");
}

/**
 * @param {string|null|undefined} estado
 * @returns {{fondo: string, texto: string, borde: string}}
 */
export function coloresEstadoPostulacion(estado) {
  const clave = normalizarEstadoPostulacion(estado);
  return (
    COLORES_ESTADO_POSTULACION[clave] ||
    COLORES_ESTADO_POSTULACION[ESTADOS_POSTULACION.PENDIENTE]
  );
}

/**
 * @param {string|null|undefined} tipo
 * @returns {string}
 */
export function etiquetaTipoPostulacion(tipo) {
  if (!tipo) return "";
  const clave = String(tipo).toUpperCase();
  return ETIQUETAS_TIPO_POSTULACION[clave] || String(tipo);
}

/**
 * Etiqueta de origen para "Mis postulaciones": "Proyecto" o "Actividad".
 * @param {string|null|undefined} tipo
 * @returns {string}
 */
export function etiquetaOrigenPostulacion(tipo) {
  if (!tipo) return "";
  const clave = String(tipo).toUpperCase();
  return ETIQUETAS_ORIGEN_POSTULACION[clave] || etiquetaTipoPostulacion(tipo);
}

/**
 * Cantidad solicitada del requerimiento. Acepta el shape de gestión
 * (`cantidadRequerida`) y el de mis postulaciones (`cantidad`).
 * @param {object|null|undefined} elemento
 * @returns {number|null}
 */
function cantidadDeCupo(elemento) {
  const valor = elemento?.cantidadRequerida ?? elemento?.cantidad;
  const cantidad = Number(valor);
  return Number.isFinite(cantidad) && cantidad > 0 ? cantidad : null;
}

/**
 * @param {object|null|undefined} elemento
 * @returns {number|null}
 */
function cubiertosDeCupo(elemento) {
  if (elemento?.cubiertos == null) return null;
  const cubiertos = Number(elemento.cubiertos);
  return Number.isFinite(cubiertos) ? cubiertos : null;
}

/**
 * Cupo en el formato de la pestaña Postulaciones: "1 de 2 cubiertos".
 * Se muestra siempre, incluso con `cantidad = 1`.
 * @param {object|null|undefined} elemento
 * @returns {string} "—" si faltan datos del sistema
 */
export function textoCupoCubiertos(elemento) {
  const cantidad = cantidadDeCupo(elemento);
  const cubiertos = cubiertosDeCupo(elemento);
  if (cantidad === null || cubiertos === null) return "—";
  return `${cubiertos} de ${cantidad} cubiertos`;
}

/**
 * Avance del cupo para la barra de progreso.
 * @param {object|null|undefined} elemento
 * @returns {number} 0..100
 */
export function porcentajeCupo(elemento) {
  const cantidad = cantidadDeCupo(elemento);
  const cubiertos = cubiertosDeCupo(elemento);
  if (cantidad === null || cubiertos === null) return 0;
  const porcentaje = Math.round((cubiertos / cantidad) * 100);
  return Math.min(100, Math.max(0, porcentaje));
}

/**
 * Aceptada cuyo miembro/asignación ya no está activo: el cupo puede estar
 * libre aunque la postulación siga ACEPTADA.
 * @param {object|null|undefined} postulacion
 * @returns {boolean}
 */
export function esAceptadaConMiembroInactivo(postulacion) {
  return (
    normalizarEstadoPostulacion(postulacion?.estado) ===
      ESTADOS_POSTULACION.ACEPTADA && postulacion?.aportaCupo === false
  );
}

/**
 * Requerimiento en formato "2 · Modelo". Si el contrato todavía no expone
 * `cantidad`/`nombreProfesion` (mis postulaciones), cae a
 * `descripcionRequerimiento`.
 * @param {object|null|undefined} elemento
 * @returns {string}
 */
export function textoRequerimiento(elemento) {
  const cantidad = cantidadDeCupo(elemento);
  const profesion = String(elemento?.nombreProfesion || "").trim();

  if (cantidad !== null && profesion) return `${cantidad} · ${profesion}`;
  if (profesion) return profesion;

  const descripcion = String(elemento?.descripcionRequerimiento || "").trim();
  return descripcion || "Requerimiento";
}
