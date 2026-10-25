<template>
  <div class="multi-habilidades">
    <template v-if="ayuda">
      <p class="multi-habilidades__label">{{ label }}</p>
      <p class="multi-habilidades__ayuda-texto">{{ ayuda }}</p>
    </template>
    <VaSelect
      :model-value="modelValue"
      :options="options"
      value-by="idHabilidad"
      text-by="nombre"
      multiple
      clearable
      allow-search
      :label="ayuda ? '' : label"
      placeholder="Seleccionar habilidades"
      :loading="loading"
      :disabled="disabled"
      :no-options-text="textoSinOpciones"
      :error="error || undefined"
      :error-messages="errorMessage || undefined"
      @update:model-value="onCambio"
    />
    <p v-if="!loading && options.length === 0" class="multi-habilidades__aviso">
      El catálogo de habilidades aún no está disponible.
    </p>
  </div>
</template>

<script>
export default {
  name: "MultiSelectHabilidades",
  props: {
    modelValue: {
      type: Array,
      default: () => [],
    },
    options: {
      type: Array,
      default: () => [],
    },
    label: {
      type: String,
      default: "Habilidades",
    },
    ayuda: {
      type: String,
      default: "",
    },
    loading: {
      type: Boolean,
      default: false,
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
  },
  emits: ["update:modelValue"],
  computed: {
    textoSinOpciones() {
      return this.loading ? "Cargando habilidades..." : "No hay habilidades disponibles";
    },
  },
  methods: {
    onCambio(valor) {
      this.$emit("update:modelValue", Array.isArray(valor) ? valor : []);
    },
  },
};
</script>

<style scoped>
.multi-habilidades__label {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--va-text-primary);
}

.multi-habilidades__ayuda-texto {
  margin: 0.1rem 0 0.35rem;
  font-size: 0.75rem;
  color: var(--va-secondary);
}

.multi-habilidades__aviso {
  margin: 0.3rem 0 0;
  font-size: 0.75rem;
  color: var(--va-secondary);
}
</style>
