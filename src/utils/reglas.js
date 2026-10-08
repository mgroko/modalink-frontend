export const reglasPerfil = {
  requerido: (v) => !!v || "Este campo es requerido",
  numerico: (v) =>
    v === null ||
    v === undefined ||
    String(v).trim() === "" ||
    Number.isFinite(Number(v)) ||
    "Debe ser un valor numérico",
  min2: (v) => !v || v.length >= 2 || "Debe tener al menos 2 caracteres",
  max50: (v) => !v || v.length <= 50 || "No puede superar los 50 caracteres",
  max500: (v) => !v || v.length <= 500 || "La biografía no puede superar los 50 caracteres",
};

/*
 * Reglas del formulario Crear Proyecto (UC-24).
 * Límites según la matriz de campos de la ficha (§3).
 * Los vacíos pasan estas reglas: se combinan con `requerido` en el template.
 */
export const reglasProyecto = {
  requerido: (v) => !!v || "Este campo es requerido",
  noBlanco: (v) => !v || String(v).trim().length > 0 || "No puede contener solo espacios",
  numerico: (v) =>
    v === null ||
    v === undefined ||
    String(v).trim() === "" ||
    Number.isFinite(Number(v)) ||
    "Debe ser un valor numérico",
  max50: (v) => !v || String(v).length <= 50 || "No puede superar los 50 caracteres",
  max100: (v) => !v || String(v).length <= 100 || "No puede superar los 100 caracteres",
  max200: (v) => !v || String(v).length <= 200 || "No puede superar los 200 caracteres",
  max300: (v) => !v || String(v).length <= 300 || "No puede superar los 300 caracteres",
  cantidadPositiva: (v) =>
    (v !== null && v !== undefined && v !== "" && Number(v) > 0) ||
    "La cantidad debe ser mayor a 0",
  noNegativo: (v) =>
    v === null ||
    v === undefined ||
    v === "" ||
    (Number.isFinite(Number(v)) && Number(v) >= 0) ||
    "No puede ser un valor negativo",
  fechaFinNoAnterior: (fechaInicio) => (v) => {
    if (!v || !fechaInicio) return true;
    return v >= fechaInicio || "La fecha de fin no puede ser anterior a la fecha de inicio.";
  },
};
