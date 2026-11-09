import { reactive } from "vue";
import solicitudConexionService from "./solicitudConexionService";

/*
 * Contadores de solicitudes de conexión para el badge de Mi red y las tabs.
 * Los conteos se obtienen con `size=1` y se leen de `totalElementos`.
 */

const CONTEO_INICIAL = Object.freeze({
  TODAS: 0,
  PENDIENTE: 0,
  ACEPTADA: 0,
  RECHAZADA: 0,
});

export const state = reactive({
  pendientesRecibidas: 0,
  conteosRecibidas: { ...CONTEO_INICIAL },
  conteosEnviadas: { ...CONTEO_INICIAL },
});

let corridaRecibidas = 0;
let corridaEnviadas = 0;

async function pedirTotal(params) {
  const response = await solicitudConexionService.buscar({
    ...params,
    page: 0,
    size: 1,
  });
  return Number(response?.data?.totalElementos) || 0;
}

function aplicarConteos(direccion, conteos) {
  if (direccion === "RECIBIDA") {
    state.conteosRecibidas = { ...conteos };
    state.pendientesRecibidas = conteos.PENDIENTE;
    return;
  }
  state.conteosEnviadas = { ...conteos };
}

/**
 * Carga los cuatro contadores de una dirección.
 * @param {"RECIBIDA"|"ENVIADA"} direccion
 * @returns {Promise<void>}
 */
export async function cargarConteosSolicitudesConexion(direccion) {
  const esRecibida = direccion === "RECIBIDA";
  const corrida = esRecibida
    ? ++corridaRecibidas
    : ++corridaEnviadas;

  try {
    const [todas, pendientes, aceptadas, rechazadas] = await Promise.all([
      pedirTotal({ direccion, todosLosEstados: true }),
      pedirTotal({ direccion, estado: "PENDIENTE" }),
      pedirTotal({ direccion, estado: "ACEPTADA" }),
      pedirTotal({ direccion, estado: "RECHAZADA" }),
    ]);

    if (
      corrida !== (esRecibida ? corridaRecibidas : corridaEnviadas)
    ) {
      return;
    }

    aplicarConteos(direccion, {
      TODAS: todas,
      PENDIENTE: pendientes,
      ACEPTADA: aceptadas,
      RECHAZADA: rechazadas,
    });
  } catch {
    // Best-effort: los contadores no deben romper la pantalla.
  }
}

/**
 * Contador liviano para el badge global de Mi red.
 * @param {number|null} [idPerfil] se conserva por compatibilidad de llamada
 * @returns {Promise<void>}
 */
export async function cargarPendientesRecibidas(idPerfil = null) {
  if (idPerfil == null) {
    state.pendientesRecibidas = 0;
    return;
  }

  try {
    const total = await pedirTotal({
      direccion: "RECIBIDA",
      estado: "PENDIENTE",
    });
    state.pendientesRecibidas = total;
    state.conteosRecibidas = {
      ...state.conteosRecibidas,
      PENDIENTE: total,
    };
  } catch {
    // Best-effort.
  }
}
