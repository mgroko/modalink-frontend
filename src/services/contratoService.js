import http from "./http";

/*
 * Contrato UC-39 — Generar contrato
 * (docs/backend/ficha-tecnica-generar-contrato.md).
 *
 * El backend expone tres endpoints bajo /proyectos/{idProyecto}/contratos:
 *   GET  /opciones       contexto del paso Datos (proyecto, emisor, tipos,
 *                        miembros activos y contratos activos por tipo)
 *   POST /previsualizar  borrador + puedeGenerarse + conflictos, sin persistir
 *   POST /               emite el contrato (BORRADOR → PENDIENTE_FIRMA)
 *
 * La operación es atómica: si falla una validación no se persiste contrato,
 * versión, firma, evento ni notificación. El frontend sólo muestra el texto y
 * los conflictos que devuelve el sistema.
 */

/**
 * @typedef {Object} ProyectoOpcionesContrato
 * @property {number} idProyecto
 * @property {string} nombre
 * @property {string|null} descripcion
 * @property {string} estado "PUBLICADO" | "CONFIRMADO" | ...
 * @property {string|null} fechaInicio "YYYY-MM-DD" o null
 * @property {string|null} fechaEntrega "YYYY-MM-DD" o null
 */

/**
 * @typedef {Object} EmisorContrato
 * @property {number} idMiembro
 * @property {number} idPerfil
 * @property {string} nombreArtistico
 * @property {string} nombreCompleto
 * @property {string|null} dni
 */

/**
 * @typedef {Object} TipoAcuerdoContrato
 * @property {number} idTipoAcuerdo
 * @property {string} codigo ej. "CESION_DERECHOS_IMAGEN"
 * @property {string} nombre
 * @property {string|null} descripcion
 */

/**
 * @typedef {Object} MiembroOpcionesContrato
 * @property {number} idMiembro
 * @property {number} idPerfil
 * @property {string} nombreArtistico
 * @property {string} nombreCompleto
 * @property {string|null} dni
 * @property {string|null} profesion
 * @property {"DIRECTOR"|"MIEMBRO"} rolProyecto
 * @property {boolean} esEmisor true si es el Director que emite
 */

/**
 * @typedef {Object} ContratoActivoOpcion
 *   Combinación miembro + tipo que ya tiene un contrato ACTIVO. El frontend
 *   deshabilita esa opción en el paso Datos.
 * @property {number} idMiembro
 * @property {number} idTipoAcuerdo
 * @property {number} idContrato
 * @property {string} nombre
 */

/**
 * @typedef {Object} OpcionesContratoResponse
 * @property {ProyectoOpcionesContrato} proyecto
 * @property {EmisorContrato} emisor
 * @property {TipoAcuerdoContrato[]} tiposAcuerdo
 * @property {MiembroOpcionesContrato[]} miembros incluye al Director emisor,
 *           identificado con `esEmisor: true`
 * @property {ContratoActivoOpcion[]} contratosActivos
 */

/**
 * @typedef {Object} GenerarContratoRequest
 * @property {number} idTipoAcuerdo tipo activo
 * @property {number[]} idsMiembro al menos un miembro activo; puede incluir al
 *           director (queda como DIRECTOR_DESTINATARIO)
 * @property {string[]} clausulasAdicionales cada una se agrega como
 *           "Cláusula adicional N." al texto; máx. 1000 caracteres
 */

/**
 * @typedef {Object} ConflictoContratoResponse
 * @property {string} codigo
 * @property {number} [idMiembro]
 * @property {string} [nombre]
 * @property {string} mensaje
 */

/**
 * @typedef {Object} PrevisualizarContratoResponse
 * @property {string} texto borrador completo listo para mostrar
 * @property {boolean} puedeGenerarse false si hay conflictos
 * @property {ConflictoContratoResponse[]} conflictos
 */

/**
 * @typedef {Object} ParteContratoResponse
 * @property {number} idMiembro
 * @property {number} idPerfil
 * @property {string} nombre
 * @property {"DIRECTOR"|"DIRECTOR_DESTINATARIO"|"DESTINATARIO"} rolParte
 * @property {"PENDIENTE"} estadoFirma
 */

/**
 * @typedef {Object} GenerarContratoResponse
 * @property {number} idContrato
 * @property {number} idProyecto
 * @property {string} nombre
 * @property {string} descripcion
 * @property {"PENDIENTE_FIRMA"} estado
 * @property {number} versionActual
 * @property {string} fechaCreacion ISO local del servidor
 * @property {string} fechaEmision ISO local del servidor
 * @property {TipoAcuerdoContrato} tipoAcuerdo
 * @property {string} texto
 * @property {ParteContratoResponse[]} partes firma del director +
 *           firmas PENDIENTES de los destinatarios
 */

const contratoService = {
  /**
   * GET /proyectos/{idProyecto}/contratos/opciones — UC-39.
   * Contexto del paso Datos. No modifica datos. Requiere Director activo del
   * proyecto en estado PUBLICADO o CONFIRMADO.
   *
   * Errores:
   * - 403 ACCESO_DENEGADO_PROYECTO (no es Director activo)
   * - 404 PROYECTO_NO_ENCONTRADO / PERFIL_NO_ENCONTRADO
   * - 409 PROYECTO_NO_APTO_PARA_CONTRATO / PROYECTO_SIN_MIEMBROS_ACTIVOS
   * @param {number|string} idProyecto
   * @param {AbortSignal} [signal] cancela la request en vuelo
   * @returns {Promise<{data: OpcionesContratoResponse}>} 200 OK
   */
  obtenerOpciones(idProyecto, signal) {
    return http.get(`/proyectos/${idProyecto}/contratos/opciones`, {
      signal,
    });
  },

  /**
   * POST /proyectos/{idProyecto}/contratos/previsualizar — UC-39.
   * Genera el borrador sin persistir. Responde 200 aunque haya conflictos:
   * `puedeGenerarse: false` y `conflictos[]` permiten volver al paso Datos.
   *
   * Errores:
   * - 400 body inválido, ids vacíos o cláusula demasiado larga
   * - 400 TIPO_ACUERDO_INVALIDO
   * - 403 ACCESO_DENEGADO_PROYECTO
   * - 404 PROYECTO_NO_ENCONTRADO / PERFIL_NO_ENCONTRADO
   * - 409 PROYECTO_NO_APTO_PARA_CONTRATO / PROYECTO_SIN_MIEMBROS_ACTIVOS /
   *   CONTRATO_SIN_DESTINATARIOS / DESTINATARIO_INVALIDO / CONTRATO_TEXTO_INVALIDO
   * @param {number|string} idProyecto
   * @param {GenerarContratoRequest} request
   * @param {AbortSignal} [signal] cancela la request en vuelo
   * @returns {Promise<{data: PrevisualizarContratoResponse}>} 200 OK
   */
  previsualizar(idProyecto, request, signal) {
    return http.post(
      `/proyectos/${idProyecto}/contratos/previsualizar`,
      request,
      { signal }
    );
  },

  /**
   * POST /proyectos/{idProyecto}/contratos — UC-39.
   * Genera y emite el contrato en una operación atómica. Al volver 201 el
   * contrato ya está PENDIENTE_FIRMA, con fecha_emision, versión 1, firmas,
   * eventos y notificaciones creados por el sistema. El frontend no debe
   * duplicar ninguno de esos efectos.
   *
   * Errores:
   * - 400 body inválido, ids vacíos o cláusula demasiado larga
   * - 400 TIPO_ACUERDO_INVALIDO
   * - 403 ACCESO_DENEGADO_PROYECTO
   * - 404 PROYECTO_NO_ENCONTRADO / PERFIL_NO_ENCONTRADO
   * - 409 PROYECTO_NO_APTO_PARA_CONTRATO / PROYECTO_SIN_MIEMBROS_ACTIVOS /
   *   CONTRATO_SIN_DESTINATARIOS / DESTINATARIO_INVALIDO /
   *   CONTRATO_DUPLICADO_ACTIVO (incluye conflictos[]) / CONTRATO_TEXTO_INVALIDO
   * @param {number|string} idProyecto
   * @param {GenerarContratoRequest} request
   * @param {AbortSignal} [signal] cancela la request en vuelo
   * @returns {Promise<{data: GenerarContratoResponse}>} 201 Created
   */
  generar(idProyecto, request, signal) {
    return http.post(`/proyectos/${idProyecto}/contratos`, request, {
      signal,
    });
  },
};

export default contratoService;
