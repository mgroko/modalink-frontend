import http, { API_BASE_URL } from "./http";

/*
 * Contrato de presencia por perfil (extensión de Mi red).
 */

const CLAVE_CLIENTE = "modalink.presenciaClientId";

function generarClienteId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `presencia-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Identificador estable por pestaña. Permite que el backend cierre el stream
 * anterior cuando el navegador reconecta, en lugar de dejar emisores huérfanos.
 * @returns {string|null}
 */
function obtenerClienteId() {
  try {
    let id = sessionStorage.getItem(CLAVE_CLIENTE);
    if (!id) {
      id = generarClienteId();
      sessionStorage.setItem(CLAVE_CLIENTE, id);
    }
    return id;
  } catch {
    return null;
  }
}

const presenciaService = {
  /**
   * POST /presencia/heartbeat — sin body.
   * @returns {Promise<{data: null}>} 204 No Content
   */
  heartbeat() {
    return http.post("/presencia/heartbeat");
  },

  /**
   * GET /presencia?idsPerfil=12,18 — snapshot de hasta 200 perfiles.
   * @param {Array<number|string>} idsPerfil
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: Array<{idPerfil: number, enLinea: boolean}>}>}
   */
  consultar(idsPerfil, signal) {
    return http.get("/presencia", {
      params: { idsPerfil: idsPerfil.join(",") },
      signal,
    });
  },

  /**
   * URL del stream SSE. El consumo se hace con EventSource.
   * @param {Array<number|string>} idsPerfil
   * @returns {string}
   */
  streamUrl(idsPerfil) {
    const ids = encodeURIComponent(idsPerfil.join(","));
    const clientId = obtenerClienteId();
    const cliente = clientId
      ? `&clientId=${encodeURIComponent(clientId)}`
      : "";
    return `${API_BASE_URL}/presencia/stream?idsPerfil=${ids}${cliente}`;
  },
};

export default presenciaService;
