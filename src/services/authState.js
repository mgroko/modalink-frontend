import { reactive } from "vue";
import authService from "./authService";

const state = reactive({
  usuario: null,
});

const perfilActivoListeners = new Set();

/**
 * Registra un callback para invalidar estado derivado del perfil activo.
 * @param {(idPerfil: number|null) => void} listener
 * @returns {() => void} desuscripción
 */
function onPerfilActivoChange(listener) {
  if (typeof listener !== "function") return () => {};
  perfilActivoListeners.add(listener);
  return () => perfilActivoListeners.delete(listener);
}

function notificarPerfilActivo() {
  const idPerfil = state.usuario?.idPerfilActivo ?? null;
  for (const listener of perfilActivoListeners) {
    try {
      listener(idPerfil);
    } catch {
      // Un listener no debe romper el cambio de perfil.
    }
  }
}

function setUsuario(usuario) {
  const anterior = state.usuario?.idPerfilActivo ?? null;
  state.usuario = usuario;
  if ((usuario?.idPerfilActivo ?? null) !== anterior) {
    notificarPerfilActivo();
  }
}

function clearUsuario() {
  const anterior = state.usuario?.idPerfilActivo ?? null;
  state.usuario = null;
  if (anterior != null) notificarPerfilActivo();
}

function setPerfilActivo(perfil) {
  if (!state.usuario) return;
  const anterior = state.usuario.idPerfilActivo ?? null;
  const siguiente = perfil?.idPerfil ?? null;
  state.usuario = {
    ...state.usuario,
    idPerfilActivo: siguiente,
    nombreArtisticoActivo: perfil?.nombreArtistico ?? null,
  };
  if (String(anterior) !== String(siguiente)) {
    notificarPerfilActivo();
  }
}

function idPerfilActivo() {
  return state.usuario?.idPerfilActivo ?? null;
}

function idUsuarioActivo() {
  return state.usuario?.idUsuario ?? null;
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
  "VER_HABILIDADES",
  "CREAR_HABILIDAD",
  "MODIFICAR_HABILIDAD",
  "ELIMINAR_HABILIDAD",
  "VER_TIPOS_CONTRATO",
  "CREAR_TIPO_CONTRATO",
  "MODIFICAR_TIPO_CONTRATO",
  "ELIMINAR_TIPO_CONTRATO",
  "ADMINISTRAR_CONFIGURACION",
  "VER_USUARIOS",
];

function permisosGlobales() {
  const valor = state.usuario?.permisosGlobales;
  if (Array.isArray(valor)) return valor;
  if (valor && typeof valor === "object") {
    return Object.values(valor).flat().filter(Boolean);
  }
  // Si el sistema no envía permisos (solo rol), se derivan del rol.
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

// Termina la sesión completa: invalida la cookie JWT en el sistema
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

export { state, setUsuario, clearUsuario, esAdmin, tienePermiso, setPerfilActivo, idPerfilActivo, idUsuarioActivo, onPerfilActivoChange, restaurarSesion, refrescarSesion, marcarSesionRestaurada, limpiarSesion, finalizarSesion, guardarBajaCuenta, consumirAvisoBajaCuenta, limpiarBajaCuenta };
