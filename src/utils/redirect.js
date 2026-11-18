/**
 * Valida un destino de redirección interno.
 *
 * Solo acepta rutas absolutas del mismo origen. Rechaza URLs externas,
 * protocol-relative (`//`) y las propias pantallas de login/email para evitar
 * bucles y open redirects.
 *
 * @param {unknown} redirect
 * @returns {string|null}
 */
export function destinoSeguro(redirect) {
  if (typeof redirect !== "string") return null;
  if (!redirect.startsWith("/") || redirect.startsWith("//")) return null;
  if (redirect.startsWith("/login")) return null;
  if (redirect.startsWith("/auth/")) return null;
  return redirect;
}
