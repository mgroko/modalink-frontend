<template>
  <span
    v-if="estado"
    class="estado-contrato"
    :class="`estado-contrato--${variante}`"
  >
    {{ etiquetaEstadoContrato(estado) }}
  </span>
</template>

<script>
import {
  ESTADOS_CONTRATO,
  etiquetaEstadoContrato,
} from "../../utils/contratoConstants.js";

/*
 * Badge de estado del contrato. Es presentacional: recibe el estado del
 * backend y no recalcula reglas de negocio.
 */
export default {
  name: "EstadoContratoBadge",
  props: {
    estado: {
      type: String,
      default: "",
    },
  },
  computed: {
    variante() {
      switch (this.estado) {
        case ESTADOS_CONTRATO.PENDIENTE_FIRMA:
          return "pendiente";
        case ESTADOS_CONTRATO.ACTIVO:
          return "activo";
        case ESTADOS_CONTRATO.RECHAZADO_POR_PARTES:
          return "rechazado";
        case ESTADOS_CONTRATO.CANCELADO:
        case ESTADOS_CONTRATO.ELIMINADO:
          return "cancelado";
        case ESTADOS_CONTRATO.BORRADOR:
          return "borrador";
        default:
          return "neutral";
      }
    },
  },
  methods: {
    etiquetaEstadoContrato,
  },
};
</script>

<style scoped>
.estado-contrato {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.18rem 0.55rem;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  line-height: 1.35;
  white-space: nowrap;
}

.estado-contrato--pendiente {
  border-color: var(--color-warning-border);
  background: var(--color-warning-soft);
  color: var(--color-warning-text);
}

.estado-contrato--activo {
  border-color: var(--color-success-border);
  background: var(--color-success-soft);
  color: var(--color-success-text);
}

.estado-contrato--rechazado {
  border-color: var(--color-danger-border);
  background: var(--color-danger-soft);
  color: var(--color-danger-text);
}

.estado-contrato--cancelado {
  border-color: var(--color-border-strong);
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
}

.estado-contrato--borrador {
  border-color: var(--color-info-border);
  background: var(--color-info-soft);
  color: var(--color-info-text);
}

.estado-contrato--neutral {
  border-color: var(--color-border);
  background: var(--color-surface-soft);
  color: var(--color-text-muted);
}
</style>
