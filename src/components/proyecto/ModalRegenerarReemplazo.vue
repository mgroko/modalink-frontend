<template>
  <VaModal
    :model-value="modelValue"
    hide-default-actions
    size="small"
    :no-dismiss="regenerando"
    blur
    class="reemplazo-regenerar"
    @update:model-value="onCambioVisibilidad"
  >
    <template #header>
      <h3 class="va-h5 reemplazo-regenerar__titulo">
        Regenerar candidatos
      </h3>
    </template>

    <div class="reemplazo-regenerar__contenido">
      <p class="reemplazo-regenerar__intro">
        El proceso de
        <strong>{{ descripcion || "esta vacante" }}</strong>
        quedó sin candidatos. El sistema volverá a buscar perfiles que cumplan
        el requisito y tengan disponibilidad.
      </p>

      <BaseAlert v-if="error" :message="error" type="error" />
    </div>

    <template #footer>
      <div class="reemplazo-regenerar__acciones">
        <VaButton preset="secondary" :disabled="regenerando" @click="cerrar">
          Volver
        </VaButton>
        <VaButton
          preset="primary"
          :loading="regenerando"
          :disabled="regenerando"
          @click="confirmar"
        >
          Regenerar candidatos
        </VaButton>
      </div>
    </template>
  </VaModal>
</template>

<script>
import BaseAlert from "../AlertaBase.vue";

export default {
  name: "ModalRegenerarReemplazo",
  components: { BaseAlert },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    descripcion: {
      type: String,
      default: "",
    },
    regenerando: {
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
      if (this.regenerando && !valor) return;
      this.$emit("update:modelValue", valor);
    },
    cerrar() {
      if (this.regenerando) return;
      this.$emit("update:modelValue", false);
    },
    confirmar() {
      if (this.regenerando) return;
      this.$emit("confirmar");
    },
  },
};
</script>

<style scoped>
.reemplazo-regenerar__titulo {
  margin: 0;
}

.reemplazo-regenerar__contenido {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.reemplazo-regenerar__intro {
  margin: 0;
  color: var(--color-text);
  font-size: 0.9rem;
  line-height: 1.5;
}

.reemplazo-regenerar__acciones {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  width: 100%;
}
</style>
