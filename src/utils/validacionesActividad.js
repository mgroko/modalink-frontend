import {
  LIMITES_ACTIVIDAD,
  UNIDADES_DURACION,
  estadosPermitidosActividad,
} from "./actividadConstants.js";
import { normalizarClaveCampo, validarRequerimiento } from "./validacionesProyecto.js";

/*
 * Validaciones de cruce del formulario Crear actividad (UC-49).
 * Las funciones son puras: la vista aporta el estado del formulario.
 */

function presente(valor) {
  return valor !== null && valor !== undefined && valor !== "";
}

function aNumeroONull(valor) {
  if (valor === "" || valor === null || valor === undefined) return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

function validarHorarioPreferencia(valor) {
  if (!presente(valor)) return null;
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(valor))
    ? null
    : "El horario preferido debe tener formato HH:mm.";
}

export function normalizarNombreActividad(nombre) {
  return String(nombre || "").trim().toLocaleLowerCase();
}

/**
 * Valida el formulario completo antes del POST.
 * @param {object} form
 * @param {Object<number, object[]>} [catalogosPorProfesion]
 * @param {Array<{idActividad:number,nombre:string}>} [actividades]
 * @returns {{campos: Object<string,string>, secciones: Object<string,string[]>}}
 */
export function validarActividad(form, catalogosPorProfesion = {}, actividades = []) {
  const campos = {};
  const secciones = {};
  const nombre = String(form?.nombre || "").trim();

  if (!nombre) {
    campos.nombre = "El nombre de la actividad es obligatorio.";
  } else if (nombre.length > LIMITES_ACTIVIDAD.NOMBRE) {
    campos.nombre = `El nombre no puede superar los ${LIMITES_ACTIVIDAD.NOMBRE} caracteres.`;
  } else {
    const duplicado = validarNombreActividadUnico(nombre, actividades);
    if (duplicado) campos.nombre = duplicado;
  }

  const descripcion = String(form?.descripcion || "");
  if (descripcion.length > LIMITES_ACTIVIDAD.DESCRIPCION) {
    campos.descripcion = `La descripción no puede superar los ${LIMITES_ACTIVIDAD.DESCRIPCION} caracteres.`;
  }

  const duracion = Number(form?.duracion);
  if (
    form?.duracion === "" ||
    form?.duracion === null ||
    form?.duracion === undefined ||
    !Number.isFinite(duracion) ||
    !Number.isInteger(duracion) ||
    duracion <= 0
  ) {
    campos.duracion = "La duración debe ser un número entero mayor a 0.";
  }

  if (!Object.values(UNIDADES_DURACION).includes(form?.unidadDuracion)) {
    campos.unidadDuracion = "Seleccioná una unidad de duración válida.";
  }

  const errorHorario = validarHorarioPreferencia(form?.horarioPreferenciaInicio);
  if (errorHorario) campos.horarioPreferenciaInicio = errorHorario;

  if (form?.ubicacion?.provinciaId && !form?.ubicacion?.localidadId) {
    campos.ubicacion = "Seleccioná una localidad para la provincia elegida.";
  }

  const predecesoras = Array.isArray(form?.predecesoras) ? form.predecesoras : [];
  const errorPredecesoras = validarPredecesoras(predecesoras, actividades);
  if (errorPredecesoras) campos.predecesoras = errorPredecesoras;

  const mensajesRequerimiento = [];
  (form?.requerimientos || []).forEach((requerimiento, i) => {
    const { campos: camposReq, seccion } = validarRequerimiento(
      requerimiento,
      catalogosPorProfesion[requerimiento.idProfesion]
    );

    for (const [clave, mensaje] of Object.entries(camposReq)) {
      campos[`requerimientos.${i}.${clave}`] = mensaje;
    }

    const descripcionReq = String(requerimiento?.descripcion || "");
    if (descripcionReq.length > LIMITES_ACTIVIDAD.REQUERIMIENTO_DESCRIPCION) {
      campos[`requerimientos.${i}.descripcion`] =
        `La descripción no puede superar los ${LIMITES_ACTIVIDAD.REQUERIMIENTO_DESCRIPCION} caracteres.`;
    }

    mensajesRequerimiento.push(...seccion);
  });

  if (mensajesRequerimiento.length > 0) {
    secciones.requerimientos = [...new Set(mensajesRequerimiento)];
  }

  return { campos, secciones };
}

/**
 * Valida el formulario completo antes del PUT de UC-50.
 * Excluye la propia actividad del control de nombre y de predecesoras, y
 * valida la transición de estado contra la matriz.
 * @param {object} form
 * @param {Object<number, object[]>} [catalogosPorProfesion]
 * @param {Array<{idActividad:number,nombre:string}>} [actividades]
 * @param {{idActividad:number,estado:string}|null} [actividadActual]
 * @returns {{campos: Object<string,string>, secciones: Object<string,string[]>}}
 */
export function validarActividadEdicion(
  form,
  catalogosPorProfesion = {},
  actividades = [],
  actividadActual = null
) {
  const idActual = actividadActual?.idActividad ?? null;

  const otrasActividades = (actividades || []).filter(
    (actividad) =>
      idActual == null || String(actividad?.idActividad) !== String(idActual)
  );

  const { campos, secciones } = validarActividad(
    form,
    catalogosPorProfesion,
    otrasActividades
  );

  if (
    idActual != null &&
    (form?.predecesoras || []).some(
      (id) => String(id) === String(idActual)
    )
  ) {
    campos.predecesoras = "La actividad no puede ser su propia predecesora.";
  }

  const permitidos = estadosPermitidosActividad(actividadActual?.estado);
  if (!permitidos.includes(form?.estado)) {
    campos.estado =
      "El estado seleccionado no es válido para el estado actual de la actividad.";
  }

  return { campos, secciones };
}

/**
 * Unicidad anticipada del nombre dentro de la planificación (409 del sistema).
 * @param {string} nombre
 * @param {Array<{idActividad?:number,nombre:string}>} actividades
 * @param {number|string|null} [idExcluido] actividad que se está editando
 * @returns {string|null}
 */
export function validarNombreActividadUnico(
  nombre,
  actividades = [],
  idExcluido = null
) {
  const normalizado = normalizarNombreActividad(nombre);
  if (!normalizado) return null;

  const existe = (actividades || [])
    .filter(
      (actividad) =>
        idExcluido == null ||
        String(actividad?.idActividad) !== String(idExcluido)
    )
    .some(
      (actividad) => normalizarNombreActividad(actividad?.nombre) === normalizado
    );

  return existe
    ? "Ya existe una actividad con ese nombre en este proyecto."
    : null;
}

/**
 * Sin duplicados, sin la propia actividad y, si se conoce el listado, todas
 * dentro del proyecto.
 * @param {number[]} predecesoras
 * @param {Array<{idActividad:number}>} [actividades]
 * @param {number|string|null} [idActual]
 * @returns {string|null}
 */
export function validarPredecesoras(
  predecesoras,
  actividades = [],
  idActual = null
) {
  if (!Array.isArray(predecesoras) || predecesoras.length === 0) return null;

  if (new Set(predecesoras).size !== predecesoras.length) {
    return "No podés seleccionar la misma actividad predecesora dos veces.";
  }

  if (
    idActual != null &&
    predecesoras.some((id) => String(id) === String(idActual))
  ) {
    return "La actividad no puede ser su propia predecesora.";
  }

  if (Array.isArray(actividades) && actividades.length > 0) {
    const ids = new Set(
      actividades.map((actividad) => String(actividad.idActividad))
    );
    if (predecesoras.some((id) => !ids.has(String(id)))) {
      return "Una de las predecesoras ya no pertenece a este proyecto.";
    }
  }

  return null;
}

/**
 * Normaliza las claves de `data.errores` de un 400 de UC-49.
 * @param {Record<string,string>} errores
 * @returns {Record<string,string>}
 */
export function mapearErroresActividad(errores) {
  if (!errores || typeof errores !== "object") return {};
  const mapeados = {};
  for (const [clave, mensaje] of Object.entries(errores)) {
    if (mensaje) mapeados[normalizarClaveCampo(clave)] = mensaje;
  }
  return mapeados;
}

/**
 * Construye el body del POST /actividades.
 * @param {object} form
 * @returns {import("../services/actividadService.js").CrearActividadRequest}
 */
export function buildActividadRequest(form) {
  const request = {
    nombre: String(form?.nombre || "").trim(),
    duracion: Number(form?.duracion),
    unidadDuracion: form?.unidadDuracion,
    horarioPreferenciaInicio: presente(form?.horarioPreferenciaInicio)
      ? String(form.horarioPreferenciaInicio)
      : null,
  };

  const descripcion = String(form?.descripcion || "").trim();
  if (descripcion) request.descripcion = descripcion;

  const localidadId = form?.ubicacion?.localidadId;
  if (localidadId) {
    request.ubicacion = { localidadId };
    if (form.ubicacion.provinciaId) {
      request.ubicacion.provinciaId = form.ubicacion.provinciaId;
    }
  }

  const predecesoras = (form?.predecesoras || [])
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id));
  if (predecesoras.length > 0) request.predecesoras = predecesoras;

  const requerimientos = (form?.requerimientos || []).map((requerimiento) => {
    const item = {
      cantidad: Number(requerimiento.cantidad),
      idProfesion: requerimiento.idProfesion,
      caracteristicas: (requerimiento.caracteristicas || []).map((carac) => ({
        idCaracteristica: carac.idCaracteristica,
        valorMin: aNumeroONull(carac.valorMin),
        valorMax: aNumeroONull(carac.valorMax),
        valores: Array.isArray(carac.valores) ? carac.valores : [],
      })),
      habilidades: Array.isArray(requerimiento.habilidades)
        ? requerimiento.habilidades
        : [],
    };

    const descripcionReq = String(requerimiento.descripcion || "").trim();
    if (descripcionReq) item.descripcion = descripcionReq;

    return item;
  });
  if (requerimientos.length > 0) request.requerimientos = requerimientos;

  return request;
}

/**
 * Construye el body del PUT /actividades (reemplazo total, UC-50).
 * Envía siempre ambas listas y `estado`; `null` explícito borra descripción
 * y ubicación.
 * @param {object} form
 * @returns {import("../services/actividadService.js").ModificarActividadRequest}
 */
export function buildModificarActividadRequest(form) {
  const descripcion = String(form?.descripcion || "").trim();

  const localidadId = form?.ubicacion?.localidadId;
  const ubicacion = localidadId
    ? {
        localidadId,
        ...(form.ubicacion.provinciaId
          ? { provinciaId: form.ubicacion.provinciaId }
          : {}),
      }
    : null;

  const predecesoras = (form?.predecesoras || [])
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id));

  const requerimientos = (form?.requerimientos || []).map((requerimiento) => {
    const item = {
      cantidad: Number(requerimiento.cantidad),
      idProfesion: requerimiento.idProfesion,
      descripcion: String(requerimiento.descripcion || "").trim() || null,
      caracteristicas: (requerimiento.caracteristicas || []).map((carac) => ({
        idCaracteristica: carac.idCaracteristica,
        valorMin: aNumeroONull(carac.valorMin),
        valorMax: aNumeroONull(carac.valorMax),
        valores: Array.isArray(carac.valores) ? carac.valores : [],
      })),
      habilidades: Array.isArray(requerimiento.habilidades)
        ? requerimiento.habilidades
        : [],
    };

    if (requerimiento.idRequerimiento != null) {
      item.idRequerimiento = requerimiento.idRequerimiento;
    }

    return item;
  });

  return {
    nombre: String(form?.nombre || "").trim(),
    descripcion: descripcion || null,
    duracion: Number(form?.duracion),
    unidadDuracion: form?.unidadDuracion,
    horarioPreferenciaInicio: presente(form?.horarioPreferenciaInicio)
      ? String(form.horarioPreferenciaInicio)
      : null,
    ubicacion,
    predecesoras,
    requerimientos,
    estado: form?.estado,
  };
}
