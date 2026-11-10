<template>
  <section class="filtros-publicaciones" aria-label="Filtros de publicaciones">
    <div class="filtros-publicaciones__grilla">
      <VaInput
        :model-value="filtros.titulo"
        class="filtros-publicaciones__campo"
        label="Título"
        placeholder="Buscar por título"
        clearable
        @update:model-value="cambiar('titulo', $event)"
        @keyup.enter="$emit('buscar')"
      />

      <VaInput
        :model-value="filtros.descripcion"
        class="filtros-publicaciones__campo"
        label="Descripción"
        placeholder="Buscar por descripción"
        clearable
        @update:model-value="cambiar('descripcion', $event)"
        @keyup.enter="$emit('buscar')"
      />

      <div class="filtros-publicaciones__fechas">
        <span class="filtros-publicaciones__grupo-label">Fecha de publicación</span>
        <div class="filtros-publicaciones__fechas-campos">
          <VaInput
            :model-value="filtros.fechaDesde"
            class="filtros-publicaciones__fecha"
            label="Desde"
            type="date"
            :error="!!errorFechas"
            @update:model-value="cambiar('fechaDesde', $event)"
            @keyup.enter="$emit('buscar')"
          />
          <VaInput
            :model-value="filtros.fechaHasta"
            class="filtros-publicaciones__fecha"
            label="Hasta"
            type="date"
            :error="!!errorFechas"
            @update:model-value="cambiar('fechaHasta', $event)"
            @keyup.enter="$emit('buscar')"
          />
        </div>
      </div>

      <VaSelect
        :model-value="filtros.idProyecto"
        class="filtros-publicaciones__campo"
        label="Proyecto"
        placeholder="Todos los proyectos"
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

      <div class="filtros-publicaciones__acciones">
        <VaButton
          preset="secondary"
          :disabled="cargando || (!hayFiltros && pagina === 0)"
          @click="$emit('limpiar')"
        >
          Limpiar filtros
        </VaButton>
        <VaButton :loading="cargando" :disabled="cargando" @click="$emit('buscar')">
          Buscar
        </VaButton>
      </div>
    </div>

    <p v-if="errorFechas" class="filtros-publicaciones__error" role="alert">
      {{ errorFechas }}
    </p>
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
    pagina: {
      type: Number,
      default: 0,
    },
    cargando: {
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
  margin-bottom: 1rem;
  padding: 0.85rem 0.95rem;
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border-soft);
  border-radius: 10px;
}

.filtros-publicaciones__grilla {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0.65rem;
}

.filtros-publicaciones__campo {
  flex: 1 1 150px;
  min-width: 140px;
}

.filtros-publicaciones__fechas {
  display: flex;
  flex: 1 1 240px;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 220px;
}

.filtros-publicaciones__grupo-label {
  color: var(--color-text-muted);
  font-size: 0.72rem;
  font-weight: 600;
}

.filtros-publicaciones__fechas-campos {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.45rem;
}

.filtros-publicaciones__fecha {
  min-width: 0;
}

.filtros-publicaciones__acciones {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
  padding-bottom: 0.05rem;
  white-space: nowrap;
}

.filtros-publicaciones__error {
  margin: 0;
  color: var(--color-danger-text);
  font-size: 0.76rem;
}

@media (max-width: 620px) {
  .filtros-publicaciones__campo,
  .filtros-publicaciones__fechas {
    flex-basis: 100%;
    min-width: 0;
  }

  .filtros-publicaciones__acciones {
    align-items: stretch;
    width: 100%;
    margin-left: 0;
  }

  .filtros-publicaciones__acciones > .va-button {
    flex: 1;
  }
}
</style>
