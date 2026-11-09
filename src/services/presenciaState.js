import { reactive } from "vue";
import presenciaService from "./presenciaService";
import { state as authState } from "./authState";

/*
 * Presencia compartida por perfil.
 *
 * Un único EventSource por pestaña para todos los componentes suscriptos.
 * Si el stream falla, se consulta `GET /presencia` cada 30 s y se reintenta
 * el SSE. El heartbeat del perfil activo también vive acá.
 */

const HEARTBEAT_MS = 30000;
const POLL_MS = 30000;
const RECONNECT_MS = 30000;
const STREAM_DEBOUNCE_MS = 250;
const MAX_IDS = 200;

export const state = reactive({
  porPerfil: {},
  conectado: false,
});

let heartbeatActivo = false;
let heartbeatTimer = null;
let ultimoHeartbeat = 0;
let idPresenciaActual = null;

let eventSource = null;
let streamTimer = null;
let pollTimer = null;
let reconnectTimer = null;
// Cada perfil puede estar suscripto por más de un componente. Se guarda un
// conteo para que el desmontaje de uno no corte el stream de los demás.
const suscripcionesPorPerfil = new Map();
let firmaStream = "";
let listenersActivos = false;

function idPerfilActivo() {
  return authState.usuario?.idPerfilActivo ?? null;
}

function idValido(valor) {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0 ? numero : null;
}

function idsValidos(ids) {
  return (Array.isArray(ids) ? ids : [ids])
    .map(idValido)
    .filter((id) => id != null);
}

function idsParaStream() {
  return [...suscripcionesPorPerfil.keys()].slice(0, MAX_IDS);
}

function aplicarPresencia(item) {
  const id = idValido(item?.idPerfil);
  if (id == null) return;
  state.porPerfil[id] = item.enLinea === true;
}

function aplicarSnapshot(data) {
  if (Array.isArray(data)) {
    data.forEach(aplicarPresencia);
    return;
  }
  if (data && typeof data === "object") aplicarPresencia(data);
}

function cerrarStream() {
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
  state.conectado = false;
}

function limpiarPolling() {
  clearTimeout(pollTimer);
  pollTimer = null;
}

function limpiarReconexion() {
  clearTimeout(reconnectTimer);
  reconnectTimer = null;
}

function iniciarPolling() {
  if (pollTimer || !idsParaStream().length) return;

  const tick = async () => {
    const ids = idsParaStream();
    if (!ids.length || eventSource) {
      pollTimer = null;
      return;
    }

    try {
      const response = await presenciaService.consultar(ids);
      aplicarSnapshot(response?.data);
    } catch {
      // Best-effort: se reintenta en el próximo ciclo.
    }

    if (!eventSource && idsParaStream().length) {
      pollTimer = setTimeout(tick, POLL_MS);
    } else {
      pollTimer = null;
    }
  };

  pollTimer = setTimeout(tick, 0);
}

function programarReconexion() {
  clearTimeout(reconnectTimer);
  if (!idsParaStream().length) return;

  reconnectTimer = setTimeout(() => {
    if (!idsParaStream().length) return;
    abrirStream();
  }, RECONNECT_MS);
}

function abrirStream() {
  clearTimeout(streamTimer);
  streamTimer = null;
  limpiarPolling();
  limpiarReconexion();
  cerrarStream();

  const ids = idsParaStream();
  firmaStream = ids.join(",");
  if (!ids.length || typeof EventSource === "undefined") {
    if (ids.length) iniciarPolling();
    return;
  }

  try {
    const stream = new EventSource(presenciaService.streamUrl(ids), {
      withCredentials: true,
    });
    eventSource = stream;

    stream.addEventListener("open", () => {
      state.conectado = true;
      limpiarPolling();
      limpiarReconexion();
    });

    stream.addEventListener("snapshot", (evento) => {
      try {
        aplicarSnapshot(JSON.parse(evento.data));
      } catch {
        // Ignorar payload inválido.
      }
    });

    stream.addEventListener("presencia", (evento) => {
      try {
        aplicarPresencia(JSON.parse(evento.data));
      } catch {
        // Ignorar payload inválido.
      }
    });

    stream.addEventListener("error", () => {
      cerrarStream();
      iniciarPolling();
      programarReconexion();
    });
  } catch {
    iniciarPolling();
    programarReconexion();
  }
}

function programarReaperturaStream() {
  // Si el conjunto de IDs no cambió, no hace falta cerrar y volver a abrir el
  // EventSource. Los refrescos de listados no deben generar reconexiones.
  const firma = idsParaStream().join(",");
  if (firma === firmaStream) return;

  firmaStream = firma;
  clearTimeout(streamTimer);
  streamTimer = setTimeout(abrirStream, STREAM_DEBOUNCE_MS);
}

async function enviarHeartbeat() {
  const id = idPerfilActivo();
  if (id == null || !heartbeatActivo) return;

  ultimoHeartbeat = Date.now();
  try {
    await presenciaService.heartbeat();
    if (heartbeatActivo && idPerfilActivo() === id) {
      state.porPerfil[id] = true;
    }
  } catch {
    // Best-effort. El interceptor global maneja 401.
  }
}

function programarHeartbeat() {
  clearTimeout(heartbeatTimer);
  heartbeatTimer = setTimeout(async () => {
    if (!heartbeatActivo) return;
    await enviarHeartbeat();
    if (heartbeatActivo) programarHeartbeat();
  }, HEARTBEAT_MS);
}

function alRecuperarFoco() {
  if (!heartbeatActivo || typeof document === "undefined") return;
  if (document.visibilityState !== "visible") return;
  if (Date.now() - ultimoHeartbeat < 15000) return;
  enviarHeartbeat();
}

function adjuntarListeners() {
  if (listenersActivos || typeof window === "undefined") return;
  window.addEventListener("focus", alRecuperarFoco);
  document.addEventListener("visibilitychange", alRecuperarFoco);
  listenersActivos = true;
}

function quitarListeners() {
  if (!listenersActivos || typeof window === "undefined") return;
  window.removeEventListener("focus", alRecuperarFoco);
  document.removeEventListener("visibilitychange", alRecuperarFoco);
  listenersActivos = false;
}

/**
 * ¿El perfil está en línea? Prioriza el estado en vivo y cae al valor del DTO.
 * @param {number|string|null|undefined} idPerfil
 * @param {boolean} [fallback]
 * @returns {boolean}
 */
export function enLineaDe(idPerfil, fallback = false) {
  const id = idValido(idPerfil);
  if (id == null) return fallback === true;
  const valor = state.porPerfil[id];
  return valor == null ? fallback === true : valor === true;
}

/**
 * Suscribe un conjunto de perfiles al stream. Los IDs se acumulan.
 * @param {Array<number|string>} ids
 */
export function suscribirPerfiles(ids) {
  let cambio = false;
  idsValidos(ids).forEach((id) => {
    const cantidad = suscripcionesPorPerfil.get(id) ?? 0;
    suscripcionesPorPerfil.set(id, cantidad + 1);
    if (cantidad === 0) cambio = true;
  });
  if (cambio) programarReaperturaStream();
}

/**
 * Quita perfiles de la suscripción.
 * @param {Array<number|string>} ids
 */
export function desuscribirPerfiles(ids) {
  let cambio = false;
  idsValidos(ids).forEach((id) => {
    const cantidad = suscripcionesPorPerfil.get(id) ?? 0;
    if (cantidad <= 1) {
      if (suscripcionesPorPerfil.delete(id)) cambio = true;
    } else {
      suscripcionesPorPerfil.set(id, cantidad - 1);
    }
  });
  if (cambio) programarReaperturaStream();
}

/**
 * Reconcilia una lista anterior de IDs con una nueva: solo desuscribe los que
 * salieron y solo suscribe los que entraron. Evita el ciclo
 * desuscribir-todos/suscribir-todos que reabre el SSE en cada refresco.
 * @param {Array<number|string>} previos
 * @param {Array<number|string>} nuevos
 */
export function reconciliarSuscripciones(previos, nuevos) {
  const anteriores = new Set(idsValidos(previos));
  const siguientes = new Set(idsValidos(nuevos));
  const quitar = [...anteriores].filter((id) => !siguientes.has(id));
  const agregar = [...siguientes].filter((id) => !anteriores.has(id));

  if (quitar.length) desuscribirPerfiles(quitar);
  if (agregar.length) suscribirPerfiles(agregar);
}

/**
 * Inicia heartbeat y listeners de foco. El perfil se marca en línea recién
 * cuando el backend confirma el heartbeat, no de forma optimista.
 */
export function iniciarPresencia() {
  const id = idPerfilActivo();
  if (id == null) {
    detenerPresencia();
    return;
  }

  idPresenciaActual = id;
  heartbeatActivo = true;
  adjuntarListeners();
  enviarHeartbeat();
  programarHeartbeat();
}

/**
 * Detiene heartbeat, SSE, polling y limpia las suscripciones.
 */
export function detenerPresencia() {
  heartbeatActivo = false;
  clearTimeout(heartbeatTimer);
  heartbeatTimer = null;
  clearTimeout(streamTimer);
  streamTimer = null;
  limpiarPolling();
  limpiarReconexion();
  cerrarStream();
  quitarListeners();
  suscripcionesPorPerfil.clear();
  firmaStream = "";
  idPresenciaActual = null;
  state.porPerfil = {};
  state.conectado = false;
}
