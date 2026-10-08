<template>
  <div class="multi-habilidades">
    <VaSelect
      :model-value="modelValue"
      :options="options"
      value-by="idHabilidad"
      text-by="nombre"
      multiple
      clearable
      allow-search
      :label="label"
      placeholder="Seleccioná habilidades"
      :loading="loading"
      :disabled="disabled"
      :no-options-text="textoSinOpciones"
      :error="error"
      :error-messages="errorMessage"
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
.multi-habilidades__aviso {
  margin: 0.3rem 0 0;
  font-size: 0.75rem;
  color: var(--va-secondary);
}
</style>
