/*
 * Utilidades del módulo Contratos:
 * UC-39 Generar, UC-53 Modificar, UC-55 Firmar/Rechazar y UC-68 Buscar.
 * (docs/backend/ficha-tecnica-*.md).
 *
 * El sistema es la fuente de verdad: `puedeGenerarse`, `conflictos[]`, el texto
 * del borrador y los estados de firma se muestran tal como llegan. El front no
 * arma cláusulas, no decide duplicados ni emite notificaciones: sólo orquesta
 * los pasos Datos → Borrador → Emisión.
 *
 * La previsualización siempre responde 200: los conflictos de negocio llegan en
 * `conflictos[]` con `puedeGenerarse: false`. Sólo 403/404/409 son errores HTTP.
 */

import {
  ESTADOS_PROYECTO,
  ROLES_PROYECTO,
  normalizarEstadoProyecto,
} from "./proyectoConstants.js";

export const CODIGOS_CONTRATO = {
  TIPO_ACUERDO_INVALIDO: "TIPO_ACUERDO_INVALIDO",
  ACCESO_DENEGADO_PROYECTO: "ACCESO_DENEGADO_PROYECTO",
  PROYECTO_NO_ENCONTRADO: "PROYECTO_NO_ENCONTRADO",
  PERFIL_NO_ENCONTRADO: "PERFIL_NO_ENCONTRADO",
  PERFIL_ACTIVO_NO_SELECCIONADO: "PERFIL_ACTIVO_NO_SELECCIONADO",
  PERFIL_EN_BAJA: "PERFIL_EN_BAJA",
  PROYECTO_NO_APTO_PARA_CONTRATO: "PROYECTO_NO_APTO_PARA_CONTRATO",
  PROYECTO_SIN_MIEMBROS_ACTIVOS: "PROYECTO_SIN_MIEMBROS_ACTIVOS",
  CONTRATO_NO_ENCONTRADO: "CONTRATO_NO_ENCONTRADO",
  CONTRATO_NO_PENDIENTE_FIRMA: "CONTRATO_NO_PENDIENTE_FIRMA",
  CONTRATO_CON_FIRMAS_REGISTRADAS: "CONTRATO_CON_FIRMAS_REGISTRADAS",
  CONTRATO_SIN_DESTINATARIOS: "CONTRATO_SIN_DESTINATARIOS",
  DESTINATARIO_INVALIDO: "DESTINATARIO_INVALIDO",
  CONTRATO_DUPLICADO_ACTIVO: "CONTRATO_DUPLICADO_ACTIVO",
  CONTRATO_TEXTO_INVALIDO: "CONTRATO_TEXTO_INVALIDO",
  RANGO_FECHAS_CONTRATO_INVALIDO: "RANGO_FECHAS_CONTRATO_INVALIDO",
  CONTRATO_YA_FIRMADO: "CONTRATO_YA_FIRMADO",
  CONTRATO_YA_RECHAZADO: "CONTRATO_YA_RECHAZADO",
  FIRMA_NO_PENDIENTE: "FIRMA_NO_PENDIENTE",
  MOTIVO_RECHAZO_OBLIGATORIO: "MOTIVO_RECHAZO_OBLIGATORIO",
};

/** Texto de respaldo cuando el sistema no envía `message`. */
export const MENSAJES_CODIGO_CONTRATO = {
  [CODIGOS_CONTRATO.TIPO_ACUERDO_INVALIDO]:
    "El tipo de acuerdo no existe o no está activo.",
  [CODIGOS_CONTRATO.ACCESO_DENEGADO_PROYECTO]:
    "No tenés permiso para generar contratos en este proyecto.",
  [CODIGOS_CONTRATO.PROYECTO_NO_ENCONTRADO]: "El proyecto no existe.",
  [CODIGOS_CONTRATO.PERFIL_NO_ENCONTRADO]:
    "El perfil activo no existe o no está disponible.",
  [CODIGOS_CONTRATO.PROYECTO_NO_APTO_PARA_CONTRATO]:
    "El proyecto no está en un estado que permita generar contratos.",
  [CODIGOS_CONTRATO.PROYECTO_SIN_MIEMBROS_ACTIVOS]:
    "El proyecto no tiene miembros activos.",
  [CODIGOS_CONTRATO.CONTRATO_SIN_DESTINATARIOS]:
    "Seleccioná al menos un destinatario.",
  [CODIGOS_CONTRATO.DESTINATARIO_INVALIDO]:
    "Alguno de los destinatarios ya no es un miembro activo del proyecto.",
  [CODIGOS_CONTRATO.CONTRATO_DUPLICADO_ACTIVO]:
    "Algún destinatario ya tiene un contrato activo de este tipo en el proyecto.",
  [CODIGOS_CONTRATO.CONTRATO_TEXTO_INVALIDO]:
    "El texto del contrato no es válido.",
  [CODIGOS_CONTRATO.PERFIL_ACTIVO_NO_SELECCIONADO]:
    "No hay un perfil activo seleccionado en la sesión.",
  [CODIGOS_CONTRATO.PERFIL_EN_BAJA]: "El perfil no se encuentra activo.",
  [CODIGOS_CONTRATO.CONTRATO_NO_ENCONTRADO]:
    "El contrato no existe o pertenece a otro proyecto.",
  [CODIGOS_CONTRATO.CONTRATO_NO_PENDIENTE_FIRMA]:
    "El contrato ya no está pendiente de firma.",
  [CODIGOS_CONTRATO.CONTRATO_CON_FIRMAS_REGISTRADAS]:
    "Alguna parte ya firmó o rechazó el contrato.",
  [CODIGOS_CONTRATO.RANGO_FECHAS_CONTRATO_INVALIDO]:
    "La fecha desde no puede ser posterior a la fecha hasta.",
  [CODIGOS_CONTRATO.CONTRATO_YA_FIRMADO]:
    "Ya firmaste este contrato.",
  [CODIGOS_CONTRATO.CONTRATO_YA_RECHAZADO]:
    "Ya rechazaste este contrato.",
  [CODIGOS_CONTRATO.FIRMA_NO_PENDIENTE]:
    "Tu firma ya no está pendiente para este contrato.",
  [CODIGOS_CONTRATO.MOTIVO_RECHAZO_OBLIGATORIO]:
    "Indicá un motivo para rechazar el contrato.",
};

/** Estados de contrato documentados en las fichas. */
export const ESTADOS_CONTRATO = {
  BORRADOR: "BORRADOR",
  PENDIENTE_FIRMA: "PENDIENTE_FIRMA",
  ACTIVO: "ACTIVO",
  RECHAZADO_POR_PARTES: "RECHAZADO_POR_PARTES",
  CANCELADO: "CANCELADO",
  ELIMINADO: "ELIMINADO",
};

export const ETIQUETAS_ESTADO_CONTRATO = {
  [ESTADOS_CONTRATO.BORRADOR]: "Borrador",
  [ESTADOS_CONTRATO.PENDIENTE_FIRMA]: "Pendiente de firma",
  [ESTADOS_CONTRATO.ACTIVO]: "Activo",
  [ESTADOS_CONTRATO.RECHAZADO_POR_PARTES]: "Rechazado por las partes",
  [ESTADOS_CONTRATO.CANCELADO]: "Cancelado",
  [ESTADOS_CONTRATO.ELIMINADO]: "Eliminado",
};

/**
 * Conjunto que aplica el backend cuando no se envía `estados` (UC-68).
 * `BORRADOR` y `ELIMINADO` quedan fuera por defecto.
 */
export const ESTADOS_CONTRATO_POR_DEFECTO = [
  ESTADOS_CONTRATO.PENDIENTE_FIRMA,
  ESTADOS_CONTRATO.ACTIVO,
  ESTADOS_CONTRATO.RECHAZADO_POR_PARTES,
  ESTADOS_CONTRATO.CANCELADO,
];

/** Estados que la UI muestra sólo en filtros avanzados. */
export const ESTADOS_CONTRATO_AVANZADOS = [
  ESTADOS_CONTRATO.BORRADOR,
  ESTADOS_CONTRATO.ELIMINADO,
];

/** Opciones de los chips principales de búsqueda. */
export const OPCIONES_ESTADO_CONTRATO = [
  {
    value: ESTADOS_CONTRATO.PENDIENTE_FIRMA,
    text: ETIQUETAS_ESTADO_CONTRATO[ESTADOS_CONTRATO.PENDIENTE_FIRMA],
  },
  {
    value: ESTADOS_CONTRATO.ACTIVO,
    text: ETIQUETAS_ESTADO_CONTRATO[ESTADOS_CONTRATO.ACTIVO],
  },
  {
    value: ESTADOS_CONTRATO.RECHAZADO_POR_PARTES,
    text: ETIQUETAS_ESTADO_CONTRATO[ESTADOS_CONTRATO.RECHAZADO_POR_PARTES],
  },
  {
    value: ESTADOS_CONTRATO.CANCELADO,
    text: ETIQUETAS_ESTADO_CONTRATO[ESTADOS_CONTRATO.CANCELADO],
  },
];

export const OPCIONES_ESTADO_CONTRATO_AVANZADO = [
  {
    value: ESTADOS_CONTRATO.BORRADOR,
    text: ETIQUETAS_ESTADO_CONTRATO[ESTADOS_CONTRATO.BORRADOR],
  },
  {
    value: ESTADOS_CONTRATO.ELIMINADO,
    text: ETIQUETAS_ESTADO_CONTRATO[ESTADOS_CONTRATO.ELIMINADO],
  },
];

/** Roles de las partes en `firma_contrato` (§5). */
export const ROLES_PARTE_CONTRATO = {
  DIRECTOR: "DIRECTOR",
  DIRECTOR_DESTINATARIO: "DIRECTOR_DESTINATARIO",
  DESTINATARIO: "DESTINATARIO",
};

export const ETIQUETAS_ROL_PARTE_CONTRATO = {
  [ROLES_PARTE_CONTRATO.DIRECTOR]: "Director",
  [ROLES_PARTE_CONTRATO.DIRECTOR_DESTINATARIO]: "Director y destinatario",
  [ROLES_PARTE_CONTRATO.DESTINATARIO]: "Destinatario",
};

/** Estados de firma documentados en las fichas. */
export const ESTADOS_FIRMA_CONTRATO = {
  PENDIENTE: "PENDIENTE",
  FIRMADO: "FIRMADO",
  RECHAZADO: "RECHAZADO",
  CANCELADA: "CANCELADA",
  INVALIDADA: "INVALIDADA",
};

export const ETIQUETAS_ESTADO_FIRMA_CONTRATO = {
  [ESTADOS_FIRMA_CONTRATO.PENDIENTE]: "Firma pendiente",
  [ESTADOS_FIRMA_CONTRATO.FIRMADO]: "Firmado",
  [ESTADOS_FIRMA_CONTRATO.RECHAZADO]: "Rechazado",
  [ESTADOS_FIRMA_CONTRATO.CANCELADA]: "Firma cancelada",
  [ESTADOS_FIRMA_CONTRATO.INVALIDADA]: "Firma invalidada",
};

/** Pasos del wizard (mockups UC-39). */
export const PASOS_CONTRATO = [
  { id: 1, etiqueta: "Datos" },
  { id: 2, etiqueta: "Borrador" },
  { id: 3, etiqueta: "Emisión" },
];

/**
 * Límites del contrato (UC-39/UC-53).
 * - Texto final: 100.000 caracteres.
 * - Cláusula adicional: 1.000.
 * - Nombre: 50.
 * - Descripción: 200.
 */
export const LIMITE_CLAUSULA_CONTRATO = 1000;
export const LIMITE_TEXTO_CONTRATO = 100000;
export const LIMITE_NOMBRE_CONTRATO = 50;
export const LIMITE_DESCRIPCION_CONTRATO = 200;
export const LIMITE_MOTIVO_RECHAZO = 200;

/** Estados del proyecto que habilitan generar contratos (§2.1). */
export const ESTADOS_PROYECTO_APTO_CONTRATO = [
  ESTADOS_PROYECTO.PUBLICADO,
  ESTADOS_PROYECTO.CONFIRMADO,
];

export const TEXTO_CONFLICTO_CONTRATO_ACTIVO =
  "Ya tiene un contrato activo de este tipo en el proyecto";

/**
 * El proyecto está en un estado que permite generar contratos.
 * @param {{estado?: string}|null|undefined} proyecto
 * @returns {boolean}
 */
export function esProyectoAptoParaContrato(proyecto) {
  return ESTADOS_PROYECTO_APTO_CONTRATO.includes(
    normalizarEstadoProyecto(proyecto?.estado)
  );
}

/**
 * Fuente de verdad del frontend para mostrar la pestaña y el botón: Director
 * activo del proyecto en estado Publicado o Confirmado (§2.1). El backend
 * vuelve a validarlo en cada endpoint.
 * @param {{esMiembro?: boolean, rolUsuario?: string|null, estado?: string}|null|undefined} proyecto
 * @returns {boolean}
 */
export function puedeGenerarContrato(proyecto) {
  if (!proyecto?.esMiembro) return false;
  if (
    String(proyecto.rolUsuario || "").toUpperCase() !== ROLES_PROYECTO.DIRECTOR
  ) {
    return false;
  }
  return esProyectoAptoParaContrato(proyecto);
}

/**
 * Texto de respaldo por código (el `message` del sistema tiene prioridad).
 * @param {string|null|undefined} codigo
 * @returns {string}
 */
export function mensajeCodigoContrato(codigo) {
  if (!codigo) return "";
  return MENSAJES_CODIGO_CONTRATO[codigo] || "";
}

/**
 * @param {string|null|undefined} estado
 * @returns {string}
 */
export function etiquetaEstadoContrato(estado) {
  if (!estado) return "";
  return ETIQUETAS_ESTADO_CONTRATO[estado] || String(estado);
}

/**
 * @param {string|null|undefined} estado
 * @returns {string}
 */
export function etiquetaEstadoFirmaContrato(estado) {
  if (!estado) return "";
  return ETIQUETAS_ESTADO_FIRMA_CONTRATO[estado] || String(estado);
}

/**
 * @param {string|null|undefined} rol
 * @returns {string}
 */
export function etiquetaRolParteContrato(rol) {
  if (!rol) return "";
  return ETIQUETAS_ROL_PARTE_CONTRATO[rol] || String(rol);
}

/**
 * Nombre completo para las partes del contrato (mockup: "Chloe Price").
 * @param {{nombreCompleto?: string|null, nombreArtistico?: string|null}|null|undefined} miembro
 * @returns {string}
 */
export function nombreParteContrato(miembro) {
  return (
    miembro?.nombreCompleto ||
    miembro?.nombreArtistico ||
    "Perfil sin nombre"
  );
}

/**
 * Nombre artístico para listas compactas (mockup del paso Datos).
 * @param {{nombreCompleto?: string|null, nombreArtistico?: string|null}|null|undefined} miembro
 * @returns {string}
 */
export function nombreCortoContrato(miembro) {
  return (
    miembro?.nombreArtistico ||
    miembro?.nombreCompleto ||
    "Perfil sin nombre"
  );
}

/**
 * Inicial para el avatar sin foto (el DTO de UC-39 no trae imagen).
 * @param {{nombreCompleto?: string|null, nombreArtistico?: string|null}|null|undefined} miembro
 * @returns {string}
 */
export function inicialParteContrato(miembro) {
  const nombre = nombreCortoContrato(miembro).trim();
  return nombre.charAt(0).toUpperCase() || "?";
}

/**
 * @typedef {Object} ConflictoContrato
 * @property {string} codigo
 * @property {number|null} idMiembro
 * @property {string} nombre
 * @property {string} mensaje
 */

/**
 * Normaliza `conflictos[]` de la previsualización o del 409.
 * @param {unknown} lista
 * @returns {ConflictoContrato[]}
 */
export function normalizarConflictosContrato(lista) {
  if (!Array.isArray(lista)) return [];
  return lista
    .filter((conflicto) => conflicto && typeof conflicto === "object")
    .map((conflicto) => ({
      codigo: conflicto.codigo ? String(conflicto.codigo) : "",
      idMiembro:
        conflicto.idMiembro != null ? Number(conflicto.idMiembro) : null,
      nombre: conflicto.nombre || "",
      mensaje: conflicto.mensaje || conflicto.message || "",
    }))
    .filter((conflicto) => conflicto.mensaje || conflicto.codigo);
}

/**
 * @typedef {Object} OpcionesContrato
 * @property {Object|null} proyecto
 * @property {Object|null} emisor
 * @property {Object[]} tiposAcuerdo
 * @property {Object[]} miembros
 * @property {Object[]} contratosActivos
 */

/**
 * Normaliza el GET /opciones con defaults seguros.
 * @param {unknown} data
 * @returns {OpcionesContrato}
 */
export function normalizarOpcionesContrato(data) {
  const opciones = data && typeof data === "object" ? data : {};

  return {
    proyecto: opciones.proyecto || null,
    emisor: opciones.emisor || null,
    tiposAcuerdo: Array.isArray(opciones.tiposAcuerdo)
      ? opciones.tiposAcuerdo
      : [],
    miembros: Array.isArray(opciones.miembros) ? opciones.miembros : [],
    contratosActivos: Array.isArray(opciones.contratosActivos)
      ? opciones.contratosActivos
      : [],
  };
}

/**
 * Contrato activo de un miembro para el tipo de acuerdo elegido. La
 * combinación conflictiva se deshabilita en el paso Datos (§3.1).
 * @param {Object|null|undefined} miembro
 * @param {number|string|null|undefined} idTipoAcuerdo
 * @param {Object[]} contratosActivos
 * @returns {Object|null}
 */
export function contratoActivoDeMiembro(
  miembro,
  idTipoAcuerdo,
  contratosActivos
) {
  if (
    miembro?.idMiembro == null ||
    idTipoAcuerdo == null ||
    !Array.isArray(contratosActivos)
  ) {
    return null;
  }

  return (
    contratosActivos.find(
      (contrato) =>
        String(contrato?.idMiembro) === String(miembro.idMiembro) &&
        String(contrato?.idTipoAcuerdo) === String(idTipoAcuerdo)
    ) || null
  );
}

/**
 * @typedef {Object} PreviewContrato
 * @property {string} texto
 * @property {boolean} puedeGenerarse
 * @property {ConflictoContrato[]} conflictos
 */

/**
 * Normaliza la respuesta de POST /previsualizar. Nunca habilita la emisión por
 * accidente: `puedeGenerarse` sólo es true si el sistema lo envía así.
 * @param {unknown} data
 * @returns {PreviewContrato}
 */
export function normalizarPreviewContrato(data) {
  const preview = data && typeof data === "object" ? data : {};

  return {
    texto: typeof preview.texto === "string" ? preview.texto : "",
    puedeGenerarse: preview.puedeGenerarse === true,
    conflictos: normalizarConflictosContrato(preview.conflictos),
  };
}

/**
 * @typedef {Object} ErrorContratoClasificado
 * @property {number|undefined} status
 * @property {string} codigo
 * @property {string} mensaje
 * @property {ConflictoContrato[]} conflictos
 * @property {Object<string, string>} errores
 * @property {boolean} esDuplicado
 * @property {boolean} esEstado el proyecto o el tipo ya no permiten continuar
 */

/**
 * Clasifica un error de UC-39 por `codigo` (ficha §4).
 * @param {object} error error Axios
 * @returns {ErrorContratoClasificado}
 */
export function clasificarErrorContrato(error) {
  const data = error?.response?.data;
  const codigo = data?.codigo ? String(data.codigo) : "";

  return {
    status: error?.response?.status,
    codigo,
    mensaje: data?.message || data?.mensaje || mensajeCodigoContrato(codigo),
    conflictos: normalizarConflictosContrato(data?.conflictos),
    errores:
      data?.errores && typeof data.errores === "object" ? data.errores : {},
    esDuplicado: codigo === CODIGOS_CONTRATO.CONTRATO_DUPLICADO_ACTIVO,
    esEstado:
      codigo === CODIGOS_CONTRATO.PROYECTO_NO_APTO_PARA_CONTRATO ||
      codigo === CODIGOS_CONTRATO.PROYECTO_SIN_MIEMBROS_ACTIVOS ||
      codigo === CODIGOS_CONTRATO.TIPO_ACUERDO_INVALIDO,
  };
}

/** Motivos de bloqueo de UC-53 y su texto para la UI. */
export const MOTIVOS_NO_MODIFICABLE = {
  SIN_PERMISO: "SIN_PERMISO",
  CONTRATO_NO_PENDIENTE_FIRMA: "CONTRATO_NO_PENDIENTE_FIRMA",
  PROYECTO_NO_APTO_PARA_CONTRATO: "PROYECTO_NO_APTO_PARA_CONTRATO",
  CONTRATO_CON_FIRMAS_REGISTRADAS: "CONTRATO_CON_FIRMAS_REGISTRADAS",
};

export const ETIQUETAS_MOTIVO_NO_MODIFICABLE = {
  [MOTIVOS_NO_MODIFICABLE.SIN_PERMISO]:
    "Solo el Director activo del proyecto puede modificar este contrato.",
  [MOTIVOS_NO_MODIFICABLE.CONTRATO_NO_PENDIENTE_FIRMA]:
    "El contrato ya no está pendiente de firma.",
  [MOTIVOS_NO_MODIFICABLE.PROYECTO_NO_APTO_PARA_CONTRATO]:
    "El proyecto no está Publicado o Confirmado.",
  [MOTIVOS_NO_MODIFICABLE.CONTRATO_CON_FIRMAS_REGISTRADAS]:
    "Alguna parte ya firmó o rechazó el contrato.",
};

/**
 * @param {string|null|undefined} motivo
 * @returns {string}
 */
export function etiquetaMotivoNoModificable(motivo) {
  if (!motivo) return "";
  return ETIQUETAS_MOTIVO_NO_MODIFICABLE[motivo] || String(motivo);
}

/**
 * @param {unknown} valor
 * @returns {number|null}
 */
function numeroONull(valor) {
  if (valor === null || valor === undefined || valor === "") return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

/**
 * @param {unknown} valor
 * @returns {string}
 */
function textoONull(valor) {
  return typeof valor === "string" ? valor : valor == null ? "" : String(valor);
}

/**
 * Normaliza la respuesta del detalle común de UC-53/UC-55/UC-68.
 * @param {unknown} data
 * @returns {Object}
 */
export function normalizarDetalleContrato(data) {
  const contrato = data && typeof data === "object" ? data : {};
  const partes = Array.isArray(contrato.partes)
    ? contrato.partes.map((parte) => ({
        idMiembro: numeroONull(parte?.idMiembro),
        idPerfil: numeroONull(parte?.idPerfil),
        nombre: textoONull(parte?.nombre),
        nombreArtistico: textoONull(parte?.nombreArtistico),
        rolParte: textoONull(parte?.rolParte),
        estadoFirma: textoONull(parte?.estadoFirma),
        fechaFirma: parte?.fechaFirma || null,
        fechaRechazo: parte?.fechaRechazo || null,
        motivoRechazo: textoONull(parte?.motivoRechazo),
      }))
    : [];

  return {
    idContrato: numeroONull(contrato.idContrato),
    idProyecto: numeroONull(contrato.idProyecto),
    nombreProyecto: textoONull(contrato.nombreProyecto),
    estadoProyecto: textoONull(contrato.estadoProyecto),
    idTipoAcuerdo: numeroONull(contrato.idTipoAcuerdo),
    codigoTipoAcuerdo: textoONull(contrato.codigoTipoAcuerdo),
    nombreTipoAcuerdo: textoONull(contrato.nombreTipoAcuerdo),
    nombre: textoONull(contrato.nombre),
    descripcion: textoONull(contrato.descripcion),
    estado: textoONull(contrato.estado),
    versionActual: numeroONull(contrato.versionActual),
    fechaCreacion: contrato.fechaCreacion || null,
    fechaEmision: contrato.fechaEmision || null,
    fechaModificacion: contrato.fechaModificacion || null,
    texto: textoONull(contrato.texto),
    emisor: contrato.emisor && typeof contrato.emisor === "object"
      ? contrato.emisor
      : null,
    partes,
    miEstadoFirma: textoONull(contrato.miEstadoFirma),
    miFechaFirma: contrato.miFechaFirma || null,
    fechaRechazo: contrato.fechaRechazo || null,
    motivoRechazo: textoONull(contrato.motivoRechazo),
    puedeModificarse:
      typeof contrato.puedeModificarse === "boolean"
        ? contrato.puedeModificarse
        : contrato.puedeModificar === true,
    motivoNoModificable: textoONull(contrato.motivoNoModificable),
    puedeFirmar: contrato.puedeFirmar === true,
    puedeRechazar: contrato.puedeRechazar === true,
    firmados: numeroONull(contrato.firmados) || 0,
    totalPartes: numeroONull(contrato.totalPartes) || 0,
  };
}

/**
 * Normaliza una fila de GET /contratos/buscar.
 * @param {unknown} data
 * @returns {Object}
 */
export function normalizarContratoResumen(data) {
  const contrato = normalizarDetalleContrato(data);
  return {
    ...contrato,
    puedeModificar: puedeModificarContrato(data),
  };
}

/**
 * @param {unknown} data
 * @returns {{contenido: Object[], paginaActual: number, tamanoPagina: number, totalElementos: number, totalPaginas: number, primera: boolean, ultima: boolean}}
 */
export function normalizarPaginaContratos(data) {
  const pagina = data && typeof data === "object" ? data : {};
  const contenido = Array.isArray(pagina.contenido)
    ? pagina.contenido.map(normalizarContratoResumen)
    : [];

  return {
    contenido,
    paginaActual: numeroONull(pagina.paginaActual) || 0,
    tamanoPagina: numeroONull(pagina.tamanoPagina) || 20,
    totalElementos: numeroONull(pagina.totalElementos) || 0,
    totalPaginas: numeroONull(pagina.totalPaginas) || 0,
    primera: pagina.primera === true,
    ultima: pagina.ultima === true,
  };
}

/**
 * @param {unknown} data
 * @returns {Object}
 */
export function normalizarPreviewModificacion(data) {
  const preview = data && typeof data === "object" ? data : {};
  return {
    texto: typeof preview.texto === "string" ? preview.texto : "",
    puedeModificarse: preview.puedeModificarse === true,
    conflictos: normalizarConflictosContrato(preview.conflictos),
  };
}

/**
 * Destinatarios actuales derivados de las partes (§3.1): se incluyen
 * DESTINATARIO y DIRECTOR_DESTINATARIO, y se excluye DIRECTOR.
 * @param {Array<{idMiembro?: number|null, rolParte?: string}>} partes
 * @returns {number[]}
 */
export function idsDestinatariosDePartes(partes) {
  const ids = [];
  const vistos = new Set();

  (Array.isArray(partes) ? partes : []).forEach((parte) => {
    if (
      parte?.rolParte !== ROLES_PARTE_CONTRATO.DESTINATARIO &&
      parte?.rolParte !== ROLES_PARTE_CONTRATO.DIRECTOR_DESTINATARIO
    ) {
      return;
    }

    const id = numeroONull(parte.idMiembro);
    if (id == null || vistos.has(id)) return;
    vistos.add(id);
    ids.push(id);
  });

  return ids;
}

/**
 * Acepta el flag del listado (`puedeModificar`) o del detalle
 * (`puedeModificarse`) sin recalcular reglas en el frontend.
 * @param {object|null|undefined} contrato
 * @returns {boolean}
 */
export function puedeModificarContrato(contrato) {
  if (!contrato || typeof contrato !== "object") return false;
  if (typeof contrato.puedeModificarse === "boolean") {
    return contrato.puedeModificarse;
  }
  return contrato.puedeModificar === true;
}

/**
 * Códigos de UC-55 que indican que el estado del contrato cambió entre la
 * carga y el envío. La UI debe cerrar el modal, avisar y refrescar/redirigir.
 * @param {string|null|undefined} codigo
 * @returns {boolean}
 */
export function esErrorEstadoFirmaObsoleto(codigo) {
  return [
    CODIGOS_CONTRATO.CONTRATO_YA_FIRMADO,
    CODIGOS_CONTRATO.CONTRATO_YA_RECHAZADO,
    CODIGOS_CONTRATO.FIRMA_NO_PENDIENTE,
    CODIGOS_CONTRATO.CONTRATO_NO_PENDIENTE_FIRMA,
    CODIGOS_CONTRATO.PROYECTO_NO_APTO_PARA_CONTRATO,
  ].includes(codigo);
}

/**
 * @param {string|null|undefined} codigo
 * @returns {boolean}
 */
export function esPerfilEnBaja(codigo) {
  return codigo === CODIGOS_CONTRATO.PERFIL_EN_BAJA;
}

/**
 * Nombre visible del emisor en el detalle o en el listado.
 * @param {object|null|undefined} emisor
 * @returns {string}
 */
export function nombreEmisorContrato(emisor) {
  return (
    emisor?.nombreCompleto ||
    emisor?.nombreArtistico ||
    emisor?.nombre ||
    "Perfil sin nombre"
  );
}

/**
 * Texto de respaldo para errores de UC-53/UC-55/UC-68.
 * @param {object} error error Axios
 * @param {string} fallback
 * @returns {string}
 */
export function mensajeErrorContrato(error, fallback = "No se pudo completar la operación.") {
  const data = error?.response?.data;
  return (
    data?.message ||
    data?.mensaje ||
    mensajeCodigoContrato(data?.codigo) ||
    fallback
  );
}

/**
 * Arma las partes que mostrará el paso Borrador antes de emitir. La ficha deja
 * todas las firmas en PENDIENTE al emitir; el director figura una sola vez y,
 * si además fue seleccionado como destinatario, con DIRECTOR_DESTINATARIO.
 * @param {Object|null|undefined} emisor
 * @param {Object[]} miembrosSeleccionados
 * @returns {Array<{idMiembro: number|null, idPerfil: number|null, nombre: string, rolParte: string, estadoFirma: string}>}
 */
export function partesPrevistasContrato(emisor, miembrosSeleccionados) {
  const seleccionados = Array.isArray(miembrosSeleccionados)
    ? miembrosSeleccionados
    : [];
  const partes = [];

  if (emisor?.idMiembro != null) {
    const esDestinatario = seleccionados.some(
      (miembro) => String(miembro?.idMiembro) === String(emisor.idMiembro)
    );

    partes.push({
      idMiembro: Number(emisor.idMiembro),
      idPerfil: emisor.idPerfil != null ? Number(emisor.idPerfil) : null,
      nombre: nombreCortoContrato(emisor),
      nombreCompleto: nombreParteContrato(emisor),
      rolParte: esDestinatario
        ? ROLES_PARTE_CONTRATO.DIRECTOR_DESTINATARIO
        : ROLES_PARTE_CONTRATO.DIRECTOR,
      estadoFirma: ESTADOS_FIRMA_CONTRATO.PENDIENTE,
    });
  }

  seleccionados
    .filter(
      (miembro) =>
        String(miembro?.idMiembro) !== String(emisor?.idMiembro ?? "")
    )
    .forEach((miembro) => {
      partes.push({
        idMiembro:
          miembro.idMiembro != null ? Number(miembro.idMiembro) : null,
        idPerfil: miembro.idPerfil != null ? Number(miembro.idPerfil) : null,
        nombre: nombreCortoContrato(miembro),
        nombreCompleto: nombreParteContrato(miembro),
        rolParte: ROLES_PARTE_CONTRATO.DESTINATARIO,
        estadoFirma: ESTADOS_FIRMA_CONTRATO.PENDIENTE,
      });
    });

  return partes;
}
