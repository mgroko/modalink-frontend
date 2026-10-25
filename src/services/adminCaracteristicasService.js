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

  actualizarValor(idCaracteristica, idValor, valor) {
    return http.put(
      `/admin/caracteristicas-tecnicas/${idCaracteristica}/valores/${idValor}`,
      valor
    );
  },

  eliminarValor(idCaracteristica, idValor) {
    return http.delete(`/admin/caracteristicas-tecnicas/${idCaracteristica}/valores/${idValor}`);
  },

  listarProfesiones() {
    return http.get("/profesiones");
  },
};

export default adminCaracteristicasService;
