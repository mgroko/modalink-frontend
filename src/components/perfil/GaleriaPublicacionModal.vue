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

      <div
        ref="zoom"
        class="galeria-publicacion__zoom"
        @wheel.prevent="alRueda"
        @dblclick="alternarZoom"
      >
        <img
          class="galeria-publicacion__imagen"
          :style="estiloImagen"
          :src="imagenActual"
          :alt="`${titulo} — imagen ${indice + 1}`"
        />
      </div>

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
        <div class="galeria-publicacion__zoom-acciones">
          <VaButton
            preset="secondary"
            size="small"
            icon="mso-zoom_out"
            :disabled="escala <= ZOOM_MIN"
            @click="alejar"
          >
            Alejar
          </VaButton>
          <VaButton
            preset="secondary"
            size="small"
            icon="mso-restart_alt"
            :disabled="escala === ZOOM_MIN"
            @click="restablecerZoom"
          >
            Restablecer
          </VaButton>
          <VaButton
            preset="secondary"
            size="small"
            icon="mso-zoom_in"
            :disabled="escala >= ZOOM_MAX"
            @click="acercar"
          >
            Acercar
          </VaButton>
        </div>

        <VaButton preset="secondary" @click="$emit('update:modelValue', false)">
          Cerrar
        </VaButton>
      </div>
    </template>
  </VaModal>
</template>

<script>
import { resolverFotoUrl } from "../../utils/fotos.js";

const ZOOM_MIN = 1;
const ZOOM_MAX = 3;
const ZOOM_PASO = 0.25;

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
    /** Imagen que se muestra al abrir la galería. */
    indiceInicial: {
      type: Number,
      default: 0,
    },
  },
  emits: ["update:modelValue"],
  data() {
    return {
      indice: 0,
      escala: 1,
      ZOOM_MIN,
      ZOOM_MAX,
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
    indiceInicialSeguro() {
      const total = this.imagenesOrdenadas.length;
      if (!total) return 0;
      const indice = Number(this.indiceInicial) || 0;
      return Math.min(Math.max(indice, 0), total - 1);
    },
    estiloImagen() {
      if (this.escala <= ZOOM_MIN) {
        return { width: "100%" };
      }
      return {
        width: `${this.escala * 100}%`,
        maxWidth: "none",
        maxHeight: "none",
      };
    },
  },
  watch: {
    modelValue(abierto) {
      if (abierto) {
        this.indice = this.indiceInicialSeguro;
        this.escala = 1;
      }
    },
    imagenes() {
      if (this.indice >= this.imagenesOrdenadas.length) this.indice = 0;
    },
    indice() {
      this.escala = 1;
      this.$nextTick(() => this.reiniciarScroll());
    },
  },
  methods: {
    reiniciarScroll() {
      const contenedor = this.$refs.zoom;
      if (!contenedor) return;
      contenedor.scrollTop = 0;
      contenedor.scrollLeft = 0;
    },
    cambiarEscala(valor) {
      const siguiente = Math.min(
        ZOOM_MAX,
        Math.max(ZOOM_MIN, Number(valor) || ZOOM_MIN)
      );
      this.escala = siguiente;
      if (siguiente === ZOOM_MIN) {
        this.$nextTick(() => this.reiniciarScroll());
      }
    },
    acercar() {
      this.cambiarEscala(this.escala + ZOOM_PASO);
    },
    alejar() {
      this.cambiarEscala(this.escala - ZOOM_PASO);
    },
    restablecerZoom() {
      this.cambiarEscala(ZOOM_MIN);
    },
    alRueda(evento) {
      if (!evento) return;
      const delta = evento.deltaY < 0 ? ZOOM_PASO : -ZOOM_PASO;
      this.cambiarEscala(this.escala + delta);
    },
    alternarZoom() {
      this.cambiarEscala(this.escala > ZOOM_MIN ? ZOOM_MIN : 2);
    },
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

.galeria-publicacion__zoom {
  overflow: auto;
  max-height: 68vh;
  background: var(--color-surface-muted);
  border-radius: 10px;
}

.galeria-publicacion__imagen {
  display: block;
  width: 100%;
  max-height: 68vh;
  margin: 0 auto;
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
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.65rem;
  width: 100%;
}

.galeria-publicacion__zoom-acciones {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.4rem;
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
