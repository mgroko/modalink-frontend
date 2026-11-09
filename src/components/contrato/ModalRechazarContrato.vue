<template>
  <VaModal
    :model-value="modelValue"
    hide-default-actions
    :no-dismiss="rechazando"
    blur
    size="small"
    class="rechazar-contrato-modal"
    @update:model-value="onCambioVisibilidad"
  >
    <template #header>
      <h3 class="rechazar-contrato-modal__titulo">Rechazar contrato</h3>
    </template>

    <p class="rechazar-contrato-modal__intro">
      Vas a rechazar
      <strong>{{ contrato?.nombre || "este contrato" }}</strong>
      <template v-if="contrato?.nombreProyecto">
        del proyecto <strong>{{ contrato.nombreProyecto }}</strong>
      </template>. El motivo es obligatorio.
    </p>

    <VaTextarea
      v-model="motivo"
      label="Motivo del rechazo"
      placeholder="Contanos por qué rechazás el contrato..."
      :max-length="LIMITE_MOTIVO_RECHAZO"
      counter
      :rows="4"
      :disabled="rechazando"
      :error="!!errorMostrar"
      :error-messages="errorMostrar || undefined"
    />

    <p class="rechazar-contrato-modal__aviso">
      El contrato pasará a <strong>Rechazado por las partes</strong> y las
      firmas pendientes se cancelarán.
    </p>

    <BaseAlert
      v-if="error"
      :message="error"
      type="error"
      class="rechazar-contrato-modal__alerta"
    />

    <template #footer>
      <div class="rechazar-contrato-modal__acciones">
        <VaButton preset="secondary" :disabled="rechazando" @click="cerrar">
          Cancelar
        </VaButton>
        <VaButton
          color="danger"
          :loading="rechazando"
          :disabled="rechazando"
          :aria-busy="rechazando ? 'true' : 'false'"
          @click="confirmar"
        >
          {{ rechazando ? "Rechazando…" : "Rechazar contrato" }}
        </VaButton>
      </div>
    </template>
  </VaModal>
</template>

<script>
import BaseAlert from "../AlertaBase.vue";
import { LIMITE_MOTIVO_RECHAZO } from "../../utils/contratoConstants.js";

export default {
  name: "ModalRechazarContrato",
  components: { BaseAlert },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    contrato: {
      type: Object,
      default: null,
    },
    rechazando: {
      type: Boolean,
      default: false,
    },
    error: {
      type: String,
      default: "",
    },
    /** Error de validación del motivo devuelto por el backend. */
    errorCampo: {
      type: String,
      default: "",
    },
  },
  emits: ["update:modelValue", "confirmar", "limpiar-error"],
  data() {
    return {
      motivo: "",
      errorMotivo: "",
      LIMITE_MOTIVO_RECHAZO,
    };
  },
  computed: {
    errorMostrar() {
      return this.errorMotivo || this.errorCampo;
    },
  },
  watch: {
    modelValue(visible) {
      if (visible) {
        this.motivo = "";
        this.errorMotivo = "";
      }
    },
    motivo() {
      if (this.errorMotivo) this.errorMotivo = "";
      if (this.error || this.errorCampo) this.$emit("limpiar-error");
    },
  },
  methods: {
    onCambioVisibilidad(valor) {
      if (this.rechazando && !valor) return;
      this.$emit("update:modelValue", valor);
    },
    cerrar() {
      if (this.rechazando) return;
      this.$emit("update:modelValue", false);
    },
    confirmar() {
      const texto = String(this.motivo || "").trim();
      if (!texto) {
        this.errorMotivo = "Indicá un motivo para rechazar el contrato.";
        return;
      }
      if (texto.length > LIMITE_MOTIVO_RECHAZO) {
        this.errorMotivo = `El motivo no puede superar los ${LIMITE_MOTIVO_RECHAZO} caracteres.`;
        return;
      }
      this.$emit("confirmar", texto);
    },
  },
};
</script>

<style scoped>
.rechazar-contrato-modal__titulo {
  margin: 0;
}

.rechazar-contrato-modal__intro {
  margin: 0.2rem 0 0.85rem;
  color: var(--color-text);
  font-size: 0.92rem;
  line-height: 1.5;
}

.rechazar-contrato-modal__aviso {
  margin: 0.75rem 0 0.85rem;
  padding: 0.7rem 0.85rem;
  border: 1px solid var(--color-danger-border);
  border-radius: 10px;
  background: var(--color-danger-soft);
  color: var(--color-danger-text);
  font-size: 0.82rem;
  line-height: 1.45;
}

.rechazar-contrato-modal__alerta {
  margin-top: 0 !important;
  margin-bottom: 0.85rem;
}

.rechazar-contrato-modal__acciones {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.65rem;
  width: 100%;
}
</style>
