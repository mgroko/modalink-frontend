import {
  ESTADOS_ACTIVIDAD,
  etiquetaEstadoActividad,
  normalizarEstadoActividad,
} from "./actividadConstants.js";
import {
  ESTADOS_PROYECTO,
  normalizarEstadoProyecto,
} from "./proyectoConstants.js";
import {
  esCuentaNoActiva,
  esSesionExpirada,
  mensajeErrorApi,
} from "./apiError.js";

/*
 * Reglas de presentación, payload y errores de UC-51
 * (docs/backend/ficha-tecnica-eliminar-actividad.md).
 *
 * El backend es la fuente de verdad: `puedeEliminar` y `motivoNoEliminable`
 * llegan en GET .../miembros-exclusivos y no se recalculan acá.
 *
 * Contrato de errores validado en Fase 0 (2026-11-01):
 * - 400 de Bean Validation: { message, errores: { "decisiones[0].motivoBaja": "..." } }
 * - 400 de servicio: { message } con un único error; a veces el id va en el texto.
 * - 409: { message } sin id estructurado.
 */

export const PERMISO_ELIMINAR_ACTIVIDAD = "ELIMINAR_ACTIVIDAD";
export const PERMISO_MODIFICAR_ACTIVIDAD = "MODIFICAR_ACTIVIDAD";

export const ACCIONES_DECISION = {
  ELIMINAR: "ELIMINAR",
  GUARDAR: "GUARDAR",
};

export const LIMITE_MOTIVO_ACTIVIDAD = 200;
export const LIMITE_MOTIVO_BAJA = 100;

export const TEXTO_CONFLICTO_EN_CURSO =
  "La actividad está en curso en un proyecto confirmado. Cancelala antes de eliminarla.";

export const MOTIVOS_NO_ELIMINABLE_EXCLUSIVO = {
  AUTOELIMINACION: "No podés eliminarte a vos mismo del proyecto.",
  ULTIMO_DIRECTOR: "Es el último director activo del proyecto.",
  PROYECTO_BORRADOR:
    "En Borrador no se puede eliminar integrantes; sólo podés guardarlos en el proyecto.",
};

const ESTADOS_PROYECTO_CON_ELIMINACION = [
  ESTADOS_PROYECTO.BORRADOR,
  ESTADOS_PROYECTO.PUBLICADO,
  ESTADOS_PROYECTO.CONFIRMADO,
];

const ESTADOS_ACTIVIDAD_NO_ELIMINABLES = [
  ESTADOS_ACTIVIDAD.FINALIZADA,
  ESTADOS_ACTIVIDAD.CANCELADA,
];

/**
 * Texto para el motivo de bloqueo de un integrante exclusivo. Si el backend
 * agrega un código nuevo, se muestra el código crudo para no ocultarlo.
 * @param {string|null|undefined} codigo
 * @returns {string}
 */
export function textoMotivoNoEliminableExclusivo(codigo) {
  if (!codigo) return "";
  const clave = String(codigo).toUpperCase();
  return MOTIVOS_NO_ELIMINABLE_EXCLUSIVO[clave] || String(codigo);
}

/**
 * @param {{permisos?: string[], tienePermiso?: boolean}} opciones
 * @returns {boolean}
 */
function tienePermisoEliminar({ permisos, tienePermiso } = {}) {
  if (typeof tienePermiso === "boolean") return tienePermiso;
  return (
    Array.isArray(permisos) &&
    permisos.includes(PERMISO_ELIMINAR_ACTIVIDAD)
  );
}

/**
 * Regla de UC-51 §2.1/§4. El permiso se evalúa primero para poder explicar
 * la causa correcta en el tooltip.
 * @param {object} opciones
 * @param {string[]} [opciones.permisos]
 * @param {boolean} [opciones.tienePermiso] alternativa al array de permisos
 * @param {string} [opciones.estadoProyecto]
 * @param {string} [opciones.estadoActividad]
 * @returns {boolean}
 */
export function puedeEliminarActividad({
  permisos,
  tienePermiso,
  estadoProyecto,
  estadoActividad,
} = {}) {
  if (!tienePermisoEliminar({ permisos, tienePermiso })) return false;

  const proyecto = normalizarEstadoProyecto(estadoProyecto);
  if (!ESTADOS_PROYECTO_CON_ELIMINACION.includes(proyecto)) return false;

  const actividad = normalizarEstadoActividad(estadoActividad);
  if (ESTADOS_ACTIVIDAD_NO_ELIMINABLES.includes(actividad)) return false;

  if (
    proyecto === ESTADOS_PROYECTO.CONFIRMADO &&
    actividad === ESTADOS_ACTIVIDAD.EN_CURSO
  ) {
    return false;
  }

  return true;
}

/**
 * Texto para el tooltip de la acción deshabilitada.
 * @param {object} opciones mismas claves que `puedeEliminarActividad`
 * @returns {string}
 */
export function motivoNoEliminableActividad({
  permisos,
  tienePermiso,
  estadoProyecto,
  estadoActividad,
} = {}) {
  if (!tienePermisoEliminar({ permisos, tienePermiso })) {
    return "No tenés permiso para eliminar actividades en este proyecto.";
  }

  const proyecto = normalizarEstadoProyecto(estadoProyecto);
  if (!ESTADOS_PROYECTO_CON_ELIMINACION.includes(proyecto)) {
    return `El proyecto está ${proyecto.toLowerCase()} y no admite eliminar actividades.`;
  }

  const actividad = normalizarEstadoActividad(estadoActividad);
  if (ESTADOS_ACTIVIDAD_NO_ELIMINABLES.includes(actividad)) {
    return `La actividad está ${etiquetaEstadoActividad(actividad).toLowerCase()} y no se puede eliminar.`;
  }

  if (
    proyecto === ESTADOS_PROYECTO.CONFIRMADO &&
    actividad === ESTADOS_ACTIVIDAD.EN_CURSO
  ) {
    return "La actividad está en curso en un proyecto confirmado. Cancelala antes de eliminarla.";
  }

  return "Eliminar actividad";
}

/**
 * Normaliza una fila del endpoint de exclusivos. Deduplicar y decidir
 * `puedeEliminar` es responsabilidad del backend; acá sólo se aseguran los
 * tipos que usa la UI.
 * @param {object|null|undefined} miembro
 * @returns {object|null}
 */
export function normalizarMiembroExclusivo(miembro) {
  if (!miembro || miembro.idMiembro == null) return null;
  return {
    ...miembro,
    idMiembro: Number(miembro.idMiembro),
    idPerfil: miembro.idPerfil != null ? Number(miembro.idPerfil) : null,
    idUsuario: miembro.idUsuario != null ? Number(miembro.idUsuario) : null,
    nombreArtistico: String(miembro.nombreArtistico || "").trim(),
    nombreProfesion: String(miembro.nombreProfesion || "").trim(),
    puedeEliminar: miembro.puedeEliminar === true,
    motivoNoEliminable: miembro.motivoNoEliminable || null,
  };
}

/**
 * Elimina filas repetidas por `idMiembro` (defensa ante respuestas
 * inesperadas). El backend exige una única decisión por integrante.
 * @param {object[]} lista
 * @returns {object[]}
 */
export function deduplicarMiembrosExclusivos(lista) {
  const vistos = new Set();
  const resultado = [];
  for (const item of Array.isArray(lista) ? lista : []) {
    const miembro = normalizarMiembroExclusivo(item);
    if (!miembro) continue;
    const clave = String(miembro.idMiembro);
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    resultado.push(miembro);
  }
  return resultado;
}

/**
 * Selección inicial: todos los integrantes se conservan en el proyecto.
 * @param {object|null|undefined} miembro
 * @returns {{idMiembro:number, accion:"GUARDAR", motivoBaja:string}}
 */
export function decisionInicial(miembro) {
  return {
    idMiembro: Number(miembro?.idMiembro),
    accion: ACCIONES_DECISION.GUARDAR,
    motivoBaja: "",
  };
}

/**
 * @param {object[]} miembros
 * @returns {Record<string, {accion:string, motivoBaja:string}>}
 */
export function construirSeleccion(miembros) {
  const seleccion = {};
  for (const miembro of Array.isArray(miembros) ? miembros : []) {
    if (miembro?.idMiembro == null) continue;
    seleccion[String(miembro.idMiembro)] = decisionInicial(miembro);
  }
  return seleccion;
}

/**
 * Payload de decisiones en el mismo orden que `miembros` (el backend mapea los
 * errores de validación por índice). No envía campos extra.
 * @param {object[]} miembros
 * @param {Record<string, object>} seleccion
 * @returns {Array<{idMiembro:number, accion:string, motivoBaja?:string}>}
 */
export function construirDecisiones(miembros, seleccion = {}) {
  const vistos = new Set();
  const decisiones = [];

  for (const miembro of Array.isArray(miembros) ? miembros : []) {
    const id = Number(miembro?.idMiembro);
    if (!Number.isFinite(id) || vistos.has(id)) continue;
    vistos.add(id);

    const elegida = seleccion[String(id)] || seleccion[id] || {};
    if (
      elegida.accion === ACCIONES_DECISION.ELIMINAR &&
      miembro?.puedeEliminar === true
    ) {
      const motivoBaja = String(elegida.motivoBaja ?? "").trim();
      decisiones.push(
        motivoBaja
          ? { idMiembro: id, accion: ACCIONES_DECISION.ELIMINAR, motivoBaja }
          : { idMiembro: id, accion: ACCIONES_DECISION.ELIMINAR }
      );
      continue;
    }

    decisiones.push({ idMiembro: id, accion: ACCIONES_DECISION.GUARDAR });
  }

  return decisiones;
}

/**
 * Ids de integrantes marcados ELIMINAR sin motivo propio. Si el motivo de la
 * actividad supera 100 caracteres, el backend no puede usar el fallback.
 * @param {Array<{idMiembro:number, accion:string, motivoBaja?:string}>} decisiones
 * @returns {number[]}
 */
export function idsEliminarSinMotivo(decisiones) {
  return (Array.isArray(decisiones) ? decisiones : [])
    .filter(
      (decision) =>
        decision?.accion === ACCIONES_DECISION.ELIMINAR &&
        !String(decision?.motivoBaja ?? "").trim()
    )
    .map((decision) => Number(decision.idMiembro))
    .filter((id) => Number.isFinite(id));
}

/**
 * Valida el fallback de `motivoBaja` antes de enviar.
 * @param {string} motivoActividad
 * @param {object[]} miembros
 * @param {Record<string, object>} seleccion
 * @returns {{valido: boolean, idsConError: number[]}}
 */
export function validarMotivoFallback(
  motivoActividad,
  miembros,
  seleccion = {}
) {
  const motivo = String(motivoActividad ?? "").trim();
  if (motivo.length <= LIMITE_MOTIVO_BAJA) {
    return { valido: true, idsConError: [] };
  }

  const idsConError = [];
  for (const miembro of Array.isArray(miembros) ? miembros : []) {
    const elegida = seleccion[String(miembro?.idMiembro)] || {};
    if (
      elegida.accion === ACCIONES_DECISION.ELIMINAR &&
      !String(elegida.motivoBaja ?? "").trim()
    ) {
      idsConError.push(Number(miembro.idMiembro));
    }
  }

  return { valido: idsConError.length === 0, idsConError };
}

/**
 * Extrae el id de miembro de mensajes de servicio ("El miembro 20 ...").
 * @param {string} mensaje
 * @returns {number|null}
 */
export function extraerIdMiembroDeMensaje(mensaje) {
  const match = String(mensaje || "").match(/miembro\s+(\d+)/i);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isFinite(id) ? id : null;
}

export const TIPOS_ERROR_ELIMINAR_ACTIVIDAD = {
  SESION: "SESION",
  CUENTA: "CUENTA",
  MOTIVO: "MOTIVO",
  DECISIONES: "DECISIONES",
  MOTIVO_BAJA: "MOTIVO_BAJA",
  FALLBACK_MOTIVO: "FALLBACK_MOTIVO",
  PERMISO: "PERMISO",
  PERFIL_ACTIVO: "PERFIL_ACTIVO",
  PERFIL_NO_ENCONTRADO: "PERFIL_NO_ENCONTRADO",
  NO_ENCONTRADO: "NO_ENCONTRADO",
  ESTADO: "ESTADO",
  EN_CURSO_CONFIRMADO: "EN_CURSO_CONFIRMADO",
  NO_ELIMINABLE: "NO_ELIMINABLE",
  DESCONOCIDO: "DESCONOCIDO",
};

function resultadoBase(extra = {}) {
  return {
    tipo: TIPOS_ERROR_ELIMINAR_ACTIVIDAD.DESCONOCIDO,
    mensaje: "",
    mensajeCampo: "",
    erroresPorMiembro: {},
    idMiembro: null,
    recargar: false,
    cerrar: false,
    conflictoEnCurso: false,
    ...extra,
  };
}

/**
 * Clasifica el error de `POST .../eliminar` según el contrato validado.
 *
 * @param {object} error error Axios
 * @param {{miembros?: object[], decisiones?: object[]}} [contexto] lista de
 *        miembros o payload de decisiones en el mismo orden en que se
 *        construyeron; permite mapear
 *        `errores["decisiones[i].motivoBaja"]` a un idMiembro.
 * @returns {{
 *   tipo: string,
 *   mensaje: string,
 *   mensajeCampo: string,
 *   erroresPorMiembro: Record<string, string>,
 *   idMiembro: number|null,
 *   recargar: boolean,
 *   cerrar: boolean,
 *   conflictoEnCurso: boolean
 * }}
 */
export function clasificarErrorEliminarActividad(
  error,
  { miembros = [], decisiones = [] } = {}
) {
  const status = error?.response?.status ?? null;
  const data = error?.response?.data;
  const payload = data && typeof data === "object" ? data : {};
  const mensaje =
    typeof payload.message === "string" ? payload.message.trim() : "";
  const errores =
    payload.errores && typeof payload.errores === "object" ? payload.errores : {};

  if (esSesionExpirada(error)) {
    return resultadoBase({
      tipo: TIPOS_ERROR_ELIMINAR_ACTIVIDAD.SESION,
      mensaje: "Tu sesión expiró. Volvé a iniciar sesión.",
    });
  }

  if (esCuentaNoActiva(error)) {
    return resultadoBase({
      tipo: TIPOS_ERROR_ELIMINAR_ACTIVIDAD.CUENTA,
      mensaje: mensaje || "Tu cuenta no se encuentra activa.",
    });
  }

  if (status === 400) {
    const claves = Object.keys(errores);
    if (claves.length > 0) {
      const mensajeCampo =
        typeof errores.motivo === "string" ? errores.motivo.trim() : "";
      const mensajeDecisionesArray =
        typeof errores.decisiones === "string"
          ? errores.decisiones.trim()
          : "";
      const erroresPorMiembro = {};
      let mensajeMotivoBaja = "";
      let mensajeDecision = "";

      for (const clave of claves) {
        const match = /^decisiones\[(\d+)\]\.(motivoBaja|idMiembro|accion)$/.exec(
          clave
        );
        if (!match) continue;

        const indice = Number(match[1]);
        const referencia = miembros?.[indice] ?? decisiones?.[indice];
        const idMiembro = Number(referencia?.idMiembro);
        const texto = String(errores[clave] || "").trim();

        if (match[2] === "motivoBaja") {
          mensajeMotivoBaja =
            texto || "El motivo de baja no es válido.";
          if (Number.isFinite(idMiembro)) {
            erroresPorMiembro[String(idMiembro)] = mensajeMotivoBaja;
          }
        } else {
          mensajeDecision =
            texto || "La decisión sobre el integrante no es válida.";
        }
      }

      if (mensajeMotivoBaja) {
        return resultadoBase({
          tipo: TIPOS_ERROR_ELIMINAR_ACTIVIDAD.MOTIVO_BAJA,
          mensaje: mensajeMotivoBaja,
          mensajeCampo,
          erroresPorMiembro,
        });
      }

      if (mensajeCampo) {
        return resultadoBase({
          tipo: TIPOS_ERROR_ELIMINAR_ACTIVIDAD.MOTIVO,
          mensaje: mensajeCampo,
          mensajeCampo,
        });
      }

      return resultadoBase({
        tipo: TIPOS_ERROR_ELIMINAR_ACTIVIDAD.DECISIONES,
        mensaje:
          mensajeDecision ||
          mensajeDecisionesArray ||
          mensaje ||
          "Revisá las decisiones sobre los integrantes y volvé a intentar.",
        mensajeCampo,
        recargar: true,
      });
    }

    // 400 de servicio: un único message, sin `errores`.
    if (/motivo de baja.*100|100.*motivo de baja/i.test(mensaje)) {
      return resultadoBase({
        tipo: TIPOS_ERROR_ELIMINAR_ACTIVIDAD.FALLBACK_MOTIVO,
        mensaje:
          mensaje ||
          "El motivo de la actividad supera los 100 caracteres. Indicá un motivo de baja propio.",
      });
    }

    if (/motivo/i.test(mensaje) && !/decisi|miembro/i.test(mensaje)) {
      return resultadoBase({
        tipo: TIPOS_ERROR_ELIMINAR_ACTIVIDAD.MOTIVO,
        mensaje: mensaje || "El motivo de la eliminación no es válido.",
        mensajeCampo: mensaje,
      });
    }

    return resultadoBase({
      tipo: TIPOS_ERROR_ELIMINAR_ACTIVIDAD.DECISIONES,
      mensaje:
        mensaje ||
        "El listado de integrantes cambió. Revisá las decisiones y volvé a intentar.",
      idMiembro: extraerIdMiembroDeMensaje(mensaje),
      recargar: true,
    });
  }

  if (status === 403) {
    return resultadoBase({
      tipo: TIPOS_ERROR_ELIMINAR_ACTIVIDAD.PERMISO,
      mensaje: mensajeErrorApi(
        error,
        "No tenés permiso para eliminar esta actividad."
      ),
      cerrar: true,
      recargar: true,
    });
  }

  if (status === 404) {
    if (/perfil\s*activo|no hay un perfil activo/i.test(mensaje)) {
      return resultadoBase({
        tipo: TIPOS_ERROR_ELIMINAR_ACTIVIDAD.PERFIL_ACTIVO,
        mensaje: mensaje || "No hay un perfil activo seleccionado.",
        cerrar: true,
        recargar: true,
      });
    }
    if (/perfil/i.test(mensaje)) {
      return resultadoBase({
        tipo: TIPOS_ERROR_ELIMINAR_ACTIVIDAD.PERFIL_NO_ENCONTRADO,
        mensaje: mensaje || "El perfil no fue encontrado.",
        cerrar: true,
        recargar: true,
      });
    }
    return resultadoBase({
      tipo: TIPOS_ERROR_ELIMINAR_ACTIVIDAD.NO_ENCONTRADO,
      mensaje:
        mensaje ||
        "La actividad o el proyecto ya no existen.",
      cerrar: true,
      recargar: true,
    });
  }

  if (status === 409) {
    if (/en curso/i.test(mensaje)) {
      return resultadoBase({
        tipo: TIPOS_ERROR_ELIMINAR_ACTIVIDAD.EN_CURSO_CONFIRMADO,
        mensaje: mensaje || TEXTO_CONFLICTO_EN_CURSO,
        conflictoEnCurso: true,
      });
    }

    if (
      /ltimo director|al menos un director|vos mismo|autoelimin|no participa|no se puede eliminar al/i.test(
        mensaje
      )
    ) {
      return resultadoBase({
        tipo: TIPOS_ERROR_ELIMINAR_ACTIVIDAD.NO_ELIMINABLE,
        mensaje:
          mensaje ||
          "El integrante no se puede eliminar del proyecto.",
        recargar: true,
      });
    }

    return resultadoBase({
      tipo: TIPOS_ERROR_ELIMINAR_ACTIVIDAD.ESTADO,
      mensaje:
        mensaje ||
        "La actividad o el proyecto no admiten esta operación.",
      cerrar: true,
      recargar: true,
    });
  }

  return resultadoBase({
    tipo: TIPOS_ERROR_ELIMINAR_ACTIVIDAD.DESCONOCIDO,
    mensaje: mensajeErrorApi(
      error,
      "Ocurrió un error al eliminar la actividad. Inténtalo nuevamente."
    ),
  });
}

/**
 * @param {{nombreActividad?: string, eliminados?: number}} datos
 * @returns {string}
 */
export function mensajeExitoEliminarActividad({
  nombreActividad = "",
  eliminados = 0,
} = {}) {
  const nombre = String(nombreActividad || "").trim();
  const base = `La actividad${nombre ? ` "${nombre}"` : ""} fue eliminada y el cronograma se recalculó.`;
  const cantidad = Number(eliminados) || 0;

  if (cantidad <= 0) return base;
  return `${base} ${
    cantidad === 1
      ? "1 integrante salió del proyecto."
      : `${cantidad} integrantes salieron del proyecto.`
  }`;
}
