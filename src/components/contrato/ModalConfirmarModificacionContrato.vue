<template>
  <VaModal
    :model-value="modelValue"
    hide-default-actions
    :no-dismiss="guardando"
    blur
    size="small"
    class="confirmar-modificacion-modal"
    @update:model-value="onCambioVisibilidad"
  >
    <template #header>
      <h3 class="confirmar-modificacion-modal__titulo">Guardar cambios</h3>
    </template>

    <p class="confirmar-modificacion-modal__intro">
      Se actualizará
      <strong>{{ contrato?.nombre || "el contrato" }}</strong>
      <template v-if="contrato?.nombreProyecto">
        del proyecto <strong>{{ contrato.nombreProyecto }}</strong>
      </template>.
    </p>

    <dl class="confirmar-modificacion-modal__ficha">
      <div>
        <dt>Tipo de acuerdo</dt>
        <dd>{{ resumen?.tipo || "—" }}</dd>
      </div>
      <div>
        <dt>Destinatarios</dt>
        <dd>{{ resumen?.destinatarios ?? 0 }}</dd>
      </div>
      <div>
        <dt>Texto</dt>
        <dd>{{ resumen?.modoTexto || "—" }}</dd>
      </div>
      <div>
        <dt>Versión actual</dt>
        <dd>{{ contrato?.versionActual ?? "—" }}</dd>
      </div>
    </dl>

    <p class="confirmar-modificacion-modal__aviso">
      El backend reconciliará las firmas, creará una nueva versión y notificará
      a las partes actuales. Las firmas registradas bloquean la modificación.
    </p>

    <BaseAlert
      v-if="error"
      :message="error"
      type="error"
      class="confirmar-modificacion-modal__alerta"
    />

    <template #footer>
      <div class="confirmar-modificacion-modal__acciones">
        <VaButton preset="secondary" :disabled="guardando" @click="cerrar">
          Volver
        </VaButton>
        <VaButton
          preset="primary"
          :loading="guardando"
          :disabled="guardando"
          :aria-busy="guardando ? 'true' : 'false'"
          @click="$emit('confirmar')"
        >
          {{ guardando ? "Guardando…" : "Guardar cambios" }}
        </VaButton>
      </div>
    </template>
  </VaModal>
</template>

<script>
import BaseAlert from "../AlertaBase.vue";

export default {
  name: "ModalConfirmarModificacionContrato",
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
    resumen: {
      type: Object,
      default: () => ({}),
    },
    guardando: {
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
      if (this.guardando && !valor) return;
      this.$emit("update:modelValue", valor);
    },
    cerrar() {
      if (this.guardando) return;
      this.$emit("update:modelValue", false);
    },
  },
};
</script>

<style scoped>
.confirmar-modificacion-modal__titulo {
  margin: 0;
}

.confirmar-modificacion-modal__intro {
  margin: 0.2rem 0 0.85rem;
  color: var(--color-text);
  font-size: 0.92rem;
  line-height: 1.5;
}

.confirmar-modificacion-modal__ficha {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin: 0 0 0.85rem;
  padding: 0.75rem 0.9rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface-muted);
}

.confirmar-modificacion-modal__ficha div {
  display: grid;
  grid-template-columns: 8rem minmax(0, 1fr);
  gap: 0.6rem;
}

.confirmar-modificacion-modal__ficha dt {
  color: var(--color-text-muted);
  font-size: 0.76rem;
  font-weight: 600;
}

.confirmar-modificacion-modal__ficha dd {
  margin: 0;
  color: var(--color-text);
  font-size: 0.84rem;
  overflow-wrap: anywhere;
}

.confirmar-modificacion-modal__aviso {
  margin: 0 0 0.85rem;
  padding: 0.7rem 0.85rem;
  border: 1px solid var(--color-info-border);
  border-radius: 10px;
  background: var(--color-info-soft);
  color: var(--color-info-text);
  font-size: 0.82rem;
  line-height: 1.45;
}

.confirmar-modificacion-modal__alerta {
  margin-top: 0 !important;
  margin-bottom: 0.85rem;
}

.confirmar-modificacion-modal__acciones {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.65rem;
  width: 100%;
}
</style>
