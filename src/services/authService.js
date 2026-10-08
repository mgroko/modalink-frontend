import http from "./http";

const authService = {

  obtenerSesion() {
    return http.get("/auth/me");
  },

  login(credenciales) {
    return http.post("/auth/login", credenciales);
  },

  // POST /auth/reactivar-cuenta: sin sesión previa, reenvía credenciales;
  // reactiva la cuenta y devuelve AuthResponse + cookie de sesión en el mismo paso.
  reactivarCuentaDesdeLogin(credenciales) {
    return http.post("/auth/reactivar-cuenta", credenciales);
  },

  registrar(datosUsuario) {
    return http.post("/auth/registro", datosUsuario);
  },

  recuperarPassword(correo) {
  return http.post('/auth/recuperar-password', { correo });
  },

  cerrarSesion() {
    return http.post("/auth/logout");
  }
};

export default authService;