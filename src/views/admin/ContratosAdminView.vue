<template>
  <div class="admin-contratos">
    <header class="admin-contratos__header">
      <div>
        <h1>Contratos</h1>
        <p>Consultá los contratos de la plataforma, incluidos borradores y eliminados. Vista de solo lectura.</p>
      </div>
      <button type="button" class="admin-contratos__refresh" :disabled="cargando" @click="cargarContratos">
        <span class="material-symbols-outlined">refresh</span>
        Actualizar
      </button>
    </header>

    <p v-if="errorMessage" class="admin-contratos__error">{{ errorMessage }}</p>

    <AdminTablaFiltrable
      :columns="columnas"
      :items="contratos"
      :loading="cargando"
      entidad="contratos"
      empty-text="No hay contratos para mostrar."
    >
      <template #toolbar>
        <div class="admin-contratos__toolbar">
          <input v-model="idProyecto" type="number" min="1" placeholder="ID de proyecto" class="admin-contratos__input admin-contratos__input--short" @keyup.enter="buscarAhora" />
          <input v-model="nombreProyecto" type="search" placeholder="Nombre del proyecto" class="admin-contratos__input" @keyup.enter="buscarAhora" />
          <input v-model="parte" type="search" placeholder="Parte firmante" class="admin-contratos__input" @keyup.enter="buscarAhora" />
          <input v-model="texto" type="search" placeholder="Nombre, descripción o texto" class="admin-contratos__input" @keyup.enter="buscarAhora" />
          <select v-model="estado" class="admin-contratos__select" @change="buscarAhora">
            <option value="">Todos los estados</option>
            <option v-for="opcion in estados" :key="opcion.value" :value="opcion.value">{{ opcion.label }}</option>
          </select>
          <button type="button" class="admin-contratos__search" :disabled="cargando" @click="buscarAhora">Buscar</button>
        </div>
      </template>

      <template #cell(idContrato)="{ value }">
        <span class="admin-contratos__mono">{{ value }}</span>
      </template>

      <template #cell(nombre)="{ value }">
        {{ value || '—' }}
      </template>

      <template #cell(nombreProyecto)="{ value }">
        {{ value || '—' }}
      </template>

      <template #cell(nombreTipoAcuerdo)="{ rowData }">
        {{ rowData.nombreTipoAcuerdo || rowData.codigoTipoAcuerdo || '—' }}
      </template>

      <template #cell(estado)="{ value }">
        <span class="admin-contratos__badge">{{ estadoAmigable(value) }}</span>
      </template>

      <template #cell(nombreEmisor)="{ value }">
        {{ value || '—' }}
      </template>

      <template #cell(versionActual)="{ value }">
        {{ value ?? '—' }}
      </template>

      <template #cell(firmados)="{ rowData }">
        {{ rowData.firmados }}/{{ rowData.totalPartes }}
      </template>

      <template #cell(fechaEmision)="{ value }">
        {{ value ? formatearFecha(value) : '—' }}
      </template>

      <template #cell(acciones)="{ rowData }">
        <button type="button" class="admin-contratos__detail" @click="verDetalle(rowData)">
          Ver detalle
        </button>
      </template>
    </AdminTablaFiltrable>
  </div>
</template>

<script>
import adminService from "../../services/adminService";
import { formatearFecha } from "../../utils/fechas";
import AdminTablaFiltrable from "../../components/admin/AdminTablaFiltrable.vue";

export default {
  name: "ContratosAdminView",
  components: { AdminTablaFiltrable },
  data() {
    return {
      contratos: [],
      idProyecto: "",
      nombreProyecto: "",
      parte: "",
      texto: "",
      estado: "",
      cargando: false,
      errorMessage: "",
      estados: [
        { value: "BORRADOR", label: "Borrador" },
        { value: "PENDIENTE_FIRMA", label: "Pendiente de firma" },
        { value: "ACTIVO", label: "Activo" },
        { value: "RECHAZADO_POR_PARTES", label: "Rechazado por las partes" },
        { value: "CANCELADO", label: "Cancelado" },
        { value: "ELIMINADO", label: "Eliminado" },
      ],
    };
  },
  computed: {
    columnas() {
      return [
        {
          key: "idContrato",
          label: "ID",
          sortable: true,
          filter: { type: "text", placeholder: "ID" },
        },
        {
          key: "nombre",
          label: "Contrato",
          sortable: true,
          filter: { type: "text", placeholder: "Contrato" },
        },
        {
          key: "nombreProyecto",
          label: "Proyecto",
          sortable: true,
          filter: { type: "text", placeholder: "Proyecto" },
        },
        {
          key: "nombreTipoAcuerdo",
          label: "Tipo",
          sortable: true,
          filter: { type: "text", placeholder: "Tipo" },
          value: (contrato) =>
            contrato.nombreTipoAcuerdo || contrato.codigoTipoAcuerdo || "",
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
          key: "nombreEmisor",
          label: "Emisor",
          sortable: true,
          filter: { type: "text", placeholder: "Emisor" },
        },
        {
          key: "versionActual",
          label: "Versión",
          sortable: true,
          filter: { type: "text", placeholder: "Versión" },
        },
        {
          key: "firmados",
          label: "Firmas",
          sortable: true,
          filter: { type: "text", placeholder: "Firmas" },
          value: (contrato) => `${contrato.firmados}/${contrato.totalPartes}`,
        },
        {
          key: "fechaEmision",
          label: "Emisión",
          sortable: true,
          filter: { type: "text", placeholder: "Fecha" },
          value: (contrato) =>
            contrato.fechaEmision ? this.formatearFecha(contrato.fechaEmision) : "",
        },
        { key: "acciones", label: "Acciones", sortable: false },
      ];
    },
  },
  mounted() {
    this.cargarContratos();
  },
  methods: {
    formatearFecha,
    /**
     * `todos: true` trae el listado completo (sin paginar) para que el orden
     * y los filtros por columna se apliquen sobre todos los contratos.
     */
    async cargarContratos() {
      this.cargando = true;
      this.errorMessage = "";
      try {
        const params = { todos: true };
        if (this.idProyecto) params.idProyecto = Number(this.idProyecto);
        if (this.nombreProyecto.trim()) params.nombreProyecto = this.nombreProyecto.trim();
        if (this.parte.trim()) params.parte = this.parte.trim();
        if (this.texto.trim()) params.texto = this.texto.trim();
        if (this.estado) params.estados = this.estado;

        const data = (await adminService.buscarContratos(params))?.data || {};
        this.contratos = Array.isArray(data.contenido) ? data.contenido : [];
      } catch (error) {
        this.contratos = [];
        this.errorMessage = error?.response?.data?.message || "No se pudieron cargar los contratos.";
      } finally {
        this.cargando = false;
      }
    },
    buscarAhora() {
      this.cargarContratos();
    },
    verDetalle(contrato) {
      this.$router.push({ name: "admin-contrato-detalle", params: { id: contrato.idContrato } });
    },
    estadoAmigable(estado) {
      return this.estados.find((opcion) => opcion.value === estado)?.label || estado || "—";
    },
  },
};
</script>

<style scoped>
.admin-contratos {
  max-width: 1350px;
  margin: 0 auto;
}
.admin-contratos__header,
.admin-contratos__toolbar,
.admin-contratos__pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.admin-contratos__header {
  margin-bottom: 1.5rem;
}
.admin-contratos h1 {
  margin: 0;
  color: var(--color-primary);
  font-size: 2.25rem;
  font-weight: 800;
}
.admin-contratos p {
  margin: 0.35rem 0 0;
  color: var(--color-text-muted);
}
.admin-contratos__refresh,
.admin-contratos__search,
.admin-contratos__detail {
  padding: 0.6rem 0.85rem;
  color: var(--color-primary);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  cursor: pointer;
  font: inherit;
  font-size: 0.8rem;
}
.admin-contratos__refresh {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}
.admin-contratos__refresh:disabled,
.admin-contratos__search:disabled {
  cursor: wait;
  opacity: 0.5;
}
.admin-contratos__toolbar {
  justify-content: flex-start;
  flex-wrap: wrap;
}
.admin-contratos__input,
.admin-contratos__select {
  min-height: 2.4rem;
  padding: 0.6rem 0.75rem;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  font: inherit;
  font-size: 0.85rem;
}
.admin-contratos__input {
  min-width: 190px;
}
.admin-contratos__input--short {
  min-width: 120px;
  max-width: 130px;
}
.admin-contratos__select {
  min-width: 190px;
}
.admin-contratos__error {
  margin-bottom: 1rem;
  padding: 0.8rem 1rem;
  color: var(--color-danger-text);
  background: var(--color-danger-soft);
  border: 1px solid var(--color-danger-border);
  border-radius: 0.5rem;
  font-size: 0.85rem;
}
.admin-contratos__mono {
  font-family: monospace;
  color: var(--color-text-muted);
}
.admin-contratos__badge {
  display: inline-block;
  padding: 0.22rem 0.5rem;
  border-radius: 1rem;
  color: var(--color-primary);
  background: var(--color-chip);
  font-size: 0.73rem;
}
@media (max-width: 780px) {
  .admin-contratos__header,
  .admin-contratos__toolbar {
    align-items: flex-start;
    flex-direction: column;
  }
  .admin-contratos__input,
  .admin-contratos__input--short,
  .admin-contratos__select {
    min-width: 100%;
    max-width: none;
  }
}
</style>
