import { reactive } from "vue";
import reemplazoService from "./reemplazoService";
import { ESTADOS_CANDIDATO_REEMPLAZO } from "../utils/reemplazoConstants";

const state = reactive({
  /** Invitaciones que todavía esperan respuesta del profesional. */
  pendientes: 0,
  /** Invitaciones activas: pendientes + aceptadas esperando aprobación. */
  activas: 0,
  cargando: false,
});

let idCarga = 0;

function normalizarLista(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.contenido)) return data.contenido;
  return [];
}

/**
 * Actualiza los contadores desde un listado ya cargado, sin repetir el GET.
 * @param {object[]|null|undefined} lista
 */
function actualizarResumenReemplazos(lista) {
  const items = Array.isArray(lista) ? lista : [];
  state.activas = items.length;
  state.pendientes = items.filter(
    (item) => item?.estado === ESTADOS_CANDIDATO_REEMPLAZO.INVITADO
  ).length;
}

/**
 * Carga el resumen de invitaciones de reemplazo del perfil activo.
 * El backend resuelve el perfil desde la sesión; `idPerfil` sólo se usa para
 * limpiar el estado cuando no hay perfil activo.
 * @param {number|string|null|undefined} idPerfil
 * @returns {Promise<void>}
 */
async function cargarResumenReemplazos(idPerfil) {
  const corrida = ++idCarga;

  if (idPerfil == null || idPerfil === "") {
    state.pendientes = 0;
    state.activas = 0;
    state.cargando = false;
    return;
  }

  state.cargando = true;
  try {
    const response = await reemplazoService.listarInvitaciones();
    if (corrida !== idCarga) return;
    actualizarResumenReemplazos(normalizarLista(response?.data));
  } catch {
    if (corrida === idCarga) {
      state.pendientes = 0;
      state.activas = 0;
    }
  } finally {
    if (corrida === idCarga) state.cargando = false;
  }
}

export {
  state,
  actualizarResumenReemplazos,
  cargarResumenReemplazos,
  normalizarLista as normalizarListaInvitacionesReemplazo,
};
