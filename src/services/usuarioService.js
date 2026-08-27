import http from "./http";

const usuarioService = {
  actualizarDatosPersonales(datos) {
    return http.put("/usuario/datos-personales", datos);
  },

  solicitarBaja() {
    return http.post("/usuario/solicitar-baja");
  },

  reactivarCuenta() {
    return http.post("/usuario/reactivar-cuenta");
  },
};

export default usuarioService;
