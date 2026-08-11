import axios from "axios";

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

export default http;
