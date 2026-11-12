<template>
  <VaModal
    :model-value="modelValue"
    hide-default-actions
    size="large"
    blur
    class="visor-polaroids"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #header>
      <div class="visor-polaroids__header">
        <h3 class="va-h5 visor-polaroids__titulo">Polaroids</h3>
        <span class="visor-polaroids__contador">
          {{ total ? indice + 1 : 0 }} de {{ total }}
        </span>
      </div>
    </template>

    <div v-if="polaroidActual" class="visor-polaroids__contenido">
      <div class="visor-polaroids__visor">
        <button
          type="button"
          class="visor-polaroids__flecha"
          :disabled="total <= 1"
          aria-label="Polaroid anterior"
          @click="anterior"
        >
          <span class="material-symbols-outlined" aria-hidden="true">
            chevron_left
          </span>
        </button>

        <img
          :src="imagenActual"
          :alt="polaroidActual.tipo?.nombreCompleto || 'Polaroid'"
          class="visor-polaroids__imagen"
        />

        <button
          type="button"
          class="visor-polaroids__flecha"
          :disabled="total <= 1"
          aria-label="Polaroid siguiente"
          @click="siguiente"
        >
          <span class="material-symbols-outlined" aria-hidden="true">
            chevron_right
          </span>
        </button>
      </div>

      <div class="visor-polaroids__datos">
        <p class="visor-polaroids__tipo">
          {{ polaroidActual.tipo?.nombreCompleto || "Polaroid" }}
        </p>
        <p v-if="fechaRelativa" class="visor-polaroids__fecha">
          Subida {{ fechaRelativa }}
        </p>
      </div>
    </div>

    <p v-else class="visor-polaroids__vacio">
      Esta publicación no tiene polaroids.
    </p>

    <template #footer>
      <div class="visor-polaroids__acciones">
        <VaButton
          preset="secondary"
          @click="$emit('update:modelValue', false)"
        >
          Cerrar
        </VaButton>
      </div>
    </template>
  </VaModal>
</template>

<script>
import { resolverFotoUrl } from "../../utils/fotos.js";
import { formatearTiempoRelativo } from "../../utils/fechas.js";

export default {
  name: "ModalVisorPolaroids",
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    polaroids: {
      type: Array,
      default: () => [],
    },
    indiceInicial: {
      type: Number,
      default: 0,
    },
  },
  emits: ["update:modelValue"],
  data() {
    return {
      indice: 0,
    };
  },
  computed: {
    total() {
      return this.polaroids.length;
    },
    polaroidActual() {
      return this.polaroids[this.indice] || null;
    },
    imagenActual() {
      return resolverFotoUrl(this.polaroidActual?.url);
    },
    fechaRelativa() {
      return formatearTiempoRelativo(this.polaroidActual?.fechaRegistro);
    },
  },
  watch: {
    modelValue(abierto) {
      if (abierto) {
        this.indice = Math.min(
          Math.max(0, Number(this.indiceInicial) || 0),
          Math.max(0, this.polaroids.length - 1)
        );
      }
    },
    polaroids() {
      if (this.indice >= this.polaroids.length) {
        this.indice = Math.max(0, this.polaroids.length - 1);
      }
    },
  },
  methods: {
    anterior() {
      if (this.total <= 1) return;
      this.indice = (this.indice - 1 + this.total) % this.total;
    },
    siguiente() {
      if (this.total <= 1) return;
      this.indice = (this.indice + 1) % this.total;
    },
  },
};
</script>

<style scoped>
.visor-polaroids__header {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
}

.visor-polaroids__titulo {
  margin: 0;
}

.visor-polaroids__contador {
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.visor-polaroids__contenido {
  display: grid;
  gap: 0.8rem;
}

.visor-polaroids__visor {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.75rem;
}

.visor-polaroids__imagen {
  width: 100%;
  max-height: 66vh;
  object-fit: contain;
  background: var(--color-surface-muted);
  border-radius: 10px;
}

.visor-polaroids__flecha {
  display: grid;
  width: 2.6rem;
  height: 2.6rem;
  padding: 0;
  place-items: center;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 50%;
  cursor: pointer;
}

.visor-polaroids__flecha:disabled {
  cursor: default;
  opacity: 0.4;
}

.visor-polaroids__flecha .material-symbols-outlined {
  font-size: 1.4rem;
}

.visor-polaroids__datos {
  display: grid;
  gap: 0.2rem;
  text-align: center;
}

.visor-polaroids__tipo {
  margin: 0;
  color: var(--color-text);
  font-size: 0.9rem;
  font-weight: 700;
}

.visor-polaroids__fecha {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.78rem;
}

.visor-polaroids__vacio {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  text-align: center;
}

.visor-polaroids__acciones {
  display: flex;
  justify-content: flex-end;
  width: 100%;
}

@media (max-width: 560px) {
  .visor-polaroids__visor {
    grid-template-columns: 1fr;
  }

  .visor-polaroids__flecha {
    position: absolute;
    top: 50%;
    z-index: 2;
    transform: translateY(-50%);
  }

  .visor-polaroids__flecha:first-child {
    left: 0.5rem;
  }

  .visor-polaroids__flecha:last-child {
    right: 0.5rem;
  }
}
</style>
