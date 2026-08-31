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

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    const isCsrfFailure = response?.status === 403;
    const alreadyRetried = config._csrfRetried;

    if (isCsrfFailure && !alreadyRetried && isMutatingMethod(config.method)) {
      config._csrfRetried = true;

      const freshToken = getCookieValue("XSRF-TOKEN");
      if (freshToken) {
        config.headers["X-XSRF-TOKEN"] = freshToken;
        return http(config); 
      }
    }

    return Promise.reject(error);
  }
);

export default http;
