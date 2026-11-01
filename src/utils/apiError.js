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

export function mensajeErrorApi(error, fallback = "Ocurrió un error inesperado.") {
  const status = error?.response?.status;
  const mensajeBackend = error?.response?.data?.message;

  if (esSesionExpirada(error)) {
    return "Tu sesión expiró. Volvé a iniciar sesión.";
  }
  if (esCuentaNoActiva(error)) {
    return mensajeBackend || "Tu cuenta no se encuentra activa.";
  }
  if (error?._esCsrf) {
    return "No se pudo completar la operación. Recargá la página e intentá nuevamente.";
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
