<template>
  <VaModal
    :model-value="modelValue"
    hide-default-actions
    size="medium"
    :no-dismiss="gestionando"
    blur
    class="detalle-reemplazo"
    @update:model-value="onCambioVisibilidad"
  >
    <template #header>
      <h3 class="va-h5 detalle-reemplazo__titulo">
        Detalle de invitación de reemplazo
      </h3>
    </template>

    <div v-if="invitacion" class="detalle-reemplazo__contenido">
      <section class="detalle-reemplazo__proyecto">
        <span class="detalle-reemplazo__label">Proyecto</span>
        <div class="detalle-reemplazo__proyecto-linea">
          <h4 class="detalle-reemplazo__proyecto-nombre">
            {{ invitacion.nombreProyecto || "Proyecto" }}
          </h4>
          <span
            class="detalle-reemplazo__estado"
            :class="`detalle-reemplazo__estado--${tonoEstado}`"
          >
            {{ etiquetaEstado }}
          </span>
        </div>
      </section>

      <section
        v-if="cargandoProyecto"
        class="detalle-reemplazo__proyecto-info detalle-reemplazo__proyecto-info--cargando"
      >
        <span class="material-symbols-outlined" aria-hidden="true">
          hourglass_empty
        </span>
        Cargando información del proyecto…
      </section>

      <section v-else-if="proyecto" class="detalle-reemplazo__proyecto-info">
        <header class="detalle-reemplazo__proyecto-info-cabecera">
          <span class="detalle-reemplazo__label">Información general</span>
          <EstadoProyectoBadge :estado="proyecto.estado" />
        </header>

        <p
          v-if="proyecto.descripcion"
          class="detalle-reemplazo__proyecto-descripcion"
          :title="proyecto.descripcion"
        >
          {{ proyecto.descripcion }}
        </p>

        <dl class="detalle-reemplazo__proyecto-meta">
          <div>
            <dt>Privacidad</dt>
            <dd>{{ privacidadProyecto }}</dd>
          </div>
          <div>
            <dt>Inicio</dt>
            <dd>{{ formatearFechaCorta(proyecto.fechaInicio) }}</dd>
          </div>
          <div>
            <dt>Entrega estimada</dt>
            <dd>{{ formatearFechaCorta(proyecto.fechaEntregaEstipulada) }}</dd>
          </div>
          <div v-if="proyecto.fechaFinalizacion">
            <dt>Finalización</dt>
            <dd>{{ formatearFechaCorta(proyecto.fechaFinalizacion) }}</dd>
          </div>
          <div>
            <dt>Director</dt>
            <dd>{{ proyecto.nombreDirector || "—" }}</dd>
          </div>
          <div v-if="ubicacionProyecto">
            <dt>Ubicación</dt>
            <dd>{{ ubicacionProyecto }}</dd>
          </div>
        </dl>
      </section>

      <p v-else-if="errorProyecto" class="detalle-reemplazo__proyecto-nota">
        {{ errorProyecto }}
      </p>

      <dl class="detalle-reemplazo__meta">
        <div>
          <dt>Tipo</dt>
          <dd>{{ etiquetaTipoReemplazo(invitacion.tipo) }}</dd>
        </div>
        <div>
          <dt>Vacante</dt>
          <dd>{{ descripcionInvitacionReemplazo(invitacion) }}</dd>
        </div>
        <div v-if="esActividad && invitacion.profesion">
          <dt>Profesión</dt>
          <dd>{{ invitacion.profesion }}</dd>
        </div>
        <div>
          <dt>Fecha de invitación</dt>
          <dd>{{ fechaInvitacion || "—" }}</dd>
        </div>
        <div v-if="fechaRespuesta">
          <dt>Fecha de respuesta</dt>
          <dd>{{ fechaRespuesta }}</dd>
        </div>
        <div v-if="inicioActividad">
          <dt>Actividad</dt>
          <dd>
            {{ inicioActividad }}
            <template v-if="duracionTexto"> · {{ duracionTexto }}</template>
          </dd>
        </div>
        <div v-if="invitacion.idReemplazo != null">
          <dt>Proceso</dt>
          <dd>#{{ invitacion.idReemplazo }}</dd>
        </div>
      </dl>

      <section class="detalle-reemplazo__bloque">
        <span class="detalle-reemplazo__label">Mensaje</span>
        <p
          class="detalle-reemplazo__mensaje"
          :class="{ 'detalle-reemplazo__mensaje--vacio': !invitacion.mensaje }"
        >
          {{ invitacion.mensaje || "Sin mensaje personalizado." }}
        </p>
      </section>

      <section v-if="motivoRespuesta" class="detalle-reemplazo__bloque">
        <span class="detalle-reemplazo__label">Motivo del rechazo</span>
        <p class="detalle-reemplazo__mensaje">{{ motivoRespuesta }}</p>
      </section>

      <p v-if="esAceptadaPendiente" class="detalle-reemplazo__aviso">
        Aceptaste esta invitación. Está pendiente de aprobación del director;
        si elige a otra persona, la invitación se cancelará.
      </p>

      <p v-if="puedeGestionar && esActividad" class="detalle-reemplazo__aviso">
        Se verificará tu disponibilidad. Si no hay una ventana válida, la
        invitación no se aceptará.
      </p>

      <BaseAlert v-if="error" :message="error" type="error" />

      <p v-if="error && mostrarRechazo" class="detalle-reemplazo__sugerencia">
        Podés rechazar la invitación para cerrar la gestión.
      </p>
    </div>

    <template #footer>
      <div class="detalle-reemplazo__acciones">
        <div class="detalle-reemplazo__acciones-izquierda">
          <VaButton
            v-if="puedeGestionar"
            preset="secondary"
            color="danger"
            :disabled="gestionando"
            @click="$emit('rechazar', invitacion)"
          >
            Rechazar invitación
          </VaButton>
        </div>

        <div class="detalle-reemplazo__acciones-principales">
          <VaButton
            v-if="puedeIrAlProyecto"
            preset="secondary"
            icon="mso-open_in_new"
            :disabled="gestionando"
            @click="$emit('ver-proyecto', invitacion)"
          >
            Ver proyecto
          </VaButton>
          <VaButton preset="secondary" :disabled="gestionando" @click="cerrar">
            Cerrar
          </VaButton>
          <VaButton
            v-if="puedeGestionar"
            preset="primary"
            :loading="gestionando"
            :disabled="gestionando"
            @click="aceptar"
          >
            Aceptar invitación
          </VaButton>
        </div>
      </div>
    </template>
  </VaModal>
</template>

<script>
import BaseAlert from "../AlertaBase.vue";
import EstadoProyectoBadge from "../proyecto/EstadoProyectoBadge.vue";
import proyectoService from "../../services/proyectoService.js";
import { formatearFecha, formatearFechaCorta } from "../../utils/fechas.js";
import {
  ESTADOS_CANDIDATO_REEMPLAZO,
  TIPOS_REEMPLAZO,
  descripcionInvitacionReemplazo,
  etiquetaEstadoCandidatoReemplazo,
  etiquetaTipoReemplazo,
  puedeGestionarInvitacionReemplazo,
  tonoEstadoCandidatoReemplazo,
} from "../../utils/reemplazoConstants.js";

export default {
  name: "ModalDetalleInvitacionReemplazo",
  components: { BaseAlert, EstadoProyectoBadge },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    invitacion: {
      type: Object,
      default: null,
    },
    gestionando: {
      type: Boolean,
      default: false,
    },
    error: {
      type: String,
      default: "",
    },
    mostrarRechazo: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["update:modelValue", "aceptar", "rechazar", "ver-proyecto"],
  data() {
    return {
      proyecto: null,
      cargandoProyecto: false,
      errorProyecto: "",
      idCargaProyecto: 0,
    };
  },
  computed: {
    puedeGestionar() {
      return puedeGestionarInvitacionReemplazo(this.invitacion);
    },
    esActividad() {
      return this.invitacion?.tipo === TIPOS_REEMPLAZO.ACTIVIDAD;
    },
    esAceptadaPendiente() {
      return (
        this.invitacion?.estado ===
        ESTADOS_CANDIDATO_REEMPLAZO.ACEPTADO_PENDIENTE_APROBACION
      );
    },
    etiquetaEstado() {
      return etiquetaEstadoCandidatoReemplazo(this.invitacion?.estado);
    },
    tonoEstado() {
      return tonoEstadoCandidatoReemplazo(this.invitacion?.estado);
    },
    idProyectoInvitacion() {
      return this.invitacion?.idProyecto ?? null;
    },
    /**
     * Se puede abrir el proyecto cuando la información se pudo cargar
     * (proyecto público / miembro del proyecto) o cuando la invitación ya
     * quedó aceptada.
     */
    puedeIrAlProyecto() {
      return this.idProyectoInvitacion != null && !!this.proyecto;
    },
    privacidadProyecto() {
      const privacidad = this.proyecto?.privacidad;
      if (privacidad === "PUBLICO") return "Público";
      if (privacidad === "PRIVADO") return "Privado";
      return privacidad || "—";
    },
    ubicacionProyecto() {
      const ciudad = this.proyecto?.ubicacion?.ciudad?.nombre;
      const provincia = this.proyecto?.ubicacion?.ciudad?.provincia?.nombre;
      return [ciudad, provincia].filter(Boolean).join(", ");
    },
    fechaInvitacion() {
      return this.invitacion?.fechaInvitacion
        ? formatearFechaCorta(this.invitacion.fechaInvitacion)
        : "";
    },
    fechaRespuesta() {
      return this.invitacion?.fechaRespuesta
        ? formatearFechaCorta(this.invitacion.fechaRespuesta)
        : "";
    },
    motivoRespuesta() {
      return String(this.invitacion?.motivoRespuesta || "").trim();
    },
    inicioActividad() {
      return this.invitacion?.fechaHoraInicio
        ? formatearFecha(this.invitacion.fechaHoraInicio)
        : "";
    },
    duracionTexto() {
      const minutos = Number(this.invitacion?.duracionMinutos);
      if (!Number.isFinite(minutos) || minutos <= 0) return "";
      if (minutos < 60) return `${minutos} min`;
      const horas = Math.floor(minutos / 60);
      const resto = minutos % 60;
      return resto ? `${horas} h ${resto} min` : `${horas} h`;
    },
  },
  watch: {
    modelValue(valor) {
      if (valor) {
        this.cargarProyecto();
      } else {
        this.idCargaProyecto += 1;
      }
    },
    "invitacion.idCandidato"() {
      this.proyecto = null;
      this.errorProyecto = "";
      if (this.modelValue) this.cargarProyecto();
    },
  },
  mounted() {
    if (this.modelValue) this.cargarProyecto();
  },
  beforeUnmount() {
    this.idCargaProyecto += 1;
  },
  methods: {
    formatearFechaCorta,
    descripcionInvitacionReemplazo,
    etiquetaTipoReemplazo,
    onCambioVisibilidad(valor) {
      if (this.gestionando && !valor) return;
      this.$emit("update:modelValue", valor);
    },
    cerrar() {
      if (this.gestionando) return;
      this.$emit("update:modelValue", false);
    },
    aceptar() {
      if (this.gestionando || !this.puedeGestionar) return;
      this.$emit("aceptar", this.invitacion);
    },
    async cargarProyecto() {
      const idProyecto = this.idProyectoInvitacion;
      this.proyecto = null;
      this.errorProyecto = "";

      if (idProyecto == null) {
        this.cargandoProyecto = false;
        return;
      }

      const corrida = ++this.idCargaProyecto;
      this.cargandoProyecto = true;

      try {
        const response = await proyectoService.obtener(idProyecto);
        if (corrida !== this.idCargaProyecto) return;
        this.proyecto = response?.data || null;
      } catch (error) {
        if (corrida !== this.idCargaProyecto) return;
        this.proyecto = null;
        this.errorProyecto =
          error?.response?.status === 403
            ? "El proyecto es privado: vas a poder ver su información cuando tu reemplazo sea aprobado."
            : "No se pudo cargar la información del proyecto.";
      } finally {
        if (corrida === this.idCargaProyecto) this.cargandoProyecto = false;
      }
    },
  },
};
</script>

<style scoped>
.detalle-reemplazo__titulo {
  margin: 0;
}

.detalle-reemplazo__contenido {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.detalle-reemplazo__proyecto {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.85rem 0.95rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface-muted);
}

.detalle-reemplazo__proyecto-linea {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.detalle-reemplazo__proyecto-nombre {
  margin: 0;
  color: var(--color-text);
  font-size: 1rem;
  font-weight: 700;
}

/* Información general del proyecto */
.detalle-reemplazo__proyecto-info {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding: 0.85rem 0.95rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface-soft);
}

.detalle-reemplazo__proyecto-info--cargando {
  flex-direction: row;
  align-items: center;
  gap: 0.4rem;
  color: var(--color-text-muted);
  font-size: 0.82rem;
}

.detalle-reemplazo__proyecto-info--cargando .material-symbols-outlined {
  font-size: 1.1rem;
}

.detalle-reemplazo__proyecto-info-cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.detalle-reemplazo__proyecto-descripcion {
  display: -webkit-box;
  overflow: hidden;
  margin: 0;
  color: var(--color-text);
  font-size: 0.85rem;
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.detalle-reemplazo__proyecto-meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.6rem 0.9rem;
  margin: 0;
}

.detalle-reemplazo__proyecto-meta div {
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
  min-width: 0;
}

.detalle-reemplazo__proyecto-meta dt {
  color: var(--color-text-muted);
  font-size: 0.68rem;
  font-weight: 600;
}

.detalle-reemplazo__proyecto-meta dd {
  overflow: hidden;
  margin: 0;
  color: var(--color-text);
  font-size: 0.8rem;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detalle-reemplazo__proyecto-nota {
  margin: 0;
  padding: 0.65rem 0.8rem;
  border-radius: 8px;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.detalle-reemplazo__label {
  color: var(--color-text-muted);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.detalle-reemplazo__meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.85rem;
  margin: 0;
}

.detalle-reemplazo__meta div {
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
}

.detalle-reemplazo__meta dt {
  color: var(--color-text-muted);
  font-size: 0.7rem;
  font-weight: 600;
}

.detalle-reemplazo__meta dd {
  margin: 0;
  color: var(--color-text);
  font-size: 0.82rem;
  font-weight: 600;
}

.detalle-reemplazo__bloque {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.detalle-reemplazo__mensaje {
  margin: 0;
  padding: 0.65rem 0.75rem;
  border-radius: 8px;
  background: var(--color-surface-muted);
  color: var(--color-text);
  font-size: 0.86rem;
  line-height: 1.5;
  white-space: pre-wrap;
}

.detalle-reemplazo__mensaje--vacio {
  color: var(--color-text-muted);
  font-style: italic;
}

.detalle-reemplazo__aviso {
  margin: 0;
  padding: 0.65rem 0.75rem;
  border: 1px solid var(--color-info-border);
  border-radius: 8px;
  background: var(--color-info-soft);
  color: var(--color-info-text);
  font-size: 0.8rem;
  line-height: 1.45;
}

.detalle-reemplazo__sugerencia {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.78rem;
  line-height: 1.45;
}

.detalle-reemplazo__estado {
  display: inline-flex;
  align-items: center;
  padding: 0.1rem 0.5rem;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 0.66rem;
  font-weight: 700;
  line-height: 1.6;
  white-space: nowrap;
}

.detalle-reemplazo__estado--warning {
  border-color: var(--color-warning-border);
  background: var(--color-warning-soft);
  color: var(--color-warning-text);
}

.detalle-reemplazo__estado--info {
  border-color: var(--color-info-border);
  background: var(--color-info-soft);
  color: var(--color-info-text);
}

.detalle-reemplazo__estado--success {
  border-color: var(--color-success-border);
  background: var(--color-success-soft);
  color: var(--color-success-text);
}

.detalle-reemplazo__estado--danger {
  border-color: var(--color-danger-border);
  background: var(--color-danger-soft);
  color: var(--color-danger-text);
}

.detalle-reemplazo__estado--neutral {
  border-color: var(--color-border);
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
}

.detalle-reemplazo__acciones {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
}

.detalle-reemplazo__acciones-izquierda,
.detalle-reemplazo__acciones-principales {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.detalle-reemplazo__acciones-principales {
  flex-wrap: wrap;
  justify-content: flex-end;
  margin-left: auto;
}

@media (max-width: 560px) {
  .detalle-reemplazo__meta {
    grid-template-columns: 1fr;
  }

  .detalle-reemplazo__proyecto-meta {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .detalle-reemplazo__proyecto-linea {
    align-items: flex-start;
    flex-direction: column;
  }

  .detalle-reemplazo__acciones {
    flex-direction: column-reverse;
    align-items: stretch;
  }

  .detalle-reemplazo__acciones-izquierda,
  .detalle-reemplazo__acciones-principales {
    flex-direction: column-reverse;
    margin-left: 0;
  }
}
</style>
