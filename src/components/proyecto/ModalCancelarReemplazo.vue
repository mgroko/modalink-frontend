<template>
  <VaModal
    :model-value="modelValue"
    hide-default-actions
    size="small"
    :no-dismiss="cancelando"
    blur
    class="reemplazo-cancelar"
    @update:model-value="onCambioVisibilidad"
  >
    <template #header>
      <h3 class="va-h5 reemplazo-cancelar__titulo">
        Cancelar proceso de reemplazo
      </h3>
    </template>

    <div class="reemplazo-cancelar__contenido">
      <p class="reemplazo-cancelar__intro">
        Vas a cancelar el proceso de
        <strong>{{ descripcion || "esta vacante" }}</strong>
        en el proyecto <strong>{{ nombreProyecto || "este proyecto" }}</strong>.
      </p>

      <p class="reemplazo-cancelar__aviso">
        Las invitaciones activas quedarán canceladas. Esta acción no se puede
        deshacer desde la interfaz.
      </p>

      <BaseAlert v-if="error" :message="error" type="error" />

      <VaTextarea
        v-model="motivo"
        label="Motivo de la cancelación (opcional)"
        placeholder="Podés explicar por qué cancelás el proceso."
        :max-length="LIMITE_MOTIVO_REEMPLAZO"
        counter
        :rows="3"
        :disabled="cancelando"
      />
    </div>

    <template #footer>
      <div class="reemplazo-cancelar__acciones">
        <VaButton preset="secondary" :disabled="cancelando" @click="cerrar">
          Volver
        </VaButton>
        <VaButton
          color="danger"
          :loading="cancelando"
          :disabled="cancelando"
          @click="confirmar"
        >
          Cancelar proceso
        </VaButton>
      </div>
    </template>
  </VaModal>
</template>

<script>
import BaseAlert from "../AlertaBase.vue";
import { LIMITE_MOTIVO_REEMPLAZO } from "../../utils/reemplazoConstants.js";

export default {
  name: "ModalCancelarReemplazo",
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
    descripcion: {
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
      LIMITE_MOTIVO_REEMPLAZO,
      motivo: "",
    };
  },
  watch: {
    modelValue(visible) {
      if (!visible) this.motivo = "";
    },
  },
  methods: {
    onCambioVisibilidad(valor) {
      if (this.cancelando && !valor) return;
      this.$emit("update:modelValue", valor);
    },
    cerrar() {
      if (this.cancelando) return;
      this.$emit("update:modelValue", false);
    },
    confirmar() {
      if (this.cancelando) return;
      this.$emit("confirmar", this.motivo.trim());
    },
  },
};
</script>

<style scoped>
.reemplazo-cancelar__titulo {
  margin: 0;
}

.reemplazo-cancelar__contenido {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.reemplazo-cancelar__intro,
.reemplazo-cancelar__aviso {
  margin: 0;
  color: var(--color-text);
  font-size: 0.9rem;
  line-height: 1.5;
}

.reemplazo-cancelar__aviso {
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--color-warning-border);
  border-radius: 8px;
  background: var(--color-warning-soft);
  color: var(--color-warning-text);
  font-size: 0.8rem;
}

.reemplazo-cancelar__acciones {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  width: 100%;
}
</style>
