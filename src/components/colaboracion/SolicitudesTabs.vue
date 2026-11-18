<template>
  <div class="solicitudes-tabs" role="tablist" aria-label="Solicitudes">
    <button
      v-for="tab in tabs"
      :key="tab.value"
      type="button"
      class="solicitudes-tabs__tab"
      :class="{ 'solicitudes-tabs__tab--activa': tab.value === activa }"
      role="tab"
      :aria-selected="tab.value === activa ? 'true' : 'false'"
      @click="$emit('cambiar', tab.value)"
    >
      {{ tab.label }}
      <span class="solicitudes-tabs__contador">{{ tab.total }}</span>
    </button>
  </div>
</template>

<script>
/*
 * Navegación compartida entre /solicitudes y /colaboraciones-automaticas.
 * Cada vista decide cómo resolver la ruta al recibir `cambiar`.
 */
export default {
  name: "SolicitudesTabs",
  props: {
    activa: {
      type: String,
      default: "invitaciones",
    },
    invitaciones: {
      type: Number,
      default: 0,
    },
    colaboraciones: {
      type: Number,
      default: 0,
    },
    automaticas: {
      type: Number,
      default: 0,
    },
  },
  emits: ["cambiar"],
  computed: {
    tabs() {
      return [
        {
          value: "invitaciones",
          label: "Invitaciones",
          total: this.invitaciones,
        },
        {
          value: "colaboraciones",
          label: "Colaboraciones",
          total: this.colaboraciones,
        },
        {
          value: "automaticas",
          label: "Automáticas",
          total: this.automaticas,
        },
      ];
    },
  },
};
</script>

<style scoped>
.solicitudes-tabs {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  padding: 0.25rem;
  margin-bottom: 1rem;
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border-soft);
  border-radius: 10px;
}

.solicitudes-tabs__tab {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem 0.9rem;
  color: var(--color-text-muted);
  background: transparent;
  border: 0;
  border-radius: 8px;
  font: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.solicitudes-tabs__tab:hover,
.solicitudes-tabs__tab:focus-visible {
  color: var(--color-text);
  outline: none;
}

.solicitudes-tabs__tab--activa {
  color: var(--color-on-primary);
  background: var(--color-primary);
}

.solicitudes-tabs__contador {
  display: inline-flex;
  min-width: 1.2rem;
  height: 1.2rem;
  align-items: center;
  justify-content: center;
  padding: 0 0.3rem;
  color: var(--color-text-muted);
  background: var(--color-surface);
  border-radius: 999px;
  font-size: 0.65rem;
  font-weight: 700;
}

.solicitudes-tabs__tab--activa .solicitudes-tabs__contador {
  color: var(--color-primary);
  background: var(--color-on-primary);
}
</style>
