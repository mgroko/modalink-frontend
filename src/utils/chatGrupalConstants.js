import { mensajeErrorApi } from "./apiError";
import { LARGO_MAXIMO_MENSAJE } from "./mensajeConstants";

/*
 * Constantes y errores del chat grupal por proyecto (UC-41).
 */

export { LARGO_MAXIMO_MENSAJE };

export const TAMANO_MENSAJES_GRUPALES = 50;

export const CODIGOS_ERROR_CHAT_GRUPAL = Object.freeze({
  MENSAJE_INVALIDO: "MENSAJE_INVALIDO",
  PROYECTO_NO_ENCONTRADO: "PROYECTO_NO_ENCONTRADO",
  CHAT_GRUPAL_SOLO_LECTURA: "CHAT_GRUPAL_SOLO_LECTURA",
  CHAT_GRUPAL_NO_PERMITIDO: "CHAT_GRUPAL_NO_PERMITIDO",
});

export function mensajeErrorChatGrupal(
  error,
  fallback = "No se pudo completar la operación."
) {
  const codigo = error?.response?.data?.codigo;

  switch (codigo) {
    case CODIGOS_ERROR_CHAT_GRUPAL.MENSAJE_INVALIDO:
      return (
        error?.response?.data?.message ||
        "El mensaje no puede estar vacío ni superar los 1000 caracteres."
      );
    case CODIGOS_ERROR_CHAT_GRUPAL.PROYECTO_NO_ENCONTRADO:
      return (
        error?.response?.data?.message ||
        "El proyecto ya no está disponible."
      );
    case CODIGOS_ERROR_CHAT_GRUPAL.CHAT_GRUPAL_SOLO_LECTURA:
      return (
        error?.response?.data?.message ||
        "El proyecto ya no admite mensajes nuevos. Podés leer el historial."
      );
    case CODIGOS_ERROR_CHAT_GRUPAL.CHAT_GRUPAL_NO_PERMITIDO:
      return (
        error?.response?.data?.message ||
        "No podés enviar mensajes en este chat en este momento."
      );
    default:
      return mensajeErrorApi(error, fallback);
  }
}

export function esErrorSoloLectura(error) {
  return (
    error?.response?.data?.codigo ===
    CODIGOS_ERROR_CHAT_GRUPAL.CHAT_GRUPAL_SOLO_LECTURA
  );
}

export function esErrorChatNoPermitido(error) {
  return (
    error?.response?.data?.codigo ===
    CODIGOS_ERROR_CHAT_GRUPAL.CHAT_GRUPAL_NO_PERMITIDO
  );
}
