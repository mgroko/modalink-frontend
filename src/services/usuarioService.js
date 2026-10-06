import http from "./http";

let cacheProvincias = null;

const usuarioService = {
  actualizarDatosPersonales(datos) {
    return http.put("/usuario/datos-personales", datos);
  },

  /**
   * GET /usuario/ubicacion — ubicación del usuario logueado (del JWT).
   * Responde 200 con UbicacionResponse anidado, o 200 con cuerpo VACÍO
   * cuando el usuario no tiene ubicación (no es error ni 404).
   * @returns {Promise<{data: object|string}>} data vacío ("") = sin ubicación
   */
  obtenerUbicacion() {
    return http.get("/usuario/ubicacion");
  },

  /**
   * DELETE /usuario/ubicacion — quita la ubicación del usuario logueado.
   * @returns {Promise<void>} 204 No Content (sin body)
   */
  eliminarUbicacion() {
    return http.delete("/usuario/ubicacion");
  },

  /**
   * GET /ubicaciones/provincias — catálogo Georef (24 provincias, orden alfabético).
   * Los ids son Strings con ceros a la izquierda ("02", "06"); nunca numéricos.
   * Catálogo estático: se cachea por sesión.
   */
  listarProvincias({ forzarRecarga = false } = {}) {
    if (cacheProvincias && !forzarRecarga) {
      return Promise.resolve(cacheProvincias);
    }
    return http.get("/ubicaciones/provincias").then((response) => {
      cacheProvincias = response;
      return response;
    });
  },

  /**
   * GET /ubicaciones/localidades — filtro contains por nombre (case-insensitive)
   * y/o por provinciaId. Sin parámetros devuelve ~1.000 registros: siempre enviar
   * al menos `nombre` o `provinciaId`. `latitud`/`longitud` son solo informativas.
   */
  listarLocalidades({ provinciaId, nombre } = {}) {
    return http.get("/ubicaciones/localidades", { params: { provinciaId, nombre } });
  },

  solicitarBaja() {
    return http.post("/usuario/solicitar-baja");
  },

  reactivarCuenta() {
    return http.post("/usuario/reactivar-cuenta");
  },
};

export default usuarioService;
