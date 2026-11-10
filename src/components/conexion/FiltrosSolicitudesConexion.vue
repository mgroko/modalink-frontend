<template>
  <section class="filtros-solicitudes" aria-label="Filtros de solicitudes de conexión">
    <div class="filtros-solicitudes__fila">
      <VaInput
        class="filtros-solicitudes__campo filtros-solicitudes__campo--buscar"
        :model-value="filtros.nombreArtistico"
        placeholder="Buscar por nombre artístico…"
        aria-label="Buscar solicitudes por nombre artístico"
        clearable
        @update:modelValue="cambiar('nombreArtistico', $event)"
        @keyup.enter="$emit('buscar-ahora')"
      >
        <template #prependInner>
          <span class="material-symbols-outlined filtros-solicitudes__icono">
            search
          </span>
        </template>
      </VaInput>

      <VaSelect
        class="filtros-solicitudes__campo filtros-solicitudes__campo--tamano"
        :model-value="filtros.tamano"
        :options="opcionesTamano"
        value-by="value"
        text-by="text"
        aria-label="Resultados por página"
        @update:modelValue="cambiar('tamano', $event)"
      />

      <button
        type="button"
        class="filtros-solicitudes__limpiar"
        :disabled="!hayFiltrosActivos"
        @click="$emit('limpiar')"
      >
        <span class="material-symbols-outlined" aria-hidden="true">
          filter_alt_off
        </span>
        Limpiar
      </button>
    </div>

    <div
      class="filtros-solicitudes__chips"
      role="group"
      aria-label="Filtrar por estado"
    >
      <button
        v-for="opcion in opcionesEstado"
        :key="opcion.value || 'todas'"
        type="button"
        class="filtros-solicitudes__chip"
        :class="{
          'filtros-solicitudes__chip--activo':
            filtros.estado === opcion.value,
        }"
        :aria-pressed="filtros.estado === opcion.value"
        @click="cambiar('estado', opcion.value)"
      >
        {{ opcion.text }}
        <span>{{ conteo(opcion.clave) }}</span>
      </button>
    </div>
  </section>
</template>

<script>
import {
  OPCIONES_ESTADO_FILTRO,
  OPCIONES_TAMANO,
} from "../../utils/solicitudesConexionConstants.js";
import { TAMANO_POR_DEFECTO } from "../../utils/parametrosSolicitudesConexion.js";

export default {
  name: "FiltrosSolicitudesConexion",
  props: {
    filtros: {
      type: Object,
      required: true,
    },
    conteos: {
      type: Object,
      default: () => ({}),
    },
  },
  emits: ["cambio", "buscar-ahora", "limpiar"],
  data() {
    return {
      opcionesEstado: OPCIONES_ESTADO_FILTRO,
      opcionesTamano: OPCIONES_TAMANO,
    };
  },
  computed: {
    hayFiltrosActivos() {
      return Boolean(
        String(this.filtros.nombreArtistico || "").trim() ||
          this.filtros.estado ||
          Number(this.filtros.tamano) !== TAMANO_POR_DEFECTO
      );
    },
  },
  methods: {
    cambiar(campo, valor) {
      this.$emit("cambio", campo, valor);
    },
    conteo(clave) {
      return Number(this.conteos?.[clave]) || 0;
    },
  },
};
</script>

<style scoped>
.filtros-solicitudes {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.filtros-solicitudes__fila {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.filtros-solicitudes__campo {
  min-width: 0;
}

.filtros-solicitudes__campo--buscar {
  flex: 1 1 260px;
}

.filtros-solicitudes__campo--tamano {
  flex: 0 1 165px;
}

.filtros-solicitudes__icono {
  font-size: 1.1rem;
  color: var(--color-text-muted);
}

.filtros-solicitudes__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.filtros-solicitudes__chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-height: 32px;
  padding: 0 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
}

.filtros-solicitudes__chip span {
  opacity: 0.7;
}

.filtros-solicitudes__chip--activo {
  border-color: var(--color-primary);
  background: var(--color-chip);
  color: var(--color-primary);
}

.filtros-solicitudes__limpiar {
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

.filtros-solicitudes__limpiar:disabled {
  opacity: 0.45;
  cursor: default;
}

.filtros-solicitudes__limpiar .material-symbols-outlined {
  font-size: 1rem;
}
</style>
