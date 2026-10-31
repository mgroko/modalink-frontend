import http from "./http";
import { serializarParams } from "../utils/queryParams.js";

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
 *           ser anterior a hoy. `fechaInicio` no se envía: la calcula el sistema
 *           a partir de la planificación y responde null hasta entonces.
 * @property {boolean} [aceptaPostulacionGral] default false
 * @property {UbicacionProyectoRequest} [ubicacion] si se envía, localidadId no puede ir en blanco
 * @property {ObjetivoProyectoRequest[]} [objetivos] lista dinámica
 * @property {RequerimientoGralRequest[]} [requerimientosGral] lista dinámica
 * @property {MoodboardRequest} [moodboard]
 */

/**
 * @typedef {Object} RequerimientoGralModificarRequest
 *   Igual que RequerimientoGralRequest más el id de un requerimiento existente.
 *   Si se envía, debe pertenecer al proyecto y NO estar satisfecho.
 * @property {number} [idRequerimientoGral] sólo en requerimientos existentes
 *           editables (omitir en los nuevos)
 * @property {number} cantidad > 0
 * @property {number} idProfesion debe existir
 * @property {string} [descripcion] máx. 200 caracteres
 * @property {CaracteristicaRequerimientoRequest[]} [caracteristicas]
 * @property {number[]} [habilidades]
 */

/**
 * @typedef {Object} ModificarProyectoRequest
 *   UC-36. `nombre` es inmutable y no forma parte del request. Ausente/null
 *   significa "no cambiar" en todos los opcionales, salvo `ubicacion`:
 *   omitirla en Borrador borra la ubicación (por eso el front la reenvía
 *   siempre salvo que el usuario la quite explícitamente). `[]` en
 *   `objetivos` elimina todos; en `requerimientosGral` elimina los no
 *   satisfechos (los satisfechos se conservan solos).
 * @property {string} descripcion máx. 200; no blanco
 * @property {"PUBLICO"|"PRIVADO"} privacidad
 * @property {boolean|null} [aceptaPostulacionGral] null/omitido = no cambia
 * @property {string|null} [fechaEntregaEstipulada] "YYYY-MM-DD"; null/omitido
 *           = no cambia (no se puede borrar por este endpoint)
 * @property {UbicacionProyectoRequest|null} [ubicacion] null sólo permitido en
 *           Borrador; en Publicado/Confirmado es obligatoria (400 si falta)
 * @property {ObjetivoProyectoRequest[]|null} [objetivos] si se envía
 *           reemplaza todos; [] elimina todos
 * @property {RequerimientoGralModificarRequest[]|null} [requerimientosGral]
 *           lista completa deseada (no delta); excluir los satisfechos
 * @property {MoodboardRequest|null} [moodboard] si se envía actualiza/crea;
 *           descripcion null borra la descripción
 */

/**
 * @typedef {Object} UbicacionProyectoResponse
 * @property {number} idUbicacion
 * @property {string|null} direccion
 * @property {string|null} codigoPostal
 * @property {number|null} latitud
 * @property {number|null} longitud
 * @property {Object|null} ciudad
 * @property {number} [ciudad.idCiudad]
 * @property {string} [ciudad.idExterno] id Georef, ej. "06049010000"
 * @property {string} [ciudad.nombre]
 * @property {Object} [ciudad.provincia]
 * @property {number} [ciudad.provincia.idProvincia]
 * @property {string} [ciudad.provincia.idExterno] id Georef, ej. "06"
 * @property {string} [ciudad.provincia.nombre]
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
 * @property {number} cubiertos miembros/asignaciones ACTIVAS vinculadas al
 *           requerimiento; el front no lo deriva
 * @property {number} faltantes max(0, cantidad - cubiertos)
 * @property {boolean} satisfecho cupo completo (`cubiertos >= cantidad`), no
 *           "al menos una postulación ACEPTADA" (ficha UC-26 §11). Con cupo
 *           completo no se puede editar/eliminar desde UC-36 y se excluye del
 *           payload de modificación (ficha UC-36 §7)
 * @property {boolean} puedePostularse fuente de verdad por requerimiento:
 *           true sólo si el perfil activo puede postularse a ESTE
 *           requerimiento (estado del proyecto, membresía, profesión y cupo).
 *           Usar este campo para habilitar el botón; no recalcular en el front.
 */

/**
 * @typedef {"GENERAL"|"ACTIVIDAD"} TipoPostulacion
 */

/**
 * @typedef {"PENDIENTE"|"ACEPTADA"|"RECHAZADA"} EstadoPostulacion
 */

/**
 * @typedef {Object} PostulacionResponse
 *   UC-26. Respuesta de POST /proyectos/{idProyecto}/postulaciones/{general|actividad}.
 * @property {number} idPostulacion
 * @property {TipoPostulacion} tipo
 * @property {EstadoPostulacion} estado siempre "PENDIENTE" al crear
 * @property {string} fechaPostulacion ISO-8601 del servidor
 * @property {number} idProyecto
 * @property {number} idRequerimiento idRequerimientoGral o
 *           idRequerimientoActividad según `tipo`
 * @property {boolean} tentativa true si la disponibilidad se evaluó de forma
 *           provisional; siempre false en postulaciones generales
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
 * @typedef {Object} CancelarProyectoRequest
 *   UC-35. Único campo del body: no enviar idPerfilActivo, idUsuario ni estado.
 * @property {string} motivoCancelacion obligatorio; no vacío ni sólo espacios;
 *           máx. 200 caracteres. El sistema lo persiste sin espacios al
 *           inicio/final y lo devuelve en `ProyectoResponse.motivoCancelacion`.
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
 * @property {boolean} [elegibleParaPostularse] resumen global histórico;
 *           true sólo si el proyecto está Publicado o Confirmado, el perfil no
 *           es miembro activo, el proyecto acepta postulaciones generales y la
 *           profesión del perfil activo coincide con algún requerimiento
 *           general. NO evalúa cupo ni es la fuente de verdad por
 *           requerimiento: para el gating usar
 *           `requerimientosGral[].puedePostularse`. Sólo en
 *           GET /proyectos/{idProyecto}
 * @property {string|null} [motivoCancelacion] UC-35: motivo ingresado al
 *           cancelar; null si el proyecto no está cancelado. Presente en
 *           GET /proyectos/{idProyecto}, POST /proyectos, POST
 *           /proyectos/{idProyecto}/publicar y PUT /proyectos/{idProyecto}.
 *           `GET /proyectos/propios` usa otro DTO y NO lo incluye.
 */

/**
 * @typedef {Object} BloqueoConfirmacionResponse
 *   UC-60. Motivo por el que el proyecto todavía no puede confirmarse.
 * @property {string} codigo uno de los códigos de la ficha §4
 * @property {string} mensaje texto listo para mostrar
 * @property {string|null} entidadTipo entidad afectada (p. ej.
 *           "REQUERIMIENTO_GRAL"); no se usa para navegar
 * @property {number|null} entidadId id de la entidad afectada
 */

/**
 * @typedef {Object} RequerimientoConfirmacionResponse
 *   UC-60. Mismo shape para requerimientos generales y de actividad.
 * @property {number} idRequerimiento id del requerimiento (general o actividad)
 * @property {number|null} idActividad null en los requerimientos generales
 * @property {string|null} nombreActividad null en los requerimientos generales
 * @property {number} idProfesion
 * @property {string} nombreProfesion
 * @property {number} cantidad
 * @property {number} cubiertos
 * @property {number} faltantes
 * @property {boolean} satisfecho `cubiertos >= cantidad`
 */

/**
 * @typedef {Object} PropuestaHorarioResponse
 *   UC-60. Horario propuesto por el planificador; NO está persistido.
 * @property {number} idActividad
 * @property {string} nombre
 * @property {string} inicio ISO-8601 local
 * @property {string} fin ISO-8601 local
 * @property {boolean} fija
 */

/**
 * @typedef {Object} ConfirmacionPreviewResponse
 *   UC-60 GET /proyectos/{id}/confirmacion. Siempre responde 200: los
 *   problemas de negocio/planificación vienen en `bloqueos` con
 *   `puedeConfirmar: false` (y `propuestaHorarios` vacío). Sólo 403/404 son
 *   errores HTTP.
 * @property {boolean} puedeConfirmar
 * @property {string} estado forma legible ("Publicado", etc.)
 * @property {string|null} fechaInicioPropuesta ISO-8601 local; null si no se
 *           pudo calcular
 * @property {string|null} fechaEntrega "YYYY-MM-DD"
 * @property {BloqueoConfirmacionResponse[]} bloqueos
 * @property {RequerimientoConfirmacionResponse[]} requerimientosGenerales
 * @property {RequerimientoConfirmacionResponse[]} requerimientosActividad
 * @property {PropuestaHorarioResponse[]} propuestaHorarios vacío si hay bloqueos
 */

/**
 * @typedef {Object} ConfirmarProyectoResponse
 *   UC-60 POST /proyectos/{id}/confirmar.
 * @property {ProyectoResponse} proyecto proyecto completo ya confirmado;
 *           reemplaza el estado local
 * @property {string} fechaInicioConfirmada ISO-8601 local con hora exacta;
 *           `ProyectoResponse.fechaInicio` sigue siendo "YYYY-MM-DD"
 * @property {{resumen: object, actividades: object[], conflictos: object[]}} cronograma
 *           Se ignora para render: el front reconsulta
 *           GET /proyectos/{id}/cronograma para no duplicar la fuente de verdad
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
 *   sistema: solo aparecen proyectos visibles para el perfil activo
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

/**
 * @typedef {Object} MiembroProyectoResponse
 *   Item de `GET /proyectos/{idProyecto}/miembros` (UC-70). Sólo incluye
 *   miembros con participación ACTIVA.
 * @property {number} idMiembro
 * @property {number} idPerfil clave para el POST de asignación
 * @property {number} idUsuario
 * @property {string} nombreArtistico
 * @property {string} nombreUsuario
 * @property {string} apellidoUsuario
 * @property {number} idProfesion
 * @property {string} nombreProfesion
 * @property {"DIRECTOR"|"MIEMBRO"} rol
 * @property {"ACTIVO"|string} estadoParticipacion
 */

/**
 * @typedef {Object} PaginaMiembrosResponse
 * @property {MiembroProyectoResponse[]} contenido
 * @property {number} paginaActual base 0
 * @property {number} tamanoPagina
 * @property {number} totalElementos
 * @property {number} totalPaginas
 * @property {boolean} primera
 * @property {boolean} ultima
 */

/**
 * @typedef {Object} BuscarMiembrosParams
 * @property {string} [nombre] busca por nombre artístico, nombre o apellido
 * @property {"DIRECTOR"|"MIEMBRO"} [rol]
 * @property {number|string} [idProfesion]
 * @property {number} [page] base 0, default 0
 * @property {number} [size] default 20
 * @property {boolean} [todos] true devuelve todo sin paginar
 */

const proyectoService = {
  /**
   * GET /proyectos/{idProyecto}/miembros — UC-70.
   * Puebla el selector de destinatario de una actividad. Devuelve sólo
   * miembros ACTIVOS y requiere `VER_PROYECTO`.
   *
   * Errores:
   * - 400 filtro de rol o profesión inválido
   * - 403 sin perfil activo, sin membresía activa o sin `VER_PROYECTO`
   * - 404 perfil activo o proyecto inexistente
   * @param {number|string} idProyecto
   * @param {BuscarMiembrosParams} [params]
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: PaginaMiembrosResponse}>} 200 OK
   */
  listarMiembros(idProyecto, params = {}, signal) {
    const query = serializarParams({
      nombre: String(params.nombre || "").trim(),
      rol: params.rol || "",
      idProfesion: params.idProfesion ?? "",
      page: params.page ?? 0,
      size: params.size ?? 20,
      todos: params.todos === true ? true : undefined,
    });
    return http.get(
      `/proyectos/${idProyecto}/miembros${query ? `?${query}` : ""}`,
      { signal }
    );
  },

  /**
   * GET /proyectos/propios — lista los proyectos en los que participa el
   * perfil activo de la sesión como director o miembro (UC-29 bis).
   * El id del perfil activo lo resuelve el sistema desde la sesión: no se envía.
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
   * activo lo resuelve el sistema desde la sesión: no se envía.
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
   * del consultante (`rolUsuario`, `esMiembro`, `permisos`) y
   * `requerimientosGral[].puedePostularse` para condicionar la UI sin
   * llamadas extra. `elegibleParaPostularse` queda como resumen global
   * deprecado para el gating.
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
   * POST /proyectos/{idProyecto}/postulaciones/general — UC-26.
   * Da de alta una postulación PENDIENTE a un requerimiento general. El
   * sistema resuelve el perfil activo desde la sesión: NO enviar idPerfil,
   * idPerfilActivo, idUsuario, estado, tipo, tentativa ni idProyecto en el
   * body (el proyecto va en la URL). El body debe tener exactamente
   * `{ idRequerimientoGral }`.
   *
   * Errores:
   * - 400 MethodArgumentNotValidException → falta idRequerimientoGral
   * - 401 sesión/cuenta no válida
   * - 404 PerfilActivoNoSeleccionadoException / PerfilNoEncontradoException /
   *   requerimiento inexistente o de otro proyecto
   * - 409 proyecto no Publicado/Confirmado, sin postulaciones generales,
   *   perfil miembro, profesión distinta, cupo completo, postulación duplicada
   *   o perfil inactivo
   * @param {number|string} idProyecto
   * @param {number} idRequerimientoGral
   * @param {AbortSignal} [signal] cancela la request en vuelo
   * @returns {Promise<{data: PostulacionResponse}>} 201 Created
   */
  postularARequerimientoGeneral(idProyecto, idRequerimientoGral, signal) {
    return http.post(
      `/proyectos/${idProyecto}/postulaciones/general`,
      { idRequerimientoGral },
      { signal }
    );
  },

  /**
   * POST /proyectos/{idProyecto}/postulaciones/actividad — UC-26.
   * Da de alta una postulación PENDIENTE a un requerimiento de actividad.
   * Mismas reglas de sesión que la postulación general: el body debe tener
   * exactamente `{ idRequerimientoActividad }`. La actividad debe pertenecer
   * al proyecto del path y estar PENDIENTE; el sistema verifica además
   * profesión, cupo, duplicado y disponibilidad (con `tentativa` si el
   * proyecto aún no tiene fecha de inicio confirmada).
   *
   * Errores:
   * - 400 MethodArgumentNotValidException → falta idRequerimientoActividad
   * - 401 sesión/cuenta no válida
   * - 404 perfil activo, perfil, requerimiento inexistente o de otro proyecto
   * - 409 proyecto no Publicado/Confirmado, director, actividad no PENDIENTE,
   *   profesión distinta, cupo completo, postulación duplicada, sin
   *   disponibilidad o perfil inactivo
   * @param {number|string} idProyecto
   * @param {number} idRequerimientoActividad
   * @param {AbortSignal} [signal] cancela la request en vuelo
   * @returns {Promise<{data: PostulacionResponse}>} 201 Created
   */
  postularARequerimientoActividad(idProyecto, idRequerimientoActividad, signal) {
    return http.post(
      `/proyectos/${idProyecto}/postulaciones/actividad`,
      { idRequerimientoActividad },
      { signal }
    );
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
   * POST /proyectos/{idProyecto}/cancelar — cancela un proyecto en estado
   * Publicado o Confirmado (UC-35). Requiere perfil Director activo con el
   * permiso CANCELAR_PROYECTO. La operación NO es idempotente: un segundo
   * intento responde 409. La respuesta 200 tiene el mismo shape que
   * GET /proyectos/{idProyecto}, ya con `estado: "Cancelado"` y el motivo
   * normalizado: el frontend reemplaza los datos locales con ella.
   *
   * Efectos (transaccionales): actividades PENDIENTE/EN_CURSO → CANCELADA,
   * postulaciones e invitaciones pendientes → RECHAZADA y notificaciones.
   * Un exmiembro puede seguir abriendo el detalle (200 con esMiembro: false).
   *
   * Errores:
   * - 400 MethodArgumentNotValidException → body { errores: { motivoCancelacion } }
   * - 403 AccesoDenegadoProyectoException (sin CANCELAR_PROYECTO / no miembro)
   * - 403 director no activo
   * - 404 PerfilActivoNoSeleccionadoException / PerfilNoEncontradoException /
   *   ProyectoNoEncontradoException
   * - 409 estado no cancelable (Borrador/Finalizado/Cancelado) o PerfilEnBaja
   * @param {number} idProyecto
   * @param {string} motivoCancelacion se envía con trim()
   * @param {AbortSignal} [signal] cancela la request en vuelo
   * @returns {Promise<{data: ProyectoResponse}>} 200 OK con el proyecto cancelado
   */
  cancelar(idProyecto, motivoCancelacion, signal) {
    return http.post(
      `/proyectos/${idProyecto}/cancelar`,
      { motivoCancelacion: String(motivoCancelacion || "").trim() },
      { signal }
    );
  },

  /**
   * GET /proyectos/{idProyecto}/confirmacion — UC-60, previsualización.
   * Requiere perfil activo y permiso CONFIRMAR_PROYECTO. Es de solo lectura:
   * NO persiste horarios ni cambia el estado.
   *
   * Siempre responde 200. Los problemas de negocio o de planificación vienen
   * en `bloqueos` con `puedeConfirmar: false` y `propuestaHorarios: []`.
   * No usar `propuestaHorarios` como horarios persistidos: el POST replanifica.
   *
   * Errores:
   * - 403 AccesoDenegadoProyectoException (sin CONFIRMAR_PROYECTO / no miembro)
   * - 404 PerfilActivoNoSeleccionadoException / ProyectoNoEncontradoException
   * @param {number|string} idProyecto
   * @param {AbortSignal} [signal] cancela la request en vuelo
   * @returns {Promise<{data: ConfirmacionPreviewResponse}>} 200 OK
   */
  previsualizarConfirmacion(idProyecto, signal) {
    return http.get(`/proyectos/${idProyecto}/confirmacion`, { signal });
  },

  /**
   * POST /proyectos/{idProyecto}/confirmar — UC-60, confirmación atómica.
   * Sin body. Requiere perfil Director activo con CONFIRMAR_PROYECTO y que el
   * proyecto esté en estado Publicado. Vuelve a planificar (no reutiliza el
   * preview), fija `fechaInicio` con el reloj del sistema, persiste horarios y
   * pasa el proyecto a Confirmado.
   *
   * Errores (ficha §4). El sobre trae `{ message, httpStatus, timestamp,
   * codigo, bloqueos }`; `codigo` corresponde al primer bloqueo y `bloqueos`
   * puede traer varios con el mismo shape del preview:
   * - 403 ACCESO_DENEGADO
   * - 404 PROYECTO_NO_ENCONTRADO / PERFIL_ACTIVO_NO_SELECCIONADO
   * - 409 PROYECTO_YA_CONFIRMADO / ESTADO_PROYECTO_INVALIDO
   * - 409 SIN_ACTIVIDADES / REQUERIMIENTOS_INCOMPLETOS /
   *   ACTIVIDADES_SIN_ASIGNACION / FECHA_ENTREGA_INVALIDA /
   *   CRONOGRAMA_NO_VIABLE / SIN_DISPONIBILIDAD / DATOS_INCONSISTENTES
   * @param {number|string} idProyecto
   * @param {AbortSignal} [signal] cancela la request en vuelo
   * @returns {Promise<{data: ConfirmarProyectoResponse}>} 200 OK
   */
  confirmar(idProyecto, signal) {
    return http.post(`/proyectos/${idProyecto}/confirmar`, null, { signal });
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
   * PUT /proyectos/{idProyecto} — modifica un proyecto existente (UC-36).
   * Requiere perfil activo miembro con el permiso MODIFICAR_PROYECTO. El
   * `nombre` no forma parte del request (es inmutable). Los campos
   * ausentes/null no cambian, salvo `ubicacion` en Borrador (omitirla la
   * borra). La respuesta 200 tiene el mismo contrato que GET
   * /proyectos/{idProyecto}: el frontend reemplaza el estado local con ella.
   *
   * Errores:
   * - 400 MethodArgumentNotValidException → body { errores: { campo: msg } }
   * - 400 UbicacionObligatoriaException (Publicado/Confirmado sin ubicación)
   * - 400 FechaEntregaInvalidaException / RequerimientoInvalidoException
   * - 400 InformacionBasicaIncompletaException → message con los faltantes
   * - 403 AccesoDenegadoProyectoException (sin MODIFICAR_PROYECTO o no miembro)
   * - 404 PerfilActivoNoSeleccionadoException / PerfilNoEncontradoException /
   *   ProyectoNoEncontradoException / HabilidadNoEncontradaException
   * - 409 estado Finalizado/Cancelado, requerimiento satisfecho enviado,
   *   PerfilEnBajaException
   * @param {number} idProyecto
   * @param {ModificarProyectoRequest} request
   * @param {AbortSignal} [signal] cancela la request en vuelo
   * @returns {Promise<{data: ProyectoResponse}>} 200 OK con el proyecto completo
   */
  modificar(idProyecto, request, signal) {
    return http.put(`/proyectos/${idProyecto}`, request, { signal });
  },

  /**
   * POST /proyectos/{idProyecto}/moodboard/imagenes — sube 1 a 10 archivos
   * en una sola petición multipart (ficha UC-24 §7.2). El nombre del campo
   * debe ser exactamente `archivos`. Las imágenes NO viajan en `crear()`: se
   * ejecuta después, sólo si hay archivos retenidos. Si el proyecto se creó
   * sin moodboard, el sistema lo crea al subir (descripcion queda null).
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
