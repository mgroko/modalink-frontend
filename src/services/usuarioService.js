import http from "./http";

const usuarioService = {
  actualizarDatosPersonales(datos) {
    return http.put("/usuario/datos-personales", datos);
  },

  obtenerUbicacion() {
    return http.get("/usuario/ubicacion");
  },

  listarProvincias() {
    return http.get("/ubicaciones/provincias");
  },

  listarLocalidades({ provinciaId, nombre } = {}) {
    return http.get("/ubicaciones/localidades", { params: { provinciaId, nombre } });
  },

  solicitarBaja() {
    return http.post("/usuario/solicitar-baja");
  },

  reactivarCuenta() {
    return http.post("/usuario/reactivar-cuenta");
  },
};

export default usuarioService;
