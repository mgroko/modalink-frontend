import { reactive } from "vue";
import invitacionService from "./invitacionService";

const state = reactive({
  pendientesRecibidas: 0,
  cargando: false,
});

let idCarga = 0;

/**
 * Actualiza el contador global de invitaciones recibidas pendientes.
 * Se usa en ambos listados laterales ("Invitaciones (N)").
 * @param {number|string|null|undefined} idPerfil
 * @returns {Promise<void>}
 */
async function cargarResumenInvitaciones(idPerfil) {
  const corrida = ++idCarga;

  if (idPerfil == null || idPerfil === "") {
    state.pendientesRecibidas = 0;
    state.cargando = false;
    return;
  }

  state.cargando = true;
  try {
    const response = await invitacionService.buscar({
      direccion: "RECIBIDA",
      estado: "PENDIENTE",
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

export { state, cargarResumenInvitaciones };
