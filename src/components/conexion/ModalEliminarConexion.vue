<template>
  <VaModal
    :model-value="modelValue"
    hide-default-actions
    :no-dismiss="eliminando"
    blur
    size="small"
    class="eliminar-conexion-modal"
    @update:model-value="onCambioVisibilidad"
  >
    <template #header>
      <h3 class="eliminar-conexion-modal__titulo">Eliminar conexión</h3>
    </template>

    <p class="eliminar-conexion-modal__intro">
      ¿Querés eliminar tu conexión con
      <strong>{{ nombrePerfil }}</strong>?
    </p>

    <p class="eliminar-conexion-modal__nota">
      La conexión dejará de aparecer en tu red. Podrán volver a enviarse una
      solicitud más adelante.
    </p>

    <BaseAlert
      v-if="error"
      :message="error"
      type="error"
      class="eliminar-conexion-modal__alerta"
    />

    <template #footer>
      <div class="eliminar-conexion-modal__acciones">
        <VaButton preset="secondary" :disabled="eliminando" @click="cerrar">
          Volver
        </VaButton>
        <VaButton
          color="danger"
          :loading="eliminando"
          :disabled="eliminando"
          :aria-busy="eliminando ? 'true' : 'false'"
          @click="$emit('confirmar')"
        >
          {{ eliminando ? "Eliminando…" : "Eliminar conexión" }}
        </VaButton>
      </div>
    </template>
  </VaModal>
</template>

<script>
import BaseAlert from "../AlertaBase.vue";

export default {
  name: "ModalEliminarConexion",
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
  computed: {
    nombrePerfil() {
      return this.perfil?.nombreArtistico || "este perfil";
    },
  },
  methods: {
    onCambioVisibilidad(valor) {
      if (this.eliminando && !valor) return;
      this.$emit("update:modelValue", valor);
    },
    cerrar() {
      if (this.eliminando) return;
      this.$emit("update:modelValue", false);
    },
  },
};
</script>

<style scoped>
.eliminar-conexion-modal__titulo {
  margin: 0;
}

.eliminar-conexion-modal__intro {
  margin: 0.2rem 0 0.5rem;
  color: var(--color-text);
  font-size: 0.92rem;
  line-height: 1.5;
}

.eliminar-conexion-modal__nota {
  margin: 0 0 1rem;
  color: var(--color-text-muted);
  font-size: 0.8rem;
  line-height: 1.45;
}

.eliminar-conexion-modal__alerta {
  margin-top: 0 !important;
  margin-bottom: 0.85rem;
}

.eliminar-conexion-modal__acciones {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.65rem;
  width: 100%;
}

@media (max-width: 520px) {
  .eliminar-conexion-modal__acciones {
    flex-direction: column-reverse;
    align-items: stretch;
  }
}
</style>
