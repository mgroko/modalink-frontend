import { reactive } from "vue";
import colaboracionAutomaticaService from "./colaboracionAutomaticaService";
import { ESTADOS_COLABORACION_AUTOMATICA } from "../utils/colaboracionesAutomaticasConstants.js";

const state = reactive({
  /** Propuestas de colaboración automática pendientes. */
  pendientes: 0,
  cargando: false,
});

let idCarga = 0;

/**
 * Actualiza el contador global usado por el badge de "Solicitudes".
 * El backend resuelve el perfil activo desde la sesión.
 * @returns {Promise<void>}
 */
async function cargarResumenColaboracionesAutomaticas() {
  const corrida = ++idCarga;
  state.cargando = true;

  try {
    const response = await colaboracionAutomaticaService.listar({
      estado: ESTADOS_COLABORACION_AUTOMATICA.PENDIENTE,
      page: 0,
      size: 1,
    });
    if (corrida !== idCarga) return;

    const data = response?.data;
    const total = Number(data?.totalElementos);
    state.pendientes = Number.isFinite(total)
      ? total
      : Array.isArray(data)
        ? data.length
        : Array.isArray(data?.contenido)
          ? data.contenido.length
          : 0;
  } catch {
    if (corrida === idCarga) state.pendientes = 0;
  } finally {
    if (corrida === idCarga) state.cargando = false;
  }
}

export { state, cargarResumenColaboracionesAutomaticas };
