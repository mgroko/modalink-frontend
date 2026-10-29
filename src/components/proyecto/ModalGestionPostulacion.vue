<template>
  <VaModal
    :model-value="modelValue"
    hide-default-actions
    :no-dismiss="enviando"
    blur
    size="small"
    class="gestion-postulacion-modal"
    @update:model-value="onCambioVisibilidad"
  >
    <template #header>
      <h3 class="va-h5 gestion-postulacion-modal__titulo">{{ titulo }}</h3>
    </template>

    <p class="gestion-postulacion-modal__intro">
      Vas a {{ verbo }} la postulación de
      <strong>{{ postulacion?.nombreArtistico || "este perfil" }}</strong>
      al proyecto <strong>{{ nombreProyecto || "este proyecto" }}</strong>.
    </p>

    <dl class="gestion-postulacion-modal__detalle">
      <div class="gestion-postulacion-modal__fila">
        <dt>Profesión</dt>
        <dd>{{ postulacion?.nombreProfesion || "—" }}</dd>
      </div>

      <div class="gestion-postulacion-modal__fila">
        <dt>Tipo</dt>
        <dd>{{ etiquetaTipoPostulacion(postulacion?.tipo) || "—" }}</dd>
      </div>

      <div class="gestion-postulacion-modal__fila">
        <dt>Requerimiento</dt>
        <dd>{{ postulacion?.descripcionRequerimiento || "Sin descripción" }}</dd>
      </div>

      <div class="gestion-postulacion-modal__fila">
        <dt>Cupo</dt>
        <dd>
          {{ cupo }}
          <span v-if="postulacion?.satisfecho" class="gestion-postulacion-modal__chip">
            Cupo completo
          </span>
        </dd>
      </div>

      <div class="gestion-postulacion-modal__fila">
        <dt>Estado</dt>
        <dd>{{ etiquetaEstadoPostulacion(postulacion?.estado) }}</dd>
      </div>
    </dl>

    <template v-if="esActividad">
      <h4 class="gestion-postulacion-modal__subtitulo">Actividad</h4>

      <p v-if="cargandoActividad" class="gestion-postulacion-modal__nota">
        Cargando el horario de la actividad...
      </p>

      <template v-else>
        <dl class="gestion-postulacion-modal__detalle">
          <div class="gestion-postulacion-modal__fila">
            <dt>Nombre</dt>
            <dd>{{ nombreActividad || "—" }}</dd>
          </div>

          <div v-if="rangoActividad" class="gestion-postulacion-modal__fila">
            <dt>Horario</dt>
            <dd>{{ rangoActividad }}</dd>
          </div>

          <div v-if="duracion !== '—'" class="gestion-postulacion-modal__fila">
            <dt>Duración</dt>
            <dd>{{ duracion }}</dd>
          </div>

          <div v-if="rangoProyectado" class="gestion-postulacion-modal__fila">
            <dt>Origen de fechas</dt>
            <dd>Proyectadas por CPM (no persistidas)</dd>
          </div>
        </dl>

        <div
          v-if="chipsActividad.length"
          class="gestion-postulacion-modal__chips"
        >
          <span
            v-for="chip in chipsActividad"
            :key="chip.tipo"
            class="gestion-postulacion-modal__chip-cpm"
            :title="chip.detalle"
          >
            {{ chip.etiqueta }}
          </span>
        </div>

        <p v-if="errorActividad" class="gestion-postulacion-modal__nota">
          No se pudo cargar el horario de la actividad. Podés continuar con los
          datos del listado.
        </p>
      </template>

      <DisponibilidadActividad
        v-if="
          esAceptar &&
          modelValue &&
          idProyecto &&
          postulacion?.idActividad &&
          postulacion?.idPerfil
        "
        :id-proyecto="idProyecto"
        :id-actividad="postulacion.idActividad"
        :id-perfiles="idPerfilesDisponibilidad"
        :token-refresco="tokenDisponibilidad"
        titulo="Disponibilidad del postulante"
        @actualizado="disponibilidad = $event"
      />
    </template>

    <p class="gestion-postulacion-modal__nota">{{ notaEfecto }}</p>

    <p v-if="avisoCupo" class="gestion-postulacion-modal__aviso">
      <span class="material-symbols-outlined" aria-hidden="true">info</span>
      {{ avisoCupo }}
    </p>

    <BaseAlert
      v-if="error"
      :message="error"
      type="error"
      class="gestion-postulacion-modal__alerta"
    />

    <template #footer>
      <div class="gestion-postulacion-modal__acciones">
        <VaButton preset="secondary" :disabled="enviando" @click="cancelar">
          Cancelar
        </VaButton>
        <VaButton
          preset="primary"
          :color="esAceptar ? 'primary' : 'danger'"
          :loading="enviando"
          :disabled="confirmarDeshabilitado"
          :aria-busy="enviando ? 'true' : 'false'"
          @click="confirmar"
        >
          {{ esAceptar ? "Confirmar aceptación" : "Confirmar rechazo" }}
        </VaButton>
      </div>
    </template>
  </VaModal>
</template>

<script>
import BaseAlert from "../AlertaBase.vue";
import DisponibilidadActividad from "./DisponibilidadActividad.vue";
import { formatearDuracionMinutos } from "../../utils/actividadConstants.js";
import {
  describirCpm,
  esProyectada,
  formatearRangoCpm,
} from "../../utils/cpmConstants.js";
import {
  ACCIONES_GESTION,
  etiquetaEstadoPostulacion,
  etiquetaTipoPostulacion,
} from "../../utils/postulacionConstants.js";

const ACCION_ACEPTAR = ACCIONES_GESTION.ACEPTAR;
const ACCION_RECHAZAR = ACCIONES_GESTION.RECHAZAR;

/*
 * Confirmación de UC-34. Sirve para aceptar y rechazar, en postulaciones
 * generales y de actividad. La request la hace el contenedor; el modal sólo
 * muestra el resumen, el estado de carga y el error.
 */
export default {
  name: "ModalGestionPostulacion",
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
    tokenDisponibilidad: {
      type: Number,
      default: 0,
    },
    accion: {
      type: String,
      default: ACCION_ACEPTAR,
    },
    postulacion: {
      type: Object,
      default: null,
    },
    nombreProyecto: {
      type: String,
      default: "",
    },
    /** Detalle de UC-50: sólo para postulaciones de actividad. */
    actividad: {
      type: Object,
      default: null,
    },
    cargandoActividad: {
      type: Boolean,
      default: false,
    },
    errorActividad: {
      type: String,
      default: "",
    },
    enviando: {
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
      disponibilidad: null,
    };
  },
  watch: {
    modelValue(valor) {
      if (valor) this.disponibilidad = null;
    },
  },
  computed: {
    esAceptar() {
      return this.accion !== ACCION_RECHAZAR;
    },
    esActividad() {
      return this.postulacion?.tipo === "ACTIVIDAD";
    },
    verbo() {
      return this.esAceptar ? "aceptar" : "rechazar";
    },
    titulo() {
      return this.esAceptar ? "Aceptar postulación" : "Rechazar postulación";
    },
    cupo() {
      const cubiertos = Number(this.postulacion?.cubiertos);
      const cantidad = Number(this.postulacion?.cantidadRequerida);
      if (!Number.isFinite(cubiertos) || !Number.isFinite(cantidad)) return "—";
      const faltantes = Number(this.postulacion?.faltantes);
      const detalle = Number.isFinite(faltantes)
        ? ` · faltan ${faltantes}`
        : "";
      return `${cubiertos} / ${cantidad}${detalle}`;
    },
    nombreActividad() {
      return this.actividad?.nombre || this.postulacion?.nombreActividad || "";
    },
    rangoActividad() {
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
      return "";
    },
    rangoProyectado() {
      return esProyectada(this.actividad);
    },
    chipsActividad() {
      return describirCpm(this.actividad);
    },
    idPerfilesDisponibilidad() {
      const idPerfil = this.postulacion?.idPerfil;
      return idPerfil != null ? [idPerfil] : [];
    },
    duracion() {
      return formatearDuracionMinutos(this.actividad?.duracionMinutos);
    },
    notaEfecto() {
      if (!this.esAceptar) {
        return "La postulación quedará rechazada. No se elimina: el perfil no podrá volver a postularse a este requerimiento.";
      }
      if (this.esActividad) {
        return "Se creará la asignación a la actividad y, si el postulante no es miembro, también la membresía del proyecto.";
      }
      return "Se creará una membresía activa del proyecto y la postulación pasará a Aceptada.";
    },
    avisoCupo() {
      if (!this.esAceptar) return "";
      if (Number(this.postulacion?.faltantes) !== 1) return "";
      return "Al aceptar se completará el cupo y se rechazarán automáticamente las demás postulaciones pendientes de este requerimiento.";
    },
    confirmarDeshabilitado() {
      return (
        this.enviando ||
        (this.esActividad && this.cargandoActividad) ||
        (this.esAceptar &&
          this.esActividad &&
          this.disponibilidad?.disponible === false)
      );
    },
  },
  methods: {
    etiquetaEstadoPostulacion,
    etiquetaTipoPostulacion,
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
  },
};
</script>

<style scoped>
.gestion-postulacion-modal__titulo {
  margin: 0;
}

.gestion-postulacion-modal__intro {
  margin: 0.25rem 0 0.9rem;
  color: var(--color-text);
  font-size: 0.95rem;
  line-height: 1.5;
}

.gestion-postulacion-modal__detalle {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin: 0 0 0.85rem;
  padding: 0.9rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface-muted);
}

.gestion-postulacion-modal__fila {
  display: grid;
  grid-template-columns: 7.5rem 1fr;
  gap: 0.75rem;
  align-items: baseline;
}

.gestion-postulacion-modal__fila dt {
  color: var(--color-text-muted);
  font-size: 0.76rem;
  font-weight: 600;
}

.gestion-postulacion-modal__fila dd {
  margin: 0;
  color: var(--color-text);
  font-size: 0.88rem;
  line-height: 1.45;
}

.gestion-postulacion-modal__chip {
  display: inline-block;
  margin-left: 0.35rem;
  padding: 0.1rem 0.45rem;
  border: 1px solid var(--color-success-border);
  border-radius: 999px;
  background: var(--color-success-soft);
  color: var(--color-success-text);
  font-size: 0.7rem;
  font-weight: 600;
}

.gestion-postulacion-modal__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin: 0 0 0.85rem;
}

.gestion-postulacion-modal__chip-cpm {
  display: inline-block;
  padding: 0.12rem 0.5rem;
  border: 1px solid var(--color-info-border);
  border-radius: 999px;
  background: var(--color-info-soft);
  color: var(--color-info-text);
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
}

.gestion-postulacion-modal__subtitulo {
  margin: 0 0 0.5rem;
  color: var(--color-text);
  font-size: 0.9rem;
  font-weight: 700;
}

.gestion-postulacion-modal__nota {
  margin: 0.6rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.8rem;
  line-height: 1.5;
}

.gestion-postulacion-modal__aviso {
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

.gestion-postulacion-modal__aviso .material-symbols-outlined {
  font-size: 1rem;
}

.gestion-postulacion-modal__alerta {
  margin-top: 0.85rem !important;
}

.gestion-postulacion-modal__acciones {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
  width: 100%;
}
</style>
