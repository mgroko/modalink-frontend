import { reactive } from "vue";
import mensajeService from "./mensajeService";
import { state as authState } from "./authState";
import { cargarResumenPerfil } from "./notificacionState";

/*
 * Estado global de mensajería privada (UC-42).
 *
 * Un único EventSource por pestaña para el perfil activo. El badge de
 * "Mensajes" y la vista de mensajes consumen el mismo stream.
 */

const RECONEXION_BASE_MS = 5000;
const RECONEXION_MAX_MS = 30000;
const RESUMEN_DEBOUNCE_MS = 400;
const NOTIFICACIONES_DEBOUNCE_MS = 600;

export const state = reactive({
  resumen: {
    totalConversaciones: 0,
    conversacionesNoLeidas: 0,
  },
  conectado: false,
  idPerfil: null,
  ultimoEvento: null,
  eventoSeq: 0,
  // Se incrementa cada vez que el stream vuelve a quedar listo. La vista lo
  // usa para recargar lista e historial después de una reconexión.
  conexionSeq: 0,
});

let eventSource = null;
let reconnectTimer = null;
let resumenTimer = null;
let notificacionesTimer = null;
let reintentos = 0;
let resumenEnCurso = null;

function idPerfilActivo() {
  return authState.usuario?.idPerfilActivo ?? null;
}

function cerrarStream() {
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
  state.conectado = false;
}

function limpiarReconexion() {
  clearTimeout(reconnectTimer);
  reconnectTimer = null;
}

function limpiarResumenTimer() {
  clearTimeout(resumenTimer);
  resumenTimer = null;
}

function limpiarNotificacionesTimer() {
  clearTimeout(notificacionesTimer);
  notificacionesTimer = null;
}

function emitirEvento(tipo, data) {
  state.ultimoEvento = { tipo, data, ts: Date.now() };
  state.eventoSeq += 1;
}

/**
 * Refresca el resumen de conversaciones no leídas.
 * @returns {Promise<void>}
 */
export function cargarResumen() {
  const id = idPerfilActivo();
  if (id == null) {
    state.resumen.totalConversaciones = 0;
    state.resumen.conversacionesNoLeidas = 0;
    return Promise.resolve();
  }

  if (resumenEnCurso) return resumenEnCurso;

  const solicitud = mensajeService
    .resumen()
    .then((response) => {
      if (idPerfilActivo() !== id) return;
      const data = response?.data || {};
      state.resumen.totalConversaciones = Number(data.totalConversaciones) || 0;
      state.resumen.conversacionesNoLeidas =
        Number(data.conversacionesNoLeidas) || 0;
    })
    .catch(() => {
      // Best-effort: se conserva el último valor conocido.
    })
    .finally(() => {
      if (resumenEnCurso === solicitud) resumenEnCurso = null;
    });

  resumenEnCurso = solicitud;
  return resumenEnCurso;
}

export function programarRefrescoResumen() {
  limpiarResumenTimer();
  resumenTimer = setTimeout(() => {
    resumenTimer = null;
    cargarResumen();
  }, RESUMEN_DEBOUNCE_MS);
}

/**
 * Refresca la campanita de notificaciones del perfil activo. El backend marca
 * la notificación de la conversación como leída al leer el chat, y crea una
 * notificación cuando la conversación pasa a no leída.
 */
export function refrescarResumenNotificaciones() {
  const id = idPerfilActivo();
  if (id == null) return;
  cargarResumenPerfil(id);
}

function programarRefrescoNotificaciones() {
  limpiarNotificacionesTimer();
  notificacionesTimer = setTimeout(() => {
    notificacionesTimer = null;
    refrescarResumenNotificaciones();
  }, NOTIFICACIONES_DEBOUNCE_MS);
}

function programarReconexion() {
  limpiarReconexion();
  if (idPerfilActivo() == null) return;

  const espera = Math.min(
    RECONEXION_BASE_MS * Math.pow(2, reintentos),
    RECONEXION_MAX_MS
  );
  reintentos += 1;

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    abrirStream();
  }, espera);
}

function parsearEvento(evento) {
  try {
    return JSON.parse(evento.data);
  } catch {
    return null;
  }
}

function abrirStream() {
  cerrarStream();
  limpiarReconexion();

  const id = idPerfilActivo();
  state.idPerfil = id;
  if (id == null) return;
  if (typeof EventSource === "undefined") return;

  try {
    const stream = new EventSource(mensajeService.streamUrl(), {
      withCredentials: true,
    });
    eventSource = stream;

    stream.addEventListener("open", () => {
      state.conectado = true;
    });

    stream.addEventListener("ready", (evento) => {
      const data = parsearEvento(evento);
      const idStream = Number(data?.idPerfil);
      if (
        Number.isFinite(idStream) &&
        idPerfilActivo() != null &&
        idStream !== Number(idPerfilActivo())
      ) {
        // El stream quedó asociado a otro perfil: se reabre.
        cerrarStream();
        programarReconexion();
        return;
      }

      reintentos = 0;
      state.conectado = true;
      state.conexionSeq += 1;
      cargarResumen();
      refrescarResumenNotificaciones();
    });

    stream.addEventListener("mensaje", (evento) => {
      const data = parsearEvento(evento);
      if (!data) return;

      const idActivo = Number(idPerfilActivo());
      const idEmisor = Number(data.idPerfilEmisor);
      const esEntrante = Number.isFinite(idEmisor) && idEmisor !== idActivo;

      emitirEvento("mensaje", data);
      programarRefrescoResumen();
      if (esEntrante) programarRefrescoNotificaciones();
    });

    stream.addEventListener("conversacion_leida", (evento) => {
      const data = parsearEvento(evento);
      if (!data) return;
      emitirEvento("conversacion_leida", data);
    });

    stream.addEventListener("escribiendo", (evento) => {
      const data = parsearEvento(evento);
      if (!data) return;
      emitirEvento("escribiendo", data);
    });

    stream.addEventListener("error", () => {
      cerrarStream();
      programarReconexion();
    });
  } catch {
    cerrarStream();
    programarReconexion();
  }
}

/**
 * Inicia el stream del perfil activo. Es idempotente si ya está abierto para
 * el mismo perfil.
 */
export function iniciarMensajeria() {
  const id = idPerfilActivo();
  if (id == null) {
    detenerMensajeria();
    return;
  }

  if (eventSource && state.idPerfil === id) return;

  state.idPerfil = id;
  cargarResumen();
  abrirStream();
}

/**
 * Detiene el stream y limpia el estado global.
 */
export function detenerMensajeria() {
  limpiarReconexion();
  limpiarResumenTimer();
  limpiarNotificacionesTimer();
  cerrarStream();
  reintentos = 0;
  resumenEnCurso = null;
  state.idPerfil = null;
  state.resumen.totalConversaciones = 0;
  state.resumen.conversacionesNoLeidas = 0;
  state.ultimoEvento = null;
  state.eventoSeq += 1;
}
