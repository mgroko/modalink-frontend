import {
  ETIQUETAS_TIPO_INVITACION,
  TIPOS_INVITACION,
} from "./invitacionConstants.js";
import {
  esCuentaNoActiva,
  esSesionExpirada,
  mensajeErrorApi,
} from "./apiError.js";

/*
 * Reglas y textos de UC-30 (buscar invitaciones).
 * El backend es la fuente de verdad para el alcance y los filtros.
 */

export const TAMANO_PAGINA_INVITACIONES = 20;

export const DIRECCIONES_INVITACION = {
  TODAS: "",
  RECIBIDA: "RECIBIDA",
  ENVIADA: "ENVIADA",
};

export const ESTADOS_INVITACION = {
  PENDIENTE: "PENDIENTE",
  ACEPTADA: "ACEPTADA",
  RECHAZADA: "RECHAZADA",
};

export const ORDEN_FECHA_INVITACION = {
  DESC: "desc",
  ASC: "asc",
};

export const ETIQUETAS_DIRECCION = {
  [DIRECCIONES_INVITACION.RECIBIDA]: "Recibida",
  [DIRECCIONES_INVITACION.ENVIADA]: "Enviada",
};

export const ETIQUETAS_ESTADO_INVITACION = {
  [ESTADOS_INVITACION.PENDIENTE]: "Pendiente",
  [ESTADOS_INVITACION.ACEPTADA]: "Aceptada",
  [ESTADOS_INVITACION.RECHAZADA]: "Rechazada",
};

export const COLORES_ESTADO_INVITACION = {
  [ESTADOS_INVITACION.PENDIENTE]: {
    fondo: "var(--color-warning-soft)",
    texto: "var(--color-warning-text)",
    borde: "var(--color-warning-border)",
  },
  [ESTADOS_INVITACION.ACEPTADA]: {
    fondo: "var(--color-success-soft)",
    texto: "var(--color-success-text)",
    borde: "var(--color-success-border)",
  },
  [ESTADOS_INVITACION.RECHAZADA]: {
    fondo: "var(--color-danger-soft)",
    texto: "var(--color-danger-text)",
    borde: "var(--color-danger-border)",
  },
};

export const ETIQUETAS_TIPO_INVITACION_BUSQUEDA = ETIQUETAS_TIPO_INVITACION;

export const TIPOS_INVITACION_BUSQUEDA = TIPOS_INVITACION;

/**
 * @param {string|null|undefined} estado
 * @returns {string}
 */
export function normalizarEstadoInvitacion(estado) {
  return String(estado || "").trim().toUpperCase();
}

/**
 * @param {string|null|undefined} estado
 * @returns {string}
 */
export function etiquetaEstadoInvitacion(estado) {
  return (
    ETIQUETAS_ESTADO_INVITACION[normalizarEstadoInvitacion(estado)] ||
    String(estado || "")
  );
}

/**
 * @param {string|null|undefined} estado
 * @returns {{fondo:string,texto:string,borde:string}}
 */
export function coloresEstadoInvitacion(estado) {
  return (
    COLORES_ESTADO_INVITACION[normalizarEstadoInvitacion(estado)] ||
    COLORES_ESTADO_INVITACION[ESTADOS_INVITACION.PENDIENTE]
  );
}

/**
 * @param {string|null|undefined} tipo
 * @returns {string}
 */
export function etiquetaTipoInvitacion(tipo) {
  const clave = String(tipo || "").toUpperCase();
  return ETIQUETAS_TIPO_INVITACION_BUSQUEDA[clave] || String(tipo || "");
}

function normalizarPerfil(perfil) {
  const dato = perfil && typeof perfil === "object" ? perfil : {};
  return {
    idPerfil: dato.idPerfil ?? null,
    nombreArtistico: String(dato.nombreArtistico || "").trim(),
    nombre: dato.nombre != null ? String(dato.nombre).trim() : null,
    apellido: dato.apellido != null ? String(dato.apellido).trim() : null,
    idProfesion: dato.idProfesion ?? null,
    nombreProfesion: dato.nombreProfesion
      ? String(dato.nombreProfesion).trim()
      : null,
    fotoUrl: dato.fotoUrl ?? null,
  };
}

/**
 * Normaliza `InvitacionBusquedaResponse`.
 * @param {object|null|undefined} item
 * @returns {object}
 */
export function normalizarInvitacionBusqueda(item) {
  const dato = item && typeof item === "object" ? item : {};
  return {
    idInvitacion: dato.idInvitacion ?? null,
    tipo: String(dato.tipo || "").toUpperCase(),
    direccion: String(dato.direccion || "").toUpperCase(),
    estado: normalizarEstadoInvitacion(dato.estado),
    fechaEnvio: dato.fechaEnvio ?? null,
    idProyecto: dato.idProyecto ?? null,
    nombreProyecto: String(dato.nombreProyecto || "").trim(),
    idRequerimientoGral: dato.idRequerimientoGral ?? null,
    idRequerimientoActividad: dato.idRequerimientoActividad ?? null,
    idActividad: dato.idActividad ?? null,
    nombreActividad: dato.nombreActividad
      ? String(dato.nombreActividad).trim()
      : null,
    remitente: normalizarPerfil(dato.remitente),
    destinatario: normalizarPerfil(dato.destinatario),
    mensaje: dato.mensaje != null ? String(dato.mensaje).trim() : null,
    puedeEliminar: dato.puedeEliminar === true,
  };
}

/**
 * @param {object|null|undefined} perfil
 * @returns {string}
 */
export function nombreCompletoPerfil(perfil) {
  if (!perfil) return "";
  return [perfil.nombre, perfil.apellido].filter(Boolean).join(" ");
}

/**
 * Contraparte visible según la dirección. Para "Todas" se usa el perfil que
 * no es el activo.
 * @param {object|null|undefined} invitacion
 * @param {number|string|null|undefined} idPerfilActivo
 * @returns {object|null}
 */
export function contraparteInvitacion(invitacion, idPerfilActivo) {
  if (!invitacion) return null;
  if (invitacion.direccion === DIRECCIONES_INVITACION.RECIBIDA) {
    return invitacion.remitente;
  }
  if (invitacion.direccion === DIRECCIONES_INVITACION.ENVIADA) {
    return invitacion.destinatario;
  }
  if (
    idPerfilActivo != null &&
    String(invitacion.remitente?.idPerfil) === String(idPerfilActivo)
  ) {
    return invitacion.destinatario;
  }
  return invitacion.remitente;
}

/**
 * @param {string|null|undefined} desde
 * @param {string|null|undefined} hasta
 * @returns {string}
 */
export function validarRangoFechasInvitaciones(desde, hasta) {
  if (!desde || !hasta) return "";
  if (String(desde) > String(hasta)) {
    return "La fecha desde no puede ser posterior a la fecha hasta.";
  }
  return "";
}

/**
 * @param {object} filtros
 * @param {{pagina?:number,tamano?:number,todos?:boolean}} [opciones]
 * @returns {Record<string, unknown>}
 */
export function construirParamsInvitaciones(filtros = {}, opciones = {}) {
  const params = {};

  if (filtros.idProyecto != null && filtros.idProyecto !== "") {
    params.idProyecto = filtros.idProyecto;
  }

  const nombreProyecto = String(filtros.nombreProyecto || "").trim();
  if (nombreProyecto) params.nombreProyecto = nombreProyecto;

  if (filtros.fechaDesde) params.fechaDesde = filtros.fechaDesde;
  if (filtros.fechaHasta) params.fechaHasta = filtros.fechaHasta;

  const nombrePerfil = String(filtros.nombrePerfil || "").trim();
  if (nombrePerfil) params.nombrePerfil = nombrePerfil;

  if (filtros.direccion) params.direccion = filtros.direccion;
  if (filtros.estado) params.estado = filtros.estado;
  if (filtros.tipo) params.tipo = filtros.tipo;

  if (opciones.todos === true) {
    params.todos = true;
    return params;
  }

  const tamano = Number(opciones.tamano) || TAMANO_PAGINA_INVITACIONES;
  params.page = Math.max(0, Number(opciones.pagina) || 0);
  params.size = tamano;
  return params;
}

/**
 * @param {Array<object>} lista
 * @param {"asc"|"desc"} orden
 * @returns {Array<object>}
 */
export function ordenarInvitacionesPorFecha(lista, orden = ORDEN_FECHA_INVITACION.DESC) {
  const factor = orden === ORDEN_FECHA_INVITACION.ASC ? 1 : -1;
  return [...(Array.isArray(lista) ? lista : [])].sort((a, b) => {
    const fechaA = a?.fechaEnvio ? Date.parse(a.fechaEnvio) : null;
    const fechaB = b?.fechaEnvio ? Date.parse(b.fechaEnvio) : null;

    if (fechaA == null && fechaB == null) return 0;
    if (fechaA == null) return 1;
    if (fechaB == null) return -1;
    if (fechaA === fechaB) {
      return (
        (Number(a?.idInvitacion) || 0) - (Number(b?.idInvitacion) || 0)
      ) * factor;
    }
    return (fechaA - fechaB) * factor;
  });
}

export const TIPOS_ERROR_INVITACIONES = {
  SESION: "SESION",
  CUENTA: "CUENTA",
  PERFIL_ACTIVO: "PERFIL_ACTIVO",
  FECHAS: "FECHAS",
  PERMISO: "PERMISO",
  NO_ENCONTRADO: "NO_ENCONTRADO",
  DESCONOCIDO: "DESCONOCIDO",
};

export const ACCIONES_GESTION_INVITACION = {
  ACEPTAR: "ACEPTAR",
  RECHAZAR: "RECHAZAR",
};

export const CODIGO_INVITACION_NO_PENDIENTE = "INVITACION_NO_PENDIENTE";

export const TIPOS_ERROR_GESTION_INVITACION = {
  SESION: "SESION",
  CUENTA: "CUENTA",
  PERFIL_ACTIVO: "PERFIL_ACTIVO",
  NO_ENCONTRADA: "NO_ENCONTRADA",
  SIN_PERMISO: "SIN_PERMISO",
  NO_PENDIENTE: "NO_PENDIENTE",
  SIN_DISPONIBILIDAD: "SIN_DISPONIBILIDAD",
  CUPO: "CUPO",
  PROFESION: "PROFESION",
  PROYECTO_ESTADO: "PROYECTO_ESTADO",
  ACTIVIDAD_INVALIDA: "ACTIVIDAD_INVALIDA",
  YA_MIEMBRO: "YA_MIEMBRO",
  YA_ASIGNADO: "YA_ASIGNADO",
  DIRECTOR: "DIRECTOR",
  CONFLICTO: "CONFLICTO",
  DESCONOCIDO: "DESCONOCIDO",
};

const CODIGOS_DISPONIBILIDAD_INVITACION = [
  "SIN_MIEMBROS",
  "SIN_JORNADA",
  "DURACION_EXCEDE_VENTANA",
  "SIN_HUECO",
  "SIN_HUECO_COMUN",
  "FUERA_TOLERANCIA_PREFERENCIA",
  "SIN_DISPONIBILIDAD",
  "CONFLICTO_FIJO",
  "DATOS_INCONSISTENTES",
  "CRONOGRAMA_NO_VIABLE",
  "FECHA_ENTREGA_INVALIDA",
  "ACTIVIDAD_NO_REPROGRAMABLE",
];

export const TIPOS_ERROR_ELIMINAR_INVITACION = {
  SESION: "SESION",
  CUENTA: "CUENTA",
  PERFIL_ACTIVO: "PERFIL_ACTIVO",
  NO_ENCONTRADA: "NO_ENCONTRADA",
  SIN_PERMISO: "SIN_PERMISO",
  NO_PENDIENTE: "NO_PENDIENTE",
  CONFLICTO: "CONFLICTO",
  DESCONOCIDO: "DESCONOCIDO",
};

/**
 * @param {object} error error Axios
 * @returns {{tipo:string,status:number|null,mensaje:string}}
 */
/**
 * Clasifica el error de aceptar/rechazar una invitación (UC-28).
 * El backend puede devolver la causa de disponibilidad en `codigo` o
 * `codigoMotivo`, según el handler que origine el 409.
 * @param {object} error error Axios
 * @returns {{tipo:string,status:number|null,codigo:string,
 *   codigoMotivo:string|null,mensaje:string}}
 */
export function clasificarErrorGestionInvitacion(error) {
  const status = error?.response?.status ?? null;
  const data = error?.response?.data;
  const payload = data && typeof data === "object" ? data : {};
  const mensaje =
    typeof payload.message === "string" ? payload.message.trim() : "";
  const codigo = String(payload.codigo || "").toUpperCase();
  const codigoMotivo = payload.codigoMotivo
    ? String(payload.codigoMotivo).toUpperCase()
    : CODIGOS_DISPONIBILIDAD_INVITACION.includes(codigo)
      ? codigo
      : null;

  const crear = (tipo, texto) => ({
    tipo,
    status,
    codigo,
    codigoMotivo,
    mensaje: texto || "No se pudo gestionar la invitación.",
  });

  if (esSesionExpirada(error)) {
    return crear(
      TIPOS_ERROR_GESTION_INVITACION.SESION,
      "Tu sesión expiró. Volvé a iniciar sesión."
    );
  }

  if (esCuentaNoActiva(error)) {
    return crear(
      TIPOS_ERROR_GESTION_INVITACION.CUENTA,
      mensaje || "Tu cuenta no se encuentra activa."
    );
  }

  if (status === 403) {
    return crear(
      TIPOS_ERROR_GESTION_INVITACION.SIN_PERMISO,
      mensaje || "La invitación no pertenece al perfil activo."
    );
  }

  if (status === 404) {
    if (/perfil\s*activo|no hay un perfil activo/i.test(mensaje)) {
      return crear(
        TIPOS_ERROR_GESTION_INVITACION.PERFIL_ACTIVO,
        mensaje || "No hay un perfil activo seleccionado."
      );
    }
    return crear(
      TIPOS_ERROR_GESTION_INVITACION.NO_ENCONTRADA,
      mensaje || "La invitación ya no existe."
    );
  }

  if (status === 409) {
    if (
      codigo === CODIGO_INVITACION_NO_PENDIENTE ||
      /s[oó]lo se pueden (?:aceptar|rechazar) invitaciones pendientes|ya (?:fue|est[aá]) (?:aceptada|rechazada|gestionada)/i.test(
        mensaje
      )
    ) {
      return crear(
        TIPOS_ERROR_GESTION_INVITACION.NO_PENDIENTE,
        mensaje || "La invitación ya no está pendiente."
      );
    }

    if (
      (codigo && CODIGOS_DISPONIBILIDAD_INVITACION.includes(codigo)) ||
      (codigoMotivo &&
        CODIGOS_DISPONIBILIDAD_INVITACION.includes(codigoMotivo)) ||
      /disponibilidad suficiente|sin disponibilidad|sin hueco|hueco com[uú]n|tolerancia|reprogramar/i.test(
        mensaje
      )
    ) {
      return crear(
        TIPOS_ERROR_GESTION_INVITACION.SIN_DISPONIBILIDAD,
        mensaje || "No hay disponibilidad suficiente para la actividad."
      );
    }

    if (/satisfecho|cupo/i.test(mensaje)) {
      return crear(
        TIPOS_ERROR_GESTION_INVITACION.CUPO,
        mensaje || "El cupo del requerimiento ya fue cubierto."
      );
    }

    if (/profesi[oó]n/i.test(mensaje)) {
      return crear(
        TIPOS_ERROR_GESTION_INVITACION.PROFESION,
        mensaje || "La profesión del perfil no coincide con la requerida."
      );
    }

    if (/ya es miembro|miembro activo/i.test(mensaje)) {
      return crear(
        TIPOS_ERROR_GESTION_INVITACION.YA_MIEMBRO,
        mensaje || "El perfil ya es miembro activo del proyecto."
      );
    }

    if (/ya está asignado|ya existe una asignación|duplicad/i.test(mensaje)) {
      return crear(
        TIPOS_ERROR_GESTION_INVITACION.YA_ASIGNADO,
        mensaje || "El perfil ya está asignado a esta actividad."
      );
    }

    if (/director no puede/i.test(mensaje)) {
      return crear(
        TIPOS_ERROR_GESTION_INVITACION.DIRECTOR,
        mensaje || "Un director no puede aceptar esta invitación."
      );
    }

    if (/proyecto.*(estado|cancel|finaliz|no permite)/i.test(mensaje)) {
      return crear(
        TIPOS_ERROR_GESTION_INVITACION.PROYECTO_ESTADO,
        mensaje || "El proyecto ya no admite esta invitación."
      );
    }

    if (/actividad.*(pendiente|en curso|estado|inv[aá]lid)/i.test(mensaje)) {
      return crear(
        TIPOS_ERROR_GESTION_INVITACION.ACTIVIDAD_INVALIDA,
        mensaje || "La actividad ya no admite esta invitación."
      );
    }

    return crear(
      TIPOS_ERROR_GESTION_INVITACION.CONFLICTO,
      mensaje || "No se pudo gestionar la invitación."
    );
  }

  if (!status || status >= 500) {
    return crear(
      TIPOS_ERROR_GESTION_INVITACION.DESCONOCIDO,
      "Ocurrió un error al gestionar la invitación. Inténtalo nuevamente."
    );
  }

  return crear(
    TIPOS_ERROR_GESTION_INVITACION.DESCONOCIDO,
    mensajeErrorApi(error, "No se pudo gestionar la invitación.")
  );
}

/**
 * Clasifica el error del DELETE de UC-32.
 * @param {object} error error Axios
 * @returns {{tipo:string,status:number|null,codigo:string,mensaje:string}}
 */
export function clasificarErrorEliminarInvitacion(error) {
  const status = error?.response?.status ?? null;
  const data = error?.response?.data;
  const payload = data && typeof data === "object" ? data : {};
  const mensaje =
    typeof payload.message === "string" ? payload.message.trim() : "";
  const codigo = String(payload.codigo || "").toUpperCase();

  const crear = (tipo, texto) => ({
    tipo,
    status,
    codigo,
    mensaje: texto || "No se pudo eliminar la invitación.",
  });

  if (esSesionExpirada(error)) {
    return crear(
      TIPOS_ERROR_ELIMINAR_INVITACION.SESION,
      "Tu sesión expiró. Volvé a iniciar sesión."
    );
  }

  if (esCuentaNoActiva(error)) {
    return crear(
      TIPOS_ERROR_ELIMINAR_INVITACION.CUENTA,
      mensaje || "Tu cuenta no se encuentra activa."
    );
  }

  if (status === 403) {
    return crear(
      TIPOS_ERROR_ELIMINAR_INVITACION.SIN_PERMISO,
      mensaje || "No tenés permiso para eliminar esta invitación."
    );
  }

  if (status === 404) {
    if (/perfil\s*activo|no hay un perfil activo/i.test(mensaje)) {
      return crear(
        TIPOS_ERROR_ELIMINAR_INVITACION.PERFIL_ACTIVO,
        mensaje || "No hay un perfil activo seleccionado."
      );
    }
    return crear(
      TIPOS_ERROR_ELIMINAR_INVITACION.NO_ENCONTRADA,
      mensaje || "La invitación ya no existe."
    );
  }

  if (status === 409) {
    if (
      codigo === CODIGO_INVITACION_NO_PENDIENTE ||
      /pendiente/i.test(mensaje)
    ) {
      return crear(
        TIPOS_ERROR_ELIMINAR_INVITACION.NO_PENDIENTE,
        mensaje || "La invitación ya no está pendiente."
      );
    }
    return crear(
      TIPOS_ERROR_ELIMINAR_INVITACION.CONFLICTO,
      mensaje || "No se pudo eliminar la invitación."
    );
  }

  if (!status || status >= 500) {
    return crear(
      TIPOS_ERROR_ELIMINAR_INVITACION.DESCONOCIDO,
      "Ocurrió un error al eliminar la invitación. Inténtalo nuevamente."
    );
  }

  return crear(
    TIPOS_ERROR_ELIMINAR_INVITACION.DESCONOCIDO,
    mensajeErrorApi(error, "No se pudo eliminar la invitación.")
  );
}

export function clasificarErrorInvitaciones(error) {
  const status = error?.response?.status ?? null;
  const mensaje = error?.response?.data?.message || "";

  if (error?._esSesionExpirada || status === 401) {
    return {
      tipo: TIPOS_ERROR_INVITACIONES.SESION,
      status,
      mensaje: "Tu sesión expiró. Volvé a iniciar sesión.",
    };
  }

  if (error?._esCuentaNoActiva) {
    return {
      tipo: TIPOS_ERROR_INVITACIONES.CUENTA,
      status,
      mensaje: mensaje || "Tu cuenta no se encuentra activa.",
    };
  }

  if (status === 404 && /perfil/i.test(mensaje)) {
    return {
      tipo: TIPOS_ERROR_INVITACIONES.PERFIL_ACTIVO,
      status,
      mensaje: mensaje || "No hay un perfil activo seleccionado.",
    };
  }

  if (status === 400) {
    return {
      tipo: TIPOS_ERROR_INVITACIONES.FECHAS,
      status,
      mensaje:
        mensaje ||
        "La fecha desde no puede ser posterior a la fecha hasta.",
    };
  }

  if (status === 403) {
    return {
      tipo: TIPOS_ERROR_INVITACIONES.PERMISO,
      status,
      mensaje: mensaje || "No tenés permiso para consultar invitaciones.",
    };
  }

  if (status === 404) {
    return {
      tipo: TIPOS_ERROR_INVITACIONES.NO_ENCONTRADO,
      status,
      mensaje: mensaje || "No se encontraron las invitaciones.",
    };
  }

  return {
    tipo: TIPOS_ERROR_INVITACIONES.DESCONOCIDO,
    status,
    mensaje: mensajeErrorApi(
      error,
      "Ocurrió un error al cargar las invitaciones. Inténtalo nuevamente."
    ),
  };
}
