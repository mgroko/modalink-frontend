<template>
  <div
    class="galeria-viewer"
    tabindex="0"
    aria-label="Galería de la publicación"
    @keydown.left.prevent="anterior"
    @keydown.right.prevent="siguiente"
  >
    <div class="galeria-viewer__visor">
      <div
        ref="zoom"
        class="galeria-viewer__zoom"
        @wheel.prevent="alRueda"
        @dblclick="alternarZoom"
      >
        <img
          v-if="imagenActual"
          class="galeria-viewer__imagen"
          :style="estiloImagen"
          :src="imagenActual"
          :alt="`${titulo || 'Publicación'} — foto ${indice + 1}`"
        />
        <span
          v-else
          class="material-symbols-outlined galeria-viewer__sin-imagen"
          aria-hidden="true"
        >
          image
        </span>
      </div>

      <span v-if="total > 1" class="galeria-viewer__contador">
        Foto {{ indice + 1 }} de {{ total }}
      </span>

      <div
        v-if="imagenActual"
        class="galeria-viewer__zoom-acciones"
        @click.stop
      >
        <button
          type="button"
          class="galeria-viewer__zoom-boton"
          aria-label="Alejar imagen"
          :disabled="escala <= ZOOM_MIN"
          @click="alejar"
        >
          <span class="material-symbols-outlined" aria-hidden="true">
            zoom_out
          </span>
        </button>
        <span class="galeria-viewer__zoom-nivel">
          {{ Math.round(escala * 100) }}%
        </span>
        <button
          type="button"
          class="galeria-viewer__zoom-boton"
          aria-label="Acercar imagen"
          :disabled="escala >= ZOOM_MAX"
          @click="acercar"
        >
          <span class="material-symbols-outlined" aria-hidden="true">
            zoom_in
          </span>
        </button>
        <button
          type="button"
          class="galeria-viewer__zoom-boton"
          aria-label="Restablecer zoom"
          :disabled="escala <= ZOOM_MIN"
          @click="restablecerZoom"
        >
          <span class="material-symbols-outlined" aria-hidden="true">
            restart_alt
          </span>
        </button>
      </div>

      <button
        v-if="total > 1"
        type="button"
        class="galeria-viewer__flecha galeria-viewer__flecha--anterior"
        aria-label="Foto anterior"
        @click.stop="anterior"
      >
        <span class="material-symbols-outlined" aria-hidden="true">
          chevron_left
        </span>
      </button>

      <button
        v-if="total > 1"
        type="button"
        class="galeria-viewer__flecha galeria-viewer__flecha--siguiente"
        aria-label="Foto siguiente"
        @click.stop="siguiente"
      >
        <span class="material-symbols-outlined" aria-hidden="true">
          chevron_right
        </span>
      </button>
    </div>

    <div v-if="total > 1" class="galeria-viewer__miniaturas">
      <button
        v-for="(imagen, posicion) in imagenesOrdenadas"
        :key="imagen.idImagen || posicion"
        type="button"
        class="galeria-viewer__miniatura"
        :class="{
          'galeria-viewer__miniatura--activa': posicion === indice,
        }"
        :aria-label="`Ver foto ${posicion + 1}`"
        :aria-pressed="posicion === indice ? 'true' : 'false'"
        @click.stop="seleccionar(posicion)"
      >
        <img :src="resolverImagen(imagen)" alt="" />
      </button>
    </div>
  </div>
</template>

<script>
import { resolverFotoUrl } from "../../utils/fotos.js";

const ZOOM_MIN = 1;
const ZOOM_MAX = 3;
const ZOOM_PASO = 0.25;

export default {
  name: "PublicacionGaleriaViewer",
  props: {
    imagenes: {
      type: Array,
      default: () => [],
    },
    titulo: {
      type: String,
      default: "",
    },
    indiceInicial: {
      type: Number,
      default: 0,
    },
  },
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
      return Array.isArray(this.imagenes)
        ? [...this.imagenes]
            .filter((imagen) => imagen?.url)
            .sort((a, b) => (Number(a.orden) || 0) - (Number(b.orden) || 0))
        : [];
    },
    total() {
      return this.imagenesOrdenadas.length;
    },
    imagenActual() {
      return resolverFotoUrl(this.imagenesOrdenadas[this.indice]?.url);
    },
    estiloImagen() {
      if (this.escala <= ZOOM_MIN) return {};
      return {
        width: `${this.escala * 100}%`,
        height: "auto",
        maxWidth: "none",
        maxHeight: "none",
      };
    },
  },
  watch: {
    indiceInicial: {
      immediate: true,
      handler(valor) {
        this.indice = this.indiceValido(valor);
      },
    },
    imagenes: {
      handler(nuevas, anteriores) {
        if (!anteriores?.length && nuevas?.length) {
          this.indice = this.indiceValido(this.indiceInicial);
          return;
        }
        this.indice = this.indiceValido(this.indice);
      },
    },
    indice() {
      this.escala = ZOOM_MIN;
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
    indiceValido(valor) {
      const numero = Number(valor);
      if (!Number.isInteger(numero) || numero < 0) return 0;
      if (!this.total) return 0;
      return Math.min(numero, this.total - 1);
    },
    resolverImagen(imagen) {
      return resolverFotoUrl(imagen?.url);
    },
    seleccionar(posicion) {
      if (posicion < 0 || posicion >= this.total) return;
      this.indice = posicion;
    },
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
.galeria-viewer {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  height: 100%;
  gap: 0.7rem;
  outline: none;
}

.galeria-viewer:focus-visible .galeria-viewer__visor {
  box-shadow: 0 0 0 2px var(--color-primary-light);
}

.galeria-viewer__visor {
  position: relative;
  display: grid;
  flex: 1 1 auto;
  min-height: 0;
  place-items: center;
  overflow: hidden;
  background: var(--color-surface-muted);
  border-radius: 14px;
}

.galeria-viewer__zoom {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: auto;
  scrollbar-width: thin;
}

.galeria-viewer__imagen {
  display: block;
  flex: 0 0 auto;
  width: 100%;
  height: 100%;
  margin: auto;
  border-radius: 10px;
  object-fit: contain;
}

.galeria-viewer__sin-imagen {
  margin: auto;
  color: var(--color-text-subtle);
  font-size: 2.5rem;
}

.galeria-viewer__zoom-acciones {
  position: absolute;
  right: 0.85rem;
  bottom: 0.85rem;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 0.15rem;
  padding: 0.2rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: 999px;
  box-shadow: 0 0.25rem 0.7rem rgba(35, 33, 52, 0.16);
}

.galeria-viewer__zoom-boton {
  display: grid;
  width: 1.9rem;
  height: 1.9rem;
  padding: 0;
  place-items: center;
  color: var(--color-text);
  background: transparent;
  border: none;
  border-radius: 50%;
  cursor: pointer;
}

.galeria-viewer__zoom-boton:hover:not(:disabled),
.galeria-viewer__zoom-boton:focus-visible {
  background: var(--color-surface-soft);
  outline: none;
}

.galeria-viewer__zoom-boton:disabled {
  cursor: default;
  opacity: 0.4;
}

.galeria-viewer__zoom-boton .material-symbols-outlined {
  font-size: 1.15rem;
}

.galeria-viewer__zoom-nivel {
  min-width: 2.9rem;
  color: var(--color-text-muted);
  font-size: 0.7rem;
  font-weight: 700;
  text-align: center;
}

.galeria-viewer__contador {
  position: absolute;
  top: 0.85rem;
  left: 0.85rem;
  padding: 0.2rem 0.6rem;
  color: var(--color-on-primary);
  background: rgba(35, 33, 52, 0.72);
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
}

.galeria-viewer__flecha {
  position: absolute;
  top: 50%;
  z-index: 2;
  display: grid;
  width: 2.4rem;
  height: 2.4rem;
  padding: 0;
  place-items: center;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: 50%;
  box-shadow: 0 0.25rem 0.7rem rgba(35, 33, 52, 0.16);
  cursor: pointer;
  opacity: 0.92;
  transform: translateY(-50%);
}

.galeria-viewer__flecha:hover,
.galeria-viewer__flecha:focus-visible {
  background: var(--color-surface-soft);
  outline: none;
  opacity: 1;
}

.galeria-viewer__flecha .material-symbols-outlined {
  font-size: 1.35rem;
}

.galeria-viewer__flecha--anterior {
  left: 0.75rem;
}

.galeria-viewer__flecha--siguiente {
  right: 0.75rem;
}

.galeria-viewer__miniaturas {
  display: flex;
  flex: 0 0 auto;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.15rem;
  scrollbar-width: thin;
}

.galeria-viewer__miniatura {
  flex: 0 0 4.4rem;
  width: 4.4rem;
  height: 4.4rem;
  padding: 0.12rem;
  overflow: hidden;
  background: var(--color-surface);
  border: 2px solid transparent;
  border-radius: 9px;
  cursor: pointer;
}

.galeria-viewer__miniatura img {
  width: 100%;
  height: 100%;
  border-radius: 6px;
  object-fit: cover;
}

.galeria-viewer__miniatura--activa {
  border-color: var(--color-primary);
}

.galeria-viewer__miniatura:hover,
.galeria-viewer__miniatura:focus-visible {
  border-color: var(--color-primary-light);
  outline: none;
}

@media (max-width: 760px) {
  .galeria-viewer__visor {
    max-height: 100%;
  }

  .galeria-viewer__miniatura {
    flex-basis: 3.5rem;
    width: 3.5rem;
    height: 3.5rem;
  }
}
</style>
