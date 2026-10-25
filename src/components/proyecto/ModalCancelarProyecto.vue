<template>
  <VaModal
    :model-value="modelValue"
    hide-default-actions
    :no-dismiss="cancelando"
    blur
    size="small"
    class="cancelar-proyecto-modal"
    @update:model-value="onCambioVisibilidad"
  >
    <template #header>
      <h3 class="va-h5 cancelar-proyecto-modal__titulo">Cancelar proyecto</h3>
    </template>

    <p class="cancelar-proyecto-modal__intro">
      Estás por cancelar
      <strong>{{ nombreProyecto || "este proyecto" }}</strong>.
      Esta acción cancelará el proyecto y no puede deshacerse.
    </p>

    <BaseAlert
      v-if="error"
      :message="error"
      type="error"
      class="cancelar-proyecto-modal__alerta"
    />

    <div class="cancelar-proyecto-modal__form">
      <VaTextarea
        v-model="motivo"
        label="Motivo de cancelación"
        placeholder="Contanos por qué cancelás el proyecto..."
        :max-length="LIMITE_MOTIVO"
        counter
        :rows="3"
        :disabled="cancelando"
      />

      <VaInput
        v-model="confirmacion"
        :label="`Escribí ${PALABRA_CONFIRMACION} para confirmar`"
        :placeholder="PALABRA_CONFIRMACION"
        :disabled="cancelando"
        autocomplete="off"
      />
    </div>

    <template #footer>
      <div class="cancelar-proyecto-modal__acciones">
        <VaButton preset="secondary" :disabled="cancelando" @click="cerrar">
          Volver
        </VaButton>
        <VaButton
          color="danger"
          :loading="cancelando"
          :disabled="!puedeConfirmar"
          @click="confirmar"
        >
          Cancelar proyecto
        </VaButton>
      </div>
    </template>
  </VaModal>
</template>

<script>
/*
 * Confirmación de cancelación de proyecto (UC-35, ficha §8.2).
 * Exige un motivo no vacío de hasta 200 caracteres y la palabra CANCELAR
 * escrita de forma exacta (sensible a mayúsculas). `confirmar` delega la
 * petición al dashboard; cerrar (X / overlay / ESC) se bloquea mientras
 * `cancelando`. Los errores 400 mantienen el modal abierto y conservan el
 * texto porque el estado local no se limpia ante errores.
 */
import BaseAlert from "../AlertaBase.vue";

const LIMITE_MOTIVO = 200;
const PALABRA_CONFIRMACION = "CANCELAR";

export default {
  name: "ModalCancelarProyecto",
  components: { BaseAlert },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    nombreProyecto: {
      type: String,
      default: "",
    },
    cancelando: {
      type: Boolean,
      default: false,
    },
    error: {
      type: String,
      default: "",
    },
  },
  emits: ["update:modelValue", "confirmar"],
  data() {
    return {
      LIMITE_MOTIVO,
      PALABRA_CONFIRMACION,
      motivo: "",
      confirmacion: "",
    };
  },
  computed: {
    puedeConfirmar() {
      const motivo = this.motivo.trim();
      return (
        !this.cancelando &&
        !!motivo &&
        motivo.length <= LIMITE_MOTIVO &&
        this.confirmacion === PALABRA_CONFIRMACION
      );
    },
  },
  watch: {
    modelValue(visible) {
      if (!visible) this.limpiar();
    },
  },
  methods: {
    onCambioVisibilidad(valor) {
      if (this.cancelando && !valor) return;
      this.$emit("update:modelValue", valor);
    },
    limpiar() {
      this.motivo = "";
      this.confirmacion = "";
    },
    cerrar() {
      if (this.cancelando) return;
      this.$emit("update:modelValue", false);
    },
    confirmar() {
      if (!this.puedeConfirmar) return;
      this.$emit("confirmar", this.motivo.trim());
    },
  },
};
</script>

<style scoped>
.cancelar-proyecto-modal__titulo {
  margin: 0;
}

.cancelar-proyecto-modal__intro {
  margin: 0.25rem 0 0.5rem;
  color: var(--color-text, #232134);
  font-size: 0.95rem;
  line-height: 1.5;
}

.cancelar-proyecto-modal__alerta {
  margin-top: 0 !important;
  margin-bottom: 1rem;
}

.cancelar-proyecto-modal__form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cancelar-proyecto-modal__acciones {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
  width: 100%;
}
</style>
