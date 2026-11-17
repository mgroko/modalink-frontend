<template>
  <div class="admin-contratos">
    <header class="admin-contratos__header">
      <div>
        <h1>Contratos</h1>
        <p>Consultá los contratos de la plataforma, incluidos borradores y eliminados. Vista de solo lectura.</p>
      </div>
      <button type="button" class="admin-contratos__refresh" :disabled="cargando" @click="cargarContratos(paginacion.paginaActual)">
        <span class="material-symbols-outlined">refresh</span>
        Actualizar
      </button>
    </header>

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

    <p v-if="errorMessage" class="admin-contratos__error">{{ errorMessage }}</p>
    <div v-if="cargando" class="admin-contratos__state">Cargando contratos...</div>
    <div v-else-if="!contratos.length" class="admin-contratos__state">No hay contratos para mostrar.</div>
    <div v-else class="admin-contratos__table-wrapper">
      <table class="admin-contratos__table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Contrato</th>
            <th>Proyecto</th>
            <th>Tipo</th>
            <th>Estado</th>
            <th>Emisor</th>
            <th>Versión</th>
            <th>Firmas</th>
            <th>Emisión</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="contrato in contratos" :key="contrato.idContrato">
            <td class="admin-contratos__mono">{{ contrato.idContrato }}</td>
            <td>{{ contrato.nombre || '—' }}</td>
            <td>{{ contrato.nombreProyecto || '—' }}</td>
            <td>{{ contrato.nombreTipoAcuerdo || contrato.codigoTipoAcuerdo || '—' }}</td>
            <td><span class="admin-contratos__badge">{{ estadoAmigable(contrato.estado) }}</span></td>
            <td>{{ contrato.nombreEmisor || '—' }}</td>
            <td>{{ contrato.versionActual ?? '—' }}</td>
            <td>{{ contrato.firmados }}/{{ contrato.totalPartes }}</td>
            <td>{{ contrato.fechaEmision ? formatearFecha(contrato.fechaEmision) : '—' }}</td>
            <td>
              <button type="button" class="admin-contratos__detail" @click="verDetalle(contrato)">
                Ver detalle
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="paginacion.totalPaginas > 1" class="admin-contratos__pagination">
      <button type="button" :disabled="paginacion.primera || cargando" @click="cargarContratos(paginacion.paginaActual - 1)">Anterior</button>
      <span>Página {{ paginacion.paginaActual + 1 }} de {{ paginacion.totalPaginas }} · {{ paginacion.totalElementos }} contratos</span>
      <button type="button" :disabled="paginacion.ultima || cargando" @click="cargarContratos(paginacion.paginaActual + 1)">Siguiente</button>
    </div>
  </div>
</template>

<script>
import adminService from "../../services/adminService";
import { formatearFecha } from "../../utils/fechas";

export default {
  name: "ContratosAdminView",
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
      paginacion: {
        paginaActual: 0,
        totalPaginas: 1,
        totalElementos: 0,
        primera: true,
        ultima: true,
      },
    };
  },
  mounted() {
    this.cargarContratos(0);
  },
  methods: {
    formatearFecha,
    async cargarContratos(page = 0) {
      this.cargando = true;
      this.errorMessage = "";
      try {
        const params = { page, size: 20 };
        if (this.idProyecto) params.idProyecto = Number(this.idProyecto);
        if (this.nombreProyecto.trim()) params.nombreProyecto = this.nombreProyecto.trim();
        if (this.parte.trim()) params.parte = this.parte.trim();
        if (this.texto.trim()) params.texto = this.texto.trim();
        if (this.estado) params.estados = this.estado;

        const data = (await adminService.buscarContratos(params))?.data || {};
        this.contratos = Array.isArray(data.contenido) ? data.contenido : [];
        this.paginacion = {
          paginaActual: data.paginaActual ?? page,
          totalPaginas: data.totalPaginas ?? 1,
          totalElementos: data.totalElementos ?? this.contratos.length,
          primera: data.primera ?? true,
          ultima: data.ultima ?? true,
        };
      } catch (error) {
        this.contratos = [];
        this.errorMessage = error?.response?.data?.message || "No se pudieron cargar los contratos.";
      } finally {
        this.cargando = false;
      }
    },
    buscarAhora() {
      this.cargarContratos(0);
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
  color: var(--color-text);
}
.admin-contratos p {
  margin: 0.35rem 0 0;
  color: var(--color-text-muted);
}
.admin-contratos__refresh,
.admin-contratos__search,
.admin-contratos__pagination button,
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
.admin-contratos__search:disabled,
.admin-contratos__pagination button:disabled {
  cursor: wait;
  opacity: 0.5;
}
.admin-contratos__toolbar {
  justify-content: flex-start;
  flex-wrap: wrap;
  margin-bottom: 1rem;
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
.admin-contratos__state {
  padding: 3rem 1rem;
  color: var(--color-text-muted);
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: 0.75rem;
  text-align: center;
}
.admin-contratos__table-wrapper {
  overflow-x: auto;
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: 0.75rem;
}
.admin-contratos__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}
.admin-contratos__table th,
.admin-contratos__table td {
  padding: 0.75rem 0.8rem;
  border-bottom: 1px solid var(--color-border-soft);
  text-align: left;
  vertical-align: middle;
}
.admin-contratos__table th {
  color: var(--color-text-muted);
  font-weight: 600;
}
.admin-contratos__table td {
  color: var(--color-text);
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
.admin-contratos__pagination {
  justify-content: center;
  margin-top: 1rem;
  color: var(--color-text-muted);
  font-size: 0.8rem;
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
