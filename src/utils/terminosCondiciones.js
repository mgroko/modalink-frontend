import { formatearFechaCorta } from "./fechas.js";
import {
  esCuentaNoActiva,
  esSesionExpirada,
} from "./apiError.js";

/*
 * Reglas y textos de UC-23 (términos y condiciones del perfil).
 * El backend es la fuente de verdad: acá sólo se normaliza el DTO, se
 * valida lo que el usuario escribe y se clasifican errores para la UI.
 */

export const LIMITE_DESCRIPCION_TERMINOS = 5000;

export const CODIGOS_ERROR_TERMINOS = {
  NO_ACEPTADOS: "TERMINOS_NO_ACEPTADOS",
  DESACTUALIZADOS: "TERMINOS_DESACTUALIZADOS",
  NO_VIGENTES: "TERMINOS_NO_VIGENTES",
};

export const TIPOS_ERROR_TERMINOS = {
  SESION: "SESION",
  CUENTA: "CUENTA",
  PERMISO: "PERMISO",
  NO_ENCONTRADO: "NO_ENCONTRADO",
  PERFIL_INACTIVO: "PERFIL_INACTIVO",
  VALIDACION: "VALIDACION",
  TERMINOS: "TERMINOS",
  SERVIDOR: "SERVIDOR",
  DESCONOCIDO: "DESCONOCIDO",
};

const FORMATO_NUMERO = new Intl.NumberFormat("es-AR");

/**
 * Normaliza el DTO de T&C sin inventar datos.
 * @param {object|null|undefined} data
 * @returns {{
 *   idPerfil: number|null,
 *   idTyc: number|null,
 *   descripcion: string,
 *   fechaInicio: string|null,
 *   fechaFin: string|null,
 *   esPlantilla: boolean
 * }}
 */
export function normalizarTerminos(data) {
  const idPerfil = Number(data?.idPerfil);
  const idTyc = Number(data?.idTyc);
  return {
    idPerfil: Number.isFinite(idPerfil) ? idPerfil : null,
    idTyc: Number.isFinite(idTyc) && idTyc > 0 ? idTyc : null,
    descripcion: String(data?.descripcion ?? ""),
    fechaInicio: data?.fechaInicio || null,
    fechaFin: data?.fechaFin || null,
    esPlantilla: data?.esPlantilla === true,
  };
}

/**
 * ¿El perfil todavía no convirtió la plantilla en una versión propia?
 * @param {object|null|undefined} terminos
 * @returns {boolean}
 */
export function esTerminosPlantilla(terminos) {
  if (!terminos) return true;
  return terminos.esPlantilla === true || terminos.idTyc == null;
}

/**
 * Valida el texto que se enviará al backend.
 * @param {string} descripcion
 * @returns {boolean}
 */
export function descripcionTerminosValida(descripcion) {
  const texto = String(descripcion ?? "").trim();
  return texto.length > 0 && texto.length <= LIMITE_DESCRIPCION_TERMINOS;
}

/**
 * Texto de vigencia para la vista pública.
 * @param {object|null|undefined} terminos
 * @returns {string}
 */
export function textoVigenciaTerminos(terminos) {
  if (!terminos) return "";
  if (esTerminosPlantilla(terminos)) return "Plantilla base del sistema";
  if (terminos.fechaInicio) {
    return `Vigente desde ${formatearFechaCorta(terminos.fechaInicio)}`;
  }
  return "Vigente";
}

/**
 * Contador con separador de miles es-AR (5.000).
 * @param {number} cantidad
 * @returns {string}
 */
export function contadorCaracteres(cantidad) {
  return FORMATO_NUMERO.format(Number(cantidad) || 0);
}

/**
 * Extrae el error de campo de un 400 de validación.
 * Contrato: `errores.descripcion`.
 * @param {object|null|undefined} error Axios error
 * @returns {string}
 */
export function extraerErrorDescripcion(error) {
  const data = error?.response?.data;
  const campo = data?.errores?.descripcion;
  if (typeof campo === "string" && campo.trim()) return campo.trim();

  const mensaje = String(data?.message || "").trim();
  return mensaje && mensaje !== "Validación fallida" ? mensaje : "";
}

/**
 * ¿Se puede guardar con el estado actual del editor?
 * - No si está guardando, vacío o supera el límite.
 * - No si ya hay versión y el texto no cambió (comparado sin extremos).
 * - Sí si es plantilla, aunque el texto sea igual: el primer PUT la persiste.
 * @param {object} opciones
 * @returns {boolean}
 */
export function puedeGuardarTerminos({
  descripcion,
  originalDescripcion,
  esPlantilla,
  guardando = false,
} = {}) {
  if (guardando) return false;
  if (!descripcionTerminosValida(descripcion)) return false;
  if (esPlantilla) return true;
  return (
    String(descripcion ?? "").trim() !==
    String(originalDescripcion ?? "").trim()
  );
}

/**
 * Clasifica el error del GET/PUT de configuración.
 * @param {object|null|undefined} error Axios error
 * @returns {{ tipo: string, mensaje: string, mensajeCampo: string, status: number|null }}
 */
export function clasificarErrorTerminos(error) {
  const status = Number(error?.response?.status) || null;
  const data = error?.response?.data || {};
  const mensaje = String(data?.message || "").trim();

  if (esSesionExpirada(error)) {
    return {
      tipo: TIPOS_ERROR_TERMINOS.SESION,
      mensaje: "Tu sesión expiró. Volvé a iniciar sesión.",
      mensajeCampo: "",
      status,
    };
  }

  if (esCuentaNoActiva(error)) {
    return {
      tipo: TIPOS_ERROR_TERMINOS.CUENTA,
      mensaje: mensaje || "Tu cuenta no se encuentra activa.",
      mensajeCampo: "",
      status,
    };
  }

  if (status === 400) {
    return {
      tipo: TIPOS_ERROR_TERMINOS.VALIDACION,
      mensaje: mensaje || "Revisá el texto ingresado.",
      mensajeCampo: extraerErrorDescripcion(error),
      status,
    };
  }

  if (status === 403) {
    return {
      tipo: TIPOS_ERROR_TERMINOS.PERMISO,
      mensaje: mensaje || "No tenés permisos para configurar estos términos.",
      mensajeCampo: "",
      status,
    };
  }

  if (status === 404) {
    return {
      tipo: TIPOS_ERROR_TERMINOS.NO_ENCONTRADO,
      mensaje:
        mensaje ||
        "El perfil no está disponible o no se puede acceder a sus términos.",
      mensajeCampo: "",
      status,
    };
  }

  if (status === 409) {
    return {
      tipo: TIPOS_ERROR_TERMINOS.PERFIL_INACTIVO,
      mensaje: mensaje || "El perfil no se encuentra activo.",
      mensajeCampo: "",
      status,
    };
  }

  if (!status || status >= 500) {
    return {
      tipo: TIPOS_ERROR_TERMINOS.SERVIDOR,
      mensaje:
        mensaje || "No se pudieron guardar los términos. Intentá nuevamente.",
      mensajeCampo: "",
      status,
    };
  }

  return {
    tipo: TIPOS_ERROR_TERMINOS.DESCONOCIDO,
    mensaje: mensaje || "Ocurrió un error inesperado.",
    mensajeCampo: "",
    status,
  };
}

/**
 * ¿El error es un 409 de aceptación de T&C?
 * @param {object|null|undefined} error
 * @returns {boolean}
 */
export function esErrorTerminos(error) {
  const data = error?.response?.data;
  if (Number(error?.response?.status) !== 409) return false;
  return Object.values(CODIGOS_ERROR_TERMINOS).includes(data?.codigo);
}

/**
 * Normaliza el body de un 409 de aceptación. La respuesta ya trae la versión
 * vigente; no hace falta rehacer el GET para mostrarla.
 * @param {object|null|undefined} error
 * @returns {{
 *   codigo: string,
 *   mensaje: string,
 *   idPerfil: number|null,
 *   idTycVigente: number|null,
 *   descripcionVigente: string,
 *   esPlantilla: boolean
 * }}
 */
export function datosErrorTerminos(error) {
  const data = error?.response?.data || {};
  const idPerfil = Number(data?.idPerfil);
  const idTycVigente = Number(data?.idTycVigente);
  return {
    codigo: String(data?.codigo || ""),
    mensaje: String(data?.message || "").trim(),
    idPerfil: Number.isFinite(idPerfil) ? idPerfil : null,
    idTycVigente:
      Number.isFinite(idTycVigente) && idTycVigente > 0
        ? idTycVigente
        : null,
    descripcionVigente: String(data?.descripcionVigente || ""),
    esPlantilla: data?.esPlantilla === true,
  };
}

/**
 * Construye la aceptación de un perfil.
 * Si no hay versión (idTyc null), devuelve `{ idTyc: null, aceptaTerminos:
 * false }` para el batch; el llamador decide si omite el bloque en el caso
 * individual.
 * @param {{ idTyc?: number|string|null, aceptaTerminos?: boolean }} aceptacion
 * @returns {{ idTyc: number|null, aceptaTerminos: boolean }}
 */
export function construirAceptacionTerminos({
  idTyc = null,
  aceptaTerminos = false,
} = {}) {
  const id = Number(idTyc);
  const tieneVersion = Number.isFinite(id) && id > 0;
  return {
    idTyc: tieneVersion ? id : null,
    aceptaTerminos: tieneVersion && aceptaTerminos === true,
  };
}
