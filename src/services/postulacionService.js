import http from "./http";
import { serializarParams } from "../utils/queryParams.js";

/*
 * Contrato UC-74/UC-34 — Buscar y gestionar postulaciones.
 * Docs: docs/backend/ficha-tecnica-buscar-postulaciones.md y
 *       docs/backend/ficha-tecnica-gestionar-postulaciones.md
 * Tipos JSDoc puro: documentan el shape para el editor, sin tooling TS.
 */

/**
 * @typedef {Object} PostulacionBusquedaResponse
 * @property {number} idPostulacion id de la tabla general o de actividad
 * @property {"GENERAL"|"ACTIVIDAD"} tipo
 * @property {"PENDIENTE"|"ACEPTADA"|"RECHAZADA"} estado
 * @property {string} fechaPostulacion ISO-8601 del servidor
 * @property {number} idPerfil
 * @property {string} nombreArtistico
 * @property {number} idProfesion
 * @property {string} nombreProfesion
 * @property {number} idRequerimiento idRequerimientoGral o de actividad
 * @property {string|null} descripcionRequerimiento
 * @property {number|null} idActividad sólo en tipo ACTIVIDAD
 * @property {string|null} nombreActividad sólo en tipo ACTIVIDAD
 * @property {number} cantidadRequerida cupo total del requerimiento
 * @property {number} cubiertos miembros/asignaciones activos
 * @property {number} faltantes max(0, cantidadRequerida - cubiertos)
 * @property {boolean} satisfecho cubiertos >= cantidadRequerida
 * @property {boolean} aportaCupo true si está ACEPTADA y su vínculo sigue activo
 * @property {boolean} puedeAceptar sugerencia de UI; el sistema revalida
 * @property {boolean} puedeRechazar sugerencia de UI; el sistema revalida
 */

/**
 * @typedef {Object} PaginaPostulacionesResponse
 * @property {PostulacionBusquedaResponse[]} contenido
 * @property {number} paginaActual base 0
 * @property {number} tamanoPagina
 * @property {number} totalElementos
 * @property {number} totalPaginas
 * @property {boolean} primera
 * @property {boolean} ultima
 */

/**
 * @typedef {Object} BuscarPostulacionesParams
 * @property {string|string[]} [estado] PENDIENTE | ACEPTADA | RECHAZADA
 *           (repetible: `estado=PENDIENTE&estado=ACEPTADA`)
 * @property {"GENERAL"|"ACTIVIDAD"} [tipo]
 * @property {string} [nombrePerfil] búsqueda parcial por nombre artístico
 * @property {number} [idProfesion]
 * @property {string} [fechaDesde] YYYY-MM-DD
 * @property {string} [fechaHasta] YYYY-MM-DD
 * @property {number} [page] base 0, default 0
 * @property {number} [size] default 20
 * @property {boolean} [todos] true = sin paginar
 */

/**
 * @typedef {Object} AdvertenciaSobrecompromiso
 *   UC-34 + ficha v2 §5.5. No bloquea la aceptación: son ventanas CPM
 *   superpuestas con otras actividades del mismo profesional en otros
 *   proyectos, todavía sin horario persistido.
 * @property {number} idActividad
 * @property {string} nombreActividad
 * @property {number} idProyecto
 * @property {string} nombreProyecto
 * @property {string} inicioPotencial ISO local
 * @property {string} finPotencial ISO local
 */

/**
 * Respuesta de aceptar/rechazar. En un rechazo `idMiembro` e
 * `idAsignacionActividad` son null. Los campos de preferencia y advertencias
 * sólo aplican a la aceptación de postulaciones de actividad (ficha v2 §5).
 * @typedef {Object} PostulacionGestionadaResponse
 * @property {number} idPostulacion
 * @property {"GENERAL"|"ACTIVIDAD"} tipo
 * @property {"ACEPTADA"|"RECHAZADA"} estado
 * @property {number} idProyecto
 * @property {number} idRequerimiento
 * @property {number} idPerfil
 * @property {number|null} idMiembro
 * @property {number|null} idAsignacionActividad
 * @property {"SIN_PREFERENCIA"|"EXACTO"|"DESVIO"|"SIN_LUGAR"|null} [resultadoPreferencia]
 * @property {number|null} [desvioMinutos] negativo = antes del preferido;
 *           positivo = después; null sin preferencia
 * @property {AdvertenciaSobrecompromiso[]} [advertencias] no bloqueantes
 */

/**
 * @typedef {Object} MiPostulacionResponse
 *   UC-27. Postulación propia del perfil activo, en cualquier proyecto.
 * @property {number} idPostulacion
 * @property {"GENERAL"|"ACTIVIDAD"} tipo
 * @property {"PENDIENTE"|"ACEPTADA"|"RECHAZADA"} estado
 * @property {string} fechaPostulacion ISO-8601 del servidor
 * @property {number} idProyecto
 * @property {string} nombreProyecto
 * @property {number} idRequerimiento idRequerimientoGral o de actividad
 * @property {number} [cantidad] cantidad solicitada en el requerimiento
 * @property {string} [nombreProfesion] profesión del requerimiento
 * @property {string|null} descripcionRequerimiento
 * @property {number|null} idActividad sólo en tipo ACTIVIDAD
 * @property {string|null} nombreActividad sólo en tipo ACTIVIDAD
 * @property {boolean} puedeDarseDeBaja true sólo en PENDIENTE
 */

/**
 * @typedef {Object} PaginaMisPostulacionesResponse
 * @property {MiPostulacionResponse[]} contenido
 * @property {number} paginaActual base 0
 * @property {number} tamanoPagina
 * @property {number} totalElementos
 * @property {number} totalPaginas
 * @property {boolean} primera
 * @property {boolean} ultima
 */

/**
 * @typedef {Object} BuscarMisPostulacionesParams
 * @property {number|string} [idProyecto] acota a un proyecto
 * @property {string} [estado] PENDIENTE | ACEPTADA | RECHAZADA
 * @property {"GENERAL"|"ACTIVIDAD"} [tipo]
 * @property {number} [page] base 0, default 0
 * @property {number} [size] default 20
 * @property {boolean} [todos] true = sin paginar
 */

const postulacionService = {
  /**
   * GET /proyectos/{idProyecto}/postulaciones/buscar — UC-74.
   * Listado acotado al proyecto, ordenado por estado (PENDIENTE → ACEPTADA →
   * RECHAZADA) y fecha descendente. Requiere perfil director activo con el
   * permiso GESTIONAR_POSTULACIONES.
   *
   * Errores:
   * - 400 rango de fechas inválido ("La fecha desde no puede ser posterior a
   *   la fecha hasta.")
   * - 401 cuenta no activa
   * - 403 no es director o no tiene GESTIONAR_POSTULACIONES
   * - 404 PerfilActivoNoSeleccionadoException / proyecto inexistente
   * @param {number|string} idProyecto
   * @param {BuscarPostulacionesParams} [params]
   * @param {AbortSignal} [signal] cancela la búsqueda en vuelo
   * @returns {Promise<{data: PaginaPostulacionesResponse}>} 200 OK
   */
  buscar(idProyecto, params = {}, signal) {
    const query = serializarParams(params);
    const url = `/proyectos/${idProyecto}/postulaciones/buscar${
      query ? `?${query}` : ""
    }`;
    return http.get(url, { signal });
  },

  /**
   * GET /postulaciones/mias — UC-27.
   * Postulaciones del perfil activo en todos los proyectos, ordenadas por
   * `fechaPostulacion` descendente. Sin `idProyecto` devuelve las de todos.
   *
   * Errores:
   * - 400 estado/tipo desconocidos o paginación inválida
   * - 401 cuenta no activa
   * - 404 sin perfil activo
   * @param {BuscarMisPostulacionesParams} [params]
   * @param {AbortSignal} [signal] cancela la búsqueda en vuelo
   * @returns {Promise<{data: PaginaMisPostulacionesResponse}>} 200 OK
   */
  mias(params = {}, signal) {
    const query = serializarParams(params);
    const url = `/postulaciones/mias${query ? `?${query}` : ""}`;
    return http.get(url, { signal });
  },

  /**
   * DELETE /proyectos/{idProyecto}/postulaciones/general/{idPostulacion}
   * UC-27. Baja física de una postulación general propia. Sin body.
   *
   * Errores esperables: 401, 404 (postulación inexistente o de otro perfil /
   * proyecto), 409 (la postulación ya no está PENDIENTE).
   * @param {number|string} idProyecto
   * @param {number|string} idPostulacion
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data?: null}>} 204 No Content
   */
  darDeBajaGeneral(idProyecto, idPostulacion, signal) {
    return http.delete(
      `/proyectos/${idProyecto}/postulaciones/general/${idPostulacion}`,
      { signal }
    );
  },

  /**
   * DELETE /proyectos/{idProyecto}/postulaciones/actividad/{idPostulacion}
   * UC-27. Baja física de una postulación de actividad propia. Sin body.
   *
   * Errores esperables: 401, 404, 409 (ya no está PENDIENTE).
   * @param {number|string} idProyecto
   * @param {number|string} idPostulacion
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data?: null}>} 204 No Content
   */
  darDeBajaActividad(idProyecto, idPostulacion, signal) {
    return http.delete(
      `/proyectos/${idProyecto}/postulaciones/actividad/${idPostulacion}`,
      { signal }
    );
  },

  /**
   * Atajo de UC-27: elige el endpoint de baja según `tipo`.
   * @param {MiPostulacionResponse} postulacion
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data?: null}>} 204 No Content
   */
  darDeBaja(postulacion, signal) {
    const idProyecto = postulacion?.idProyecto;
    const idPostulacion = postulacion?.idPostulacion;
    if (idProyecto == null || idPostulacion == null) {
      return Promise.reject(new Error("Postulación sin proyecto o id."));
    }
    return String(postulacion?.tipo).toUpperCase() === "ACTIVIDAD"
      ? postulacionService.darDeBajaActividad(idProyecto, idPostulacion, signal)
      : postulacionService.darDeBajaGeneral(idProyecto, idPostulacion, signal);
  },

  /**
   * POST /proyectos/{idProyecto}/postulaciones/general/{idPostulacion}/aceptar
   * UC-34. Sin body. Crea la membresía del postulante, marca la postulación
   * como ACEPTADA y, si completa el cupo, el sistema rechaza las demás
   * postulaciones PENDIENTE del requerimiento.
   *
   * Errores esperables: 401, 403, 404, 409 (ya gestionada, proyecto no
   * habilitado, requerimiento satisfecho, postulante ya miembro, perfil
   * inactivo).
   * @param {number|string} idProyecto
   * @param {number|string} idPostulacion
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: PostulacionGestionadaResponse}>} 200 OK
   */
  aceptarGeneral(idProyecto, idPostulacion, signal) {
    return http.post(
      `/proyectos/${idProyecto}/postulaciones/general/${idPostulacion}/aceptar`,
      null,
      { signal }
    );
  },

  /**
   * POST /proyectos/{idProyecto}/postulaciones/general/{idPostulacion}/rechazar
   * UC-34. Sin body. La postulación pasa a RECHAZADA y no se borra: el perfil
   * no puede volver a postularse al mismo requerimiento.
   *
   * Errores esperables: 401, 403, 404, 409 (ya gestionada, proyecto no
   * habilitado, perfil inactivo).
   * @param {number|string} idProyecto
   * @param {number|string} idPostulacion
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: PostulacionGestionadaResponse}>} 200 OK
   */
  rechazarGeneral(idProyecto, idPostulacion, signal) {
    return http.post(
      `/proyectos/${idProyecto}/postulaciones/general/${idPostulacion}/rechazar`,
      null,
      { signal }
    );
  },

  /**
   * POST /proyectos/{idProyecto}/postulaciones/actividad/{idPostulacion}/aceptar
   * UC-34. Sin body. Revalida disponibilidad del postulante **y de todos los
   * profesionales ya asignados** a la actividad; crea la asignación (y la
   * membresía si el postulante no es miembro) y marca la postulación como
   * ACEPTADA.
   *
   * La respuesta 200 incluye `resultadoPreferencia`, `desvioMinutos` y
   * `advertencias` (ficha v2 §5). Las advertencias no bloquean.
   *
   * Errores esperables: 401, 403, 404, 409 (ya gestionada, proyecto no
   * habilitado, actividad no PENDIENTE, requerimiento satisfecho, director,
   * asignación existente, sin hueco común, fuera de tolerancia, perfil
   * inactivo, proyecto sin fecha de entrega).
   * @param {number|string} idProyecto
   * @param {number|string} idPostulacion
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: PostulacionGestionadaResponse}>} 200 OK
   */
  aceptarActividad(idProyecto, idPostulacion, signal) {
    return http.post(
      `/proyectos/${idProyecto}/postulaciones/actividad/${idPostulacion}/aceptar`,
      null,
      { signal }
    );
  },

  /**
   * POST /proyectos/{idProyecto}/postulaciones/actividad/{idPostulacion}/rechazar
   * UC-34. Sin body. La postulación pasa a RECHAZADA y no se borra.
   *
   * Errores esperables: 401, 403, 404, 409 (ya gestionada, proyecto no
   * habilitado, perfil inactivo).
   * @param {number|string} idProyecto
   * @param {number|string} idPostulacion
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: PostulacionGestionadaResponse}>} 200 OK
   */
  rechazarActividad(idProyecto, idPostulacion, signal) {
    return http.post(
      `/proyectos/${idProyecto}/postulaciones/actividad/${idPostulacion}/rechazar`,
      null,
      { signal }
    );
  },
};

export default postulacionService;
