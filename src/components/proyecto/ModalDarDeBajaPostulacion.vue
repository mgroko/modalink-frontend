<template>
  <VaModal
    :model-value="modelValue"
    hide-default-actions
    :no-dismiss="eliminando"
    blur
    size="small"
    @update:model-value="onCambioVisibilidad"
  >
    <template #header>
      <h3 class="va-h5 baja-postulacion-modal__titulo">
        Retirar postulación
      </h3>
    </template>

    <p class="baja-postulacion-modal__intro">
      ¿Querés retirar tu postulación a
      <strong>{{ requerimiento || "este requerimiento" }}</strong>
      del proyecto <strong>{{ proyecto || "este proyecto" }}</strong>?
    </p>

    <p v-if="actividad" class="baja-postulacion-modal__intro">
      Actividad: <strong>{{ actividad }}</strong>
    </p>

    <p class="baja-postulacion-modal__aviso">
      <span class="material-symbols-outlined" aria-hidden="true">info</span>
      Esta acción no se puede deshacer. Vas a poder volver a postularte mientras
      el requerimiento tenga cupo.
    </p>

    <BaseAlert
      v-if="error"
      :message="error"
      type="error"
      class="baja-postulacion-modal__alerta"
    />

    <template #footer>
      <div class="baja-postulacion-modal__acciones">
        <VaButton preset="secondary" :disabled="eliminando" @click="cancelar">
          Cancelar
        </VaButton>
        <VaButton
          color="danger"
          :loading="eliminando"
          :aria-busy="eliminando ? 'true' : 'false'"
          @click="confirmar"
        >
          Retirar postulación
        </VaButton>
      </div>
    </template>
  </VaModal>
</template>

<script>
import BaseAlert from "../AlertaBase.vue";

/*
 * Confirmación de baja de UC-27: identifica proyecto, requerimiento y
 * actividad para evitar bajas por error.
 */
export default {
  name: "ModalDarDeBajaPostulacion",
  components: { BaseAlert },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    proyecto: {
      type: String,
      default: "",
    },
    requerimiento: {
      type: String,
      default: "",
    },
    actividad: {
      type: String,
      default: "",
    },
    eliminando: {
      type: Boolean,
      default: false,
    },
    error: {
      type: String,
      default: "",
    },
  },
  emits: ["update:modelValue", "confirmar"],
  methods: {
    onCambioVisibilidad(valor) {
      if (this.eliminando && !valor) return;
      this.$emit("update:modelValue", valor);
    },
    cancelar() {
      if (this.eliminando) return;
      this.$emit("update:modelValue", false);
    },
    confirmar() {
      if (this.eliminando) return;
      this.$emit("confirmar");
    },
  },
};
</script>

<style scoped>
.baja-postulacion-modal__titulo {
  margin: 0;
}

.baja-postulacion-modal__intro {
  margin: 0.25rem 0 0.75rem;
  color: var(--color-text);
  font-size: 0.92rem;
  line-height: 1.5;
}

.baja-postulacion-modal__aviso {
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
  margin: 0.5rem 0 0;
  padding: 0.6rem 0.7rem;
  border: 1px solid var(--color-warning-border);
  border-radius: 8px;
  background: var(--color-warning-soft);
  color: var(--color-warning-text);
  font-size: 0.8rem;
  line-height: 1.45;
}

.baja-postulacion-modal__aviso .material-symbols-outlined {
  font-size: 1rem;
}

.baja-postulacion-modal__alerta {
  margin-top: 0.85rem !important;
}

.baja-postulacion-modal__acciones {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
  width: 100%;
}
</style>
