<template>
  <VaModal
    :model-value="modelValue"
    hide-default-actions
    size="medium"
    blur
    class="tyc-historial-modal"
    @update:model-value="onCambioVisibilidad"
  >
    <template #header>
      <h3 class="va-h5 tyc-historial-modal__titulo">
        Historial de términos y condiciones
      </h3>
    </template>

    <div v-if="vista === 'lista'" class="tyc-historial-modal__contenido">
      <p class="tyc-historial-modal__intro">
        Versiones guardadas del perfil. La versión vigente aparece marcada
        como tal; los cambios sin guardar no forman parte del historial.
      </p>

      <BaseAlert v-if="error" :message="error" type="error" />

      <div
        v-if="error && puedeReintentar"
        class="tyc-historial-modal__reintento"
      >
        <VaButton preset="secondary" size="small" @click="cargarHistorial">
          Reintentar
        </VaButton>
      </div>

      <p v-if="cargando" class="tyc-historial-modal__estado">
        Cargando historial...
      </p>

      <p
        v-else-if="!error && !versiones.length"
        class="tyc-historial-modal__vacio"
      >
        No hay versiones registradas. El perfil usa la plantilla base del
        sistema.
      </p>

      <ul v-else-if="!error" class="tyc-historial-modal__lista">
        <li
          v-for="version in versiones"
          :key="version.idTyc"
          class="tyc-historial-modal__version"
        >
          <div class="tyc-historial-modal__version-info">
            <div class="tyc-historial-modal__version-titulo">
              <span>Versión {{ version.numeroVersion ?? '—' }}</span>
              <span
                v-if="version.vigente"
                class="tyc-historial-modal__badge"
              >
                Vigente
              </span>
            </div>
            <p class="tyc-historial-modal__fechas">
              {{ textoFechas(version) }}
            </p>
          </div>

          <VaButton
            preset="secondary"
            size="small"
            @click="verTexto(version)"
          >
            Ver texto
          </VaButton>
        </li>
      </ul>
    </div>

    <div v-else class="tyc-historial-modal__contenido">
      <div class="tyc-historial-modal__detalle-cabecera">
        <div>
          <div class="tyc-historial-modal__version-titulo">
            <span>Versión {{ versionActiva?.numeroVersion ?? '—' }}</span>
            <span
              v-if="versionActiva?.vigente"
              class="tyc-historial-modal__badge"
            >
              Vigente
            </span>
          </div>
          <p class="tyc-historial-modal__fechas">
            {{ textoFechas(versionActiva) }}
          </p>
        </div>

        <VaButton preset="secondary" size="small" @click="volverLista">
          Volver
        </VaButton>
      </div>

      <p v-if="cargandoTexto" class="tyc-historial-modal__estado">
        Cargando texto...
      </p>

      <BaseAlert v-if="errorTexto" :message="errorTexto" type="error" />

      <div
        v-else-if="textoVersion"
        class="tyc-historial-modal__texto"
      >
        {{ textoVersion }}
      </div>
    </div>

    <template #footer>
      <div class="tyc-historial-modal__acciones">
        <VaButton preset="secondary" @click="cerrar">Cerrar</VaButton>
      </div>
    </template>
  </VaModal>
</template>

<script>
import BaseAlert from "../AlertaBase.vue";
import perfilService from "../../services/perfilService.js";
import adminService from "../../services/adminService.js";
import { formatearFechaCorta } from "../../utils/fechas.js";
import { mensajeErrorApi } from "../../utils/apiError.js";

/*
 * Historial versionado de T&C de un perfil.
 *
 * `modo = "usuario"` usa los endpoints visibles para el dueño o terceros con
 * acceso al perfil. `modo = "admin"` usa los endpoints administrativos.
 * La lista sólo trae metadatos; el texto se carga al presionar "Ver texto".
 */
export default {
  name: "TerminosCondicionesHistorialModal",
  components: { BaseAlert },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    idPerfil: {
      type: [Number, String],
      default: null,
    },
    modo: {
      type: String,
      default: "usuario",
    },
  },
  emits: ["update:modelValue"],
  data() {
    return {
      versiones: [],
      cargando: false,
      error: "",
      puedeReintentar: false,
      vista: "lista",
      versionActiva: null,
      textoVersion: "",
      cargandoTexto: false,
      errorTexto: "",
      textosPorVersion: {},
      idCarga: 0,
      idCargaTexto: 0,
    };
  },
  watch: {
    modelValue(visible) {
      if (visible) {
        this.reiniciar();
        this.cargarHistorial();
        return;
      }
      this.abortar();
    },
    idPerfil() {
      if (this.modelValue) {
        this.reiniciar();
        this.cargarHistorial();
      }
    },
  },
  beforeMount() {
    this.controladorHistorial = null;
    this.controladorTexto = null;
  },
  beforeUnmount() {
    this.abortar();
  },
  methods: {
    abortar() {
      if (this.controladorHistorial) {
        this.controladorHistorial.abort();
        this.controladorHistorial = null;
      }
      if (this.controladorTexto) {
        this.controladorTexto.abort();
        this.controladorTexto = null;
      }
    },
    esCancelacion(error) {
      return (
        error?.code === "ERR_CANCELED" ||
        error?.name === "CanceledError" ||
        error?.name === "AbortError"
      );
    },
    reiniciar() {
      this.versiones = [];
      this.cargando = false;
      this.error = "";
      this.puedeReintentar = false;
      this.vista = "lista";
      this.versionActiva = null;
      this.textoVersion = "";
      this.cargandoTexto = false;
      this.errorTexto = "";
      this.textosPorVersion = {};
    },
    onCambioVisibilidad(valor) {
      this.$emit("update:modelValue", valor);
    },
    cerrar() {
      this.abortar();
      this.$emit("update:modelValue", false);
    },
    servicioHistorial() {
      return this.modo === "admin"
        ? adminService.obtenerHistorialTerminosPerfil
        : perfilService.obtenerHistorialTerminos;
    },
    servicioVersion() {
      return this.modo === "admin"
        ? adminService.obtenerVersionTerminosPerfil
        : perfilService.obtenerVersionTerminos;
    },
    async cargarHistorial() {
      if (this.idPerfil == null || this.idPerfil === "") return;

      const corrida = ++this.idCarga;
      if (this.controladorHistorial) this.controladorHistorial.abort();
      this.controladorHistorial = new AbortController();

      this.cargando = true;
      this.error = "";
      this.puedeReintentar = false;

      try {
        const response = await this.servicioHistorial()(
          this.idPerfil,
          this.controladorHistorial.signal
        );
        if (corrida !== this.idCarga) return;
        this.versiones = Array.isArray(response?.data) ? response.data : [];
      } catch (error) {
        if (this.esCancelacion(error) || corrida !== this.idCarga) return;
        this.manejarErrorHistorial(error);
      } finally {
        if (corrida === this.idCarga) this.cargando = false;
      }
    },
    manejarErrorHistorial(error) {
      const status = error?.response?.status;
      const mensaje = error?.response?.data?.message || "";
      this.versiones = [];
      this.error = "";
      this.puedeReintentar = false;

      if (status === 403) {
        this.error =
          mensaje || "No tenés acceso al historial de este perfil.";
        return;
      }
      if (status === 404) {
        this.error =
          mensaje || "El perfil o una de sus versiones ya no está disponible.";
        return;
      }
      if (!status || status >= 500) {
        this.puedeReintentar = true;
        this.error =
          "Ocurrió un error al cargar el historial. Inténtalo nuevamente.";
        return;
      }
      this.error = mensajeErrorApi(
        error,
        "No se pudo cargar el historial de términos y condiciones."
      );
    },
    textoFechas(version) {
      if (!version) return "";
      const inicio = version.fechaInicio
        ? `Desde ${formatearFechaCorta(version.fechaInicio)}`
        : "Sin fecha de inicio";
      if (version.vigente || !version.fechaFin) {
        return `${inicio} · Vigente`;
      }
      return `${inicio} · Hasta ${formatearFechaCorta(version.fechaFin)}`;
    },
    async verTexto(version) {
      if (!version?.idTyc) return;
      this.versionActiva = version;
      this.vista = "detalle";
      this.errorTexto = "";
      this.textoVersion = this.textosPorVersion[version.idTyc] || "";
      if (this.textoVersion) return;

      const corrida = ++this.idCargaTexto;
      if (this.controladorTexto) this.controladorTexto.abort();
      this.controladorTexto = new AbortController();

      this.cargandoTexto = true;
      try {
        const response = await this.servicioVersion()(
          this.idPerfil,
          version.idTyc,
          this.controladorTexto.signal
        );
        if (corrida !== this.idCargaTexto) return;
        const texto = String(response?.data?.descripcion ?? "");
        this.textoVersion = texto;
        this.textosPorVersion = {
          ...this.textosPorVersion,
          [version.idTyc]: texto,
        };
      } catch (error) {
        if (this.esCancelacion(error) || corrida !== this.idCargaTexto) return;
        this.errorTexto = mensajeErrorApi(
          error,
          "No se pudo cargar el texto de esta versión."
        );
      } finally {
        if (corrida === this.idCargaTexto) this.cargandoTexto = false;
      }
    },
    volverLista() {
      if (this.controladorTexto) {
        this.controladorTexto.abort();
        this.controladorTexto = null;
      }
      this.vista = "lista";
      this.versionActiva = null;
      this.textoVersion = "";
      this.errorTexto = "";
      this.cargandoTexto = false;
    },
  },
};
</script>

<style scoped>
.tyc-historial-modal__titulo {
  margin: 0;
}

.tyc-historial-modal__contenido {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.tyc-historial-modal__intro {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.84rem;
  line-height: 1.5;
}

.tyc-historial-modal__reintento {
  display: flex;
  justify-content: flex-start;
}

.tyc-historial-modal__estado,
.tyc-historial-modal__vacio {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.86rem;
  line-height: 1.5;
}

.tyc-historial-modal__lista {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  overflow: hidden;
}

.tyc-historial-modal__version {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 0.9rem;
  border-bottom: 1px solid var(--color-border-soft);
}

.tyc-historial-modal__version:last-child {
  border-bottom: 0;
}

.tyc-historial-modal__version-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.tyc-historial-modal__version-titulo {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.45rem;
  color: var(--color-text);
  font-size: 0.86rem;
  font-weight: 700;
}

.tyc-historial-modal__badge {
  padding: 0.08rem 0.45rem;
  border: 1px solid var(--color-success-border);
  border-radius: 999px;
  background: var(--color-success-soft);
  color: var(--color-success-text);
  font-size: 0.68rem;
  font-weight: 600;
}

.tyc-historial-modal__fechas {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.78rem;
  line-height: 1.4;
}

.tyc-historial-modal__detalle-cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.tyc-historial-modal__texto {
  max-height: 50vh;
  overflow-y: auto;
  padding: 0.85rem 0.95rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface-muted);
  color: var(--color-text);
  font-size: 0.86rem;
  line-height: 1.6;
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.tyc-historial-modal__acciones {
  display: flex;
  justify-content: flex-end;
  width: 100%;
}

@media (max-width: 640px) {
  .tyc-historial-modal__version,
  .tyc-historial-modal__detalle-cabecera {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
