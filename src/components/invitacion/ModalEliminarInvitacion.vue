<template>
  <VaModal
    :model-value="modelValue"
    hide-default-actions
    size="medium"
    :no-dismiss="eliminando"
    blur
    class="eliminar-invitacion"
    @update:model-value="onCambioVisibilidad"
  >
    <template #header>
      <h3 class="va-h5 eliminar-invitacion__titulo">Eliminar invitación</h3>
    </template>

    <div v-if="invitacion" class="eliminar-invitacion__contenido">
      <p class="eliminar-invitacion__intro">
        ¿Querés eliminar la invitación a
        <strong>{{ nombreDestinatario }}</strong>?
      </p>

      <dl class="eliminar-invitacion__detalle">
        <div>
          <dt>Proyecto</dt>
          <dd>{{ invitacion.nombreProyecto || "—" }}</dd>
        </div>
        <div>
          <dt>Tipo</dt>
          <dd>{{ etiquetaTipoInvitacion(invitacion.tipo) }}</dd>
        </div>
        <div>
          <dt>Perfil destinatario</dt>
          <dd>{{ nombreDestinatario }}</dd>
        </div>
        <div>
          <dt>Fecha de envío</dt>
          <dd>{{ fechaEnvio }}</dd>
        </div>
        <div v-if="invitacion.mensaje" class="eliminar-invitacion__detalle-completo">
          <dt>Mensaje</dt>
          <dd>{{ invitacion.mensaje }}</dd>
        </div>
      </dl>

      <p class="eliminar-invitacion__aviso">
        La invitación se eliminará definitivamente. También se eliminará la
        notificación que el destinatario recibió al ser invitado.
      </p>

      <BaseAlert v-if="error" :message="error" type="error" />
    </div>

    <template #footer>
      <div class="eliminar-invitacion__acciones">
        <VaButton
          preset="secondary"
          :disabled="eliminando"
          @click="cancelar"
        >
          Cancelar
        </VaButton>
        <VaButton
          preset="primary"
          color="danger"
          :loading="eliminando"
          :disabled="eliminando"
          @click="$emit('confirmar')"
        >
          Eliminar invitación
        </VaButton>
      </div>
    </template>
  </VaModal>
</template>

<script>
import BaseAlert from "../AlertaBase.vue";
import { formatearFechaCorta } from "../../utils/fechas.js";
import { etiquetaTipoInvitacion } from "../../utils/invitacionBusquedaConstants.js";

export default {
  name: "ModalEliminarInvitacion",
  components: { BaseAlert },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    invitacion: {
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
    nombreDestinatario() {
      return (
        this.invitacion?.destinatario?.nombreArtistico || "este perfil"
      );
    },
    fechaEnvio() {
      return formatearFechaCorta(this.invitacion?.fechaEnvio);
    },
  },
  methods: {
    etiquetaTipoInvitacion,
    onCambioVisibilidad(valor) {
      if (this.eliminando && !valor) return;
      this.$emit("update:modelValue", valor);
    },
    cancelar() {
      if (this.eliminando) return;
      this.$emit("update:modelValue", false);
    },
  },
};
</script>

<style scoped>
.eliminar-invitacion__titulo {
  margin: 0;
}

.eliminar-invitacion__contenido {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.eliminar-invitacion__intro {
  margin: 0;
  color: var(--color-text);
  font-size: 0.94rem;
  line-height: 1.5;
}

.eliminar-invitacion__detalle {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem 1rem;
  margin: 0;
  padding: 0.85rem 0.95rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface-muted);
}

.eliminar-invitacion__detalle div {
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
}

.eliminar-invitacion__detalle-completo {
  grid-column: 1 / -1;
}

.eliminar-invitacion__detalle dt {
  color: var(--color-text-muted);
  font-size: 0.72rem;
  font-weight: 600;
}

.eliminar-invitacion__detalle dd {
  margin: 0;
  color: var(--color-text);
  font-size: 0.84rem;
  font-weight: 600;
  line-height: 1.4;
}

.eliminar-invitacion__aviso {
  margin: 0;
  padding: 0.65rem 0.75rem;
  border: 1px solid var(--color-warning-border);
  border-radius: 8px;
  background: var(--color-warning-soft);
  color: var(--color-warning-text);
  font-size: 0.8rem;
  line-height: 1.45;
}

.eliminar-invitacion__acciones {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
  width: 100%;
}

@media (max-width: 560px) {
  .eliminar-invitacion__detalle {
    grid-template-columns: 1fr;
  }
}
</style>
