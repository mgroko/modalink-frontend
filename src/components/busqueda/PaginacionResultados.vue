<template>
  <div
    v-if="!esTodos && paginacion.totalPaginas > 1"
    class="buscar-paginacion"
  >
    <VaButton
      preset="secondary"
      size="small"
      icon="mso-chevron_left"
      :disabled="paginacion.primera"
      @click="$emit('cambiar', -1)"
    >
      Anterior
    </VaButton>
    <span class="buscar-paginacion__texto">
      {{ paginacion.paginaActual + 1 }} / {{ paginacion.totalPaginas }}
    </span>
    <VaButton
      preset="secondary"
      size="small"
      icon-right="mso-chevron_right"
      :disabled="paginacion.ultima"
      @click="$emit('cambiar', 1)"
    >
      Siguiente
    </VaButton>
  </div>
</template>

<script>
/*
 * Paginación reutilizable de la búsqueda unificada.
 */
export default {
  name: "PaginacionResultados",
  props: {
    paginacion: {
      type: Object,
      required: true,
    },
    esTodos: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["cambiar"],
};
</script>

<style scoped>
.buscar-paginacion {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.buscar-paginacion__texto {
  color: var(--color-text-muted);
  font-size: 0.78rem;
  font-weight: 600;
}
</style>
