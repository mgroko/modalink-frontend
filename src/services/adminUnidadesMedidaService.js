import http from "./http";

const BASE_URL = "/admin/unidades-medida";

const adminUnidadesMedidaService = {
  listar(tipoDato) {
    return http.get(BASE_URL, { params: tipoDato ? { tipoDato } : {} });
  },

  obtener(idUnidad) {
    return http.get(`${BASE_URL}/${idUnidad}`);
  },

  crear(unidad) {
    return http.post(BASE_URL, unidad);
  },

  actualizar(idUnidad, unidad) {
    return http.put(`${BASE_URL}/${idUnidad}`, unidad);
  },

  eliminar(idUnidad) {
    return http.delete(`${BASE_URL}/${idUnidad}`);
  },
};

export default adminUnidadesMedidaService;
