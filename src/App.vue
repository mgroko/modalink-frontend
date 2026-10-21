<template>
  <component :is="$route.meta.layout || 'div'" :titulo="$route.meta.titulo || 'Perfiles'">
    <RouterView :key="viewKey" />
  </component>
</template>

<script>
import { watch } from "vue";
import { useColors } from "vuestic-ui";
import { restaurarSesion, state } from "./services/authState";
import { applyDomTheme, resolvedTheme } from "./services/themeState";

export default {
  name: "App",
  setup() {
    const { applyPreset } = useColors();

    watch(
      resolvedTheme,
      (theme) => {
        applyPreset(theme);
        applyDomTheme();
      },
      { immediate: true }
    );
  },
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