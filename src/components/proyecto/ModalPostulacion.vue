<template>
  <VaModal
    :model-value="modelValue"
    hide-default-actions
    :no-dismiss="enviando"
    blur
    size="small"
    class="postulacion-modal"
    @update:model-value="onCambioVisibilidad"
  >
    <template #header>
      <h3 class="va-h5 postulacion-modal__titulo">{{ titulo }}</h3>
    </template>

    <p class="postulacion-modal__intro">
      Vas a postularte al proyecto
      <strong>{{ nombreProyecto || "este proyecto" }}</strong>.
    </p>

    <dl class="postulacion-modal__detalle">
      <div class="postulacion-modal__fila">
        <dt>Requerimiento</dt>
        <dd>{{ cantidad }} × {{ profesion }}</dd>
      </div>

      <div v-if="descripcion" class="postulacion-modal__fila">
        <dt>Descripción</dt>
        <dd>{{ descripcion }}</dd>
      </div>

      <div v-if="esActividad && actividad" class="postulacion-modal__fila">
        <dt>Actividad</dt>
        <dd>{{ actividad.nombre }}</dd>
      </div>

      <div v-if="esActividad && actividad" class="postulacion-modal__fila">
        <dt>Duración</dt>
        <dd>{{ duracion }}</dd>
      </div>

      <div v-if="esActividad && actividad" class="postulacion-modal__fila">
        <dt>Horario</dt>
        <dd>{{ rangoFechas }}</dd>
      </div>
    </dl>

    <p v-if="esActividad" class="postulacion-modal__nota">
      La disponibilidad se verificará al enviar la postulación. Si el proyecto
      todavía no tiene fecha de inicio confirmada, la verificación será
      provisoria.
    </p>

    <BaseAlert
      v-if="error"
      :message="error"
      type="error"
      class="postulacion-modal__alerta"
    />

    <div v-if="sugerirCalendario" class="postulacion-modal__calendario">
      <VaButton preset="secondary" size="small" @click="revisarCalendario">
        Revisar mi calendario
      </VaButton>
    </div>

    <template #footer>
      <div class="postulacion-modal__acciones">
        <VaButton preset="secondary" :disabled="enviando" @click="cancelar">
          Cancelar
        </VaButton>
        <VaButton
          preset="primary"
          :loading="enviando"
          :aria-busy="enviando ? 'true' : 'false'"
          @click="confirmar"
        >
          Confirmar postulación
        </VaButton>
      </div>
    </template>
  </VaModal>
</template>

<script>
/*
 * Confirmación de postulación (UC-26, ficha §8.2). Sirve para los dos flujos:
 * requerimiento general y requerimiento de actividad. La request la hace el
 * dashboard; este componente sólo muestra el resumen, el estado de carga y el
 * error. Cerrar (X / overlay / ESC) se bloquea mientras `enviando`.
 */
import BaseAlert from "../AlertaBase.vue";
import { formatearDuracionMinutos } from "../../utils/actividadConstants.js";
import { formatearFecha } from "../../utils/fechas.js";
import { TIPOS_POSTULACION } from "../../utils/postulacionConstants.js";

export default {
  name: "ModalPostulacion",
  components: { BaseAlert },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    tipo: {
      type: String,
      default: TIPOS_POSTULACION.GENERAL,
    },
    nombreProyecto: {
      type: String,
      default: "",
    },
    requerimiento: {
      type: Object,
      default: null,
    },
    actividad: {
      type: Object,
      default: null,
    },
    enviando: {
      type: Boolean,
      default: false,
    },
    error: {
      type: String,
      default: "",
    },
    /** Muestra el atajo a calendario cuando el backend respondió sin disponibilidad. */
    sugerirCalendario: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["update:modelValue", "confirmar", "revisar-calendario"],
  computed: {
    esActividad() {
      return this.tipo === TIPOS_POSTULACION.ACTIVIDAD;
    },
    titulo() {
      return this.esActividad
        ? "Postularme a una actividad"
        : "Postularme a un requerimiento";
    },
    cantidad() {
      return this.requerimiento?.cantidad ?? "—";
    },
    profesion() {
      return this.requerimiento?.nombreProfesion || "—";
    },
    descripcion() {
      return String(this.requerimiento?.descripcion || "").trim();
    },
    duracion() {
      return formatearDuracionMinutos(this.actividad?.duracionMinutos);
    },
    rangoFechas() {
      const inicio = formatearFecha(this.actividad?.fechaHoraInicio);
      const fin = formatearFecha(this.actividad?.fechaHoraFin);
      if (inicio === "—" && fin === "—") return "—";
      return `${inicio} – ${fin}`;
    },
  },
  methods: {
    onCambioVisibilidad(valor) {
      if (this.enviando && !valor) return;
      this.$emit("update:modelValue", valor);
    },
    cancelar() {
      if (this.enviando) return;
      this.$emit("update:modelValue", false);
    },
    confirmar() {
      if (this.enviando) return;
      this.$emit("confirmar");
    },
    revisarCalendario() {
      if (this.enviando) return;
      this.$emit("revisar-calendario");
    },
  },
};
</script>

<style scoped>
.postulacion-modal__titulo {
  margin: 0;
}

.postulacion-modal__intro {
  margin: 0.25rem 0 0.9rem;
  color: var(--color-text, #232134);
  font-size: 0.95rem;
  line-height: 1.5;
}

.postulacion-modal__detalle {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin: 0;
  padding: 0.9rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface-muted);
}

.postulacion-modal__fila {
  display: grid;
  grid-template-columns: 7.5rem 1fr;
  gap: 0.75rem;
  align-items: baseline;
}

.postulacion-modal__fila dt {
  color: var(--color-text-muted);
  font-size: 0.76rem;
  font-weight: 600;
}

.postulacion-modal__fila dd {
  margin: 0;
  color: var(--color-text);
  font-size: 0.88rem;
  line-height: 1.45;
}

.postulacion-modal__nota {
  margin: 0.85rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.8rem;
  line-height: 1.5;
}

.postulacion-modal__alerta {
  margin-top: 0.85rem !important;
}

.postulacion-modal__calendario {
  display: flex;
  justify-content: flex-start;
  margin-top: 0.85rem;
}

.postulacion-modal__acciones {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
  width: 100%;
}
</style>
