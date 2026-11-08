import { reactive } from "vue";
import contratoService from "./contratoService.js";

/*
 * Contador global de contratos pendientes de la firma del perfil activo.
 * Se usa en el badge de la sección Contratos del topbar. La fuente de verdad
 * es `GET /contratos/buscar?miFirmaPendiente=true`, que devuelve
 * `totalElementos` sin traer el listado completo.
 */
const state = reactive({
  pendientesFirma: 0,
  cargando: false,
});

let idCarga = 0;

async function cargarContratosPendientes(idPerfil) {
  const corrida = ++idCarga;

  if (idPerfil == null || idPerfil === "") {
    state.pendientesFirma = 0;
    state.cargando = false;
    return;
  }

  state.cargando = true;
  try {
    const response = await contratoService.buscar({
      miFirmaPendiente: true,
      page: 0,
      size: 1,
    });
    if (corrida !== idCarga) return;
    state.pendientesFirma = Number(response?.data?.totalElementos) || 0;
  } catch {
    if (corrida === idCarga) state.pendientesFirma = 0;
  } finally {
    if (corrida === idCarga) state.cargando = false;
  }
}

export { state, cargarContratosPendientes };
