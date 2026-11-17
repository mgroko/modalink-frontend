<template>
  <AdminTablaPanel>
    <template v-if="$slots.toolbar" #toolbar>
      <slot name="toolbar" />
    </template>

    <div v-if="loading" class="admin-tabla-filtrable__estado">
      <span class="material-symbols-outlined" aria-hidden="true">hourglass_empty</span>
      Cargando…
    </div>

    <div v-else-if="!items.length" class="admin-tabla-filtrable__estado">
      <span class="material-symbols-outlined" aria-hidden="true">inbox</span>
      {{ emptyText }}
    </div>

    <VaDataTable
      v-else
      class="admin-tabla-filtrable__tabla"
      :items="filasFiltradas"
      :columns="columnasTabla"
      :per-page="pageSize"
      :current-page="paginaActual"
      no-data-html="No hay resultados con los filtros aplicados."
      hoverable
    >
      <template #headerAppend>
        <tr class="admin-tabla-filtrable__filtros">
          <th v-for="columna in columns" :key="`filtro-${columna.key}`">
            <select
              v-if="columna.filter && columna.filter.type === 'select'"
              v-model="filtros[columna.key]"
              class="admin-tabla-filtrable__select"
              :aria-label="`Filtrar ${columna.label}`"
            >
              <option value="">Todos</option>
              <option
                v-for="opcion in columna.filter.options || []"
                :key="opcion.value"
                :value="opcion.value"
              >
                {{ opcion.text }}
              </option>
            </select>

            <input
              v-else-if="columna.filter"
              v-model="filtros[columna.key]"
              type="search"
              class="admin-tabla-filtrable__input"
              :placeholder="columna.filter.placeholder || 'Filtrar'"
              :aria-label="`Filtrar ${columna.label}`"
            />
          </th>
        </tr>
      </template>

      <template
        v-for="(_, nombre) in $slots"
        :key="nombre"
        #[nombre]="slotProps"
      >
        <slot :name="nombre" v-bind="slotProps || {}" />
      </template>
    </VaDataTable>

    <template #footer>
      <span class="admin-tabla-filtrable__info">
        <template v-if="totalFiltrados > 0">
          Mostrando {{ inicio }}–{{ fin }} de {{ totalFiltrados }} {{ entidad }}
        </template>
        <template v-else>0 {{ entidad }}</template>
      </span>

      <VaPagination
        v-if="paginas > 1"
        v-model="pagina"
        :total="totalFiltrados"
        :page-size="pageSize"
        :visible-pages="5"
        boundary-links
        direction-links
      />
    </template>
  </AdminTablaPanel>
</template>

<script>
import AdminTablaPanel from "./AdminTablaPanel.vue";

function normalizar(valor) {
  return String(valor ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/*
 * Tabla administrativa con orden por columna (flechas) y un filtro compacto
 * por columna. Trabaja del lado del cliente: el padre le pasa todas las filas
 * y este componente se encarga de filtrar, ordenar y paginar.
 *
 * `columns` admite:
 *   { key, label, sortable, sortingFn?, value?(item) → valor para filtrar/ordenar,
 *     filter?: { type: "text"|"select", options?: {value,text}[], placeholder? } }
 */
export default {
  name: "AdminTablaFiltrable",
  components: { AdminTablaPanel },
  props: {
    columns: {
      type: Array,
      required: true,
    },
    items: {
      type: Array,
      default: () => [],
    },
    loading: {
      type: Boolean,
      default: false,
    },
    emptyText: {
      type: String,
      default: "No hay registros para mostrar.",
    },
    entidad: {
      type: String,
      default: "registros",
    },
    pageSize: {
      type: Number,
      default: 10,
    },
    /** Búsqueda global (ej. nombre del proyecto). */
    busqueda: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      filtros: {},
      pagina: 1,
    };
  },
  computed: {
    columnasTabla() {
      return this.columns.map((columna) => {
        const columnaTabla = {
          key: columna.key,
          label: columna.label,
          sortable: columna.sortable !== false,
        };
        if (typeof columna.sortingFn === "function") {
          columnaTabla.sortingFn = columna.sortingFn;
        }
        return columnaTabla;
      });
    },
    filasFiltradas() {
      const terminoGlobal = normalizar(this.busqueda);

      return this.items.filter((item) => {
        if (
          terminoGlobal &&
          !this.columns.some((columna) =>
            normalizar(this.valorDe(columna, item)).includes(terminoGlobal)
          )
        ) {
          return false;
        }

        return this.columns.every((columna) =>
          this.cumpleFiltro(columna, item)
        );
      });
    },
    totalFiltrados() {
      return this.filasFiltradas.length;
    },
    paginas() {
      return Math.max(1, Math.ceil(this.totalFiltrados / this.pageSize));
    },
    paginaActual() {
      return Math.min(this.pagina, this.paginas);
    },
    inicio() {
      if (!this.totalFiltrados) return 0;
      return (this.paginaActual - 1) * this.pageSize + 1;
    },
    fin() {
      return Math.min(this.paginaActual * this.pageSize, this.totalFiltrados);
    },
  },
  watch: {
    items() {
      this.pagina = 1;
    },
    busqueda() {
      this.pagina = 1;
    },
    filtros: {
      deep: true,
      handler() {
        this.pagina = 1;
      },
    },
  },
  created() {
    const filtros = {};
    for (const columna of this.columns) {
      if (columna.filter) filtros[columna.key] = "";
    }
    this.filtros = filtros;
  },
  methods: {
    valorDe(columna, item) {
      if (typeof columna.value === "function") return columna.value(item);
      return item?.[columna.key];
    },
    cumpleFiltro(columna, item) {
      if (!columna.filter) return true;
      const elegido = this.filtros[columna.key];
      if (elegido === "" || elegido == null) return true;

      const valor = this.valorDe(columna, item);
      if (columna.filter.type === "select") {
        return String(valor) === String(elegido);
      }
      return normalizar(valor).includes(normalizar(elegido));
    },
  },
};
</script>

<style scoped>
.admin-tabla-filtrable__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  text-align: center;
}

.admin-tabla-filtrable__estado .material-symbols-outlined {
  font-size: 2.25rem;
}

.admin-tabla-filtrable__info {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.admin-tabla-filtrable__filtros th {
  padding: 0.15rem 0.5rem 0.55rem;
  background: var(--color-surface-soft);
}

.admin-tabla-filtrable__input,
.admin-tabla-filtrable__select {
  width: 100%;
  min-width: 0;
  height: 1.85rem;
  padding: 0 0.45rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  font-size: 0.74rem;
}

.admin-tabla-filtrable__input::placeholder {
  color: var(--color-text-subtle);
}

.admin-tabla-filtrable__input:focus,
.admin-tabla-filtrable__select:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: -1px;
}

/* Permite que las columnas se ajusten sin forzar scroll horizontal. */
.admin-tabla-filtrable__tabla :deep(.va-data-table__table) {
  white-space: normal;
}

.admin-tabla-filtrable__tabla :deep(.va-data-table__table td) {
  overflow-wrap: anywhere;
}

@media (max-width: 720px) {
  .admin-tabla-filtrable__filtros th {
    padding: 0.1rem 0.3rem 0.45rem;
  }

  .admin-tabla-filtrable__input,
  .admin-tabla-filtrable__select {
    height: 1.7rem;
    font-size: 0.7rem;
  }
}
</style>
