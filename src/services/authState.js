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

function setPerfilActivo(perfil) {
  if (!state.usuario) return;
  state.usuario = {
    ...state.usuario,
    idPerfilActivo: perfil?.idPerfil ?? null,
    nombreArtisticoActivo: perfil?.nombreArtistico ?? null,
  };
}

function idPerfilActivo() {
  return state.usuario?.idPerfilActivo ?? null;
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
  "ADMINISTRAR_CONFIGURACION",
  "VER_USUARIOS",
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

// Re-consulta /auth/me para obtener el estado autoritativo de la sesión,
// incluidos idPerfilActivo y nombreArtisticoActivo (Flujo 1 de la guía).
async function refrescarSesion() {
  try {
    const response = await authService.obtenerSesion();
    setUsuario(response?.data || null);
    return response?.data || null;
  } catch {
    return null;
  }
}

function limpiarSesion() {
  clearUsuario();
  sesionRestaurada = false;
  restauracionEnCurso = null;
}

// Termina la sesión completa: invalida la cookie JWT en el backend
// (POST /auth/logout) y limpia el estado local. El logout es best-effort:
// si falla la red o no hay sesión, el estado local igual se limpia.
async function finalizarSesion() {
  try {
    await authService.cerrarSesion();
  } catch {

  } finally {
    limpiarSesion();
  }
}

const CLAVE_BAJA_CUENTA = "modalink.cuentaBaja";

function guardarBajaCuenta({ mensaje, fechaLimite } = {}) {
  try {
    localStorage.setItem(
      CLAVE_BAJA_CUENTA,
      JSON.stringify({ mensaje: mensaje || null, fechaLimite: fechaLimite || null })
    );
  } catch {

  }
}

function consumirAvisoBajaCuenta() {
  try {
    const crudo = localStorage.getItem(CLAVE_BAJA_CUENTA);
    if (!crudo) return null;
    localStorage.removeItem(CLAVE_BAJA_CUENTA);
    return JSON.parse(crudo);
  } catch {
    return null;
  }
}

function limpiarBajaCuenta() {
  try {
    localStorage.removeItem(CLAVE_BAJA_CUENTA);
  } catch {
    // ignorar
  }
}

export { state, setUsuario, clearUsuario, esAdmin, tienePermiso, setPerfilActivo, idPerfilActivo, restaurarSesion, refrescarSesion, marcarSesionRestaurada, limpiarSesion, finalizarSesion, guardarBajaCuenta, consumirAvisoBajaCuenta, limpiarBajaCuenta };
