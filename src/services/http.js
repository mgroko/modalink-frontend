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

export const API_BASE_URL = "http://localhost:8080";

const http = axios.create({
  baseURL: API_BASE_URL,
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

    // 401: sesión ausente o vencida. Se limpia el estado local y se redirige
    // a login (la cuenta PENDIENTE_BAJA llega como 403 con código).
    if (status === 401) {
      error._esSesionExpirada = true;
      limpiarSesion();
      await redirigirALogin();
      return Promise.reject(error);
    }

    // 403 de cuenta pendiente de baja: no es un problema de CSRF ni de
    // permisos del proyecto, así que no se reintenta ni se redirige.
    if (status === 403 && response?.data?.codigo === "CUENTA_PENDIENTE_BAJA") {
      error._esCuentaNoActiva = true;
      return Promise.reject(error);
    }

    const mensaje403 = String(response?.data?.message || "");
    const codigo403 = response?.data?.codigo;
    // Distinguir permiso de CSRF usando el mensaje/código del backend.
    const parecePermiso403 =
      codigo403 === "ACCESO_DENEGADO" ||
      /permiso|no ten[eé]s|acceso denegado|prohibido|no (?:sos|eres) miembro|director activo|membres[ií]a/i.test(
        mensaje403
      );

    // 403 en métodos mutantes: primero, reintento con el token CSRF vigente.
    // Un 403 de permiso no se reintenta: el backend ya respondió.
    if (
      status === 403 &&
      !parecePermiso403 &&
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

      // Ante la duda, un 403 mutante sigue tratándose como CSRF para no
      // romper el reintento de token.
      error._esCsrf = !parecePermiso403 && isMutatingMethod(config.method);
      error._esPermiso = parecePermiso403 || !isMutatingMethod(config.method);
    }

    return Promise.reject(error);
  }
);

export default http;
