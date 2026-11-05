import {
  ESTADOS_ACTIVIDAD,
  normalizarEstadoActividad,
} from "./actividadConstants.js";
import {
  ESTADOS_PROYECTO,
  ROLES_PROYECTO,
  normalizarEstadoProyecto,
} from "./proyectoConstants.js";
import {
  esCuentaNoActiva,
  esSesionExpirada,
  mensajeErrorApi,
} from "./apiError.js";

/*
 * Reglas y textos de UC-31 (invitar a proyecto).
 * El backend es la fuente de verdad: acá sólo se decide visibilidad,
 * normalización y mensajes para el flujo de invitación.
 */

export const PERMISO_INVITAR_MIEMBRO = "INVITAR_MIEMBRO";

export const TIPOS_INVITACION = {
  GENERAL: "GENERAL",
  ACTIVIDAD: "ACTIVIDAD",
};

export const ETIQUETAS_TIPO_INVITACION = {
  [TIPOS_INVITACION.GENERAL]: "General",
  [TIPOS_INVITACION.ACTIVIDAD]: "Por actividad",
};

export const ESTADOS_PROYECTO_INVITABLES = [
  ESTADOS_PROYECTO.PUBLICADO,
  ESTADOS_PROYECTO.CONFIRMADO,
];

export const ESTADOS_ACTIVIDAD_INVITABLES = [
  ESTADOS_ACTIVIDAD.PENDIENTE,
  ESTADOS_ACTIVIDAD.EN_CURSO,
];

export const LIMITE_MENSAJE_INVITACION = 200;

export const CODIGO_INVITACION_DUPLICADA = "INVITACION_DUPLICADA";

export const TIPOS_ERROR_INVITACION = {
  SESION: "SESION",
  CUENTA: "CUENTA",
  VALIDACION: "VALIDACION",
  PERMISO: "PERMISO",
  PERFIL_ACTIVO: "PERFIL_ACTIVO",
  PROYECTO_NO_ENCONTRADO: "PROYECTO_NO_ENCONTRADO",
  PERFIL_NO_ENCONTRADO: "PERFIL_NO_ENCONTRADO",
  REQUERIMIENTO_NO_ENCONTRADO: "REQUERIMIENTO_NO_ENCONTRADO",
  PROYECTO_ESTADO: "PROYECTO_ESTADO",
  PERFIL_INACTIVO: "PERFIL_INACTIVO",
  AUTOINVITACION: "AUTOINVITACION",
  YA_ES_MIEMBRO: "YA_ES_MIEMBRO",
  DUPLICADA: "DUPLICADA",
  PROFESION_INCOMPATIBLE: "PROFESION_INCOMPATIBLE",
  ACTIVIDAD_INVALIDA: "ACTIVIDAD_INVALIDA",
  CONFLICTO: "CONFLICTO",
  DESCONOCIDO: "DESCONOCIDO",
};

/**
 * ¿El proyecto permite invitar con el contexto actual?
 * @param {object|null|undefined} proyecto ProyectoResponse
 * @returns {boolean}
 */
export function puedeInvitarProyecto(proyecto) {
  if (!proyecto) return false;
  if (String(proyecto.rolUsuario || "").toUpperCase() !== ROLES_PROYECTO.DIRECTOR) {
    return false;
  }

  const permisos = Array.isArray(proyecto.permisos) ? proyecto.permisos : [];
  if (!permisos.includes(PERMISO_INVITAR_MIEMBRO)) return false;

  return ESTADOS_PROYECTO_INVITABLES.includes(
    normalizarEstadoProyecto(proyecto.estado)
  );
}

/**
 * Motivo por el que no se puede invitar. Vacío si está habilitado.
 * @param {object|null|undefined} proyecto
 * @returns {string}
 */
export function motivoNoInvitable(proyecto) {
  if (!proyecto) return "No se pudo cargar el proyecto.";
  if (String(proyecto.rolUsuario || "").toUpperCase() !== ROLES_PROYECTO.DIRECTOR) {
    return "Sólo el director activo del proyecto puede invitar miembros.";
  }

  const permisos = Array.isArray(proyecto.permisos) ? proyecto.permisos : [];
  if (!permisos.includes(PERMISO_INVITAR_MIEMBRO)) {
    return "No tenés permiso para invitar miembros a este proyecto.";
  }

  const estado = normalizarEstadoProyecto(proyecto.estado);
  if (!ESTADOS_PROYECTO_INVITABLES.includes(estado)) {
    return `El proyecto está ${estado.toLowerCase()} y no admite invitaciones.`;
  }

  return "";
}

/**
 * ¿El requerimiento pertenece a una actividad que admite invitaciones?
 * Si el backend no envía `estadoActividad`, no se descarta para no ocultar
 * datos válidos por una respuesta antigua.
 * @param {object|null|undefined} requerimiento
 * @returns {boolean}
 */
export function requerimientoAdmiteInvitacion(requerimiento) {
  if (!requerimiento || requerimiento.idRequerimiento == null) return false;
  const estado = normalizarEstadoActividad(requerimiento.estadoActividad);
  if (!estado) return true;
  return ESTADOS_ACTIVIDAD_INVITABLES.includes(estado);
}

/**
 * Normaliza un item de `GET .../requerimientos-actividad/buscar`.
 * @param {object|null|undefined} item
 * @returns {{
 *   idRequerimiento: number|null,
 *   cantidad: number|null,
 *   descripcion: string|null,
 *   idProfesion: number|null,
 *   nombreProfesion: string|null,
 *   idActividad: number|null,
 *   nombreActividad: string|null,
 *   estadoActividad: string|null,
 *   idProyecto: number|null,
 *   nombreProyecto: string|null,
 *   caracteristicas: Array<object|string>,
 *   habilidades: Array<object|string>
 * }}
 */
export function normalizarRequerimientoActividad(item) {
  const dato = item && typeof item === "object" ? item : {};
  const cantidad = Number(dato.cantidad);

  return {
    idRequerimiento: dato.idRequerimiento ?? null,
    cantidad: Number.isFinite(cantidad) ? cantidad : null,
    descripcion: String(dato.descripcion || "").trim() || null,
    idProfesion: dato.idProfesion ?? null,
    nombreProfesion: String(dato.nombreProfesion || "").trim() || null,
    idActividad: dato.idActividad ?? null,
    nombreActividad: String(dato.nombreActividad || "").trim() || null,
    estadoActividad: normalizarEstadoActividad(dato.estadoActividad) || null,
    idProyecto: dato.idProyecto ?? null,
    nombreProyecto: String(dato.nombreProyecto || "").trim() || null,
    caracteristicas: Array.isArray(dato.caracteristicas)
      ? dato.caracteristicas
      : [],
    habilidades: Array.isArray(dato.habilidades) ? dato.habilidades : [],
  };
}

/**
 * Clasifica el error de creación de invitación.
 * @param {object} error error Axios
 * @returns {{
 *   tipo: string,
 *   status: number|null,
 *   codigo: string,
 *   mensaje: string,
 *   campo: string,
 *   errores: Record<string, string>
 * }}
 */
export function clasificarErrorInvitacion(error) {
  const status = error?.response?.status ?? null;
  const data = error?.response?.data;
  const payload = data && typeof data === "object" ? data : {};
  const mensaje =
    typeof payload.message === "string" ? payload.message.trim() : "";
  const codigo = payload.codigo ? String(payload.codigo).toUpperCase() : "";
  const errores =
    payload.errores && typeof payload.errores === "object" ? payload.errores : {};

  const base = { status, codigo, errores };
  const crear = (tipo, texto, campo = "") => ({
    ...base,
    tipo,
    mensaje: texto || mensaje || "No se pudo enviar la invitación.",
    campo,
  });

  if (esSesionExpirada(error)) {
    return crear(
      TIPOS_ERROR_INVITACION.SESION,
      "Tu sesión expiró. Volvé a iniciar sesión."
    );
  }

  if (esCuentaNoActiva(error)) {
    return crear(
      TIPOS_ERROR_INVITACION.CUENTA,
      mensaje || "Tu cuenta no se encuentra activa."
    );
  }

  if (status === 400) {
    const primerCampo = Object.keys(errores)[0] || "";
    if (primerCampo) {
      const textoCampo =
        typeof errores[primerCampo] === "string" ? errores[primerCampo] : "";
      return crear(
        TIPOS_ERROR_INVITACION.VALIDACION,
        textoCampo || mensaje || "Revisá los datos de la invitación.",
        primerCampo
      );
    }

    if (/mensaje|caracteres|200/i.test(mensaje)) {
      return crear(
        TIPOS_ERROR_INVITACION.VALIDACION,
        mensaje || "El mensaje supera el límite permitido.",
        "mensaje"
      );
    }
    if (/idPerfil|perfil destinatario|destinatario/i.test(mensaje)) {
      return crear(
        TIPOS_ERROR_INVITACION.VALIDACION,
        mensaje || "Seleccioná un perfil destinatario.",
        "idPerfilDestinatario"
      );
    }
    if (/idRequerimiento|requerimiento/i.test(mensaje)) {
      return crear(
        TIPOS_ERROR_INVITACION.VALIDACION,
        mensaje || "Seleccioná un requerimiento de actividad.",
        "idRequerimientoActividad"
      );
    }
    return crear(
      TIPOS_ERROR_INVITACION.VALIDACION,
      mensaje || "Revisá los datos de la invitación."
    );
  }

  if (status === 403) {
    return crear(
      TIPOS_ERROR_INVITACION.PERMISO,
      mensaje || "No tenés permiso para invitar miembros a este proyecto."
    );
  }

  if (status === 404) {
    if (/perfil\s*activo|perfil activo no seleccionado|no hay un perfil activo/i.test(mensaje)) {
      return crear(
        TIPOS_ERROR_INVITACION.PERFIL_ACTIVO,
        mensaje || "No hay un perfil activo seleccionado."
      );
    }
    if (/requerimiento/i.test(mensaje)) {
      return crear(
        TIPOS_ERROR_INVITACION.REQUERIMIENTO_NO_ENCONTRADO,
        mensaje || "El requerimiento ya no está disponible."
      );
    }
    if (/proyecto/i.test(mensaje)) {
      return crear(
        TIPOS_ERROR_INVITACION.PROYECTO_NO_ENCONTRADO,
        mensaje || "El proyecto ya no está disponible."
      );
    }
    if (/perfil/i.test(mensaje)) {
      return crear(
        TIPOS_ERROR_INVITACION.PERFIL_NO_ENCONTRADO,
        mensaje || "El perfil destinatario ya no está disponible."
      );
    }
    return crear(
      TIPOS_ERROR_INVITACION.DESCONOCIDO,
      mensaje || "No se encontró un recurso necesario para la invitación."
    );
  }

  if (status === 409) {
    if (
      codigo === CODIGO_INVITACION_DUPLICADA ||
      /invitaci[oó]n.*(activa|pendiente|duplicad)|ya existe una invitaci[oó]n/i.test(
        mensaje
      )
    ) {
      return crear(
        TIPOS_ERROR_INVITACION.DUPLICADA,
        mensaje ||
          "Ya existe una invitación activa para ese perfil en el proyecto."
      );
    }

    if (
      /invitar.*(s[ií] mismo|vos mismo|ti mismo|usted mismo)|autoinvit|mismo perfil|propio perfil|mismo usuario/i.test(
        mensaje
      )
    ) {
      return crear(
        TIPOS_ERROR_INVITACION.AUTOINVITACION,
        mensaje || "No podés invitarte a vos mismo."
      );
    }

    if (/ya es miembro|miembro activo|pertenece al proyecto/i.test(mensaje)) {
      return crear(
        TIPOS_ERROR_INVITACION.YA_ES_MIEMBRO,
        mensaje || "El perfil ya es miembro activo del proyecto."
      );
    }

    if (/perfil.*(inactiv|baja)|usuario.*(inactiv|baja)/i.test(mensaje)) {
      return crear(
        TIPOS_ERROR_INVITACION.PERFIL_INACTIVO,
        mensaje || "El perfil destinatario no se encuentra activo."
      );
    }

    if (/profesi[oó]n/i.test(mensaje)) {
      return crear(
        TIPOS_ERROR_INVITACION.PROFESION_INCOMPATIBLE,
        mensaje || "La profesión del perfil no coincide con la requerida."
      );
    }

    if (/actividad.*(estado|cancel|finaliz|no admite|no permite)|no se puede invitar.*actividad/i.test(mensaje)) {
      return crear(
        TIPOS_ERROR_INVITACION.ACTIVIDAD_INVALIDA,
        mensaje || "La actividad ya no admite invitaciones."
      );
    }

    if (/proyecto.*(estado|publicad|confirmad|cancel|finaliz)|no admite invitaciones/i.test(mensaje)) {
      return crear(
        TIPOS_ERROR_INVITACION.PROYECTO_ESTADO,
        mensaje || "El proyecto ya no admite invitaciones."
      );
    }

    return crear(
      TIPOS_ERROR_INVITACION.CONFLICTO,
      mensaje || "No se pudo enviar la invitación por un conflicto de datos."
    );
  }

  if (!status || status >= 500) {
    return crear(
      TIPOS_ERROR_INVITACION.DESCONOCIDO,
      "Ocurrió un error al enviar la invitación. Inténtalo nuevamente."
    );
  }

  return crear(
    TIPOS_ERROR_INVITACION.DESCONOCIDO,
    mensajeErrorApi(error, "No se pudo enviar la invitación.")
  );
}

/**
 * Texto del toast posterior al 201. La invitación nunca se presenta como
 * aceptada: la aceptación pertenece a UC-28.
 * @param {object|null|undefined} invitacion
 * @param {string} [nombrePerfil]
 * @returns {string}
 */
export function mensajeExitoInvitacion(invitacion, nombrePerfil = "") {
  const nombre = String(nombrePerfil || "").trim();
  const destinatario = nombre || "El perfil";
  const estado = String(invitacion?.estado || "PENDIENTE").toUpperCase();

  if (estado === "PENDIENTE") {
    return `${destinatario} recibió la invitación. Queda PENDIENTE hasta que la acepte.`;
  }
  return `${destinatario} recibió la invitación.`;
}
