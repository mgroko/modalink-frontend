import http from "./http";

const notificacionService = {
  listar({ idPerfilContexto = null, page = 0, size = 20 } = {}) {
    return http.get("/notificaciones", {
      params: {
        page,
        size,
        ...(idPerfilContexto != null ? { idPerfilContexto } : {}),
      },
    });
  },

  resumen(idPerfilContexto = null) {
    return http.get("/notificaciones/resumen", {
      params: idPerfilContexto != null ? { idPerfilContexto } : {},
    });
  },

  marcarLeida(idNotificacion) {
    return http.patch(`/notificaciones/${idNotificacion}/leida`, {});
  },

  marcarTodas(idPerfilContexto = null) {
    return http.patch("/notificaciones/leidas", {}, {
      params: idPerfilContexto != null ? { idPerfilContexto } : {},
    });
  },
};

export default notificacionService;
