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

    <nav class="planificacion-proyecto__pestanas" aria-label="Vistas de planificación">
      <button
        type="button"
        class="planificacion-proyecto__pestana"
        :class="{
          'planificacion-proyecto__pestana--activa':
            pestanaActiva === 'planificacion',
        }"
        :aria-current="pestanaActiva === 'planificacion' ? 'page' : undefined"
        @click="cambiarPestana('planificacion')"
      >
        <span class="material-symbols-outlined" aria-hidden="true">list</span>
        Planificación
      </button>
      <button
        type="button"
        class="planificacion-proyecto__pestana"
        :class="{
          'planificacion-proyecto__pestana--activa': pestanaActiva === 'cronograma',
        }"
        :aria-current="pestanaActiva === 'cronograma' ? 'page' : undefined"
        @click="cambiarPestana('cronograma')"
      >
        <span class="material-symbols-outlined" aria-hidden="true">timeline</span>
        Cronograma
      </button>
    </nav>

    <div v-show="pestanaActiva === 'planificacion'">
      <section class="planificacion-proyecto__panel">
        <header class="planificacion-proyecto__panel-cabecera">
          <div>
            <h2 class="planificacion-proyecto__titulo">Actividades</h2>
            <p class="planificacion-proyecto__subtitulo">
              {{ subtituloListado }}
            </p>
            <p v-if="textoCanceladas" class="planificacion-proyecto__subtitulo">
              {{ textoCanceladas }}
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

        <div
          v-if="error && puedeReintentar"
          class="planificacion-proyecto__reintento"
        >
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
          :puede-editar="puedeEditarActividad"
          :puede-eliminar="puedeEliminarActividad"
          @editar-actividad="$emit('editar-actividad', $event)"
          @eliminar-actividad="$emit('eliminar-actividad', $event)"
        />
      </section>
    </div>

    <div v-show="pestanaActiva === 'cronograma'">
      <CronogramaProyecto
        :id-proyecto="proyecto.idProyecto"
        :token-refresco="tokenRefresco"
        :activo="pestanaActiva === 'cronograma'"
      />
    </div>
  </section>
</template>

<script>
import actividadService from "../../services/actividadService.js";
import { refrescarSesion } from "../../services/authState";
import BaseAlert from "../AlertaBase.vue";
import FiltrosActividades from "./FiltrosActividades.vue";
import TablaActividades from "./TablaActividades.vue";
import CronogramaProyecto from "./CronogramaProyecto.vue";
import { esActividadCancelada } from "../../utils/actividadConstants.js";
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
    CronogramaProyecto,
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
    tokenRefresco: {
      type: Number,
      default: 0,
    },
  },
  emits: [
    "crear-actividad",
    "editar-actividad",
    "eliminar-actividad",
    "ir-modificar-proyecto",
    "limpiar-resaltado",
  ],
  data() {
    return {
      pestanaActiva: "planificacion",
      actividades: [],
      paginacion: {
        totalElementos: 0,
      },
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
    puedeEditarActividad() {
      return (
        this.permisos.includes("MODIFICAR_ACTIVIDAD") &&
        this.estadoPermiteActividades
      );
    },
    puedeEliminarActividad() {
      return (
        this.permisos.includes("ELIMINAR_ACTIVIDAD") &&
        this.estadoPermiteActividades
      );
    },
    tieneFechaEntrega() {
      return !!this.proyecto?.fechaEntregaEstipulada;
    },
    totalActividades() {
      const total = Number(this.paginacion.totalElementos);
      return Number.isFinite(total) && total > 0
        ? total
        : this.actividades.length;
    },
    canceladas() {
      return this.actividades.filter(esActividadCancelada).length;
    },
    textoCanceladas() {
      if (!this.canceladas) return "";
      return this.canceladas === 1
        ? "1 actividad cancelada incluida en la tabla."
        : `${this.canceladas} actividades canceladas incluidas en la tabla.`;
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
      const total = this.totalActividades;
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
    tokenRefresco() {
      if (this.filtrosActivos) {
        this.buscarConFiltros();
      } else {
        this.cargarTodo();
      }
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
    cambiarPestana(pestana) {
      if (pestana === this.pestanaActiva) return;
      this.pestanaActiva = pestana;
    },
    async cargarTodo() {
      const corrida = ++this.idCarga;
      this.abortarBusqueda();
      this.controladorBusqueda = new AbortController();

      this.cargando = true;
      this.buscando = false;
      this.error = "";
      this.puedeReintentar = false;

      try {
        const response = await actividadService.listarPlanificacion(
          this.proyecto.idProyecto,
          { todos: true, size: 100 },
          this.controladorBusqueda.signal
        );
        if (corrida !== this.idCarga) return;

        const data = response?.data || {};
        this.actividades = Array.isArray(data.contenido) ? data.contenido : [];
        this.paginacion.totalElementos = Number(data.totalElementos) || 0;
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

      const params = { todos: true, size: 100 };
      const nombre = String(this.filtros.nombre || "").trim();
      if (nombre) params.nombre = nombre;
      if (this.filtros.estados.length) params.estado = [...this.filtros.estados];

      try {
        const response = await actividadService.listarPlanificacion(
          this.proyecto.idProyecto,
          params,
          this.controladorBusqueda.signal
        );
        if (corrida !== this.idCarga) return;

        const data = response?.data || {};
        this.actividades = Array.isArray(data.contenido) ? data.contenido : [];
        this.paginacion.totalElementos = Number(data.totalElementos) || 0;
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

.planificacion-proyecto__pestanas {
  display: flex;
  gap: 0.35rem;
  padding: 0.3rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface-muted);
  align-self: flex-start;
}

.planificacion-proyecto__pestana {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.9rem;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}

.planificacion-proyecto__pestana .material-symbols-outlined {
  font-size: 1.1rem;
}

.planificacion-proyecto__pestana:hover {
  color: var(--color-text);
}

.planificacion-proyecto__pestana--activa {
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
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
