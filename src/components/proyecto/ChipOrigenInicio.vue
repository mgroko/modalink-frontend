<template>
  <span
    v-if="etiqueta"
    class="chip-origen-inicio"
    :style="estilo"
    :title="detalle || undefined"
  >
    {{ etiqueta }}
  </span>
</template>

<script>
import {
  detalleOrigenInicio,
  estiloOrigenInicio,
  etiquetaOrigenInicio,
} from "../../utils/origenInicioConstants.js";

/*
 * Chip de origen del inicio (ficha §2). Es solo lectura: no bloquea acciones.
 */
export default {
  name: "ChipOrigenInicio",
  props: {
    origen: {
      type: String,
      default: null,
    },
  },
  computed: {
    etiqueta() {
      return etiquetaOrigenInicio(this.origen);
    },
    detalle() {
      return detalleOrigenInicio(this.origen);
    },
    estilo() {
      return estiloOrigenInicio(this.origen);
    },
  },
};
</script>

<style scoped>
.chip-origen-inicio {
  display: inline-flex;
  align-items: center;
  padding: 0.1rem 0.5rem;
  border: 1px solid;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 600;
  line-height: 1.5;
  white-space: nowrap;
}
</style>
