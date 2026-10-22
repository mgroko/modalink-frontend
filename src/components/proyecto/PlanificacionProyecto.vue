<template>
  <section class="planificacion-proyecto">
    <div
      v-if="puedeCrear && !tieneFechaEntrega"
      class="planificacion-proyecto__aviso"
      role="status"
    >
      <div>
        <p class="planificacion-proyecto__aviso-titulo">
          Falta la fecha de entrega del proyecto
        </p>
        <p class="planificacion-proyecto__aviso-texto">
          Para programar actividades primero definí la fecha de entrega estipulada.
        </p>
      </div>
      <VaButton
        v-if="puedeModificar"
        preset="secondary"
        @click="$emit('ir-modificar-proyecto')"
      >
        Completar fecha
      </VaButton>
      <p v-else class="planificacion-proyecto__aviso-texto">
        Pedile a un miembro con permiso de edición que complete la fecha.
      </p>
    </div>

    <div class="planificacion-proyecto__resumen">
      <article class="planificacion-proyecto__metrica">
        <span class="planificacion-proyecto__metrica-label">Actividades</span>
        <strong class="planificacion-proyecto__metrica-valor">
          {{ metricas.total }}
        </strong>
      </article>

      <article class="planificacion-proyecto__metrica">
        <span class="planificacion-proyecto__metrica-label">Duración estimada</span>
        <strong class="planificacion-proyecto__metrica-valor">{{ duracionTexto }}</strong>
      </article>

      <article class="planificacion-proyecto__metrica">
        <span class="planificacion-proyecto__metrica-label">Margen hasta la entrega</span>
        <strong
          class="planificacion-proyecto__metrica-valor"
          :class="{ 'planificacion-proyecto__metrica-valor--alerta': margenVencido }"
        >
          {{ margenTexto }}
        </strong>
      </article>

      <article class="planificacion-proyecto__metrica">
        <span class="planificacion-proyecto__metrica-label">Ruta crítica</span>
        <strong class="planificacion-proyecto__metrica-valor planificacion-proyecto__metrica-valor--suave">
          Próximamente
        </strong>
        <span class="planificacion-proyecto__metrica-hint">Se habilitará con UC-33</span>
      </article>
    </div>

    <section class="planificacion-proyecto__panel">
      <header class="planificacion-proyecto__panel-cabecera">
        <div>
          <h2 class="planificacion-proyecto__titulo">Actividades</h2>
          <p class="planificacion-proyecto__subtitulo">
            {{ subtituloListado }}
          </p>
        </div>

        <VaButton
          v-if="puedeCrear"
          preset="primary"
          class="btn-agregar-actividad"
          :disabled="!tieneFechaEntrega"
          :title="
            tieneFechaEntrega
              ? 'Agregar actividad'
              : 'Definí la fecha de entrega del proyecto para crear actividades'
          "
          @click="$emit('crear-actividad')"
        >
          <template #prepend>
            <span
              class="material-symbols-outlined btn-agregar-actividad__icono"
              aria-hidden="true"
            >
              add
            </span>
          </template>
          Agregar actividad
        </VaButton>
      </header>

      <p v-if="!estadoPermiteActividades" class="planificacion-proyecto__nota">
        El proyecto está {{ estadoLegible.toLowerCase() }} y no admite nuevas
        actividades.
      </p>
      <p v-else-if="!puedeCrear" class="planificacion-proyecto__nota">
        No tenés permiso para crear actividades en este proyecto.
      </p>

      <BaseAlert v-if="error" :message="error" type="error" />

      <div v-if="error && puedeReintentar" class="planificacion-proyecto__reintento">
        <VaButton preset="primary" @click="cargarTodo">Reintentar</VaButton>
      </div>

      <FiltrosActividades
        v-model:nombre="filtros.nombre"
        v-model:estados="filtros.estados"
        @buscar="buscarConFiltros"
      />

      <p v-if="buscando" class="planificacion-proyecto__actualizando">
        Actualizando listado...
      </p>

      <div v-if="cargando" class="planificacion-proyecto__cargando">
        <span class="material-symbols-outlined">hourglass_empty</span>
        Cargando actividades...
      </div>

      <TablaActividades
        v-else
        :actividades="actividades"
        :id-actividad-resaltada="idActividadResaltada"
        :mensaje-vacio="mensajeVacio"
      />
    </section>

    <section
      v-if="!cargando && actividades.length"
      class="planificacion-proyecto__panel"
    >
      <h2 class="planificacion-proyecto__titulo">Cronograma</h2>
      <p class="planificacion-proyecto__subtitulo">
        Vista general de las actividades ordenadas por fecha de inicio.
      </p>

      <CronogramaActividades :actividades="actividades" />
    </section>
  </section>
</template>

<script>
import actividadService from "../../services/actividadService.js";
import { refrescarSesion } from "../../services/authState";
import BaseAlert from "../AlertaBase.vue";
import FiltrosActividades from "./FiltrosActividades.vue";
import TablaActividades from "./TablaActividades.vue";
import CronogramaActividades from "./CronogramaActividades.vue";
import { calcularMetricasPlanificacion } from "../../utils/actividadConstants.js";
import { mensajeErrorApi } from "../../utils/apiError";
import {
  ESTADOS_PROYECTO,
  normalizarEstadoProyecto,
} from "../../utils/proyectoConstants.js";

const ESTADOS_CON_ACTIVIDADES = [
  ESTADOS_PROYECTO.BORRADOR,
  ESTADOS_PROYECTO.PUBLICADO,
  ESTADOS_PROYECTO.CONFIRMADO,
];

export default {
  name: "PlanificacionProyecto",
  components: {
    BaseAlert,
    FiltrosActividades,
    TablaActividades,
    CronogramaActividades,
  },
  props: {
    proyecto: {
      type: Object,
      required: true,
    },
    idActividadResaltada: {
      type: [Number, String],
      default: null,
    },
  },
  emits: ["crear-actividad", "ir-modificar-proyecto", "limpiar-resaltado"],
  data() {
    return {
      actividadesTotales: [],
      actividades: [],
      cargando: true,
      buscando: false,
      error: "",
      puedeReintentar: false,
      filtros: {
        nombre: "",
        estados: [],
      },
      idCarga: 0,
    };
  },
  computed: {
    permisos() {
      return this.proyecto?.permisos || [];
    },
    estadoNormalizado() {
      return normalizarEstadoProyecto(this.proyecto?.estado);
    },
    estadoLegible() {
      return this.estadoNormalizado;
    },
    estadoPermiteActividades() {
      return ESTADOS_CON_ACTIVIDADES.includes(this.estadoNormalizado);
    },
    puedeCrear() {
      return (
        this.permisos.includes("CREAR_ACTIVIDAD") && this.estadoPermiteActividades
      );
    },
    puedeModificar() {
      return this.permisos.includes("MODIFICAR_PROYECTO");
    },
    tieneFechaEntrega() {
      return !!this.proyecto?.fechaEntregaEstipulada;
    },
    metricas() {
      return calcularMetricasPlanificacion(
        this.actividadesTotales,
        this.proyecto?.fechaEntregaEstipulada
      );
    },
    duracionTexto() {
      return this.metricas.duracionDias
        ? `${this.metricas.duracionDias} días`
        : "—";
    },
    margenVencido() {
      return (
        this.metricas.margenDias !== null && this.metricas.margenDias < 0
      );
    },
    margenTexto() {
      const margen = this.metricas.margenDias;
      if (margen === null) return "—";
      if (margen < 0) return `Vencido por ${Math.abs(margen)} días`;
      if (margen === 0) return "Sin margen";
      return `${margen} días`;
    },
    filtrosActivos() {
      return (
        String(this.filtros.nombre || "").trim() !== "" ||
        this.filtros.estados.length > 0
      );
    },
    subtituloListado() {
      if (this.filtrosActivos) {
        const total = this.actividades.length;
        return `${total} ${total === 1 ? "actividad encontrada" : "actividades encontradas"}`;
      }
      const total = this.metricas.total;
      return `${total} ${total === 1 ? "actividad cargada" : "actividades cargadas"}`;
    },
    mensajeVacio() {
      return this.filtrosActivos
        ? "No hay actividades que coincidan con los filtros."
        : "Todavía no hay actividades en este proyecto.";
    },
  },
  watch: {
    "filtros.nombre"() {
      this.programarBusqueda();
    },
    "filtros.estados"() {
      this.programarBusqueda();
    },
    idActividadResaltada: {
      immediate: true,
      handler(valor) {
        if (!valor) return;
        clearTimeout(this.temporizadorResaltado);
        this.temporizadorResaltado = setTimeout(() => {
          this.$emit("limpiar-resaltado");
        }, 5000);
      },
    },
  },
  created() {
    this.controladorBusqueda = null;
  },
  mounted() {
    this.cargarTodo();
  },
  beforeUnmount() {
    clearTimeout(this.temporizadorBusqueda);
    clearTimeout(this.temporizadorResaltado);
    if (this.controladorBusqueda) this.controladorBusqueda.abort();
  },
  methods: {
    async cargarTodo() {
      const corrida = ++this.idCarga;
      this.abortarBusqueda();
      this.controladorBusqueda = new AbortController();

      this.cargando = true;
      this.buscando = false;
      this.error = "";
      this.puedeReintentar = false;

      try {
        const response = await actividadService.buscar(
          this.proyecto.idProyecto,
          { todos: true },
          this.controladorBusqueda.signal
        );
        if (corrida !== this.idCarga) return;

        const contenido = response?.data?.contenido;
        const lista = Array.isArray(contenido) ? contenido : [];
        this.actividadesTotales = lista;
        this.actividades = lista;
      } catch (error) {
        if (this.esCancelacion(error) || corrida !== this.idCarga) return;
        await this.manejarError(error);
      } finally {
        if (corrida === this.idCarga) this.cargando = false;
      }
    },
    async buscarConFiltros() {
      clearTimeout(this.temporizadorBusqueda);
      if (this.cargando) return;

      const corrida = ++this.idCarga;
      this.abortarBusqueda();
      this.controladorBusqueda = new AbortController();

      this.buscando = true;
      this.error = "";
      this.puedeReintentar = false;

      const params = { todos: true };
      const nombre = String(this.filtros.nombre || "").trim();
      if (nombre) params.nombre = nombre;
      if (this.filtros.estados.length) params.estado = [...this.filtros.estados];

      try {
        const response = await actividadService.buscar(
          this.proyecto.idProyecto,
          params,
          this.controladorBusqueda.signal
        );
        if (corrida !== this.idCarga) return;

        const contenido = response?.data?.contenido;
        this.actividades = Array.isArray(contenido) ? contenido : [];
      } catch (error) {
        if (this.esCancelacion(error) || corrida !== this.idCarga) return;
        await this.manejarError(error);
      } finally {
        if (corrida === this.idCarga) this.buscando = false;
      }
    },
    programarBusqueda() {
      clearTimeout(this.temporizadorBusqueda);
      this.temporizadorBusqueda = setTimeout(() => {
        this.buscarConFiltros();
      }, 350);
    },
    abortarBusqueda() {
      if (this.controladorBusqueda) {
        this.controladorBusqueda.abort();
        this.controladorBusqueda = null;
      }
    },
    esCancelacion(error) {
      return (
        error?.code === "ERR_CANCELED" ||
        error?.name === "CanceledError" ||
        error?.name === "AbortError"
      );
    },
    async manejarError(error) {
      const status = error?.response?.status;
      const mensaje = error?.response?.data?.message || "";
      this.error = "";

      if (status === 403) {
        this.error =
          mensaje ||
          "No tenés acceso a las actividades de este proyecto.";
        return;
      }

      if (status === 404) {
        if (/perfil/i.test(mensaje)) {
          await refrescarSesion();
          this.$router.push({ name: "dashboard-usuario" });
          return;
        }
        this.error = /proyecto/i.test(mensaje)
          ? "El proyecto ya no existe o no está disponible."
          : mensajeErrorApi(error, "No se pudieron cargar las actividades.");
        return;
      }

      if (status === 401) {
        this.error = "Tu sesión expiró. Iniciá sesión nuevamente.";
        return;
      }

      if (!status || status >= 500) {
        this.puedeReintentar = true;
        this.error =
          "Ocurrió un error al cargar las actividades. Inténtalo nuevamente.";
        return;
      }

      this.error = mensajeErrorApi(
        error,
        "No se pudieron cargar las actividades."
      );
    },
  },
};
</script>

<style scoped>
.planificacion-proyecto {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.planificacion-proyecto__aviso {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 1rem 1.15rem;
  border: 1px solid var(--color-warning-border);
  border-radius: 10px;
  background: var(--color-warning-soft);
}

.planificacion-proyecto__aviso-titulo {
  margin: 0;
  color: var(--color-warning-text);
  font-size: 0.9rem;
  font-weight: 600;
}

.planificacion-proyecto__aviso-texto {
  margin: 0.2rem 0 0;
  color: var(--color-warning-text);
  font-size: 0.82rem;
}

.planificacion-proyecto__resumen {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 0.75rem;
}

.planificacion-proyecto__metrica {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.9rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
}

.planificacion-proyecto__metrica-label {
  color: var(--color-text-muted);
  font-size: 0.74rem;
  font-weight: 500;
}

.planificacion-proyecto__metrica-valor {
  color: var(--color-text);
  font-size: 1.05rem;
  font-weight: 700;
}

.planificacion-proyecto__metrica-valor--suave {
  font-size: 0.9rem;
  font-weight: 600;
}

.planificacion-proyecto__metrica-valor--alerta {
  color: var(--color-danger-text);
}

.planificacion-proyecto__metrica-hint {
  color: var(--color-text-muted);
  font-size: 0.7rem;
}

.planificacion-proyecto__panel {
  padding: 1.15rem 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
}

.planificacion-proyecto__panel-cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 0.9rem;
}

.planificacion-proyecto__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1rem;
  font-weight: 600;
}

.planificacion-proyecto__subtitulo {
  margin: 0.2rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.78rem;
}

.planificacion-proyecto__nota {
  margin: 0 0 0.85rem;
  color: var(--color-text-muted);
  font-size: 0.82rem;
}

.planificacion-proyecto__reintento {
  margin: 0.75rem 0;
}

.planificacion-proyecto__actualizando {
  margin: 0 0 0.6rem;
  color: var(--color-text-muted);
  font-size: 0.75rem;
}

.planificacion-proyecto__cargando {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem 0;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.planificacion-proyecto__cargando .material-symbols-outlined {
  animation: girar 1.2s linear infinite;
}

@keyframes girar {
  to {
    transform: rotate(360deg);
  }
}

.btn-agregar-actividad {
  --va-background-color: #494776 !important;
  --va-background-color-opacity: 1 !important;
  --va-button-font-weight: 400 !important;
  background: #494776 !important;
  color: #ffffff !important;
  font-weight: 400 !important;
  border: 2px solid #6e6ba8 !important;
  border-radius: 10px !important;
}

.btn-agregar-actividad :deep(.va-button__content) {
  color: #ffffff !important;
  font-weight: 600 !important;
}

.btn-agregar-actividad__icono {
  color: inherit;
  font-size: 1.4rem;
  line-height: 1;
  margin-right: 0.45rem;
  font-variation-settings: "FILL" 0, "wght" 300, "GRAD" 0, "opsz" 24;
}

.btn-agregar-actividad:hover:not(:disabled) {
  --va-background-color: #3b3a63 !important;
  background: #3b3a63 !important;
  border-color: #6e6ba8 !important;
}

.btn-agregar-actividad:disabled {
  opacity: 0.5;
}

[data-theme="dark"] .btn-agregar-actividad {
  --va-background-color: #8d86e0 !important;
  background: #8d86e0 !important;
  color: #17161f !important;
  border: 1px solid #6f68c7 !important;
}

[data-theme="dark"] .btn-agregar-actividad :deep(.va-button__content) {
  color: #17161f !important;
}

[data-theme="dark"] .btn-agregar-actividad__icono {
  color: #17161f;
}

[data-theme="dark"] .btn-agregar-actividad:hover:not(:disabled) {
  --va-background-color: #a49ef0 !important;
  background: #a49ef0 !important;
  border-color: #6f68c7 !important;
}
</style>
