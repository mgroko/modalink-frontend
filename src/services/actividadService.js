import http from "./http";
import { serializarParams } from "../utils/queryParams.js";

/*
 * Contratos UC-49/UC-50 (ABM de actividades), UC-52 (buscar candidatos),
 * UC-33 (cronograma CPM) y disponibilidad UC-26/UC-70.
 *
 * Importante:
 * - `buscar` es la búsqueda de candidatos (visibilidad, requerimientos, sin
 *   responsables ni CPM).
 * - La pestaña Planificación usa `listarPlanificacion` (sin CPM).
 * - La pestaña Cronograma usa `obtenerCronograma` (fechas absolutas + CPM).
 * - `obtenerDisponibilidad` es de solo lectura: no reserva ni asigna.
 *
 * Tipos JSDoc puro: documentan el shape para el editor, sin tooling TS.
 */

/**
 * @typedef {Object} UbicacionActividadRequest
 * @property {string} localidadId id Georef con ceros a la izquierda
 * @property {string} [provinciaId] id Georef con ceros a la izquierda
 */

/**
 * @typedef {Object} CaracteristicaActividadRequest
 * @property {number} idCaracteristica
 * @property {number|null} [valorMin]
 * @property {number|null} [valorMax]
 * @property {number[]} [valores]
 */

/**
 * @typedef {Object} RequerimientoActividadRequest
 * @property {number} cantidad > 0
 * @property {number} idProfesion
 * @property {string} [descripcion] máx. 200
 * @property {CaracteristicaActividadRequest[]} [caracteristicas]
 * @property {number[]} [habilidades]
 */

/**
 * @typedef {Object} CrearActividadRequest
 * @property {string} nombre no blanco, máx. 100, único en la planificación
 * @property {string} [descripcion] máx. 200
 * @property {number} duracion entero > 0
 * @property {"HORAS"|"MINUTOS"} unidadDuracion
 * @property {string|null} horarioPreferenciaInicio hora HH:mm, sin fecha
 * @property {UbicacionActividadRequest} [ubicacion]
 * @property {number[]} [predecesoras]
 * @property {RequerimientoActividadRequest[]} [requerimientos]
 */

/**
 * @typedef {Object} RequerimientoActividadModificarRequest
 * @property {number} [idRequerimiento] sólo en requerimientos existentes
 * @property {number} cantidad > 0
 * @property {number} idProfesion
 * @property {string|null} [descripcion] máx. 200; null borra la descripción
 * @property {CaracteristicaActividadRequest[]} caracteristicas puede ser []
 * @property {number[]} habilidades puede ser []
 */

/**
 * @typedef {Object} ModificarActividadRequest
 * @property {string} nombre no blanco, máx. 100, único en la planificación
 *           excluyendo la propia actividad
 * @property {string|null} [descripcion] null/ausente borra la descripción
 * @property {number} duracion entero > 0
 * @property {"HORAS"|"MINUTOS"} unidadDuracion
 * @property {string|null} horarioPreferenciaInicio hora HH:mm, sin fecha; null borra la preferencia
 * @property {UbicacionActividadRequest|null} [ubicacion] null/ausente borra la ubicación
 * @property {number[]} predecesoras obligatorio; [] borra todas
 * @property {RequerimientoActividadModificarRequest[]} requerimientos obligatorio;
 *           [] elimina los no protegidos
 * @property {"PENDIENTE"|"EN_CURSO"|"FINALIZADA"|"CANCELADA"} estado
 *           se envía sin cambios; los cambios de estado usan PATCH /estado
 */

/**
 * @typedef {Object} CaracteristicaActividadResponse
 * @property {number} idCaracteristica
 * @property {string} codigo
 * @property {"NUMERICO"|"ENUMERADO"|"TEXTO"} tipoDato
 * @property {number|null} valorMin
 * @property {number|null} valorMax
 * @property {number[]} valores
 */

/**
 * @typedef {Object} RequerimientoActividadResponse
 * @property {number} idRequerimiento
 * @property {number} cantidad
 * @property {string|null} descripcion
 * @property {number} idProfesion
 * @property {string} nombreProfesion
 * @property {CaracteristicaActividadResponse[]} [caracteristicas]
 * @property {number[]} [habilidades]
 * @property {number} [cubiertos] miembros/asignaciones activas vinculadas al
 *           requerimiento
 * @property {number} [faltantes] max(0, cantidad - cubiertos)
 * @property {boolean} [satisfecho] cupo completo (cubiertos >= cantidad)
 * @property {boolean} [puedePostularse] fuente de verdad por requerimiento;
 *           incluye estado del proyecto/actividad, rol, profesión y cupo.
 *           Usarlo para habilitar la acción; no recalcular en el front.
 * @property {boolean|null} [protegido] true = no se puede modificar ni
 *           eliminar en el estado actual del proyecto. Puede ser null en
 *           respuestas de búsqueda; en el detalle siempre se calcula.
 */

/**
 * @typedef {Object} ProfesionalAsignadoActividadResponse
 *   UC-38: puede ser un profesional histórico si `activo` es false. No debe
 *   contarse como recurso actual ni ofrecerse para acciones operativas.
 * @property {number} idAsignacionActividad
 * @property {number} idMiembroProyecto
 * @property {number} idPerfil
 * @property {number} idUsuario
 * @property {string} nombreArtistico
 * @property {number} idProfesion
 * @property {string} nombreProfesion
 * @property {"ACTIVO"|"ELIMINADO"|"BAJA_VOLUNTARIA"|string} [estadoParticipacion]
 * @property {boolean} [activo] true sólo si sigue activo en el proyecto
 */

/**
 * @typedef {Object} ActividadResponse
 * @property {number} idActividad
 * @property {number} idProyecto
 * @property {string} nombreProyecto
 * @property {string} nombre
 * @property {string|null} descripcion
 * @property {number} duracionMinutos
 * @property {string|null} fechaHoraInicio ISO local persistido; null si solo está proyectada
 * @property {string|null} fechaHoraFin ISO local derivado de la fecha persistida
 * @property {string|null} inicioProyectado ISO local calculado sin persistencia
 * @property {string|null} finProyectado ISO local calculado sin persistencia
 * @property {boolean|null} tentativo true cuando el origen del cálculo es estimado
 * @property {boolean|null} conflicto true si la ventana CPM no es factible
 * @property {string|null} motivoConflicto explicación del conflicto CPM
 * @property {boolean|null} parcial true si el cálculo es parcial por otra
 *           causa; en v2 sin fecha de entrega viene null y no se calcula CPM
 * @property {string|null} horarioPreferenciaInicio hora HH:mm, sin fecha
 * @property {string} estado PENDIENTE | EN_CURSO | FINALIZADA | CANCELADA
 * @property {string|null} [origenInicio] ej. "CONFIRMADA" cuando la actividad
 *           se agendó automáticamente al crearse en un proyecto confirmado
 * @property {"NORMAL"|"ALERTA_DESBORDE"|"SIN_FECHA_ENTREGA"} [estadoCronograma]
 * @property {boolean|null} [critica] holgura de makespan igual a cero
 * @property {number|null} [holguraMakespan] minutos de holgura respecto del makespan
 * @property {number|null} [holguraEntrega] minutos de holgura respecto de la entrega;
 *           null sin fecha de entrega
 * @property {RangoFactible|null} [rangoInicio] minutos relativos a t0; el front no los dibuja
 * @property {RangoFactible|null} [rangoEjecucion] minutos relativos a t0; el front no los dibuja
 * @property {boolean|null} [fijo] actividad fija del cronograma
 * @property {boolean|null} [enRutaCritica] pertenece a la cadena que define el makespan
 * @property {string|null} [finConHolgura] fin de la barra clara del Gantt
 * @property {string|null} [tentative] compatibilidad histórica; usar `tentativo`
 * @property {object|null} ubicacion
 * @property {{idActividad:number,nombre:string}[]} predecesoras
 * @property {RequerimientoActividadResponse[]} requerimientos
 * @property {ProfesionalAsignadoActividadResponse[]} [profesionalesAsignados]
 */

/**
 * @typedef {Object} RangoFactible
 * @property {number} inicioMinutos minutos relativos a t0
 * @property {number} finMinutos minutos relativos a t0
 */

/**
 * @typedef {Object} ResponsableActividad
 *   UC-38: en actividades EN_CURSO/FINALIZADA/CANCELADA puede incluir
 *   profesionales históricos (`activo = false`). En PENDIENTE no se muestran.
 * @property {number} [idAsignacionActividad]
 * @property {number} [idMiembroProyecto]
 * @property {number} idPerfil
 * @property {number} idUsuario
 * @property {string} nombreArtistico
 * @property {number} idProfesion
 * @property {string} nombreProfesion
 * @property {"ACTIVO"|"ELIMINADO"|"BAJA_VOLUNTARIA"|string} [estadoParticipacion]
 * @property {boolean} [activo] true sólo si sigue activo en el proyecto
 */

/**
 * Tabla liviana de Planificación: sin CPM ni proyecciones.
 * @typedef {Object} ActividadPlanificacionResponse
 * @property {number} idActividad
 * @property {string} nombre
 * @property {string|null} descripcion
 * @property {number} duracionMinutos
 * @property {string} estado PENDIENTE | EN_CURSO | FINALIZADA | CANCELADA
 * @property {string|null} fechaHoraInicio ISO local persistido
 * @property {string|null} fechaHoraFin ISO local persistido
 * @property {{idActividad:number,nombre:string}[]} predecesoras
 * @property {ResponsableActividad[]} responsables
 */

/**
 * @typedef {Object} PaginaActividadesResponse
 * @property {ActividadPlanificacionResponse[]} contenido
 * @property {number} paginaActual base 0
 * @property {number} tamanoPagina
 * @property {number} totalElementos
 * @property {number} totalPaginas
 * @property {boolean} primera
 * @property {boolean} ultima
 */

/**
 * @typedef {Object} ResumenCronograma
 * @property {string|null} fechaInicio
 * @property {string|null} fechaFinProyectada fin exclusivo (t0 + makespan)
 * @property {string|null} fechaEntrega
 * @property {number|null} makespanMinutos
 * @property {number|null} margenMinutos fuente del margen; no recalcular
 * @property {boolean} tentativo
 * @property {boolean} parcial
 * @property {"NORMAL"|"ALERTA_DESBORDE"|"SIN_FECHA_ENTREGA"} estadoCronograma
 * @property {boolean|null} viable
 * @property {number} totalActividades
 * @property {number} actividadesCriticas
 * @property {number[]} rutaCritica ids ordenados por inicio temprano
 */

/**
 * @typedef {Object} ActividadCronogramaResponse
 * @property {number} idActividad
 * @property {string} nombre
 * @property {string|null} descripcion
 * @property {string} estado
 * @property {number} duracionMinutos
 * @property {{idActividad:number,nombre:string}[]} predecesoras
 * @property {string|null} inicioProyectado proyección CPM; no es una reserva
 * @property {string|null} finProyectado fin exclusivo de la proyección CPM
 * @property {string|null} finConHolgura fin de la barra clara del Gantt;
 *           sigue siendo CPM, no reemplazarlo por fechas persistidas
 * @property {string|null} inicioPersistido fecha real guardada en la actividad
 * @property {string|null} finPersistido fecha real guardada en la actividad
 * @property {boolean|null} critica holgura cero
 * @property {boolean|null} enRutaCritica cadena que define el makespan
 * @property {number|null} holguraMakespan
 * @property {number|null} holguraEntrega
 * @property {RangoFactible|null} rangoInicio
 * @property {RangoFactible|null} rangoEjecucion
 * @property {boolean|null} conflicto
 * @property {string|null} motivoConflicto
 * @property {boolean|null} fijo
 * @property {boolean|null} tentativo
 */

/**
 * @typedef {Object} CronogramaResponse
 * @property {ResumenCronograma} resumen
 * @property {ActividadCronogramaResponse[]} actividades
 * @property {Array<object|string>} conflictos
 */

/**
 * @typedef {Object} IntervaloDisponibilidad
 * @property {string|null} inicio
 * @property {string|null} fin
 */

/**
 * @typedef {Object} DetalleMiembroDisponibilidad
 * @property {number|null} idUsuario
 * @property {string|null} inicioEvaluado
 * @property {string|null} finEvaluado
 * @property {IntervaloDisponibilidad[]} huecos
 * @property {boolean} disponible
 * @property {string|null} motivo
 */

/**
 * @typedef {Object} ResultadoDisponibilidad
 * @property {boolean} disponible
 * @property {boolean} provisional
 * @property {string|null} inicioEvaluado
 * @property {string|null} finEvaluado
 * @property {string|null} inicioSeleccionado
 * @property {string|null} finSeleccionado
 * @property {string|null} motivo
 * @property {"SIN_PREFERENCIA"|"EXACTO"|"DESVIO"|"SIN_LUGAR"|null} resultadoPreferencia
 * @property {number|null} desvioMinutos negativo = antes del preferido;
 *           positivo = después; null sin preferencia o SIN_LUGAR
 * @property {string|null} inicioPreferido fecha/hora de referencia del día
 *           evaluado; la tolerancia se mide contra su hora, no contra la fecha
 * @property {number[]} miembrosBloqueantes ids de usuario que impiden la
 *           intersección; puede venir vacío aunque no haya hueco común. No
 *           usarlo como criterio de bloqueo por sí solo.
 * @property {DetalleMiembroDisponibilidad[]} miembros
 */

/**
 * @typedef {Object} AsignacionActividadResponse
 *   Respuesta de `POST /proyectos/{idProyecto}/actividades/{idActividad}/asignaciones`
 *   (UC-70). La asignación no agenda ni reserva horario.
 * @property {number} idAsignacionActividad
 * @property {number} idProyecto
 * @property {number} idActividad
 * @property {number} idMiembro
 * @property {number} idPerfil
 * @property {number} idUsuario
 * @property {number|null} idRequerimientoActividad requerimiento cubierto; null
 *           si no hubo coincidencia de profesión o si el miembro es director
 * @property {boolean} requerimientoSatisfecho true si el requerimiento quedó
 *           cubierto después de la asignación
 * @property {boolean} provisional true si el proyecto no tiene fecha de inicio
 *           confirmada; el rango evaluado fue [ahora, fechaEntrega]
 * @property {string|null} inicioSeleccionado hueco usado para validar; no se
 *           persiste en la actividad
 * @property {string|null} finSeleccionado hueco usado para validar; no se
 *           persiste en la actividad
 * @property {"SIN_PREFERENCIA"|"EXACTO"|"DESVIO"|"SIN_LUGAR"|null} resultadoPreferencia
 * @property {number|null} desvioMinutos negativo = antes del preferido;
 *           positivo = después; null sin preferencia o SIN_LUGAR
 */

/**
 * @typedef {Object} DesasignacionActividadResponse
 *   Respuesta de `DELETE /proyectos/{idProyecto}/actividades/{idActividad}/asignaciones/{idAsignacionActividad}`.
 *   La desasignación es física y no reabre postulaciones rechazadas.
 * @property {number} idAsignacionActividad
 * @property {number} idProyecto
 * @property {number} idActividad
 * @property {number} idMiembro
 * @property {number|null} idPerfil
 * @property {number|null} idUsuario
 * @property {number|null} idRequerimientoActividad
 * @property {boolean} requerimientoSatisfecho
 * @property {{cantidad:number,cubiertos:number,faltantes:number,satisfecho:boolean}|null} cupo
 * @property {string[]} advertencias
 */

/**
 * Resultado de `GET /actividades/buscar` (UC-52): sólo búsqueda de candidatos.
 * No incluye CPM, proyecciones ni responsables.
 * @typedef {Object} ActividadBusquedaResponse
 * @property {number} idActividad
 * @property {number} idProyecto
 * @property {string} nombreProyecto
 * @property {string} nombre
 * @property {string|null} descripcion
 * @property {number} duracionMinutos
 * @property {string|null} fechaHoraInicio ISO local persistido
 * @property {string|null} fechaHoraFin ISO local derivado
 * @property {string|null} horarioPreferenciaInicio hora HH:mm, sin fecha
 * @property {string} estado PENDIENTE | EN_CURSO | FINALIZADA | CANCELADA
 * @property {{idRequerimiento:number,cantidad:number,descripcion:string|null,idProfesion:number,nombreProfesion:string,cubiertos?:number,faltantes?:number,satisfecho?:boolean,puedePostularse?:boolean}[]} requerimientos
 * @property {{idActividad:number,nombre:string}[]} predecesoras
 */

/**
 * @typedef {Object} BuscarActividadesParams
 * @property {string} [nombre]
 * @property {string} [descripcion]
 * @property {string} [requerimiento]
 * @property {number} [duracionMin] minutos
 * @property {number} [duracionMax] minutos
 * @property {string|string[]} [estado] PENDIENTE | EN_CURSO | FINALIZADA | CANCELADA
 * @property {number} [page] base 0
 * @property {number} [size] default 20
 * @property {boolean} [todos] true = sin paginar
 */

/**
 * Integrante exclusivo de una actividad (UC-51).
 * `puedeEliminar` y `motivoNoEliminable` son la fuente de verdad; no
 * recalcular en el frontend.
 * @typedef {Object} MiembroExclusivoActividadResponse
 * @property {number} idAsignacionActividad
 * @property {number} idMiembro
 * @property {number} idPerfil
 * @property {number} idUsuario
 * @property {string} nombreArtistico
 * @property {number} idProfesion
 * @property {string} nombreProfesion
 * @property {boolean} puedeEliminar
 * @property {"AUTOELIMINACION"|"ULTIMO_DIRECTOR"|"PROYECTO_BORRADOR"|null} motivoNoEliminable
 */

/**
 * @typedef {Object} DecisionEliminarActividadRequest
 * @property {number} idMiembro
 * @property {"ELIMINAR"|"GUARDAR"} accion
 * @property {string} [motivoBaja] máximo 100; si falta se usa `motivo`
 */

/**
 * @typedef {Object} EliminarActividadRequest
 * @property {string} motivo obligatorio, no vacío, máximo 200
 * @property {DecisionEliminarActividadRequest[]} decisiones una por cada
 *           integrante exclusivo; `[]` si no hay ninguno
 */

const actividadService = {
  /**
   * GET /proyectos/{idProyecto}/actividades/{idActividad} — UC-50.
   * Precarga el formulario de edición. Valida perfil activo, membresía y
   * permiso, pero no bloquea por estado del proyecto ni de la actividad.
   *
   * Errores:
   * - 403 sin MODIFICAR_ACTIVIDAD o sin membresía activa
   * - 404 perfil activo, perfil, proyecto o actividad inexistente
   * - 409 perfil en baja
   * @param {number|string} idProyecto
   * @param {number|string} idActividad
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: ActividadResponse}>} 200 OK
   */
  obtener(idProyecto, idActividad, signal) {
    return http.get(
      `/proyectos/${idProyecto}/actividades/${idActividad}`,
      { signal }
    );
  },

  /**
   * PUT /proyectos/{idProyecto}/actividades/{idActividad} — UC-50.
   * Reemplazo total: todos los campos obligatorios y ambas listas deben
   * reenviarse. `descripcion` y `ubicacion` en null borran el dato.
   *
   * Errores:
   * - 400 validaciones de campos, duración, predecesoras, requerimientos,
   *   catálogos o fecha de entrega
   * - 403 sin MODIFICAR_ACTIVIDAD o sin membresía activa
   * - 404 perfil activo, perfil, proyecto, actividad o catálogo inexistente
   * - 409 nombre duplicado, transición inválida, actividad/proyecto no
   *   modificable, requerimiento con vínculos, ciclo o cronograma inviable
   * @param {number|string} idProyecto
   * @param {number|string} idActividad
   * @param {ModificarActividadRequest} request
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: ActividadResponse}>} 200 OK con la actividad actualizada
   */
  modificar(idProyecto, idActividad, request, signal) {
    return http.put(
      `/proyectos/${idProyecto}/actividades/${idActividad}`,
      request,
      { signal }
    );
  },

  /**
   * PATCH /proyectos/{idProyecto}/actividades/{idActividad}/estado — UC-50.
   * Cambia únicamente el estado de la actividad. No se debe usar para editar
   * nombre, descripción, duración, predecesoras ni requerimientos.
   *
   * Matriz:
   * - PENDIENTE → PENDIENTE | EN_CURSO | CANCELADA
   * - EN_CURSO → EN_CURSO | FINALIZADA | CANCELADA
   * - FINALIZADA / CANCELADA → sin transiciones
   *
   * Errores:
   * - 400 estado ausente o inválido
   * - 403 sin MODIFICAR_ACTIVIDAD o sin membresía activa
   * - 404 proyecto o actividad inexistente
   * - 409 transición inválida, actividad finalizada/cancelada, actividad sin
   *   fechaHoraInicio para EN_CURSO/FINALIZADA o proyecto finalizado/cancelado
   * @param {number|string} idProyecto
   * @param {number|string} idActividad
   * @param {"PENDIENTE"|"EN_CURSO"|"FINALIZADA"|"CANCELADA"} estado
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: ActividadResponse}>} 200 OK
   */
  cambiarEstado(idProyecto, idActividad, estado, signal) {
    return http.patch(
      `/proyectos/${idProyecto}/actividades/${idActividad}/estado`,
      { estado },
      { signal }
    );
  },

  /**
   * POST /proyectos/{idProyecto}/actividades — UC-49.
   * La actividad siempre se crea PENDIENTE. No enviar estado ni fechas.
   *
   * Errores:
   * - 400 MethodArgumentNotValidException / reglas de negocio
   * - 403 sin CREAR_ACTIVIDAD o sin membresía activa
   * - 404 perfil activo, proyecto o planificación inexistente
   * - 409 nombre duplicado, estado no permitido, cronograma inviable
   * @param {number|string} idProyecto
   * @param {CrearActividadRequest} request
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: ActividadResponse}>} 201 Created
   */
  crear(idProyecto, request, signal) {
    return http.post(`/proyectos/${idProyecto}/actividades`, request, { signal });
  },

  /**
   * GET /proyectos/{idProyecto}/actividades/buscar — UC-52.
   * Orden fijo: fechaHoraInicio ASC, idActividad ASC.
   * Sin filtros devuelve todas las actividades visibles (paginadas).
   *
   * Errores:
   * - 400 rango de duración inválido o estado fuera del enum
   * - 403 proyecto no visible para el perfil activo
   * - 404 perfil activo o proyecto inexistente
   * @param {number|string} idProyecto
   * @param {BuscarActividadesParams} [params]
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: {
   *   contenido: ActividadBusquedaResponse[],
   *   paginaActual: number,
   *   tamanoPagina: number,
   *   totalElementos: number,
   *   totalPaginas: number,
   *   primera: boolean,
   *   ultima: boolean
   * }}>} 200 OK
   */
  buscar(idProyecto, params = {}, signal) {
    const query = serializarParams(params);
    const url = `/proyectos/${idProyecto}/actividades/buscar${query ? `?${query}` : ""}`;
    return http.get(url, { signal });
  },

  /**
   * GET /proyectos/{idProyecto}/actividades — pestaña Planificación.
   * Tabla liviana: datos básicos, fechas persistidas, predecesoras y
   * responsables. No calcula CPM ni devuelve proyecciones.
   *
   * Errores:
   * - 400 rango de duración inválido o estado fuera del enum
   * - 403 el perfil no es miembro activo del proyecto
   * - 404 perfil activo o proyecto inexistente
   * @param {number|string} idProyecto
   * @param {BuscarActividadesParams} [params] mismos filtros que el listado;
   *           `todos=true` evita paginar
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: PaginaActividadesResponse}>} 200 OK
   */
  listarPlanificacion(idProyecto, params = {}, signal) {
    const query = serializarParams(params);
    const url = `/proyectos/${idProyecto}/actividades${query ? `?${query}` : ""}`;
    return http.get(url, { signal });
  },

  /**
   * GET /proyectos/{idProyecto}/cronograma — pestaña Cronograma (UC-33).
   * Devuelve tarjetas, actividades para el Gantt/tabla CPM y conflictos.
   * Las actividades canceladas no aparecen.
   *
   * Errores:
   * - 400 `SIN_FECHA_ENTREGA`: el proyecto no tiene fecha de entrega; no se
   *   devuelve `resumen` ni `actividades` (ficha v2 §2/§8.2)
   * - 403 el perfil no es miembro activo del proyecto
   * - 404 proyecto inexistente o sin perfil activo
   * - 409 ciclo o cronograma inviable
   * @param {number|string} idProyecto
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: CronogramaResponse}>} 200 OK
   */
  obtenerCronograma(idProyecto, signal) {
    return http.get(`/proyectos/${idProyecto}/cronograma`, { signal });
  },

  /**
   * GET /proyectos/{idProyecto}/actividades/{idActividad}/disponibilidad — UC-26.
   * Consulta de solo lectura: no reserva ni asigna la actividad.
   *
   * - Sin `idPerfil` evalúa el perfil activo del solicitante.
   * - Con `idPerfil` (número o array) evalúa los perfiles indicados; con varios
   *   sólo hay disponibilidad si existe un hueco común.
   * - Consultar otros perfiles requiere ser miembro activo del proyecto.
   *
   * Errores:
   * - 400 `SIN_FECHA_ENTREGA`: el proyecto no tiene fecha de entrega; no se
   *   puede evaluar disponibilidad (ficha v2 §2)
   * - 401 sesión inválida
   * - 403 perfil activo ausente, proyecto no visible o consulta de terceros
   *   sin membresía
   * - 404 perfil, proyecto o actividad inexistente
   * - 409 actividad cancelada
   * @param {number|string} idProyecto
   * @param {number|string} idActividad
   * @param {{idPerfil?: number|string|Array<number|string>|null}} [opciones]
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: ResultadoDisponibilidad}>} 200 OK
   */
  obtenerDisponibilidad(idProyecto, idActividad, { idPerfil = null } = {}, signal) {
    const perfiles = Array.isArray(idPerfil)
      ? idPerfil
      : idPerfil != null
        ? [idPerfil]
        : [];
    const query = serializarParams({ idPerfil: perfiles });
    const url = `/proyectos/${idProyecto}/actividades/${idActividad}/disponibilidad${
      query ? `?${query}` : ""
    }`;
    return http.get(url, { signal });
  },

  /**
   * POST /proyectos/{idProyecto}/actividades/{idActividad}/asignaciones — UC-70.
   * Asigna directamente una actividad a un miembro activo del proyecto. El
   * body sólo lleva `{ idPerfil }`: no enviar idMiembro, idUsuario, idProyecto,
   * idActividad ni horarios.
   *
   * La asignación no agenda ni reserva un horario. `inicioSeleccionado` y
   * `finSeleccionado` de la respuesta son el hueco usado para validar y no se
   * persisten en la actividad.
   *
   * Errores:
   * - 400 `idPerfil` nulo/inválido o proyecto sin fecha de entrega
   * - 403 sin perfil activo, sin membresía o sin `ASIGNAR_ACTIVIDAD`
   * - 404 proyecto, actividad o perfil inexistente
   * - 409 perfil no es miembro activo, usuario/perfil inactivo, duplicado,
   *   estado del proyecto/actividad no permitido, sin agenda o sin
   *   disponibilidad (incluye `motivo`, `provisional`, `inicioEvaluado`,
   *   `finEvaluado` y `miembrosBloqueantes`)
   * @param {number|string} idProyecto
   * @param {number|string} idActividad
   * @param {number|string} idPerfil
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: AsignacionActividadResponse}>} 201 Created
   */
  asignar(idProyecto, idActividad, idPerfil, signal) {
    return http.post(
      `/proyectos/${idProyecto}/actividades/${idActividad}/asignaciones`,
      { idPerfil },
      { signal }
    );
  },

  /**
   * DELETE /proyectos/{idProyecto}/actividades/{idActividad}/asignaciones/{idAsignacionActividad} - UC-70.
   * Quita físicamente una asignación. No requiere fecha de entrega ni motivo.
   * Si la asignación cubría un requerimiento, el backend devuelve el cupo
   * recalculado y las advertencias no bloqueantes.
   *
   * Errores:
   * - 403 sin perfil activo, sin membresía o sin `ASIGNAR_ACTIVIDAD`
   * - 404 proyecto, actividad o asignación inexistente
   * - 409 proyecto/actividad no permitidos o miembro histórico
   * @param {number|string} idProyecto
   * @param {number|string} idActividad
   * @param {number|string} idAsignacionActividad
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: DesasignacionActividadResponse}>} 200 OK
   */
  desasignar(idProyecto, idActividad, idAsignacionActividad, signal) {
    return http.delete(
      `/proyectos/${idProyecto}/actividades/${idActividad}/asignaciones/${idAsignacionActividad}`,
      { signal }
    );
  },

  /**
   * GET /proyectos/{idProyecto}/actividades/{idActividad}/miembros-exclusivos
   * — UC-51.
   *
   * Devuelve sólo integrantes ACTIVOS que participan únicamente de esta
   * actividad en el proyecto. Los miembros con otras actividades no canceladas
   * se conservan automáticamente y no aparecen.
   *
   * `puedeEliminar` y `motivoNoEliminable` son la fuente de verdad: no
   * recalcular en el frontend.
   *
   * Errores:
   * - 401 sesión ausente/vencida
   * - 403 sin perfil activo, sin membresía activa o sin `ELIMINAR_ACTIVIDAD`
   * - 404 perfil activo, proyecto o actividad inexistente
   *
   * @param {number|string} idProyecto
   * @param {number|string} idActividad
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: MiembroExclusivoActividadResponse[]}>} 200 OK;
   *           puede ser `[]`
   */
  listarMiembrosExclusivos(idProyecto, idActividad, signal) {
    return http.get(
      `/proyectos/${idProyecto}/actividades/${idActividad}/miembros-exclusivos`,
      { signal }
    );
  },

  /**
   * POST /proyectos/{idProyecto}/actividades/{idActividad}/eliminar — UC-51.
   *
   * Elimina la actividad y resuelve en una sola transacción qué hacer con los
   * integrantes exclusivos. Reemplaza al antiguo
   * `DELETE .../actividades/{idActividad}?motivo=`, que ya no existe.
   *
   * Reglas del body:
   * - `motivo` obligatorio, no vacío, máximo 200; no truncar.
   * - `decisiones` obligatorio (puede ser `[]`); una por cada integrante
   *   exclusivo activo, sin duplicados ni miembros ajenos.
   * - `ELIMINAR` sólo si `puedeEliminar === true`.
   * - `motivoBaja` opcional, máximo 100; si falta se usa `motivo`.
   * - Si `motivo` supera 100 y una decisión `ELIMINAR` no trae `motivoBaja`,
   *   el backend responde 400.
   *
   * Errores:
   * - 400 `motivo` inválido (`errores.motivo`) o decisiones inválidas
   *   (`errores["decisiones[i].motivoBaja"]` o `message` con el id en texto)
   * - 401 sesión ausente/vencida
   * - 403 sin perfil activo, sin membresía o sin `ELIMINAR_ACTIVIDAD`; si hay
   *   decisiones `ELIMINAR`, UC-38 también exige `ELIMINAR_INTEGRANTE` y rol
   *   Director
   * - 404 proyecto, planificación, actividad o miembro inexistente
   * - 409 actividad FINALIZADA/CANCELADA, proyecto no permitido, actividad
   *   EN_CURSO en proyecto CONFIRMADO o integrante no eliminable
   *
   * @param {number|string} idProyecto
   * @param {number|string} idActividad
   * @param {EliminarActividadRequest} request
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: null}>} 204 No Content sin body
   */
  eliminarConDecisiones(idProyecto, idActividad, request = {}, signal) {
    const motivo = String(request.motivo ?? "").trim();
    const decisiones = Array.isArray(request.decisiones)
      ? request.decisiones
      : [];
    return http.post(
      `/proyectos/${idProyecto}/actividades/${idActividad}/eliminar`,
      { motivo, decisiones },
      { signal }
    );
  }
};

export default actividadService;
