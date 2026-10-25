<template>
  <VaModal
    :model-value="modelValue"
    hide-default-actions
    blur
    size="medium"
    class="eliminar-actividad-modal"
    @update:model-value="onCambioVisibilidad"
  >
    <template #header>
      <h3 class="va-h5 eliminar-actividad-modal__titulo">Eliminar actividad</h3>
    </template>

    <p class="eliminar-actividad-modal__intro">
      Se eliminará la actividad
      <strong>{{ actividad.nombre }}</strong> y se recalculará el cronograma.
    </p>

    <BaseAlert
      v-if="error"
      :message="error"
      type="error"
      class="eliminar-actividad-modal__alerta"
    />

    <div class="eliminar-actividad-modal__contenido">
      <div class="eliminar-actividad-modal__ficha">
        <p><strong>Descripción:</strong> {{ actividad.descripcion || "-" }}</p>
        <p><strong>Fechas:</strong> {{ formatearFechaCorta(actividad.fechaHoraInicio) }} - {{ formatearFechaCorta(actividad.fechaHoraFin) }}</p>
        <p><strong>Estado:</strong> {{ etiquetaEstadoActividad(actividad.estado) }}</p>
        <p><strong>Requerimientos:</strong>
          {{ actividad.requerimientos.length > 0
            ? actividad.requerimientos.map(r => `${r.nombreProfesion}: ${r.cantidad}`).join(", ")
            : "Ninguno" }}
        </p>
        <p v-if="actividad.profesionalesAsignados">
          <strong>Profesionales asignados:</strong>
          {{ actividad.profesionalesAsignados.map(p => `${p.nombreArtistico} (${p.nombreProfesion})`).join(", ") || "Ninguno" }}
        </p>
      </div>

      <div class="eliminar-actividad-modal__advertencias">
        <p><strong>Advertencias:</strong></p>
        <ul>
          <li>La actividad se eliminará físicamente de la planificación.</li>
          <li>Las predecesoras se conectarán directamente con sus sucesoras.</li>
          <li>El cronograma se recalcula (puede cambiar a estado ALERTA_DESBORDE).</li>
          <li>Las asignaciones de la actividad se eliminarán, pero los miembros permanecerán en el proyecto.</li>
          <li>Las postulaciones e invitaciones vinculadas a los requerimientos se eliminarán y se notificará a los afectados.</li>
          <li>Se generarán notificaciones con el motivo de la eliminación.</li>
        </ul>
      </div>
    </div>

    <div class="eliminar-actividad-modal__form">
<VaTextarea
      v-model="motivo"
      label="Motivo de la eliminación"
      placeholder="Motivo de la eliminación"
      :max-length="LIMITE_MOTIVO"
      counter
      :rows="3"
      :disabled="eliminando"
    >
    </VaTextarea>
    </div>

    <template #footer>
      <div class="eliminar-actividad-modal__acciones">
        <VaButton
          preset="secondary"
          :disabled="eliminando || !puedeConfirmar"
          @click="cerrar"
        >
          Volver
        </VaButton>
        <VaButton
          color="danger"
          :loading="eliminando"
          :disabled="!puedeConfirmar"
          @click="confirmar"
        >
          Eliminar
        </VaButton>
      </div>
    </template>
  </VaModal>
</template>

<script>
/*
 * Confirmación de eliminación de actividad (UC-51, ficha técnica §2.2-2.3).
 * Exige motivo obligatorio (máx. 200 chars). Al confirmar, envía DELETE
 * y emite "confirmar" con el motivo. Los errores 400 mantienen el modal
 * abierto. Los 403/404 cierran y refrescan la planificación.
 */
import BaseAlert from "../AlertaBase.vue";

const LIMITE_MOTIVO = 200;

export default {
  name: "ModalEliminarActividad",
  components: { BaseAlert },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    actividad: {
      type: Object,
      default: () => ({
        idActividad: 0,
        idProyecto: 0,
        nombre: "",
        descripcion: "",
        fechaHoraInicio: "",
        fechaHoraFin: "",
        estado: "",
        requerimientos: [],
        profesionalesAsignados: [],
      }),
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
  data() {
    return {
      LIMITE_MOTIVO,
      motivo: "",
    };
  },
  computed: {
    puedeConfirmar() {
      const motivo = this.motivo.trim();
      return (
        !this.eliminando &&
        !!motivo &&
        motivo.length <= LIMITE_MOTIVO &&
        !this.error
      );
    },
  },
  watch: {
    modelValue(visible) {
      if (!visible) this.limpiar();
    },
  },
  methods: {
    onCambioVisibilidad(valor) {
      if (this.eliminando && !valor) return;
      this.$emit("update:modelValue", valor);
    },
    limpiar() {
      this.motivo = "";
      this.error = "";
    },
    cerrar() {
      if (this.eliminando) return;
      this.$emit("update:modelValue", false);
    },
    async confirmar() {
      if (!this.puedeConfirmar) return;
      this.error = "";
      this.eliminando = true;
      try {
        this.$emit("confirmar", {
          idProyecto: this.actividad.idProyecto,
          idActividad: this.actividad.idActividad,
          motivo: this.motivo.trim(),
        });
      } catch (err) {
        this.eliminando = false;
        if (err.response) {
          const status = err.response.status;
          if (status === 400) {
            this.error = "Motivo vacío o inválido";
          } else if (status === 403) {
            this.error = "Sin permiso para eliminar la actividad";
            this.$emit("update:modelValue", false);
          } else if (status === 404) {
            this.error = "Proyecto o actividad no encontrados";
            this.$emit("update:modelValue", false);
          } else if (status === 409) {
            this.error = err.response.data?.message || "No se puede eliminar la actividad";
            this.$emit("update:modelValue", false);
          } else {
            this.error = "Error inesperado";
            this.$emit("update:modelValue", false);
          }
        } else {
          this.error = "Error de conexión";
          this.$emit("update:modelValue", false);
        }
      }
    },
  },
};
</script>
