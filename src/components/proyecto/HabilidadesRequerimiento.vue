<template>
  <div class="habilidades-req">
    <div class="habilidades-req__cabecera">
      <p class="habilidades-req__titulo">Habilidades</p>
      <p class="habilidades-req__ayuda">Destrezas que valorás en los postulantes</p>
    </div>

    <div class="habilidades-req__chips">
      <span
        v-for="habilidad in seleccionadas"
        :key="habilidad.idHabilidad"
        class="habilidades-req__chip"
      >
        {{ habilidad.nombre }}
        <button
          v-if="!disabled"
          type="button"
          class="habilidades-req__chip-quitar"
          :aria-label="`Quitar ${habilidad.nombre}`"
          @click="quitar(habilidad.idHabilidad)"
        >
          <span class="material-symbols-outlined" aria-hidden="true">close</span>
        </button>
      </span>

      <VaDropdown
        v-if="!disabled"
        v-model="menuAbierto"
        placement="bottom-start"
        :close-on-content-click="false"
        :disabled="loading"
      >
        <template #anchor>
          <button
            type="button"
            class="habilidades-req__agregar"
            :disabled="loading"
            :aria-expanded="menuAbierto ? 'true' : 'false'"
          >
            <span aria-hidden="true">+</span>
            {{ loading ? "Cargando habilidades…" : "Agregar habilidad" }}
          </button>
        </template>

        <VaDropdownContent class="habilidades-req__menu">
          <VaInput
            v-model="busqueda"
            size="small"
            placeholder="Buscar habilidad"
            clearable
            aria-label="Buscar habilidad"
          >
            <template #prependInner>
              <span class="material-symbols-outlined habilidades-req__lupa" aria-hidden="true">
                search
              </span>
            </template>
          </VaInput>

          <ul class="habilidades-req__lista">
            <li v-for="habilidad in filtradas" :key="habilidad.idHabilidad">
              <button type="button" class="habilidades-req__opcion" @click="agregar(habilidad)">
                {{ habilidad.nombre }}
              </button>
            </li>
          </ul>

          <p v-if="!filtradas.length" class="habilidades-req__vacio">
            {{ loading ? "Cargando habilidades…" : "No hay habilidades disponibles." }}
          </p>
        </VaDropdownContent>
      </VaDropdown>
    </div>

    <p v-if="!loading && !options.length" class="habilidades-req__aviso">
      No hay habilidades disponibles en el catálogo.
    </p>
    <p v-if="error && errorMessage" class="habilidades-req__error">{{ errorMessage }}</p>
  </div>
</template>

<script>
/*
 * Habilidades del requerimiento como chips con “+ Agregar habilidad”.
 * El menú lista el catálogo con buscador y respeta el orden de selección.
 */
export default {
  name: "HabilidadesRequerimiento",
  props: {
    modelValue: {
      type: Array,
      default: () => [],
    },
    options: {
      type: Array,
      default: () => [],
    },
    loading: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    error: {
      type: Boolean,
      default: false,
    },
    errorMessage: {
      type: String,
      default: "",
    },
  },
  emits: ["update:modelValue"],
  data() {
    return {
      menuAbierto: false,
      busqueda: "",
    };
  },
  computed: {
    seleccionadas() {
      return this.idsSeleccionados.map(
        (id) =>
          this.options.find((habilidad) => habilidad.idHabilidad === id) || {
            idHabilidad: id,
            nombre: `Habilidad ${id}`,
          }
      );
    },
    idsSeleccionados() {
      return Array.isArray(this.modelValue) ? this.modelValue : [];
    },
    disponibles() {
      return this.options.filter(
        (habilidad) => !this.idsSeleccionados.includes(habilidad.idHabilidad)
      );
    },
    filtradas() {
      const termino = this.normalizar(this.busqueda);
      if (!termino) return this.disponibles;
      return this.disponibles.filter((habilidad) =>
        this.normalizar(habilidad.nombre).includes(termino)
      );
    },
  },
  watch: {
    menuAbierto(abierto) {
      if (!abierto) this.busqueda = "";
    },
  },
  methods: {
    normalizar(valor) {
      return String(valor || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
    },
    agregar(habilidad) {
      if (this.disabled || !habilidad) return;
      const actuales = [...this.idsSeleccionados];
      if (!actuales.includes(habilidad.idHabilidad)) actuales.push(habilidad.idHabilidad);
      this.$emit("update:modelValue", actuales);
      this.menuAbierto = false;
      this.busqueda = "";
    },
    quitar(idHabilidad) {
      if (this.disabled) return;
      this.$emit(
        "update:modelValue",
        this.idsSeleccionados.filter((id) => id !== idHabilidad)
      );
    },
  },
};
</script>

<style scoped>
.habilidades-req {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.habilidades-req__cabecera {
  display: flex;
  flex-direction: column;
}

.habilidades-req__titulo {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
}

.habilidades-req__ayuda {
  margin: 0.1rem 0 0;
  font-size: 0.78rem;
  color: var(--color-text-muted);
}

.habilidades-req__chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.15rem;
}

.habilidades-req__chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.5rem 0.4rem 0.9rem;
  border-radius: 999px;
  background: var(--color-primary-fill);
  color: var(--color-on-primary);
  font-size: 0.8rem;
  font-weight: 600;
}

.habilidades-req__chip-quitar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.16);
  color: inherit;
  cursor: pointer;
  transition: background 0.15s ease;
}

.habilidades-req__chip-quitar:hover {
  background: rgba(255, 255, 255, 0.3);
}

.habilidades-req__chip-quitar:focus-visible {
  outline: 2px solid var(--color-on-primary);
  outline-offset: 1px;
}

.habilidades-req__chip-quitar .material-symbols-outlined {
  font-size: 0.85rem;
}

.habilidades-req__agregar {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.4rem 0.9rem;
  border: 1px dashed var(--color-border-strong);
  border-radius: 999px;
  background: transparent;
  color: var(--color-text);
  font-family: inherit;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.habilidades-req__agregar:hover:not(:disabled) {
  border-color: var(--color-primary);
  background: var(--color-info-soft);
}

.habilidades-req__agregar:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
}

.habilidades-req__agregar:disabled {
  opacity: 0.6;
  cursor: progress;
}

.habilidades-req__menu {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 280px;
  max-width: calc(100vw - 2rem);
  padding: 0.75rem;
}

.habilidades-req__lupa {
  font-size: 1rem;
  color: var(--color-text-muted);
}

.habilidades-req__lista {
  display: flex;
  flex-direction: column;
  max-height: 240px;
  margin: 0;
  padding: 0;
  list-style: none;
  overflow-y: auto;
}

.habilidades-req__opcion {
  width: 100%;
  padding: 0.5rem 0.6rem;
  border: none;
  border-radius: 8px;
  background: none;
  color: var(--color-text);
  font-family: inherit;
  font-size: 0.84rem;
  text-align: left;
  cursor: pointer;
}

.habilidades-req__opcion:hover {
  background: var(--color-surface-muted);
}

.habilidades-req__opcion:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
}

.habilidades-req__vacio,
.habilidades-req__aviso {
  margin: 0;
  font-size: 0.78rem;
  color: var(--color-text-muted);
}

.habilidades-req__vacio {
  padding: 0.35rem 0.6rem;
}

.habilidades-req__error {
  margin: 0;
  font-size: 0.78rem;
  color: var(--color-danger-text);
}
</style>
