<template>
  <button
    type="button"
    class="reemplazo-resumen"
    :class="{ 'reemplazo-resumen--activo': activo }"
    :aria-pressed="activo ? 'true' : 'false'"
    @click="$emit('abrir', reemplazo)"
  >
    <span class="reemplazo-resumen__cabecera">
      <span
        class="reemplazo-resumen__estado"
        :class="`reemplazo-resumen__estado--${tonoEstado}`"
      >
        {{ etiquetaEstado }}
      </span>
      <span
        v-if="requiereAtencion"
        class="reemplazo-resumen__atencion"
        title="El proceso quedó sin candidatos y requiere una decisión"
      >
        Requiere atención
      </span>
    </span>

    <span class="reemplazo-resumen__titulo">
      {{ descripcionVacante(reemplazo) }}
    </span>

    <span class="reemplazo-resumen__detalle">
      {{ detalleVacante(reemplazo) }}
    </span>

    <span class="reemplazo-resumen__meta">
      <span>{{ etiquetaTipoReemplazo(reemplazo.tipo) }}</span>
      <span v-if="reemplazo.profesion">{{ reemplazo.profesion }}</span>
      <span>{{ reemplazo.totalCandidatos }} candidatos</span>
      <span>{{ reemplazo.totalInvitados }} invitados</span>
    </span>

    <span v-if="reemplazo.perfilBaja" class="reemplazo-resumen__baja">
      Baja de {{ reemplazo.perfilBaja }} · {{ etiquetaOrigenReemplazo(reemplazo.origen) }}
    </span>

    <span v-if="fechaCreacion" class="reemplazo-resumen__fecha">
      Creado el {{ fechaCreacion }}
    </span>

    <span
      v-if="reemplazo.motivoCierre"
      class="reemplazo-resumen__motivo-cierre"
    >
      {{ reemplazo.motivoCierre }}
    </span>
  </button>
</template>

<script>
import { formatearFechaCorta } from "../../utils/fechas.js";
import {
  ESTADOS_REEMPLAZO,
  descripcionVacante,
  detalleVacante,
  etiquetaEstadoReemplazo,
  etiquetaOrigenReemplazo,
  etiquetaTipoReemplazo,
  tonoEstadoReemplazo,
} from "../../utils/reemplazoConstants.js";

export default {
  name: "ReemplazoResumenCard",
  props: {
    reemplazo: {
      type: Object,
      required: true,
    },
    activo: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["abrir"],
  computed: {
    etiquetaEstado() {
      return etiquetaEstadoReemplazo(this.reemplazo?.estado);
    },
    tonoEstado() {
      return tonoEstadoReemplazo(this.reemplazo?.estado);
    },
    requiereAtencion() {
      return this.reemplazo?.estado === ESTADOS_REEMPLAZO.SIN_CANDIDATOS;
    },
    fechaCreacion() {
      return this.reemplazo?.fechaCreacion
        ? formatearFechaCorta(this.reemplazo.fechaCreacion)
        : "";
    },
  },
  methods: {
    descripcionVacante,
    detalleVacante,
    etiquetaOrigenReemplazo,
    etiquetaTipoReemplazo,
  },
};
</script>

<style scoped>
.reemplazo-resumen {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  width: 100%;
  padding: 0.9rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s, background-color 0.15s;
}

.reemplazo-resumen:hover,
.reemplazo-resumen:focus-visible {
  border-color: var(--color-primary);
  box-shadow: 0 3px 12px rgba(35, 33, 52, 0.08);
  outline: none;
}

.reemplazo-resumen--activo {
  border-color: var(--color-primary);
  background: var(--color-surface-soft);
}

.reemplazo-resumen__motivo-cierre {
  color: var(--color-text-muted);
  font-size: 0.74rem;
  font-style: italic;
}

.reemplazo-resumen__cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.reemplazo-resumen__estado {
  display: inline-flex;
  align-items: center;
  padding: 0.1rem 0.5rem;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 700;
  line-height: 1.6;
}

.reemplazo-resumen__estado--warning {
  border-color: var(--color-warning-border);
  background: var(--color-warning-soft);
  color: var(--color-warning-text);
}

.reemplazo-resumen__estado--info {
  border-color: var(--color-info-border);
  background: var(--color-info-soft);
  color: var(--color-info-text);
}

.reemplazo-resumen__estado--success {
  border-color: var(--color-success-border);
  background: var(--color-success-soft);
  color: var(--color-success-text);
}

.reemplazo-resumen__estado--danger {
  border-color: var(--color-danger-border);
  background: var(--color-danger-soft);
  color: var(--color-danger-text);
}

.reemplazo-resumen__estado--neutral {
  border-color: var(--color-border);
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
}

.reemplazo-resumen__atencion {
  color: var(--color-warning-text);
  font-size: 0.68rem;
  font-weight: 700;
}

.reemplazo-resumen__titulo {
  color: var(--color-text);
  font-size: 0.92rem;
  font-weight: 700;
  line-height: 1.35;
}

.reemplazo-resumen__detalle,
.reemplazo-resumen__baja,
.reemplazo-resumen__fecha {
  color: var(--color-text-muted);
  font-size: 0.76rem;
  line-height: 1.4;
}

.reemplazo-resumen__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.65rem;
  color: var(--color-text-muted);
  font-size: 0.7rem;
}

.reemplazo-resumen__baja {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
