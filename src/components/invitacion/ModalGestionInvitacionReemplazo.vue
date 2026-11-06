<template>
  <VaModal
    :model-value="modelValue"
    hide-default-actions
    size="medium"
    :no-dismiss="gestionando"
    blur
    class="gestion-reemplazo"
    @update:model-value="onCambioVisibilidad"
  >
    <template #header>
      <h3 class="va-h5 gestion-reemplazo__titulo">{{ titulo }}</h3>
    </template>

    <div v-if="invitacion" class="gestion-reemplazo__contenido">
      <p class="gestion-reemplazo__intro">{{ textoIntro }}</p>

      <dl class="gestion-reemplazo__detalle">
        <div>
          <dt>Proyecto</dt>
          <dd>{{ invitacion.nombreProyecto || "—" }}</dd>
        </div>
        <div>
          <dt>Tipo</dt>
          <dd>{{ etiquetaTipoReemplazo(invitacion.tipo) }}</dd>
        </div>
        <div>
          <dt>Vacante</dt>
          <dd>{{ descripcionInvitacionReemplazo(invitacion) }}</dd>
        </div>
        <div v-if="esActividad && invitacion.profesion">
          <dt>Profesión</dt>
          <dd>{{ invitacion.profesion }}</dd>
        </div>
        <div>
          <dt>Fecha de invitación</dt>
          <dd>{{ fechaInvitacion }}</dd>
        </div>
        <div v-if="inicioActividad">
          <dt>Actividad</dt>
          <dd>
            {{ inicioActividad }}
            <template v-if="duracionTexto"> · {{ duracionTexto }}</template>
          </dd>
        </div>
        <div
          v-if="invitacion.mensaje"
          class="gestion-reemplazo__detalle-completo"
        >
          <dt>Mensaje</dt>
          <dd>{{ invitacion.mensaje }}</dd>
        </div>
      </dl>

      <p v-if="esAceptar && esActividad" class="gestion-reemplazo__aviso">
        Se verificará tu disponibilidad. Si no hay una ventana válida, la
        invitación no se aceptará.
      </p>

      <p
        v-if="!esAceptar"
        class="gestion-reemplazo__aviso gestion-reemplazo__aviso--rechazo"
      >
        La invitación quedará rechazada y el director será notificado.
      </p>

      <BaseAlert v-if="error" :message="error" type="error" />

      <p v-if="error && mostrarRechazo" class="gestion-reemplazo__sugerencia">
        Podés rechazar la invitación para cerrar la gestión.
      </p>

      <VaTextarea
        v-if="!esAceptar"
        v-model="motivo"
        label="Motivo del rechazo (opcional)"
        placeholder="Podés contarle al director por qué no podés cubrir la vacante."
        :max-length="LIMITE_MOTIVO_REEMPLAZO"
        counter
        :rows="3"
        :disabled="gestionando"
      />
    </div>

    <template #footer>
      <div class="gestion-reemplazo__acciones">
        <VaButton
          v-if="mostrarRechazo && esAceptar"
          preset="secondary"
          color="danger"
          :disabled="gestionando"
          @click="$emit('rechazar')"
        >
          Rechazar invitación
        </VaButton>

        <div class="gestion-reemplazo__acciones-principales">
          <VaButton
            preset="secondary"
            :disabled="gestionando"
            @click="cerrar"
          >
            Cancelar
          </VaButton>
          <VaButton
            :preset="esAceptar ? 'primary' : undefined"
            :color="esAceptar ? undefined : 'danger'"
            :loading="gestionando"
            :disabled="gestionando"
            @click="confirmar"
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
import { formatearFecha, formatearFechaCorta } from "../../utils/fechas.js";
import {
  ACCIONES_GESTION_REEMPLAZO,
  LIMITE_MOTIVO_REEMPLAZO,
  TIPOS_REEMPLAZO,
  descripcionInvitacionReemplazo,
  etiquetaTipoReemplazo,
} from "../../utils/reemplazoConstants.js";

export default {
  name: "ModalGestionInvitacionReemplazo",
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
      default: ACCIONES_GESTION_REEMPLAZO.ACEPTAR,
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
  data() {
    return {
      LIMITE_MOTIVO_REEMPLAZO,
      motivo: "",
    };
  },
  computed: {
    esAceptar() {
      return this.accion === ACCIONES_GESTION_REEMPLAZO.ACEPTAR;
    },
    esActividad() {
      return this.invitacion?.tipo === TIPOS_REEMPLAZO.ACTIVIDAD;
    },
    titulo() {
      return this.esAceptar
        ? "Aceptar invitación de reemplazo"
        : "Rechazar invitación de reemplazo";
    },
    textoConfirmar() {
      return this.esAceptar ? "Aceptar invitación" : "Rechazar invitación";
    },
    textoIntro() {
      if (this.esAceptar) {
        return this.esActividad
          ? "Vas a aceptar la invitación. Si tenés disponibilidad, quedarás pendiente de aprobación del director."
          : "Vas a aceptar la invitación para cubrir la vacante. Quedarás pendiente de aprobación del director.";
      }
      return "Vas a rechazar esta invitación de reemplazo.";
    },
    fechaInvitacion() {
      return this.invitacion?.fechaInvitacion
        ? formatearFechaCorta(this.invitacion.fechaInvitacion)
        : "";
    },
    inicioActividad() {
      return this.invitacion?.fechaHoraInicio
        ? formatearFecha(this.invitacion.fechaHoraInicio)
        : "";
    },
    duracionTexto() {
      const minutos = Number(this.invitacion?.duracionMinutos);
      if (!Number.isFinite(minutos) || minutos <= 0) return "";
      if (minutos < 60) return `${minutos} min`;
      const horas = Math.floor(minutos / 60);
      const resto = minutos % 60;
      return resto ? `${horas} h ${resto} min` : `${horas} h`;
    },
  },
  watch: {
    modelValue(visible) {
      if (!visible) this.motivo = "";
    },
    accion() {
      this.motivo = "";
    },
  },
  methods: {
    descripcionInvitacionReemplazo,
    etiquetaTipoReemplazo,
    onCambioVisibilidad(valor) {
      if (this.gestionando && !valor) return;
      this.$emit("update:modelValue", valor);
    },
    cerrar() {
      if (this.gestionando) return;
      this.$emit("update:modelValue", false);
    },
    confirmar() {
      if (this.gestionando) return;
      this.$emit("confirmar", this.esAceptar ? "" : this.motivo.trim());
    },
  },
};
</script>

<style scoped>
.gestion-reemplazo__titulo {
  margin: 0;
}

.gestion-reemplazo__contenido {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.gestion-reemplazo__intro {
  margin: 0;
  color: var(--color-text);
  font-size: 0.94rem;
  line-height: 1.5;
}

.gestion-reemplazo__detalle {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem 1rem;
  margin: 0;
  padding: 0.85rem 0.95rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface-muted);
}

.gestion-reemplazo__detalle div {
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
}

.gestion-reemplazo__detalle-completo {
  grid-column: 1 / -1;
}

.gestion-reemplazo__detalle dt {
  color: var(--color-text-muted);
  font-size: 0.72rem;
  font-weight: 600;
}

.gestion-reemplazo__detalle dd {
  margin: 0;
  color: var(--color-text);
  font-size: 0.84rem;
  font-weight: 600;
  line-height: 1.4;
}

.gestion-reemplazo__aviso {
  margin: 0;
  padding: 0.65rem 0.75rem;
  border: 1px solid var(--color-info-border);
  border-radius: 8px;
  background: var(--color-info-soft);
  color: var(--color-info-text);
  font-size: 0.8rem;
  line-height: 1.45;
}

.gestion-reemplazo__aviso--rechazo {
  border-color: var(--color-warning-border);
  background: var(--color-warning-soft);
  color: var(--color-warning-text);
}

.gestion-reemplazo__sugerencia {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.78rem;
  line-height: 1.45;
}

.gestion-reemplazo__acciones {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
}

.gestion-reemplazo__acciones-principales {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-left: auto;
}

@media (max-width: 560px) {
  .gestion-reemplazo__detalle {
    grid-template-columns: 1fr;
  }

  .gestion-reemplazo__acciones {
    flex-direction: column-reverse;
    align-items: stretch;
  }

  .gestion-reemplazo__acciones-principales {
    flex-direction: column-reverse;
    margin-left: 0;
  }
}
</style>
