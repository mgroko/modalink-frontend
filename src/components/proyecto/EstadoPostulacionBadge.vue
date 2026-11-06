<template>
  <span class="estado-postulacion-badge" :style="estilo" role="status">
    {{ etiqueta }}
  </span>
</template>

<script>
import {
  coloresEstadoPostulacion,
  etiquetaEstadoPostulacion,
} from "../../utils/postulacionConstants.js";

/*
 * Chip de estado de una postulación (UC-74). Fuente única de colores:
 * COLORES_ESTADO_POSTULACION en postulacionConstants.js.
 */
export default {
  name: "EstadoPostulacionBadge",
  props: {
    estado: {
      type: String,
      default: "",
    },
  },
  computed: {
    etiqueta() {
      return etiquetaEstadoPostulacion(this.estado);
    },
    estilo() {
      const colores = coloresEstadoPostulacion(this.estado);
      return {
        backgroundColor: colores.fondo,
        color: colores.texto,
        borderColor: colores.borde,
      };
    },
  },
};
</script>

<style scoped>
.estado-postulacion-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.6rem;
  border: 1px solid;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.4;
  white-space: nowrap;
}
</style>
