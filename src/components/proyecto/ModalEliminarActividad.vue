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
      <strong>{{ actividadVista.nombre }}</strong> y se recalculará el cronograma.
    </p>

    <BaseAlert
      v-if="error"
      :message="error"
      type="error"
      class="eliminar-actividad-modal__alerta"
    />

    <div class="eliminar-actividad-modal__contenido">
      <div class="eliminar-actividad-modal__ficha">
        <p><strong>Descripción:</strong> {{ actividadVista.descripcion || "-" }}</p>
        <p><strong>Fechas:</strong> {{ formatearFechaCorta(actividadVista.fechaHoraInicio) }} - {{ formatearFechaCorta(actividadVista.fechaHoraFin) }}</p>
        <p><strong>Estado:</strong> {{ etiquetaEstadoActividad(actividadVista.estado) }}</p>
        <p><strong>Requerimientos:</strong>
          {{ actividadVista.requerimientos.length > 0
            ? actividadVista.requerimientos.map(r => `${r.nombreProfesion}: ${r.cantidad}`).join(", ")
            : "Ninguno" }}
        </p>
        <p v-if="actividadVista.profesionalesAsignados.length">
          <strong>Profesionales asignados:</strong>
          {{ actividadVista.profesionalesAsignados.map(p => `${p.nombreArtistico} (${p.nombreProfesion})`).join(", ") }}
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
 * Exige motivo obligatorio (máx. 200 chars). Al confirmar, emite "confirmar"
 * con idProyecto/idActividad/motivo; el padre ejecuta el DELETE y maneja los
 * errores. El modal se mantiene abierto ante errores corregibles (400/5xx).
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
  emits: ["update:modelValue", "confirmar", "limpiar-error"],
  data() {
    return {
      LIMITE_MOTIVO,
      motivo: "",
    };
  },
  computed: {
    /**
     * El listado de Planificación entrega un objeto liviano sin `requerimientos`
     * ni `profesionalesAsignados`. Normalizamos acá para que el modal siempre
     * pueda renderizarse aunque el detalle no se haya podido cargar.
     */
    actividadVista() {
      const actividad = this.actividad || {};
      return {
        ...actividad,
        requerimientos: Array.isArray(actividad.requerimientos)
          ? actividad.requerimientos
          : [],
        profesionalesAsignados: Array.isArray(actividad.profesionalesAsignados)
          ? actividad.profesionalesAsignados
          : [],
      };
    },
    puedeConfirmar() {
      const motivo = this.motivo.trim();
      return (
        !this.eliminando &&
        !!motivo &&
        motivo.length <= LIMITE_MOTIVO
      );
    },
  },
  watch: {
    motivo() {
      // Al corregir el motivo se oculta el error anterior para permitir reintentar.
      if (this.error) this.$emit("limpiar-error");
    },
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
    },
    cerrar() {
      if (this.eliminando) return;
      this.$emit("update:modelValue", false);
    },
    confirmar() {
      if (!this.puedeConfirmar || this.eliminando) return;
      // El padre es quien ejecuta el DELETE y controla los errores; el modal
      // sólo emite la intención con las coordenadas que conoce.
      this.$emit("confirmar", {
        idProyecto: this.actividadVista.idProyecto,
        idActividad: this.actividadVista.idActividad,
        motivo: this.motivo.trim(),
      });
    },
  },
};
</script>
