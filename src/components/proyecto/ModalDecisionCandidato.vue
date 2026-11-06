<template>
  <VaModal
    :model-value="modelValue"
    hide-default-actions
    size="small"
    :no-dismiss="procesando"
    blur
    class="reemplazo-decision"
    @update:model-value="onCambioVisibilidad"
  >
    <template #header>
      <h3 class="va-h5 reemplazo-decision__titulo">
        {{ esAprobar ? "Aprobar incorporación" : "Rechazar incorporación" }}
      </h3>
    </template>

    <div class="reemplazo-decision__contenido">
      <p class="reemplazo-decision__intro">
        <template v-if="esAprobar">
          Vas a aprobar la incorporación de
          <strong>{{ nombreCandidato }}</strong>
          para cubrir
          <strong>{{ descripcion || "la vacante" }}</strong>
          en el proyecto <strong>{{ nombreProyecto || "este proyecto" }}</strong>.
        </template>
        <template v-else>
          Vas a rechazar la incorporación de
          <strong>{{ nombreCandidato }}</strong>
          para cubrir
          <strong>{{ descripcion || "la vacante" }}</strong>
          en el proyecto <strong>{{ nombreProyecto || "este proyecto" }}</strong>.
        </template>
      </p>

      <p
        class="reemplazo-decision__aviso"
        :class="{ 'reemplazo-decision__aviso--danger': !esAprobar }"
      >
        <template v-if="esAprobar">
          Se creará la membresía y, si corresponde, la asignación a la
          actividad. Las demás invitaciones de este proceso se eliminarán.
        </template>
        <template v-else>
          El candidato será notificado del rechazo. Si quedan otras
          invitaciones activas, el proceso volverá a esperar respuestas.
        </template>
      </p>

      <BaseAlert v-if="error" :message="error" type="error" />

      <VaTextarea
        v-if="!esAprobar"
        v-model="motivo"
        label="Motivo del rechazo (opcional)"
        placeholder="Podés explicar por qué rechazás la incorporación."
        :max-length="LIMITE_MOTIVO_REEMPLAZO"
        counter
        :rows="3"
        :disabled="procesando"
      />
    </div>

    <template #footer>
      <div class="reemplazo-decision__acciones">
        <VaButton preset="secondary" :disabled="procesando" @click="cerrar">
          Volver
        </VaButton>
        <VaButton
          :preset="esAprobar ? 'primary' : undefined"
          :color="esAprobar ? undefined : 'danger'"
          :loading="procesando"
          :disabled="procesando"
          @click="confirmar"
        >
          {{ esAprobar ? "Aprobar incorporación" : "Rechazar incorporación" }}
        </VaButton>
      </div>
    </template>
  </VaModal>
</template>

<script>
import BaseAlert from "../AlertaBase.vue";
import {
  ACCIONES_DECISION_REEMPLAZO,
  LIMITE_MOTIVO_REEMPLAZO,
} from "../../utils/reemplazoConstants.js";

export default {
  name: "ModalDecisionCandidato",
  components: { BaseAlert },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    accion: {
      type: String,
      default: ACCIONES_DECISION_REEMPLAZO.APROBAR,
    },
    candidato: {
      type: Object,
      default: null,
    },
    nombreProyecto: {
      type: String,
      default: "",
    },
    descripcion: {
      type: String,
      default: "",
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
  data() {
    return {
      LIMITE_MOTIVO_REEMPLAZO,
      motivo: "",
    };
  },
  computed: {
    esAprobar() {
      return this.accion === ACCIONES_DECISION_REEMPLAZO.APROBAR;
    },
    nombreCandidato() {
      return this.candidato?.nombreArtistico || "este candidato";
    },
  },
  watch: {
    modelValue(visible) {
      if (visible) this.motivo = "";
    },
    accion() {
      this.motivo = "";
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
    confirmar() {
      if (this.procesando) return;
      this.$emit("confirmar", this.esAprobar ? "" : this.motivo.trim());
    },
  },
};
</script>

<style scoped>
.reemplazo-decision__titulo {
  margin: 0;
}

.reemplazo-decision__contenido {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.reemplazo-decision__intro,
.reemplazo-decision__aviso {
  margin: 0;
  color: var(--color-text);
  font-size: 0.9rem;
  line-height: 1.5;
}

.reemplazo-decision__aviso {
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--color-info-border);
  border-radius: 8px;
  background: var(--color-info-soft);
  color: var(--color-info-text);
  font-size: 0.8rem;
}

.reemplazo-decision__aviso--danger {
  border-color: var(--color-danger-border);
  background: var(--color-danger-soft);
  color: var(--color-danger-text);
}

.reemplazo-decision__acciones {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  width: 100%;
}
</style>
