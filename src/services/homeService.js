import http from "./http";

const homeService = {
  /**
   * GET /home/resumen — perfil activo, proyectos/publicaciones destacados y
   * bloque de oportunidades abiertas.
   * @param {number} [limite=5] cantidad máxima de oportunidades (1..20)
   * @returns {Promise<{data: object}>}
   */
  obtenerResumen(limite = 5) {
    return http.get("/home/resumen", { params: { limite } });
  },

  obtenerPerfilActivo() {
    return http.get("/perfiles/activo");
  },
};

export default homeService;
