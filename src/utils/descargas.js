/**
 * Utilidades compartidas para descargar archivos binarios del backend.
 *
 * El backend devuelve los PDF/CSV con `Content-Disposition: attachment`.
 * Cuando el navegador corre en otro origen, ese header solo es legible si el
 * backend lo expone por CORS (ya está configurado en SecurityConfig).
 */

/**
 * Extrae el nombre de archivo de un header `Content-Disposition`.
 * Soporta `filename="..."` y `filename*=UTF-8''...`.
 *
 * @param {string|undefined|null} header
 * @returns {string} nombre sin comillas, o cadena vacía
 */
export function nombreDesdeContentDisposition(header) {
  if (!header) return "";

  const coincidencia = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(header);
  if (!coincidencia) return "";

  let nombre = coincidencia[1];
  try {
    nombre = decodeURIComponent(nombre);
  } catch {
    // Ya venía sin escapar; se usa tal cual.
  }
  return nombre.replace(/"/g, "").trim();
}

/**
 * Dispara la descarga de un Blob en el navegador.
 *
 * @param {Blob|null|undefined} blob
 * @param {string} nombre
 * @returns {boolean} true si se inició la descarga
 */
export function descargarBlob(blob, nombre = "documento.pdf") {
  if (!(blob instanceof Blob) || blob.size === 0) return false;

  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  enlace.rel = "noopener";
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();

  // Se libera con margen para que el navegador alcance a tomar el archivo.
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
  return true;
}

/**
 * Obtiene el mensaje de error de una descarga. Si el backend respondió JSON
 * con `responseType: blob`, el cuerpo llega como Blob y hay que leerlo.
 *
 * @param {unknown} error
 * @param {string} fallback
 * @returns {Promise<string>}
 */
export async function mensajeErrorDescarga(
  error,
  fallback = "No se pudo descargar el archivo."
) {
  const data = error?.response?.data;

  if (data instanceof Blob) {
    try {
      const texto = await data.text();
      const json = JSON.parse(texto);
      if (json?.message) return json.message;
    } catch {
      // El cuerpo no era JSON; se usa el fallback.
    }
    return fallback;
  }

  return data?.message || fallback;
}
