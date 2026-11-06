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
        v-model="descripcion"
        label="Descripción"
        placeholder="Contanos qué sucede..."
        :max-length="limiteDescripcion"
        counter
        :rows="4"
        :rules="descripcionReglas"
      />
      <p class="reportar-modal__ayuda">
        La descripción es obligatoria si elegís “Otro”. Máximo
        {{ limiteDescripcion }} caracteres.
      </p>
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
import {
  LIMITE_DESCRIPCION_REPORTE_PERFIL,
  MOTIVOS_REPORTE_PERFIL,
  OPCIONES_MOTIVO_REPORTE_PERFIL,
} from "../../utils/reportePerfilConstants.js";

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
      descripcion: "",
      enviando: false,
      mensajeError: "",
      reglasPerfil,
      opcionesMotivo: OPCIONES_MOTIVO_REPORTE_PERFIL,
      limiteDescripcion: LIMITE_DESCRIPCION_REPORTE_PERFIL,
    };
  },
  computed: {
    descripcionReglas() {
      return [
        reglasPerfil.max200,
        (valor) =>
          this.motivo !== MOTIVOS_REPORTE_PERFIL.OTRO ||
          String(valor || "").trim().length > 0 ||
          "Describí el motivo del reporte.",
      ];
    },
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
      this.descripcion = "";
      this.mensajeError = "";
    },
    async enviar() {
      if (this.enviando) return;
      const validado = await this.$refs.form.validate();
      if (!validado) return;
      if (this.perfil?.idPerfil == null) {
        this.mensajeError = "No se pudo identificar el perfil a reportar.";
        return;
      }

      this.enviando = true;
      this.mensajeError = "";
      try {
        await reporteService.reportar(this.perfil.idPerfil, {
          motivo: this.motivo,
          descripcion: this.descripcion,
        });
        this.$emit("reportado");
        this.$emit("update:modelValue", false);
        this.limpiar();
      } catch (error) {
        this.mensajeError = this.mensajeDeError(error);
      } finally {
        this.enviando = false;
      }
    },
    mensajeDeError(error) {
      const status = error?.response?.status;
      const mensaje = error?.response?.data?.message || "";

      if (status === 400) {
        return mensaje || "Revisá el motivo y la descripción del reporte.";
      }
      if (status === 403) {
        return (
          mensaje || "No podés reportar perfiles como administrador."
        );
      }
      if (status === 404) {
        return (
          mensaje ||
          "El perfil ya no está disponible o no tenés un perfil activo."
        );
      }
      if (status === 409) {
        return (
          mensaje ||
          "Ya existe un reporte pendiente para este perfil o no podés reportarte a vos mismo."
        );
      }
      return mensajeErrorApi(
        error,
        "No se pudo enviar el reporte. Intentá nuevamente."
      );
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

.reportar-modal__ayuda {
  margin: -0.25rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  line-height: 1.4;
}

.reportar-modal__acciones {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  width: 100%;
}
</style>
