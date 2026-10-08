import http from "./http";

/*
 * Contrato UC-24 — Crear Proyecto (docs/backend/ficha-tecnica-crear-proyecto.md).
 * Tipos JSDoc puro: documentan el shape para el editor, sin tooling TS.
 */

/**
 * @typedef {Object} UbicacionProyectoRequest
 * @property {string} localidadId id Georef con ceros a la izquierda, ej. "06049010000"
 * @property {string} provinciaId id Georef con ceros a la izquierda, ej. "06"
 */

/**
 * @typedef {Object} ObjetivoProyectoRequest
 * @property {string} nombre máx. 100 caracteres
 * @property {string} [descripcion] máx. 300 caracteres
 */

/**
 * @typedef {Object} CaracteristicaRequerimientoRequest
 *   Regla por tipoDato de la característica:
 *   NUMERICO → valorMin/valorMax obligatorios, ≥ 0 y min ≤ max;
 *   ENUMERADO → valores[] con ≥ 1 idValor existente;
 *   TEXTO → ambos campos null/vacíos.
 *   Sin duplicados por idCaracteristica dentro del requerimiento.
 * @property {number} idCaracteristica
 * @property {number|null} [valorMin]
 * @property {number|null} [valorMax]
 * @property {number[]} [valores] ids de valores predefinidos de la característica
 */

/**
 * @typedef {Object} RequerimientoGralRequest
 * @property {number} cantidad > 0
 * @property {number} idProfesion debe existir
 * @property {string} [descripcion] máx. 200 caracteres
 * @property {CaracteristicaRequerimientoRequest[]} [caracteristicas]
 *           cada característica debe pertenecer a la profesión del requerimiento
 * @property {number[]} [habilidades] cada id debe existir
 */

/**
 * @typedef {Object} MoodboardRequest
 * @property {string} [descripcion] máx. 200 caracteres; moodboard 1:1 con el proyecto
 */

/**
 * @typedef {Object} CrearProyectoRequest
 * @property {string} nombre máx. 50; no blanco; único para el perfil director activo
 * @property {string} descripcion máx. 200; no blanco
 * @property {"PUBLICO"|"PRIVADO"|"OCULTO"} privacidad en mayúsculas
 * @property {string} fechaInicio formato ISO "YYYY-MM-DD"
 * @property {string} [fechaFinEstipulada] "YYYY-MM-DD", ≥ fechaInicio
 * @property {boolean} [aceptaPostulacionGral] default false
 * @property {UbicacionProyectoRequest} [ubicacion] si se envía, localidadId no puede ir en blanco
 * @property {ObjetivoProyectoRequest[]} [objetivos] lista dinámica
 * @property {RequerimientoGralRequest[]} [requerimientosGral] lista dinámica
 * @property {MoodboardRequest} [moodboard]
 */

/**
 * @typedef {Object} UbicacionProyectoResponse
 * @property {number} idUbicacion
 * @property {string} localidad
 * @property {string} provincia
 */

/**
 * @typedef {Object} ObjetivoProyectoResponse
 * @property {number} idObjetivo
 * @property {string} nombre
 * @property {string|null} descripcion
 */

/**
 * @typedef {Object} CaracteristicaRequerimientoResponse
 * @property {number} idCaracteristica
 * @property {string} codigo ej. "ALTURA", "COLOR_OJOS"
 * @property {"NUMERICO"|"ENUMERADO"|"TEXTO"} tipoDato
 * @property {number|null} valorMin null si no es NUMERICO
 * @property {number|null} valorMax null si no es NUMERICO
 * @property {number[]} valores vacío si no es ENUMERADO
 */

/**
 * @typedef {Object} RequerimientoGralResponse
 * @property {number} idRequerimientoGral
 * @property {number} cantidad
 * @property {string|null} descripcion
 * @property {number} idProfesion
 * @property {string} nombreProfesion
 * @property {CaracteristicaRequerimientoResponse[]} caracteristicas
 * @property {number[]} habilidades
 */

/**
 * @typedef {Object} MoodboardResponse
 * @property {number} idMoodboard
 * @property {string|null} descripcion
 * @property {string} fechaCreacion ISO 8601
 */

/**
 * @typedef {Object} ProyectoResponse
 * @property {number} idProyecto
 * @property {string} nombre
 * @property {string} descripcion
 * @property {string} fechaInicio "YYYY-MM-DD"
 * @property {string|null} fechaFinEstipulada "YYYY-MM-DD"
 * @property {string} estado estado inicial tras la creación: "Borrador"
 * @property {"PUBLICO"|"PRIVADO"|"OCULTO"} privacidad
 * @property {boolean} aceptaPostulacionGral
 * @property {UbicacionProyectoResponse|null} ubicacion
 * @property {number} idDirector
 * @property {string} nombreDirector
 * @property {ObjetivoProyectoResponse[]} objetivos
 * @property {RequerimientoGralResponse[]} requerimientosGral
 * @property {MoodboardResponse|null} moodboard
 */

const proyectoService = {
  /**
   * POST /proyectos — crea un proyecto con el perfil activo de la sesión
   * (cookie JWT HttpOnly + header X-XSRF-TOKEN lo resuelve http.js).
   *
   * Errores (matriz UC-24 §5):
   * - 400 MethodArgumentNotValidException → body { errores: { campo: msg } }
   * - 400 RangoFechasProyectoInvalidoException / RequerimientoInvalidoException /
   *   DataIntegrityViolation → body { message }
   * - 403 PerfilEnBajaException
   * - 404 PerfilActivoNoSeleccionadoException / PerfilNoEncontradoException /
   *   HabilidadNoEncontradaException / ProfesionNoEncontradaException
   * - 409 NombreProyectoDuplicadoException
   * @param {CrearProyectoRequest} request
   * @returns {Promise<{data: ProyectoResponse}>} 201 Created
   */
  crear(request) {
    return http.post("/proyectos", request);
  },
};

export default proyectoService;
