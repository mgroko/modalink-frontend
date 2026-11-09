<template>
  <section class="filtros-conexiones" aria-label="Filtros de conexiones">
    <div class="filtros-conexiones__fila">
      <VaInput
        class="filtros-conexiones__campo filtros-conexiones__campo--buscar"
        :model-value="filtros.texto"
        placeholder="Buscar por nombre o profesión…"
        aria-label="Buscar conexiones"
        clearable
        @update:modelValue="cambiar('texto', $event)"
        @keyup.enter="$emit('buscar-ahora')"
      >
        <template #prependInner>
          <span class="material-symbols-outlined filtros-conexiones__icono">
            search
          </span>
        </template>
      </VaInput>

      <div
        class="filtros-conexiones__segmentos"
        role="group"
        aria-label="Estado de presencia"
      >
        <button
          v-for="opcion in opcionesPresencia"
          :key="opcion.value || 'todos'"
          type="button"
          class="filtros-conexiones__segmento"
          :class="{
            'filtros-conexiones__segmento--activo':
              filtros.estadoPresencia === opcion.value,
          }"
          :aria-pressed="filtros.estadoPresencia === opcion.value"
          @click="cambiar('estadoPresencia', opcion.value)"
        >
          {{ opcion.text }}
        </button>
      </div>

      <VaSelect
        class="filtros-conexiones__campo filtros-conexiones__campo--tamano"
        :model-value="filtros.tamano"
        :options="opcionesTamano"
        value-by="value"
        text-by="text"
        aria-label="Resultados por página"
        @update:modelValue="cambiar('tamano', $event)"
      />

      <button
        type="button"
        class="filtros-conexiones__limpiar"
        :disabled="!hayFiltrosActivos"
        @click="$emit('limpiar')"
      >
        <span class="material-symbols-outlined" aria-hidden="true">
          filter_alt_off
        </span>
        Limpiar
      </button>
    </div>

    <div v-if="profesiones.length" class="filtros-conexiones__profesiones">
      <button
        v-for="profesion in profesiones"
        :key="profesion.idProfesion"
        type="button"
        class="filtros-conexiones__chip"
        :class="{
          'filtros-conexiones__chip--activo':
            filtros.idProfesion === profesion.idProfesion,
        }"
        :aria-pressed="filtros.idProfesion === profesion.idProfesion"
        @click="$emit('seleccionar-profesion', profesion.idProfesion)"
      >
        {{ profesion.nombre }}
        <span>{{ profesion.cantidad }}</span>
      </button>
    </div>
  </section>
</template>

<script>
import {
  OPCIONES_PRESENCIA,
} from "../../utils/conexionesConstants.js";
import {
  OPCIONES_TAMANO,
} from "../../utils/parametrosConexiones.js";

export default {
  name: "FiltrosConexiones",
  props: {
    filtros: {
      type: Object,
      required: true,
    },
    profesiones: {
      type: Array,
      default: () => [],
    },
  },
  emits: ["cambio", "buscar-ahora", "limpiar", "seleccionar-profesion"],
  data() {
    return {
      opcionesPresencia: OPCIONES_PRESENCIA,
      opcionesTamano: OPCIONES_TAMANO,
    };
  },
  computed: {
    hayFiltrosActivos() {
      return Boolean(
        String(this.filtros.texto || "").trim() ||
          this.filtros.idProfesion != null ||
          this.filtros.estadoPresencia ||
          Number(this.filtros.tamano) !== 20
      );
    },
  },
  methods: {
    cambiar(campo, valor) {
      this.$emit("cambio", campo, valor);
    },
  },
};
</script>

<style scoped>
.filtros-conexiones {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.filtros-conexiones__fila {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.filtros-conexiones__campo {
  min-width: 0;
}

.filtros-conexiones__campo--buscar {
  flex: 1 1 260px;
}

.filtros-conexiones__campo--tamano {
  flex: 0 1 165px;
}

.filtros-conexiones__icono {
  font-size: 1.1rem;
  color: var(--color-text-muted);
}

.filtros-conexiones__segmentos {
  display: inline-flex;
  padding: 0.25rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface-soft);
}

.filtros-conexiones__segmento {
  min-height: 34px;
  padding: 0 0.75rem;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
}

.filtros-conexiones__segmento:hover {
  color: var(--color-text);
}

.filtros-conexiones__segmento--activo {
  background: var(--color-surface);
  color: var(--color-primary);
  box-shadow: 0 1px 2px rgba(20, 20, 43, 0.08);
}

.filtros-conexiones__limpiar {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
}

.filtros-conexiones__limpiar:disabled {
  opacity: 0.45;
  cursor: default;
}

.filtros-conexiones__limpiar .material-symbols-outlined {
  font-size: 1rem;
}

.filtros-conexiones__profesiones {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.filtros-conexiones__chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-height: 30px;
  padding: 0 0.7rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
}

.filtros-conexiones__chip span {
  opacity: 0.7;
}

.filtros-conexiones__chip--activo {
  border-color: var(--color-primary);
  background: var(--color-chip);
  color: var(--color-primary);
}
</style>
