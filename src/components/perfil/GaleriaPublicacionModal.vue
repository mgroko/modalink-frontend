<template>
  <VaModal
    :model-value="modelValue"
    hide-default-actions
    size="large"
    blur
    class="galeria-publicacion"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #header>
      <div class="galeria-publicacion__header">
        <h3 class="va-h5 galeria-publicacion__titulo">{{ titulo || "Publicación" }}</h3>
        <span class="galeria-publicacion__contador">
          {{ imagenes.length ? indice + 1 : 0 }} de {{ imagenes.length }}
        </span>
      </div>
    </template>

    <div v-if="imagenes.length" class="galeria-publicacion__visor">
      <button
        type="button"
        class="galeria-publicacion__flecha galeria-publicacion__flecha--izq"
        :disabled="imagenes.length <= 1"
        aria-label="Imagen anterior"
        @click="anterior"
      >
        <span class="material-symbols-outlined">chevron_left</span>
      </button>

      <img
        class="galeria-publicacion__imagen"
        :src="imagenActual"
        :alt="`${titulo} — imagen ${indice + 1}`"
      />

      <button
        type="button"
        class="galeria-publicacion__flecha galeria-publicacion__flecha--der"
        :disabled="imagenes.length <= 1"
        aria-label="Imagen siguiente"
        @click="siguiente"
      >
        <span class="material-symbols-outlined">chevron_right</span>
      </button>
    </div>
    <p v-else class="galeria-publicacion__vacia">Esta publicación no tiene imágenes.</p>

    <template #footer>
      <div class="galeria-publicacion__acciones">
        <VaButton preset="secondary" @click="$emit('update:modelValue', false)">
          Cerrar
        </VaButton>
      </div>
    </template>
  </VaModal>
</template>

<script>
import { resolverFotoUrl } from "../../utils/fotos.js";

export default {
  name: "GaleriaPublicacionModal",
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    imagenes: {
      type: Array,
      default: () => [],
    },
    titulo: {
      type: String,
      default: "",
    },
  },
  emits: ["update:modelValue"],
  data() {
    return {
      indice: 0,
    };
  },
  computed: {
    imagenesOrdenadas() {
      return [...(this.imagenes || [])].sort(
        (a, b) => (Number(a.orden) || 0) - (Number(b.orden) || 0)
      );
    },
    imagenActual() {
      return resolverFotoUrl(this.imagenesOrdenadas[this.indice]?.url);
    },
  },
  watch: {
    modelValue(abierto) {
      if (abierto) this.indice = 0;
    },
    imagenes() {
      if (this.indice >= this.imagenesOrdenadas.length) this.indice = 0;
    },
  },
  methods: {
    anterior() {
      if (this.imagenesOrdenadas.length <= 1) return;
      this.indice =
        (this.indice - 1 + this.imagenesOrdenadas.length) %
        this.imagenesOrdenadas.length;
    },
    siguiente() {
      if (this.imagenesOrdenadas.length <= 1) return;
      this.indice = (this.indice + 1) % this.imagenesOrdenadas.length;
    },
  },
};
</script>

<style scoped>
.galeria-publicacion__header {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
}

.galeria-publicacion__titulo {
  margin: 0;
}

.galeria-publicacion__contador {
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.galeria-publicacion__visor {
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.75rem;
}

.galeria-publicacion__imagen {
  width: 100%;
  max-height: 68vh;
  border-radius: 10px;
  object-fit: contain;
  background: var(--color-surface-muted);
}

.galeria-publicacion__flecha {
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

.galeria-publicacion__flecha:disabled {
  cursor: default;
  opacity: 0.4;
}

.galeria-publicacion__flecha .material-symbols-outlined {
  font-size: 1.4rem;
}

.galeria-publicacion__vacia {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  text-align: center;
}

.galeria-publicacion__acciones {
  display: flex;
  justify-content: flex-end;
  width: 100%;
}

@media (max-width: 560px) {
  .galeria-publicacion__visor {
    grid-template-columns: 1fr;
  }

  .galeria-publicacion__flecha {
    position: absolute;
    top: 50%;
    z-index: 1;
    transform: translateY(-50%);
  }

  .galeria-publicacion__flecha--izq {
    left: 0.4rem;
  }

  .galeria-publicacion__flecha--der {
    right: 0.4rem;
  }
}
</style>
