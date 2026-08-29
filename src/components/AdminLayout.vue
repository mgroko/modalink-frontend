<template>
  <div class="admin-layout">
    <header class="admin-layout__header">
      <RouterLink to="/admin/gestion-usuarios" class="admin-layout__brand">ModaLink</RouterLink>

      <nav class="admin-layout__nav">
        <RouterLink to="/admin/dashboard" class="admin-layout__link">Inicio</RouterLink>
        <RouterLink to="/admin/gestion-usuarios" class="admin-layout__link">Usuarios</RouterLink>
        <RouterLink to="/admin/gestionar-caracteristicas" class="admin-layout__link">Características</RouterLink>

        <VaDropdown v-if="usuario" placement="bottom-end">
          <template #anchor>
            <VaButton preset="secondary" size="small" icon="mso-admin_panel_settings">
              {{ usuario.nombre || usuario.correo }}
            </VaButton>
          </template>

          <VaDropdownContent class="admin-dropdown">
            <VaMenuItem
              icon="mso-people"
              class="admin-dropdown__item"
              @click="$router.push({ name: 'gestion-usuarios' })"
            >
              Gestión de usuarios
            </VaMenuItem>

            <VaMenuItem
              icon="mso-tune"
              class="admin-dropdown__item"
              @click="$router.push({ name: 'gestionar-caracteristicas' })"
            >
              Características técnicas
            </VaMenuItem>
            
            <VaMenuItem
              icon="mso-logout"
              class="admin-dropdown__item text-danger"
              @click="cerrarSesion"
            >
              Cerrar sesión
            </VaMenuItem>
          </VaDropdownContent>
        </VaDropdown>
      </nav>
    </header>

    <main class="admin-layout__content">
      <slot />
    </main>
  </div>
</template>

<script>
import authService from "../services/authService";
import { state, limpiarSesion } from "../services/authState";

export default {
  name: "AdminLayout",
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

.admin-dropdown {
  min-width: 180px;      
  max-width: 190px;     
  padding: 0.5rem 0;     
  border-radius: 8px;   
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); 
}

.admin-dropdown__item {
  color: rgb(56, 56, 56);
  font-size: 0.8rem;     
  padding: 0.5rem 1.25rem; 
}


.text-danger {
  color: #d90429 !important;
}


</style>
