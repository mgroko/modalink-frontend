<template>
  <component :is="$route.meta.layout || 'div'" :titulo="$route.meta.titulo || 'Perfiles'">
    <RouterView :key="viewKey" />
  </component>
</template>

<script>
import { restaurarSesion, state } from "./services/authState";

export default {
  name: "App",
  computed: {
    // Remonta la vista al cambiar el perfil activo para recargar datos contextuales.
    viewKey() {
      const idPerfil = state.usuario?.idPerfilActivo ?? "sin-perfil";
      return `${this.$route.fullPath}:${idPerfil}`;
    },
  },
  async mounted() {
    // Precalienta la cookie CSRF y, de paso, restaura la sesión si ya
    // existe una cookie "jwt" válida (por ejemplo, tras refrescar la página).
    await restaurarSesion();
  },
};
</script>

<style>

</style>