<template>
  <div class="aceptacion-tyc">
    <div class="aceptacion-tyc__cabecera">
      <span class="aceptacion-tyc__titulo">
        Términos y condiciones de {{ nombrePerfil || "este perfil" }}
      </span>
      <span
        v-if="terminos && !cargando && !error && !esPlantilla"
        class="aceptacion-tyc__badge"
      >
        {{ vigencia }}
      </span>
    </div>

    <div v-if="cargando" class="aceptacion-tyc__estado" aria-live="polite">
      <span class="material-symbols-outlined" aria-hidden="true">
        hourglass_empty
      </span>
      Cargando términos y condiciones...
    </div>

    <div v-else-if="error" class="aceptacion-tyc__error">
      <BaseAlert :message="error" type="error" />
      <VaButton
        size="small"
        preset="secondary"
        icon="mso-refresh"
        :disabled="deshabilitado"
        @click="cargar"
      >
        Reintentar
      </VaButton>
    </div>

    <template v-else-if="terminos">
      <div v-if="esPlantilla" class="aceptacion-tyc__sin-version" role="status">
        <span class="material-symbols-outlined" aria-hidden="true">info</span>
        <span>
          Este perfil no tiene términos y condiciones configurados aún. No se
          requiere aceptación.
        </span>
      </div>

      <template v-else>
        <div class="aceptacion-tyc__texto" tabindex="0">
          <p>{{ terminos.descripcion }}</p>
        </div>

        <label class="aceptacion-tyc__check">
          <VaCheckbox
            :model-value="acepta"
            :disabled="deshabilitado"
            @update:model-value="onAcepta"
          />
          <span>
            Acepto los términos y condiciones de
            <strong>{{ nombrePerfil || "este perfil" }}</strong>.
          </span>
        </label>
      </template>
    </template>
  </div>
</template>

<script>
import BaseAlert from "../AlertaBase.vue";
import perfilService from "../../services/perfilService";
import { mensajeErrorApi } from "../../utils/apiError";
import {
  esTerminosPlantilla,
  normalizarTerminos,
  textoVigenciaTerminos,
} from "../../utils/terminosCondiciones.js";

/*
 * UC-31 / UC-34 / UC-38 bis: muestra la versión vigente del perfil y exige
 * aceptación al director. Si el perfil no tiene T&C, no muestra checkbox y
 * emite null (el llamador decide si incluye { idTyc: null, acepta: false }).
 */
export default {
  name: "AceptacionTerminosPerfil",
  components: { BaseAlert },
  props: {
    idPerfil: {
      type: [Number, String],
      required: true,
    },
    nombrePerfil: {
      type: String,
      default: "",
    },
    modelValue: {
      type: Object,
      default: null,
    },
    deshabilitado: {
      type: Boolean,
      default: false,
    },
    /**
     * Versión vigente devuelta por un 409 (idTycVigente/descripcionVigente)
     * o un TerminosCondicionesResponse completo.
     */
    terminosVigentes: {
      type: Object,
      default: null,
    },
    tokenRefresco: {
      type: Number,
      default: 0,
    },
  },
  emits: ["update:modelValue", "estado"],
  data() {
    return {
      terminos: null,
      cargando: false,
      error: "",
      corrida: 0,
    };
  },
  computed: {
    esPlantilla() {
      return esTerminosPlantilla(this.terminos);
    },
    tieneVersion() {
      return !this.esPlantilla && this.terminos?.idTyc != null;
    },
    acepta() {
      return (
        this.tieneVersion &&
        Number(this.modelValue?.idTyc) === Number(this.terminos?.idTyc) &&
        this.modelValue?.aceptaTerminos === true
      );
    },
    vigencia() {
      return textoVigenciaTerminos(this.terminos);
    },
  },
  watch: {
    idPerfil() {
      this.cargar();
    },
    tokenRefresco() {
      this.cargar();
    },
    terminosVigentes(valor) {
      if (!valor) return;
      this.aplicarTerminosVigentes(valor);
    },
  },
  beforeMount() {
    this.controlador = null;
  },
  mounted() {
    if (this.terminosVigentes) {
      this.aplicarTerminosVigentes(this.terminosVigentes);
    } else {
      this.cargar();
    }
  },
  beforeUnmount() {
    this.abortar();
  },
  methods: {
    abortar() {
      if (this.controlador) {
        this.controlador.abort();
        this.controlador = null;
      }
    },
    esCancelacion(error) {
      return error?.name === "CanceledError" || error?.code === "ERR_CANCELED";
    },
    emitirEstado(extra = {}) {
      const listo = this.cargando
        ? false
        : this.tieneVersion
          ? this.acepta
          : !this.error;

      this.$emit("estado", {
        idPerfil: Number(this.idPerfil),
        cargando: this.cargando,
        error: this.error,
        requiereAceptacion: this.tieneVersion,
        listo,
        esPlantilla: this.esPlantilla,
        idTyc: this.terminos?.idTyc ?? null,
        ...extra,
      });
    },
    aplicarTerminos(data, { resetear = true } = {}) {
      const normalizados = normalizarTerminos({
        idPerfil: this.idPerfil,
        ...data,
      });
      this.terminos = normalizados;
      this.error = "";
      this.cargando = false;

      const plantilla = esTerminosPlantilla(normalizados);

      if (resetear) {
        if (plantilla) {
          this.$emit("update:modelValue", null);
        } else {
          this.$emit("update:modelValue", {
            idTyc: normalizados.idTyc,
            aceptaTerminos: false,
          });
        }
      }

      this.emitirEstado({
        requiereAceptacion: !plantilla,
        listo: plantilla,
        esPlantilla: plantilla,
        idTyc: normalizados.idTyc,
      });
    },
    aplicarTerminosVigentes(datos) {
      this.abortar();
      const idTyc =
        datos?.idTyc ?? datos?.idTycVigente ?? datos?.terminosCondiciones?.idTyc;
      const descripcion =
        datos?.descripcion ??
        datos?.descripcionVigente ??
        datos?.terminosCondiciones?.descripcion ??
        "";
      const esPlantilla =
        datos?.esPlantilla === true ||
        datos?.terminosCondiciones?.esPlantilla === true ||
        idTyc == null;

      this.aplicarTerminos({
        idPerfil: this.idPerfil,
        idTyc: idTyc == null ? null : Number(idTyc),
        descripcion,
        fechaInicio: datos?.fechaInicio ?? null,
        fechaFin: datos?.fechaFin ?? null,
        esPlantilla,
      });
    },
    async cargar() {
      if (this.idPerfil == null || this.idPerfil === "") return;

      const corrida = ++this.corrida;
      this.abortar();
      this.controlador = new AbortController();
      this.cargando = true;
      this.error = "";
      this.emitirEstado();

      try {
        const response = await perfilService.obtenerTerminos(
          this.idPerfil,
          this.controlador.signal
        );
        if (corrida !== this.corrida) return;
        this.aplicarTerminos(response?.data);
      } catch (error) {
        if (this.esCancelacion(error) || corrida !== this.corrida) return;
        this.cargando = false;
        this.error = mensajeErrorApi(
          error,
          "No se pudieron cargar los términos y condiciones."
        );
        this.$emit("update:modelValue", null);
        this.emitirEstado();
      }
    },
    onAcepta(valor) {
      if (!this.tieneVersion) return;
      this.$emit("update:modelValue", {
        idTyc: this.terminos.idTyc,
        aceptaTerminos: valor === true,
      });
      this.$nextTick(() => this.emitirEstado());
    },
  },
};
</script>

<style scoped>
.aceptacion-tyc {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  padding: 0.9rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface-muted);
}

.aceptacion-tyc__cabecera {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.aceptacion-tyc__titulo {
  color: var(--color-text);
  font-size: 0.84rem;
  font-weight: 700;
}

.aceptacion-tyc__badge {
  display: inline-flex;
  align-items: center;
  padding: 0.14rem 0.55rem;
  border: 1px solid var(--color-success-border);
  border-radius: 999px;
  background: var(--color-success-soft);
  color: var(--color-success-text);
  font-size: 0.68rem;
  font-weight: 600;
  line-height: 1.35;
}

.aceptacion-tyc__estado {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.aceptacion-tyc__error {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
}

.aceptacion-tyc__sin-version {
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
  color: var(--color-info-text);
  font-size: 0.8rem;
  line-height: 1.45;
}

.aceptacion-tyc__sin-version .material-symbols-outlined {
  flex-shrink: 0;
  font-size: 1rem;
}

.aceptacion-tyc__texto {
  max-height: 10rem;
  overflow-y: auto;
  padding: 0.7rem 0.8rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
}

.aceptacion-tyc__texto:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.aceptacion-tyc__texto p {
  margin: 0;
  color: var(--color-text);
  font-size: 0.82rem;
  line-height: 1.55;
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.aceptacion-tyc__check {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  color: var(--color-text);
  font-size: 0.82rem;
  line-height: 1.45;
  cursor: pointer;
}

.aceptacion-tyc__check :deep(.va-checkbox) {
  flex-shrink: 0;
}
</style>
