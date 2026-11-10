<template>
  <VaModal
    :model-value="modelValue"
    hide-default-actions
    :no-dismiss="enviando"
    blur
    size="small"
    class="solicitud-conexion-modal"
    @update:model-value="onCambioVisibilidad"
  >
    <template #header>
      <h3 class="solicitud-conexion-modal__titulo">
        Enviar solicitud de conexión
      </h3>
    </template>

    <p class="solicitud-conexion-modal__intro">
      Vas a enviar una solicitud de conexión a
      <strong>{{ nombreDestinatario }}</strong>
      desde <strong>{{ nombreRemitenteTexto }}</strong>.
    </p>

    <p class="solicitud-conexion-modal__nota">
      La solicitud se envía siempre desde tu perfil activo.
    </p>

    <BaseAlert
      v-if="error"
      :message="error"
      type="error"
      class="solicitud-conexion-modal__alerta"
    />

    <template #footer>
      <div class="solicitud-conexion-modal__acciones">
        <VaButton preset="secondary" :disabled="enviando" @click="cerrar">
          Cancelar
        </VaButton>
        <VaButton
          color="#5CA4A9"
          :loading="enviando"
          :disabled="enviando"
          :aria-busy="enviando ? 'true' : 'false'"
          @click="$emit('confirmar')"
        >
          {{ enviando ? "Enviando…" : "Enviar solicitud" }}
        </VaButton>
      </div>
    </template>
  </VaModal>
</template>

<script>
import BaseAlert from "../AlertaBase.vue";

export default {
  name: "ModalEnviarSolicitudConexion",
  components: { BaseAlert },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    perfil: {
      type: Object,
      default: null,
    },
    nombreRemitente: {
      type: String,
      default: "",
    },
    enviando: {
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
    nombreDestinatario() {
      return this.perfil?.nombreArtistico || "este perfil";
    },
    nombreRemitenteTexto() {
      return this.nombreRemitente || "tu perfil activo";
    },
  },
  methods: {
    onCambioVisibilidad(valor) {
      if (this.enviando && !valor) return;
      this.$emit("update:modelValue", valor);
    },
    cerrar() {
      if (this.enviando) return;
      this.$emit("update:modelValue", false);
    },
  },
};
</script>

<style scoped>
.solicitud-conexion-modal__titulo {
  margin: 0;
}

.solicitud-conexion-modal__intro {
  margin: 0.2rem 0 0.5rem;
  color: var(--color-text);
  font-size: 0.92rem;
  line-height: 1.5;
}

.solicitud-conexion-modal__nota {
  margin: 0 0 1rem;
  color: var(--color-text-muted);
  font-size: 0.8rem;
  line-height: 1.45;
}

.solicitud-conexion-modal__alerta {
  margin-top: 0 !important;
  margin-bottom: 0.85rem;
}

.solicitud-conexion-modal__acciones {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.65rem;
  width: 100%;
}

@media (max-width: 520px) {
  .solicitud-conexion-modal__acciones {
    flex-direction: column-reverse;
    align-items: stretch;
  }
}
</style>
