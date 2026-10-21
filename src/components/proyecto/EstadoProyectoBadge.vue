<template>
  <span class="estado-proyecto-badge" :style="estilo" role="status" :title="etiqueta">
    {{ etiqueta }}
  </span>
</template>

<script>
import {
  ESTADOS_PROYECTO,
  coloresEstadoProyecto,
  normalizarEstadoProyecto,
} from "../../utils/proyectoConstants.js";

/*
 * Chip de estado del proyecto (Estados proyecto.png).
 * Fuente única de colores: COLORES_ESTADO_PROYECTO en proyectoConstants.js.
 */
export default {
  name: "EstadoProyectoBadge",
  props: {
    estado: {
      type: String,
      default: "",
    },
  },
  computed: {
    etiqueta() {
      return normalizarEstadoProyecto(this.estado) || ESTADOS_PROYECTO.BORRADOR;
    },
    colores() {
      return coloresEstadoProyecto(this.estado);
    },
    estilo() {
      return {
        backgroundColor: this.colores.fondo,
        color: this.colores.texto,
        borderColor: this.colores.borde,
      };
    },
  },
};
</script>

<style scoped>
.estado-proyecto-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.6rem;
  border: 1px solid var(--color-border-strong);
  border-radius: 6px;
  background: var(--color-surface-muted);
  color: var(--color-text);
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.4;
  white-space: nowrap;
}
</style>
