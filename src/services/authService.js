import http from "./http";

const authService = {
  login(credenciales) {
    return http.post("/auth/login", credenciales);
  },

  registrar(datosUsuario) {
    return http.post("/auth/registro", datosUsuario);
  },
};

export default authService;