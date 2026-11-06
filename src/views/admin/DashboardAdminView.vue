<template>
  <div class="dashboard-admin">
    <header class="dashboard-admin__header">
      <div>
        <h1>Panel de administración</h1>
        <p>Resumen de la actividad de ModaLink.</p>
      </div>
    </header>

    <div v-if="errorMessage" class="dashboard-admin__alert">
      <span>{{ errorMessage }}</span>
      <button type="button" @click="cargarDashboard">Reintentar</button>
    </div>

    <section class="dashboard-admin__metrics" aria-label="Métricas principales">
      <article class="dashboard-card dashboard-card--metric">
        <span class="dashboard-card__label">Nuevos usuarios</span>
        <strong v-if="!cargando">{{ resumen.totalUsuarios ?? "—" }}</strong>
        <span v-else class="dashboard-admin__skeleton dashboard-admin__skeleton--number"></span>
        <small>Total de usuarios registrados</small>
      </article>
      <article class="dashboard-card dashboard-card--metric">
        <span class="dashboard-card__label">Proyectos confirmados</span>
        <strong v-if="!cargando">{{ resumen.proyectosConfirmados ?? "—" }}</strong>
        <span v-else class="dashboard-admin__skeleton dashboard-admin__skeleton--number"></span>
        <small>Total de proyectos confirmados</small>
      </article>
      <article class="dashboard-card dashboard-card--metric dashboard-card--gauge">
        <span class="dashboard-card__label">Porcentaje confirmado</span>
        <div v-if="!cargando" class="dashboard-admin__gauge">
          <span>{{ porcentajeConfirmados }}%</span>
        </div>
        <span v-else class="dashboard-admin__skeleton dashboard-admin__skeleton--gauge"></span>
        <small>Sobre proyectos no borrador</small>
      </article>
    </section>

    <section class="dashboard-admin__main-grid">
      <article class="dashboard-card dashboard-card--users">
        <div class="dashboard-card__heading">
          <h2>Usuarios</h2>
          <RouterLink to="/admin/gestion-usuarios">Gestionar usuarios <span>→</span></RouterLink>
        </div>
        <div v-if="cargandoUsuarios" class="dashboard-admin__empty">Cargando usuarios...</div>
        <div v-else-if="!usuarios.length" class="dashboard-admin__empty">No hay usuarios para mostrar.</div>
        <ul v-else class="dashboard-admin__users">
          <li v-for="usuario in usuarios" :key="obtenerId(usuario)">
            <span class="dashboard-admin__user-avatar">{{ iniciales(usuario) }}</span>
            <span class="dashboard-admin__user-data">
              <strong>{{ nombreUsuario(usuario) }}</strong>
              <small>{{ usuario.ubicacion || usuario.nombreArtistico || usuario.correo || "Sin información adicional" }}</small>
            </span>
            <RouterLink :to="{ name: 'gestion-usuarios' }" :aria-label="`Ver usuario ${nombreUsuario(usuario)}`">Ver</RouterLink>
          </li>
        </ul>
      </article>

      <article class="dashboard-card dashboard-card--chart">
        <div class="dashboard-card__heading">
          <h2>Actividad por provincia</h2>
          <span v-if="resumen.topProvincias?.length">Top {{ resumen.topProvincias.length }}</span>
        </div>
        <div v-if="cargando" class="dashboard-admin__empty">Cargando gráfico...</div>
        <div v-else-if="!resumen.topProvincias?.length" class="dashboard-admin__empty">No hay actividad provincial.</div>
        <div v-else class="dashboard-admin__chart">
          <canvas ref="actividadChart"></canvas>
        </div>
      </article>
    </section>

    <section class="dashboard-admin__lower-grid">
      <article class="dashboard-card dashboard-card--provinces">
        <div class="dashboard-card__heading">
          <h2>Top provincias</h2>
          <span>Actividad total</span>
        </div>
        <div v-if="!resumen.topProvincias?.length" class="dashboard-admin__empty">No hay datos disponibles.</div>
        <ul v-else class="dashboard-admin__provinces">
          <li v-for="provincia in resumen.topProvincias" :key="provincia.idProvincia">
            <div class="dashboard-admin__province-row">
              <strong>{{ provincia.nombreProvincia }}</strong>
              <span>{{ provincia.totalActividad }}</span>
            </div>
            <div class="dashboard-admin__bar">
              <span :style="{ width: `${porcentajeProvincia(provincia)}%` }"></span>
            </div>
          </li>
        </ul>
      </article>

      <article class="dashboard-card dashboard-card--highlight">
        <span class="dashboard-card__label">Provincia con más actividad</span>
        <strong>{{ provinciaPrincipal?.nombreProvincia || "—" }}</strong>
        <small>{{ provinciaPrincipal ? `${provinciaPrincipal.totalActividad} registros de actividad` : "Sin datos disponibles" }}</small>
      </article>

      <article class="dashboard-card dashboard-card--highlight">
        <span class="dashboard-card__label">Profesión más demandada</span>
        <strong>{{ resumen.profesionMasDemandada?.nombreProfesion || "—" }}</strong>
        <small>{{ resumen.profesionMasDemandada ? `${resumen.profesionMasDemandada.totalPerfiles} perfiles activos` : "Sin datos disponibles" }}</small>
      </article>
    </section>

    <section class="dashboard-card dashboard-card--projects">
      <div class="dashboard-card__heading">
        <h2>Nuevos proyectos</h2>
        <RouterLink to="/admin/proyectos">Ver todos <span>→</span></RouterLink>
      </div>
      <div v-if="!resumen.listaNuevosProyectos?.length" class="dashboard-admin__empty">No hay proyectos para mostrar.</div>
      <ul v-else class="dashboard-admin__projects">
        <li v-for="proyecto in resumen.listaNuevosProyectos" :key="proyecto.idProyecto">
          <RouterLink to="/admin/proyectos">
            <span class="material-symbols-outlined">visibility</span>
            {{ proyecto.nombre }}
          </RouterLink>
          <span class="dashboard-admin__status">{{ estadoAmigable(proyecto.estado) }}</span>
        </li>
      </ul>
    </section>
  </div>
</template>

<script>
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip } from "chart.js";
import adminService from "../../services/adminService";

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip);

export default {
  name: "DashboardAdminView",
  data() {
    return {
      resumen: {},
      usuarios: [],
      cargando: true,
      cargandoUsuarios: true,
      errorMessage: "",
      actividadChartInstance: null,
    };
  },
  computed: {
    porcentajeConfirmados() {
      return Number(this.resumen.porcentajeConfirmados ?? 0).toLocaleString("es-AR", {
        maximumFractionDigits: 1,
      });
    },
    provinciaPrincipal() {
      return this.resumen.topProvincias?.[0] || null;
    },
    maxActividad() {
      return Math.max(...(this.resumen.topProvincias || []).map((provincia) => Number(provincia.totalActividad) || 0), 1);
    },
  },
  async mounted() {
    await this.cargarDashboard();
  },
  beforeUnmount() {
    this.destruirGrafico();
  },
  methods: {
    async cargarDashboard() {
      this.cargando = true;
      this.cargandoUsuarios = true;
      this.errorMessage = "";

      const [dashboardResult, usuariosResult] = await Promise.allSettled([
        adminService.obtenerDashboardResumen(10),
        adminService.buscarUsuarios({ page: 0, size: 4 }),
      ]);

      if (dashboardResult.status === "fulfilled") {
        this.resumen = dashboardResult.value?.data || {};
        this.cargando = false;
        await this.$nextTick();
        this.crearGrafico();
      } else {
        this.resumen = {};
        this.cargando = false;
        this.errorMessage = this.mensajeError(dashboardResult.reason, "No se pudo cargar el resumen del dashboard.");
      }

      if (usuariosResult.status === "fulfilled") {
        const data = usuariosResult.value?.data || {};
        this.usuarios = Array.isArray(data.contenido) ? data.contenido : [];
      } else if (!this.errorMessage) {
        this.errorMessage = this.mensajeError(usuariosResult.reason, "No se pudieron cargar los usuarios.");
      }

      this.cargandoUsuarios = false;
    },
    crearGrafico() {
      this.destruirGrafico();
      const canvas = this.$refs.actividadChart;
      if (!canvas || !this.resumen.topProvincias?.length) return;

      this.actividadChartInstance = new Chart(canvas, {
        type: "bar",
        data: {
          labels: this.resumen.topProvincias.map((provincia) => provincia.nombreProvincia),
          datasets: [{
            data: this.resumen.topProvincias.map((provincia) => provincia.totalActividad),
            backgroundColor: "#A97B5C",
            borderRadius: 6,
            maxBarThickness: 34,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (context) => ` ${context.raw} actividades` } },
          },
          scales: {
            y: { beginAtZero: true, ticks: { precision: 0 } },
            x: { grid: { display: false } },
          },
        },
      });
    },
    destruirGrafico() {
      if (this.actividadChartInstance) {
        this.actividadChartInstance.destroy();
        this.actividadChartInstance = null;
      }
    },
    porcentajeProvincia(provincia) {
      return Math.max(4, ((Number(provincia.totalActividad) || 0) / this.maxActividad) * 100);
    },
    obtenerId(usuario) {
      return usuario.id ?? usuario.idUsuario;
    },
    nombreUsuario(usuario) {
      return [usuario.nombre, usuario.apellido].filter(Boolean).join(" ") || usuario.correo || "Usuario";
    },
    iniciales(usuario) {
      return this.nombreUsuario(usuario).split(/\s+/).slice(0, 2).map((parte) => parte.charAt(0).toUpperCase()).join("");
    },
    estadoAmigable(estado) {
      const estados = {
        BORRADOR: "Borrador",
        PUBLICADO: "Publicado",
        CONFIRMADO: "Confirmado",
        FINALIZADO: "Finalizado",
        CANCELADO: "Cancelado",
      };
      return estados[estado] || estado || "Sin estado";
    },
    mensajeError(error, fallback) {
      return error?.response?.data?.message || fallback;
    },
  },
};
</script>

<style scoped>
.dashboard-admin {
  max-width: 1500px;
  margin: 0 auto;
}

.dashboard-admin__header,
.dashboard-card__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.dashboard-admin__header {
  margin-bottom: 1.5rem;
}

.dashboard-admin h1,
.dashboard-admin h2 {
  margin: 0;
  color: var(--color-text);
}

.dashboard-admin h1 {
  font-size: clamp(1.5rem, 2vw, 2rem);
}

.dashboard-admin h2 {
  font-size: 1.15rem;
}

.dashboard-admin__header p {
  margin: 0.35rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.dashboard-admin__refresh {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 0.85rem;
  color: var(--color-primary);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  cursor: pointer;
  font: inherit;
  font-size: 0.8rem;
}

.dashboard-admin__refresh:disabled {
  cursor: wait;
  opacity: 0.6;
}

.dashboard-admin__alert {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 0.8rem 1rem;
  color: var(--color-danger-text);
  background: var(--color-danger-soft);
  border: 1px solid var(--color-danger-border);
  border-radius: 0.6rem;
  font-size: 0.85rem;
}

.dashboard-admin__alert button {
  color: inherit;
  background: none;
  border: 0;
  cursor: pointer;
  font: inherit;
  font-weight: 700;
}

.dashboard-admin__metrics,
.dashboard-admin__main-grid,
.dashboard-admin__lower-grid {
  display: grid;
  gap: 1rem;
}

.dashboard-admin__metrics {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.dashboard-admin__main-grid {
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  margin-top: 1rem;
}

.dashboard-admin__lower-grid {
  grid-template-columns: minmax(0, 1.3fr) repeat(2, minmax(0, 0.8fr));
  margin-top: 1rem;
}

.dashboard-card {
  min-width: 0;
  padding: 1.35rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: 1rem;
  box-shadow: 0 0.3rem 1.3rem rgba(35, 33, 52, 0.04);
}

.dashboard-card--metric {
  display: grid;
  align-content: start;
  min-height: 145px;
}

.dashboard-card__label,
.dashboard-card small,
.dashboard-card__heading > span {
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.dashboard-card--metric strong {
  margin: 0.7rem 0 0.3rem;
  color: var(--color-primary);
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1;
}

.dashboard-card--metric small {
  margin-top: auto;
}

.dashboard-card--gauge {
  text-align: center;
}

.dashboard-admin__gauge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 50px;
  margin: 0.8rem auto 0.5rem;
  overflow: hidden;
  border: 13px solid var(--color-support);
  border-bottom: 0;
  border-radius: 100px 100px 0 0;
}

.dashboard-admin__gauge span {
  display: block;
  margin: 0;
  color: var(--color-primary);
  font-size: 1.15rem;
  font-weight: 800;
  line-height: 1;
}

.dashboard-admin__skeleton {
  display: block;
  background: var(--color-skeleton);
  border-radius: 0.4rem;
}

.dashboard-admin__skeleton--number {
  width: 5rem;
  height: 2.8rem;
  margin: 0.7rem 0;
}

.dashboard-admin__skeleton--gauge {
  width: 100px;
  height: 50px;
  margin: 0.8rem auto;
  border-radius: 100px 100px 0 0;
}

.dashboard-card__heading a,
.dashboard-admin__users a,
.dashboard-admin__projects a {
  color: var(--color-accent-dark);
  font-size: 0.8rem;
  text-decoration: none;
}

.dashboard-admin__users,
.dashboard-admin__provinces,
.dashboard-admin__projects {
  display: grid;
  gap: 0.65rem;
  margin: 1rem 0 0;
  padding: 0;
  list-style: none;
}

.dashboard-admin__users li {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.55rem 0.4rem;
  border-radius: 0.5rem;
}

.dashboard-admin__users li:hover {
  background: var(--color-surface-soft);
}

.dashboard-admin__user-avatar {
  display: grid;
  width: 2.25rem;
  height: 2.25rem;
  flex: 0 0 2.25rem;
  place-items: center;
  color: white;
  background: var(--color-accent);
  border-radius: 50%;
  font-size: 0.7rem;
  font-weight: 700;
}

.dashboard-admin__user-data {
  display: grid;
  flex: 1;
  min-width: 0;
}

.dashboard-admin__user-data strong {
  overflow: hidden;
  color: var(--color-text);
  font-size: 0.85rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dashboard-admin__user-data small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dashboard-admin__chart {
  height: 240px;
  margin-top: 1rem;
}

.dashboard-admin__empty {
  display: grid;
  min-height: 120px;
  place-items: center;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  text-align: center;
}

.dashboard-admin__province-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  color: var(--color-text);
  font-size: 0.8rem;
}

.dashboard-admin__bar {
  height: 0.65rem;
  margin-top: 0.35rem;
  overflow: hidden;
  background: var(--color-surface-muted);
  border-radius: 1rem;
}

.dashboard-admin__bar span {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, var(--color-accent), #ddc3b0);
  border-radius: inherit;
}

.dashboard-card--highlight {
  display: grid;
  align-content: center;
  gap: 0.55rem;
}

.dashboard-card--highlight strong {
  color: var(--color-neutral-dark);
  font-size: 1.35rem;
}

.dashboard-admin__projects {
  display: flex;
  flex-wrap: wrap;
}

.dashboard-admin__projects li {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.65rem 0.85rem;
  background: var(--color-warning-soft);
  border-radius: 1.25rem;
}

.dashboard-admin__projects a {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  text-decoration: underline;
}

.dashboard-admin__projects .material-symbols-outlined {
  font-size: 1rem;
}

.dashboard-admin__status {
  color: var(--color-text-muted);
  font-size: 0.7rem;
}

@media (max-width: 900px) {
  .dashboard-admin__metrics,
  .dashboard-admin__lower-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dashboard-card--provinces {
    grid-column: 1 / -1;
  }
}

@media (max-width: 620px) {
  .dashboard-admin__metrics,
  .dashboard-admin__main-grid,
  .dashboard-admin__lower-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-admin__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .dashboard-admin__alert {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
