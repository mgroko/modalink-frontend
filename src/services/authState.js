import { reactive } from "vue";
import authService from "./authService";

const state = reactive({
  usuario: null,
});

function setUsuario(usuario) {
  state.usuario = usuario;
}

function clearUsuario() {
  state.usuario = null;
}

function esAdmin() {
  return state.usuario?.rolGlobal === "Administrador";
}

let sesionRestaurada = false;
let restauracionEnCurso = null;

function restaurarSesion() {
  if (sesionRestaurada) return Promise.resolve();

  if (!restauracionEnCurso) {
    restauracionEnCurso = authService
      .obtenerSesion()
      .then((response) => setUsuario(response?.data || null))
      .catch(() => clearUsuario())
      .finally(() => {
        sesionRestaurada = true;
      });
  }

  return restauracionEnCurso;
}

function marcarSesionRestaurada(usuario) {
  setUsuario(usuario);
  sesionRestaurada = true;
  restauracionEnCurso = null;
}

function limpiarSesion() {
  clearUsuario();
  sesionRestaurada = false;
  restauracionEnCurso = null;
}

export { state, setUsuario, clearUsuario, esAdmin, restaurarSesion, marcarSesionRestaurada, limpiarSesion };
