<template>
  <div class="perfil-nav">
    <VaButton
      v-if="esPropio"
      block
      icon="mso-calendar_month"
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

    <VaButton
      v-if="!esPropio"
      color="success"
      block
      icon="mso-handshake"
      @click="$emit('contactar')"
    >
      Contactar / Colaborar
    </VaButton>

    <VaButton
      v-if="!esPropio"
      color="danger"
      size="small"
      block
      icon="mso-flag"
      @click="$emit('reportar')"
    >
      Reportar perfil
    </VaButton>
  </div>
</template>

<script>
export default {
  name: "PerfilSidebarNav",
  props: {
    esPropio: {
      type: Boolean,
      default: true,
    },
    seccionActiva: {
      type: String,
      default: "publicaciones",
    },
  },
  emits: ["cambiar-seccion", "navegar-ruta", "cerrar-sesion", "contactar", "reportar"],
  computed: {
    itemsVisibles() {
      const itemsPropio = [
        { key: "calendario", label: "Calendario", icono: "calendar_month", tipo: "seccion" },
        { key: "proyectos", label: "Proyectos", icono: "business_center", tipo: "ruta", ruta: "dashboard-usuario" },
        { key: "resenas", label: "Reseñas", icono: "star", tipo: "seccion" },
        { key: "mi-red", label: "Mi red", icono: "group", tipo: "ruta" },
        { key: "ajustes", label: "Ajustes", icono: "settings", tipo: "ruta", ruta: "modificar-datos" },
        { key: "panel", label: "Panel de usuario", icono: "person", tipo: "ruta", ruta: "dashboard-usuario" },
      ];

      const itemsAjeno = [
        { key: "proyectos", label: "Proyectos", icono: "business_center", tipo: "seccion" },
        { key: "participaciones", label: "Participaciones", icono: "groups", tipo: "seccion" },
        { key: "calendario", label: "Calendario", icono: "calendar_month", tipo: "seccion" },
      ];

      return this.esPropio ? itemsPropio : itemsAjeno;
    },
  },
  methods: {
    navegar(item) {
      if (item.tipo === "seccion") {
        this.$emit("cambiar-seccion", item.key);
      } else if (item.ruta) {
        this.$emit("navegar-ruta", item.ruta);
      } else {
        this.$emit("navegar-ruta", null);
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
  border: 1px solid #e5e7eb;
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
  border-bottom: 1px solid #f2f2f6;
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
  background: #f7f7fa;
}

.perfil-nav__item--activo {
  background: #ececf5;
  font-weight: 600;
  color: var(--color-primary);
}

.perfil-nav__item .material-symbols-outlined {
  font-size: 1.15rem;
  color: var(--color-text-muted);
}

.perfil-nav__item--activo .material-symbols-outlined {
  color: var(--color-primary);
}

.perfil-nav__item--peligro {
  color: #ef4444;
}

.perfil-nav__item--peligro .material-symbols-outlined {
  color: #ef4444;
}

.perfil-nav__item--peligro:hover {
  background: #fef2f2;
}
</style>
