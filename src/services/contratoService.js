import http from "./http";
import { serializarParams } from "../utils/queryParams.js";

/*
 * Contrato UC-39 — Generar contrato
 * (docs/backend/ficha-tecnica-generar-contrato.md).
 *
 * El backend expone estos endpoints bajo /proyectos/{idProyecto}/contratos:
 *   GET  /opciones       contexto del paso Datos (proyecto, emisor, tipos,
 *                        miembros activos y contratos activos por tipo)
 *   POST /previsualizar  texto + puedeGenerarse + conflictos, sin persistir
 *   POST /               crea el contrato en estado BORRADOR
 *   POST /{id}/emitir    emite el borrador (BORRADOR → PENDIENTE_FIRMA)
 *   PUT  /{id}           guarda cambios de un borrador o contrato pendiente
 *
 * La creación y la edición no notifican. La emisión es la única operación que
 * crea la versión definitiva, la firma del director y las notificaciones.
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
 * @typedef {Object} GuardarContratoRequest
 * @property {number} idTipoAcuerdo tipo activo
 * @property {number[]} [idsMiembro] destinatarios activos; puede incluir al
 *           director (queda como DIRECTOR_DESTINATARIO). Opcional en borrador.
 * @property {string[]} [clausulasAdicionales] cada una se agrega como
 *           "Cláusula adicional N." al texto; máx. 1000 caracteres
 * @property {"AUTO"|"MANUAL"} [modoTexto] AUTO regenera desde la plantilla;
 *           MANUAL usa `texto` tal cual.
 * @property {string|null} [texto] texto final; obligatorio en modo MANUAL.
 * @property {string|null} [nombre] máx. 50 caracteres
 * @property {string|null} [descripcion] máx. 200 caracteres
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
 * @property {string} nombre nombre y apellido del usuario
 * @property {string|null} [nombreArtistico] nombre artístico del perfil, si el
 *           backend lo incluye en la respuesta
 * @property {"DIRECTOR"|"DIRECTOR_DESTINATARIO"|"DESTINATARIO"} rolParte
 * @property {"PENDIENTE"} estadoFirma
 */

/**
 * @typedef {Object} BuscarContratosParams
 * @property {number} [idProyecto]
 * @property {string[]} [estados] lista blanca; si se omite, el backend aplica
 *           BORRADOR, PENDIENTE_FIRMA, ACTIVO, RECHAZADO_POR_PARTES,
 *           CANCELADO y ELIMINADO
 * @property {string} [parte] nombre artístico, nombre o apellido
 * @property {string} [fechaEmisionDesde] YYYY-MM-DD
 * @property {string} [fechaEmisionHasta] YYYY-MM-DD
 * @property {string} [fechaFirmaDesde] YYYY-MM-DD
 * @property {string} [fechaFirmaHasta] YYYY-MM-DD
 * @property {number} [idTipoAcuerdo]
 * @property {string} [nombreContrato]
 * @property {boolean} [miFirmaPendiente]
 * @property {number} [page] base 0
 * @property {number} [size] máximo 50
 */

/**
 * @typedef {Object} ContratoResumenResponse
 * @property {number} idContrato
 * @property {string} nombre
 * @property {number} idProyecto
 * @property {string} nombreProyecto
 * @property {number} idTipoAcuerdo
 * @property {string} codigoTipoAcuerdo
 * @property {string} nombreTipoAcuerdo
 * @property {string} estado
 * @property {string} fechaCreacion
 * @property {string|null} fechaEmision
 * @property {string|null} fechaModificacion
 * @property {number} versionActual
 * @property {Object|null} emisor
 * @property {ParteContratoResponse[]} partes
 * @property {string|null} miEstadoFirma
 * @property {string|null} miFechaFirma
 * @property {boolean} puedeModificar
 * @property {boolean} puedeEmitir
 * @property {boolean} puedeEliminar
 * @property {boolean} puedeFirmar
 * @property {boolean} puedeRechazar
 * @property {number} firmados
 * @property {number} totalPartes
 */

/**
 * @typedef {Object} PaginaContratosResponse
 * @property {ContratoResumenResponse[]} contenido
 * @property {number} paginaActual
 * @property {number} tamanoPagina
 * @property {number} totalElementos
 * @property {number} totalPaginas
 * @property {boolean} primera
 * @property {boolean} ultima
 */

/**
 * @typedef {Object} ProyectoFiltroContratoResponse
 * @property {number} idProyecto
 * @property {string} nombre
 */

/**
 * @typedef {Object} ContratoDetalleResponse
 * @property {number} idContrato
 * @property {number} idProyecto
 * @property {string} nombreProyecto
 * @property {string} estadoProyecto
 * @property {number} idTipoAcuerdo
 * @property {string} codigoTipoAcuerdo
 * @property {string} nombreTipoAcuerdo
 * @property {string} nombre
 * @property {string} descripcion
 * @property {string} estado
 * @property {number} versionActual
 * @property {string} fechaCreacion
 * @property {string|null} fechaEmision
 * @property {string|null} fechaModificacion
 * @property {string} texto
 * @property {Object|null} emisor
 * @property {ParteContratoResponse[]} partes
 * @property {string|null} miEstadoFirma
 * @property {string|null} miFechaFirma
 * @property {boolean} puedeModificarse
 * @property {string|null} motivoNoModificable
 * @property {boolean} puedeEmitir
 * @property {string|null} motivoNoEmitible
 * @property {boolean} puedeEliminar
 * @property {string|null} motivoNoEliminable
 * @property {boolean} puedeFirmar
 * @property {boolean} puedeRechazar
 * @property {number} firmados
 * @property {number} totalPartes
 */

function urlBusqueda(ruta, params) {
  const query = serializarParams(params);
  return query ? `${ruta}?${query}` : ruta;
}

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
   * @param {GuardarContratoRequest} request
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
   * Crea el contrato en estado BORRADOR. No emite ni notifica. El nombre, la
   * descripción, los destinatarios y el texto pueden quedar incompletos; la
   * emisión es la operación que valida la completitud.
   *
   * Errores:
   * - 400 body inválido o cláusula demasiado larga
   * - 400 TIPO_ACUERDO_INVALIDO
   * - 403 ACCESO_DENEGADO_PROYECTO
   * - 404 PROYECTO_NO_ENCONTRADO / PERFIL_NO_ENCONTRADO
   * - 409 PROYECTO_NO_APTO_PARA_CONTRATO / PROYECTO_SIN_MIEMBROS_ACTIVOS /
   *   DESTINATARIO_INVALIDO / CONTRATO_TEXTO_INVALIDO
   * @param {number|string} idProyecto
   * @param {GuardarContratoRequest} request
   * @param {AbortSignal} [signal] cancela la request en vuelo
   * @returns {Promise<{data: ContratoDetalleResponse}>} 201 Created
   */
  crearBorrador(idProyecto, request, signal) {
    return http.post(`/proyectos/${idProyecto}/contratos`, request, {
      signal,
    });
  },

  /**
   * POST /proyectos/{idProyecto}/contratos/{idContrato}/emitir — UC-39.
   * Emite un borrador y lo deja PENDIENTE_FIRMA. Esta es la única operación
   * que crea la versión definitiva, la firma del director y las notificaciones.
   *
   * Errores:
   * - 403 ACCESO_DENEGADO_PROYECTO
   * - 404 CONTRATO_NO_ENCONTRADO
   * - 409 CONTRATO_NO_BORRADOR / CONTRATO_SIN_DESTINATARIOS /
   *   CONTRATO_DUPLICADO_ACTIVO (incluye conflictos[]) /
   *   CONTRATO_TEXTO_INVALIDO / TIPO_ACUERDO_INVALIDO /
   *   PROYECTO_NO_APTO_PARA_CONTRATO
   * @param {number|string} idProyecto
   * @param {number|string} idContrato
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: ContratoDetalleResponse}>} 200 OK
   */
  emitir(idProyecto, idContrato, signal) {
    return http.post(
      `/proyectos/${idProyecto}/contratos/${idContrato}/emitir`,
      undefined,
      { signal }
    );
  },

  /**
   * GET /contratos/proyectos — UC-68.
   * Opciones del filtro "Proyecto": solo proyectos con contratos visibles
   * para el perfil activo, incluidos los históricos donde fue parte firmante.
   *
   * Errores:
   * - 404 PERFIL_ACTIVO_NO_SELECCIONADO
   * - 409 PERFIL_EN_BAJA
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: ProyectoFiltroContratoResponse[]}>} 200 OK
   */
  listarProyectos(signal) {
    return http.get("/contratos/proyectos", { signal });
  },

  /**
   * GET /contratos/buscar — UC-68.
   * Búsqueda global y paginada. La visibilidad la resuelve el backend:
   * Director ve todo el proyecto (incluidos borradores); firmante ve sus
   * contratos; ajeno no ve nada.
   *
   * Errores:
   * - 400 RANGO_FECHAS_CONTRATO_INVALIDO
   * - 403 ACCESO_DENEGADO_PROYECTO
   * - 404 PERFIL_ACTIVO_NO_SELECCIONADO / CONTRATO_NO_ENCONTRADO
   * - 409 PERFIL_EN_BAJA
   * @param {BuscarContratosParams} [params]
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: PaginaContratosResponse}>} 200 OK
   */
  buscar(params = {}, signal) {
    return http.get(urlBusqueda("/contratos/buscar", params), { signal });
  },

  /**
   * GET /proyectos/{idProyecto}/contratos/{idContrato} — UC-53/UC-55/UC-68.
   * Detalle común con texto legal, partes, firmas y flags.
   *
   * Errores:
   * - 403 ACCESO_DENEGADO_PROYECTO
   * - 404 CONTRATO_NO_ENCONTRADO / PERFIL_ACTIVO_NO_SELECCIONADO
   * - 409 PERFIL_EN_BAJA
   * @param {number|string} idProyecto
   * @param {number|string} idContrato
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: ContratoDetalleResponse}>} 200 OK
   */
  obtenerDetalle(idProyecto, idContrato, signal) {
    return http.get(
      `/proyectos/${idProyecto}/contratos/${idContrato}`,
      { signal }
    );
  },

  /**
   * GET /proyectos/{idProyecto}/contratos/{idContrato}/pdf — UC-68.
   * Descarga el contrato en PDF con datos, partes/firmas y cláusulas.
   *
   * Errores:
   * - 403 ACCESO_DENEGADO_PROYECTO
   * - 404 CONTRATO_NO_ENCONTRADO / PERFIL_ACTIVO_NO_SELECCIONADO
   * - 409 PERFIL_EN_BAJA
   * @param {number|string} idProyecto
   * @param {number|string} idContrato
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: Blob, headers: Object}>} 200 OK application/pdf
   */
  exportarPdf(idProyecto, idContrato, signal) {
    return http.get(
      `/proyectos/${idProyecto}/contratos/${idContrato}/pdf`,
      { responseType: "blob", signal }
    );
  },

  /**
   * POST /proyectos/{idProyecto}/contratos/{idContrato}/previsualizar — UC-53.
   * Genera el texto sin persistir. Es opcional: el PUT guarda directamente.
   * Responde 200 aunque haya conflictos: `puedeModificarse` y `conflictos[]`
   * permiten mostrar advertencias antes del guardado.
   *
   * Errores:
   * - 400 TIPO_ACUERDO_INVALIDO
   * - 403 ACCESO_DENEGADO_PROYECTO
   * - 404 CONTRATO_NO_ENCONTRADO
   * - 409 CONTRATO_NO_EDITABLE / PROYECTO_NO_APTO_PARA_CONTRATO /
   *   CONTRATO_CON_FIRMAS_REGISTRADAS / CONTRATO_SIN_DESTINATARIOS /
   *   DESTINATARIO_INVALIDO / CONTRATO_TEXTO_INVALIDO
   * @param {number|string} idProyecto
   * @param {number|string} idContrato
   * @param {GuardarContratoRequest} request
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: {texto: string, puedeModificarse: boolean, conflictos: ConflictoContratoResponse[]}}>} 200 OK
   */
  previsualizarModificacion(idProyecto, idContrato, request, signal) {
    return http.post(
      `/proyectos/${idProyecto}/contratos/${idContrato}/previsualizar`,
      request,
      { signal }
    );
  },

  /**
   * PUT /proyectos/{idProyecto}/contratos/{idContrato} — UC-53.
   * Guarda cambios de un contrato BORRADOR o PENDIENTE_FIRMA. En borrador no
   * notifica; en pendiente reconcilia firmas y el trigger registra la nueva
   * versión, el evento MODIFICADO y las notificaciones. No requiere una
   * previsualización previa.
   *
   * Errores: mismos códigos que `previsualizarModificacion`.
   * @param {number|string} idProyecto
   * @param {number|string} idContrato
   * @param {GuardarContratoRequest} request
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: ContratoDetalleResponse}>} 200 OK
   */
  modificar(idProyecto, idContrato, request, signal) {
    return http.put(
      `/proyectos/${idProyecto}/contratos/${idContrato}`,
      request,
      { signal }
    );
  },

  /**
   * DELETE /proyectos/{idProyecto}/contratos/{idContrato} — UC-54.
   * Baja lógica: el contrato pasa a ELIMINADO y conserva su historial.
   * La operación es idempotente: si ya está eliminado responde 204.
   *
   * Errores:
   * - 403 el perfil no es Director activo
   * - 404 CONTRATO_NO_ENCONTRADO / PERFIL_ACTIVO_NO_SELECCIONADO
   * - 409 PROYECTO_NO_APTO_PARA_ELIMINACION
   * @param {number|string} idProyecto
   * @param {number|string} idContrato
   * @param {AbortSignal} [signal]
   * @returns {Promise<{status: number, data: null}>} 204 No Content
   */
  eliminar(idProyecto, idContrato, signal) {
    return http.delete(
      `/proyectos/${idProyecto}/contratos/${idContrato}`,
      { signal }
    );
  },

  /**
   * POST /proyectos/{idProyecto}/contratos/{idContrato}/firmar — UC-55.
   * Sin body. El backend actualiza la firma y devuelve el detalle.
   *
   * Errores:
   * - 409 CONTRATO_YA_FIRMADO / CONTRATO_YA_RECHAZADO / FIRMA_NO_PENDIENTE /
   *   CONTRATO_NO_PENDIENTE_FIRMA / PROYECTO_NO_APTO_PARA_CONTRATO
   * @param {number|string} idProyecto
   * @param {number|string} idContrato
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: ContratoDetalleResponse}>} 200 OK
   */
  firmar(idProyecto, idContrato, signal) {
    return http.post(
      `/proyectos/${idProyecto}/contratos/${idContrato}/firmar`,
      undefined,
      { signal }
    );
  },

  /**
   * POST /proyectos/{idProyecto}/contratos/{idContrato}/rechazar — UC-55.
   * `motivo` obligatorio, máximo 200 caracteres.
   *
   * Errores:
   * - 400 motivo vacío o demasiado largo
   * - 409 CONTRATO_YA_FIRMADO / CONTRATO_YA_RECHAZADO / FIRMA_NO_PENDIENTE /
   *   CONTRATO_NO_PENDIENTE_FIRMA / PROYECTO_NO_APTO_PARA_CONTRATO /
   *   MOTIVO_RECHAZO_OBLIGATORIO
   * @param {number|string} idProyecto
   * @param {number|string} idContrato
   * @param {string} motivo
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: ContratoDetalleResponse}>} 200 OK
   */
  rechazar(idProyecto, idContrato, motivo, signal) {
    return http.post(
      `/proyectos/${idProyecto}/contratos/${idContrato}/rechazar`,
      { motivo },
      { signal }
    );
  },
};

export default contratoService;
