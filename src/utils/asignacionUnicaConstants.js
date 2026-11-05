/*
 * Regla de asignación única por usuario y actividad
 * (ficha `ficha-tecnica-asignacion-unica-por-usuario.md`).
 *
 * El backend es la fuente de verdad. Estas utilidades sólo reconocen el 409
 * cuando el usuario ya tiene una asignación activa en la actividad con otro
 * perfil, para mostrar el mensaje correcto y refrescar los listados.
 *
 * No debe confundirse con el duplicado del mismo perfil:
 * "El miembro ya está asignado a esta actividad."
 */

/** Marcador que devuelve la restricción de base de datos. */
export const CODIGO_ASIGNACION_DUPLICADA_USUARIO =
  "ASIGNACION_DUPLICADA_USUARIO";

export const MENSAJE_USUARIO_YA_ASIGNADO =
  "El usuario ya está asignado a esta actividad con otro perfil.";

export const MENSAJE_USUARIO_YA_ASIGNADO_POSTULACION =
  "Ya estás asignado a esta actividad con otro perfil.";

/**
 * ¿La respuesta es el conflicto de misma actividad + mismo usuario + otro
 * perfil?
 *
 * Se reconoce por el marcador de la restricción de base de datos o por el
 * texto que devuelve el backend. Un 409 del mismo perfil sigue siendo un
 * duplicado común.
 * @param {object} error error Axios
 * @returns {boolean}
 */
export function esConflictoAsignacionUnica(error) {
  if (error?.response?.status !== 409) return false;

  const data = error?.response?.data;
  if (!data || typeof data !== "object") return false;

  const marcador = [data.codigo, data.codigoMotivo, data.marcador]
    .map((valor) => String(valor || "").toUpperCase())
    .join(" ");
  if (marcador.includes(CODIGO_ASIGNACION_DUPLICADA_USUARIO)) return true;

  const mensaje = String(data.message || "");
  if (mensaje.includes(CODIGO_ASIGNACION_DUPLICADA_USUARIO)) return true;

  return /otro perfil/i.test(mensaje) && /asignad/i.test(mensaje);
}
