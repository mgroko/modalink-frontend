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
  max500: (v) => !v || v.length <= 500 || "La biografía no puede superar los 500 caracteres",
};
