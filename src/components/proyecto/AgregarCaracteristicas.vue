<template>
  <div class="agregar-carac">
    <span class="agregar-carac__label">Agregar</span>

    <p v-if="cargando" class="agregar-carac__hint">Cargando características…</p>
    <p v-else-if="!hayDisponibles" class="agregar-carac__hint">
      Todas las características ya fueron agregadas.
    </p>

    <template v-else>
      <button
        v-for="caracteristica in rapidas"
        :key="caracteristica.idCaracteristica"
        type="button"
        class="agregar-carac__chip"
        :disabled="disabled"
        @click="agregar(caracteristica)"
      >
        <span aria-hidden="true">+</span>
        {{ etiqueta(caracteristica) }}
      </button>

      <VaDropdown
        v-if="resto.length"
        v-model="menuAbierto"
        placement="bottom-start"
        :close-on-content-click="false"
        :disabled="disabled"
      >
        <template #anchor>
          <button
            type="button"
            class="agregar-carac__chip agregar-carac__chip--ver"
            :disabled="disabled"
            :aria-expanded="menuAbierto ? 'true' : 'false'"
          >
            Ver todas
            <span class="material-symbols-outlined" aria-hidden="true">
              expand_more
            </span>
          </button>
        </template>

        <VaDropdownContent class="agregar-carac__menu">
          <VaInput
            v-model="busqueda"
            size="small"
            placeholder="Buscar característica"
            clearable
            aria-label="Buscar característica"
          >
            <template #prependInner>
              <span class="material-symbols-outlined agregar-carac__lupa" aria-hidden="true">
                search
              </span>
            </template>
          </VaInput>

          <ul class="agregar-carac__lista">
            <li v-for="caracteristica in filtradas" :key="caracteristica.idCaracteristica">
              <button
                type="button"
                class="agregar-carac__opcion"
                @click="agregar(caracteristica)"
              >
                {{ etiqueta(caracteristica) }}
              </button>
            </li>
          </ul>

          <p v-if="!filtradas.length" class="agregar-carac__vacio">
            No hay características que coincidan.
          </p>
        </VaDropdownContent>
      </VaDropdown>
    </template>
  </div>
</template>

<script>
import {
  etiquetaCaracteristica,
  seleccionarCaracteristicasRapidas,
} from "../../utils/requerimientoUi.js";

/*
 * Atajos para agregar características técnicas: chips con las más usadas y un
 * menú "Ver todas" con buscador para el resto del catálogo de la profesión.
 */
export default {
  name: "AgregarCaracteristicas",
  props: {
    catalogo: {
      type: Array,
      default: () => [],
    },
    agregadas: {
      type: Array,
      default: () => [],
    },
    cargando: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["agregar"],
  data() {
    return {
      menuAbierto: false,
      busqueda: "",
    };
  },
  computed: {
    seleccion() {
      return seleccionarCaracteristicasRapidas(this.catalogo, this.agregadas);
    },
    rapidas() {
      return this.seleccion.rapidas;
    },
    resto() {
      return this.seleccion.resto;
    },
    hayDisponibles() {
      return this.rapidas.length > 0 || this.resto.length > 0;
    },
    filtradas() {
      const termino = this.normalizar(this.busqueda);
      if (!termino) return this.resto;
      return this.resto.filter((caracteristica) =>
        this.normalizar(this.etiqueta(caracteristica)).includes(termino)
      );
    },
  },
  watch: {
    menuAbierto(abierto) {
      if (!abierto) this.busqueda = "";
    },
  },
  methods: {
    etiqueta(caracteristica) {
      return etiquetaCaracteristica(caracteristica);
    },
    normalizar(valor) {
      return String(valor || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
    },
    agregar(caracteristica) {
      if (this.disabled || !caracteristica) return;
      this.$emit("agregar", caracteristica.idCaracteristica);
      this.menuAbierto = false;
      this.busqueda = "";
    },
  },
};
</script>

<style scoped>
.agregar-carac {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.agregar-carac__label {
  margin-right: 0.15rem;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.agregar-carac__hint {
  margin: 0;
  font-size: 0.78rem;
  color: var(--color-text-muted);
}

.agregar-carac__chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.4rem 0.85rem;
  border: 1px dashed var(--color-border-strong);
  border-radius: 999px;
  background: transparent;
  color: var(--color-primary);
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.agregar-carac__chip:hover:not(:disabled) {
  border-color: var(--color-primary);
  background: var(--color-info-soft);
}

.agregar-carac__chip:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
}

.agregar-carac__chip:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.agregar-carac__chip--ver {
  color: var(--color-text);
}

.agregar-carac__chip--ver .material-symbols-outlined {
  font-size: 1rem;
}

/* El menú se teletransporta: los estilos scoped llegan por el slot. */
.agregar-carac__menu {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 280px;
  max-width: calc(100vw - 2rem);
  padding: 0.75rem;
}

.agregar-carac__lupa {
  font-size: 1rem;
  color: var(--color-text-muted);
}

.agregar-carac__lista {
  display: flex;
  flex-direction: column;
  max-height: 240px;
  margin: 0;
  padding: 0;
  list-style: none;
  overflow-y: auto;
}

.agregar-carac__opcion {
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

.agregar-carac__opcion:hover {
  background: var(--color-surface-muted);
}

.agregar-carac__opcion:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
}

.agregar-carac__vacio {
  margin: 0;
  padding: 0.35rem 0.6rem;
  font-size: 0.78rem;
  color: var(--color-text-muted);
}
</style>
