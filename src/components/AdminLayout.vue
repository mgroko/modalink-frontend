<template>
  <div class="admin-layout">
    <header class="admin-layout__header">
      <RouterLink to="/home" class="admin-layout__brand">ModaLink</RouterLink>

      <nav class="admin-layout__nav">
        <RouterLink to="/home" class="admin-layout__link">Inicio</RouterLink>
        <VaChip v-if="usuario" outline size="small" color="primary">
          <VaIcon name="mso-admin_panel_settings" size="small" class="mr-1" />
          {{ usuario.nombre || usuario.correo }}
        </VaChip>
      </nav>
    </header>

    <main class="admin-layout__content">
      <slot />
    </main>
  </div>
</template>

<script>
import { state } from "../services/authState";

export default {
  name: "AdminLayout",
  computed: {
    usuario() {
      return state.usuario;
    },
  },
};
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--va-background-secondary, #ffffe7);
}

.admin-layout__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 2rem;
  background: #fff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.admin-layout__brand {
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

.admin-layout__nav {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.admin-layout__link {
  color: #6a7385;
  font-size: 0.9rem;
  text-decoration: none;
  transition: color 0.2s ease;
}

.admin-layout__link:hover {
  color: #374151;
  text-decoration: underline;
}

.admin-layout__content {
  flex: 1;
  padding: 2.5rem 1.5rem;
}
</style>
