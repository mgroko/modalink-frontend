/*
 * Utilidades de UC-37 Finalizar proyecto y calificaciones entre participantes
 * (docs/backend/ficha-tecnica-finalizar-proyecto.md).
 *
 * El backend es la fuente de verdad: `puedeFinalizar`, `bloqueos`, los
 * contadores, `miembrosACalificar`, `calificacionesEmitidas` y `faltantes` se
 * muestran tal como llegan. El front solo valida el formulario antes de enviar.
 */

import { normalizarBloqueos } from "./confirmacionConstants.js";

export const VALORACION_MIN = 1;
export const VALORACION_MAX = 5;
export const LIMITE_RESENIA = 200;

export const ETIQUETAS_VALORACION = {
  1: "Muy malo",
  2: "Malo",
  3: "Regular",
  4: "Bueno",
  5: "Excelente",
};

export const CODIGOS_FINALIZACION = {
  CALIFICACION_INVALIDA: "CALIFICACION_INVALIDA",
  PROYECTO_YA_FINALIZADO: "PROYECTO_YA_FINALIZADO",
  ESTADO_PROYECTO_INVALIDO: "ESTADO_PROYECTO_INVALIDO",
  PLANIFICACION_NO_ENCONTRADA: "PLANIFICACION_NO_ENCONTRADA",
  FECHA_ENTREGA_NO_DEFINIDA: "FECHA_ENTREGA_NO_DEFINIDA",
  FECHA_ENTREGA_FUTURA: "FECHA_ENTREGA_FUTURA",
  SIN_ACTIVIDADES: "SIN_ACTIVIDADES",
  ACTIVIDAD_NO_FINALIZADA: "ACTIVIDAD_NO_FINALIZADA",
  CALIFICACIONES_INCOMPLETAS: "CALIFICACIONES_INCOMPLETAS",
  PROYECTO_NO_CALIFICABLE: "PROYECTO_NO_CALIFICABLE",
};

/** Texto de respaldo cuando el sistema no envía `message`. */
export const MENSAJES_CODIGO_FINALIZACION = {
  [CODIGOS_FINALIZACION.CALIFICACION_INVALIDA]:
    "La calificación no es válida. Revisá la valoración y la reseña.",
  [CODIGOS_FINALIZACION.PROYECTO_YA_FINALIZADO]:
    "El proyecto ya está finalizado.",
  [CODIGOS_FINALIZACION.ESTADO_PROYECTO_INVALIDO]:
    "El proyecto no está en un estado que permita finalizarlo.",
  [CODIGOS_FINALIZACION.PLANIFICACION_NO_ENCONTRADA]:
    "El proyecto no tiene una planificación asociada.",
  [CODIGOS_FINALIZACION.FECHA_ENTREGA_NO_DEFINIDA]:
    "La planificación no tiene fecha de entrega.",
  [CODIGOS_FINALIZACION.FECHA_ENTREGA_FUTURA]:
    "Todavía no se alcanzó la fecha de entrega del proyecto.",
  [CODIGOS_FINALIZACION.SIN_ACTIVIDADES]:
    "El proyecto no tiene actividades.",
  [CODIGOS_FINALIZACION.ACTIVIDAD_NO_FINALIZADA]:
    "Todavía hay actividades pendientes o en curso.",
  [CODIGOS_FINALIZACION.CALIFICACIONES_INCOMPLETAS]:
    "Faltan calificaciones obligatorias para finalizar.",
  [CODIGOS_FINALIZACION.PROYECTO_NO_CALIFICABLE]:
    "El proyecto todavía no está disponible para calificar.",
};

export const MENSAJES_VALIDACION_CALIFICACION = {
  VALORACION: "Seleccioná una valoración de 1 a 5 estrellas.",
  RESENIA_OBLIGATORIA: "La reseña es obligatoria.",
  RESENIA_LARGA: `La reseña no puede superar los ${LIMITE_RESENIA} caracteres.`,
};

function aEnteroNoNegativo(valor) {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero >= 0 ? numero : 0;
}

function aEnteroPositivo(valor) {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0 ? numero : null;
}

function aFechaMs(valor) {
  if (!valor) return 0;
  const fecha = new Date(valor).getTime();
  return Number.isFinite(fecha) ? fecha : 0;
}

/**
 * @typedef {Object} MiembroACalificar
 * @property {number} idPerfil
 * @property {string} nombreArtistico
 * @property {string} nombreUsuario
 * @property {string} apellidoUsuario
 * @property {string} rol
 * @property {boolean} yaCalificado
 */

/**
 * Normaliza un integrante de `miembrosACalificar[]`. Si no tiene un idPerfil
 * válido se descarta para no enviar calificaciones a perfiles ajenos.
 * @param {unknown} miembro
 * @returns {MiembroACalificar|null}
 */
export function normalizarMiembroACalificar(miembro) {
  const dato = miembro && typeof miembro === "object" ? miembro : {};
  const idPerfil = aEnteroPositivo(dato.idPerfil);
  if (idPerfil == null) return null;

  return {
    idPerfil,
    nombreArtistico:
      dato.nombreArtistico == null ? "" : String(dato.nombreArtistico),
    nombreUsuario: dato.nombreUsuario == null ? "" : String(dato.nombreUsuario),
    apellidoUsuario:
      dato.apellidoUsuario == null ? "" : String(dato.apellidoUsuario),
    rol: dato.rol == null ? "" : String(dato.rol),
    yaCalificado: dato.yaCalificado === true,
  };
}

/**
 * Normaliza la lista de `miembrosACalificar[]` conservando el orden del
 * backend (nombreArtistico y luego idMiembro).
 * @param {unknown} lista
 * @returns {MiembroACalificar[]}
 */
export function normalizarMiembrosACalificar(lista) {
  if (!Array.isArray(lista)) return [];
  return lista.map(normalizarMiembroACalificar).filter(Boolean);
}

/**
 * @typedef {Object} CalificacionEmitida
 * @property {number} idCalificacion
 * @property {number} idPerfilEmisor
 * @property {number} idPerfilReceptor
 * @property {number} valoracion
 * @property {string} resenia
 * @property {string|null} fechaRegistro
 */

/**
 * Normaliza una calificación emitida. No incluye datos del perfil receptor:
 * el nombre se cruza contra `miembrosACalificar[]` por `idPerfil`.
 * @param {unknown} calificacion
 * @returns {CalificacionEmitida|null}
 */
export function normalizarCalificacionEmitida(calificacion) {
  const dato =
    calificacion && typeof calificacion === "object" ? calificacion : {};
  const idCalificacion = aEnteroPositivo(dato.idCalificacion);
  const idPerfilReceptor = aEnteroPositivo(dato.idPerfilReceptor);
  if (idCalificacion == null || idPerfilReceptor == null) return null;

  return {
    idCalificacion,
    idPerfilEmisor: aEnteroPositivo(dato.idPerfilEmisor) ?? 0,
    idPerfilReceptor,
    valoracion: aEnteroNoNegativo(dato.valoracion),
    resenia: dato.resenia == null ? "" : String(dato.resenia),
    fechaRegistro: dato.fechaRegistro == null ? null : String(dato.fechaRegistro),
  };
}

/**
 * @param {unknown} lista
 * @returns {CalificacionEmitida[]}
 */
export function normalizarCalificacionesEmitidas(lista) {
  if (!Array.isArray(lista)) return [];
  return lista.map(normalizarCalificacionEmitida).filter(Boolean);
}

/**
 * @typedef {Object} BloqueoFinalizacion
 * @property {string} codigo
 * @property {string} mensaje
 * @property {string|null} entidadTipo
 * @property {number|null} entidadId
 */

/**
 * @typedef {Object} FinalizacionPreview
 * @property {boolean} puedeFinalizar
 * @property {string} estado
 * @property {string|null} fechaEntrega
 * @property {string|null} fechaActual
 * @property {BloqueoFinalizacion[]} bloqueos
 * @property {MiembroACalificar[]} miembrosACalificar
 * @property {number} calificacionesRequeridas
 * @property {number} calificacionesRealizadas
 * @property {number} calificacionesPendientes
 */

/**
 * Normaliza el preview con defaults seguros. Nunca habilita la finalización
 * por accidente: `puedeFinalizar` solo es true si el backend lo envía true.
 * @param {unknown} data
 * @returns {FinalizacionPreview}
 */
export function normalizarPreviewFinalizacion(data) {
  const preview = data && typeof data === "object" ? data : {};

  return {
    puedeFinalizar: preview.puedeFinalizar === true,
    estado: preview.estado == null ? "" : String(preview.estado),
    fechaEntrega: preview.fechaEntrega || null,
    fechaActual: preview.fechaActual || null,
    bloqueos: normalizarBloqueos(preview.bloqueos),
    miembrosACalificar: normalizarMiembrosACalificar(
      preview.miembrosACalificar
    ),
    calificacionesRequeridas: aEnteroNoNegativo(
      preview.calificacionesRequeridas
    ),
    calificacionesRealizadas: aEnteroNoNegativo(
      preview.calificacionesRealizadas
    ),
    calificacionesPendientes: aEnteroNoNegativo(
      preview.calificacionesPendientes
    ),
  };
}

/**
 * @typedef {Object} CalificacionesProyecto
 * @property {boolean} calificacionesCompletas
 * @property {number} calificacionesRequeridas
 * @property {number} calificacionesRealizadas
 * @property {number} calificacionesPendientes
 * @property {MiembroACalificar[]} miembrosACalificar
 * @property {CalificacionEmitida[]} calificacionesEmitidas
 */

/**
 * Normaliza GET/POST /proyectos/{id}/calificaciones. No ordena
 * `calificacionesEmitidas`: para eso existe `ordenarCalificacionesEmitidas`.
 * @param {unknown} data
 * @returns {CalificacionesProyecto}
 */
export function normalizarCalificacionesProyecto(data) {
  const estado = data && typeof data === "object" ? data : {};

  return {
    calificacionesCompletas: estado.calificacionesCompletas === true,
    calificacionesRequeridas: aEnteroNoNegativo(
      estado.calificacionesRequeridas
    ),
    calificacionesRealizadas: aEnteroNoNegativo(
      estado.calificacionesRealizadas
    ),
    calificacionesPendientes: aEnteroNoNegativo(
      estado.calificacionesPendientes
    ),
    miembrosACalificar: normalizarMiembrosACalificar(
      estado.miembrosACalificar
    ),
    calificacionesEmitidas: normalizarCalificacionesEmitidas(
      estado.calificacionesEmitidas
    ),
  };
}

/**
 * `faltantes` es `number[]` con idPerfil. Se toleran objetos por si el backend
 * agrega datos en el futuro, pero solo se conservan ids válidos y únicos.
 * @param {unknown} lista
 * @returns {number[]}
 */
export function normalizarFaltantes(lista) {
  if (!Array.isArray(lista)) return [];

  const ids = lista
    .map((item) => {
      if (item && typeof item === "object") {
        return aEnteroPositivo(item.idPerfil ?? item.id);
      }
      return aEnteroPositivo(item);
    })
    .filter((id) => id != null);

  return [...new Set(ids)];
}

/**
 * Mapa idPerfil → nombreProfesion a partir de GET /proyectos/{id}/miembros.
 * Acepta el array o la respuesta paginada (`{ contenido }`).
 * @param {unknown} miembros
 * @returns {Record<number, string>}
 */
export function indexarProfesionesPorPerfil(miembros) {
  const lista = Array.isArray(miembros)
    ? miembros
    : Array.isArray(miembros?.contenido)
      ? miembros.contenido
      : [];

  const mapa = {};
  for (const miembro of lista) {
    const idPerfil = aEnteroPositivo(miembro?.idPerfil);
    if (idPerfil == null) continue;
    mapa[idPerfil] =
      miembro?.nombreProfesion == null ? "" : String(miembro.nombreProfesion);
  }
  return mapa;
}

/**
 * Ordena las calificaciones emitidas para mostrarlas de forma estable:
 * fechaRegistro descendente y, si empatan, idCalificacion descendente.
 * No muta el array original.
 * @param {CalificacionEmitida[]} lista
 * @returns {CalificacionEmitida[]}
 */
export function ordenarCalificacionesEmitidas(lista) {
  const calificaciones = Array.isArray(lista) ? lista.filter(Boolean) : [];

  return [...calificaciones].sort((a, b) => {
    const fechaA = aFechaMs(a.fechaRegistro);
    const fechaB = aFechaMs(b.fechaRegistro);
    if (fechaA !== fechaB) return fechaB - fechaA;
    return (Number(b.idCalificacion) || 0) - (Number(a.idCalificacion) || 0);
  });
}

/**
 * Mapa idPerfilReceptor → calificación emitida. La constraint de unicidad
 * impide duplicados por proyecto/emisor/receptor.
 * @param {CalificacionEmitida[]} lista
 * @returns {Record<number, CalificacionEmitida>}
 */
export function mapaCalificacionesEmitidasPorReceptor(lista) {
  const mapa = {};
  for (const calificacion of Array.isArray(lista) ? lista : []) {
    const idPerfilReceptor = aEnteroPositivo(
      calificacion?.idPerfilReceptor
    );
    if (idPerfilReceptor == null) continue;
    mapa[idPerfilReceptor] = calificacion;
  }
  return mapa;
}

/**
 * @param {unknown} valoracion
 * @returns {boolean}
 */
export function esValoracionValida(valoracion) {
  const numero = Number(valoracion);
  return (
    Number.isInteger(numero) &&
    numero >= VALORACION_MIN &&
    numero <= VALORACION_MAX
  );
}

/**
 * @param {unknown} resenia
 * @returns {boolean}
 */
export function esReseniaValida(resenia) {
  const texto = String(resenia ?? "").trim();
  return texto.length > 0 && texto.length <= LIMITE_RESENIA;
}

/**
 * Etiqueta visible de una valoración. 0 o inválida → "Sin calificar".
 * @param {unknown} valoracion
 * @returns {string}
 */
export function etiquetaValoracion(valoracion) {
  return ETIQUETAS_VALORACION[Number(valoracion)] || "Sin calificar";
}

/**
 * @typedef {Object} CalificacionFormulario
 * @property {number} valoracion
 * @property {string} resenia
 */

/**
 * @typedef {Object} ErrorCalificacionFormulario
 * @property {string} valoracion
 * @property {string} resenia
 */

/**
 * @typedef {Object} ResultadoValidacionCalificaciones
 * @property {boolean} valido
 * @property {Record<number, ErrorCalificacionFormulario>} errores
 * @property {number[]} idsPendientes integrantes con valoración o reseña inválida
 * @property {import("../services/proyectoService.js").CalificacionRequest[]} calificaciones
 */

/**
 * @param {CalificacionFormulario|undefined} entrada
 * @returns {ErrorCalificacionFormulario}
 */
function erroresDeEntrada(entrada) {
  const valoracion = Number(entrada?.valoracion);
  const resenia = String(entrada?.resenia ?? "").trim();
  const errores = { valoracion: "", resenia: "" };

  if (!esValoracionValida(valoracion)) {
    errores.valoracion = MENSAJES_VALIDACION_CALIFICACION.VALORACION;
  }

  if (!resenia) {
    errores.resenia = MENSAJES_VALIDACION_CALIFICACION.RESENIA_OBLIGATORIA;
  } else if (resenia.length > LIMITE_RESENIA) {
    errores.resenia = MENSAJES_VALIDACION_CALIFICACION.RESENIA_LARGA;
  }

  return errores;
}

/**
 * Valida el formulario local contra `miembrosACalificar[]`. No reemplaza al
 * backend: si un integrante ya está calificado (`yaCalificado === true`) no se
 * exige una entrada nueva.
 * @param {MiembroACalificar[]} miembros
 * @param {Record<number|string, CalificacionFormulario>} formulario
 * @returns {ResultadoValidacionCalificaciones}
 */
export function validarCalificaciones(miembros, formulario) {
  const lista = normalizarMiembrosACalificar(miembros);
  const entradas =
    formulario && typeof formulario === "object" ? formulario : {};

  const errores = {};
  const idsPendientes = [];
  const calificaciones = [];
  let valido = true;

  for (const miembro of lista) {
    if (miembro.yaCalificado === true) continue;

    const entrada = entradas[miembro.idPerfil];
    const error = erroresDeEntrada(entrada);

    if (error.valoracion || error.resenia) {
      errores[miembro.idPerfil] = error;
      idsPendientes.push(miembro.idPerfil);
      valido = false;
      continue;
    }

    calificaciones.push({
      idPerfil: miembro.idPerfil,
      valoracion: Number(entrada.valoracion),
      resenia: String(entrada.resenia).trim(),
    });
  }

  return { valido, errores, idsPendientes, calificaciones };
}

/**
 * Construye el payload de `{ calificaciones }` con las entradas válidas.
 * Llamar antes a `validarCalificaciones` y no enviar si `valido === false`.
 * @param {MiembroACalificar[]} miembros
 * @param {Record<number|string, CalificacionFormulario>} formulario
 * @returns {import("../services/proyectoService.js").CalificacionRequest[]}
 */
export function construirCalificacionesPayload(miembros, formulario) {
  return validarCalificaciones(miembros, formulario).calificaciones;
}

/**
 * Cuenta integrantes completos para la barra de progreso local. Un integrante
 * con `yaCalificado === true` ya cuenta como completo.
 * @param {MiembroACalificar[]} miembros
 * @param {Record<number|string, CalificacionFormulario>} formulario
 * @returns {number}
 */
export function contarCalificacionesCompletas(miembros, formulario) {
  const lista = normalizarMiembrosACalificar(miembros);
  const entradas =
    formulario && typeof formulario === "object" ? formulario : {};

  return lista.filter(
    (miembro) =>
      miembro.yaCalificado === true ||
      esCalificacionValida(entradas[miembro.idPerfil])
  ).length;
}

/**
 * @param {CalificacionFormulario|undefined} entrada
 * @returns {boolean}
 */
export function esCalificacionValida(entrada) {
  return (
    esValoracionValida(entrada?.valoracion) &&
    esReseniaValida(entrada?.resenia)
  );
}

/**
 * @param {string|null|undefined} codigo
 * @returns {string}
 */
export function mensajeCodigoFinalizacion(codigo) {
  if (!codigo) return "";
  return MENSAJES_CODIGO_FINALIZACION[codigo] || "";
}

/**
 * Códigos que indican que el proyecto cambió de estado y ya no tiene sentido
 * mantener el diálogo abierto. El resto de los 409 son bloqueos corregibles.
 * @param {string|null|undefined} codigo
 * @returns {boolean}
 */
export function esBloqueoDeEstadoFinalizacion(codigo) {
  return [
    CODIGOS_FINALIZACION.PROYECTO_YA_FINALIZADO,
    CODIGOS_FINALIZACION.ESTADO_PROYECTO_INVALIDO,
  ].includes(codigo);
}

/**
 * @param {string|null|undefined} codigo
 * @returns {boolean}
 */
export function esProyectoNoCalificable(codigo) {
  return codigo === CODIGOS_FINALIZACION.PROYECTO_NO_CALIFICABLE;
}

/**
 * @typedef {Object} ErrorFinalizacionClasificado
 * @property {number|undefined} status
 * @property {string} codigo
 * @property {string} mensaje
 * @property {BloqueoFinalizacion[]} bloqueos
 * @property {number[]} faltantes ids de perfil
 * @property {boolean} esEstado el proyecto cambió de estado
 * @property {boolean} esCalificacionesIncompletas
 * @property {boolean} esCalificacionInvalida
 */

/**
 * Clasifica un error de UC-37. Los errores de finalización usan `bloqueos[]`;
 * `CALIFICACIONES_INCOMPLETAS` usa `faltantes[]` con ids de perfil.
 * @param {object} error error Axios
 * @returns {ErrorFinalizacionClasificado}
 */
export function clasificarErrorFinalizacion(error) {
  const data = error?.response?.data;
  const codigo = data?.codigo ? String(data.codigo) : "";

  return {
    status: error?.response?.status,
    codigo,
    mensaje:
      data?.message || data?.mensaje || mensajeCodigoFinalizacion(codigo),
    bloqueos: normalizarBloqueos(data?.bloqueos),
    faltantes: normalizarFaltantes(data?.faltantes),
    esEstado:
      esBloqueoDeEstadoFinalizacion(codigo) || esProyectoNoCalificable(codigo),
    esCalificacionesIncompletas:
      codigo === CODIGOS_FINALIZACION.CALIFICACIONES_INCOMPLETAS,
    esCalificacionInvalida:
      codigo === CODIGOS_FINALIZACION.CALIFICACION_INVALIDA,
  };
}
