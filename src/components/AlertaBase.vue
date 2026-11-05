<template>
  <div
    v-if="message"
    class="alerta-base mt-4"
    :class="`alerta-base--${type}`"
    role="alert"
  >
    <span class="material-symbols-outlined alerta-base__icono" aria-hidden="true">
      {{ config.icon }}
    </span>
    <span class="alerta-base__texto">{{ message }}</span>
  </div>
</template>

<script>
export default {
  name: "BaseAlert",
  props: {
    message: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      required: true,
      validator: (value) => ["success", "error", "warning"].includes(value),
    },
  },
  computed: {
    config() {
      if (this.type === "success") {
        return { icon: "check_circle" };
      }
      if (this.type === "warning") {
        return { icon: "warning" };
      }
      return { icon: "error" };
    },
  },
};
</script>

<style scoped>
.alerta-base {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 0.9rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  line-height: 1.4;
}

.alerta-base--success {
  color: var(--color-success-text);
  background: var(--color-success-soft);
}

.alerta-base--error {
  color: var(--color-danger-text);
  background: var(--color-danger-soft);
}

.alerta-base--warning {
  color: var(--color-warning-text);
  background: var(--color-warning-soft);
}

.alerta-base__icono {
  flex-shrink: 0;
  font-size: 1.15rem;
}

.alerta-base__texto {
  min-width: 0;
}
</style>
