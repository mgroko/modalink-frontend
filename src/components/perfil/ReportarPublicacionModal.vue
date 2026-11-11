<template>
  <VaModal
    :model-value="modelValue"
    hide-default-actions
    blur
    size="small"
    @update:model-value="onCambioVisibilidad"
  >
    <template #header>
      <h3 class="va-h5">Reportar publicación</h3>
    </template>

    <div class="reportar-publicacion__resumen">
      <span class="reportar-publicacion__miniatura">
        <img
          v-if="portada"
          :src="portada"
          :alt="publicacion?.titulo || 'Publicación'"
        />
        <span v-else class="material-symbols-outlined" aria-hidden="true">
          image
        </span>
      </span>
      <span class="reportar-publicacion__datos">
        <strong>{{ publicacion?.titulo || "Publicación" }}</strong>
        <small>{{ nombreAutor }}</small>
      </span>
    </div>

    <p class="reportar-publicacion__intro">
      Tu reporte será revisado por el equipo de moderación.
    </p>

    <BaseAlert
      v-if="mensajeError"
      :message="mensajeError"
      type="error"
      class="reportar-publicacion__alerta"
    />

    <VaForm ref="form" :immediate="false" class="reportar-publicacion__form">
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
      <p class="reportar-publicacion__ayuda">
        La descripción es obligatoria si elegís “Otro”. Máximo
        {{ limiteDescripcion }} caracteres.
      </p>
    </VaForm>

    <template #footer>
      <div class="reportar-publicacion__acciones">
        <VaButton preset="secondary" :disabled="enviando" @click="cerrar">
          Cancelar
        </VaButton>
        <VaButton
          color="danger"
          :loading="enviando"
          :disabled="!puedeEnviar || enviando"
          @click="enviar"
        >
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
import { resolverFotoUrl } from "../../utils/fotos.js";
import {
  LIMITE_DESCRIPCION_REPORTE_PUBLICACION,
  MOTIVOS_REPORTE_PUBLICACION,
  OPCIONES_MOTIVO_REPORTE_PUBLICACION,
  requiereDescripcionReportePublicacion,
} from "../../utils/reportePublicacionConstants.js";

export default {
  name: "ReportarPublicacionModal",
  components: { BaseAlert },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    publicacion: {
      type: Object,
      default: null,
    },
  },
  emits: ["update:modelValue", "reportado", "no-disponible"],
  data() {
    return {
      motivo: null,
      descripcion: "",
      enviando: false,
      mensajeError: "",
      reglasPerfil,
      opcionesMotivo: OPCIONES_MOTIVO_REPORTE_PUBLICACION,
      limiteDescripcion: LIMITE_DESCRIPCION_REPORTE_PUBLICACION,
    };
  },
  computed: {
    portada() {
      const imagenes = Array.isArray(this.publicacion?.imagenes)
        ? this.publicacion.imagenes
        : [];
      return resolverFotoUrl(imagenes[0]?.url);
    },
    nombreAutor() {
      return (
        this.publicacion?.autor?.nombreArtistico ||
        this.publicacion?.autor?.nombre ||
        "Perfil"
      );
    },
    descripcionReglas() {
      return [
        reglasPerfil.max200,
        (valor) =>
          !requiereDescripcionReportePublicacion(this.motivo) ||
          String(valor || "").trim().length > 0 ||
          "Describí el motivo del reporte.",
      ];
    },
    puedeEnviar() {
      if (!this.motivo) return false;
      const texto = String(this.descripcion || "").trim();
      if (
        requiereDescripcionReportePublicacion(this.motivo) &&
        texto.length === 0
      ) {
        return false;
      }
      return texto.length <= LIMITE_DESCRIPCION_REPORTE_PUBLICACION;
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
      this.$nextTick(() => this.$refs.form?.resetValidation?.());
    },
    async enviar() {
      if (this.enviando) return;
      const validado = await this.$refs.form.validate();
      if (!validado) return;
      if (this.publicacion?.idPublicacion == null) {
        this.mensajeError = "No se pudo identificar la publicación a reportar.";
        return;
      }

      this.enviando = true;
      this.mensajeError = "";
      try {
        await reporteService.reportarPublicacion(
          this.publicacion.idPublicacion,
          {
            motivo: this.motivo,
            descripcion: this.descripcion,
          }
        );
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
      const errores = error?.response?.data?.errores;

      if (status === 400) {
        return (
          errores?.motivo ||
          errores?.descripcion ||
          mensaje ||
          "Revisá el motivo y la descripción del reporte."
        );
      }
      if (status === 403) {
        return (
          mensaje || "No tenés permiso para acceder a este recurso."
        );
      }
      if (status === 404) {
        if (/perfil activo|perfil.*sesi[oó]n/i.test(mensaje)) {
          return "No hay un perfil activo seleccionado en la sesión.";
        }
        this.$emit("no-disponible");
        return mensaje || "La publicación ya no está disponible.";
      }
      if (status === 409) {
        if (/propia/i.test(mensaje)) {
          return mensaje || "No podés reportar una publicación propia.";
        }
        return (
          mensaje ||
          "Ya existe un reporte pendiente de este perfil contra la misma publicación."
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
.reportar-publicacion__resumen {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.85rem;
  padding: 0.6rem;
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border-soft);
  border-radius: 9px;
}

.reportar-publicacion__miniatura {
  display: grid;
  width: 3.1rem;
  height: 3.1rem;
  flex: 0 0 3.1rem;
  place-items: center;
  overflow: hidden;
  color: var(--color-text-subtle);
  background: var(--color-surface);
  border-radius: 8px;
}

.reportar-publicacion__miniatura img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.reportar-publicacion__datos {
  display: grid;
  gap: 0.15rem;
  min-width: 0;
}

.reportar-publicacion__datos strong {
  overflow: hidden;
  color: var(--color-text);
  font-size: 0.88rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reportar-publicacion__datos small {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}

.reportar-publicacion__intro {
  margin: 0 0 1rem;
  color: var(--color-text);
  font-size: 0.9rem;
  line-height: 1.5;
}

.reportar-publicacion__alerta {
  margin-top: 0 !important;
  margin-bottom: 1rem;
}

.reportar-publicacion__form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.reportar-publicacion__ayuda {
  margin: -0.25rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  line-height: 1.4;
}

.reportar-publicacion__acciones {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  width: 100%;
}
</style>
