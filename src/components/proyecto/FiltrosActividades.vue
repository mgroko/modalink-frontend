<template>
  <div class="filtros-actividades">
    <VaInput
      :model-value="nombre"
      class="filtros-actividades__nombre"
      label="Buscar actividad"
      placeholder="Nombre de la actividad..."
      clearable
      @update:model-value="onNombre"
    >
      <template #prependInner>
        <span class="material-symbols-outlined">search</span>
      </template>
    </VaInput>

    <VaSelect
      :model-value="estados"
      class="filtros-actividades__estados"
      :options="opcionesEstado"
      value-by="value"
      text-by="text"
      label="Estado"
      placeholder="Todos los estados"
      multiple
      clearable
      @update:model-value="onEstados"
    />

    <VaButton
      preset="secondary"
      class="filtros-actividades__limpiar"
      :disabled="!hayFiltros"
      @click="limpiar"
    >
      Limpiar filtros
    </VaButton>

    <VaButton preset="primary" @click="$emit('buscar')">Buscar</VaButton>
  </div>
</template>

<script>
import { OPCIONES_ESTADO_ACTIVIDAD } from "../../utils/actividadConstants.js";

export default {
  name: "FiltrosActividades",
  props: {
    nombre: {
      type: String,
      default: "",
    },
    estados: {
      type: Array,
      default: () => [],
    },
  },
  emits: ["update:nombre", "update:estados", "buscar"],
  computed: {
    opcionesEstado() {
      return OPCIONES_ESTADO_ACTIVIDAD;
    },
    hayFiltros() {
      return String(this.nombre || "").trim() !== "" || this.estados.length > 0;
    },
  },
  methods: {
    onNombre(valor) {
      this.$emit("update:nombre", valor || "");
    },
    onEstados(valor) {
      this.$emit("update:estados", Array.isArray(valor) ? valor : []);
    },
    limpiar() {
      this.$emit("update:nombre", "");
      this.$emit("update:estados", []);
      this.$emit("buscar");
    },
  },
};
</script>

<style scoped>
.filtros-actividades {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.filtros-actividades__nombre {
  flex: 1 1 240px;
  min-width: 200px;
}

.filtros-actividades__estados {
  flex: 0 1 240px;
  min-width: 190px;
}

.filtros-actividades__limpiar {
  margin-bottom: 0.05rem;
}
</style>
