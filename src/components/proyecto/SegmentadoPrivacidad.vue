<template>
  <div class="segmentado-privacidad">
    <span class="segmentado-privacidad__label">{{ label }}</span>
    <VaRadio
      :model-value="modelValue"
      :options="opciones"
      text-by="label"
      value-by="value"
      :vertical="false"
      :disabled="disabled"
      class="segmentado-privacidad__radio"
      @update:model-value="onCambio"
    />
    <ul class="segmentado-privacidad__ayuda">
      <li>*Un proyecto público es visible para toda la comunidad</li>
      <li>*Un proyecto privado es visible únicamente para tus contactos</li>
    </ul>
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

.segmentado-privacidad__radio {
  gap: 1.5rem !important;
}

.segmentado-privacidad__ayuda {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 0.72rem;
  color: var(--color-text-muted, #6b6980);
}
</style>
