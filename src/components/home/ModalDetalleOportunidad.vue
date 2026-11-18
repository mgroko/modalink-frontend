<template>
  <VaModal
    :model-value="modelValue"
    hide-default-actions
    blur
    size="medium"
    class="oportunidad-modal"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #header>
      <div class="oportunidad-modal__cabecera">
        <span class="oportunidad-modal__tipo">{{ tipoEtiqueta }}</span>
        <h3 class="va-h5 oportunidad-modal__titulo">{{ titulo }}</h3>
        <p v-if="nombreActividad" class="oportunidad-modal__actividad">
          Actividad: {{ nombreActividad }}
        </p>
      </div>
    </template>

    <div class="oportunidad-modal__contenido">
      <BaseAlert
        v-if="errorProyecto"
        :message="errorProyecto"
        type="warning"
      />

      <div
        v-if="cargandoProyecto"
        class="oportunidad-modal__cargando"
        role="status"
        aria-live="polite"
      >
        <span class="material-symbols-outlined" aria-hidden="true">
          hourglass_empty
        </span>
        Cargando detalles del proyecto...
      </div>

      <section class="oportunidad-modal__seccion">
        <h4>Proyecto</h4>

        <p v-if="descripcionProyecto" class="oportunidad-modal__descripcion">
          {{ descripcionProyecto }}
        </p>

        <dl class="oportunidad-modal__datos">
          <div v-if="estadoProyecto">
            <dt>Estado</dt>
            <dd><EstadoProyectoBadge :estado="estadoProyecto" /></dd>
          </div>
          <div v-if="ubicacionProyecto">
            <dt>Ubicación</dt>
            <dd>{{ ubicacionProyecto }}</dd>
          </div>
          <div v-if="directorProyecto">
            <dt>Director</dt>
            <dd>{{ directorProyecto }}</dd>
          </div>
          <div v-if="fechaInicioProyecto">
            <dt>Fecha de inicio</dt>
            <dd>{{ fechaInicioProyecto }}</dd>
          </div>
          <div v-if="fechaEntregaProyecto">
            <dt>Fecha de entrega</dt>
            <dd>{{ fechaEntregaProyecto }}</dd>
          </div>
          <div v-if="privacidadProyecto">
            <dt>Privacidad</dt>
            <dd>{{ privacidadProyecto }}</dd>
          </div>
        </dl>

        <p
          v-if="!cargandoProyecto && !proyecto && !errorProyecto"
          class="oportunidad-modal__nota"
        >
          No se pudieron cargar los detalles del proyecto.
        </p>
      </section>

      <section class="oportunidad-modal__seccion oportunidad-modal__seccion--requerimiento">
        <h4>Requerimiento</h4>

        <div class="oportunidad-modal__requerimiento-cabecera">
          <strong>{{ profesion }}</strong>
          <span v-if="cantidadTexto">{{ cantidadTexto }}</span>
        </div>

        <p v-if="descripcionOportunidad" class="oportunidad-modal__descripcion">
          {{ descripcionOportunidad }}
        </p>

        <dl class="oportunidad-modal__datos">
          <div v-if="esActividad && nombreActividad">
            <dt>Actividad</dt>
            <dd>{{ nombreActividad }}</dd>
          </div>
          <div v-if="fechaActividad">
            <dt>Fecha de la actividad</dt>
            <dd>{{ fechaActividad }}</dd>
          </div>
          <div v-if="fechaEntregaOportunidad && !fechaEntregaProyecto">
            <dt>Fecha de entrega</dt>
            <dd>{{ fechaEntregaOportunidad }}</dd>
          </div>
          <div v-if="cuposTexto">
            <dt>Cupo</dt>
            <dd>{{ cuposTexto }}</dd>
          </div>
        </dl>
      </section>
    </div>

    <template #footer>
      <div class="oportunidad-modal__acciones">
        <VaButton preset="secondary" @click="cerrar">
          Cerrar
        </VaButton>
        <VaButton
          color="primary"
          icon-right="mso-arrow_forward"
          :disabled="idProyecto == null"
          @click="verProyecto"
        >
          Ver proyecto
        </VaButton>
      </div>
    </template>
  </VaModal>
</template>

<script>
import proyectoService from "../../services/proyectoService.js";
import BaseAlert from "../AlertaBase.vue";
import EstadoProyectoBadge from "../proyecto/EstadoProyectoBadge.vue";
import { mensajeErrorApi } from "../../utils/apiError";
import { formatearFechaCorta } from "../../utils/fechas.js";
import { formatUbicacion } from "../../utils/ubicacion.js";
import { TIPOS_POSTULACION } from "../../utils/postulacionConstants.js";
import { ETIQUETAS_PRIVACIDAD } from "../../utils/proyectoConstants.js";

export default {
  name: "ModalDetalleOportunidad",
  components: {
    BaseAlert,
    EstadoProyectoBadge,
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    oportunidad: {
      type: Object,
      default: null,
    },
  },
  emits: ["update:modelValue", "ver-proyecto"],
  data() {
    return {
      proyecto: null,
      cargandoProyecto: false,
      errorProyecto: "",
      controlador: null,
    };
  },
  computed: {
    idProyecto() {
      return this.oportunidad?.idProyecto ?? this.proyecto?.idProyecto ?? null;
    },
    esActividad() {
      return (
        String(this.oportunidad?.tipo || "").toUpperCase() ===
        TIPOS_POSTULACION.ACTIVIDAD
      );
    },
    tipoEtiqueta() {
      return this.esActividad
        ? "Oportunidad de actividad"
        : "Oportunidad general";
    },
    titulo() {
      return (
        this.proyecto?.nombre ||
        this.oportunidad?.nombreProyecto ||
        "Proyecto"
      );
    },
    nombreActividad() {
      return this.oportunidad?.nombreActividad || "";
    },
    profesion() {
      return this.oportunidad?.nombreProfesion || "Perfil";
    },
    cantidad() {
      const cantidad = Number(this.oportunidad?.cantidad);
      return Number.isFinite(cantidad) && cantidad > 0 ? cantidad : null;
    },
    cantidadTexto() {
      if (this.cantidad == null) return "";
      return `${this.cantidad} persona${this.cantidad === 1 ? "" : "s"}`;
    },
    descripcionOportunidad() {
      return String(this.oportunidad?.descripcion || "").trim();
    },
    descripcionProyecto() {
      return (
        String(this.proyecto?.descripcion || "").trim() ||
        String(this.oportunidad?.descripcionProyecto || "").trim()
      );
    },
    estadoProyecto() {
      return this.proyecto?.estado || "";
    },
    ubicacionProyecto() {
      return formatUbicacion(this.proyecto?.ubicacion) || "";
    },
    directorProyecto() {
      return this.proyecto?.nombreDirector || "";
    },
    fechaInicioProyecto() {
      return this.formatearSiExiste(this.proyecto?.fechaInicio);
    },
    fechaEntregaProyecto() {
      return this.formatearSiExiste(
        this.proyecto?.fechaEntregaEstipulada
      );
    },
    fechaEntregaOportunidad() {
      return this.formatearSiExiste(this.oportunidad?.fechaEntrega);
    },
    fechaActividad() {
      return this.formatearSiExiste(
        this.oportunidad?.fechaHoraInicioActividad
      );
    },
    privacidadProyecto() {
      const privacidad = this.proyecto?.privacidad;
      return privacidad ? ETIQUETAS_PRIVACIDAD[privacidad] || privacidad : "";
    },
    cuposTexto() {
      if (this.oportunidad?.satisfecho === true) return "Cupo completo";
      const faltantes = Number(this.oportunidad?.faltantes);
      if (Number.isFinite(faltantes)) {
        if (faltantes <= 0) return "Cupo completo";
        return `${faltantes} cupo${faltantes === 1 ? "" : "s"} disponible${
          faltantes === 1 ? "" : "s"
        }`;
      }
      if (this.cantidad != null) {
        return `${this.cantidad} cupo${this.cantidad === 1 ? "" : "s"}`;
      }
      return "";
    },
  },
  watch: {
    modelValue(abierto) {
      if (abierto) {
        this.cargarProyecto();
      } else {
        this.abortar();
        this.cargandoProyecto = false;
      }
    },
    "oportunidad.idProyecto"() {
      if (this.modelValue) this.cargarProyecto();
    },
  },
  mounted() {
    if (this.modelValue) this.cargarProyecto();
  },
  beforeUnmount() {
    this.abortar();
  },
  methods: {
    formatearSiExiste(valor) {
      return valor ? formatearFechaCorta(valor) : "";
    },
    abortar() {
      if (this.controlador) {
        this.controlador.abort();
        this.controlador = null;
      }
    },
    async cargarProyecto() {
      this.proyecto = null;
      this.errorProyecto = "";
      this.abortar();

      if (this.idProyecto == null) {
        this.cargandoProyecto = false;
        return;
      }

      const controller = new AbortController();
      this.controlador = controller;
      this.cargandoProyecto = true;

      try {
        const response = await proyectoService.obtener(
          this.idProyecto,
          controller.signal
        );
        if (this.controlador !== controller) return;

        this.proyecto = response?.data || null;
        if (!this.proyecto) {
          this.errorProyecto =
            "No se pudieron cargar los detalles del proyecto.";
        }
      } catch (error) {
        if (
          this.controlador !== controller ||
          error?.code === "ERR_CANCELED" ||
          error?.name === "CanceledError" ||
          error?.name === "AbortError"
        ) {
          return;
        }
        this.proyecto = null;
        this.errorProyecto = mensajeErrorApi(
          error,
          "No se pudieron cargar los detalles del proyecto."
        );
      } finally {
        if (this.controlador === controller) {
          this.cargandoProyecto = false;
          this.controlador = null;
        }
      }
    },
    cerrar() {
      this.$emit("update:modelValue", false);
    },
    verProyecto() {
      if (this.idProyecto == null) return;
      this.$emit("ver-proyecto", {
        idProyecto: this.idProyecto,
        oportunidad: this.oportunidad,
      });
    },
  },
};
</script>

<style scoped>
.oportunidad-modal__cabecera {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.oportunidad-modal__tipo {
  color: var(--color-primary);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.oportunidad-modal__titulo {
  margin: 0;
  color: var(--color-text);
}

.oportunidad-modal__actividad {
  margin: 0.1rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.82rem;
}

.oportunidad-modal__contenido {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  max-height: 65vh;
  overflow-y: auto;
  padding-right: 0.2rem;
}

.oportunidad-modal__cargando {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.85rem;
  color: var(--color-text-muted);
  font-size: 0.82rem;
}

.oportunidad-modal__seccion {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 0.9rem 1rem;
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border-soft);
  border-radius: 10px;
}

.oportunidad-modal__seccion--requerimiento {
  border-color: var(--color-info-border);
  background: var(--color-info-soft);
}

.oportunidad-modal__seccion h4 {
  margin: 0;
  color: var(--color-text);
  font-size: 0.9rem;
  font-weight: 700;
}

.oportunidad-modal__descripcion {
  margin: 0;
  color: var(--color-text);
  font-size: 0.85rem;
  line-height: 1.5;
  white-space: pre-wrap;
}

.oportunidad-modal__datos {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin: 0;
}

.oportunidad-modal__datos div {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
}

.oportunidad-modal__datos dt {
  color: var(--color-text-muted);
  font-size: 0.78rem;
}

.oportunidad-modal__datos dd {
  margin: 0;
  color: var(--color-text);
  font-size: 0.82rem;
  text-align: right;
  overflow-wrap: anywhere;
}

.oportunidad-modal__requerimiento-cabecera {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
}

.oportunidad-modal__requerimiento-cabecera strong {
  color: var(--color-text);
  font-size: 0.95rem;
}

.oportunidad-modal__requerimiento-cabecera span {
  color: var(--color-primary);
  font-size: 0.78rem;
  font-weight: 600;
}

.oportunidad-modal__nota {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.oportunidad-modal__acciones {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  width: 100%;
}

@media (max-width: 600px) {
  .oportunidad-modal__datos div {
    flex-direction: column;
    gap: 0.1rem;
  }

  .oportunidad-modal__datos dd {
    text-align: left;
  }
}
</style>
