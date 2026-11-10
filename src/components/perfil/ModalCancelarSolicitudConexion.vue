<template>
  <VaModal
    :model-value="modelValue"
    hide-default-actions
    :no-dismiss="cancelando"
    blur
    size="small"
    class="cancelar-solicitud-modal"
    @update:model-value="onCambioVisibilidad"
  >
    <template #header>
      <h3 class="cancelar-solicitud-modal__titulo">
        Cancelar solicitud de conexión
      </h3>
    </template>

    <p class="cancelar-solicitud-modal__intro">
      Vas a cancelar la solicitud de conexión enviada a
      <strong>{{ nombreDestinatario }}</strong>.
    </p>

    <p class="cancelar-solicitud-modal__nota">
      El destinatario dejará de ver la notificación y vas a poder volver a
      enviarle una solicitud.
    </p>

    <BaseAlert
      v-if="error"
      :message="error"
      type="error"
      class="cancelar-solicitud-modal__alerta"
    />

    <template #footer>
      <div class="cancelar-solicitud-modal__acciones">
        <VaButton preset="secondary" :disabled="cancelando" @click="cerrar">
          Volver
        </VaButton>
        <VaButton
          color="danger"
          :loading="cancelando"
          :disabled="cancelando"
          :aria-busy="cancelando ? 'true' : 'false'"
          @click="$emit('confirmar')"
        >
          {{ cancelando ? "Cancelando…" : "Cancelar solicitud" }}
        </VaButton>
      </div>
    </template>
  </VaModal>
</template>

<script>
import BaseAlert from "../AlertaBase.vue";

export default {
  name: "ModalCancelarSolicitudConexion",
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
  computed: {
    nombreDestinatario() {
      return this.perfil?.nombreArtistico || "este perfil";
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
  },
};
</script>

<style scoped>
.cancelar-solicitud-modal__titulo {
  margin: 0;
}

.cancelar-solicitud-modal__intro {
  margin: 0.2rem 0 0.5rem;
  color: var(--color-text);
  font-size: 0.92rem;
  line-height: 1.5;
}

.cancelar-solicitud-modal__nota {
  margin: 0 0 1rem;
  color: var(--color-text-muted);
  font-size: 0.8rem;
  line-height: 1.45;
}

.cancelar-solicitud-modal__alerta {
  margin-top: 0 !important;
  margin-bottom: 0.85rem;
}

.cancelar-solicitud-modal__acciones {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.65rem;
  width: 100%;
}

@media (max-width: 520px) {
  .cancelar-solicitud-modal__acciones {
    flex-direction: column-reverse;
    align-items: stretch;
  }
}
</style>
