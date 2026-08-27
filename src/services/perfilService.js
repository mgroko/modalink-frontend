import http from "./http";

const perfilService = {
  listarMisPerfiles() {
    return http.get("/usuarios/me/perfiles");
  },
};

export default perfilService;
