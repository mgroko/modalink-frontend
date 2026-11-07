import {
  ETIQUETAS_CARACTERISTICAS,
  UNIDADES_POR_CODIGO,
  normCodigo,
  simboloUnidad,
} from "./perfilConstants.js";
import { esEnumerado, esNumerico } from "./proyectoConstants.js";

/*
 * Reglas y textos de UC-72/UC-73 (buscar requerimientos abiertos).
 * El backend es la fuente de verdad: acá sólo se normalizan etiquetas y se
 * decide qué acción mostrar en la tarjeta.
 */

export const TIPOS_REQUERIMIENTO_ABIERTO = {
  GENERAL: "GENERAL",
  ACTIVIDAD: "ACTIVIDAD",
};

export const ETIQUETAS_TIPO_OPORTUNIDAD = {
  [TIPOS_REQUERIMIENTO_ABIERTO.GENERAL]: "General",
  [TIPOS_REQUERIMIENTO_ABIERTO.ACTIVIDAD]: "Actividad",
};

/**
 * Textos de `motivoNoPostulable` (ficha §4).
 * @type {Record<string, string>}
 */
export const MOTIVOS_NO_POSTULABLE = {
  PROYECTO_NO_HABILITADO: "El proyecto no está habilitado para postulaciones.",
  PROYECTO_NO_ACEPTA_GENERAL:
    "El proyecto no acepta postulaciones generales.",
  ACTIVIDAD_NO_PENDIENTE: "La actividad ya no está pendiente.",
  MIEMBRO_ACTIVO: "Ya sos miembro activo de este proyecto.",
  DIRECTOR: "Sos director de este proyecto.",
  PROFESION: "Tu profesión no coincide con este requerimiento.",
  CUPO: "El cupo está completo.",
};

/**
 * @param {"GENERAL"|"ACTIVIDAD"|string|null|undefined} tipo
 * @param {"GENERAL"|"ACTIVIDAD"} fallback
 * @returns {"GENERAL"|"ACTIVIDAD"}
 */
export function normalizarTipoOportunidad(
  tipo,
  fallback = TIPOS_REQUERIMIENTO_ABIERTO.GENERAL
) {
  const normalizado = String(tipo || "").toUpperCase();
  if (normalizado === TIPOS_REQUERIMIENTO_ABIERTO.ACTIVIDAD) {
    return TIPOS_REQUERIMIENTO_ABIERTO.ACTIVIDAD;
  }
  if (normalizado === TIPOS_REQUERIMIENTO_ABIERTO.GENERAL) {
    return TIPOS_REQUERIMIENTO_ABIERTO.GENERAL;
  }
  return fallback;
}

/**
 * @param {object|null|undefined} oportunidad
 * @returns {boolean}
 */
export function esOportunidadActividad(oportunidad) {
  return (
    normalizarTipoOportunidad(oportunidad?.tipo) ===
    TIPOS_REQUERIMIENTO_ABIERTO.ACTIVIDAD
  );
}

/**
 * @param {object|null|undefined} oportunidad
 * @returns {string}
 */
export function claveOportunidad(oportunidad) {
  return `${normalizarTipoOportunidad(oportunidad?.tipo)}:${
    oportunidad?.idRequerimiento
  }`;
}

/**
 * La acción Postularme sólo se habilita con
 * `puedePostularse === true && yaPostulado === false` (ficha §4).
 * @param {object|null|undefined} oportunidad
 * @returns {boolean}
 */
export function puedePostularOportunidad(oportunidad) {
  return (
    oportunidad?.puedePostularse === true && oportunidad?.yaPostulado !== true
  );
}

/**
 * @param {string|null|undefined} codigo
 * @returns {string}
 */
export function etiquetaMotivoNoPostulable(codigo) {
  const clave = String(codigo || "").toUpperCase();
  return (
    MOTIVOS_NO_POSTULABLE[clave] ||
    "Este requerimiento no está disponible para tu perfil."
  );
}

/**
 * Texto de cupos restantes sin recalcular reglas del backend.
 * @param {object|null|undefined} oportunidad
 * @returns {string}
 */
export function textoCupoOportunidad(oportunidad) {
  if (oportunidad?.satisfecho === true) return "Cupo completo";

  const faltantes = Number(oportunidad?.faltantes);
  if (Number.isFinite(faltantes)) {
    if (faltantes <= 0) return "Cupo completo";
    return `${faltantes} cupo${faltantes === 1 ? "" : "s"} disponible${
      faltantes === 1 ? "" : "s"
    }`;
  }

  const cantidad = Number(oportunidad?.cantidad);
  if (Number.isFinite(cantidad) && cantidad > 0) {
    return `${cantidad} cupo${cantidad === 1 ? "" : "s"}`;
  }
  return "";
}

function capitalizar(texto) {
  if (!texto) return "";
  return String(texto)
    .toLowerCase()
    .split(/[_\-.\s]+/)
    .filter(Boolean)
    .map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(" ");
}

function formatearNumero(valor) {
  const numero = Number(valor);
  if (Number.isNaN(numero)) return String(valor);
  return numero.toLocaleString("es-AR", { maximumFractionDigits: 2 });
}

function etiquetaCaracteristica(caracteristica) {
  const codigo =
    caracteristica?.codigo ||
    caracteristica?.codigoCaracteristica ||
    caracteristica?.nombre;
  if (!codigo) return "";
  return (
    ETIQUETAS_CARACTERISTICAS[normCodigo(codigo)] || capitalizar(codigo)
  );
}

function textoRango(caracteristica) {
  const min = caracteristica?.valorMin;
  const max = caracteristica?.valorMax;
  const unidad = simboloUnidad(
    UNIDADES_POR_CODIGO[normCodigo(caracteristica?.codigo)]
  );
  const sufijo = unidad ? ` ${unidad}` : "";

  if (min != null && max != null) {
    return `${formatearNumero(min)}${sufijo} – ${formatearNumero(max)}${sufijo}`;
  }
  if (min != null) return `${formatearNumero(min)}${sufijo} o más`;
  if (max != null) return `hasta ${formatearNumero(max)}${sufijo}`;
  return "";
}

function codigoDeValor(caracteristica, valor, catalogo = []) {
  if (valor && typeof valor === "object") {
    return valor.codigo || valor.nombre || null;
  }

  const idValor = Number(valor);
  if (!Number.isFinite(idValor)) return null;

  const catalogoCaracteristica = (catalogo || []).find(
    (item) =>
      item?.idCaracteristica === caracteristica?.idCaracteristica ||
      normCodigo(item?.codigo) === normCodigo(caracteristica?.codigo)
  );
  return (
    catalogoCaracteristica?.valores?.find(
      (item) => item.idValor === idValor
    )?.codigo || null
  );
}

/**
 * Convierte el array `caracteristicas` del resultado en chips legibles.
 * Tolera tanto objetos del catálogo como textos planos.
 * @param {object[]|string[]|null|undefined} caracteristicas
 * @param {object[]} [catalogo]
 * @returns {string[]}
 */
export function chipsCaracteristicas(caracteristicas, catalogo = []) {
  if (!Array.isArray(caracteristicas)) return [];
  const chips = [];

  for (const caracteristica of caracteristicas) {
    if (caracteristica == null) continue;

    if (typeof caracteristica === "string") {
      chips.push(caracteristica);
      continue;
    }

    const etiqueta = etiquetaCaracteristica(caracteristica);
    if (!etiqueta) {
      const texto = caracteristica.descripcion || caracteristica.valor;
      if (texto) chips.push(String(texto));
      continue;
    }

    if (esNumerico(caracteristica.tipoDato || caracteristica.tipo)) {
      const rango = textoRango(caracteristica);
      chips.push(rango ? `${etiqueta}: ${rango}` : etiqueta);
      continue;
    }

    if (esEnumerado(caracteristica.tipoDato || caracteristica.tipo)) {
      const valores = Array.isArray(caracteristica.valores)
        ? caracteristica.valores
        : [];
      if (valores.length) {
        for (const idValor of valores) {
          const codigo = codigoDeValor(caracteristica, idValor, catalogo);
          chips.push(
            codigo ? `${etiqueta}: ${capitalizar(codigo)}` : etiqueta
          );
        }
        continue;
      }
      const valor =
        caracteristica.codigoValor ||
        caracteristica.valorEtiqueta ||
        caracteristica.valor;
      chips.push(valor ? `${etiqueta}: ${capitalizar(valor)}` : etiqueta);
      continue;
    }

    const valor =
      caracteristica.valor ??
      caracteristica.valorTexto ??
      caracteristica.codigoValor;
    chips.push(
      valor != null && valor !== ""
        ? `${etiqueta}: ${capitalizar(valor)}`
        : etiqueta
    );
  }

  return chips;
}

/**
 * Convierte `habilidades` en nombres legibles. Acepta ids, strings u objetos.
 * @param {(number|string|object)[]|null|undefined} habilidades
 * @param {object[]} [catalogo] [{idHabilidad, nombre}]
 * @returns {string[]}
 */
export function chipsHabilidades(habilidades, catalogo = []) {
  if (!Array.isArray(habilidades)) return [];

  return habilidades
    .map((habilidad) => {
      if (habilidad == null) return "";
      if (typeof habilidad === "string") return habilidad;
      if (typeof habilidad === "number") {
        return (
          (catalogo || []).find((item) => item.idHabilidad === habilidad)
            ?.nombre || `Habilidad ${habilidad}`
        );
      }
      return (
        habilidad.nombre ||
        habilidad.nombreHabilidad ||
        habilidad.descripcion ||
        ""
      );
    })
    .filter(Boolean);
}
