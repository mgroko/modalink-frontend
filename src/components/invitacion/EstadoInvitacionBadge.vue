<template>
  <span class="estado-invitacion-badge" :style="estilo" role="status">
    {{ etiqueta }}
  </span>
</template>

<script>
import {
  coloresEstadoInvitacion,
  etiquetaEstadoInvitacion,
} from "../../utils/invitacionBusquedaConstants.js";

export default {
  name: "EstadoInvitacionBadge",
  props: {
    estado: {
      type: String,
      default: "",
    },
  },
  computed: {
    etiqueta() {
      return etiquetaEstadoInvitacion(this.estado);
    },
    estilo() {
      const colores = coloresEstadoInvitacion(this.estado);
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
.estado-invitacion-badge {
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
