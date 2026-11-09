<template>
  <span class="aud-chip" :class="clase" :title="etiqueta">{{ etiqueta }}</span>
</template>

<script>
import {
  etiquetaEventoAuditoria,
  moduloDeEventoAuditoria,
} from "../../../utils/auditoriaConstants";

/**
 * Chip del tipo de evento, con color por módulo (mockups del UC-67).
 * Se reutiliza en la tabla, las cards móviles y el detalle.
 */
export default {
  name: "AuditoriaChipEvento",
  props: {
    evento: { type: Object, required: true },
    catalogo: { type: Array, default: () => [] },
  },
  computed: {
    etiqueta() {
      return etiquetaEventoAuditoria(this.evento);
    },
    clase() {
      return `aud-chip--${moduloDeEventoAuditoria(
        this.evento,
        this.catalogo
      )}`;
    },
  },
};
</script>

<style scoped>
.aud-chip {
  display: inline-block;
  overflow: hidden;
  max-width: 100%;
  padding: 0.2rem 0.6rem;
  text-overflow: ellipsis;
  white-space: nowrap;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  line-height: 1.4;
}

/* Color por módulo, con tokens del tema (claro/oscuro). */
.aud-chip--USUARIOS {
  color: var(--color-info-text);
  background: var(--color-info-soft);
}

.aud-chip--PROYECTOS {
  color: var(--color-success-text);
  background: var(--color-success-soft);
}

.aud-chip--POSTULACIONES {
  color: var(--color-warning-text);
  background: var(--color-warning-soft);
}

.aud-chip--INVITACIONES {
  color: var(--color-primary);
  background: var(--color-chip);
}

.aud-chip--ADMINISTRACION {
  color: var(--color-accent-dark);
  background: color-mix(in srgb, var(--color-accent) 18%, transparent);
}

.aud-chip--REPORTES {
  color: var(--color-danger-text);
  background: var(--color-danger-soft);
}

.aud-chip--SISTEMA {
  color: var(--color-text-muted);
  background: var(--color-surface-muted);
}
</style>
