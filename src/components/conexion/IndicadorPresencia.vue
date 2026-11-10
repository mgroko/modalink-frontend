<template>
  <span
    class="indicador-presencia"
    :class="{ 'indicador-presencia--online': enLinea }"
  >
    <span class="indicador-presencia__punto" aria-hidden="true"></span>
    <span v-if="mostrarTexto">{{ texto }}</span>
  </span>
</template>

<script>
export default {
  name: "IndicadorPresencia",
  props: {
    enLinea: {
      type: Boolean,
      default: false,
    },
    mostrarTexto: {
      type: Boolean,
      default: true,
    },
  },
  computed: {
    texto() {
      return this.enLinea ? "En línea" : "Desconectado";
    },
  },
};
</script>

<style scoped>
.indicador-presencia {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--color-text-muted);
  font-size: 0.76rem;
  font-weight: 600;
  line-height: 1.2;
}

.indicador-presencia__punto {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-text-subtle);
  flex-shrink: 0;
}

.indicador-presencia--online {
  color: var(--color-success-text);
}

.indicador-presencia--online .indicador-presencia__punto {
  background: #22c55e;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.12);
}
</style>
