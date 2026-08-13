<template>
  <component :is="$route.meta.layout || 'div'">
    <RouterView />
  </component>
</template>

<script>
import authService from "./services/authService";
import { setUsuario, clearUsuario } from "./services/authState";

export default {
  name: "App",
  async mounted() {
    // Precalienta la cookie CSRF y, de paso, restaura la sesión si ya
    // existe una cookie "jwt" válida (por ejemplo, tras refrescar la página).
    try {
      const response = await authService.obtenerSesion();
      setUsuario(response?.data || null);
    } catch (error) {
      clearUsuario();
    }
  },
};
</script>

<style>
body {
  margin: 0;
  padding: 0;
  font-family: Arial, sans-serif;
}
</style>