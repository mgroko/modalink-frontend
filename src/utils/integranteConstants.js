import { esCuentaNoActiva, esSesionExpirada } from "./apiError.js";
import { etiquetaRolProyecto } from "./proyectoConstants.js";

/*
 * Reglas de presentación y errores de UC-38
 * (docs/backend/ficha-tecnica-eliminar-integrante.md).
 *
 * El backend es la fuente de verdad: `eliminable` y `motivoNoEliminable`
 * llegan en GET /proyectos/{id}/miembros?todos=true y no se recalculan acá.
 */

export const LIMITE_MOTIVO_BAJA = 100;

export const MOTIVOS_NO_ELIMINABLE = {
  SIN_PERMISO:
    "No tenés permiso para eliminar miembros en este proyecto.",
  PROYECTO_NO_PERMITE_BAJA:
    "El proyecto no está en un estado que permita dar de baja miembros.",
  AUTOELIMINACION: "No podés eliminarte a vos mismo del proyecto.",
  ULTIMO_DIRECTOR: "El proyecto debe conservar al menos un director activo.",
};

/*
 * Paleta de avatares del listado de miembros (mockup "Miembros - *").
 * Tonos fijos con inicial blanca: funcionan igual en tema claro y oscuro.
 */
export const COLORES_AVATAR_MIEMBRO = [
  "#7B5A6E",
  "#4F6D7A",
  "#56694A",
  "#7A5C3E",
  "#5C5A8A",
];

/**
 * Texto para el tooltip de una acción deshabilitada. Si el backend agrega un
 * código nuevo, se muestra el código crudo para no ocultar información.
 * @param {string|null|undefined} codigo
 * @returns {string}
 */
export function textoMotivoNoEliminable(codigo) {
  if (!codigo) return "";
  const clave = String(codigo).toUpperCase();
  return MOTIVOS_NO_ELIMINABLE[clave] || String(codigo);
}

/**
 * Estado visual de la acción de eliminar. Regla acordada:
 * - eliminable=true → habilitada;
 * - ULTIMO_DIRECTOR → deshabilitada con tooltip;
 * - cualquier otro motivo → oculta.
 * @param {object|null|undefined} miembro
 * @returns {"habilitada"|"deshabilitada"|"oculta"}
 */
export function estadoAccionIntegrante(miembro) {
  if (miembro?.eliminable === true) return "habilitada";
  const motivo = String(miembro?.motivoNoEliminable || "").toUpperCase();
  if (motivo === "ULTIMO_DIRECTOR") return "deshabilitada";
  return "oculta";
}

/**
 * @param {object|null|undefined} miembro
 * @returns {string}
 */
export function nombreCompletoMiembro(miembro) {
  return [miembro?.nombreUsuario, miembro?.apellidoUsuario]
    .filter(Boolean)
    .join(" ");
}

/**
 * @param {object|null|undefined} miembro
 * @returns {string}
 */
export function inicialesMiembro(miembro) {
  const base = String(
    miembro?.nombreArtistico ||
      miembro?.nombreUsuario ||
      miembro?.apellidoUsuario ||
      "?"
  ).trim();
  const partes = base.split(/\s+/).filter(Boolean).slice(0, 2);
  return partes.map((parte) => parte[0]).join("").toUpperCase() || "?";
}

/**
 * Color determinista del avatar según el perfil, para que cada miembro
 * conserve siempre el mismo tono entre recargas.
 * @param {number|string|null|undefined} idPerfil
 * @returns {string} color hex
 */
export function colorAvatarMiembro(idPerfil) {
  const clave = String(idPerfil ?? "");
  let hash = 0;
  for (let i = 0; i < clave.length; i += 1) {
    hash = (hash * 31 + clave.charCodeAt(i)) % 100000;
  }
  return COLORES_AVATAR_MIEMBRO[hash % COLORES_AVATAR_MIEMBRO.length];
}

/**
 * `true` si la fila corresponde al perfil activo de la sesión (chip "Vos").
 * @param {object|null|undefined} miembro
 * @param {number|string|null|undefined} idPerfilActivo
 * @returns {boolean}
 */
export function esPerfilActivoDelMiembro(miembro, idPerfilActivo) {
  if (miembro?.idPerfil == null || idPerfilActivo == null) return false;
  return String(miembro.idPerfil) === String(idPerfilActivo);
}

/**
 * Rol del miembro dentro del proyecto, en formato legible
 * ("DIRECTOR" → "Director", "MIEMBRO" → "Miembro").
 * @param {object|null|undefined} miembro
 * @returns {string}
 */
export function textoRolMiembro(miembro) {
  const rol = miembro?.rol;
  return rol ? etiquetaRolProyecto(rol) : "Miembro";
}

/**
 * "Ver perfil" sólo necesita el id del perfil: si no llega, se oculta.
 * @param {object|null|undefined} miembro
 * @returns {boolean}
 */
export function puedeVerPerfilMiembro(miembro) {
  return miembro?.idPerfil != null;
}

export const TIPOS_ERROR_ELIMINAR_INTEGRANTE = {
  SESION: "SESION",
  CUENTA: "CUENTA",
  MOTIVO: "MOTIVO",
  PERMISO: "PERMISO",
  PERFIL_ACTIVO: "PERFIL_ACTIVO",
  PERFIL_NO_ENCONTRADO: "PERFIL_NO_ENCONTRADO",
  PROYECTO_NO_ENCONTRADO: "PROYECTO_NO_ENCONTRADO",
  MIEMBRO_NO_ENCONTRADO: "MIEMBRO_NO_ENCONTRADO",
  MIEMBRO_INACTIVO: "MIEMBRO_INACTIVO",
  ESTADO_PROYECTO: "ESTADO_PROYECTO",
  AUTOELIMINACION: "AUTOELIMINACION",
  ULTIMO_DIRECTOR: "ULTIMO_DIRECTOR",
  DESCONOCIDO: "DESCONOCIDO",
};

/**
 * Clasifica el error del DELETE según la matriz UC-38 §6.3.
 * @param {object} error error Axios
 * @returns {{tipo: string, mensaje: string, mensajeCampo: string}}
 */
export function clasificarErrorEliminarIntegrante(error) {
  const status = error?.response?.status ?? null;
  const data = error?.response?.data;
  const payload = data && typeof data === "object" ? data : {};
  const mensaje =
    typeof payload.message === "string" ? payload.message.trim() : "";
  const errores =
    payload.errores && typeof payload.errores === "object"
      ? payload.errores
      : {};
  const mensajeCampo =
    typeof errores.motivo === "string" ? errores.motivo.trim() : "";

  if (esSesionExpirada(error)) {
    return {
      tipo: TIPOS_ERROR_ELIMINAR_INTEGRANTE.SESION,
      mensaje: "Tu sesión expiró. Volvé a iniciar sesión.",
      mensajeCampo: "",
    };
  }

  if (esCuentaNoActiva(error)) {
    return {
      tipo: TIPOS_ERROR_ELIMINAR_INTEGRANTE.CUENTA,
      mensaje: mensaje || "Tu cuenta no se encuentra activa.",
      mensajeCampo: "",
    };
  }

  if (status === 400) {
    return {
      tipo: TIPOS_ERROR_ELIMINAR_INTEGRANTE.MOTIVO,
      mensaje:
        mensajeCampo ||
        mensaje ||
        "El motivo de eliminación es obligatorio.",
      mensajeCampo,
    };
  }

  if (status === 403) {
    return {
      tipo: TIPOS_ERROR_ELIMINAR_INTEGRANTE.PERMISO,
      mensaje:
        mensaje ||
        "No tenés permiso para eliminar este miembro o no sos miembro activo.",
      mensajeCampo: "",
    };
  }

  if (status === 404) {
    if (/perfil\s*activo|no hay un perfil activo/i.test(mensaje)) {
      return {
        tipo: TIPOS_ERROR_ELIMINAR_INTEGRANTE.PERFIL_ACTIVO,
        mensaje:
          mensaje ||
          "No hay un perfil activo seleccionado en la sesión.",
        mensajeCampo: "",
      };
    }
    if (/perfil/i.test(mensaje)) {
      return {
        tipo: TIPOS_ERROR_ELIMINAR_INTEGRANTE.PERFIL_NO_ENCONTRADO,
        mensaje: mensaje || "El perfil no fue encontrado.",
        mensajeCampo: "",
      };
    }
    if (/miembro/i.test(mensaje)) {
      return {
        tipo: TIPOS_ERROR_ELIMINAR_INTEGRANTE.MIEMBRO_NO_ENCONTRADO,
        mensaje:
          mensaje ||
          "El miembro ya no existe en este proyecto.",
        mensajeCampo: "",
      };
    }
    if (/proyecto/i.test(mensaje)) {
      return {
        tipo: TIPOS_ERROR_ELIMINAR_INTEGRANTE.PROYECTO_NO_ENCONTRADO,
        mensaje: mensaje || "El proyecto no existe.",
        mensajeCampo: "",
      };
    }
    return {
      tipo: TIPOS_ERROR_ELIMINAR_INTEGRANTE.DESCONOCIDO,
      mensaje: mensaje || "No se encontró el recurso solicitado.",
      mensajeCampo: "",
    };
  }

  if (status === 409) {
    if (/vos mismo|darse de baja|autoelimin/i.test(mensaje)) {
      return {
        tipo: TIPOS_ERROR_ELIMINAR_INTEGRANTE.AUTOELIMINACION,
        mensaje:
          mensaje ||
          "No podés eliminarte a vos mismo del proyecto.",
        mensajeCampo: "",
      };
    }
    if (/al menos un director|.ltimo director|ultimo director/i.test(mensaje)) {
      return {
        tipo: TIPOS_ERROR_ELIMINAR_INTEGRANTE.ULTIMO_DIRECTOR,
        mensaje:
          mensaje ||
          "El proyecto debe conservar al menos un director activo.",
        mensajeCampo: "",
      };
    }
    if (/participaci.n activa|ya no tiene una participaci.n/i.test(mensaje)) {
      return {
        tipo: TIPOS_ERROR_ELIMINAR_INTEGRANTE.MIEMBRO_INACTIVO,
        mensaje:
          mensaje ||
          "El miembro ya no tiene una participación activa en el proyecto.",
        mensajeCampo: "",
      };
    }
    if (/publicados o confirmados|estado actual/i.test(mensaje)) {
      return {
        tipo: TIPOS_ERROR_ELIMINAR_INTEGRANTE.ESTADO_PROYECTO,
        mensaje:
          mensaje ||
          "El proyecto no se encuentra en un estado que permita dar de baja miembros.",
        mensajeCampo: "",
      };
    }
    return {
      tipo: TIPOS_ERROR_ELIMINAR_INTEGRANTE.DESCONOCIDO,
      mensaje: mensaje || "La operación ya no se puede completar.",
      mensajeCampo: "",
    };
  }

  return {
    tipo: TIPOS_ERROR_ELIMINAR_INTEGRANTE.DESCONOCIDO,
    mensaje:
      mensaje ||
      "Ocurrió un error al eliminar al miembro. Inténtalo nuevamente.",
    mensajeCampo: "",
  };
}
