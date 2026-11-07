<template>
  <div class="auditoria-skeleton" aria-hidden="true">
    <div class="auditoria-skeleton__titulo"></div>
    <div
      v-for="n in filas"
      :key="n"
      class="auditoria-skeleton__fila"
      :style="{ width: anchoFila(n) }"
    ></div>
    <div class="auditoria-skeleton__fila auditoria-skeleton__fila--corta"></div>
  </div>
</template>

<script>
/** Estado de carga del listado (mockup "4 · Cargando" del UC-67). */
export default {
  name: "AuditoriaSkeleton",
  props: {
    filas: { type: Number, default: 4 },
  },
  methods: {
    anchoFila(n) {
      return n === 1 ? "36%" : `${70 + ((n * 7) % 20)}%`;
    },
  },
};
</script>

<style scoped>
.auditoria-skeleton {
  display: grid;
  gap: 1rem;
  padding: 1.25rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: 12px;
}

.auditoria-skeleton__titulo {
  width: 34%;
  height: 0.85rem;
  background: var(--color-skeleton);
  border-radius: 999px;
}

.auditoria-skeleton__fila {
  height: 2.1rem;
  background: var(--color-skeleton);
  border-radius: 0.5rem;
}

.auditoria-skeleton__titulo,
.auditoria-skeleton__fila {
  animation: auditoria-skeleton-pulso 1.2s ease-in-out infinite alternate;
}

.auditoria-skeleton__fila--corta {
  height: 1.6rem;
  width: 45%;
}

@keyframes auditoria-skeleton-pulso {
  from {
    opacity: 1;
  }
  to {
    opacity: 0.55;
  }
}

@media (prefers-reduced-motion: reduce) {
  .auditoria-skeleton__titulo,
  .auditoria-skeleton__fila {
    animation: none;
  }
}
</style>
