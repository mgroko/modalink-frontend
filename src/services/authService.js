import http, { API_BASE_URL } from "./http";

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

  // Redirige al backend, que inicia el flujo OAuth2 con Google.
  iniciarSesionGoogle() {
    window.location.href = `${API_BASE_URL}/auth/google`;
  },

  // Datos de Google para prellenar el onboarding (ticket en cookie HttpOnly).
  obtenerRegistroPendienteGoogle() {
    return http.get("/auth/google/pendiente");
  },

  // Completa DNI, fecha de nacimiento y género; el backend emite el JWT.
  completarRegistroGoogle(datos) {
    return http.post("/auth/google/completar", datos);
  },

  cerrarSesion() {
    return http.post("/auth/logout");
  }
};

export default authService;