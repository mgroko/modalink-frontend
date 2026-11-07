/*
 * Utilidades de UC-39 Generar contrato
 * (docs/backend/ficha-tecnica-generar-contrato.md).
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
  PROYECTO_NO_APTO_PARA_CONTRATO: "PROYECTO_NO_APTO_PARA_CONTRATO",
  PROYECTO_SIN_MIEMBROS_ACTIVOS: "PROYECTO_SIN_MIEMBROS_ACTIVOS",
  CONTRATO_SIN_DESTINATARIOS: "CONTRATO_SIN_DESTINATARIOS",
  DESTINATARIO_INVALIDO: "DESTINATARIO_INVALIDO",
  CONTRATO_DUPLICADO_ACTIVO: "CONTRATO_DUPLICADO_ACTIVO",
  CONTRATO_TEXTO_INVALIDO: "CONTRATO_TEXTO_INVALIDO",
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
};

/** Estados de contrato documentados en la ficha. */
export const ESTADOS_CONTRATO = {
  BORRADOR: "BORRADOR",
  PENDIENTE_FIRMA: "PENDIENTE_FIRMA",
  ACTIVO: "ACTIVO",
  CANCELADO: "CANCELADO",
};

export const ETIQUETAS_ESTADO_CONTRATO = {
  [ESTADOS_CONTRATO.BORRADOR]: "Borrador",
  [ESTADOS_CONTRATO.PENDIENTE_FIRMA]: "Pendiente de firma",
  [ESTADOS_CONTRATO.ACTIVO]: "Activo",
  [ESTADOS_CONTRATO.CANCELADO]: "Cancelado",
};

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

/** Estados de firma documentados en la ficha (la emisión deja todo PENDIENTE). */
export const ESTADOS_FIRMA_CONTRATO = {
  PENDIENTE: "PENDIENTE",
};

export const ETIQUETAS_ESTADO_FIRMA_CONTRATO = {
  [ESTADOS_FIRMA_CONTRATO.PENDIENTE]: "Firma pendiente",
};

/** Pasos del wizard (mockups UC-39). */
export const PASOS_CONTRATO = [
  { id: 1, etiqueta: "Datos" },
  { id: 2, etiqueta: "Borrador" },
  { id: 3, etiqueta: "Emisión" },
];

/**
 * Límite por cláusula adicional. Definido en 1000 caracteres; se centraliza
 * acá para que la UI y cualquier validación cliente usen el mismo valor.
 */
export const LIMITE_CLAUSULA_CONTRATO = 1000;

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
      nombre: nombreParteContrato(emisor),
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
        nombre: nombreParteContrato(miembro),
        rolParte: ROLES_PARTE_CONTRATO.DESTINATARIO,
        estadoFirma: ESTADOS_FIRMA_CONTRATO.PENDIENTE,
      });
    });

  return partes;
}
