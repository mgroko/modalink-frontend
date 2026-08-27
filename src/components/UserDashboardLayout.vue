<template>
  <div class="dashboard-layout">
    <aside class="sidebar">
      <div class="sidebar__top">
        <div class="sidebar__user">
          <div class="sidebar__avatar">{{ inicialUsuario }}</div>
          <div class="sidebar__user-info">
            <span class="sidebar__user-name">{{ usuario?.nombre }} {{ usuario?.apellido }}</span>
            <span class="sidebar__user-email">{{ usuario?.correo }}</span>
          </div>
        </div>

        <button class="sidebar__notifications">
          <span class="material-symbols-outlined">notifications</span>
          <span>Notificaciones</span>
          <span class="sidebar__badge">2</span>
        </button>

        <div class="sidebar__section">
          <span class="sidebar__section-title">Acciones</span>
          <button class="sidebar__action" @click="$router.push({ name: 'modificar-datos' })">
            Modificar datos personales
          </button>
          <button class="sidebar__action">
            Solicitar baja del sistema
          </button>
        </div>
      </div>

      <button class="sidebar__logout" @click="cerrarSesion">
        <span class="material-symbols-outlined">power_settings_new</span>
        Cerrar sesión
      </button>
    </aside>

    <div class="dashboard-main">
      <header class="dashboard-main__header">
        <div>
          <h1 class="dashboard-main__title">MODALINK DASHBOARD</h1>
          <span class="dashboard-main__subtitle">{{ titulo }}</span>
        </div>
        <div class="dashboard-main__header-actions">
          <button class="dashboard-main__icon-btn">
            <span class="material-symbols-outlined">add_circle</span>
          </button>
          <button class="dashboard-main__icon-btn">
            <span class="material-symbols-outlined">more_horiz</span>
          </button>
        </div>
      </header>

      <main class="dashboard-main__content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script>
import authService from "../services/authService";
import { state, limpiarSesion } from "../services/authState";

export default {
  name: "UserDashboardLayout",
  props: {
    titulo: {
      type: String,
      default: "Perfiles",
    },
  },
  computed: {
    usuario() {
      return state.usuario;
    },
    inicialUsuario() {
      const nombre = this.usuario?.nombre || "";
      return nombre.charAt(0).toUpperCase();
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
.dashboard-layout {
  display: flex;
  min-height: 100vh;
  background: var(--va-background-secondary, #ffffe7);
}

/* ── Sidebar ── */
.sidebar {
  width: 250px;
  min-width: 250px;
  background: #fff;
  border-right: 1px solid rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1.25rem 0;
}

.sidebar__top {
  display: flex;
  flex-direction: column;
}

/* Usuario */
.sidebar__user {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0 1.25rem 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.sidebar__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #6c757d;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.sidebar__user-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.sidebar__user-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar__user-email {
  font-size: 0.72rem;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Notificaciones */
.sidebar__notifications {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 1.25rem;
  padding: 0.5rem 0.7rem;
  background: #f0f4ff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.82rem;
  color: #374151;
  text-align: left;
}

.sidebar__notifications:hover {
  background: #e0e7ff;
}

.sidebar__notifications .material-symbols-outlined {
  font-size: 1.15rem;
  color: #6366f1;
}

.sidebar__badge {
  margin-left: auto;
  background: #ef4444;
  color: #fff;
  font-size: 0.7rem;
  font-weight: 600;
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
}

/* Sección acciones */
.sidebar__section {
  margin-top: 1.25rem;
  padding: 0 1.25rem;
}

.sidebar__section-title {
  display: block;
  font-size: 0.72rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.sidebar__action {
  display: block;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  padding: 0.45rem 0;
  font-size: 0.82rem;
  color: #374151;
  cursor: pointer;
}

.sidebar__action:hover {
  color: #b865a4;
  text-decoration: underline;
}

/* Logout */
.sidebar__logout {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 1.25rem;
  padding: 0.55rem 0.7rem;
  background: none;
  border: none;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  cursor: pointer;
  font-size: 0.82rem;
  color: #d90429;
  font-weight: 500;
}

.sidebar__logout:hover {
  background: #fef2f2;
}

.sidebar__logout .material-symbols-outlined {
  font-size: 1.15rem;
}

/* ── Main ── */
.dashboard-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.dashboard-main__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 1.25rem 2rem;
  background: #fff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.dashboard-main__title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #1f2937;
  letter-spacing: 0.04em;
  margin: 0;
}

.dashboard-main__subtitle {
  font-size: 0.82rem;
  color: #6b7280;
}

.dashboard-main__header-actions {
  display: flex;
  gap: 0.5rem;
}

.dashboard-main__icon-btn {
  background: none;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0.35rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}

.dashboard-main__icon-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.dashboard-main__icon-btn .material-symbols-outlined {
  font-size: 1.25rem;
}

.dashboard-main__content {
  flex: 1;
  padding: 1.5rem 2rem;
}
</style>
