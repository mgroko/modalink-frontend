<template>
  <VaModal
    :model-value="modelValue"
    hide-default-actions
    size="large"
    blur
    class="detalle-publicacion"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <PublicacionCard
      :publicacion="publicacion"
      modo="modal"
      @abrir-galeria="$emit('abrir-galeria', $event)"
      @ver-proyecto="$emit('ver-proyecto', $event)"
      @editar="$emit('editar', $event)"
      @invitar="$emit('invitar', $event)"
      @cerrar="$emit('update:modelValue', false)"
    />
  </VaModal>
</template>

<script>
import PublicacionCard from "./PublicacionCard.vue";

export default {
  name: "PublicacionDetalleModal",
  components: { PublicacionCard },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    publicacion: {
      type: Object,
      default: null,
    },
  },
  emits: ["update:modelValue", "abrir-galeria", "ver-proyecto", "editar", "invitar"],
};
</script>
