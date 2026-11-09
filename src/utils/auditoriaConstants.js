/*
 * UC-67 Informe de auditoría — docs/backend/ficha-tecnica-auditoria-admin.md
 *
 * Constantes, armado de query params, validación de filtros y textos de la
 * consulta de auditoría. Se aísla de las vistas para poder probarlo con
 * `node --test` (test/auditoria.test.js).
 */

import { formatearFechaCorta } from "./fechas.js";
import { esSesionExpirada } from "./apiError.js";

/* ------------------------------------------------------------------ */
/* Límites vigentes en la configuración del backend (UC-67). Se usan   */
/* para validar antes de consultar; si el backend los cambia, sigue    */
/* siendo autoridad: responde con códigos específicos y la UI toma su  */
/* mensaje. Si algún día hay un endpoint que los exponga, se reemplazan*/
/* estas constantes por esa consulta sin tocar la lógica.              */
/* ------------------------------------------------------------------ */

export const AUDITORIA_RANGO_MAX_DIAS = 90;
export const AUDITORIA_EXPORT_MAX_REGISTROS = 10000;
export const AUDITORIA_PAGINA_MAX = 100;
// Solo uso del backend al armar el PDF exportado; no impacta la UI.
export const AUDITORIA_PDF_MAX_CAMBIOS_POR_FILA = 5;

export const TAMANO_AUDITORIA_POR_DEFECTO = 20;
// UC-67 no soporta `todos=true`, así que no se ofrece "Ver todos".
export const OPCIONES_TAMANO_AUDITORIA = [
  { text: "20 por página", value: 20 },
  { text: "50 por página", value: 50 },
  { text: "100 por página", value: 100 },
];

export const CODIGO_SIN_TIPO = "SIN_TIPO";
export const ETIQUETA_SIN_TIPO = "Sin tipo (histórico)";
export const CODIGO_EVENTO_OTRO = "OTRO";

/** Etiqueta legible de cada módulo del catálogo. */
export const ETIQUETAS_MODULO_AUDITORIA = {
  USUARIOS: "Usuarios",
  PROYECTOS: "Proyectos",
  POSTULACIONES: "Postulaciones",
  INVITACIONES: "Invitaciones",
  ADMINISTRACION: "Administración",
  REPORTES: "Reportes",
  SISTEMA: "Sistema",
};

/** Orden de los módulos en el selector y en el detalle, como en los mockups. */
export const ORDEN_MODULOS_AUDITORIA = [
  "USUARIOS",
  "PROYECTOS",
  "POSTULACIONES",
  "INVITACIONES",
  "ADMINISTRACION",
  "REPORTES",
  "SISTEMA",
];

/** Texto de estado vacío del listado. */
export const TEXTO_VACIO_AUDITORIA =
  "No hay eventos de auditoría para los filtros seleccionados.";
export const TEXTO_VACIO_SUBTITULO_AUDITORIA =
  "Probá con otro rango de fechas u otros tipos de evento.";

/* ------------------------------------------------------------------ */
/* Filtros y query params                                             */
/* ------------------------------------------------------------------ */

/**
 * Quita vacíos, recorta y desduplica los códigos de tipo de evento.
 * @param {string[]} [tipos]
 * @returns {string[]}
 */
export function tiposSinDuplicados(tipos) {
  if (!Array.isArray(tipos)) return [];
  const vistos = new Set();
  const limpios = [];
  for (const tipo of tipos) {
    const codigo = String(tipo || "").trim();
    if (!codigo || vistos.has(codigo)) continue;
    vistos.add(codigo);
    limpios.push(codigo);
  }
  return limpios;
}

/**
 * Armado de params de `GET /admin/auditoria` (y `/resumen` sin paginación).
 * Los tipos van separados por comas: si se pasa el array directo a axios, se
 * serializaría `tipos[]=...` y el backend no lo acepta.
 * @param {{fechaDesde?: string, fechaHasta?: string, tipos?: string[]}} [filtros]
 * @param {{pagina?: number|null, tamano?: number|null}} [opciones]
 *   Sin `pagina` se omiten page/size (usado por /resumen y /export).
 * @returns {Record<string, string|number>}
 */
export function construirParamsAuditoria(filtros = {}, opciones = {}) {
  const params = {};
  if (filtros.fechaDesde) params.fechaDesde = filtros.fechaDesde;
  if (filtros.fechaHasta) params.fechaHasta = filtros.fechaHasta;

  const tipos = tiposSinDuplicados(filtros.tipos);
  if (tipos.length) params.tipos = tipos.join(",");

  if (opciones.pagina != null) {
    params.page = Math.max(0, Math.floor(Number(opciones.pagina) || 0));
    const tamano = Number(opciones.tamano) || TAMANO_AUDITORIA_POR_DEFECTO;
    params.size = Math.min(
      Math.max(1, Math.floor(tamano)),
      AUDITORIA_PAGINA_MAX
    );
  }

  return params;
}

/**
 * Params de `GET /admin/auditoria/export`. Sin paginación: exporta todo el
 * resultado filtrado.
 * @param {"CSV"|"PDF"} formato
 * @param {{fechaDesde?: string, fechaHasta?: string, tipos?: string[]}} [filtros]
 */
export function construirParamsExportacion(formato, filtros = {}) {
  const params = construirParamsAuditoria(filtros);
  params.formato = String(formato || "").toUpperCase();
  return params;
}

/* ------------------------------------------------------------------ */
/* Fechas: rangos inclusivos y defaults                               */
/* ------------------------------------------------------------------ */

function pad(n) {
  return String(n).padStart(2, "0");
}

function fechaISO(date, offsetDias = 0) {
  const d = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + offsetDias
  );
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Cantidad de días del rango contando ambos extremos (inclusivo, igual que
 * la validación de la ficha): 01/11 → 07/11 son 7 días.
 * @param {string} [desde] YYYY-MM-DD
 * @param {string} [hasta] YYYY-MM-DD
 * @returns {number} 0 si alguna fecha no es válida
 */
export function diasEntreInclusive(desde, hasta) {
  const aUTC = (valor) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(valor || ""));
    if (!m) return null;
    return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  };
  const tDesde = aUTC(desde);
  const tHasta = aUTC(hasta);
  if (tDesde == null || tHasta == null) return 0;
  return Math.round((tHasta - tDesde) / 86400000) + 1;
}

/**
 * Rango de los últimos N días inclusive: 7 días = hoy-6 → hoy.
 * @param {number} [dias]
 * @returns {{fechaDesde: string, fechaHasta: string}}
 */
export function rangoUltimosDias(dias = 7) {
  const hoy = new Date();
  return {
    fechaDesde: fechaISO(hoy, -(Math.max(1, dias) - 1)),
    fechaHasta: fechaISO(hoy),
  };
}

/**
 * Validación de filtros antes de consultar. Devuelve `null` si es válido o
 * `{ codigo, mensaje }` con los códigos del backend (UC-67 §4).
 * @param {{fechaDesde?: string, fechaHasta?: string}} [filtros]
 * @returns {{codigo: string, mensaje: string}|null}
 */
export function validarFiltrosAuditoria(filtros = {}) {
  if (!filtros.fechaDesde || !filtros.fechaHasta) {
    return {
      codigo: "FECHAS_OBLIGATORIAS",
      mensaje: "Elegí las fechas desde y hasta antes de consultar.",
    };
  }
  // Comparación lexicográfica suficiente para fechas ISO `YYYY-MM-DD`.
  if (String(filtros.fechaDesde) > String(filtros.fechaHasta)) {
    return {
      codigo: "RANGO_FECHAS_INVALIDO",
      mensaje: "La fecha desde no puede ser posterior a la fecha hasta.",
    };
  }
  const dias = diasEntreInclusive(filtros.fechaDesde, filtros.fechaHasta);
  if (dias > AUDITORIA_RANGO_MAX_DIAS) {
    return {
      codigo: "RANGO_FECHAS_EXCEDIDO",
      mensaje: `El rango máximo permitido es de ${AUDITORIA_RANGO_MAX_DIAS} días. Elegiste ${dias} días. Acortá el rango y volvé a consultar.`,
    };
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Catálogo                                                           */
/* ------------------------------------------------------------------ */

/**
 * Agrupa el catálogo de tipos por `modulo`, con el orden de los mockups.
 * Los módulos no catalogados van al final, alfabéticos, para no perder
 * tipos si el backend agrega módulos nuevos.
 * @param {{codigo: string, nombre: string, modulo?: string}[]} [catalogo]
 * @returns {{modulo: string, tipos: object[]}[]}
 */
export function agruparTiposPorModulo(catalogo = []) {
  const grupos = new Map();
  for (const tipo of catalogo || []) {
    const modulo = tipo?.modulo || "SISTEMA";
    if (!grupos.has(modulo)) grupos.set(modulo, []);
    grupos.get(modulo).push(tipo);
  }
  const claves = [...grupos.keys()].sort((a, b) => {
    const ia = ORDEN_MODULOS_AUDITORIA.indexOf(a);
    const ib = ORDEN_MODULOS_AUDITORIA.indexOf(b);
    const pa = ia === -1 ? ORDEN_MODULOS_AUDITORIA.length : ia;
    const pb = ib === -1 ? ORDEN_MODULOS_AUDITORIA.length : ib;
    if (pa !== pb) return pa - pb;
    return String(a).localeCompare(String(b), "es");
  });
  return claves.map((modulo) => ({ modulo, tipos: grupos.get(modulo) }));
}

export function etiquetaModuloAuditoria(modulo) {
  return ETIQUETAS_MODULO_AUDITORIA[modulo] || String(modulo || "Sistema");
}

/** Módulo de un evento según el catálogo; `SISTEMA` como fallback neutro. */
export function moduloDeEventoAuditoria(evento, catalogo = []) {
  const codigo = evento?.tipoEvento;
  const tipo = (catalogo || []).find((t) => t?.codigo === codigo);
  return tipo?.modulo || "SISTEMA";
}

/** Nombre de filtro por búsqueda de texto (sin tildes ni mayúsculas). */
export function normalizarTextoBusqueda(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/* ------------------------------------------------------------------ */
/* Presentación de filas y detalle                                    */
/* ------------------------------------------------------------------ */

/** Nombre del evento para mostrar, con fallbacks de la ficha §5.2. */
export function etiquetaEventoAuditoria(evento) {
  if (evento?.tipoEventoNombre) return String(evento.tipoEventoNombre);
  if (evento?.tipoEvento) return String(evento.tipoEvento);
  return evento?.legacy ? ETIQUETA_SIN_TIPO : "—";
}

/** `true` para `tipoEvento = OTRO`: se muestra `tipoEventoOriginal` secundario. */
export function esEventoOtro(evento) {
  return evento?.tipoEvento === CODIGO_EVENTO_OTRO;
}

/** Registros previos a la migración: no se usa `idUsuario` como operador. */
export function esEventoHistorico(evento) {
  return evento?.legacy === true;
}

/** Scheduler: sin `idUsuario` y sin marca de histórico. */
export function esOperadorSistema(evento) {
  return !esEventoHistorico(evento) && evento?.idUsuario == null;
}

/**
 * Columna Entidad de la tabla (§5.2): `entidadAfectada + idAfectado`,
 * o `entidadAfectada · entidadClave` para entidades sin ID numérico.
 */
export function textoEntidadEvento(evento) {
  const entidad = evento?.entidadAfectada;
  const clave = evento?.entidadClave;
  if (!entidad && !clave) return "—";
  if (clave) {
    return [entidad, clave].filter(Boolean).join(" · ");
  }
  const id = evento?.idAfectado;
  if (id != null && Number(id) !== 0) return `${entidad} · #${id}`;
  return entidad || "—";
}

/**
 * "ID afectado" del detalle: `0 (sin ID numérico)` para configuración.
 */
export function textoIdAfectadoDetalle(evento) {
  const id = evento?.idAfectado;
  if (id == null) return "—";
  if (Number(id) === 0) return "0 (sin ID numérico)";
  return String(id);
}

/** Valores de cambios: los nulos/vacíos se muestran como "—". */
export function textoValorAuditoria(valor) {
  if (valor == null) return "—";
  const texto = String(valor);
  return texto === "" ? "—" : texto;
}

/** Iniciales del operador para el avatar de la tabla/card. */
export function inicialesOperador(evento) {
  const nombre = String(evento?.operador || "").trim();
  if (!nombre || esOperadorSistema(evento)) return "S";
  return nombre
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join("");
}

/** Fecha `dd/mm/aaaa` de `fechaHora` sin interpretar la zona horaria. */
export function formatearFechaAuditoria(valor) {
  if (!valor) return "—";
  const [fecha] = String(valor).split("T");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return String(valor);
  return formatearFechaCorta(fecha);
}

/** Hora `HH:mm` de `fechaHora` sin segundos. */
export function formatearHoraAuditoria(valor) {
  if (!valor) return "—";
  const [, hora = ""] = String(valor).split("T");
  if (!hora) return "—";
  const [horaParte, minutos = "00"] = hora.split(":");
  return `${horaParte}:${minutos}`;
}

/* ------------------------------------------------------------------ */
/* Exportación                                                        */
/* ------------------------------------------------------------------ */

/**
 * Nombre de archivo de la ficha: `auditoria_desde_hasta.formato`.
 * Usado como fallback cuando el backend no envía `Content-Disposition`.
 */
export function nombreArchivoExportacion(desde, hasta, formato) {
  const extension = String(formato || "CSV").toLowerCase();
  return `auditoria_${desde}_${hasta}.${extension === "pdf" ? "pdf" : "csv"}`;
}

/** Lee el nombre del header `Content-Disposition` (si CORS lo expone). */
export function nombreDesdeContentDisposition(header) {
  if (!header) return "";
  const coincidencia = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(header);
  if (!coincidencia) return "";
  let nombre = coincidencia[1];
  try {
    nombre = decodeURIComponent(nombre);
  } catch {
    // Ya venía sin escapar; se usa tal cual.
  }
  return nombre.replace(/"/g, "").trim();
}

/* ------------------------------------------------------------------ */
/* Errores                                                            */
/* ------------------------------------------------------------------ */

/**
 * Mensaje de UI para un error de la API de auditoría. Se prefiere siempre el
 * `message` del backend; los fallbacks del front usan los códigos de §4.
 * @param {unknown} [error]
 * @returns {string}
 */
export function mensajeErrorAuditoria(error) {
  const mensajeBackend = error?.response?.data?.message;
  if (mensajeBackend) return String(mensajeBackend);

  const codigo = error?.response?.data?.codigo;
  const mapa = {
    FECHAS_OBLIGATORIAS:
      "Faltan las fechas desde y hasta para consultar la auditoría.",
    RANGO_FECHAS_INVALIDO:
      "La fecha desde no puede ser posterior a la fecha hasta.",
    RANGO_FECHAS_EXCEDIDO: `El rango máximo permitido es de ${AUDITORIA_RANGO_MAX_DIAS} días.`,
    CATALOGO_VACIO: "No hay tipos de evento activos en el catálogo.",
    TIPO_EVENTO_INVALIDO:
      "Alguno de los tipos seleccionados ya no está disponible.",
    PAGINACION_INVALIDA: "La paginación solicitada no es válida.",
    FORMATO_EXPORTACION_INVALIDO: "El formato de exportación no es válido.",
    EXPORTACION_EXCEDIDA: `La exportación admite hasta ${AUDITORIA_EXPORT_MAX_REGISTROS.toLocaleString(
      "es-AR"
    )} registros.`,
    ROL_NO_PERMITIDO: "No tenés permiso para consultar la auditoría.",
  };
  return mapa[codigo] || "No se pudo completar la operación. Intentalo nuevamente.";
}

/**
 * El backend responde 403 `ROL_NO_PERMITIDO` para no administradores.
 * Un 403 sin sesión activa ya lo maneja el interceptor (expira sesión y
 * redirige); ese caso no es "falta de permiso" para esta pantalla.
 */
export function esPermisoDenegadoAuditoria(error) {
  return error?.response?.status === 403 && !esSesionExpirada(error);
}
