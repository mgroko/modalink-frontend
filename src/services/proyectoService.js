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
 * @typedef {Object} ImagenMoodboardResponse
 * @property {number} idImagen
 * @property {string} url ruta relativa, ej.
 *           "/uploads/perfiles/moodboard_<UUID>.webp" (resolver con
 *           resolverFotoUrl antes de usarla en <img>)
 */

/**
 * @typedef {Object} MoodboardResponse
 * @property {number} idMoodboard
 * @property {string|null} descripcion
 * @property {string} fechaCreacion ISO 8601
 * @property {ImagenMoodboardResponse[]} imagenes ordenadas por idImagen
 *           ascendente (= orden de subida)
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
 * @property {"DIRECTOR"|"MIEMBRO"|null} [rolUsuario] contexto del consultante;
 *           sólo en GET /proyectos/{idProyecto}. null = no es miembro.
 * @property {boolean} [esMiembro] true si el perfil es miembro activo
 *           (incluye al director); sólo en GET /proyectos/{idProyecto}
 * @property {string[]} [permisos] permisos del rol en este proyecto, ordenados
 *           alfabéticamente; vacío si no es miembro; sólo en
 *           GET /proyectos/{idProyecto}
 * @property {boolean} [elegibleParaPostularse] true sólo si no es miembro,
 *           acepta postulaciones y la profesión del perfil coincide con algún
 *           requerimiento; sólo en GET /proyectos/{idProyecto}
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
 *   (orden alfabético).
 * @property {string} [nombre] coincidencia parcial, insensible a mayúsculas
 * @property {"BORRADOR"|"PUBLICADO"|"CONFIRMADO"|"FINALIZADO"|"CANCELADO"} [estado]
 *           en mayúsculas (la respuesta usa la forma legible)
 * @property {"DIRECTOR"|"MIEMBRO"} [rol] omitir si no hay selección explícita
 * @property {number} [page] base 0, default 0
 * @property {number} [size] default 20
 * @property {boolean} [todos] true (o size ≤ 0) devuelve todo sin paginar
 */

/**
 * @typedef {Object} ProyectoBusquedaItem
 *   Item de `GET /proyectos/buscar` (UC-29). La visibilidad la aplica el
 *   backend: solo aparecen proyectos visibles para el perfil activo
 *   (miembro activo, o no-Borrador y Público).
 * @property {number} idProyecto
 * @property {string} nombre
 * @property {string} descripcion
 * @property {string|null} fechaInicio "YYYY-MM-DD"; null sin planificación
 * @property {string} estado forma legible: "Borrador" | "Publicado" | "Confirmado"
 *           | "Finalizado" | "Cancelado" (el filtro de entrada va en MAYÚSCULAS)
 * @property {"PUBLICO"|"PRIVADO"} privacidad
 * @property {boolean} aceptaPostulacionGral
 * @property {number|null} idDirector null si no hay director activo
 * @property {string|null} nombreDirector null si no hay director activo
 */

/**
 * @typedef {Object} PaginaProyectoBusquedaResponse
 * @property {ProyectoBusquedaItem[]} contenido
 * @property {number} paginaActual base 0
 * @property {number} tamanoPagina
 * @property {number} totalElementos
 * @property {number} totalPaginas
 * @property {boolean} primera
 * @property {boolean} ultima
 */

/**
 * @typedef {Object} BuscarProyectosParams
 *   Todos opcionales (consistente con "Buscar perfil"): sin parámetros se
 *   listan todos los proyectos visibles para el perfil activo.
 * @property {string} [nombre] coincidencia parcial, insensible a mayúsculas
 * @property {"BORRADOR"|"PUBLICADO"|"CONFIRMADO"|"FINALIZADO"|"CANCELADO"} [estado]
 *           en mayúsculas; filtrar BORRADOR sin ser miembro devuelve vacío
 *           (la visibilidad es un filtro AND aparte)
 * @property {string} [director] coincidencia parcial sobre nombre artístico
 *           o nombre/apellido del director activo del proyecto
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
   * GET /proyectos/buscar — listado/búsqueda general de proyectos (UC-29).
   * Aplica la regla de visibilidad server-side: el proyecto aparece si el
   * perfil activo es miembro activo, o si no está en Borrador y es Público.
   * Los invisibles se omiten (no hay 403 por elemento). El id del perfil
   * activo lo resuelve el backend desde la sesión: no se envía.
   *
   * Errores:
   * - 404 PerfilActivoNoSeleccionadoException → "No hay un perfil activo
   *   seleccionado en la sesión."
   * - 400 MethodArgumentTypeMismatch → `estado` fuera del enum
   * - 200 con `contenido: []` no es error (sin coincidencias / todo oculto)
   * @param {BuscarProyectosParams} [params]
   * @param {AbortSignal} [signal] cancela la request en vuelo si llega una
   *           búsqueda nueva (patrón de BuscarPerfilView)
   * @returns {Promise<{data: PaginaProyectoBusquedaResponse}>} 200 OK
   */
  buscar(params, signal) {
    return http.get("/proyectos/buscar", { params, signal });
  },

  /**
   * GET /proyectos/{idProyecto} — detalle/dashboard del proyecto
   * (ficha docs/backend/ficha-tecnica-ver-proyecto.md). A diferencia del
   * listado (UC-29, que omite los invisibles), el detalle responde 403 si el
   * proyecto no es visible para el perfil activo. Devuelve además el contexto
   * del consultante (`rolUsuario`, `esMiembro`, `permisos`,
   * `elegibleParaPostularse`) para condicionar la UI sin llamadas extra.
   *
   * Errores:
   * - 404 PerfilActivoNoSeleccionadoException → "No hay un perfil activo
   *   seleccionado en la sesión."
   * - 404 ProyectoNoEncontradoException → "El proyecto con id {id} no existe."
   * - 403 AccesoDenegadoProyectoException → proyecto Privado/Borrador y el
   *   perfil no es miembro (no confundir con 401: http.js ya redirige)
   * - 409 PerfilEnBajaException → "El perfil no se encuentra activo."
   * @param {number} idProyecto
   * @param {AbortSignal} [signal] cancela la request en vuelo (patrón de
   *           ProyectosInicioView)
   * @returns {Promise<{data: ProyectoResponse}>} 200 OK
   */
  obtener(idProyecto, signal) {
    return http.get(`/proyectos/${idProyecto}`, { signal });
  },

  /**
   * POST /proyectos/{idProyecto}/publicar — publica un proyecto en Borrador
   * (UC-25). Requiere el permiso PUBLICAR_PROYECTO (en la práctica: director).
   * La respuesta 200 tiene el mismo shape que GET /proyectos/{idProyecto}
   * con `estado` en "Publicado": el frontend reemplaza los datos locales
   * con ella (ficha ver-proyecto §4.2).
   *
   * Errores:
   * - 400 información básica incompleta → body { message|mensaje, campos[] }
   *   (mostrar el detalle de campos faltantes)
   * - 400 MethodArgumentNotValidException → body { errores: { campo: msg } }
   * - 403 AccesoDenegadoProyectoException (sin PUBLICAR_PROYECTO)
   * - 404 ProyectoNoEncontradoException / PerfilActivoNoSeleccionadoException
   * - 409 estado ≠ Borrador → refrescar los datos del proyecto (el botón
   *   Publicar desaparece al cambiar el estado)
   * - 409 PerfilEnBajaException → "El perfil no se encuentra activo."
   * @param {number} idProyecto
   * @param {AbortSignal} [signal] cancela la request en vuelo
   * @returns {Promise<{data: ProyectoResponse}>} 200 OK con el proyecto publicado
   */
  publicar(idProyecto, signal) {
    return http.post(`/proyectos/${idProyecto}/publicar`, null, { signal });
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

  /**
   * POST /proyectos/{idProyecto}/moodboard/imagenes — sube 1 a 10 archivos
   * en una sola petición multipart (ficha UC-24 §7.2). El nombre del campo
   * debe ser exactamente `archivos`. Las imágenes NO viajan en `crear()`: se
   * ejecuta después, sólo si hay archivos retenidos. Si el proyecto se creó
   * sin moodboard, el backend lo crea al subir (descripcion queda null).
   *
   * Límites: JPG/PNG/WEBP; ≤ 10 MB por imagen; ≤ 10 imágenes en total;
   * ≤ 110 MB por petición; lado ≤ 8000 px o ≤ 24 megapíxeles.
   *
   * Errores (matriz UC-24 §7.4):
   * - 400 LimiteImagenesMoodboardExcedidoException (existentes + nuevas > 10)
   * - 400 FormatoImagenInvalidoException (> 10 MB, formato no admitido o
   *   contenido no válido)
   * - 400 ArchivoVacioException (sin archivos o archivo vacío)
   * - 400 MaxUploadSizeExceededException (petición > 110 MB)
   * - 400 DimensionesImagenExcedidasException (lado > 8000 px o > 24 MP)
   * - 403 AccesoDenegadoProyectoException (perfil sin MODIFICAR_PROYECTO)
   * - 404 ProyectoNoEncontradoException / PerfilActivoNoSeleccionadoException
   *
   * Si esta llamada falla, el proyecto ya existe: reintentar sólo ésta con el
   * idProyecto existente, sin repetir `crear()` (§7.1 / §7.5.4).
   * @param {number} idProyecto
   * @param {File[]} archivos 1 a 10 archivos retenidos en el wizard
   * @returns {Promise<{data: MoodboardResponse}>} 200 OK con el moodboard
   *          completo (descripcion + imagenes ya subidas)
   */
  subirImagenesMoodboard(idProyecto, archivos) {
    const formData = new FormData();
    for (const archivo of archivos) {
      formData.append("archivos", archivo);
    }
    return http.post(`/proyectos/${idProyecto}/moodboard/imagenes`, formData);
  },
};

export default proyectoService;
