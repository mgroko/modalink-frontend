<template>
  <VaInput
    :model-value="modelValue"
    type="number"
    min="1"
    step="1"
    inputmode="numeric"
    :disabled="disabled"
    :rules="rules"
    :error="error ? true : undefined"
    :error-messages="errorMessage || undefined"
    :input-aria-label="ariaLabel"
    class="cantidad-stepper"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #appendInner>
      <span class="cantidad-stepper__controles">
        <button
          type="button"
          class="cantidad-stepper__boton"
          :disabled="disabled || !puedeRestar"
          aria-label="Disminuir cantidad"
          @click="restar"
        >
          −
        </button>
        <button
          type="button"
          class="cantidad-stepper__boton"
          :disabled="disabled"
          aria-label="Aumentar cantidad"
          @click="sumar"
        >
          +
        </button>
      </span>
    </template>
  </VaInput>
</template>

<script>
/*
 * Campo numérico con botones −/+ para la cantidad de personas del
 * requerimiento. Mantiene la validación de Vuestic (reglas del padre) y
 * nunca baja de 1.
 */
export default {
  name: "CantidadStepper",
  props: {
    modelValue: {
      type: [Number, String],
      default: "",
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    error: {
      type: Boolean,
      default: false,
    },
    errorMessage: {
      type: String,
      default: "",
    },
    rules: {
      type: Array,
      default: () => [],
    },
    ariaLabel: {
      type: String,
      default: "Cantidad de personas",
    },
  },
  emits: ["update:modelValue"],
  computed: {
    valorNumerico() {
      const valor = Number(this.modelValue);
      return Number.isFinite(valor) ? valor : null;
    },
    puedeRestar() {
      return this.valorNumerico != null && this.valorNumerico > 1;
    },
  },
  methods: {
    sumar() {
      const base =
        this.valorNumerico == null ? 0 : Math.max(1, Math.trunc(this.valorNumerico));
      this.$emit("update:modelValue", base + 1);
    },
    restar() {
      if (!this.puedeRestar) return;
      this.$emit("update:modelValue", Math.max(1, Math.trunc(this.valorNumerico) - 1));
    },
  },
};
</script>

<style scoped>
.cantidad-stepper :deep(input[type="number"]) {
  appearance: textfield;
  -moz-appearance: textfield;
}

.cantidad-stepper :deep(input[type="number"]::-webkit-outer-spin-button),
.cantidad-stepper :deep(input[type="number"]::-webkit-inner-spin-button) {
  margin: 0;
  -webkit-appearance: none;
}

.cantidad-stepper__controles {
  display: inline-flex;
  gap: 4px;
}

.cantidad-stepper__boton {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: var(--color-surface-muted);
  color: var(--color-text);
  font-family: inherit;
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
  transition: background 0.15s ease;
}

.cantidad-stepper__boton:hover:not(:disabled) {
  background: var(--color-border-strong);
}

.cantidad-stepper__boton:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
}

.cantidad-stepper__boton:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
