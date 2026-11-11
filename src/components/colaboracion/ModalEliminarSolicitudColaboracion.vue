<template>
  <VaModal
    :model-value="modelValue"
    hide-default-actions
    :no-dismiss="eliminando"
    blur
    size="small"
    class="eliminar-solicitud-colaboracion"
    @update:model-value="cambiarVisibilidad"
  >
    <template #header>
      <h3 class="va-h5 eliminar-solicitud-colaboracion__titulo">
        Eliminar solicitud de colaboración
      </h3>
    </template>

    <p class="eliminar-solicitud-colaboracion__intro">
      Vas a eliminar la solicitud enviada a
      <strong>{{ nombreDestinatario }}</strong> para colaborar en
      <strong>{{ tituloPublicacion }}</strong>.
    </p>

    <dl v-if="solicitud" class="eliminar-solicitud-colaboracion__detalle">
      <div>
        <dt>Publicación</dt>
        <dd>{{ tituloPublicacion }}</dd>
      </div>
      <div>
        <dt>Destinatario</dt>
        <dd>{{ nombreDestinatario }}</dd>
      </div>
      <div v-if="profesionDestinatario">
        <dt>Profesión</dt>
        <dd>{{ profesionDestinatario }}</dd>
      </div>
      <div v-if="fechaEnvio">
        <dt>Enviada el</dt>
        <dd>{{ fechaEnvio }}</dd>
      </div>
    </dl>

    <p class="eliminar-solicitud-colaboracion__nota">
      La solicitud se eliminará definitivamente. El destinatario dejará de ver
      la notificación y vas a poder volver a enviarla.
    </p>

    <BaseAlert v-if="error" :message="error" type="error" />

    <template #footer>
      <div class="eliminar-solicitud-colaboracion__acciones">
        <VaButton
          preset="secondary"
          :disabled="eliminando"
          @click="cerrar"
        >
          Cancelar
        </VaButton>
        <VaButton
          color="danger"
          :loading="eliminando"
          :disabled="eliminando"
          :aria-busy="eliminando ? 'true' : 'false'"
          @click="$emit('confirmar')"
        >
          {{ eliminando ? "Eliminando…" : "Eliminar solicitud" }}
        </VaButton>
      </div>
    </template>
  </VaModal>
</template>

<script>
import BaseAlert from "../AlertaBase.vue";
import { formatearFechaCorta } from "../../utils/fechas.js";

export default {
  name: "ModalEliminarSolicitudColaboracion",
  components: { BaseAlert },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    solicitud: {
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
    tituloPublicacion() {
      return this.solicitud?.publicacion?.titulo || "esta publicación";
    },
    nombreDestinatario() {
      return this.solicitud?.destinatario?.nombreArtistico || "este perfil";
    },
    profesionDestinatario() {
      return this.solicitud?.destinatario?.profesion || "";
    },
    fechaEnvio() {
      return this.solicitud?.fechaEnvio
        ? formatearFechaCorta(this.solicitud.fechaEnvio)
        : "";
    },
  },
  methods: {
    cambiarVisibilidad(valor) {
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
.eliminar-solicitud-colaboracion__titulo {
  margin: 0;
}

.eliminar-solicitud-colaboracion__intro {
  margin: 0.2rem 0 0.85rem;
  color: var(--color-text);
  font-size: 0.92rem;
  line-height: 1.5;
}

.eliminar-solicitud-colaboracion__detalle {
  display: grid;
  gap: 0.5rem;
  margin: 0 0 0.9rem;
  padding: 0.8rem 0.9rem;
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border);
  border-radius: 9px;
}

.eliminar-solicitud-colaboracion__detalle div {
  display: grid;
  grid-template-columns: 6.5rem minmax(0, 1fr);
  gap: 0.6rem;
  align-items: baseline;
}

.eliminar-solicitud-colaboracion__detalle dt {
  color: var(--color-text-muted);
  font-size: 0.73rem;
  font-weight: 600;
}

.eliminar-solicitud-colaboracion__detalle dd {
  margin: 0;
  color: var(--color-text);
  font-size: 0.81rem;
  font-weight: 600;
  line-height: 1.4;
}

.eliminar-solicitud-colaboracion__nota {
  margin: 0 0 0.9rem;
  color: var(--color-text-muted);
  font-size: 0.78rem;
  line-height: 1.5;
}

.eliminar-solicitud-colaboracion__acciones {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  width: 100%;
}

@media (max-width: 520px) {
  .eliminar-solicitud-colaboracion__detalle div {
    grid-template-columns: 1fr;
    gap: 0.1rem;
  }

  .eliminar-solicitud-colaboracion__acciones {
    flex-direction: column-reverse;
    align-items: stretch;
  }
}
</style>
