<template>
  <VaModal
    :model-value="modelValue"
    hide-default-actions
    :no-dismiss="eliminando"
    blur
    size="small"
    class="eliminar-contrato-modal"
    @update:model-value="onCambioVisibilidad"
  >
    <template #header>
      <h3 class="eliminar-contrato-modal__titulo">Eliminar contrato</h3>
    </template>

    <div class="eliminar-contrato-modal__intro">
      <p>
        Vas a eliminar
        <strong>{{ contrato?.nombre || "este contrato" }}</strong>
        <template v-if="contrato?.nombreProyecto">
          del proyecto <strong>{{ contrato.nombreProyecto }}</strong>
        </template>.
      </p>
      <EstadoContratoBadge v-if="contrato?.estado" :estado="contrato.estado" />
    </div>

    <ul class="eliminar-contrato-modal__advertencias">
      <li>
        El contrato no se borra físicamente: queda en estado
        <strong>Eliminado</strong>.
      </li>
      <li>Se conservan el historial, las versiones, las firmas y los eventos.</li>
      <li>Las firmas pendientes pasan a <strong>Cancelada</strong>.</li>
      <li>Las firmas que ya estaban registradas se conservan.</li>
      <li>
        Se notificará a las partes del contrato, excepto cuando todavía esté en
        Borrador.
      </li>
      <li>El contrato dejará de aparecer en la búsqueda por defecto.</li>
    </ul>

    <p class="eliminar-contrato-modal__aviso">
      Esta acción no se puede deshacer desde la interfaz.
    </p>

    <BaseAlert
      v-if="error"
      :message="error"
      type="error"
      class="eliminar-contrato-modal__alerta"
    />

    <template #footer>
      <div class="eliminar-contrato-modal__acciones">
        <VaButton preset="secondary" :disabled="eliminando" @click="cerrar">
          Cancelar
        </VaButton>
        <VaButton
          color="danger"
          :loading="eliminando"
          :disabled="eliminando"
          :aria-busy="eliminando ? 'true' : 'false'"
          @click="$emit('confirmar')"
        >
          {{ eliminando ? "Eliminando…" : "Eliminar contrato" }}
        </VaButton>
      </div>
    </template>
  </VaModal>
</template>

<script>
import BaseAlert from "../AlertaBase.vue";
import EstadoContratoBadge from "./EstadoContratoBadge.vue";

export default {
  name: "ModalEliminarContrato",
  components: { BaseAlert, EstadoContratoBadge },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    contrato: {
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
.eliminar-contrato-modal__titulo {
  margin: 0;
}

.eliminar-contrato-modal__intro {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin: 0.2rem 0 0.9rem;
  flex-wrap: wrap;
}

.eliminar-contrato-modal__intro p {
  margin: 0;
  color: var(--color-text);
  font-size: 0.92rem;
  line-height: 1.5;
}

.eliminar-contrato-modal__advertencias {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin: 0 0 0.85rem;
  padding: 0.8rem 0.9rem 0.8rem 1.9rem;
  border: 1px solid var(--color-warning-border);
  border-radius: 10px;
  background: var(--color-warning-soft);
  color: var(--color-warning-text);
  font-size: 0.82rem;
  line-height: 1.45;
}

.eliminar-contrato-modal__aviso {
  margin: 0 0 0.85rem;
  color: var(--color-text-muted);
  font-size: 0.8rem;
  line-height: 1.45;
}

.eliminar-contrato-modal__alerta {
  margin-top: 0 !important;
  margin-bottom: 0.85rem;
}

.eliminar-contrato-modal__acciones {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.65rem;
  width: 100%;
}

@media (max-width: 520px) {
  .eliminar-contrato-modal__acciones {
    flex-direction: column-reverse;
    align-items: stretch;
  }
}
</style>
