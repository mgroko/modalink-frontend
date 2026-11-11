<template>
  <div class="perfil-nav">
    <VaButton
      v-if="esPropio"
      block
      icon="mso-edit_calendar"
      @click="$emit('cambiar-seccion', 'calendario')"
    >
      Gestionar agenda
    </VaButton>

    <nav class="perfil-nav__menu">
      <button
        v-for="item in itemsVisibles"
        :key="item.key"
        class="perfil-nav__item"
        :class="{ 'perfil-nav__item--activo': item.key === seccionActiva }"
        @click="navegar(item)"
      >
        <span class="material-symbols-outlined">{{ item.icono }}</span>
        <span>{{ item.label }}</span>
        <span v-if="item.contador > 0" class="perfil-nav__badge">
          {{ item.contador }}
        </span>
        <span
          v-else-if="!esPropio"
          class="material-symbols-outlined perfil-nav__chevron"
          aria-hidden="true"
        >
          chevron_right
        </span>
      </button>

      <button
        v-if="esPropio"
        class="perfil-nav__item perfil-nav__item--peligro"
        @click="$emit('cerrar-sesion')"
      >
        <span class="material-symbols-outlined">power_settings_new</span>
        <span>Cerrar sesión</span>
      </button>
    </nav>

  </div>
</template>

<script>
import { state as invitacionState } from "../../services/invitacionState";
import { state as reemplazoState } from "../../services/reemplazoState";
import { state as solicitudColaboracionState } from "../../services/solicitudColaboracionState";
import { state as solicitudConexionState } from "../../services/solicitudConexionState";

export default {
  name: "PerfilSidebarNav",
  props: {
    esPropio: {
      type: Boolean,
      default: true,
    },
    seccionActiva: {
      type: String,
      default: "perfil",
    },
  },
  emits: [
    "cambiar-seccion",
    "navegar-ruta",
    "cerrar-sesion",
    "funcionalidad-no-disponible",
  ],
  computed: {
    itemsVisibles() {
      const itemsPropio = [
        { key: "perfil", label: "Perfil", icono: "person", tipo: "seccion" },
        {
          key: "publicaciones",
          label: "Publicaciones",
          icono: "photo_library",
          tipo: "seccion",
        },
        { key: "proyectos", label: "Proyectos", icono: "business_center", tipo: "seccion" },
        {
          key: "solicitudes",
          label: "Solicitudes",
          icono: "mail",
          tipo: "ruta",
          ruta: "solicitudes",
          contador:
            (invitacionState.pendientesRecibidas || 0) +
            (reemplazoState.pendientes || 0) +
            (solicitudColaboracionState.pendientesRecibidas || 0),
        },
        { key: "resenas", label: "Reseñas", icono: "star", tipo: "seccion" },
        {
          key: "terminos",
          label: "Términos y condiciones",
          icono: "description",
          tipo: "seccion",
        },
        {
          key: "mi-red",
          label: "Mi red",
          icono: "group",
          tipo: "ruta",
          ruta: "mi-red",
          contador: solicitudConexionState.pendientesRecibidas,
        },
        { key: "ajustes", label: "Ajustes", icono: "settings", tipo: "ruta", ruta: "ajustes-perfil-inicio" },
        { key: "panel", label: "Panel de usuario", icono: "space_dashboard", tipo: "ruta", ruta: "dashboard-usuario" },
      ];

      const itemsAjeno = [
        { key: "perfil", label: "Perfil", icono: "person", tipo: "seccion" },
        {
          key: "publicaciones",
          label: "Publicaciones",
          icono: "photo_library",
          tipo: "seccion",
        },
        { key: "proyectos", label: "Proyectos", icono: "business_center", tipo: "seccion" },
        { key: "calendario", label: "Calendario", icono: "calendar_month", tipo: "seccion" },
        {
          key: "terminos",
          label: "Términos y condiciones",
          icono: "description",
          tipo: "seccion",
        },
      ];

      return this.esPropio ? itemsPropio : itemsAjeno;
    },
  },
  methods: {
    navegar(item) {
      if (item.tipo === "seccion") {
        this.$emit("cambiar-seccion", item.key);
      } else if (item.tipo === "ruta" && item.ruta) {
        this.$emit("navegar-ruta", item.ruta);
      } else {
        this.$emit("funcionalidad-no-disponible", item.label || "");
      }
    },
  },
};
</script>

<style scoped>
.perfil-nav {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.perfil-nav__menu {
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  overflow: hidden;
}

.perfil-nav__item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  border-bottom: 1px solid var(--color-border-soft);
  font-size: 0.84rem;
  color: var(--color-text);
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
}

.perfil-nav__item:last-child {
  border-bottom: 0;
}

.perfil-nav__item:hover {
  background: var(--color-surface-soft);
}

.perfil-nav__item--activo {
  background: var(--color-surface-muted);
  font-weight: 600;
  color: var(--color-primary);
}

.perfil-nav__item .material-symbols-outlined {
  font-size: 1.15rem;
  color: var(--color-text-muted);
}

.perfil-nav__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  margin-left: auto;
  padding: 0 0.3rem;
  border-radius: 999px;
  background: var(--color-danger-fill);
  color: var(--color-on-primary);
  font-size: 0.62rem;
  font-weight: 700;
  line-height: 1;
}

.perfil-nav__chevron {
  margin-left: auto;
  color: var(--color-text-subtle);
  font-size: 1.1rem;
}

.perfil-nav__item--activo .material-symbols-outlined {
  color: var(--color-primary);
}

.perfil-nav__item--peligro {
  color: var(--color-danger-text);
}

.perfil-nav__item--peligro .material-symbols-outlined {
  color: var(--color-danger-text);
}

.perfil-nav__item--peligro:hover {
  background: var(--color-danger-soft);
}

</style>
