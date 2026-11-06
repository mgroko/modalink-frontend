import {
  esCuentaNoActiva,
  esSesionExpirada,
  mensajeErrorApi,
} from "./apiError.js";

/*
 * Reglas de presentación y errores de UC-40
 * (docs/backend/ficha-tecnica-darse-de-baja-proyecto.md).
 *
 * El backend es la fuente de verdad: `puedeDarseDeBaja` llega en
 * GET /proyectos/{idProyecto} y no se recalcula en el frontend.
 */

export const TIPOS_ERROR_DARSE_DE_BAJA = {
  SESION: "SESION",
  CUENTA: "CUENTA",
  MOTIVO: "MOTIVO",
  PERFIL_ACTIVO: "PERFIL_ACTIVO",
  PERMISO: "PERMISO",
  PROYECTO_NO_ENCONTRADO: "PROYECTO_NO_ENCONTRADO",
  ULTIMO_DIRECTOR: "ULTIMO_DIRECTOR",
  ESTADO_PROYECTO: "ESTADO_PROYECTO",
  MEMBRESIA_INACTIVA: "MEMBRESIA_INACTIVA",
  DESCONOCIDO: "DESCONOCIDO",
};

/**
 * Clasifica el error del POST /proyectos/{idProyecto}/baja según la matriz
 * UC-40 §8.3. El backend sólo envía `{ message, httpStatus, timestamp }` (o
 * `{ errores: { motivo } }` en validación), así que la clasificación de 403
 * y 409 se apoya en palabras clave del mensaje.
 *
 * @param {object} error error Axios
 * @returns {{tipo: string, mensaje: string, mensajeCampo: string}}
 */
export function clasificarErrorDarseDeBaja(error) {
  const status = error?.response?.status ?? null;
  const data = error?.response?.data;
  const payload = data && typeof data === "object" ? data : {};
  const mensajeBackend =
    typeof payload.message === "string" ? payload.message.trim() : "";
  const errores =
    payload.errores && typeof payload.errores === "object"
      ? payload.errores
      : {};
  const mensajeCampo =
    typeof errores.motivo === "string" ? errores.motivo.trim() : "";

  if (esSesionExpirada(error)) {
    return {
      tipo: TIPOS_ERROR_DARSE_DE_BAJA.SESION,
      mensaje: "Tu sesión expiró. Volvé a iniciar sesión.",
      mensajeCampo: "",
    };
  }

  if (esCuentaNoActiva(error)) {
    return {
      tipo: TIPOS_ERROR_DARSE_DE_BAJA.CUENTA,
      mensaje: mensajeBackend || "Tu cuenta no se encuentra activa.",
      mensajeCampo: "",
    };
  }

  if (status === 400) {
    return {
      tipo: TIPOS_ERROR_DARSE_DE_BAJA.MOTIVO,
      mensaje:
        mensajeCampo ||
        mensajeBackend ||
        "El motivo de la baja es obligatorio.",
      mensajeCampo,
    };
  }

  if (status === 403) {
    if (/perfil/i.test(mensajeBackend)) {
      return {
        tipo: TIPOS_ERROR_DARSE_DE_BAJA.PERFIL_ACTIVO,
        mensaje:
          mensajeBackend ||
          "No hay un perfil activo seleccionado para darse de baja.",
        mensajeCampo: "",
      };
    }

    return {
      tipo: TIPOS_ERROR_DARSE_DE_BAJA.PERMISO,
      mensaje:
        mensajeBackend ||
        "No tenés una membresía activa en este proyecto.",
      mensajeCampo: "",
    };
  }

  if (status === 404) {
    if (/proyecto/i.test(mensajeBackend)) {
      return {
        tipo: TIPOS_ERROR_DARSE_DE_BAJA.PROYECTO_NO_ENCONTRADO,
        mensaje: mensajeBackend || "El proyecto no existe.",
        mensajeCampo: "",
      };
    }

    if (/perfil/i.test(mensajeBackend)) {
      return {
        tipo: TIPOS_ERROR_DARSE_DE_BAJA.PERFIL_ACTIVO,
        mensaje:
          mensajeBackend ||
          "No hay un perfil activo seleccionado para darse de baja.",
        mensajeCampo: "",
      };
    }

    return {
      tipo: TIPOS_ERROR_DARSE_DE_BAJA.DESCONOCIDO,
      mensaje: mensajeBackend || "No se encontró el recurso solicitado.",
      mensajeCampo: "",
    };
  }

  if (status === 409) {
    if (/[uú]ltimo director|al menos un director|director activo/i.test(mensajeBackend)) {
      return {
        tipo: TIPOS_ERROR_DARSE_DE_BAJA.ULTIMO_DIRECTOR,
        mensaje:
          mensajeBackend ||
          "El proyecto debe conservar al menos un director activo.",
        mensajeCampo: "",
      };
    }

    if (/publicad|confirmad|estado actual|estado del proyecto/i.test(mensajeBackend)) {
      return {
        tipo: TIPOS_ERROR_DARSE_DE_BAJA.ESTADO_PROYECTO,
        mensaje:
          mensajeBackend ||
          "El proyecto no se encuentra en un estado que permita darse de baja.",
        mensajeCampo: "",
      };
    }

    return {
      tipo: TIPOS_ERROR_DARSE_DE_BAJA.MEMBRESIA_INACTIVA,
      mensaje:
        mensajeBackend ||
        "Ya no tenés una participación activa en este proyecto.",
      mensajeCampo: "",
    };
  }

  return {
    tipo: TIPOS_ERROR_DARSE_DE_BAJA.DESCONOCIDO,
    mensaje: mensajeErrorApi(
      error,
      "No se pudo completar la baja. Inténtalo nuevamente."
    ),
    mensajeCampo: "",
  };
}
