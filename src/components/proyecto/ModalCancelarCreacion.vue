<template>
  <VaModal
    :model-value="modelValue"
    hide-default-actions
    blur
    size="small"
    class="cancelar-crear-proyecto-modal"
    @update:model-value="onCambioVisibilidad"
  >
    <template #header>
      <h3 class="va-h5 cancelar-crear-proyecto-modal__titulo">
        ¿Cancelar creación de proyecto?
      </h3>
    </template>

    <p class="cancelar-crear-proyecto-modal__mensaje">Se perderán los datos que cargaste</p>

    <template #footer>
      <div class="cancelar-crear-proyecto-modal__acciones">
        <VaButton preset="primary" @click="seguirEditando">Seguir editando</VaButton>
        <VaButton preset="secondary" class="cancelar-crear-proyecto-modal__descartar" @click="descartar">
          Descartar y salir
        </VaButton>
      </div>
    </template>
  </VaModal>
</template>

<script>
/*
 * Confirmación de cancelación (Modal confirmación cancelar.png).
 * `confirmar` = descartar y salir; cerrar (X / overlay / ESC) = seguir editando.
 */
export default {
  name: "ModalCancelarCreacion",
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["update:modelValue", "confirmar"],
  methods: {
    onCambioVisibilidad(valor) {
      this.$emit("update:modelValue", valor);
    },
    seguirEditando() {
      this.$emit("update:modelValue", false);
    },
    descartar() {
      this.$emit("update:modelValue", false);
      this.$emit("confirmar");
    },
  },
};
</script>

<style scoped>
.cancelar-crear-proyecto-modal__titulo {
  margin: 0;
}

.cancelar-crear-proyecto-modal__mensaje {
  margin: 0.25rem 0 0.5rem;
  color: var(--color-text, #232134);
  font-size: 0.95rem;
}

.cancelar-crear-proyecto-modal__acciones {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
  width: 100%;
}

.cancelar-crear-proyecto-modal__descartar {
  border: none !important;
  background: transparent !important;
  color: var(--color-primary, #494776) !important;
  font-weight: 600;
}
</style>
