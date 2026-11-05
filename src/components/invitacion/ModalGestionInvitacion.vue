<template>
  <VaModal
    :model-value="modelValue"
    hide-default-actions
    size="medium"
    :no-dismiss="gestionando"
    blur
    class="gestion-invitacion"
    @update:model-value="onCambioVisibilidad"
  >
    <template #header>
      <h3 class="va-h5 gestion-invitacion__titulo">{{ titulo }}</h3>
    </template>

    <div v-if="invitacion" class="gestion-invitacion__contenido">
      <p class="gestion-invitacion__intro">{{ textoIntro }}</p>

      <dl class="gestion-invitacion__detalle">
        <div>
          <dt>Proyecto</dt>
          <dd>{{ invitacion.nombreProyecto || "—" }}</dd>
        </div>
        <div>
          <dt>Tipo</dt>
          <dd>{{ etiquetaTipoInvitacion(invitacion.tipo) }}</dd>
        </div>
        <div>
          <dt>Perfil remitente</dt>
          <dd>{{ nombreRemitente }}</dd>
        </div>
        <div>
          <dt>Fecha de envío</dt>
          <dd>{{ fechaEnvio }}</dd>
        </div>
        <div v-if="esActividad && invitacion.nombreActividad">
          <dt>Actividad</dt>
          <dd>{{ invitacion.nombreActividad }}</dd>
        </div>
        <div v-if="esActividad && invitacion.idRequerimientoActividad != null">
          <dt>Requerimiento</dt>
          <dd>#{{ invitacion.idRequerimientoActividad }}</dd>
        </div>
        <div
          v-if="invitacion.mensaje"
          class="gestion-invitacion__detalle-completo"
        >
          <dt>Mensaje</dt>
          <dd>{{ invitacion.mensaje }}</dd>
        </div>
      </dl>

      <p
        v-if="esAceptar && esActividad"
        class="gestion-invitacion__aviso"
      >
        Se verificará la disponibilidad del perfil. Si no hay una ventana
        válida, la invitación no se aceptará.
      </p>

      <p
        v-if="!esAceptar"
        class="gestion-invitacion__aviso gestion-invitacion__aviso--rechazo"
      >
        La invitación quedará en estado <strong>RECHAZADA</strong>. No se
        elimina.
      </p>

      <BaseAlert v-if="error" :message="error" type="error" />

      <p v-if="error && mostrarRechazo" class="gestion-invitacion__sugerencia">
        Podés rechazar la invitación para liberar el cupo y cerrar la gestión.
      </p>
    </div>

    <template #footer>
      <div class="gestion-invitacion__acciones">
        <VaButton
          v-if="mostrarRechazo && esAceptar"
          preset="secondary"
          color="danger"
          :disabled="gestionando"
          @click="$emit('rechazar')"
        >
          Rechazar invitación
        </VaButton>

        <div class="gestion-invitacion__acciones-principales">
          <VaButton
            preset="secondary"
            :disabled="gestionando"
            @click="cancelar"
          >
            Cancelar
          </VaButton>
          <VaButton
            preset="primary"
            :color="esAceptar ? undefined : 'danger'"
            :loading="gestionando"
            :disabled="gestionando"
            @click="$emit('confirmar')"
          >
            {{ textoConfirmar }}
          </VaButton>
        </div>
      </div>
    </template>
  </VaModal>
</template>

<script>
import BaseAlert from "../AlertaBase.vue";
import { formatearFechaCorta } from "../../utils/fechas.js";
import {
  ACCIONES_GESTION_INVITACION,
  etiquetaTipoInvitacion,
} from "../../utils/invitacionBusquedaConstants.js";
import { TIPOS_INVITACION } from "../../utils/invitacionConstants.js";

export default {
  name: "ModalGestionInvitacion",
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
    accion: {
      type: String,
      default: ACCIONES_GESTION_INVITACION.ACEPTAR,
    },
    gestionando: {
      type: Boolean,
      default: false,
    },
    error: {
      type: String,
      default: "",
    },
    mostrarRechazo: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["update:modelValue", "confirmar", "rechazar"],
  computed: {
    esAceptar() {
      return this.accion === ACCIONES_GESTION_INVITACION.ACEPTAR;
    },
    esActividad() {
      return this.invitacion?.tipo === TIPOS_INVITACION.ACTIVIDAD;
    },
    titulo() {
      return this.esAceptar ? "Aceptar invitación" : "Rechazar invitación";
    },
    textoConfirmar() {
      return this.esAceptar ? "Aceptar invitación" : "Rechazar invitación";
    },
    textoIntro() {
      if (this.esAceptar) {
        return this.esActividad
          ? "Vas a aceptar la invitación y, si hay disponibilidad, quedarás asignado a la actividad."
          : "Vas a aceptar la invitación y pasarás a ser miembro del proyecto.";
      }
      return "Vas a rechazar esta invitación.";
    },
    nombreRemitente() {
      return this.invitacion?.remitente?.nombreArtistico || "—";
    },
    fechaEnvio() {
      return formatearFechaCorta(this.invitacion?.fechaEnvio);
    },
  },
  methods: {
    etiquetaTipoInvitacion,
    onCambioVisibilidad(valor) {
      if (this.gestionando && !valor) return;
      this.$emit("update:modelValue", valor);
    },
    cancelar() {
      if (this.gestionando) return;
      this.$emit("update:modelValue", false);
    },
  },
};
</script>

<style scoped>
.gestion-invitacion__titulo {
  margin: 0;
}

.gestion-invitacion__contenido {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.gestion-invitacion__intro {
  margin: 0;
  color: var(--color-text);
  font-size: 0.94rem;
  line-height: 1.5;
}

.gestion-invitacion__detalle {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem 1rem;
  margin: 0;
  padding: 0.85rem 0.95rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface-muted);
}

.gestion-invitacion__detalle div {
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
}

.gestion-invitacion__detalle-completo {
  grid-column: 1 / -1;
}

.gestion-invitacion__detalle dt {
  color: var(--color-text-muted);
  font-size: 0.72rem;
  font-weight: 600;
}

.gestion-invitacion__detalle dd {
  margin: 0;
  color: var(--color-text);
  font-size: 0.84rem;
  font-weight: 600;
  line-height: 1.4;
}

.gestion-invitacion__aviso {
  margin: 0;
  padding: 0.65rem 0.75rem;
  border: 1px solid var(--color-info-border);
  border-radius: 8px;
  background: var(--color-info-soft);
  color: var(--color-info-text);
  font-size: 0.8rem;
  line-height: 1.45;
}

.gestion-invitacion__aviso--rechazo {
  border-color: var(--color-warning-border);
  background: var(--color-warning-soft);
  color: var(--color-warning-text);
}

.gestion-invitacion__sugerencia {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.78rem;
  line-height: 1.45;
}

.gestion-invitacion__acciones {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
}

.gestion-invitacion__acciones-principales {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-left: auto;
}

@media (max-width: 560px) {
  .gestion-invitacion__detalle {
    grid-template-columns: 1fr;
  }

  .gestion-invitacion__acciones {
    flex-direction: column-reverse;
    align-items: stretch;
  }

  .gestion-invitacion__acciones-principales {
    flex-direction: column-reverse;
    margin-left: 0;
  }
}
</style>
