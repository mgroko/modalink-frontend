/**
 * Destino inicial de un usuario según su estado de sesión.
 *
 * Se usa tanto al entrar con una sesión ya iniciada (por ejemplo, al abrir la
 * ruta raíz o `/login` con la cookie JWT vigente) como inmediatamente después
 * de un login exitoso, para que la regla de navegación viva en un solo lugar.
 *
 * @param {{ rolGlobal?: string, idPerfilActivo?: number|null }|null} usuario
 * @returns {{ name: string }}
 */
export function destinoInicial(usuario) {
  if (!usuario) return { name: "login" };
  if (usuario.rolGlobal === "Administrador") return { name: "dashboard-admin" };
  if (usuario.idPerfilActivo != null) return { name: "home" };
  return { name: "dashboard-usuario" };
}
