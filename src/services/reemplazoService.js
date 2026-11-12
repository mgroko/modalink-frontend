import http from "./http";
import { normalizarTextoReemplazo } from "../utils/reemplazoConstants.js";

/*
 * Contrato del módulo de reemplazo automático.
 *
 * El backend resuelve el perfil activo desde la sesión y valida permisos,
 * estados, disponibilidad y cupo. El frontend sólo envía ids, mensaje y
 * motivo. Todas las rutas y bodies viven acá.
 */

/**
 * @typedef {Object} ReemplazoResumenResponse
 * @property {number} idReemplazo
 * @property {"ACTIVIDAD"|"GENERAL"} tipo
 * @property {number} idProyecto
 * @property {string} nombreProyecto
 * @property {number|null} idActividad
 * @property {string|null} nombreActividad
 * @property {number|null} idRequerimientoActividad
 * @property {number|null} idRequerimientoGeneral
 * @property {string|null} profesion
 * @property {string|null} perfilBaja
 * @property {"BAJA_VOLUNTARIA"|"ELIMINACION"} origen
 * @property {string} estado
 * @property {string} fechaCreacion ISO-8601 local
 * @property {string|null} fechaCierre
 * @property {string|null} motivoCierre
 * @property {number} totalCandidatos
 * @property {number} totalInvitados
 */

/**
 * Habilidad evaluada del candidato. El contrato actual puede enviar sólo
 * strings; el contrato enriquecido agrega el estado de coincidencia.
 * @typedef {Object} HabilidadCandidatoReemplazo
 * @property {string} nombre
 * @property {boolean|null} [requerida] true si el puesto la pidió
 * @property {boolean|null} [cumple] true/false sólo cuando es requerida
 */

/**
 * Característica evaluada del candidato. `valorPedido` y `cumple` permiten
 * pintar la grilla del rediseño; si no llegan, el frontend muestra el dato en
 * gris y usa `faltantes` como fallback.
 * @typedef {Object} CaracteristicaCandidatoReemplazo
 * @property {string} codigo
 * @property {string|null} [valor]
 * @property {string|null} [codigoValor]
 * @property {string|null} [valorPedido]
 * @property {boolean|null} [requerida]
 * @property {boolean|null} [cumple]
 */

/**
 * @typedef {Object} CandidatoReemplazoResponse
 * @property {number} idCandidato
 * @property {number} idPerfil
 * @property {number} idUsuario
 * @property {string} nombreArtistico
 * @property {string|null} nombre
 * @property {string|null} apellido
 * @property {string|null} profesion
 * @property {string|null} fotoUrl
 * @property {object|null} ciudad
 * @property {(string|HabilidadCandidatoReemplazo)[]} habilidades contrato actual
 * @property {HabilidadCandidatoReemplazo[]} [habilidadesEvaluadas] contrato
 *           enriquecido; incluye requeridas y no requeridas. Si existe, tiene
 *           prioridad sobre `habilidades`.
 * @property {CaracteristicaCandidatoReemplazo[]} caracteristicas
 * @property {number|string} puntaje
 * @property {number|null} [requisitosCumplidos] conteo exacto informado por el backend
 * @property {number|null} [requisitosTotales] total de requisitos evaluados
 * @property {boolean|null} [cumpleTodo] true si cumple todos los requisitos
 * @property {"MISMA_CIUDAD"|"MISMA_PROVINCIA"|"OTRA"} nivelUbicacion
 * @property {boolean} alternativo
 * @property {string[]} faltantes
 * @property {"EXACTA"|"CON_REPROGRAMACION"|"NO_APLICA"|"NO_DISPONIBLE"} tipoDisponibilidad
 * @property {string|null} inicioPropuesto
 * @property {string|null} finPropuesto
 * @property {string} estado
 * @property {string|null} mensaje
 * @property {string|null} fechaInvitacion
 * @property {string|null} fechaRespuesta
 * @property {string|null} fechaDecision
 * @property {string|null} motivoDecision
 * @property {number|null} [idTycAceptado]
 */

/**
 * Aceptación de la versión vigente de T&C del candidato (UC-23 §5.3).
 * @typedef {Object} AceptacionTerminosRequest
 * @property {number|null} idTyc
 * @property {boolean} aceptaTerminos
 */

/**
 * @typedef {Object} AprobarCandidatoRequest
 * @property {AceptacionTerminosRequest} [aceptacionTerminos]
 */

/**
 * @typedef {Object} ReemplazoDetalleResponse
 * @property {ReemplazoResumenResponse} reemplazo
 * @property {CandidatoReemplazoResponse[]} candidatos
 */

/**
 * @typedef {Object} InvitacionReemplazoResponse
 * @property {number} idCandidato
 * @property {number} idReemplazo
 * @property {"ACTIVIDAD"|"GENERAL"} tipo
 * @property {string} estado
 * @property {number} idProyecto
 * @property {string} nombreProyecto
 * @property {number|null} idActividad
 * @property {string|null} nombreActividad
 * @property {string|null} profesion
 * @property {string|null} fechaInvitacion
 * @property {string|null} fechaHoraInicio
 * @property {number|null} duracionMinutos
 * @property {string|null} mensaje
 * @property {string|null} fechaRespuesta
 * @property {string|null} motivoRespuesta
 */

/**
 * Body JSON para endpoints con motivo opcional.
 *
 * Nunca se envía `null`: algunos endpoints declaran `@RequestBody(required =
 * false)` y un POST sin body JSON puede terminar en 415 antes de llegar al
 * controller.
 *
 * @param {unknown} motivo
 * @returns {{motivo?: string}}
 */
function bodyMotivoOpcional(motivo) {
  const texto = normalizarTextoReemplazo(motivo);
  return texto ? { motivo: texto } : {};
}

const reemplazoService = {
  /**
   * GET /proyectos/{idProyecto}/reemplazos
   * Sólo Director activo del proyecto. Devuelve todos los procesos, sin
   * paginación, ordenados por fecha de creación descendente.
   * @param {number|string} idProyecto
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: ReemplazoResumenResponse[]}>}
   */
  listar(idProyecto, signal) {
    return http.get(`/proyectos/${idProyecto}/reemplazos`, { signal });
  },

  /**
   * GET /proyectos/{idProyecto}/reemplazos/{idReemplazo}
   * @param {number|string} idProyecto
   * @param {number|string} idReemplazo
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: ReemplazoDetalleResponse}>}
   */
  obtener(idProyecto, idReemplazo, signal) {
    return http.get(
      `/proyectos/${idProyecto}/reemplazos/${idReemplazo}`,
      { signal }
    );
  },

  /**
   * POST /proyectos/{idProyecto}/reemplazos/{idReemplazo}/confirmar
   * Marca como INVITADO a los candidatos elegidos (deben estar PROPUESTO) y
   * pasa el proceso a INVITACIONES_ENVIADAS.
   * @param {number|string} idProyecto
   * @param {number|string} idReemplazo
   * @param {{idsCandidatos: number[], mensaje?: string}} request
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: ReemplazoDetalleResponse}>}
   */
  confirmar(idProyecto, idReemplazo, { idsCandidatos, mensaje } = {}, signal) {
    const ids = Array.isArray(idsCandidatos)
      ? [...new Set(idsCandidatos.map(Number).filter(Number.isFinite))]
      : [];

    return http.post(
      `/proyectos/${idProyecto}/reemplazos/${idReemplazo}/confirmar`,
      {
        idsCandidatos: ids,
        mensaje: normalizarTextoReemplazo(mensaje),
      },
      { signal }
    );
  },

  /**
   * POST /proyectos/{idProyecto}/reemplazos/{idReemplazo}/regenerar
   * Sólo para procesos SIN_CANDIDATOS.
   * @param {number|string} idProyecto
   * @param {number|string} idReemplazo
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: ReemplazoDetalleResponse}>}
   */
  regenerar(idProyecto, idReemplazo, signal) {
    return http.post(
      `/proyectos/${idProyecto}/reemplazos/${idReemplazo}/regenerar`,
      {},
      { signal }
    );
  },

  /**
   * POST /proyectos/{idProyecto}/reemplazos/{idReemplazo}/cancelar
   * El motivo es opcional (máx. 200).
   * @param {number|string} idProyecto
   * @param {number|string} idReemplazo
   * @param {string} [motivo]
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: ReemplazoDetalleResponse}>}
   */
  cancelar(idProyecto, idReemplazo, motivo, signal) {
    return http.post(
      `/proyectos/${idProyecto}/reemplazos/${idReemplazo}/cancelar`,
      bodyMotivoOpcional(motivo),
      { signal }
    );
  },

  /**
   * POST /proyectos/{idProyecto}/reemplazos/{idReemplazo}/candidatos/{idCandidato}/aprobar
   * Puede haber varios candidatos ACEPTADO_PENDIENTE_APROBACION en el mismo
   * proceso: el director elige a uno y, al aprobarlo, las demás invitaciones
   * activas se cancelan.
   * Si el candidato tiene T&C vigentes, el director envía
   * `aceptacionTerminos`.
   * @param {number|string} idProyecto
   * @param {number|string} idReemplazo
   * @param {number|string} idCandidato
   * @param {AprobarCandidatoRequest} [request]
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: CandidatoReemplazoResponse}>}
   */
  aprobarCandidato(
    idProyecto,
    idReemplazo,
    idCandidato,
    request = {},
    signal
  ) {
    return http.post(
      `/proyectos/${idProyecto}/reemplazos/${idReemplazo}/candidatos/${idCandidato}/aprobar`,
      // Nunca `null`: axios 1.x lo envía como
      // application/x-www-form-urlencoded, content-type que Spring no puede
      // mapear al @RequestBody(required = false) del endpoint (415).
      request?.aceptacionTerminos
        ? { aceptacionTerminos: request.aceptacionTerminos }
        : {},
      { signal }
    );
  },

  /**
   * POST /proyectos/{idProyecto}/reemplazos/{idReemplazo}/candidatos/{idCandidato}/rechazar
   * El motivo es opcional (máx. 200).
   * @param {number|string} idProyecto
   * @param {number|string} idReemplazo
   * @param {number|string} idCandidato
   * @param {string} [motivo]
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: CandidatoReemplazoResponse}>}
   */
  rechazarCandidato(idProyecto, idReemplazo, idCandidato, motivo, signal) {
    return http.post(
      `/proyectos/${idProyecto}/reemplazos/${idReemplazo}/candidatos/${idCandidato}/rechazar`,
      bodyMotivoOpcional(motivo),
      { signal }
    );
  },

  /**
   * GET /reemplazos/invitaciones
   * Devuelve las invitaciones activas del perfil activo:
   * INVITADO y ACEPTADO_PENDIENTE_APROBACION.
   *
   * Puede contener varias invitaciones del mismo `idProyecto` cuando
   * corresponden a actividades o requerimientos distintos. La clave de cada
   * ítem es `idCandidato`, no `idProyecto`.
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: InvitacionReemplazoResponse[]}>}
   */
  listarInvitaciones(signal) {
    return http.get("/reemplazos/invitaciones", { signal });
  },

  /**
   * GET /reemplazos/invitaciones/rechazadas
   * Devuelve sólo las invitaciones de reemplazo rechazadas por el
   * profesional. Las eliminadas por el director y las canceladas con el
   * proceso no se incluyen.
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: InvitacionReemplazoResponse[]}>}
   */
  listarInvitacionesRechazadas(signal) {
    return http.get("/reemplazos/invitaciones/rechazadas", { signal });
  },

  /**
   * POST /reemplazos/invitaciones/{idCandidato}/aceptar
   * @param {number|string} idCandidato
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: CandidatoReemplazoResponse}>}
   */
  aceptarInvitacion(idCandidato, signal) {
    return http.post(
      `/reemplazos/invitaciones/${idCandidato}/aceptar`,
      {},
      { signal }
    );
  },

  /**
   * POST /reemplazos/invitaciones/{idCandidato}/rechazar
   * El motivo es opcional (máx. 200).
   * @param {number|string} idCandidato
   * @param {string} [motivo]
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: CandidatoReemplazoResponse}>}
   */
  rechazarInvitacion(idCandidato, motivo, signal) {
    return http.post(
      `/reemplazos/invitaciones/${idCandidato}/rechazar`,
      bodyMotivoOpcional(motivo),
      { signal }
    );
  },
};

export default reemplazoService;
