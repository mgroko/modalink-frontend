<template>
  <div class="proyectos-admin">
    <header class="proyectos-admin__header">
      <div>
        <h1>Proyectos</h1>
        <p>Consultá los proyectos registrados en la plataforma.</p>
      </div>
      <button type="button" class="proyectos-admin__refresh" :disabled="cargando" @click="cargarProyectos">
        <span class="material-symbols-outlined">refresh</span>
        Actualizar
      </button>
    </header>

    <p v-if="errorMessage" class="proyectos-admin__error">{{ errorMessage }}</p>

    <AdminTablaFiltrable
      :columns="columnas"
      :items="proyectos"
      :loading="cargando"
      :busqueda="busquedaNombre"
      entidad="proyectos"
      empty-text="No hay proyectos para mostrar."
    >
      <template #toolbar>
        <div class="proyectos-admin__toolbar">
          <input
            v-model="busquedaNombre"
            type="search"
            class="proyectos-admin__input"
            placeholder="Buscar por nombre de proyecto"
            aria-label="Buscar por nombre de proyecto"
          />
          <label for="estado-proyecto">Filtrar por estado</label>
          <select id="estado-proyecto" v-model="estado" @change="cargarProyectos">
            <option value="">Todos los estados</option>
            <option v-for="opcion in estados" :key="opcion.value" :value="opcion.value">{{ opcion.label }}</option>
          </select>
        </div>
      </template>

      <template #cell(fechaInicio)="{ value }">
        {{ formatearFecha(value) }}
      </template>

      <template #cell(fechaFinalizacion)="{ value }">
        {{ formatearFecha(value) }}
      </template>

      <template #cell(estado)="{ value }">
        <span class="proyectos-admin__status">{{ estadoAmigable(value) }}</span>
      </template>

      <template #cell(privacidad)="{ value }">
        {{ privacidadAmigable(value) }}
      </template>

      <template #cell(acciones)="{ rowData }">
        <button type="button" class="proyectos-admin__detail" @click="verDetalle(rowData)">
          Ver detalle
        </button>
      </template>
    </AdminTablaFiltrable>
  </div>
</template>

<script>
import adminService from "../../services/adminService";
import AdminTablaFiltrable from "../../components/admin/AdminTablaFiltrable.vue";

export default {
  name: "ProyectosAdminView",
  components: { AdminTablaFiltrable },
  data() {
    return {
      proyectos: [],
      estado: "",
      busquedaNombre: "",
      cargando: false,
      errorMessage: "",
      estados: [
        { value: "BORRADOR", label: "Borrador" },
        { value: "PUBLICADO", label: "Publicado" },
        { value: "CONFIRMADO", label: "Confirmado" },
        { value: "FINALIZADO", label: "Finalizado" },
        { value: "CANCELADO", label: "Cancelado" },
      ],
    };
  },
  computed: {
    columnas() {
      return [
        {
          key: "nombre",
          label: "Proyecto",
          sortable: true,
          filter: { type: "text", placeholder: "Nombre" },
        },
        {
          key: "fechaInicio",
          label: "Fecha de inicio",
          sortable: true,
          filter: { type: "text", placeholder: "Fecha" },
          value: (proyecto) => this.formatearFecha(proyecto.fechaInicio),
        },
        {
          key: "fechaFinalizacion",
          label: "Fecha de finalización",
          sortable: true,
          filter: { type: "text", placeholder: "Fecha" },
          value: (proyecto) => this.formatearFecha(proyecto.fechaFinalizacion),
        },
        {
          key: "estado",
          label: "Estado",
          sortable: true,
          filter: {
            type: "select",
            options: this.estados.map((opcion) => ({
              value: opcion.value,
              text: opcion.label,
            })),
          },
        },
        {
          key: "privacidad",
          label: "Privacidad",
          sortable: true,
          filter: {
            type: "select",
            options: [
              { value: "PUBLICO", text: "Público" },
              { value: "PRIVADO", text: "Privado" },
            ],
          },
        },
        { key: "acciones", label: "Acciones", sortable: false },
      ];
    },
  },
  mounted() {
    this.cargarProyectos();
  },
  methods: {
    /**
     * El endpoint de admin pagina de a 100 como máximo. Para que los filtros
     * y el orden por columna trabajen sobre todo el listado, se recorren todas
     * las páginas y se acumulan los proyectos.
     */
    async cargarProyectos() {
      this.cargando = true;
      this.errorMessage = "";
      try {
        const acumulados = [];
        let page = 0;
        let ultima = false;

        do {
          const params = { page, size: 100 };
          if (this.estado) params.estado = this.estado;
          const data = (await adminService.listarProyectos(params))?.data || {};
          const contenido = Array.isArray(data.contenido) ? data.contenido : [];
          acumulados.push(...contenido);
          ultima = data.ultima ?? true;
          page += 1;
          if (page > 100) break;
        } while (!ultima);

        this.proyectos = acumulados;
      } catch (error) {
        this.proyectos = [];
        this.errorMessage = error?.response?.data?.message || "No se pudieron cargar los proyectos.";
      } finally {
        this.cargando = false;
      }
    },
    formatearFecha(fecha) {
      if (!fecha) return "—";
      return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" }).format(new Date(fecha));
    },
    estadoAmigable(estado) {
      return this.estados.find((opcion) => opcion.value === estado)?.label || estado || "—";
    },
    privacidadAmigable(privacidad) {
      return privacidad === "PUBLICO" ? "Público" : privacidad === "PRIVADO" ? "Privado" : privacidad || "—";
    },
    verDetalle(proyecto) {
      this.$router.push({
        name: "admin-proyecto-detalle",
        params: { id: proyecto.idProyecto },
      });
    },
  },
};
</script>

<style scoped>
.proyectos-admin {
  max-width: 1200px;
  margin: 0 auto;
}

.proyectos-admin__header,
.proyectos-admin__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.proyectos-admin__header {
  margin-bottom: 1.5rem;
}

.proyectos-admin h1 {
  margin: 0;
  color: var(--color-primary);
  font-size: 2.25rem;
  font-weight: 800;
}

.proyectos-admin p {
  margin: 0.35rem 0 0;
  color: var(--color-text-muted);
}

.proyectos-admin__refresh {
  padding: 0.6rem 0.85rem;
  color: var(--color-primary);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  cursor: pointer;
  font: inherit;
  font-size: 0.8rem;
}

.proyectos-admin__refresh {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.proyectos-admin__refresh:disabled {
  cursor: wait;
  opacity: 0.5;
}

.proyectos-admin__toolbar {
  justify-content: flex-start;
  flex-wrap: wrap;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.proyectos-admin__input,
.proyectos-admin__toolbar select {
  min-height: 2.4rem;
  padding: 0.6rem 0.75rem;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  font: inherit;
  font-size: 0.85rem;
}

.proyectos-admin__input {
  min-width: 240px;
  flex: 1 1 240px;
}

.proyectos-admin__toolbar select {
  min-width: 220px;
}

.proyectos-admin__error {
  margin-bottom: 1rem;
  padding: 0.8rem 1rem;
  color: var(--color-danger-text);
  background: var(--color-danger-soft);
  border: 1px solid var(--color-danger-border);
  border-radius: 0.5rem;
  font-size: 0.85rem;
}

.proyectos-admin__status {
  padding: 0.25rem 0.55rem;
  color: var(--color-primary);
  background: var(--color-chip);
  border-radius: 1rem;
  font-size: 0.75rem;
}

.proyectos-admin__detail {
  padding: 0.45rem 0.7rem;
  color: var(--color-primary);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.45rem;
  cursor: pointer;
  font: inherit;
  font-size: 0.78rem;
}

@media (max-width: 620px) {
  .proyectos-admin__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .proyectos-admin__toolbar {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
