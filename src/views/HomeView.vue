<template>
  <div class="home-layout">
    <header class="home-layout__header">
      <RouterLink to="/home" class="home-layout__brand">ModaLink</RouterLink>

      <nav class="home-layout__nav">
        <VaButton
          v-if="usuario"
          preset="secondary"
          size="small"
          icon="mso-logout"
          @click="cerrarSesion"
        >
          Cerrar sesión
        </VaButton>
      </nav>
    </header>

    <main class="home-layout__content">
      <section class="home-layout__saludo">
        <h1>
          Hola, {{ usuario?.nombre || "ModaLink" }}
        </h1>
        <p class="home-layout__subtitulo">
          Bienvenido/a a tu espacio en ModaLink.
        </p>
      </section>
    </main>
  </div>
</template>

<script>
import authService from "../services/authService";
import { state, limpiarSesion } from "../services/authState";

export default {
  name: "HomeView",
  computed: {
    usuario() {
      return state.usuario;
    },
  },
  methods: {
    async cerrarSesion() {
      try {
        await authService.cerrarSesion();
      } catch {
        // ignore
      } finally {
        limpiarSesion();
        this.$router.push({ name: "login" });
      }
    },
  },
};
</script>

<style scoped>
.home-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--va-background-secondary, #ffffe7);
}

.home-layout__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 2rem;
  background: #fff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.home-layout__brand {
  font-size: 1.5rem;
  font-weight: 750;
  letter-spacing: 0.15em;
  text-decoration: none;
  text-transform: uppercase;
  background: linear-gradient(135deg, #ff512f 0%, #b865a4 50%, #240b36 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.home-layout__nav {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.home-layout__content {
  flex: 1;
  padding: 2.5rem 1.5rem;
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
}

.home-layout__saludo h1 {
  font-size: 2.25rem;
  font-weight: 800;
  background: linear-gradient(135deg, #ff512f 0%, #b865a4 50%, #240b36 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.home-layout__subtitulo {
  margin-top: 0.25rem;
  font-size: 0.95rem;
  color: #6a7385;
}
</style>
