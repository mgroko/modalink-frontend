<template>
  <div class="progreso-firmas" aria-label="Progreso de firmas">
    <div class="progreso-firmas__cabecera">
      <span class="progreso-firmas__texto">
        {{ firmados }} de {{ total }} firmas
      </span>
      <span class="progreso-firmas__porcentaje">{{ porcentaje }}%</span>
    </div>

    <div
      class="progreso-firmas__barra"
      role="progressbar"
      :aria-valuenow="porcentaje"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <span
        class="progreso-firmas__relleno"
        :style="{ width: `${porcentaje}%` }"
      ></span>
    </div>
  </div>
</template>

<script>
export default {
  name: "ProgresoFirmasContrato",
  props: {
    firmados: {
      type: [Number, String],
      default: 0,
    },
    totalPartes: {
      type: [Number, String],
      default: 0,
    },
  },
  computed: {
    firmadosSeguros() {
      const numero = Number(this.firmados);
      return Number.isFinite(numero) && numero > 0 ? numero : 0;
    },
    total() {
      const numero = Number(this.totalPartes);
      return Number.isFinite(numero) && numero > 0 ? numero : 0;
    },
    porcentaje() {
      if (!this.total) return 0;
      return Math.min(100, Math.round((this.firmadosSeguros / this.total) * 100));
    },
  },
};
</script>

<style scoped>
.progreso-firmas {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.progreso-firmas__cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.progreso-firmas__texto {
  color: var(--color-text);
  font-size: 0.82rem;
  font-weight: 600;
}

.progreso-firmas__porcentaje {
  color: var(--color-text-muted);
  font-size: 0.76rem;
}

.progreso-firmas__barra {
  width: 100%;
  height: 7px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--color-surface-muted);
}

.progreso-firmas__relleno {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--color-primary);
  transition: width 0.2s ease;
}
</style>
