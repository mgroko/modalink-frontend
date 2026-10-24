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

    <div class="proyectos-admin__toolbar">
      <label for="estado-proyecto">Filtrar por estado</label>
      <select id="estado-proyecto" v-model="estado" @change="cargarProyectos(0)">
        <option value="">Todos excepto borradores</option>
        <option v-for="opcion in estados" :key="opcion.value" :value="opcion.value">{{ opcion.label }}</option>
      </select>
    </div>

    <p v-if="errorMessage" class="proyectos-admin__error">{{ errorMessage }}</p>
    <div v-if="cargando" class="proyectos-admin__state">Cargando proyectos...</div>
    <div v-else-if="!proyectos.length" class="proyectos-admin__state">No hay proyectos para mostrar.</div>
    <div v-else class="proyectos-admin__table-wrapper">
      <table class="proyectos-admin__table">
        <thead>
          <tr>
            <th>Proyecto</th>
            <th>Fecha de inicio</th>
            <th>Estado</th>
            <th>Privacidad</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="proyecto in proyectos" :key="proyecto.idProyecto">
            <td>{{ proyecto.nombre }}</td>
            <td>{{ formatearFecha(proyecto.fechaInicio) }}</td>
            <td><span class="proyectos-admin__status">{{ estadoAmigable(proyecto.estado) }}</span></td>
            <td>{{ privacidadAmigable(proyecto.privacidad) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="paginacion.totalPaginas > 1" class="proyectos-admin__pagination">
      <button type="button" :disabled="paginacion.primera || cargando" @click="cargarProyectos(paginacion.paginaActual - 1)">Anterior</button>
      <span>Página {{ paginacion.paginaActual + 1 }} de {{ paginacion.totalPaginas }}</span>
      <button type="button" :disabled="paginacion.ultima || cargando" @click="cargarProyectos(paginacion.paginaActual + 1)">Siguiente</button>
    </div>
  </div>
</template>

<script>
import adminService from "../../services/adminService";

export default {
  name: "ProyectosAdminView",
  data() {
    return {
      proyectos: [],
      estado: "",
      cargando: false,
      errorMessage: "",
      estados: [
        { value: "BORRADOR", label: "Borrador" },
        { value: "PUBLICADO", label: "Publicado" },
        { value: "CONFIRMADO", label: "Confirmado" },
        { value: "FINALIZADO", label: "Finalizado" },
        { value: "CANCELADO", label: "Cancelado" },
      ],
      paginacion: { paginaActual: 0, totalPaginas: 1, primera: true, ultima: true },
    };
  },
  mounted() {
    this.cargarProyectos();
  },
  methods: {
    async cargarProyectos(page = this.paginacion.paginaActual) {
      this.cargando = true;
      this.errorMessage = "";
      try {
        const params = { page, size: 20 };
        if (this.estado) params.estado = this.estado;
        const data = (await adminService.listarProyectos(params))?.data || {};
        this.proyectos = Array.isArray(data.contenido) ? data.contenido : [];
        this.paginacion = {
          paginaActual: data.paginaActual ?? page,
          totalPaginas: data.totalPaginas ?? 1,
          primera: data.primera ?? true,
          ultima: data.ultima ?? true,
        };
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
  },
};
</script>

<style scoped>
.proyectos-admin {
  max-width: 1200px;
  margin: 0 auto;
}

.proyectos-admin__header,
.proyectos-admin__toolbar,
.proyectos-admin__pagination {
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
  color: var(--color-text);
}

.proyectos-admin p {
  margin: 0.35rem 0 0;
  color: var(--color-text-muted);
}

.proyectos-admin__refresh,
.proyectos-admin__pagination button {
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

.proyectos-admin__refresh:disabled,
.proyectos-admin__pagination button:disabled {
  cursor: wait;
  opacity: 0.5;
}

.proyectos-admin__toolbar {
  justify-content: flex-start;
  margin-bottom: 1rem;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.proyectos-admin__toolbar select {
  min-width: 220px;
  padding: 0.65rem 0.75rem;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
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

.proyectos-admin__state {
  padding: 3rem 1rem;
  color: var(--color-text-muted);
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: 0.75rem;
  text-align: center;
}

.proyectos-admin__table-wrapper {
  overflow-x: auto;
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: 0.75rem;
}

.proyectos-admin__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.proyectos-admin__table th,
.proyectos-admin__table td {
  padding: 0.9rem 1rem;
  border-bottom: 1px solid var(--color-border-soft);
  text-align: left;
}

.proyectos-admin__table th {
  color: var(--color-text-muted);
  font-weight: 600;
}

.proyectos-admin__table td {
  color: var(--color-text);
}

.proyectos-admin__status {
  padding: 0.25rem 0.55rem;
  color: var(--color-primary);
  background: var(--color-chip);
  border-radius: 1rem;
  font-size: 0.75rem;
}

.proyectos-admin__pagination {
  justify-content: center;
  margin-top: 1rem;
  color: var(--color-text-muted);
  font-size: 0.8rem;
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
