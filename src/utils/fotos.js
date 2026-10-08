import { API_BASE_URL } from "../services/http";

/**
 * Resuelve una URL de foto devuelta por el backend para usarla en <img src>.
 * El backend devuelve rutas relativas (ej. "/uploads/perfiles/foto.jpg") que,
 * sin resolver, se pedirían al origin del frontend y responderían 404.
 * @param {string|null|undefined} url fotoUrl / urlFoto / fotoPerfil
 * @returns {string|null} URL absoluta; la original si ya es absoluta
 *          (http(s)://, //, data:, blob:); null si no hay url
 */
export function resolverFotoUrl(url) {
  if (!url) return null;
  if (/^(https?:)?\/\//.test(url) || /^(data|blob):/.test(url)) return url;
  return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}
