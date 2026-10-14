<template>
  <div class="moodboard">
    <template v-if="mostrarEncabezado">
      <p class="moodboard__titulo">Moodboard</p>
      <p class="moodboard__ayuda">
        Describí la estética general del proyecto: paleta, materiales, inspiración (opcional).
      </p>
    </template>
    <VaTextarea
      :model-value="modelValue"
      label="Descripción (opcional)"
      placeholder="Descripción del tablero..."
      :max-length="200"
      counter
      :rows="3"
      :rules="[reglas.max200]"
      :error="!!error"
      :error-messages="errorMessages"
      @update:model-value="$emit('update:modelValue', $event)"
    />
  </div>
</template>

<script>
import { reglasProyecto } from "../../utils/reglas.js";

export default {
  name: "MoodboardSeccion",
  props: {
    modelValue: {
      type: String,
      default: "",
    },
    error: {
      type: Boolean,
      default: false,
    },
    errorMessages: {
      type: [String, Array],
      default: "",
    },
    mostrarEncabezado: {
      type: Boolean,
      default: true,
    },
  },
  emits: ["update:modelValue"],
  data() {
    return {
      reglas: reglasProyecto,
    };
  },
};
</script>

<style scoped>
.moodboard__titulo {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--va-text-primary);
}

.moodboard__ayuda {
  margin: 0.2rem 0 0.75rem;
  font-size: 0.8rem;
  color: var(--va-secondary);
}
</style>
