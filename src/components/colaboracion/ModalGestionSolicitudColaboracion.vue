<template>
  <VaModal
    :model-value="modelValue"
    hide-default-actions
    size="medium"
    :no-dismiss="gestionando"
    blur
    class="gestion-colaboracion"
    @update:model-value="cambiarVisibilidad"
  >
    <template #header>
      <h3 class="va-h5 gestion-colaboracion__titulo">{{ titulo }}</h3>
    </template>

    <div v-if="solicitud" class="gestion-colaboracion__contenido">
      <p class="gestion-colaboracion__intro">{{ textoIntro }}</p>

      <dl class="gestion-colaboracion__detalle">
        <div>
          <dt>Publicación</dt>
          <dd>{{ solicitud.publicacion?.titulo || "—" }}</dd>
        </div>
        <div>
          <dt>{{ etiquetaContraparte }}</dt>
          <dd>{{ nombreContraparte }}</dd>
        </div>
        <div v-if="profesionContraparte">
          <dt>Profesión</dt>
          <dd>{{ profesionContraparte }}</dd>
        </div>
        <div>
          <dt>Estado actual</dt>
          <dd>{{ etiquetaEstado }}</dd>
        </div>
      </dl>

      <p
        class="gestion-colaboracion__aviso"
        :class="{
          'gestion-colaboracion__aviso--rechazo': !esAceptar,
        }"
      >
        <template v-if="esAceptar">
          El perfil se agregará como colaborador de la publicación y esta
          aparecerá en su portfolio.
        </template>
        <template v-else>
          La solicitud quedará en estado <strong>RECHAZADA</strong> y el perfil
          no se agregará como colaborador.
        </template>
      </p>

      <BaseAlert v-if="error" :message="error" type="error" />
    </div>

    <template #footer>
      <div class="gestion-colaboracion__acciones">
        <VaButton
          preset="secondary"
          :disabled="gestionando"
          @click="cerrar"
        >
          Cancelar
        </VaButton>
        <VaButton
          :color="esAceptar ? 'primary' : 'danger'"
          :loading="gestionando"
          :disabled="gestionando"
          @click="$emit('confirmar')"
        >
          {{ textoConfirmar }}
        </VaButton>
      </div>
    </template>
  </VaModal>
</template>

<script>
import BaseAlert from "../AlertaBase.vue";
import {
  ACCIONES_GESTION_SOLICITUD_COLABORACION,
  ETIQUETAS_ESTADO_SOLICITUD_COLABORACION,
  normalizarEstadoSolicitudColaboracion,
} from "../../utils/solicitudesColaboracionConstants.js";

export default {
  name: "ModalGestionSolicitudColaboracion",
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
    accion: {
      type: String,
      default: ACCIONES_GESTION_SOLICITUD_COLABORACION.ACEPTAR,
    },
    gestionando: {
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
      return (
        this.accion === ACCIONES_GESTION_SOLICITUD_COLABORACION.ACEPTAR
      );
    },
    titulo() {
      return this.esAceptar
        ? "Aceptar solicitud de colaboración"
        : "Rechazar solicitud de colaboración";
    },
    textoConfirmar() {
      return this.esAceptar ? "Aceptar solicitud" : "Rechazar solicitud";
    },
    textoIntro() {
      return this.esAceptar
        ? "Vas a aceptar la solicitud para colaborar en esta publicación."
        : "Vas a rechazar la solicitud para colaborar en esta publicación.";
    },
    esRecibida() {
      return this.solicitud?.direccion === "RECIBIDA";
    },
    contraparte() {
      return this.esRecibida
        ? this.solicitud?.remitente
        : this.solicitud?.destinatario;
    },
    nombreContraparte() {
      return this.contraparte?.nombreArtistico || "—";
    },
    profesionContraparte() {
      return this.contraparte?.profesion || "";
    },
    etiquetaContraparte() {
      return this.esRecibida ? "Perfil remitente" : "Perfil destinatario";
    },
    etiquetaEstado() {
      const estado = normalizarEstadoSolicitudColaboracion(
        this.solicitud?.estado
      );
      return (
        ETIQUETAS_ESTADO_SOLICITUD_COLABORACION[estado] ||
        this.solicitud?.estado ||
        "—"
      );
    },
  },
  methods: {
    cambiarVisibilidad(valor) {
      if (this.gestionando && !valor) return;
      this.$emit("update:modelValue", valor);
    },
    cerrar() {
      if (this.gestionando) return;
      this.$emit("update:modelValue", false);
    },
  },
};
</script>

<style scoped>
.gestion-colaboracion__titulo {
  margin: 0;
}

.gestion-colaboracion__contenido {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.gestion-colaboracion__intro {
  margin: 0;
  color: var(--color-text);
  font-size: 0.94rem;
  line-height: 1.5;
}

.gestion-colaboracion__detalle {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem 1rem;
  margin: 0;
  padding: 0.85rem 0.95rem;
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border);
  border-radius: 10px;
}

.gestion-colaboracion__detalle div {
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
}

.gestion-colaboracion__detalle dt {
  color: var(--color-text-muted);
  font-size: 0.72rem;
  font-weight: 600;
}

.gestion-colaboracion__detalle dd {
  margin: 0;
  color: var(--color-text);
  font-size: 0.84rem;
  font-weight: 600;
  line-height: 1.4;
}

.gestion-colaboracion__aviso {
  margin: 0;
  padding: 0.65rem 0.75rem;
  color: var(--color-info-text);
  background: var(--color-info-soft);
  border: 1px solid var(--color-info-border);
  border-radius: 8px;
  font-size: 0.8rem;
  line-height: 1.45;
}

.gestion-colaboracion__aviso--rechazo {
  color: var(--color-warning-text);
  background: var(--color-warning-soft);
  border-color: var(--color-warning-border);
}

.gestion-colaboracion__acciones {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  width: 100%;
}

@media (max-width: 560px) {
  .gestion-colaboracion__detalle {
    grid-template-columns: 1fr;
  }

  .gestion-colaboracion__acciones {
    flex-direction: column-reverse;
    align-items: stretch;
  }
}
</style>
