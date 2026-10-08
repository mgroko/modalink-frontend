import http from "./http";

const adminCaracteristicasService = {
  listar() {
    return http.get("/admin/caracteristicas-tecnicas");
  },

  crear(caracteristica) {
    return http.post("/admin/caracteristicas-tecnicas", caracteristica);
  },

  actualizar(idCaracteristica, caracteristica) {
    return http.put(`/admin/caracteristicas-tecnicas/${idCaracteristica}`, caracteristica);
  },

  eliminar(idCaracteristica) {
    return http.delete(`/admin/caracteristicas-tecnicas/${idCaracteristica}`);
  },

  agregarValor(idCaracteristica, valor) {
    return http.post(`/admin/caracteristicas-tecnicas/${idCaracteristica}/valores`, valor);
  },

  actualizarValor(idValor, valor) {
    return http.put(`/admin/caracteristicas-tecnicas/valores/${idValor}`, valor);
  },

  eliminarValor(idValor) {
    return http.delete(`/admin/caracteristicas-tecnicas/valores/${idValor}`);
  },

  listarProfesiones() {
    return http.get("/profesiones");
  },
};

export default adminCaracteristicasService;
