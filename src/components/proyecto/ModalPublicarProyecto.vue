<template>
  <VaModal
    :model-value="modelValue"
    hide-default-actions
    :no-dismiss="publicando"
    blur
    size="small"
    class="publicar-proyecto-modal"
    @update:model-value="onCambioVisibilidad"
  >
    <template #header>
      <h3 class="va-h5 publicar-proyecto-modal__titulo">Publicar proyecto</h3>
    </template>

    <p class="publicar-proyecto-modal__mensaje">{{ mensaje }}</p>

    <BaseAlert :message="error" type="error" />

    <template #footer>
      <div class="publicar-proyecto-modal__acciones">
        <VaButton preset="secondary" :disabled="publicando" @click="cancelar">
          Cancelar
        </VaButton>
        <VaButton preset="primary" :loading="publicando" @click="confirmar">
          Publicar
        </VaButton>
      </div>
    </template>
  </VaModal>
</template>

<script>
/*
 * Confirmación de publicación (UC-25, paso 3). El texto varía según la
 * privacidad del proyecto (definido con producto).
 * `confirmar` = llamar a POST /proyectos/{id}/publicar; cerrar (X / overlay /
 * ESC) = cancelar (bloqueado mientras `publicando`).
 */
import BaseAlert from "../AlertaBase.vue";
import { PRIVACIDADES } from "../../utils/proyectoConstants.js";

export default {
  name: "ModalPublicarProyecto",
  components: { BaseAlert },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    privacidad: {
      type: String,
      default: "",
    },
    publicando: {
      type: Boolean,
      default: false,
    },
    error: {
      type: String,
      default: "",
    },
  },
  emits: ["update:modelValue", "confirmar"],
  computed: {
    mensaje() {
      if (this.privacidad === PRIVACIDADES.PRIVADO) {
        return "Al publicar el proyecto será visible solo para sus contactos y no podrás volver a un borrador.";
      }
      return "Al publicar el proyecto será visible para todos los perfiles y no podrás volver a un borrador.";
    },
  },
  methods: {
    onCambioVisibilidad(valor) {
      if (this.publicando && !valor) return;
      this.$emit("update:modelValue", valor);
    },
    cancelar() {
      if (this.publicando) return;
      this.$emit("update:modelValue", false);
    },
    confirmar() {
      if (this.publicando) return;
      this.$emit("confirmar");
    },
  },
};
</script>

<style scoped>
.publicar-proyecto-modal__titulo {
  margin: 0;
}

.publicar-proyecto-modal__mensaje {
  margin: 0.25rem 0 0.5rem;
  color: var(--color-text, #232134);
  font-size: 0.95rem;
}

.publicar-proyecto-modal__acciones {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
  width: 100%;
}
</style>
