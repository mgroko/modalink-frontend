<template>
  <div class="segmentado-privacidad">
    <span class="segmentado-privacidad__label">{{ label }}</span>
    <VaButtonGroup class="segmentado-privacidad__grupo">
      <VaButton
        v-for="opcion in opciones"
        :key="opcion.value"
        :preset="modelValue === opcion.value ? 'default' : 'secondary'"
        size="small"
        :disabled="disabled"
        :aria-pressed="modelValue === opcion.value"
        @click="onCambio(opcion.value)"
      >
        {{ opcion.label }}
      </VaButton>
    </VaButtonGroup>
    <p class="segmentado-privacidad__ayuda">Elegí quién puede ver el proyecto.</p>
  </div>
</template>

<script>
import { PRIVACIDADES, ETIQUETAS_PRIVACIDAD } from "../../utils/proyectoConstants.js";

export default {
  name: "SegmentadoPrivacidad",
  props: {
    modelValue: {
      type: String,
      default: PRIVACIDADES.PUBLICO,
    },
    label: {
      type: String,
      default: "Privacidad del proyecto",
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["update:modelValue"],
  data() {
    return {
      opciones: Object.values(PRIVACIDADES).map((value) => ({
        value,
        label: ETIQUETAS_PRIVACIDAD[value],
      })),
    };
  },
  methods: {
    onCambio(valor) {
      this.$emit("update:modelValue", valor);
    },
  },
};
</script>

<style scoped>
.segmentado-privacidad {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.segmentado-privacidad__label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--va-text-primary);
}

.segmentado-privacidad__grupo {
  align-self: flex-start;
}

.segmentado-privacidad__grupo :deep(.va-button--pressed),
.segmentado-privacidad__grupo :deep(.va-button[aria-pressed="true"]) {
  font-weight: 600;
}

.segmentado-privacidad__ayuda {
  margin: 0;
  font-size: 0.75rem;
  color: var(--va-secondary);
}
</style>
