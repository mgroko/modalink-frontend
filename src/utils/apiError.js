import { state } from "../services/authState";

export function esSesionExpirada(error) {
  return !!error?._esSesionExpirada || (error?.response?.status === 403 && !state.usuario);
}

export function esCuentaNoActiva(error) {
  return !!error?._esCuentaNoActiva || error?.response?.status === 401;
}

export function mensajeErrorApi(error, fallback = "Ocurrió un error inesperado.") {
  const status = error?.response?.status;
  const mensajeBackend = error?.response?.data?.message;

  if (error?._esSesionExpirada) {
    return "Tu sesión expiró. Volvé a iniciar sesión.";
  }
  if (error?._esCuentaNoActiva || status === 401) {
    return mensajeBackend || "Tu cuenta no se encuentra activa.";
  }
  if (error?._esCsrf) {
    return "No se pudo completar la operación. Recargá la página e intentá nuevamente.";
  }
  if (error?._esPermiso) {
    return "No tenés permisos para realizar esta acción.";
  }
  if (mensajeBackend) {
    return mensajeBackend;
  }
  if (!status || status >= 500) {
    return fallback;
  }
  return fallback;
}
