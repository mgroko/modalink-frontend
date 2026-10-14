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
 * @property {"PUBLICO"|"PRIVADO"} privacidad en mayúsculas
 * @property {string} [fechaEntregaEstipulada] "YYYY-MM-DD"; si se envía no puede
 *           ser anterior a hoy. `fechaInicio` no se envía: la calcula el backend
 *           a partir de la planificación y responde null hasta entonces.
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
 * @property {string|null} fechaInicio "YYYY-MM-DD"; null hasta que la
 *           planificación del proyecto defina las actividades
 * @property {string|null} fechaEntregaEstipulada "YYYY-MM-DD"
 * @property {string} estado estado inicial tras la creación: "Borrador"
 * @property {"PUBLICO"|"PRIVADO"} privacidad
 * @property {boolean} aceptaPostulacionGral
 * @property {UbicacionProyectoResponse|null} ubicacion
 * @property {number} idDirector
 * @property {string} nombreDirector
 * @property {ObjetivoProyectoResponse[]} objetivos
 * @property {RequerimientoGralResponse[]} requerimientosGral
 * @property {MoodboardResponse|null} moodboard
 */

/**
 * @typedef {Object} ActividadProximaProyecto
 * @property {number} idActividad
 * @property {string} nombre
 * @property {string} fechaHoraInicio ISO 8601, ej. "2026-05-30T18:00:00"
 * @property {number} duracionMinutos el fin se deriva en el frontend (inicio + duración)
 */

/**
 * @typedef {Object} ProyectoPropioItem
 *   Item de `GET /proyectos/propios` (UC-29 bis). A diferencia de
 *   `ProyectoResponse`, trae el rol del perfil activo y su próxima actividad.
 * @property {number} idProyecto
 * @property {string} nombre
 * @property {string} descripcion
 * @property {string|null} fechaInicio "YYYY-MM-DD"; null si aún no hay planificación
 * @property {string} estado forma legible: "Borrador" | "Publicado" | "Confirmado"
 *           | "Finalizado" | "Cancelado"
 * @property {"PUBLICO"|"PRIVADO"} privacidad
 * @property {"DIRECTOR"|"MIEMBRO"} rolUsuario rol del perfil activo en el proyecto
 * @property {ActividadProximaProyecto|null} proximaActividad null si no hay
 *           actividad futura (PENDIENTE/EN_CURSO) asignada al perfil activo
 */

/**
 * @typedef {Object} PaginaProyectoPropioResponse
 * @property {ProyectoPropioItem[]} contenido
 * @property {number} paginaActual base 0
 * @property {number} tamanoPagina
 * @property {number} totalElementos
 * @property {number} totalPaginas
 * @property {boolean} primera
 * @property {boolean} ultima
 */

/**
 * @typedef {Object} BuscarProyectosPropiosParams
 *   Todos opcionales: sin parámetros se listan todos los proyectos propios
 *   (orden alfabético). No hay criterio obligatorio, a diferencia de UC-29.
 * @property {string} [nombre] coincidencia parcial, insensible a mayúsculas
 * @property {"BORRADOR"|"PUBLICADO"|"CONFIRMADO"|"FINALIZADO"|"CANCELADO"} [estado]
 *           en mayúsculas (la respuesta usa la forma legible)
 * @property {"DIRECTOR"|"MIEMBRO"} [rol] omitir si no hay selección explícita
 * @property {number} [page] base 0, default 0
 * @property {number} [size] default 20
 * @property {boolean} [todos] true (o size ≤ 0) devuelve todo sin paginar
 */

const proyectoService = {
  /**
   * GET /proyectos/propios — lista los proyectos en los que participa el
   * perfil activo de la sesión como director o miembro (UC-29 bis).
   * El id del perfil activo lo resuelve el backend desde la sesión: no se envía.
   *
   * Errores:
   * - 404 PerfilActivoNoSeleccionadoException → "No hay un perfil activo
   *   seleccionado en la sesión."
   * - 400 MethodArgumentTypeMismatch → `estado` o `rol` fuera del enum
   * - 200 con `contenido: []` no es error (sin proyectos / sin coincidencias)
   * @param {BuscarProyectosPropiosParams} [params]
   * @param {AbortSignal} [signal] cancela la request en vuelo si llega una
   *           búsqueda nueva (patrón de BuscarPerfilView)
   * @returns {Promise<{data: PaginaProyectoPropioResponse}>} 200 OK
   */
  propios(params, signal) {
    return http.get("/proyectos/propios", { params, signal });
  },

  /**
   * POST /proyectos — crea un proyecto con el perfil activo de la sesión
   * (cookie JWT HttpOnly + header X-XSRF-TOKEN lo resuelve http.js).
   *
   * Errores (matriz UC-24 §5):
   * - 400 MethodArgumentNotValidException → body { errores: { campo: msg } }
   * - 400 FechaEntregaInvalidaException / RequerimientoInvalidoException /
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
