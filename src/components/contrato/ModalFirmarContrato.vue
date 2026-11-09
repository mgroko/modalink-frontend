<template>
  <VaModal
    :model-value="modelValue"
    hide-default-actions
    :no-dismiss="firmando"
    blur
    size="small"
    class="firmar-contrato-modal"
    @update:model-value="onCambioVisibilidad"
  >
    <template #header>
      <h3 class="firmar-contrato-modal__titulo">Firmar contrato</h3>
    </template>

    <p class="firmar-contrato-modal__intro">
      Vas a firmar
      <strong>{{ contrato?.nombre || "este contrato" }}</strong>
      <template v-if="contrato?.nombreProyecto">
        del proyecto <strong>{{ contrato.nombreProyecto }}</strong>
      </template>.
    </p>

    <dl class="firmar-contrato-modal__ficha">
      <div>
        <dt>Versión</dt>
        <dd>{{ contrato?.versionActual ?? "—" }}</dd>
      </div>
      <div>
        <dt>Tipo</dt>
        <dd>{{ contrato?.nombreTipoAcuerdo || "—" }}</dd>
      </div>
      <div>
        <dt>Tu firma</dt>
        <dd>{{ etiquetaEstadoFirmaContrato(contrato?.miEstadoFirma) || "Pendiente" }}</dd>
      </div>
    </dl>

    <p class="firmar-contrato-modal__aviso">
      Al confirmar, tu firma queda registrada. Si ya firmaron todas las partes,
      el contrato pasa automáticamente a Activo.
    </p>

    <BaseAlert
      v-if="error"
      :message="error"
      type="error"
      class="firmar-contrato-modal__alerta"
    />

    <template #footer>
      <div class="firmar-contrato-modal__acciones">
        <VaButton preset="secondary" :disabled="firmando" @click="cerrar">
          Cancelar
        </VaButton>
        <VaButton
          preset="primary"
          :loading="firmando"
          :disabled="firmando"
          :aria-busy="firmando ? 'true' : 'false'"
          @click="$emit('confirmar')"
        >
          {{ firmando ? "Firmando…" : "Firmar contrato" }}
        </VaButton>
      </div>
    </template>
  </VaModal>
</template>

<script>
import BaseAlert from "../AlertaBase.vue";
import { etiquetaEstadoFirmaContrato } from "../../utils/contratoConstants.js";

export default {
  name: "ModalFirmarContrato",
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
    firmando: {
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
    etiquetaEstadoFirmaContrato,
    onCambioVisibilidad(valor) {
      if (this.firmando && !valor) return;
      this.$emit("update:modelValue", valor);
    },
    cerrar() {
      if (this.firmando) return;
      this.$emit("update:modelValue", false);
    },
  },
};
</script>

<style scoped>
.firmar-contrato-modal__titulo {
  margin: 0;
}

.firmar-contrato-modal__intro {
  margin: 0.2rem 0 0.9rem;
  color: var(--color-text);
  font-size: 0.92rem;
  line-height: 1.5;
}

.firmar-contrato-modal__ficha {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin: 0 0 0.85rem;
  padding: 0.75rem 0.9rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface-muted);
}

.firmar-contrato-modal__ficha div {
  display: grid;
  grid-template-columns: 6rem minmax(0, 1fr);
  gap: 0.6rem;
}

.firmar-contrato-modal__ficha dt {
  color: var(--color-text-muted);
  font-size: 0.76rem;
  font-weight: 600;
}

.firmar-contrato-modal__ficha dd {
  margin: 0;
  color: var(--color-text);
  font-size: 0.84rem;
  overflow-wrap: anywhere;
}

.firmar-contrato-modal__aviso {
  margin: 0 0 0.85rem;
  padding: 0.7rem 0.85rem;
  border: 1px solid var(--color-info-border);
  border-radius: 10px;
  background: var(--color-info-soft);
  color: var(--color-info-text);
  font-size: 0.82rem;
  line-height: 1.45;
}

.firmar-contrato-modal__alerta {
  margin-top: 0 !important;
  margin-bottom: 0.85rem;
}

.firmar-contrato-modal__acciones {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.65rem;
  width: 100%;
}
</style>
