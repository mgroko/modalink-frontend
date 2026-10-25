import { reactive } from "vue";
import notificacionService from "./notificacionService";

const state = reactive({
  totalUsuario: 0,
  noLeidasUsuario: 0,
  totalPerfil: 0,
  noLeidasPerfil: 0,
});

async function cargarResumenUsuario() {
  try {
    const response = await notificacionService.resumen();
    state.totalUsuario = response?.data?.total ?? 0;
    state.noLeidasUsuario = response?.data?.noLeidas ?? 0;
  } catch {
    state.totalUsuario = 0;
    state.noLeidasUsuario = 0;
  }
}

async function cargarResumenPerfil(idPerfil) {
  if (idPerfil == null) {
    state.totalPerfil = 0;
    state.noLeidasPerfil = 0;
    return;
  }

  try {
    const response = await notificacionService.resumen(idPerfil);
    state.totalPerfil = response?.data?.total ?? 0;
    state.noLeidasPerfil = response?.data?.noLeidas ?? 0;
  } catch {
    state.totalPerfil = 0;
    state.noLeidasPerfil = 0;
  }
}

export {
  state,
  cargarResumenUsuario,
  cargarResumenPerfil,
};
