import { formatearFechasEnTexto } from "./fechas.js";

export function esSesionExpirada(error) {
  if (error?._esCuentaNoActiva) return false;
  // El interceptor marca `_esSesionExpirada` cuando un 403 implica que no hay
  // sesión. Un 403 con sesión es permiso/cuenta, no sesión vencida.
  return !!error?._esSesionExpirada || error?.response?.status === 401;
}

export function esCuentaNoActiva(error) {
  const codigo = error?.response?.data?.codigo;
  return !!error?._esCuentaNoActiva || codigo === "CUENTA_PENDIENTE_BAJA";
}

export function esErrorCsrf(error) {
  const codigo = error?.response?.data?.codigo;
  return codigo === "CSRF_INVALIDO" || !!error?._esCsrf;
}

/**
 * 404 que en realidad indica que no hay perfil activo en la sesión.
 * No debe interpretarse como publicación eliminada.
 * @param {unknown} error
 * @returns {boolean}
 */
export function esErrorPerfilActivo(error) {
  if (error?.response?.status !== 404) return false;
  const mensaje = String(error?.response?.data?.message || "");
  return /no hay un perfil activo|perfil activo seleccionado|seleccioná un perfil|seleccione un perfil/i.test(
    mensaje
  );
}

/**
 * 404 de publicación inexistente, no ACTIVA o con autor no visible.
 * @param {unknown} error
 * @returns {boolean}
 */
export function esErrorPublicacionNoDisponible(error) {
  if (error?.response?.status !== 404) return false;
  if (esErrorPerfilActivo(error)) return false;

  const mensaje = String(error?.response?.data?.message || "");
  return (
    /publicaci[oó]n/i.test(mensaje) ||
    /no se encontr[oó] la publicaci[oó]n/i.test(mensaje)
  );
}

/**
 * Clasifica los errores de contexto de UC-66.
 * @param {unknown} error
 * @returns {"SESION"|"CSRF"|"PERMISO"|"SIN_PERFIL"|"PERFIL_INACTIVO"|"PUBLICACION_NO_DISPONIBLE"|"DESCONOCIDO"}
 */
export function clasificarErrorPublicacion(error) {
  const status = error?.response?.status;
  const codigo = error?.response?.data?.codigo;

  if (status === 401 || error?._esSesionExpirada) return "SESION";
  if (esErrorCsrf(error)) return "CSRF";

  const mensaje = String(error?.response?.data?.message || "");
  if (
    status === 409 &&
    (codigo === "PERFIL_INACTIVO" || /perfil.*activo/i.test(mensaje))
  ) {
    return "PERFIL_INACTIVO";
  }

  if (esErrorPerfilActivo(error)) return "SIN_PERFIL";
  if (esErrorPublicacionNoDisponible(error)) {
    return "PUBLICACION_NO_DISPONIBLE";
  }
  if (status === 403) return "PERMISO";
  return "DESCONOCIDO";
}

/**
 * Mensaje de error de comentarios. Prioriza `errores.texto` porque el
 * backend puede devolver validación de DTO o un `message` de servicio.
 * @param {unknown} error
 * @param {string} [fallback]
 * @returns {string}
 */
export function mensajeErrorComentario(
  error,
  fallback = "No se pudo enviar el comentario."
) {
  const errores = error?.response?.data?.errores;
  if (errores && typeof errores === "object") {
    const texto = errores.texto || Object.values(errores).find(Boolean);
    if (texto) return formatearFechasEnTexto(texto);
  }
  return mensajeErrorApi(error, fallback);
}

export function mensajeErrorApi(error, fallback = "Ocurrió un error inesperado.") {
  const status = error?.response?.status;
  const mensajeBackend = formatearFechasEnTexto(
    error?.response?.data?.message
  );

  if (esSesionExpirada(error)) {
    return "Tu sesión expiró. Volvé a iniciar sesión.";
  }
  if (esCuentaNoActiva(error)) {
    return mensajeBackend || "Tu cuenta no se encuentra activa.";
  }
  if (esErrorCsrf(error)) {
    return "No se pudo validar la seguridad de la sesión. Recargá la página e intentá nuevamente.";
  }
  if (error?._esPermiso) {
    return mensajeBackend || "No tenés permisos para realizar esta acción.";
  }
  if (mensajeBackend) {
    return mensajeBackend;
  }
  if (!status || status >= 500) {
    return fallback;
  }
  return fallback;
}
