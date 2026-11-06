/*
 * Feedback unificado para funcionalidades todavía no implementadas.
 * El front no debe navegar a rutas inexistentes ni simular acciones:
 * muestra un toast de error y deja al usuario en una pantalla válida.
 */

export const TITULO_NO_DISPONIBLE = "Funcionalidad no disponible";

/**
 * @param {string|null|undefined} nombre
 * @returns {string}
 */
export function mensajeNoDisponible(nombre) {
  const detalle = nombre ? ` «${nombre}»` : "";
  return `La funcionalidad${detalle} todavía no está disponible.`;
}

/**
 * @param {{init?: Function}|null|undefined} toast instancia de useToast()
 * @param {string|null|undefined} nombre
 */
export function mostrarNoDisponible(toast, nombre) {
  if (!toast || typeof toast.init !== "function") return;
  toast.init({
    title: TITULO_NO_DISPONIBLE,
    message: mensajeNoDisponible(nombre),
    color: "danger",
    position: "top-right",
    duration: 5000,
  });
}
