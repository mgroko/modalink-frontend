<template>
  <section
    class="filtros-colaboracion"
    aria-label="Filtros de solicitudes de colaboración"
  >
    <div class="filtros-colaboracion__grilla">
      <VaSelect
        v-if="mostrarPerfil"
        :model-value="filtros.idPerfil"
        class="filtros-colaboracion__campo"
        :placeholder="placeholderPerfil"
        :aria-label="placeholderPerfil"
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
          <span class="material-symbols-outlined filtros-colaboracion__icono">
            search
          </span>
        </template>
      </VaSelect>

      <VaSelect
        :model-value="filtros.idPublicacion"
        class="filtros-colaboracion__campo"
        placeholder="Todas las publicaciones"
        aria-label="Publicación"
        :options="publicaciones"
        value-by="idPublicacion"
        text-by="titulo"
        :loading="cargandoPublicaciones"
        clearable
        searchable
        no-options-text="No hay publicaciones con solicitudes"
        @update:model-value="cambiar('idPublicacion', $event)"
      />

      <div class="filtros-colaboracion__fechas">
        <VaInput
          :model-value="filtros.fechaDesde"
          class="filtros-colaboracion__fecha"
          type="date"
          aria-label="Fecha desde"
          :error="!!errorFechas"
          @update:model-value="cambiar('fechaDesde', $event)"
        />
        <span class="filtros-colaboracion__separador" aria-hidden="true">—</span>
        <VaInput
          :model-value="filtros.fechaHasta"
          class="filtros-colaboracion__fecha"
          type="date"
          aria-label="Fecha hasta"
          :error="!!errorFechas"
          @update:model-value="cambiar('fechaHasta', $event)"
        />
      </div>
    </div>

    <div class="filtros-colaboracion__estados">
      <span class="filtros-colaboracion__estado-label">Estado</span>

      <button
        v-for="opcion in opcionesEstado"
        :key="opcion.value"
        type="button"
        class="filtros-colaboracion__chip"
        :class="{
          'filtros-colaboracion__chip--activo': filtros.estado === opcion.value,
        }"
        :disabled="filtros.todosLosEstados || filtros.estadoForzado"
        @click="cambiar('estado', opcion.value)"
      >
        {{ opcion.text }}
      </button>

      <button
        type="button"
        class="filtros-colaboracion__limpiar"
        @click="$emit('limpiar')"
      >
        Limpiar
      </button>
    </div>

    <p v-if="errorFechas" class="filtros-colaboracion__error" role="alert">
      {{ errorFechas }}
    </p>
  </section>
</template>

<script>
import perfilService from "../../services/perfilService.js";
import {
  ESTADOS_SOLICITUD_COLABORACION,
  ETIQUETAS_ESTADO_SOLICITUD_COLABORACION,
} from "../../utils/solicitudesColaboracionConstants.js";

const TAMANO_PERFILES = 20;
const DEBOUNCE_MS = 350;

export default {
  name: "FiltrosSolicitudesColaboracion",
  props: {
    filtros: {
      type: Object,
      required: true,
    },
    publicaciones: {
      type: Array,
      default: () => [],
    },
    cargandoPublicaciones: {
      type: Boolean,
      default: false,
    },
    cargando: {
      type: Boolean,
      default: false,
    },
    errorFechas: {
      type: String,
      default: "",
    },
    mostrarPerfil: {
      type: Boolean,
      default: false,
    },
    etiquetaPerfil: {
      type: String,
      default: "Perfil",
    },
  },
  emits: ["cambio", "buscar", "limpiar"],
  data() {
    return {
      perfiles: [],
      perfilSeleccionado: null,
      busquedaPerfiles: "",
      cargandoPerfiles: false,
      controladorPerfiles: null,
      temporalizadorPerfiles: null,
    };
  },
  computed: {
    opcionesEstado() {
      return Object.values(ESTADOS_SOLICITUD_COLABORACION).map((value) => ({
        value,
        text: ETIQUETAS_ESTADO_SOLICITUD_COLABORACION[value],
      }));
    },
    placeholderPerfil() {
      return `Buscar por ${String(this.etiquetaPerfil || "perfil").toLowerCase()}`;
    },
    opcionesPerfiles() {
      const idActual = this.filtros?.idPerfil;
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
  },
  watch: {
    "filtros.idPerfil"(valor) {
      if (valor == null || valor === "") {
        this.perfilSeleccionado = null;
        return;
      }
      const encontrado = this.perfiles.find(
        (perfil) => String(perfil.idPerfil) === String(valor)
      );
      if (encontrado) this.perfilSeleccionado = encontrado;
    },
  },
  mounted() {
    this.buscarPerfiles("");
  },
  beforeUnmount() {
    clearTimeout(this.temporalizadorPerfiles);
    this.abortarPerfiles();
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
      this.cambiar("idPerfil", valor ?? null);
    },
    programarBusquedaPerfiles(texto) {
      this.busquedaPerfiles = String(texto || "");
      clearTimeout(this.temporalizadorPerfiles);
      this.temporalizadorPerfiles = setTimeout(
        () => this.buscarPerfiles(this.busquedaPerfiles),
        DEBOUNCE_MS
      );
    },
    abortarPerfiles() {
      if (this.controladorPerfiles) {
        this.controladorPerfiles.abort();
        this.controladorPerfiles = null;
      }
    },
    async buscarPerfiles(texto) {
      this.abortarPerfiles();
      const controller = new AbortController();
      this.controladorPerfiles = controller;
      this.cargandoPerfiles = true;

      try {
        const limpio = String(texto || "").trim();
        const params = { page: 0, size: TAMANO_PERFILES };
        if (limpio) params.nombreArtistico = limpio;

        const response = await perfilService.buscar(params, controller.signal);
        if (this.controladorPerfiles !== controller) return;

        this.perfiles = Array.isArray(response?.data?.contenido)
          ? response.data.contenido
          : [];
      } catch (error) {
        if (
          this.controladorPerfiles !== controller ||
          error?.code === "ERR_CANCELED" ||
          error?.name === "CanceledError" ||
          error?.name === "AbortError"
        ) {
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
  },
};
</script>

<style scoped>
.filtros-colaboracion {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.9rem;
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border-soft);
  border-radius: 12px;
}

.filtros-colaboracion__grilla {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.65rem;
  align-items: center;
}

.filtros-colaboracion__campo {
  min-width: 0;
}

.filtros-colaboracion__icono {
  color: var(--color-text-subtle);
  font-size: 1.05rem;
}

.filtros-colaboracion__fechas {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
}

.filtros-colaboracion__fecha {
  flex: 1;
  min-width: 0;
}

.filtros-colaboracion__separador {
  color: var(--color-text-subtle);
  font-size: 0.8rem;
}

.filtros-colaboracion__estados {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.filtros-colaboracion__estado-label {
  margin-right: 0.15rem;
  color: var(--color-text-muted);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.filtros-colaboracion__chip {
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

.filtros-colaboracion__chip:hover:not(:disabled),
.filtros-colaboracion__chip:focus-visible:not(:disabled) {
  background: var(--color-surface);
  border-color: var(--color-border);
  outline: none;
}

.filtros-colaboracion__chip--activo {
  color: var(--color-on-primary);
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.filtros-colaboracion__chip:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.filtros-colaboracion__limpiar {
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

.filtros-colaboracion__limpiar:hover {
  text-decoration: underline;
}

.filtros-colaboracion__error {
  margin: 0;
  color: var(--color-danger-text);
  font-size: 0.76rem;
}

@media (max-width: 900px) {
  .filtros-colaboracion__grilla {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .filtros-colaboracion__grilla {
    grid-template-columns: 1fr;
  }

  .filtros-colaboracion__fechas {
    flex-wrap: wrap;
  }

  .filtros-colaboracion__fecha {
    flex: 1 1 120px;
  }
}
</style>
