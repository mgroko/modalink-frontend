<template>
  <section class="auditoria-filtros" aria-label="Filtros de auditoría">
    <h2 class="auditoria-filtros__titulo">Filtros</h2>

    <div class="auditoria-filtros__campos">
      <VaInput
        :model-value="fechaDesde"
        class="auditoria-filtros__campo"
        label="Desde"
        type="date"
        @update:modelValue="emitirCampo('fechaDesde', $event)"
      />
      <VaInput
        :model-value="fechaHasta"
        class="auditoria-filtros__campo"
        label="Hasta"
        type="date"
        @update:modelValue="emitirCampo('fechaHasta', $event)"
      />

      <div class="auditoria-filtros__tipos">
        <span class="auditoria-filtros__label">
          Tipos de evento <small>(vacío = todos)</small>
        </span>
        <SelectorTiposEvento
          :model-value="modelValue.tipos"
          :catalogo="catalogo"
          :cargando-catalogo="cargandoCatalogo"
          @update:modelValue="emitirCampo('tipos', $event)"
        />
      </div>

      <div class="auditoria-filtros__acciones">
        <VaButton
          preset="secondary"
          :loading="consultando"
          :disabled="consultando"
          @click="$emit('limpiar')"
        >
          Limpiar filtros
        </VaButton>
        <VaButton
          :loading="consultando"
          :disabled="consultando"
          @click="$emit('consultar')"
        >
          Consultar
        </VaButton>
      </div>
    </div>

    <p class="auditoria-filtros__nota">
      Rango máximo vigente: {{ rangoMaximo }} días. Por defecto se muestran los
      últimos 7 días.
    </p>
  </section>
</template>

<script>
import SelectorTiposEvento from "./SelectorTiposEvento.vue";
import { AUDITORIA_RANGO_MAX_DIAS } from "../../../utils/auditoriaConstants";

/**
 * Barra de filtros de UC-67. La vista mantiene el estado borrador; acá solo
 * se propaga (los cambios no disparan la consulta: eso lo hace "Consultar").
 */
export default {
  name: "AuditoriaFiltros",
  components: { SelectorTiposEvento },
  props: {
    modelValue: {
      type: Object,
      required: true,
      // { fechaDesde, fechaHasta, tipos: [] }
    },
    catalogo: { type: Array, default: () => [] },
    cargandoCatalogo: { type: Boolean, default: false },
    consultando: { type: Boolean, default: false },
  },
  emits: ["update:modelValue", "consultar", "limpiar"],
  data() {
    return {
      rangoMaximo: AUDITORIA_RANGO_MAX_DIAS,
    };
  },
  computed: {
    fechaDesde() {
      return this.modelValue?.fechaDesde || "";
    },
    fechaHasta() {
      return this.modelValue?.fechaHasta || "";
    },
  },
  methods: {
    emitirCampo(campo, valor) {
      this.$emit("update:modelValue", {
        ...this.modelValue,
        [campo]: valor,
      });
    },
  },
};
</script>

<style scoped>
.auditoria-filtros {
  display: grid;
  gap: 0.75rem;
  padding: 1rem 1.15rem 1.1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: 12px;
}

.auditoria-filtros__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1.05rem;
  font-weight: 800;
}

.auditoria-filtros__campos {
  display: grid;
  grid-template-columns: 1fr 1fr minmax(220px, 1.6fr) auto;
  align-items: end;
  gap: 0.75rem;
}

.auditoria-filtros__tipos {
  display: grid;
  gap: 0.3rem;
  min-width: 0;
}

.auditoria-filtros__label {
  color: var(--color-text-muted);
  font-size: 0.72rem;
  font-weight: 600;
}

.auditoria-filtros__label small {
  color: var(--color-text-subtle);
  font-weight: 400;
}

.auditoria-filtros__acciones {
  display: flex;
  gap: 0.6rem;
  align-self: end;
  white-space: nowrap;
}

.auditoria-filtros__nota {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.78rem;
}

@media (max-width: 980px) {
  .auditoria-filtros__campos {
    grid-template-columns: 1fr 1fr;
  }

  .auditoria-filtros__tipos {
    grid-column: span 2;
  }

  .auditoria-filtros__acciones {
    justify-content: flex-end;
  }
}

@media (max-width: 560px) {
  .auditoria-filtros__campos {
    grid-template-columns: 1fr;
  }

  .auditoria-filtros__tipos {
    grid-column: auto;
  }

  .auditoria-filtros__acciones {
    width: 100%;
  }

  .auditoria-filtros__acciones > .va-button {
    flex: 1;
  }
}
</style>
