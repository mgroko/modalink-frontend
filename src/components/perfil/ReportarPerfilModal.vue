<template>
  <VaModal
    :model-value="modelValue"
    hide-default-actions
    blur
    size="small"
    @update:model-value="onCambioVisibilidad"
  >
    <template #header>
      <h3 class="va-h5">Reportar perfil</h3>
    </template>

    <p class="reportar-modal__intro">
      Estás por reportar el perfil de
      <strong>{{ perfil?.nombreArtistico || "este usuario" }}</strong>.
      Tu denuncia será revisada por el equipo de moderación.
    </p>

    <BaseAlert
      v-if="mensajeError"
      :message="mensajeError"
      type="error"
      class="reportar-modal__alerta"
    />

    <VaForm ref="form" :immediate="false" class="reportar-modal__form">
      <VaSelect
        v-model="motivo"
        :options="opcionesMotivo"
        label="Motivo del reporte"
        placeholder="Elegí un motivo"
        value-by="value"
        text-by="text"
        :rules="[reglasPerfil.requerido]"
      />
      <VaTextarea
        v-model="detalle"
        label="Detalle (opcional)"
        placeholder="Contanos qué sucede..."
        :max-length="500"
        counter
        :rows="3"
      />
    </VaForm>

    <template #footer>
      <div class="reportar-modal__acciones">
        <VaButton preset="secondary" :disabled="enviando" @click="cerrar">
          Cancelar
        </VaButton>
        <VaButton color="danger" :loading="enviando" @click="enviar">
          Enviar reporte
        </VaButton>
      </div>
    </template>
  </VaModal>
</template>

<script>
import reporteService from "../../services/reporteService";
import BaseAlert from "../AlertaBase.vue";
import { reglasPerfil } from "../../utils/reglas.js";
import { mensajeErrorApi } from "../../utils/apiError";

export default {
  name: "ReportarPerfilModal",
  components: { BaseAlert },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    perfil: {
      type: Object,
      default: null,
    },
  },
  emits: ["update:modelValue", "reportado"],
  data() {
    return {
      motivo: null,
      detalle: "",
      enviando: false,
      mensajeError: "",
      reglasPerfil,
      opcionesMotivo: [
        { text: "Spam o publicidad engañosa", value: "SPAM" },
        { text: "Contenido ofensivo o inapropiado", value: "CONTENIDO_OFENSIVO" },
        { text: "Suplantación de identidad", value: "SUPLANTACION" },
        { text: "Perfil falso o fraudulento", value: "PERFIL_FALSO" },
        { text: "Otro", value: "OTRO" },
      ],
    };
  },
  methods: {
    onCambioVisibilidad(valor) {
      if (!valor && this.enviando) return;
      this.$emit("update:modelValue", valor);
      if (!valor) this.limpiar();
    },
    cerrar() {
      if (this.enviando) return;
      this.$emit("update:modelValue", false);
      this.limpiar();
    },
    limpiar() {
      this.motivo = null;
      this.detalle = "";
      this.mensajeError = "";
    },
    async enviar() {
      if (this.enviando) return;
      const validado = await this.$refs.form.validate();
      if (!validado) return;

      this.enviando = true;
      this.mensajeError = "";
      try {
        await reporteService.reportar(this.perfil?.idPerfil, {
          categoria: this.motivo,
          detalle: this.detalle.trim() || null,
        });
        this.$emit("reportado");
        this.$emit("update:modelValue", false);
        this.limpiar();
      } catch (error) {
        this.mensajeError = mensajeErrorApi(
          error,
          "No se pudo enviar el reporte. Intentá nuevamente."
        );
      } finally {
        this.enviando = false;
      }
    },
  },
};
</script>

<style scoped>
.reportar-modal__intro {
  margin: 0 0 1rem;
  color: var(--color-text);
  font-size: 0.9rem;
  line-height: 1.5;
}

.reportar-modal__alerta {
  margin-top: 0 !important;
  margin-bottom: 1rem;
}

.reportar-modal__form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.reportar-modal__acciones {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  width: 100%;
}
</style>
