<template>
  <VaModal
    :model-value="modelValue"
    hide-default-actions
    :no-dismiss="dandoDeBaja"
    blur
    size="small"
    class="darse-de-baja-modal"
    @update:model-value="onCambioVisibilidad"
  >
    <template #header>
      <h3 class="va-h5 darse-de-baja-modal__titulo">
        Darse de baja del proyecto
      </h3>
    </template>

    <p class="darse-de-baja-modal__intro">
      ¿Querés darte de baja del proyecto
      <strong>{{ nombreProyecto || "este proyecto" }}</strong>?
      Esta acción desvincula tu perfil del proyecto.
    </p>

    <ul class="darse-de-baja-modal__advertencias">
      <li>Tus asignaciones quedarán como historial y no se borrarán.</li>
      <li>Las vacantes de los requerimientos se reabrirán automáticamente.</li>
      <li>Se notificará a los directores activos restantes.</li>
    </ul>

    <BaseAlert
      v-if="error"
      :message="error"
      type="error"
      class="darse-de-baja-modal__alerta"
    />

    <div class="darse-de-baja-modal__form">
      <VaTextarea
        v-model="motivo"
        label="Motivo de la baja"
        placeholder="Contanos por qué te das de baja..."
        :max-length="LIMITE_MOTIVO_BAJA"
        counter
        :rows="3"
        :disabled="dandoDeBaja"
        :error="!!errorMotivo"
        :error-messages="errorMotivo || undefined"
      />
    </div>

    <template #footer>
      <div class="darse-de-baja-modal__acciones">
        <VaButton preset="secondary" :disabled="dandoDeBaja" @click="cerrar">
          Volver
        </VaButton>
        <VaButton
          color="danger"
          :loading="dandoDeBaja"
          :disabled="!puedeConfirmar"
          :aria-busy="dandoDeBaja ? 'true' : 'false'"
          @click="confirmar"
        >
          Darse de baja
        </VaButton>
      </div>
    </template>
  </VaModal>
</template>

<script>
import BaseAlert from "../AlertaBase.vue";
import { LIMITE_MOTIVO_BAJA } from "../../utils/integranteConstants.js";

/*
 * Confirmación de UC-40. El motivo es obligatorio y tiene un máximo de 100
 * caracteres. Ante un 400 el padre sólo actualiza `errorMotivo`: el modal
 * conserva el texto porque no se cierra ni se limpia.
 */
export default {
  name: "ModalDarseDeBajaProyecto",
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
    dandoDeBaja: {
      type: Boolean,
      default: false,
    },
    error: {
      type: String,
      default: "",
    },
    errorMotivo: {
      type: String,
      default: "",
    },
  },
  emits: ["update:modelValue", "confirmar"],
  data() {
    return {
      LIMITE_MOTIVO_BAJA,
      motivo: "",
    };
  },
  computed: {
    puedeConfirmar() {
      const motivo = this.motivo.trim();
      return (
        !this.dandoDeBaja &&
        !!motivo &&
        motivo.length <= this.LIMITE_MOTIVO_BAJA
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
      if (this.dandoDeBaja && !valor) return;
      this.$emit("update:modelValue", valor);
    },
    limpiar() {
      this.motivo = "";
    },
    cerrar() {
      if (this.dandoDeBaja) return;
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
.darse-de-baja-modal__titulo {
  margin: 0;
}

.darse-de-baja-modal__intro {
  margin: 0.25rem 0 0.5rem;
  color: var(--color-text, #232134);
  font-size: 0.94rem;
  line-height: 1.5;
}

.darse-de-baja-modal__advertencias {
  margin: 0.5rem 0 0.9rem;
  padding-left: 1.15rem;
  color: var(--color-text-muted, #5b5b6b);
  font-size: 0.82rem;
  line-height: 1.5;
}

.darse-de-baja-modal__alerta {
  margin-top: 0 !important;
  margin-bottom: 0.9rem;
}

.darse-de-baja-modal__form {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.darse-de-baja-modal__acciones {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
  width: 100%;
}
</style>
