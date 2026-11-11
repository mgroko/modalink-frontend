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
      :mostrar-acciones-baja="mostrarAccionesBaja"
      :permitir-baja-colaborador="permitirBajaColaborador"
      @abrir-galeria="$emit('abrir-galeria', $event)"
      @ver-proyecto="$emit('ver-proyecto', $event)"
      @editar="$emit('editar', $event)"
      @invitar="$emit('invitar', $event)"
      @eliminar="$emit('eliminar', $event)"
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
    mostrarAccionesBaja: {
      type: Boolean,
      default: false,
    },
    permitirBajaColaborador: {
      type: Boolean,
      default: true,
    },
  },
  emits: [
    "update:modelValue",
    "abrir-galeria",
    "ver-proyecto",
    "editar",
    "invitar",
    "eliminar",
  ],
};
</script>
