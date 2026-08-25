<template>
  <component :is="$route.meta.layout || 'div'">
    <RouterView />
  </component>
</template>

<script>
import { restaurarSesion } from "./services/authState";

export default {
  name: "App",
  async mounted() {
    // Precalienta la cookie CSRF y, de paso, restaura la sesión si ya
    // existe una cookie "jwt" válida (por ejemplo, tras refrescar la página).
    await restaurarSesion();
  },
};
</script>

<style>

</style>