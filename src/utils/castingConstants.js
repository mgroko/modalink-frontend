import {
  CODIGOS_MEDIDAS,
  ETIQUETAS_CARAC,
  normCodigo,
  simboloUnidad,
} from "./perfilConstants.js";

export const ESTADOS_CASTING = {
  PENDIENTE: "PENDIENTE",
  ACEPTADA: "ACEPTADA",
  RECHAZADA: "RECHAZADA",
  TODAS: "",
};

export const ETIQUETAS_ESTADO_CASTING = {
  [ESTADOS_CASTING.PENDIENTE]: "Pendientes",
  [ESTADOS_CASTING.ACEPTADA]: "Aceptadas",
  [ESTADOS_CASTING.RECHAZADA]: "Rechazadas",
  [ESTADOS_CASTING.TODAS]: "Todas",
};

export const ETIQUETAS_AGENDA = {
  DISPONIBLE: "Disponible",
  NO_DISPONIBLE: "No disponible",
  SIN_EVALUAR: "Sin evaluar",
  NO_APLICA: "No aplica",
};

export const OPCIONES_ORDEN_CASTING = [
  { value: "CUMPLIMIENTO", text: "Mejor coincidencia" },
  { value: "FECHA", text: "Postulación más reciente" },
  { value: "NOMBRE", text: "Nombre artístico" },
];

/** Códigos que se muestran primero en la sección de medidas. */
export const CODIGOS_MEDIDAS_CASTING = [
  "altura",
  ...CODIGOS_MEDIDAS,
  "color_ojos",
  "ojos",
  "color_piel",
  "piel",
  "color_cabello",
  "cabello",
  "pelo",
];

export function etiquetaCaracteristica(caracteristica) {
  const codigo = normCodigo(caracteristica?.codigo);
  return (
    ETIQUETAS_CARAC[codigo] ||
    caracteristica?.nombre ||
    caracteristica?.codigo ||
    ""
  );
}

export function formatearValorCaracteristica(caracteristica) {
  if (!caracteristica) return "—";

  if (caracteristica.etiqueta && String(caracteristica.etiqueta).trim()) {
    return String(caracteristica.etiqueta).trim();
  }

  const valor = String(caracteristica.valor ?? "").trim();
  if (!valor) return "—";

  const unidad = String(caracteristica.unidad ?? "").trim();
  if (unidad && !valor.toLowerCase().includes(unidad.toLowerCase())) {
    return `${valor} ${unidad}`;
  }
  return valor;
}

export function formatearValorRequerido(caracteristica) {
  if (!caracteristica) return "—";

  const tipo = String(caracteristica.tipoDato || "").toUpperCase();
  const unidad = String(caracteristica.unidad ?? "").trim();

  if (tipo === "NUMERICO") {
    const min = numeroTexto(caracteristica.valorMin);
    const max = numeroTexto(caracteristica.valorMax);
    if (min && max) return `${min} – ${max}${unidad ? ` ${unidad}` : ""}`;
    if (min) return `mín. ${min}${unidad ? ` ${unidad}` : ""}`;
    if (max) return `máx. ${max}${unidad ? ` ${unidad}` : ""}`;
    return "—";
  }

  if (tipo === "ENUMERADO") {
    const valores = Array.isArray(caracteristica.valores)
      ? caracteristica.valores
          .map((valor) => valor?.etiqueta)
          .filter((etiqueta) => etiqueta && String(etiqueta).trim())
      : [];
    return valores.length ? valores.join(" o ") : "—";
  }

  return "Requerido";
}

export function textoCupo(requerimiento) {
  if (!requerimiento) return "—";
  const cantidad = Number(requerimiento.cantidad);
  const cubiertos = Number(requerimiento.cubiertos);
  if (!Number.isFinite(cantidad) || !Number.isFinite(cubiertos)) return "—";

  const faltantes = textoFaltantes(requerimiento);
  return `${cubiertos} de ${cantidad} cubiertos${faltantes ? ` · ${faltantes}` : ""}`;
}

export function textoFaltantes(requerimiento) {
  if (!requerimiento) return "";
  if (requerimiento.satisfecho === true) return "Cupo completo";

  const faltantes = Number(requerimiento.faltantes);
  if (!Number.isFinite(faltantes)) return "";
  if (faltantes <= 0) return "Cupo completo";
  if (faltantes === 1) return "falta 1 lugar";
  return `faltan ${faltantes} lugares`;
}

export function textoCumplimiento(cumplimiento) {
  if (!cumplimiento) return "Sin requisitos";
  const evaluados = Number(cumplimiento.requisitosEvaluados);
  const cumplidos = Number(cumplimiento.requisitosCumplidos);
  if (!Number.isFinite(evaluados) || evaluados <= 0) return "Sin requisitos";
  return `${Number.isFinite(cumplidos) ? cumplidos : 0} de ${evaluados}`;
}

export function porcentajeCumplimiento(cumplimiento) {
  const valor = Number(cumplimiento?.porcentaje);
  if (!Number.isFinite(valor)) return null;
  return Math.min(100, Math.max(0, Math.round(valor)));
}

export function etiquetaPolaroid(polaroid) {
  const codigo = String(polaroid?.tipo?.codigo || "");
  if (codigo === "PRIMER_PLANO_FRENTE") return "Frente";
  if (codigo === "PRIMER_PLANO_PERFIL") return "Perfil";
  if (codigo.startsWith("CUERPO_COMPLETO_")) return "Cuerpo entero";
  return polaroid?.tipo?.nombreCompleto || "Polaroid";
}

export function agruparEnPaginas(elementos, tamano = 3) {
  const lista = Array.isArray(elementos) ? elementos : [];
  const paginas = [];
  for (let i = 0; i < lista.length; i += tamano) {
    paginas.push(lista.slice(i, i + tamano));
  }
  return paginas;
}

export function etiquetaAgenda(agenda) {
  if (!agenda) return "";
  return ETIQUETAS_AGENDA[agenda.estado] || agenda.estado || "";
}

export function iconoRequisito(cumple) {
  if (cumple === true) return "check";
  if (cumple === false) return "close";
  return "remove";
}

export function claseRequisito(cumple) {
  if (cumple === true) return "casting-requisito--cumple";
  if (cumple === false) return "casting-requisito--no-cumple";
  return "casting-requisito--sin-evaluar";
}

export function esCastingCerrado(requerimiento) {
  return (
    requerimiento?.castingCerrado === true ||
    requerimiento?.satisfecho === true
  );
}

export function esRequerimientoModelo(requerimiento) {
  const codigo = String(requerimiento?.codigoProfesion || "").toUpperCase();
  if (codigo) return codigo === "MODELO";
  return String(requerimiento?.nombreProfesion || "").toLowerCase() === "modelo";
}

export function textoUbicacion(candidato) {
  const ciudad = String(candidato?.ciudad || "").trim();
  const provincia = String(candidato?.provincia || "").trim();
  return [ciudad, provincia].filter(Boolean).join(", ");
}

export function iniciales(nombre) {
  const partes = String(nombre || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!partes.length) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
}

export function opcionesEstadoCasting(conteos = {}) {
  return [
    ESTADOS_CASTING.PENDIENTE,
    ESTADOS_CASTING.ACEPTADA,
    ESTADOS_CASTING.RECHAZADA,
    ESTADOS_CASTING.TODAS,
  ].map((estado) => ({
    value: estado,
    text: ETIQUETAS_ESTADO_CASTING[estado],
    total: totalDeEstado(conteos, estado),
  }));
}

function totalDeEstado(conteos, estado) {
  const valor = estado ? conteos?.[estado] : conteos?.TOTAL;
  if (valor === null || valor === undefined) return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

function numeroTexto(valor) {
  if (valor === null || valor === undefined || valor === "") return "";
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return "";
  return String(numero).replace(/\.0+$/, "");
}

export function simboloDeUnidad(unidad) {
  return simboloUnidad(unidad);
}
