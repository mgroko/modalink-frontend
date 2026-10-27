import http from "./http";

/*
 * Contratos UC-49 (crear actividad) y UC-52 (buscar actividades).
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
 * @property {string} nombre no blanco, máx. 20, único en la planificación
 * @property {string} [descripcion] máx. 200
 * @property {number} duracion entero > 0
 * @property {"DIAS"|"HORAS"} unidadDuracion
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
 * @property {string} nombre no blanco, máx. 20, único en la planificación
 *           excluyendo la propia actividad
 * @property {string|null} [descripcion] null/ausente borra la descripción
 * @property {number} duracion entero > 0
 * @property {"DIAS"|"HORAS"} unidadDuracion
 * @property {string|null} horarioPreferenciaInicio hora HH:mm, sin fecha; null borra la preferencia
 * @property {UbicacionActividadRequest|null} [ubicacion] null/ausente borra la ubicación
 * @property {number[]} predecesoras obligatorio; [] borra todas
 * @property {RequerimientoActividadModificarRequest[]} requerimientos obligatorio;
 *           [] elimina los no protegidos
 * @property {"PENDIENTE"|"EN_CURSO"|"FINALIZADA"|"CANCELADA"} estado
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
 */

/**
 * @typedef {Object} ProfesionalAsignadoActividadResponse
 * @property {number} idAsignacionActividad
 * @property {number} idMiembroProyecto
 * @property {number} idPerfil
 * @property {number} idUsuario
 * @property {string} nombreArtistico
 * @property {number} idProfesion
 * @property {string} nombreProfesion
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
 * @property {boolean|null} parcial true si falta fecha de entrega
 * @property {string|null} horarioPreferenciaInicio hora HH:mm, sin fecha
 * @property {string} estado PENDIENTE | EN_CURSO | FINALIZADA | CANCELADA
 * @property {"NORMAL"|"ALERTA_DESBORDE"} [estadoCronograma]
 * @property {object|null} ubicacion
 * @property {{idActividad:number,nombre:string}[]} predecesoras
 * @property {RequerimientoActividadResponse[]} requerimientos
 * @property {ProfesionalAsignadoActividadResponse[]} [profesionalesAsignados]
 */

/**
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
 * @property {{idRequerimiento:number,cantidad:number,descripcion:string|null,idProfesion:number,nombreProfesion:string}[]} requerimientos
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
 * Serializa query params respetando claves repetidas para arrays, tal como
 * exige UC-52 (`estado=PENDIENTE&estado=EN_CURSO`), sin el formato `estado[]`.
 * @param {Record<string, unknown>} params
 * @returns {string}
 */
function serializarParams(params = {}) {
  const search = new URLSearchParams();

  for (const [clave, valor] of Object.entries(params)) {
    if (valor === undefined || valor === null || valor === "") continue;

    if (Array.isArray(valor)) {
      for (const item of valor) {
        if (item === undefined || item === null || item === "") continue;
        search.append(clave, String(item));
      }
      continue;
    }

    search.append(clave, String(valor));
  }

  return search.toString();
}

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
   * DELETE /proyectos/{idProyecto}/actividades/{idActividad}?motivo={motivo} — UC-51.
   * Elimina una actividad de la planificación. Requiere motivo obligatorio.
   * Es transaccional: si falla una parte, no se aplica ningún cambio.
   * Efectos: elimina actividad, conecta predecesoras con sucesoras,
   * recalcula cronograma, elimina asignaciones (miembros conservados en proyecto),
   * elimina postulaciones/invitaciones y genera notificaciones.
   *
   * Errores:
   * - 400 motivo vacío o inválido
   * - 403 sin perfil activo, membresía activa o permiso ELIMINAR_ACTIVIDAD
   * - 404 proyecto, planificación o actividad inexistente
   * - 409 actividad FINALIZADA o CANCELADA, proyecto en estado no permitido
   *
   * @param {number|string} idProyecto
   * @param {number|string} idActividad
   * @param {string} motivo motivo de la eliminación (máx. 200 chars, no vacío ni solo espacios)
   * @param {AbortSignal} [signal]
   * @returns {Promise<{data: null}>} 204 No Content sin body
   */
  eliminar(idProyecto, idActividad, motivo, signal) {
    const query = encodeURIComponent(String(motivo ?? "").trim());
    return http.delete(
      `/proyectos/${idProyecto}/actividades/${idActividad}?motivo=${query}`,
      { signal }
    );
  }
};

export default actividadService;
