<template>
  <VaModal
    :model-value="modelValue"
    hide-default-actions
    :no-dismiss="eliminando"
    blur
    size="small"
    class="eliminar-integrante-modal"
    @update:model-value="onCambioVisibilidad"
  >
    <template #header>
      <h3 class="va-h5 eliminar-integrante-modal__titulo">
        Eliminar integrante
      </h3>
    </template>

    <p class="eliminar-integrante-modal__intro">
      Estás por desvincular a
      <strong>{{ nombreIntegrante }}</strong>
      del proyecto <strong>{{ nombreProyecto || "este proyecto" }}</strong>.
    </p>

    <p class="eliminar-integrante-modal__intro">
      Esta acción no se puede deshacer desde la interfaz.
    </p>

    <ul class="eliminar-integrante-modal__advertencias">
      <li>Se conservarán las asignaciones históricas a actividades.</li>
      <li>Se reabrirán las vacantes correspondientes.</li>
      <li>Se enviará una notificación al perfil eliminado.</li>
    </ul>

    <BaseAlert
      v-if="error"
      :message="error"
      type="error"
      class="eliminar-integrante-modal__alerta"
    />

    <div class="eliminar-integrante-modal__form">
      <VaTextarea
        v-model="motivo"
        label="Motivo de la eliminación"
        placeholder="Contanos por qué eliminás a este integrante..."
        :max-length="LIMITE_MOTIVO_BAJA"
        counter
        :rows="3"
        :disabled="eliminando"
        :error="!!errorMotivo"
        :error-messages="errorMotivo || undefined"
      />
    </div>

    <template #footer>
      <div class="eliminar-integrante-modal__acciones">
        <VaButton preset="secondary" :disabled="eliminando" @click="cerrar">
          Volver
        </VaButton>
        <VaButton
          color="danger"
          :loading="eliminando"
          :disabled="!puedeConfirmar"
          :aria-busy="eliminando ? 'true' : 'false'"
          @click="confirmar"
        >
          Eliminar integrante
        </VaButton>
      </div>
    </template>
  </VaModal>
</template>

<script>
import BaseAlert from "../AlertaBase.vue";
import { LIMITE_MOTIVO_BAJA } from "../../utils/integranteConstants.js";

/*
 * Confirmación de UC-38. El modal mantiene el motivo y su texto ante errores
 * 400: el padre sólo actualiza `errorMotivo` y no cambia `modelValue`.
 */
export default {
  name: "ModalEliminarIntegrante",
  components: { BaseAlert },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    miembro: {
      type: Object,
      default: null,
    },
    nombreProyecto: {
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
    nombreIntegrante() {
      return (
        this.miembro?.nombreArtistico ||
        this.miembro?.nombreUsuario ||
        "este integrante"
      );
    },
    puedeConfirmar() {
      const motivo = this.motivo.trim();
      return (
        !this.eliminando &&
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
      if (this.eliminando && !valor) return;
      this.$emit("update:modelValue", valor);
    },
    limpiar() {
      this.motivo = "";
    },
    cerrar() {
      if (this.eliminando) return;
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
.eliminar-integrante-modal__titulo {
  margin: 0;
}

.eliminar-integrante-modal__intro {
  margin: 0.25rem 0 0.5rem;
  color: var(--color-text, #232134);
  font-size: 0.94rem;
  line-height: 1.5;
}

.eliminar-integrante-modal__advertencias {
  margin: 0.5rem 0 0.9rem;
  padding-left: 1.15rem;
  color: var(--color-text-muted, #5b5b6b);
  font-size: 0.82rem;
  line-height: 1.5;
}

.eliminar-integrante-modal__alerta {
  margin-top: 0 !important;
  margin-bottom: 0.9rem;
}

.eliminar-integrante-modal__form {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.eliminar-integrante-modal__acciones {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
  width: 100%;
}
</style>
