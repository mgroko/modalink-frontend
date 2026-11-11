import { reactive } from "vue";
import publicacionService from "./publicacionService";
import { idPerfilActivo, onPerfilActivoChange } from "./authState";
import { esErrorPublicacionNoDisponible } from "../utils/apiError.js";

/*
 * Estado compartido de interacciones por publicación (UC-66).
 *
 * Las tarjetas del feed, el portfolio y el modal leen el mismo estado para
 * que un Me gusta o un comentario se refleje en todas las vistas sin recargar.
 * La fuente de verdad siempre es la respuesta del backend.
 */

const state = reactive({
  porPublicacion: {},
  idPerfilActivo: null,
});

function clave(idPublicacion) {
  if (idPublicacion == null || idPublicacion === "") return null;
  return String(idPublicacion);
}

function numero(valor) {
  const n = Number(valor);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function asegurarPerfil() {
  const actual = idPerfilActivo();
  if (String(state.idPerfilActivo) === String(actual)) return;

  state.porPublicacion = {};
  state.idPerfilActivo = actual;
}

function estadoVacio(publicacion = null) {
  return {
    meGusta: publicacion?.meGusta === true,
    cantidadMeGusta: numero(publicacion?.cantidadMeGusta),
    cantidadComentarios: numero(publicacion?.cantidadComentarios),
    pendienteMeGusta: false,
    noDisponible: false,
  };
}

/**
 * Hidrata el estado desde una publicación del backend.
 * No pisa un Me gusta pendiente para no perder la operación en curso.
 *
 * `forzar` se usa cuando la publicación viene de una consulta fresca
 * (detalle o listado). Las tarjetas que sólo traen datos de un listado
 * cacheado no deben pisar un estado más nuevo logrado por interacción.
 *
 * @param {object|null|undefined} publicacion
 * @param {boolean} [forzar]
 */
export function sincronizarPublicacion(publicacion, forzar = false) {
  const id = clave(publicacion?.idPublicacion);
  if (!id) return;

  asegurarPerfil();
  const actual = state.porPublicacion[id];
  if (actual?.pendienteMeGusta) return;
  if (actual && !forzar) return;

  state.porPublicacion[id] = {
    ...(actual || {}),
    meGusta: publicacion.meGusta === true,
    cantidadMeGusta: numero(publicacion.cantidadMeGusta),
    cantidadComentarios: numero(publicacion.cantidadComentarios),
    pendienteMeGusta: false,
    noDisponible: false,
  };
}

/**
 * @param {object[]} publicaciones
 * @param {boolean} [forzar]
 */
export function sincronizarPublicaciones(publicaciones, forzar = true) {
  if (!Array.isArray(publicaciones)) return;
  for (const publicacion of publicaciones) {
    sincronizarPublicacion(publicacion, forzar);
  }
}

/**
 * Devuelve el estado vigente de una publicación. Si todavía no fue
 * hidratada, usa los valores que trae la tarjeta como fallback.
 * @param {number|string|null|undefined} idPublicacion
 * @param {object|null|undefined} publicacion
 * @returns {{
 *   meGusta: boolean,
 *   cantidadMeGusta: number,
 *   cantidadComentarios: number,
 *   pendienteMeGusta: boolean,
 *   noDisponible: boolean
 * }}
 */
export function estadoInteraccion(idPublicacion, publicacion = null) {
  const id = clave(idPublicacion);
  if (!id) return estadoVacio(publicacion);

  return state.porPublicacion[id] || estadoVacio(publicacion);
}

function aplicarMeGusta(idPublicacion, data) {
  const id = clave(idPublicacion);
  if (!id) return;

  const actual = state.porPublicacion[id] || estadoVacio();
  state.porPublicacion[id] = {
    ...actual,
    meGusta: data?.meGusta === true,
    cantidadMeGusta: numero(data?.cantidadMeGusta),
    pendienteMeGusta: false,
    noDisponible: false,
  };
}

/**
 * Alterna Me gusta usando el estado actual como fuente para elegir POST o
 * DELETE. El backend no alterna por sí solo.
 * @param {object} publicacion
 * @returns {Promise<object|null>}
 */
export async function alternarMeGusta(publicacion) {
  const id = clave(publicacion?.idPublicacion);
  if (!id) return null;

  asegurarPerfil();
  const perfilSolicitud = state.idPerfilActivo;
  const actual = estadoInteraccion(id, publicacion);
  if (actual.pendienteMeGusta || actual.noDisponible) return null;

  const previo = { ...actual };
  const siguienteMeGusta = !actual.meGusta;
  state.porPublicacion[id] = {
    ...actual,
    meGusta: siguienteMeGusta,
    cantidadMeGusta: Math.max(
      0,
      numero(actual.cantidadMeGusta) + (siguienteMeGusta ? 1 : -1)
    ),
    pendienteMeGusta: true,
    noDisponible: false,
  };

  try {
    const response = actual.meGusta
      ? await publicacionService.quitarMeGusta(id)
      : await publicacionService.darMeGusta(id);

    if (String(state.idPerfilActivo) !== String(perfilSolicitud)) {
      return null;
    }

    const data = response?.data || {};
    aplicarMeGusta(id, data);
    return data;
  } catch (error) {
    if (String(state.idPerfilActivo) !== String(perfilSolicitud)) {
      throw error;
    }

    // Sólo un 404 de publicación oculta la tarjeta. Un 404 de perfil activo
    // o un 409 de perfil en baja se informan al contenedor sin borrar nada.
    const noDisponible = esErrorPublicacionNoDisponible(error);
    state.porPublicacion[id] = {
      ...previo,
      pendienteMeGusta: false,
      noDisponible: previo.noDisponible || noDisponible,
    };
    throw error;
  }
}

/**
 * Fija el contador de comentarios desde una respuesta paginada.
 * @param {number|string} idPublicacion
 * @param {number} cantidad
 * @param {object|null} publicacion
 */
export function fijarCantidadComentarios(
  idPublicacion,
  cantidad,
  publicacion = null
) {
  const id = clave(idPublicacion);
  if (!id) return;

  asegurarPerfil();
  const actual = state.porPublicacion[id] || estadoVacio(publicacion);
  state.porPublicacion[id] = {
    ...actual,
    cantidadComentarios: numero(cantidad),
  };
}

/**
 * Incrementa el contador de comentarios después de un alta exitosa.
 * @param {number|string} idPublicacion
 * @param {number} [delta]
 * @param {object|null} publicacion
 * @returns {number}
 */
export function incrementarComentarios(
  idPublicacion,
  delta = 1,
  publicacion = null
) {
  const id = clave(idPublicacion);
  if (!id) return 0;

  asegurarPerfil();
  const actual = state.porPublicacion[id] || estadoVacio(publicacion);
  const cantidad = Math.max(0, numero(actual.cantidadComentarios) + delta);
  state.porPublicacion[id] = {
    ...actual,
    cantidadComentarios: cantidad,
  };
  return cantidad;
}

/**
 * @param {number|string} idPublicacion
 */
export function marcarNoDisponible(idPublicacion) {
  const id = clave(idPublicacion);
  if (!id) return;

  asegurarPerfil();
  const actual = state.porPublicacion[id] || estadoVacio();
  state.porPublicacion[id] = {
    ...actual,
    noDisponible: true,
    pendienteMeGusta: false,
  };
}

export function limpiarInteracciones() {
  state.porPublicacion = {};
  state.idPerfilActivo = idPerfilActivo();
}

onPerfilActivoChange(() => {
  limpiarInteracciones();
});

export { state };
