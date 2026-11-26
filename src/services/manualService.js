import http from "./http";

/**
 * Manual de usuario in-app. El backend filtra los capítulos según el rol
 * autenticado.
 */
export default {
  obtenerIndice() {
    return http.get("/ayuda/indice");
  },

  obtenerCapitulo(id) {
    return http.get(`/ayuda/capitulos/${encodeURIComponent(id)}`);
  },

  buscar(consulta) {
    return http.get("/ayuda/buscar", {
      params: { q: consulta },
    });
  },

  obtenerErrores() {
    return http.get("/ayuda/errores");
  },
};
