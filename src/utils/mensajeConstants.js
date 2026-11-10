import { mensajeErrorApi } from "./apiError";

/*
 * Constantes y mensajes del módulo de mensajería privada (UC-42).
 */

export const LARGO_MAXIMO_MENSAJE = 1000;

export const TAMANO_CONVERSACIONES = 20;
export const TAMANO_MENSAJES = 50;
export const TAMANO_CONTACTOS = 50;

// "Escribiendo…" es efímero: el cliente repite el aviso mientras haya texto y
// el receptor lo apaga solo si deja de recibirlo.
export const ESCRIBIENDO_TTL_MS = 4000;
export const ESCRIBIENDO_REPETIR_MS = 3000;
export const ESCRIBIENDO_IDLE_MS = 2500;

export const FILTROS_CONVERSACIONES = Object.freeze([
  { value: "todos", label: "Todos" },
  { value: "no-leidos", label: "No leídos" },
  { value: "en-linea", label: "En línea" },
]);

export const CODIGOS_ERROR_MENSAJERIA = Object.freeze({
  MENSAJE_INVALIDO: "MENSAJE_INVALIDO",
  CONVERSACION_NO_ENCONTRADA: "CONVERSACION_NO_ENCONTRADA",
  PERFIL_NO_ENCONTRADO: "PERFIL_NO_ENCONTRADO",
  CONVERSACION_NO_PERMITIDA: "CONVERSACION_NO_PERMITIDA",
  MENSAJE_NO_PERMITIDO: "MENSAJE_NO_PERMITIDO",
});

export function mensajeErrorMensajeria(
  error,
  fallback = "No se pudo completar la operación."
) {
  const codigo = error?.response?.data?.codigo;

  switch (codigo) {
    case CODIGOS_ERROR_MENSAJERIA.MENSAJE_INVALIDO:
      return (
        error?.response?.data?.message ||
        "El mensaje no puede estar vacío ni superar los 1000 caracteres."
      );
    case CODIGOS_ERROR_MENSAJERIA.CONVERSACION_NO_PERMITIDA:
      return (
        error?.response?.data?.message ||
        "No podés iniciar una conversación con este perfil. Necesitás una conexión activa."
      );
    case CODIGOS_ERROR_MENSAJERIA.MENSAJE_NO_PERMITIDO:
      return (
        error?.response?.data?.message ||
        "La conexión ya no está activa. Podés leer el historial, pero no enviar mensajes."
      );
    case CODIGOS_ERROR_MENSAJERIA.CONVERSACION_NO_ENCONTRADA:
      return (
        error?.response?.data?.message ||
        "La conversación ya no está disponible."
      );
    case CODIGOS_ERROR_MENSAJERIA.PERFIL_NO_ENCONTRADO:
      return (
        error?.response?.data?.message || "El perfil ya no está disponible."
      );
    default:
      return mensajeErrorApi(error, fallback);
  }
}

export function esErrorConexionNoPermitida(error) {
  return (
    error?.response?.data?.codigo ===
    CODIGOS_ERROR_MENSAJERIA.CONVERSACION_NO_PERMITIDA
  );
}

export function esErrorMensajeNoPermitido(error) {
  return (
    error?.response?.data?.codigo ===
    CODIGOS_ERROR_MENSAJERIA.MENSAJE_NO_PERMITIDO
  );
}

export function esErrorConversacionNoEncontrada(error) {
  return (
    error?.response?.data?.codigo ===
    CODIGOS_ERROR_MENSAJERIA.CONVERSACION_NO_ENCONTRADA
  );
}
