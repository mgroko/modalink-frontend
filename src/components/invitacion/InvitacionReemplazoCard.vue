<template>
  <article
    class="invitacion-reemplazo"
    role="button"
    tabindex="0"
    :aria-label="ariaLabel"
    @click="$emit('abrir', invitacion)"
    @keydown.enter="$emit('abrir', invitacion)"
    @keydown.space.prevent="$emit('abrir', invitacion)"
  >
    <div class="invitacion-reemplazo__cuerpo">
      <p class="invitacion-reemplazo__titulo">
        Invitación de reemplazo
      </p>

      <p class="invitacion-reemplazo__proyecto">
        Proyecto:
        <strong>{{ invitacion.nombreProyecto || "un proyecto" }}</strong>
      </p>

      <div class="invitacion-reemplazo__meta">
        <span
          class="invitacion-reemplazo__tipo"
          :class="`invitacion-reemplazo__tipo--${tipoClase}`"
        >
          {{ etiquetaTipoReemplazo(invitacion.tipo) }}
        </span>

        <span class="invitacion-reemplazo__dato">
          {{ esActividad ? "Actividad" : "Requerimiento" }}:
          {{ descripcionInvitacionReemplazo(invitacion) }}
        </span>

        <span
          v-if="esActividad && invitacion.profesion"
          class="invitacion-reemplazo__dato"
        >
          Profesión: {{ invitacion.profesion }}
        </span>

        <span v-if="fechaInvitacion" class="invitacion-reemplazo__dato">
          Invitación: {{ fechaInvitacion }}
        </span>

        <span v-if="fechaRespuesta" class="invitacion-reemplazo__dato">
          Respondida: {{ fechaRespuesta }}
        </span>

        <span v-if="inicioActividad" class="invitacion-reemplazo__dato">
          Actividad: {{ inicioActividad }}
          <template v-if="duracionTexto"> · {{ duracionTexto }}</template>
        </span>
      </div>

      <p v-if="invitacion.mensaje" class="invitacion-reemplazo__mensaje">
        {{ invitacion.mensaje }}
      </p>

      <p v-if="motivoRespuesta" class="invitacion-reemplazo__mensaje">
        Motivo del rechazo: {{ motivoRespuesta }}
      </p>

      <p
        v-if="esAceptadaPendiente"
        class="invitacion-reemplazo__aviso"
      >
        Aceptaste esta invitación. Está pendiente de aprobación del director.
      </p>
    </div>

    <div class="invitacion-reemplazo__lateral">
      <span
        class="invitacion-reemplazo__estado"
        :class="`invitacion-reemplazo__estado--${tonoEstado}`"
      >
        {{ etiquetaEstado }}
      </span>

      <div
        v-if="puedeGestionar"
        class="invitacion-reemplazo__acciones"
        @click.stop
        @keydown.stop
      >
        <VaButton
          preset="secondary"
          color="danger"
          size="small"
          @click.stop="$emit('rechazar', invitacion)"
        >
          Rechazar
        </VaButton>
        <VaButton
          preset="primary"
          size="small"
          @click.stop="$emit('aceptar', invitacion)"
        >
          Aceptar
        </VaButton>
      </div>
    </div>
  </article>
</template>

<script>
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
  name: "InvitacionReemplazoCard",
  props: {
    invitacion: {
      type: Object,
      required: true,
    },
  },
  emits: ["abrir", "aceptar", "rechazar"],
  computed: {
    ariaLabel() {
      const vacante = descripcionInvitacionReemplazo(this.invitacion);
      const proyecto = this.invitacion?.nombreProyecto || "un proyecto";
      return `Ver detalle de la invitación de reemplazo para ${vacante} en ${proyecto}`;
    },
    etiquetaEstado() {
      return etiquetaEstadoCandidatoReemplazo(this.invitacion?.estado);
    },
    tonoEstado() {
      return tonoEstadoCandidatoReemplazo(this.invitacion?.estado);
    },
    tipoClase() {
      return this.invitacion?.tipo === TIPOS_REEMPLAZO.ACTIVIDAD
        ? "actividad"
        : "general";
    },
    esActividad() {
      return this.invitacion?.tipo === TIPOS_REEMPLAZO.ACTIVIDAD;
    },
    puedeGestionar() {
      return puedeGestionarInvitacionReemplazo(this.invitacion);
    },
    esAceptadaPendiente() {
      return (
        this.invitacion?.estado ===
        ESTADOS_CANDIDATO_REEMPLAZO.ACEPTADO_PENDIENTE_APROBACION
      );
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
  methods: {
    descripcionInvitacionReemplazo,
    etiquetaTipoReemplazo,
  },
};
</script>

<style scoped>
.invitacion-reemplazo {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.15rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.invitacion-reemplazo:hover,
.invitacion-reemplazo:focus-visible {
  border-color: var(--color-primary);
  box-shadow: 0 4px 14px rgba(35, 33, 52, 0.08);
  outline: none;
}

.invitacion-reemplazo__cuerpo {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
}

.invitacion-reemplazo__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 0.92rem;
  line-height: 1.4;
}

.invitacion-reemplazo__proyecto {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.8rem;
  line-height: 1.4;
}

.invitacion-reemplazo__proyecto strong {
  color: var(--color-text);
}

.invitacion-reemplazo__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.6rem;
  color: var(--color-text-muted);
  font-size: 0.76rem;
}

.invitacion-reemplazo__tipo {
  display: inline-flex;
  align-items: center;
  padding: 0.1rem 0.5rem;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 600;
  white-space: nowrap;
}

.invitacion-reemplazo__tipo--general {
  border-color: var(--color-info-border);
  background: var(--color-info-soft);
  color: var(--color-info-text);
}

.invitacion-reemplazo__tipo--actividad {
  border-color: var(--color-success-border);
  background: var(--color-success-soft);
  color: var(--color-success-text);
}

.invitacion-reemplazo__mensaje {
  margin: 0.15rem 0 0;
  padding: 0.5rem 0.7rem;
  border-radius: 7px;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  font-size: 0.8rem;
  line-height: 1.4;
}

.invitacion-reemplazo__aviso {
  margin: 0.2rem 0 0;
  color: var(--color-info-text);
  font-size: 0.76rem;
  font-weight: 600;
}

.invitacion-reemplazo__lateral {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.65rem;
  flex: 0 0 auto;
}

.invitacion-reemplazo__estado {
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

.invitacion-reemplazo__estado--warning {
  border-color: var(--color-warning-border);
  background: var(--color-warning-soft);
  color: var(--color-warning-text);
}

.invitacion-reemplazo__estado--info {
  border-color: var(--color-info-border);
  background: var(--color-info-soft);
  color: var(--color-info-text);
}

.invitacion-reemplazo__estado--success {
  border-color: var(--color-success-border);
  background: var(--color-success-soft);
  color: var(--color-success-text);
}

.invitacion-reemplazo__estado--danger {
  border-color: var(--color-danger-border);
  background: var(--color-danger-soft);
  color: var(--color-danger-text);
}

.invitacion-reemplazo__estado--neutral {
  border-color: var(--color-border);
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
}

.invitacion-reemplazo__acciones {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

@media (max-width: 720px) {
  .invitacion-reemplazo {
    flex-direction: column;
  }

  .invitacion-reemplazo__lateral {
    width: 100%;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}
</style>
