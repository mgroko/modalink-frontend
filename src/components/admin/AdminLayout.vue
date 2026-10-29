<template>
  <div class="admin-layout" @click="cerrarPaneles">
    <aside class="admin-layout__sidebar">
      <RouterLink to="/admin/dashboard" class="admin-layout__brand">ModaLink</RouterLink>

      <div class="admin-layout__search" aria-label="Buscar">
        <span class="material-symbols-outlined">search</span>
        <span>Buscar</span>
      </div>

      <div class="admin-layout__sidebar-user">
        <span class="admin-layout__avatar">{{ iniciales }}</span>
        <span class="admin-layout__user-data">
          <strong>{{ nombreCompleto }}</strong>
          <small>{{ rolUsuario }}</small>
        </span>
      </div>

      <nav class="admin-layout__nav" aria-label="Navegación administrativa">
        <RouterLink to="/admin/notificaciones" class="admin-layout__link">
          <span class="material-symbols-outlined">notifications</span>
          <span>Notificaciones</span>
          <span v-if="notificaciones > 0" class="admin-layout__badge admin-layout__badge--enlace">{{ notificaciones }}</span>
        </RouterLink>
        <RouterLink to="/admin/dashboard" class="admin-layout__link">
          <span class="material-symbols-outlined">dashboard</span>
          <span>Dashboard</span>
        </RouterLink>
        <RouterLink to="/admin/gestion-usuarios" class="admin-layout__link">
          <span class="material-symbols-outlined">group</span>
          <span>Usuarios</span>
        </RouterLink>
        <RouterLink to="/admin/reportes" class="admin-layout__link">
          <span class="material-symbols-outlined">description</span>
          <span>Reportes</span>
          <span class="admin-layout__soon">Próximo</span>
        </RouterLink>
        <RouterLink to="/admin/reportes-perfil" class="admin-layout__link">
          <span class="material-symbols-outlined">flag</span>
          <span>Reportes de perfil</span>
        </RouterLink>
        <RouterLink to="/admin/gestionar-caracteristicas" class="admin-layout__link">
          <span class="material-symbols-outlined">tune</span>
          <span>Características técnicas</span>
        </RouterLink>
        <RouterLink to="/admin/unidades-medida" class="admin-layout__link">
          <span class="material-symbols-outlined">straighten</span>
          <span>Unidad de medidas</span>
        </RouterLink>
        <RouterLink to="/admin/configuracion" class="admin-layout__link">
          <span class="material-symbols-outlined">settings</span>
          <span>Configuración del sistema</span>
        </RouterLink>
      </nav>

      <div class="admin-layout__footer">
        <button type="button" class="admin-layout__logout" @click="cerrarSesion">
          <span class="material-symbols-outlined">logout</span>
          Cerrar sesión
        </button>
      </div>
    </aside>

    <main class="admin-layout__content">
      <header class="admin-layout__header">
        <div class="admin-layout__heading">
          <h1>ADMINISTRACIÓN</h1>
          <span>{{ tituloActual }}</span>
        </div>

        <div class="admin-layout__actions">
          <div class="admin-layout__notificaciones-header" @click.stop>
            <button
              ref="notificacionesHeaderTrigger"
              type="button"
              class="admin-layout__notifications"
              aria-label="Notificaciones"
              aria-haspopup="dialog"
              aria-controls="admin-notificaciones-header"
              :aria-expanded="notificacionesOrigen === 'header' ? 'true' : 'false'"
              @click="alternarNotificaciones('header')"
            >
              <span class="material-symbols-outlined">notifications</span>
              <span v-if="notificaciones > 0" class="admin-layout__badge">{{ notificaciones }}</span>
            </button>

            <NotificacionesPopover
              v-if="notificacionesOrigen === 'header'"
              id="admin-notificaciones-header"
              :model-value="true"
              :id-perfil-contexto="null"
              :ruta-ver-todas="{ name: 'notificaciones-admin' }"
              :limite="6"
              modo-admin
              @update:model-value="alCambiarNotificaciones('header', $event)"
            />
          </div>
          <ThemeToggle />
          <div class="admin-layout__profile">
            <span class="admin-layout__avatar">{{ iniciales }}</span>
            <span class="admin-layout__user-data">
              <strong>{{ nombreCompleto }}</strong>
              <small>{{ rolUsuario }}</small>
              <em><span></span> En línea</em>
            </span>
          </div>
        </div>
      </header>
      <slot />
    </main>
  </div>
</template>

<script>
import { nextTick } from "vue";
import authService from "../../services/authService";
import { state, limpiarSesion } from "../../services/authState";
import {
  state as notificacionState,
  cargarResumenUsuario,
} from "../../services/notificacionState";
import ThemeToggle from "../ThemeToggle.vue";
import NotificacionesPopover from "../notificaciones/NotificacionesPopover.vue";
import { setThemeMode } from "../../services/themeState";

export default {
  name: "AdminLayout",
  components: {
    ThemeToggle,
    NotificacionesPopover,
  },
  data() {
    return {
      notificacionesOrigen: null,
    };
  },
  computed: {
    usuario() {
      return state.usuario;
    },
    notificaciones() {
      return notificacionState.noLeidasUsuario;
    },
    nombreCompleto() {
      const nombreCompleto = [this.usuario?.nombre, this.usuario?.apellido]
        .filter(Boolean)
        .join(" ")
        .trim();

      return nombreCompleto || this.usuario?.correo || "—";
    },
    rolUsuario() {
      return this.usuario?.rolGlobal || "—";
    },
    tituloActual() {
      return this.$route.meta?.titulo || "Panel de administración";
    },
    iniciales() {
      return this.nombreCompleto
        .split(/\s+/)
        .slice(0, 2)
        .map((parte) => parte.charAt(0).toUpperCase())
        .join("");
    },
  },
  async mounted() {
    try {
      if (!localStorage.getItem("modalink-theme")) {
        setThemeMode("dark");
      }
    } catch {
      setThemeMode("dark");
    }

    await cargarResumenUsuario();
  },
  methods: {
    alternarNotificaciones(origen) {
      this.notificacionesOrigen =
        this.notificacionesOrigen === origen ? null : origen;
    },
    alCambiarNotificaciones(origen, abierto) {
      if (abierto) {
        this.notificacionesOrigen = origen;
        return;
      }

      if (this.notificacionesOrigen !== origen) return;
      this.notificacionesOrigen = null;

      nextTick(() => {
        this.$refs.notificacionesHeaderTrigger?.focus();
      });
    },
    cerrarPaneles() {
      if (this.notificacionesOrigen) {
        this.alCambiarNotificaciones(this.notificacionesOrigen, false);
      }
    },
    async cerrarSesion() {
      try {
        await authService.cerrarSesion();
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
  position: relative;
  overflow-x: hidden;
  min-height: 100vh;
  display: flex;
  background: var(--color-bg);
}

.admin-layout__sidebar {
  width: 276px;
  flex: 0 0 276px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  padding: 1.75rem 0.9rem 1.5rem;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border-soft);
}

.admin-layout__brand {
  padding: 0 0.5rem;
  color: var(--color-primary);
  font-size: 1.55rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-decoration: none;
}

.admin-layout__search {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.15rem;
  padding: 0.65rem 0.9rem;
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
  border-radius: 1.5rem;
  font-size: 0.85rem;
}

.admin-layout__sidebar-user {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0 0.2rem;
}

.admin-layout__sidebar-user .admin-layout__avatar {
  width: 2.6rem;
  height: 2.6rem;
  flex: 0 0 2.6rem;
}

.admin-layout__search .material-symbols-outlined,
.admin-layout__link .material-symbols-outlined,
.admin-layout__logout .material-symbols-outlined {
  font-size: 1.15rem;
}

.admin-layout__nav {
  display: grid;
  gap: 0.35rem;
}

.admin-layout__notificaciones-header {
  position: relative;
  display: flex;
}

.admin-layout__link {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 2.75rem;
  padding: 0.65rem 0.9rem;
  color: var(--color-text);
  border-radius: 0.65rem;
  font-size: 0.9rem;
  text-decoration: none;
}

.admin-layout__link:hover,
.admin-layout__link.router-link-exact-active {
  color: var(--color-primary);
  background: var(--color-chip);
  font-weight: 700;
}

.admin-layout__soon {
  margin-left: auto;
  color: var(--color-text-subtle);
  font-size: 0.65rem;
}

.admin-layout__footer {
  display: flex;
  margin-top: auto;
}

.admin-layout__sidebar-user .admin-layout__user-data {
  gap: 0.15rem;
}

.admin-layout__avatar {
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  place-items: center;
  color: white;
  background: var(--color-primary);
  border-radius: 50%;
  font-size: 0.8rem;
  font-weight: 700;
}

.admin-layout__user-data {
  display: grid;
  gap: 0.2rem;
  min-width: 0;
}

.admin-layout__user-data strong {
  overflow: hidden;
  color: var(--color-text);
  font-size: 0.8rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-layout__user-data small {
  width: fit-content;
  padding: 0.15rem 0.45rem;
  color: var(--color-accent-dark);
  background: var(--color-warning-soft);
  border-radius: 0.5rem;
  font-size: 0.65rem;
}

.admin-layout__logout {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  width: fit-content;
  padding: 0;
  color: var(--color-danger);
  background: none;
  border: 0;
  cursor: pointer;
  font: inherit;
  font-size: 0.85rem;
}

.admin-layout__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 1rem;
  min-height: 3.75rem;
  margin-bottom: 1.5rem;
}

.admin-layout__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  min-height: 5.5rem;
  margin: -1.5rem -2.5rem 1.5rem;
  padding: 1rem 2.5rem;
  border-bottom: 1px solid var(--color-border-soft);
  background: var(--color-surface);
}

.admin-layout__heading {
  display: grid;
  gap: 0.15rem;
  min-width: 0;
}

.admin-layout__heading h1 {
  margin: 0;
  color: var(--color-text);
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.admin-layout__heading span {
  overflow: hidden;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-layout__header .admin-layout__actions {
  flex: 0 0 auto;
  margin: 0;
}

.admin-layout__notifications {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.4rem;
  height: 2.4rem;
  padding: 0;
  color: var(--color-primary);
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: 50%;
  cursor: pointer;
  text-decoration: none;
  transition: background-color 0.15s ease;
}

.admin-layout__notifications:hover {
  background: var(--color-chip);
}

.admin-layout__notifications .material-symbols-outlined {
  font-size: 1.25rem;
}

.admin-layout__profile {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
  max-width: 220px;
  padding: 0.45rem 0.75rem;
  border: 1px solid var(--color-border-soft);
  border-radius: 1rem;
}

.admin-layout__profile .admin-layout__avatar {
  width: 2.45rem;
  height: 2.45rem;
  flex: 0 0 2.45rem;
}

.admin-layout__profile .admin-layout__user-data {
  gap: 0.1rem;
}

.admin-layout__profile .admin-layout__user-data strong {
  font-size: 0.75rem;
}

.admin-layout__profile .admin-layout__user-data em {
  color: var(--color-success);
  font-size: 0.65rem;
  font-style: normal;
}

.admin-layout__profile .admin-layout__user-data em span {
  display: inline-block;
  width: 0.45rem;
  height: 0.45rem;
  margin-right: 0.25rem;
  background: currentColor;
  border-radius: 50%;
}

.admin-layout__badge {
  position: absolute;
  top: -0.55rem;
  right: -0.7rem;
  min-width: 1.1rem;
  padding: 0.15rem;
  color: white;
  background: var(--color-danger);
  border-radius: 50%;
  font-size: 0.65rem;
  text-align: center;
}

/* En el menú lateral el contador va en línea, junto al texto, para que no
   quede flotando al extremo de la fila. */
.admin-layout__badge--enlace {
  position: static;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.25rem;
  height: 1.25rem;
  margin-left: 0.15rem;
  padding: 0 0.3rem;
  color: var(--color-on-primary);
  background: var(--color-danger-fill);
  border-radius: 999px;
  font-size: 0.65rem;
  font-weight: 700;
  line-height: 1;
}

.admin-layout__notifications .admin-layout__badge {
  top: -0.2rem;
  right: -0.2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.15rem;
  height: 1.15rem;
  padding: 0 0.2rem;
  color: var(--color-on-primary);
  background: var(--color-danger-fill);
  border-radius: 999px;
  font-size: 0.62rem;
  font-weight: 700;
  line-height: 1;
}

.admin-layout__content {
  flex: 1;
  min-width: 0;
  padding: 1.5rem 2.5rem 2.5rem;
}

@media (max-width: 900px) {
  .admin-layout__sidebar {
    width: 220px;
    flex-basis: 220px;
  }

  .admin-layout__content {
    padding: 1.5rem;
  }

  .admin-layout__header {
    margin-right: -1.5rem;
    margin-left: -1.5rem;
    padding-right: 1.5rem;
    padding-left: 1.5rem;
  }

  .admin-layout__actions {
    justify-content: flex-end;
    gap: 0.75rem;
  }
}

@media (max-width: 680px) {
  .admin-layout {
    display: block;
  }

  .admin-layout__sidebar {
    width: 100%;
    min-height: auto;
    padding: 1rem;
    border-right: 0;
    border-bottom: 1px solid var(--color-border-soft);
  }

  .admin-layout__nav {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .admin-layout__footer {
    justify-content: flex-start;
  }

  .admin-layout__actions {
    justify-content: flex-start;
    gap: 0.5rem;
  }

  .admin-layout__header {
    align-items: flex-start;
    flex-direction: column;
    gap: 1rem;
    min-height: auto;
  }

  .admin-layout__header .admin-layout__actions {
    width: 100%;
    justify-content: space-between;
  }

  .admin-layout__profile {
    min-width: 0;
  }

  .admin-layout__profile .admin-layout__user-data {
    display: none;
  }
}
</style>
