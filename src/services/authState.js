import { reactive } from "vue";

const state = reactive({
  usuario: null,
});

function setUsuario(usuario) {
  state.usuario = usuario;
}

function clearUsuario() {
  state.usuario = null;
}

export { state, setUsuario, clearUsuario };
