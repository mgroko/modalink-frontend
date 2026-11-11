<template>
  <section class="filtros-publicaciones" aria-label="Filtros de publicaciones">
    <div class="filtros-publicaciones__grilla">
      <VaInput
        :model-value="filtros.texto"
        class="filtros-publicaciones__busqueda"
        placeholder="Buscar por título o descripción"
        clearable
        aria-label="Buscar publicaciones por título o descripción"
        @update:model-value="cambiar('texto', $event)"
        @keyup.enter="$emit('buscar')"
      >
        <template #prependInner>
          <span class="material-symbols-outlined" aria-hidden="true">
            search
          </span>
        </template>
      </VaInput>

      <VaSelect
        :model-value="filtros.idProyecto"
        class="filtros-publicaciones__proyecto"
        placeholder="Todos los proyectos"
        aria-label="Filtrar por proyecto"
        :options="proyectos"
        value-by="idProyecto"
        text-by="nombre"
        :loading="cargandoProyectos"
        :error="!!errorProyectos"
        :error-messages="errorProyectos || undefined"
        allow-search
        clearable
        no-options-text="No hay proyectos para filtrar"
        @update:model-value="cambiar('idProyecto', $event)"
      />

      <div class="filtros-publicaciones__fechas">
        <VaInput
          :model-value="filtros.fechaDesde"
          class="filtros-publicaciones__fecha"
          type="date"
          aria-label="Fecha de publicación desde"
          :error="!!errorFechas"
          @update:model-value="cambiar('fechaDesde', $event)"
          @keyup.enter="$emit('buscar')"
        >
          <template #prependInner>
            <span class="material-symbols-outlined" aria-hidden="true">
              calendar_month
            </span>
          </template>
        </VaInput>

        <span class="filtros-publicaciones__guion" aria-hidden="true">—</span>

        <VaInput
          :model-value="filtros.fechaHasta"
          class="filtros-publicaciones__fecha"
          type="date"
          aria-label="Fecha de publicación hasta"
          :error="!!errorFechas"
          @update:model-value="cambiar('fechaHasta', $event)"
          @keyup.enter="$emit('buscar')"
        >
          <template #prependInner>
            <span class="material-symbols-outlined" aria-hidden="true">
              calendar_month
            </span>
          </template>
        </VaInput>
      </div>
    </div>

    <div class="filtros-publicaciones__pie">
      <button
        type="button"
        class="filtros-publicaciones__limpiar"
        :disabled="!hayFiltros"
        @click="$emit('limpiar')"
      >
        Limpiar
      </button>

      <p
        v-if="errorFechas"
        class="filtros-publicaciones__error"
        role="alert"
      >
        {{ errorFechas }}
      </p>
    </div>
  </section>
</template>

<script>
export default {
  name: "FiltrosPublicaciones",
  props: {
    filtros: {
      type: Object,
      required: true,
    },
    proyectos: {
      type: Array,
      default: () => [],
    },
    cargandoProyectos: {
      type: Boolean,
      default: false,
    },
    errorProyectos: {
      type: String,
      default: "",
    },
    errorFechas: {
      type: String,
      default: "",
    },
    hayFiltros: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["cambio", "buscar", "limpiar"],
  methods: {
    cambiar(campo, valor) {
      this.$emit("cambio", { campo, valor });
    },
  },
};
</script>

<style scoped>
.filtros-publicaciones {
  display: grid;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}

.filtros-publicaciones__grilla {
  display: grid;
  grid-template-columns: minmax(220px, 1.4fr) minmax(160px, 1fr) minmax(280px, 1.2fr);
  align-items: center;
  gap: 0.65rem;
}

.filtros-publicaciones__busqueda,
.filtros-publicaciones__proyecto {
  min-width: 0;
}

.filtros-publicaciones__fechas {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 0.45rem;
  min-width: 0;
}

.filtros-publicaciones__fecha {
  min-width: 0;
}

.filtros-publicaciones__guion {
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.filtros-publicaciones__pie {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  min-height: 1.6rem;
}

.filtros-publicaciones__limpiar {
  padding: 0;
  color: var(--color-primary);
  background: none;
  border: 0;
  font: inherit;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
}

.filtros-publicaciones__limpiar:hover:not(:disabled) {
  text-decoration: underline;
}

.filtros-publicaciones__limpiar:disabled {
  color: var(--color-text-subtle);
  cursor: default;
}

.filtros-publicaciones__error {
  margin: 0;
  color: var(--color-danger-text);
  font-size: 0.76rem;
}

@media (max-width: 980px) {
  .filtros-publicaciones__grilla {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }

  .filtros-publicaciones__busqueda,
  .filtros-publicaciones__fechas {
    grid-column: 1 / -1;
  }
}

@media (max-width: 620px) {
  .filtros-publicaciones__grilla {
    grid-template-columns: 1fr;
  }

  .filtros-publicaciones__busqueda,
  .filtros-publicaciones__fechas {
    grid-column: auto;
  }

  .filtros-publicaciones__fechas {
    grid-template-columns: 1fr;
  }

  .filtros-publicaciones__guion {
    display: none;
  }
}
</style>
