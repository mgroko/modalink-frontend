<template>
  <VaModal
    :model-value="modelValue"
    hide-default-actions
    :no-dismiss="desasignando"
    blur
    size="medium"
    class="desasignar-actividad-modal"
    @update:model-value="onCambioVisibilidad"
  >
    <template #header>
      <h3 class="va-h5 desasignar-actividad-modal__titulo">
        Desasignar miembro
      </h3>
    </template>

    <p class="desasignar-actividad-modal__intro">
      Se quitará a
      <strong>{{ responsable?.texto || "este miembro" }}</strong>
      de la actividad
      <strong>{{ actividad?.nombre || "seleccionada" }}</strong>
      del proyecto <strong>{{ nombreProyecto || "este proyecto" }}</strong>.
    </p>

    <dl class="desasignar-actividad-modal__detalle">
      <div class="desasignar-actividad-modal__fila">
        <dt>Duración</dt>
        <dd>{{ duracionActividad }}</dd>
      </div>
      <div class="desasignar-actividad-modal__fila">
        <dt>Estado</dt>
        <dd>{{ etiquetaEstadoActividad(actividad?.estado) || "—" }}</dd>
      </div>
      <div class="desasignar-actividad-modal__fila">
        <dt>Miembro</dt>
        <dd>{{ responsable?.texto || "—" }}</dd>
      </div>
    </dl>

    <p class="desasignar-actividad-modal__aviso">
      <span class="material-symbols-outlined" aria-hidden="true">info</span>
      Si el miembro cubría un requerimiento, el cupo volverá a quedar
      disponible. Las postulaciones rechazadas previamente no se reabren
      automáticamente.
    </p>

    <p
      v-if="proyectoConfirmado"
      class="desasignar-actividad-modal__aviso desasignar-actividad-modal__aviso--confirmado"
    >
      <span class="material-symbols-outlined" aria-hidden="true">event_busy</span>
      El proyecto está confirmado. La desasignación no reprograma el cronograma
      ni modifica los horarios persistidos.
    </p>

    <BaseAlert
      v-if="error"
      :message="error"
      type="error"
      class="desasignar-actividad-modal__alerta"
    />

    <template #footer>
      <div class="desasignar-actividad-modal__acciones">
        <VaButton preset="secondary" :disabled="desasignando" @click="cerrar">
          Cancelar
        </VaButton>
        <VaButton
          preset="primary"
          color="danger"
          :loading="desasignando"
          :disabled="desasignando"
          :aria-busy="desasignando ? 'true' : 'false'"
          @click="confirmar"
        >
          {{ desasignando ? "Desasignando…" : "Desasignar" }}
        </VaButton>
      </div>
    </template>
  </VaModal>
</template>

<script>
import BaseAlert from "../AlertaBase.vue";
import {
  etiquetaEstadoActividad,
  formatearDuracionMinutos,
} from "../../utils/actividadConstants.js";

/*
 * Confirmación de desasignación. El contenedor hace el DELETE y refresca la
 * planificación. Este modal sólo muestra el contexto y las advertencias.
 */
export default {
  name: "ModalDesasignarActividad",
  components: { BaseAlert },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    actividad: {
      type: Object,
      default: null,
    },
    responsable: {
      type: Object,
      default: null,
    },
    nombreProyecto: {
      type: String,
      default: "",
    },
    proyectoConfirmado: {
      type: Boolean,
      default: false,
    },
    desasignando: {
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
    duracionActividad() {
      return formatearDuracionMinutos(this.actividad?.duracionMinutos);
    },
  },
  methods: {
    etiquetaEstadoActividad,
    onCambioVisibilidad(valor) {
      if (this.desasignando && !valor) return;
      this.$emit("update:modelValue", valor);
    },
    cerrar() {
      if (this.desasignando) return;
      this.$emit("update:modelValue", false);
    },
    confirmar() {
      if (this.desasignando) return;
      this.$emit("confirmar");
    },
  },
};
</script>

<style scoped>
.desasignar-actividad-modal__titulo {
  margin: 0;
}

.desasignar-actividad-modal__intro {
  margin: 0.25rem 0 0.9rem;
  color: var(--color-text);
  font-size: 0.94rem;
  line-height: 1.5;
}

.desasignar-actividad-modal__detalle {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0 0 0.9rem;
  padding: 0.85rem 0.95rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface-muted);
}

.desasignar-actividad-modal__fila {
  display: grid;
  grid-template-columns: 7.5rem 1fr;
  gap: 0.75rem;
  align-items: baseline;
}

.desasignar-actividad-modal__fila dt {
  color: var(--color-text-muted);
  font-size: 0.76rem;
  font-weight: 600;
}

.desasignar-actividad-modal__fila dd {
  margin: 0;
  color: var(--color-text);
  font-size: 0.86rem;
  line-height: 1.45;
}

.desasignar-actividad-modal__aviso {
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
  margin: 0.75rem 0 0;
  padding: 0.6rem 0.7rem;
  border: 1px solid var(--color-warning-border);
  border-radius: 8px;
  background: var(--color-warning-soft);
  color: var(--color-warning-text);
  font-size: 0.8rem;
  line-height: 1.45;
}

.desasignar-actividad-modal__aviso--confirmado {
  border-color: var(--color-info-border);
  background: var(--color-info-soft);
  color: var(--color-info-text);
}

.desasignar-actividad-modal__aviso .material-symbols-outlined {
  font-size: 1rem;
}

.desasignar-actividad-modal__alerta {
  margin-top: 0.85rem !important;
}

.desasignar-actividad-modal__acciones {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
  width: 100%;
}
</style>
