<template>
  <span class="estado-colaboracion-automatica" :style="estilo">
    {{ etiqueta }}
  </span>
</template>

<script>
import {
  COLORES_ESTADO_COLABORACION_AUTOMATICA,
  ESTADOS_COLABORACION_AUTOMATICA,
  ETIQUETAS_ESTADO_COLABORACION_AUTOMATICA,
  normalizarEstadoColaboracionAutomatica,
} from "../../utils/colaboracionesAutomaticasConstants.js";

export default {
  name: "EstadoColaboracionAutomaticaBadge",
  props: {
    estado: {
      type: String,
      default: "",
    },
  },
  computed: {
    estadoNormalizado() {
      return (
        normalizarEstadoColaboracionAutomatica(this.estado) ||
        this.estado ||
        ""
      );
    },
    etiqueta() {
      return (
        ETIQUETAS_ESTADO_COLABORACION_AUTOMATICA[this.estadoNormalizado] ||
        this.estadoNormalizado ||
        "Sin estado"
      );
    },
    estilo() {
      const colores =
        COLORES_ESTADO_COLABORACION_AUTOMATICA[this.estadoNormalizado] ||
        COLORES_ESTADO_COLABORACION_AUTOMATICA[
          ESTADOS_COLABORACION_AUTOMATICA.PENDIENTE
        ];
      return {
        color: colores.texto,
        backgroundColor: colores.fondo,
        borderColor: colores.borde,
      };
    },
  },
};
</script>

<style scoped>
.estado-colaboracion-automatica {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.55rem;
  border: 1px solid;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  white-space: nowrap;
}
</style>
