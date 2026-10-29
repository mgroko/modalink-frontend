import perfilService from "../services/perfilService";
import { idPerfilActivo, setPerfilActivo } from "../services/authState";

/**
 * Resuelve el href de una notificación sin navegar. Devuelve `null` cuando la
 * notificación no tiene destino.
 * @param {object|null|undefined} notificacion
 * @param {import('vue-router').Router} router
 * @returns {string|null}
 */
export function hrefNotificacion(notificacion, router) {
  const ruta = notificacion?.destino?.ruta;
  if (!ruta || !router) return null;

  try {
    return router.resolve(ruta).href;
  } catch {
    return null;
  }
}

/**
 * Navega al destino de una notificación.
 *
 * La ruta del proyecto exige perfil activo. Si la notificación se abrió desde
 * un contexto sin perfil, se activa `idPerfilContexto` antes de navegar. Si la
 * activación falla, no se navega y se devuelve el mensaje de error.
 *
 * @param {object|null|undefined} notificacion
 * @param {import('vue-router').Router} router
 * @param {{modoAdmin?: boolean}} [opciones]
 * @returns {Promise<{ok: boolean, error: string|null}>}
 */
export async function navegarANotificacion(
  notificacion,
  router,
  { modoAdmin = false } = {}
) {
  const destino = notificacion?.destino;
  if (!destino?.ruta || !router) return { ok: false, error: null };

  if (modoAdmin) {
    await router.push(destino.ruta);
    return { ok: true, error: null };
  }

  const idPerfil = notificacion?.idPerfilContexto;
  const perfilActivo = idPerfilActivo();
  const necesitaActivarPerfil =
    idPerfil != null && String(perfilActivo) !== String(idPerfil);

  if (necesitaActivarPerfil) {
    try {
      const response = await perfilService.activar(idPerfil);
      setPerfilActivo(response?.data || { idPerfil });
    } catch (error) {
      return {
        ok: false,
        error:
          error?.response?.data?.message ||
          "No se pudo activar el perfil de la notificación. Elegí un perfil desde el dashboard.",
      };
    }
  }

  if (idPerfilActivo() == null) {
    return { ok: false, error: "Seleccioná un perfil para abrir el proyecto." };
  }

  await router.push(destino.ruta);
  return { ok: true, error: null };
}
