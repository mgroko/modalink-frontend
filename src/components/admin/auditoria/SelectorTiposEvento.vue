<template>
  <div ref="contenedor" class="selector-tipos">
    <button
      type="button"
      class="selector-tipos__campo"
      :disabled="deshabilitado"
      aria-haspopup="listbox"
      :aria-expanded="abierto ? 'true' : 'false'"
      @click="alternarPanel"
    >
      <span v-if="!tiposSeleccionados.length" class="selector-tipos__placeholder">
        Todos los tipos
      </span>
      <span v-else class="selector-tipos__chips">
        <span
          v-for="tipo in chipsVisibles"
          :key="tipo.codigo"
          class="selector-tipos__chip"
          :title="tipo.nombre"
        >
          {{ tipo.nombre }}
          <span
            class="selector-tipos__chip-x"
            role="button"
            tabindex="-1"
            :aria-label="`Quitar ${tipo.nombre}`"
            @click.stop="quitar(tipo)"
          >×</span>
        </span>
        <span
          v-if="tiposSeleccionados.length > chipsVisibles.length"
          class="selector-tipos__chip-mas"
        >
          +{{ tiposSeleccionados.length - chipsVisibles.length }}
        </span>
      </span>
      <span class="material-symbols-outlined selector-tipos__chevron" aria-hidden="true">expand_more</span>
    </button>

    <div v-if="abierto" class="selector-tipos__panel">
      <div class="selector-tipos__buscador">
        <VaInput
          v-model="busqueda"
          placeholder="Buscar tipo"
          removable
        >
          <template #prependInner>
            <VaIcon name="mso-search" color="grey" size="small" />
          </template>
        </VaInput>
      </div>

      <div v-if="cargandoCatalogo" class="selector-tipos__nota">
        Cargando tipos de evento...
      </div>
      <div v-else-if="!catalogo.length" class="selector-tipos__nota">
        No hay tipos de evento activos.
      </div>
      <div v-else-if="!gruposVisibles.length" class="selector-tipos__nota">
        Sin resultados para "{{ busqueda }}".
      </div>

      <div v-else class="selector-tipos__grupos" role="listbox" aria-multiselectable="true">
        <div v-for="grupo in gruposVisibles" :key="grupo.modulo" class="selector-tipos__grupo">
          <span class="selector-tipos__grupo-titulo">
            {{ etiquetaModuloAuditoria(grupo.modulo) }}
          </span>
          <VaCheckbox
            v-for="tipo in grupo.tipos"
            :key="tipo.codigo"
            class="selector-tipos__opcion"
            :model-value="estaSeleccionado(tipo.codigo)"
            :label="tipo.nombre"
            @update:modelValue="alternar(tipo.codigo)"
          />
        </div>
      </div>

      <div class="selector-tipos__pie">
        <button
          type="button"
          class="selector-tipos__limpiar"
          :disabled="!tiposSeleccionados.length"
          @click="limpiar"
        >
          Limpiar selección
        </button>
        <span class="selector-tipos__contador">
          {{ tiposSeleccionados.length }} seleccionados
        </span>
      </div>
    </div>
  </div>
</template>

<script>
import {
  agruparTiposPorModulo,
  etiquetaModuloAuditoria,
  normalizarTextoBusqueda,
} from "../../../utils/auditoriaConstants";

/**
 * Multi-selección de tipos de evento (UC-67 §5.1): opciones agrupadas por
 * `modulo`, con búsqueda y accesos rápidos de limpiar. Abrir/cerrar, cierre
 * con clic fuera y `Escape` se manejan acá.
 */
export default {
  name: "SelectorTiposEvento",
  props: {
    modelValue: { type: Array, default: () => [] },
    catalogo: { type: Array, default: () => [] },
    cargandoCatalogo: { type: Boolean, default: false },
    deshabilitado: { type: Boolean, default: false },
  },
  emits: ["update:modelValue"],
  data() {
    return {
      abierto: false,
      busqueda: "",
    };
  },
  computed: {
    gruposVisibles() {
      const texto = normalizarTextoBusqueda(this.busqueda);
      const grupos = agruparTiposPorModulo(this.catalogo);
      if (!texto) return grupos;
      return grupos
        .map((grupo) => ({
          modulo: grupo.modulo,
          tipos: grupo.tipos.filter((tipo) => {
            const objetivo = normalizarTextoBusqueda(
              [tipo.nombre, tipo.codigo, tipo.descripcion, grupo.modulo]
                .filter(Boolean)
                .join(" ")
            );
            return objetivo.includes(texto);
          }),
        }))
        .filter((grupo) => grupo.tipos.length > 0);
    },
    chipsVisibles() {
      return this.tiposSeleccionados
        .slice(0, 2)
        .map((codigo) => this.buscarTipo(codigo));
    },
    tiposSeleccionados() {
      return Array.isArray(this.modelValue) ? this.modelValue : [];
    },
  },
  mounted() {
    document.addEventListener("click", this.escucharClicExterno);
  },
  beforeUnmount() {
    document.removeEventListener("click", this.escucharClicExterno);
    document.removeEventListener("keydown", this.escucharTeclado);
  },
  watch: {
    abierto(abierto) {
      if (abierto) {
        document.addEventListener("keydown", this.escucharTeclado);
      } else {
        document.removeEventListener("keydown", this.escucharTeclado);
      }
    },
  },
  methods: {
    etiquetaModuloAuditoria,
    alternarPanel() {
      this.abierto = !this.abierto;
    },
    cerrarPanel() {
      this.abierto = false;
    },
    estaSeleccionado(codigo) {
      return this.tiposSeleccionados.includes(codigo);
    },
    alternar(codigo) {
      const siguientes = this.estaSeleccionado(codigo)
        ? this.tiposSeleccionados.filter((t) => t !== codigo)
        : [...this.tiposSeleccionados, codigo];
      this.$emit("update:modelValue", siguientes);
    },
    quitar(tipo) {
      this.$emit(
        "update:modelValue",
        this.tiposSeleccionados.filter((codigo) => codigo !== tipo.codigo)
      );
    },
    limpiar() {
      this.$emit("update:modelValue", []);
    },
    buscarTipo(codigo) {
      const tipo = this.catalogo.find((t) => t?.codigo === codigo);
      return {
        codigo,
        nombre: tipo?.nombre || codigo,
        descripcion: tipo?.descripcion || "",
      };
    },
    escucharClicExterno(evento) {
      if (!this.abierto) return;
      if (this.$refs.contenedor?.contains(evento.target)) return;
      this.cerrarPanel();
    },
    escucharTeclado(evento) {
      if (evento.key === "Escape") this.cerrarPanel();
    },
  },
};
</script>

<style scoped>
.selector-tipos {
  position: relative;
  min-width: 0;
}

.selector-tipos__campo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  min-height: 2.6rem;
  padding: 0.35rem 0.65rem;
  color: var(--color-text);
  text-align: left;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  font: inherit;
  font-size: 0.85rem;
  cursor: pointer;
}

.selector-tipos__campo:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.selector-tipos__placeholder {
  flex: 1;
  overflow: hidden;
  color: var(--color-text-subtle);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selector-tipos__chips {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  gap: 0.3rem;
  min-width: 0;
}

.selector-tipos__chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  overflow: hidden;
  max-width: 11rem;
  padding: 0.15rem 0.45rem;
  color: var(--color-primary);
  background: var(--color-chip);
  border-radius: 0.5rem;
  font-size: 0.72rem;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selector-tipos__chip-x {
  color: inherit;
  cursor: pointer;
  font-size: 0.9rem;
  line-height: 1;
}

.selector-tipos__chip-x:hover {
  color: var(--color-danger);
}

.selector-tipos__chip-mas {
  color: var(--color-text-muted);
  font-size: 0.72rem;
  font-weight: 600;
}

.selector-tipos__chevron {
  flex: 0 0 auto;
  color: var(--color-text-muted);
  font-size: 1.1rem;
}

.selector-tipos__panel {
  position: absolute;
  top: calc(100% + 0.35rem);
  left: 0;
  z-index: 40;
  display: grid;
  gap: 0.5rem;
  width: min(21rem, 88vw);
  max-height: 22rem;
  padding: 0.75rem;
  overflow-y: auto;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  box-shadow: 0 10px 28px var(--color-shadow);
}

.selector-tipos__grupos {
  display: grid;
  gap: 0.65rem;
}

.selector-tipos__grupo {
  display: grid;
  gap: 0.15rem;
}

.selector-tipos__grupo-titulo {
  color: var(--color-text-muted);
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.selector-tipos__opcion {
  --va-background-border-opacity: 1;
}

.selector-tipos__opcion :deep(.va-checkbox__label) {
  font-size: 0.85rem;
}

.selector-tipos__nota {
  padding: 0.65rem 0.4rem;
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.selector-tipos__pie {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--color-border-soft);
}

.selector-tipos__limpiar {
  padding: 0;
  color: var(--color-primary);
  background: none;
  border: 0;
  font: inherit;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
}

.selector-tipos__limpiar:disabled {
  color: var(--color-text-subtle);
  cursor: default;
}

.selector-tipos__contador {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}
</style>
