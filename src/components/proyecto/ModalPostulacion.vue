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
        <dd>
          {{ rangoFechas }}
          <span v-if="rangoProyectado" class="postulacion-modal__chip">
            Proyectada
          </span>
        </dd>
      </div>
    </dl>

    <div
      v-if="esActividad && chipsActividad.length"
      class="postulacion-modal__chips"
    >
      <span
        v-for="chip in chipsActividad"
        :key="chip.tipo"
        class="postulacion-modal__chip"
        :title="chip.detalle"
      >
        {{ chip.etiqueta }}
      </span>
    </div>

    <p v-if="esActividad" class="postulacion-modal__nota">
      La disponibilidad se verifica antes de postular. Si la consulta falla por
      un error técnico, el sistema volverá a validarla al enviar. Si el proyecto
      todavía no tiene fecha de inicio confirmada, la verificación será
      provisoria.
    </p>

    <DisponibilidadActividad
      v-if="esActividad && modelValue && idProyecto && actividad?.idActividad"
      :id-proyecto="idProyecto"
      :id-actividad="actividad.idActividad"
      :token-refresco="tokenDisponibilidad"
      titulo="Mi disponibilidad"
      @actualizado="disponibilidad = $event"
    />

    <p
      v-if="esActividad && disponibilidad?.disponible === false"
      class="postulacion-modal__aviso"
    >
      <span class="material-symbols-outlined" aria-hidden="true">info</span>
      {{ motivoNoDisponible }}
    </p>

    <BaseAlert
      v-if="error"
      :message="error"
      type="error"
      class="postulacion-modal__alerta"
    />

    <div v-if="mostrarCalendario" class="postulacion-modal__calendario">
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
          :disabled="confirmarDeshabilitado"
          :title="
            disponibilidad?.disponible === false
              ? 'No hay disponibilidad suficiente para esta actividad'
              : undefined
          "
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
import DisponibilidadActividad from "./DisponibilidadActividad.vue";
import { formatearDuracionMinutos } from "../../utils/actividadConstants.js";
import {
  describirCpm,
  esProyectada,
  formatearRangoCpm,
} from "../../utils/cpmConstants.js";
import { mensajeMotivo } from "../../utils/disponibilidadConstants.js";
import { TIPOS_POSTULACION } from "../../utils/postulacionConstants.js";

export default {
  name: "ModalPostulacion",
  components: { BaseAlert, DisponibilidadActividad },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    idProyecto: {
      type: [Number, String],
      default: null,
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
    /** Muestra el atajo a calendario cuando el sistema respondió sin disponibilidad. */
    sugerirCalendario: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["update:modelValue", "confirmar", "revisar-calendario"],
  data() {
    return {
      disponibilidad: null,
      tokenDisponibilidad: 0,
    };
  },
  watch: {
    modelValue(valor) {
      if (valor) this.disponibilidad = null;
    },
    "actividad.idActividad"() {
      this.disponibilidad = null;
    },
    sugerirCalendario(valor) {
      // Tras un 409 de disponibilidad, el contenedor activa este aviso: se
      // vuelve a consultar para reflejar el estado real.
      if (valor) this.tokenDisponibilidad += 1;
    },
  },
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
      if (this.actividad?.fechaHoraInicio) {
        return formatearRangoCpm(
          this.actividad?.fechaHoraInicio,
          this.actividad?.fechaHoraFin
        );
      }
      if (this.actividad?.inicioProyectado) {
        return formatearRangoCpm(
          this.actividad?.inicioProyectado,
          this.actividad?.finProyectado
        );
      }
      return "—";
    },
    rangoProyectado() {
      return esProyectada(this.actividad);
    },
    chipsActividad() {
      return describirCpm(this.actividad);
    },
    motivoNoDisponible() {
      return mensajeMotivo(this.disponibilidad?.motivo);
    },
    mostrarCalendario() {
      return (
        this.sugerirCalendario ||
        this.disponibilidad?.disponible === false
      );
    },
    confirmarDeshabilitado() {
      return this.enviando || this.disponibilidad?.disponible === false;
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
      if (this.confirmarDeshabilitado) return;
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

.postulacion-modal__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.75rem;
}

.postulacion-modal__chip {
  display: inline-block;
  margin-left: 0.35rem;
  padding: 0.1rem 0.45rem;
  border: 1px solid var(--color-info-border);
  border-radius: 999px;
  background: var(--color-info-soft);
  color: var(--color-info-text);
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
}

.postulacion-modal__chips .postulacion-modal__chip {
  margin-left: 0;
}

.postulacion-modal__aviso {
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
  margin: 0.75rem 0 0;
  padding: 0.6rem 0.7rem;
  border: 1px solid var(--color-danger-border);
  border-radius: 8px;
  background: var(--color-danger-soft);
  color: var(--color-danger-text);
  font-size: 0.8rem;
  line-height: 1.45;
}

.postulacion-modal__aviso .material-symbols-outlined {
  font-size: 1rem;
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
