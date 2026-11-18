<template>
  <section
    class="filtros-automaticas"
    aria-label="Filtros de colaboraciones automáticas"
  >
    <div class="filtros-automaticas__grilla">
      <VaSelect
        :model-value="filtros.idPerfilContraparte"
        class="filtros-automaticas__campo"
        placeholder="Buscar perfil de la contraparte"
        aria-label="Perfil de la contraparte"
        :options="opcionesPerfiles"
        value-by="idPerfil"
        text-by="nombreArtistico"
        :loading="cargandoPerfiles"
        clearable
        searchable
        :min-search-chars="0"
        no-options-text="No hay perfiles"
        @update:model-value="cambiarPerfil"
        @update:search="programarBusquedaPerfiles"
      >
        <template #prependInner>
          <span class="material-symbols-outlined filtros-automaticas__icono">
            search
          </span>
        </template>
      </VaSelect>

      <VaSelect
        :model-value="filtros.idPublicacion"
        class="filtros-automaticas__campo"
        placeholder="Buscar mi publicación"
        aria-label="Mi publicación"
        :options="opcionesPublicaciones"
        value-by="idPublicacion"
        text-by="titulo"
        :loading="cargandoPublicaciones"
        clearable
        searchable
        :min-search-chars="0"
        no-options-text="No hay publicaciones"
        @update:model-value="cambiarPublicacion"
        @update:search="programarBusquedaPublicaciones"
      >
        <template #prependInner>
          <span class="material-symbols-outlined filtros-automaticas__icono">
            photo_library
          </span>
        </template>
      </VaSelect>

      <div class="filtros-automaticas__fechas">
        <VaInput
          :model-value="filtros.fechaDesde"
          class="filtros-automaticas__fecha"
          type="date"
          aria-label="Fecha desde"
          :error="!!errorFechas"
          @update:model-value="cambiar('fechaDesde', $event)"
        />
        <span class="filtros-automaticas__separador" aria-hidden="true">
          —
        </span>
        <VaInput
          :model-value="filtros.fechaHasta"
          class="filtros-automaticas__fecha"
          type="date"
          aria-label="Fecha hasta"
          :error="!!errorFechas"
          @update:model-value="cambiar('fechaHasta', $event)"
        />
      </div>
    </div>

    <div class="filtros-automaticas__estados">
      <span class="filtros-automaticas__estado-label">Estado</span>

      <button
        v-for="opcion in opcionesEstado"
        :key="opcion.value"
        type="button"
        class="filtros-automaticas__chip"
        :class="{
          'filtros-automaticas__chip--activo':
            filtros.estado === opcion.value,
        }"
        :disabled="historial"
        @click="cambiar('estado', opcion.value)"
      >
        {{ opcion.text }}
      </button>

      <button
        type="button"
        class="filtros-automaticas__limpiar"
        @click="$emit('limpiar')"
      >
        Limpiar
      </button>
    </div>

    <p v-if="errorFechas" class="filtros-automaticas__error" role="alert">
      {{ errorFechas }}
    </p>
  </section>
</template>

<script>
import perfilService from "../../services/perfilService.js";
import publicacionService from "../../services/publicacionService.js";
import { idPerfilActivo } from "../../services/authState.js";
import {
  ESTADOS_COLABORACION_AUTOMATICA,
  ETIQUETAS_ESTADO_COLABORACION_AUTOMATICA,
} from "../../utils/colaboracionesAutomaticasConstants.js";

const TAMANO_OPCIONES = 20;
const DEBOUNCE_MS = 350;

function esCancelado(error) {
  return (
    error?.code === "ERR_CANCELED" ||
    error?.name === "CanceledError" ||
    error?.name === "AbortError"
  );
}

export default {
  name: "FiltrosColaboracionesAutomaticas",
  props: {
    filtros: {
      type: Object,
      required: true,
    },
    cargando: {
      type: Boolean,
      default: false,
    },
    errorFechas: {
      type: String,
      default: "",
    },
    historial: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["cambio", "limpiar"],
  data() {
    return {
      perfiles: [],
      perfilSeleccionado: null,
      busquedaPerfiles: "",
      cargandoPerfiles: false,
      controladorPerfiles: null,
      temporalizadorPerfiles: null,
      publicaciones: [],
      publicacionSeleccionada: null,
      busquedaPublicaciones: "",
      cargandoPublicaciones: false,
      controladorPublicaciones: null,
      temporalizadorPublicaciones: null,
    };
  },
  computed: {
    opcionesEstado() {
      return Object.values(ESTADOS_COLABORACION_AUTOMATICA).map((value) => ({
        value,
        text: ETIQUETAS_ESTADO_COLABORACION_AUTOMATICA[value],
      }));
    },
    opcionesPerfiles() {
      const idActual = this.filtros?.idPerfilContraparte;
      const lista = [...this.perfiles];

      if (
        idActual != null &&
        idActual !== "" &&
        !lista.some((perfil) => String(perfil.idPerfil) === String(idActual))
      ) {
        const seleccionado = this.perfilSeleccionado;
        if (
          seleccionado &&
          String(seleccionado.idPerfil) === String(idActual)
        ) {
          lista.unshift(seleccionado);
        }
      }

      return lista;
    },
    opcionesPublicaciones() {
      const idActual = this.filtros?.idPublicacion;
      const lista = [...this.publicaciones];

      if (
        idActual != null &&
        idActual !== "" &&
        !lista.some(
          (publicacion) =>
            String(publicacion.idPublicacion) === String(idActual)
        )
      ) {
        const seleccionada = this.publicacionSeleccionada;
        if (
          seleccionada &&
          String(seleccionada.idPublicacion) === String(idActual)
        ) {
          lista.unshift(seleccionada);
        }
      }

      return lista;
    },
  },
  watch: {
    "filtros.idPerfilContraparte"(valor) {
      if (valor == null || valor === "") {
        this.perfilSeleccionado = null;
        return;
      }
      const encontrado = this.perfiles.find(
        (perfil) => String(perfil.idPerfil) === String(valor)
      );
      if (encontrado) this.perfilSeleccionado = encontrado;
    },
    "filtros.idPublicacion"(valor) {
      if (valor == null || valor === "") {
        this.publicacionSeleccionada = null;
        return;
      }
      const encontrada = this.publicaciones.find(
        (publicacion) =>
          String(publicacion.idPublicacion) === String(valor)
      );
      if (encontrada) this.publicacionSeleccionada = encontrada;
    },
  },
  mounted() {
    this.buscarPerfiles("");
    this.buscarPublicaciones("");
  },
  beforeUnmount() {
    clearTimeout(this.temporalizadorPerfiles);
    clearTimeout(this.temporalizadorPublicaciones);
    this.abortarPerfiles();
    this.abortarPublicaciones();
  },
  methods: {
    cambiar(campo, valor) {
      this.$emit("cambio", { campo, valor });
    },
    cambiarPerfil(valor) {
      if (valor == null || valor === "") {
        this.perfilSeleccionado = null;
      } else {
        this.perfilSeleccionado =
          this.perfiles.find(
            (perfil) => String(perfil.idPerfil) === String(valor)
          ) || null;
      }
      this.cambiar("idPerfilContraparte", valor ?? null);
    },
    cambiarPublicacion(valor) {
      if (valor == null || valor === "") {
        this.publicacionSeleccionada = null;
      } else {
        this.publicacionSeleccionada =
          this.publicaciones.find(
            (publicacion) =>
              String(publicacion.idPublicacion) === String(valor)
          ) || null;
      }
      this.cambiar("idPublicacion", valor ?? null);
    },
    programarBusquedaPerfiles(texto) {
      this.busquedaPerfiles = String(texto || "");
      clearTimeout(this.temporalizadorPerfiles);
      this.temporalizadorPerfiles = setTimeout(
        () => this.buscarPerfiles(this.busquedaPerfiles),
        DEBOUNCE_MS
      );
    },
    programarBusquedaPublicaciones(texto) {
      this.busquedaPublicaciones = String(texto || "");
      clearTimeout(this.temporalizadorPublicaciones);
      this.temporalizadorPublicaciones = setTimeout(
        () => this.buscarPublicaciones(this.busquedaPublicaciones),
        DEBOUNCE_MS
      );
    },
    abortarPerfiles() {
      if (this.controladorPerfiles) {
        this.controladorPerfiles.abort();
        this.controladorPerfiles = null;
      }
    },
    abortarPublicaciones() {
      if (this.controladorPublicaciones) {
        this.controladorPublicaciones.abort();
        this.controladorPublicaciones = null;
      }
    },
    async buscarPerfiles(texto) {
      this.abortarPerfiles();
      const controller = new AbortController();
      this.controladorPerfiles = controller;
      this.cargandoPerfiles = true;

      try {
        const limpio = String(texto || "").trim();
        const params = { page: 0, size: TAMANO_OPCIONES };
        if (limpio) params.nombreArtistico = limpio;

        const response = await perfilService.buscar(
          params,
          controller.signal
        );
        if (this.controladorPerfiles !== controller) return;

        this.perfiles = Array.isArray(response?.data?.contenido)
          ? response.data.contenido
          : [];
      } catch (error) {
        if (this.controladorPerfiles !== controller || esCancelado(error)) {
          return;
        }
        this.perfiles = [];
      } finally {
        if (this.controladorPerfiles === controller) {
          this.cargandoPerfiles = false;
          this.controladorPerfiles = null;
        }
      }
    },
    async buscarPublicaciones(texto) {
      const idPerfil = idPerfilActivo();
      if (idPerfil == null) {
        this.publicaciones = [];
        return;
      }

      this.abortarPublicaciones();
      const controller = new AbortController();
      this.controladorPublicaciones = controller;
      this.cargandoPublicaciones = true;

      try {
        const limpio = String(texto || "").trim();
        const params = { page: 0, size: TAMANO_OPCIONES };
        if (limpio) params.titulo = limpio;

        const response = await publicacionService.listarPorPerfil(
          idPerfil,
          params,
          controller.signal
        );
        if (this.controladorPublicaciones !== controller) return;

        const contenido = Array.isArray(response?.data?.contenido)
          ? response.data.contenido
          : [];
        this.publicaciones = contenido.map((publicacion) => ({
          idPublicacion: publicacion.idPublicacion,
          titulo: publicacion.titulo || "Publicación",
        }));
      } catch (error) {
        if (
          this.controladorPublicaciones !== controller ||
          esCancelado(error)
        ) {
          return;
        }
        this.publicaciones = [];
      } finally {
        if (this.controladorPublicaciones === controller) {
          this.cargandoPublicaciones = false;
          this.controladorPublicaciones = null;
        }
      }
    },
  },
};
</script>

<style scoped>
.filtros-automaticas {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.9rem;
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border-soft);
  border-radius: 12px;
}

.filtros-automaticas__grilla {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.65rem;
  align-items: center;
}

.filtros-automaticas__campo {
  min-width: 0;
}

.filtros-automaticas__icono {
  color: var(--color-text-subtle);
  font-size: 1.05rem;
}

.filtros-automaticas__fechas {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
}

.filtros-automaticas__fecha {
  flex: 1;
  min-width: 0;
}

.filtros-automaticas__separador {
  color: var(--color-text-subtle);
  font-size: 0.8rem;
}

.filtros-automaticas__estados {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.filtros-automaticas__estado-label {
  margin-right: 0.15rem;
  color: var(--color-text-muted);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.filtros-automaticas__chip {
  padding: 0.3rem 0.75rem;
  color: var(--color-text-muted);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 999px;
  font: inherit;
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.filtros-automaticas__chip:hover:not(:disabled),
.filtros-automaticas__chip:focus-visible:not(:disabled) {
  background: var(--color-surface);
  border-color: var(--color-border);
  outline: none;
}

.filtros-automaticas__chip--activo {
  color: var(--color-on-primary);
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.filtros-automaticas__chip:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.filtros-automaticas__limpiar {
  margin-left: auto;
  padding: 0;
  color: var(--color-primary);
  background: none;
  border: 0;
  font: inherit;
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
}

.filtros-automaticas__limpiar:hover {
  text-decoration: underline;
}

.filtros-automaticas__error {
  margin: 0;
  color: var(--color-danger-text);
  font-size: 0.76rem;
}

@media (max-width: 900px) {
  .filtros-automaticas__grilla {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .filtros-automaticas__grilla {
    grid-template-columns: 1fr;
  }

  .filtros-automaticas__fechas {
    flex-wrap: wrap;
  }

  .filtros-automaticas__fecha {
    flex: 1 1 120px;
  }
}
</style>
