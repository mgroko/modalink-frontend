<template>
  <section
    class="filtros-colaboracion"
    aria-label="Filtros de solicitudes de colaboración"
  >
    <div class="filtros-colaboracion__grilla">
      <VaSelect
        :model-value="filtros.idPublicacion"
        label="Publicación"
        placeholder="Todas las publicaciones"
        :options="publicaciones"
        value-by="idPublicacion"
        text-by="titulo"
        :loading="cargandoPublicaciones"
        clearable
        searchable
        no-options-text="No hay publicaciones con solicitudes"
        @update:model-value="cambiar('idPublicacion', $event)"
      />

      <VaInput
        :model-value="filtros.fechaDesde"
        label="Enviada desde"
        type="date"
        :error="!!errorFechas"
        @update:model-value="cambiar('fechaDesde', $event)"
      />

      <VaInput
        :model-value="filtros.fechaHasta"
        label="Hasta"
        type="date"
        :error="!!errorFechas"
        @update:model-value="cambiar('fechaHasta', $event)"
      />

      <VaSelect
        v-if="mostrarPerfil"
        :model-value="filtros.idPerfil"
        :label="etiquetaPerfil"
        placeholder="Buscar por nombre artístico"
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
      />

      <VaSelect
        :model-value="filtros.estado"
        label="Estado"
        placeholder="Todos"
        :options="opcionesEstado"
        value-by="value"
        text-by="text"
        :disabled="filtros.todosLosEstados || filtros.estadoForzado"
        clearable
        @update:model-value="cambiar('estado', $event)"
      />

      <label class="filtros-colaboracion__historial">
        <input
          type="checkbox"
          :checked="filtros.todosLosEstados"
          :disabled="filtros.estadoForzado"
          @change="cambiar('todosLosEstados', $event.target.checked)"
        />
        Ver historial completo
      </label>

      <div class="filtros-colaboracion__acciones">
        <VaButton
          preset="secondary"
          :disabled="cargando"
          @click="$emit('limpiar')"
        >
          Limpiar
        </VaButton>
        <VaButton :loading="cargando" :disabled="cargando" @click="$emit('buscar')">
          Buscar
        </VaButton>
      </div>
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
  display: grid;
  gap: 0.5rem;
  padding: 0.9rem;
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border);
  border-radius: 10px;
}

.filtros-colaboracion__grilla {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: end;
  gap: 0.65rem;
}

.filtros-colaboracion__historial {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--color-text-muted);
  font-size: 0.76rem;
}

.filtros-colaboracion__acciones {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
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

  .filtros-colaboracion__acciones {
    justify-content: stretch;
  }
}
</style>
