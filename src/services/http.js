import axios from "axios";
import { state, limpiarSesion } from "./authState";

function getCookieValue(name) {
  const cookie = document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.split("=").slice(1).join("=")) : null;
}

function isMutatingMethod(method) {
  return ["post", "put", "patch", "delete"].includes((method || "").toLowerCase());
}

function esRutaAuth(url = "") {
  return url.startsWith("/auth");
}

const http = axios.create({
  baseURL: "http://localhost:8080",
  withCredentials: true,
});

http.interceptors.request.use((config) => {
  if (isMutatingMethod(config.method)) {
    const csrfToken = getCookieValue("XSRF-TOKEN");

    if (csrfToken) {
      config.headers["X-XSRF-TOKEN"] = csrfToken;
    }
  }

  return config;
});

// Verificación autoritativa de la sesión: el estado local puede quedar desactualizado.
async function sesionActiva() {
  if (!state.usuario) return false;
  try {
    const response = await http.get("/auth/me");
    return !!response?.data;
  } catch {
    return false;
  }
}

async function redirigirALogin() {
  try {
    const { default: router } = await import("../router");
    const actual = router.currentRoute.value;
    if (actual?.name !== "login") {
      router.push({ name: "login", query: { redirect: actual.fullPath } });
    }
  } catch {
    // Si el router no está disponible, no se redirige.
  }
}

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    const status = response?.status;
    const url = config?.url || "";

    if (esRutaAuth(url)) {
      return Promise.reject(error);
    }

    // 401: el filtro JWT lo deja pasar pero el servicio exige usuario ACTIVO
    // (ej. cuenta PENDIENTE_BAJA). No es un problema de sesión.
    if (status === 401) {
      error._esCuentaNoActiva = true;
      return Promise.reject(error);
    }

    // 403 en métodos mutantes: primero, reintento con el token CSRF vigente.
    if (
      status === 403 &&
      isMutatingMethod(config.method) &&
      !config._csrfRetried
    ) {
      config._csrfRetried = true;
      const freshToken = getCookieValue("XSRF-TOKEN");
      if (freshToken) {
        config.headers["X-XSRF-TOKEN"] = freshToken;
        return http(config);
      }
    }

    // 403: sin sesión (o con sesión pero sin permiso / con CSRF inválido).
    if (status === 403) {
      const haySesion = await sesionActiva();

      if (!haySesion) {
        error._esSesionExpirada = true;
        limpiarSesion();
        await redirigirALogin();
        return Promise.reject(error);
      }

      error._esCsrf = isMutatingMethod(config.method);
      error._esPermiso = !error._esCsrf;
    }

    return Promise.reject(error);
  }
);

export default http;
