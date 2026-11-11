import { reactive } from "vue";
import solicitudColaboracionService from "./solicitudColaboracionService";
import { ESTADOS_SOLICITUD_COLABORACION } from "../utils/solicitudesColaboracionConstants.js";

const state = reactive({
  /** Solicitudes de colaboración recibidas pendientes. */
  pendientesRecibidas: 0,
  cargando: false,
});

let idCarga = 0;

/**
 * Actualiza el contador global usado por el badge del menú "Solicitudes".
 * El backend resuelve el perfil activo desde la sesión.
 * @returns {Promise<void>}
 */
async function cargarResumenSolicitudesColaboracion() {
  const corrida = ++idCarga;
  state.cargando = true;

  try {
    const response = await solicitudColaboracionService.listar({
      direccion: "RECIBIDA",
      estado: ESTADOS_SOLICITUD_COLABORACION.PENDIENTE,
      page: 0,
      size: 1,
    });
    if (corrida !== idCarga) return;

    const total = Number(response?.data?.totalElementos);
    state.pendientesRecibidas = Number.isFinite(total) ? total : 0;
  } catch {
    if (corrida === idCarga) state.pendientesRecibidas = 0;
  } finally {
    if (corrida === idCarga) state.cargando = false;
  }
}

export { state, cargarResumenSolicitudesColaboracion };
