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

// Permisos que posee el rol Administrador. /auth/me solo expone el rol, no la
// lista de permisos, por lo que se derivan del rol registrado del usuario.
const PERMISOS_ADMIN = [
  "VER_CARACTERISTICAS",
  "CREAR_CARACTERISTICA",
  "MODIFICAR_CARACTERISTICA",
  "ELIMINAR_CARACTERISTICA",
];

function permisosGlobales() {
  const valor = state.usuario?.permisosGlobales;
  if (Array.isArray(valor)) return valor;
  if (valor && typeof valor === "object") {
    return Object.values(valor).flat().filter(Boolean);
  }
  // Si el backend no envía permisos (solo rol), se derivan del rol.
  if (esAdmin()) return PERMISOS_ADMIN;
  return [];
}

function tienePermiso(permiso) {
  if (!permiso) return true;
  return permisosGlobales().includes(permiso);
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

export { state, setUsuario, clearUsuario, esAdmin, tienePermiso, restaurarSesion, marcarSesionRestaurada, limpiarSesion };
