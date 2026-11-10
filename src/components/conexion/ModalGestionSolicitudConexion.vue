<template>
  <VaModal
    :model-value="modelValue"
    hide-default-actions
    :no-dismiss="procesando"
    blur
    size="small"
    class="gestion-solicitud-modal"
    @update:model-value="onCambioVisibilidad"
  >
    <template #header>
      <h3 class="gestion-solicitud-modal__titulo">{{ titulo }}</h3>
    </template>

    <p class="gestion-solicitud-modal__intro">
      <template v-if="esAceptar">
        Vas a aceptar la solicitud de conexión de
        <strong>{{ nombrePerfil }}</strong>.
      </template>
      <template v-else>
        Vas a rechazar la solicitud de conexión de
        <strong>{{ nombrePerfil }}</strong>.
      </template>
    </p>

    <p class="gestion-solicitud-modal__nota">
      <template v-if="esAceptar">
        Se creará una conexión entre ambos perfiles.
      </template>
      <template v-else>
        No se creará una conexión.
      </template>
    </p>

    <BaseAlert
      v-if="error"
      :message="error"
      type="error"
      class="gestion-solicitud-modal__alerta"
    />

    <template #footer>
      <div class="gestion-solicitud-modal__acciones">
        <VaButton preset="secondary" :disabled="procesando" @click="cerrar">
          Cancelar
        </VaButton>
        <VaButton
          :color="esAceptar ? '#5CA4A9' : 'danger'"
          :loading="procesando"
          :disabled="procesando"
          :aria-busy="procesando ? 'true' : 'false'"
          @click="$emit('confirmar')"
        >
          {{ textoBoton }}
        </VaButton>
      </div>
    </template>
  </VaModal>
</template>

<script>
import BaseAlert from "../AlertaBase.vue";

export default {
  name: "ModalGestionSolicitudConexion",
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
    modo: {
      type: String,
      default: "aceptar",
      validator: (valor) => ["aceptar", "rechazar"].includes(valor),
    },
    procesando: {
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
    esAceptar() {
      return this.modo === "aceptar";
    },
    nombrePerfil() {
      return this.perfil?.nombreArtistico || "este perfil";
    },
    titulo() {
      return this.esAceptar
        ? "Aceptar solicitud de conexión"
        : "Rechazar solicitud de conexión";
    },
    textoBoton() {
      if (this.procesando) {
        return this.esAceptar ? "Aceptando…" : "Rechazando…";
      }
      return this.esAceptar ? "Aceptar" : "Rechazar";
    },
  },
  methods: {
    onCambioVisibilidad(valor) {
      if (this.procesando && !valor) return;
      this.$emit("update:modelValue", valor);
    },
    cerrar() {
      if (this.procesando) return;
      this.$emit("update:modelValue", false);
    },
  },
};
</script>

<style scoped>
.gestion-solicitud-modal__titulo {
  margin: 0;
}

.gestion-solicitud-modal__intro {
  margin: 0.2rem 0 0.5rem;
  color: var(--color-text);
  font-size: 0.92rem;
  line-height: 1.5;
}

.gestion-solicitud-modal__nota {
  margin: 0 0 1rem;
  color: var(--color-text-muted);
  font-size: 0.8rem;
  line-height: 1.45;
}

.gestion-solicitud-modal__alerta {
  margin-top: 0 !important;
  margin-bottom: 0.85rem;
}

.gestion-solicitud-modal__acciones {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.65rem;
  width: 100%;
}

@media (max-width: 520px) {
  .gestion-solicitud-modal__acciones {
    flex-direction: column-reverse;
    align-items: stretch;
  }
}
</style>
