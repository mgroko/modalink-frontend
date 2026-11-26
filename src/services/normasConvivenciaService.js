import http from "./http";

/**
 * Contenido público de las normas de convivencia. No requiere sesión.
 */
export default {
  obtenerVigente() {
    return http.get("/normas-convivencia/vigente");
  },

  obtenerVersiones() {
    return http.get("/normas-convivencia/versiones");
  },

  obtenerVersion(version) {
    return http.get(
      `/normas-convivencia/versiones/${encodeURIComponent(version)}`
    );
  },
};
