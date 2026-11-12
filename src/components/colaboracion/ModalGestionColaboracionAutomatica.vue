<template>
  <VaModal
    :model-value="modelValue"
    hide-default-actions
    size="medium"
    :no-dismiss="gestionando"
    blur
    class="gestion-automatica"
    @update:model-value="cambiarVisibilidad"
  >
    <template #header>
      <h3 class="va-h5 gestion-automatica__titulo">{{ titulo }}</h3>
    </template>

    <div v-if="colaboracion" class="gestion-automatica__contenido">
      <p class="gestion-automatica__intro">{{ textoIntro }}</p>

      <dl class="gestion-automatica__detalle">
        <div>
          <dt>Tu publicación</dt>
          <dd>{{ tituloPropia }}</dd>
        </div>
        <div>
          <dt>Publicación de {{ nombreContraparte }}</dt>
          <dd>{{ tituloContraparte }}</dd>
        </div>
        <div>
          <dt>Perfil de la contraparte</dt>
          <dd>{{ nombreContraparte }}</dd>
        </div>
        <div>
          <dt>Estado de la propuesta</dt>
          <dd>
            <EstadoColaboracionAutomaticaBadge :estado="estado" />
          </dd>
        </div>
        <div>
          <dt>Tu estado</dt>
          <dd>{{ etiquetaMiEstado }}</dd>
        </div>
        <div>
          <dt>Estado de {{ nombreContraparte }}</dt>
          <dd>{{ etiquetaEstadoContraparte }}</dd>
        </div>
      </dl>

      <p
        class="gestion-automatica__aviso"
        :class="{
          'gestion-automatica__aviso--rechazo': !esConfirmar,
          'gestion-automatica__aviso--exito':
            esConfirmar && contraparteYaConfirmo,
        }"
      >
        <template v-if="esConfirmar && contraparteYaConfirmo">
          {{ nombreContraparte }} ya confirmó. Al confirmar, la colaboración
          quedará activa y ambos perfiles aparecerán como colaboradores en la
          publicación del otro.
        </template>
        <template v-else-if="esConfirmar">
          Se registrará tu confirmación. La colaboración se activa recién
          cuando {{ nombreContraparte }} también confirme. No se crea una
          conexión de red.
        </template>
        <template v-else>
          La propuesta quedará en estado <strong>RECHAZADA</strong> y no se
          agregarán colaboradores. Ambos perfiles recibirán una notificación.
        </template>
      </p>

      <BaseAlert v-if="error" :message="error" type="error" />
    </div>

    <template #footer>
      <div class="gestion-automatica__acciones">
        <VaButton
          preset="secondary"
          :disabled="gestionando"
          @click="cerrar"
        >
          Cancelar
        </VaButton>
        <VaButton
          :color="esConfirmar ? 'primary' : 'danger'"
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
import EstadoColaboracionAutomaticaBadge from "./EstadoColaboracionAutomaticaBadge.vue";
import {
  ACCIONES_COLABORACION_AUTOMATICA,
  ESTADOS_COLABORACION_AUTOMATICA,
  ETIQUETAS_ESTADO_COLABORACION_AUTOMATICA,
  normalizarEstadoColaboracionAutomatica,
} from "../../utils/colaboracionesAutomaticasConstants.js";

export default {
  name: "ModalGestionColaboracionAutomatica",
  components: { BaseAlert, EstadoColaboracionAutomaticaBadge },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    colaboracion: {
      type: Object,
      default: null,
    },
    accion: {
      type: String,
      default: ACCIONES_COLABORACION_AUTOMATICA.CONFIRMAR,
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
    esConfirmar() {
      return this.accion === ACCIONES_COLABORACION_AUTOMATICA.CONFIRMAR;
    },
    titulo() {
      return this.esConfirmar
        ? "Confirmar colaboración automática"
        : "Rechazar colaboración automática";
    },
    textoConfirmar() {
      return this.esConfirmar ? "Confirmar colaboración" : "Rechazar propuesta";
    },
    textoIntro() {
      return this.esConfirmar
        ? "Vas a confirmar la propuesta detectada automáticamente entre estas dos publicaciones."
        : "Vas a rechazar la propuesta detectada automáticamente.";
    },
    propia() {
      return this.colaboracion?.publicacionPropia || null;
    },
    contraparte() {
      return this.colaboracion?.publicacionContraparte || null;
    },
    nombreContraparte() {
      return (
        this.colaboracion?.perfilContraparte?.nombreArtistico ||
        "la contraparte"
      );
    },
    tituloPropia() {
      return this.propia?.eliminada
        ? "Publicación eliminada"
        : this.propia?.titulo || "Tu publicación";
    },
    tituloContraparte() {
      return this.contraparte?.eliminada
        ? "Publicación eliminada"
        : this.contraparte?.titulo || "Publicación";
    },
    estado() {
      return (
        normalizarEstadoColaboracionAutomatica(
          this.colaboracion?.estado
        ) ||
        this.colaboracion?.estado ||
        ""
      );
    },
    miEstado() {
      return (
        normalizarEstadoColaboracionAutomatica(
          this.colaboracion?.miEstado
        ) ||
        this.colaboracion?.miEstado ||
        ""
      );
    },
    estadoContraparte() {
      return (
        normalizarEstadoColaboracionAutomatica(
          this.colaboracion?.estadoContraparte
        ) ||
        this.colaboracion?.estadoContraparte ||
        ""
      );
    },
    etiquetaMiEstado() {
      return (
        ETIQUETAS_ESTADO_COLABORACION_AUTOMATICA[this.miEstado] ||
        this.miEstado ||
        "—"
      );
    },
    etiquetaEstadoContraparte() {
      return (
        ETIQUETAS_ESTADO_COLABORACION_AUTOMATICA[this.estadoContraparte] ||
        this.estadoContraparte ||
        "—"
      );
    },
    contraparteYaConfirmo() {
      return (
        this.estadoContraparte ===
        ESTADOS_COLABORACION_AUTOMATICA.CONFIRMADA
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
.gestion-automatica__titulo {
  margin: 0;
}

.gestion-automatica__contenido {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.gestion-automatica__intro {
  margin: 0;
  color: var(--color-text);
  font-size: 0.94rem;
  line-height: 1.5;
}

.gestion-automatica__detalle {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem 1rem;
  margin: 0;
  padding: 0.85rem 0.95rem;
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border);
  border-radius: 10px;
}

.gestion-automatica__detalle div {
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
}

.gestion-automatica__detalle dt {
  color: var(--color-text-muted);
  font-size: 0.72rem;
  font-weight: 600;
}

.gestion-automatica__detalle dd {
  margin: 0;
  color: var(--color-text);
  font-size: 0.84rem;
  font-weight: 600;
  line-height: 1.4;
}

.gestion-automatica__aviso {
  margin: 0;
  padding: 0.65rem 0.75rem;
  color: var(--color-info-text);
  background: var(--color-info-soft);
  border: 1px solid var(--color-info-border);
  border-radius: 8px;
  font-size: 0.8rem;
  line-height: 1.45;
}

.gestion-automatica__aviso--rechazo {
  color: var(--color-warning-text);
  background: var(--color-warning-soft);
  border-color: var(--color-warning-border);
}

.gestion-automatica__aviso--exito {
  color: var(--color-success-text);
  background: var(--color-success-soft);
  border-color: var(--color-success-border);
}

.gestion-automatica__acciones {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  width: 100%;
}

@media (max-width: 560px) {
  .gestion-automatica__detalle {
    grid-template-columns: 1fr;
  }

  .gestion-automatica__acciones {
    flex-direction: column-reverse;
    align-items: stretch;
  }
}
</style>
