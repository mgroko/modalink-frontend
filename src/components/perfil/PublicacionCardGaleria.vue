<template>
  <article
    v-if="publicacion"
    class="publicacion-galeria"
  >
    <div
      class="publicacion-galeria__media"
      :style="estiloMedia"
    >
      <img
        v-if="imagenActual"
        :src="imagenActual"
        alt=""
        aria-hidden="true"
        class="publicacion-galeria__fondo"
      />

      <img
        v-if="imagenActual"
        :src="imagenActual"
        :alt="`${publicacion.titulo} — imagen ${indiceActual + 1}`"
        class="publicacion-galeria__imagen"
        @load="actualizarRelacion"
      />
      <span
        v-else
        class="material-symbols-outlined publicacion-galeria__sin-imagen"
        aria-hidden="true"
      >
        image
      </span>

      <button
        v-if="mostrarAccionBaja"
        type="button"
        class="publicacion-galeria__baja"
        :aria-label="etiquetaBaja"
        :title="etiquetaBaja"
        @click.stop="$emit('eliminar', publicacion)"
      >
        <span class="material-symbols-outlined" aria-hidden="true">
          delete
        </span>
      </button>

      <span
        v-if="totalImagenes > 1"
        class="publicacion-galeria__contador"
      >
        {{ indiceActual + 1 }}/{{ totalImagenes }}
      </span>

      <button
        v-if="totalImagenes > 1"
        type="button"
        class="publicacion-galeria__flecha publicacion-galeria__flecha--anterior"
        aria-label="Imagen anterior"
        @click.stop="anterior"
      >
        <span class="material-symbols-outlined" aria-hidden="true">
          chevron_left
        </span>
      </button>

      <button
        v-if="totalImagenes > 1"
        type="button"
        class="publicacion-galeria__flecha publicacion-galeria__flecha--siguiente"
        aria-label="Imagen siguiente"
        @click.stop="siguiente"
      >
        <span class="material-symbols-outlined" aria-hidden="true">
          chevron_right
        </span>
      </button>

      <div
        v-if="totalImagenes > 1"
        class="publicacion-galeria__puntos"
        role="tablist"
        aria-label="Seleccionar imagen"
        @click.stop
      >
        <button
          v-for="(imagen, indice) in imagenes"
          :key="imagen.idImagen || indice"
          type="button"
          class="publicacion-galeria__punto"
          :class="{
            'publicacion-galeria__punto--activo': indice === indiceActual,
          }"
          role="tab"
          :aria-selected="indice === indiceActual ? 'true' : 'false'"
          :aria-label="`Ir a la imagen ${indice + 1}`"
          @click.stop="seleccionar(indice)"
        ></button>
      </div>
    </div>

    <div
      v-if="totalImagenes > 1"
      class="publicacion-galeria__miniaturas"
      @click.stop
    >
      <button
        v-for="(imagen, indice) in imagenes"
        :key="imagen.idImagen || indice"
        type="button"
        class="publicacion-galeria__miniatura"
        :class="{
          'publicacion-galeria__miniatura--activa': indice === indiceActual,
        }"
        :aria-label="`Ver imagen ${indice + 1}`"
        :aria-pressed="indice === indiceActual ? 'true' : 'false'"
        @click.stop="seleccionar(indice)"
      >
        <img :src="resolverImagen(imagen)" alt="" />
      </button>
    </div>

    <div class="publicacion-galeria__cuerpo">
      <h3 class="publicacion-galeria__titulo">{{ publicacion.titulo }}</h3>

      <div class="publicacion-galeria__meta">
        <span v-if="ubicacionTexto" class="publicacion-galeria__dato">
          <span class="material-symbols-outlined" aria-hidden="true">
            location_on
          </span>
          {{ ubicacionTexto }}
        </span>
        <span v-if="fechaRelativa" class="publicacion-galeria__dato">
          <span class="material-symbols-outlined" aria-hidden="true">
            schedule
          </span>
          {{ fechaRelativa }}
        </span>
      </div>
    </div>
  </article>
</template>

<script>
import { resolverFotoUrl } from "../../utils/fotos.js";
import { formatearTiempoRelativo } from "../../utils/fechas.js";
import { formatUbicacionPublicacion } from "../../utils/ubicacion.js";
import {
  ACCIONES_BAJA_PUBLICACION,
  accionBajaPublicacion,
  etiquetaAccionBaja,
} from "../../utils/publicacionConstants.js";
import { idPerfilActivo } from "../../services/authState";

export default {
  name: "PublicacionCardGaleria",
  props: {
    publicacion: {
      type: Object,
      default: null,
    },
    mostrarAccionesBaja: {
      type: Boolean,
      default: false,
    },
    permitirBajaColaborador: {
      type: Boolean,
      default: true,
    },
  },
  emits: ["eliminar"],
  data() {
    return {
      indiceActual: 0,
      relacionAspecto: null,
    };
  },
  computed: {
    imagenes() {
      return Array.isArray(this.publicacion?.imagenes)
        ? [...this.publicacion.imagenes].sort(
            (a, b) => (Number(a.orden) || 0) - (Number(b.orden) || 0)
          )
        : [];
    },
    totalImagenes() {
      return this.imagenes.length;
    },
    imagenActual() {
      const imagen = this.imagenes[this.indiceActual];
      return resolverFotoUrl(imagen?.url);
    },
    fechaRelativa() {
      return formatearTiempoRelativo(this.publicacion?.fechaPublicacion);
    },
    ubicacionTexto() {
      return formatUbicacionPublicacion(this.publicacion?.ubicacion);
    },
    estiloMedia() {
      return this.relacionAspecto
        ? { aspectRatio: String(this.relacionAspecto) }
        : {};
    },
    accionBaja() {
      return accionBajaPublicacion(this.publicacion, idPerfilActivo());
    },
    mostrarAccionBaja() {
      if (!this.mostrarAccionesBaja || !this.accionBaja) return false;
      if (
        this.accionBaja === ACCIONES_BAJA_PUBLICACION.COLABORADOR &&
        !this.permitirBajaColaborador
      ) {
        return false;
      }
      return true;
    },
    etiquetaBaja() {
      return etiquetaAccionBaja(this.accionBaja);
    },
  },
  watch: {
    "publicacion.idPublicacion"() {
      this.indiceActual = 0;
      this.relacionAspecto = null;
    },
  },
  methods: {
    actualizarRelacion(event) {
      const imagen = event?.target;
      if (!imagen?.naturalWidth || !imagen?.naturalHeight) return;
      const relacion = imagen.naturalWidth / imagen.naturalHeight;
      this.relacionAspecto = Math.min(Math.max(relacion, 0.5), 2.5);
    },
    resolverImagen(imagen) {
      return resolverFotoUrl(imagen?.url);
    },
    seleccionar(indice) {
      if (indice < 0 || indice >= this.totalImagenes) return;
      this.indiceActual = indice;
    },
    anterior() {
      if (!this.totalImagenes) return;
      this.indiceActual =
        (this.indiceActual - 1 + this.totalImagenes) % this.totalImagenes;
    },
    siguiente() {
      if (!this.totalImagenes) return;
      this.indiceActual = (this.indiceActual + 1) % this.totalImagenes;
    },
  },
};
</script>

<style scoped>
.publicacion-galeria {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  cursor: default;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.15s ease;
}

.publicacion-galeria:hover,
.publicacion-galeria:focus-visible {
  border-color: var(--color-primary-light);
  box-shadow: 0 0.55rem 1.5rem rgba(35, 33, 52, 0.1);
  outline: none;
  transform: translateY(-1px);
}

.publicacion-galeria__media {
  position: relative;
  display: grid;
  width: 100%;
  aspect-ratio: 16 / 9;
  max-height: 480px;
  place-items: center;
  overflow: hidden;
  background: var(--color-surface-muted);
  cursor: default;
}

.publicacion-galeria__fondo {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: blur(22px) brightness(0.82) saturate(1.05);
  transform: scale(1.12);
  pointer-events: none;
}

.publicacion-galeria__imagen {
  position: relative;
  z-index: 1;
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.publicacion-galeria__sin-imagen {
  color: var(--color-text-subtle);
  font-size: 2.5rem;
}

.publicacion-galeria__baja {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  z-index: 3;
  display: grid;
  width: 2.1rem;
  height: 2.1rem;
  padding: 0;
  place-items: center;
  color: var(--color-danger-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: 50%;
  box-shadow: 0 0.2rem 0.6rem rgba(35, 33, 52, 0.16);
  cursor: pointer;
}

.publicacion-galeria__baja:hover,
.publicacion-galeria__baja:focus-visible {
  color: var(--color-danger-text);
  background: var(--color-danger-soft);
  border-color: var(--color-danger-border);
  outline: none;
}

.publicacion-galeria__baja .material-symbols-outlined {
  font-size: 1.1rem;
}

.publicacion-galeria__contador {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  z-index: 2;
  padding: 0.18rem 0.55rem;
  color: var(--color-on-primary);
  background: rgba(35, 33, 52, 0.72);
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.publicacion-galeria__flecha {
  position: absolute;
  top: 50%;
  z-index: 2;
  display: grid;
  width: 2.2rem;
  height: 2.2rem;
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
  transition:
    opacity 0.15s ease,
    background 0.15s ease;
}

.publicacion-galeria__flecha:hover,
.publicacion-galeria__flecha:focus-visible {
  background: var(--color-surface-soft);
  outline: none;
  opacity: 1;
}

.publicacion-galeria__flecha .material-symbols-outlined {
  font-size: 1.35rem;
}

.publicacion-galeria__flecha--anterior {
  left: 0.7rem;
}

.publicacion-galeria__flecha--siguiente {
  right: 0.7rem;
}

.publicacion-galeria__puntos {
  position: absolute;
  right: 0;
  bottom: 0.8rem;
  left: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.3rem;
  pointer-events: auto;
}

.publicacion-galeria__punto {
  width: 0.42rem;
  height: 0.42rem;
  padding: 0;
  background: rgba(255, 255, 255, 0.62);
  border: 0;
  border-radius: 50%;
  box-shadow: 0 0 0 1px rgba(35, 33, 52, 0.12);
  cursor: pointer;
  transition:
    background 0.15s ease,
    transform 0.15s ease;
}

.publicacion-galeria__punto--activo {
  background: var(--color-primary);
  transform: scale(1.18);
}

.publicacion-galeria__miniaturas {
  display: flex;
  gap: 0.45rem;
  overflow-x: auto;
  padding: 0.7rem 0.85rem 0.2rem;
  scrollbar-width: thin;
}

.publicacion-galeria__miniatura {
  flex: 0 0 calc((100% - 1.35rem) / 4);
  width: calc((100% - 1.35rem) / 4);
  aspect-ratio: 1 / 1;
  padding: 0.12rem;
  overflow: hidden;
  background: var(--color-surface);
  border: 2px solid transparent;
  border-radius: 9px;
  cursor: pointer;
}

.publicacion-galeria__miniatura img {
  width: 100%;
  height: 100%;
  border-radius: 5px;
  object-fit: cover;
}

.publicacion-galeria__miniatura--activa {
  border-color: var(--color-primary);
}

.publicacion-galeria__miniatura:hover,
.publicacion-galeria__miniatura:focus-visible {
  border-color: var(--color-primary-light);
  outline: none;
}

.publicacion-galeria__cuerpo {
  display: grid;
  gap: 0.35rem;
  padding: 0.75rem 0.9rem 1rem;
}

.publicacion-galeria__titulo {
  display: -webkit-box;
  overflow: hidden;
  margin: 0;
  color: var(--color-text);
  font-size: 0.98rem;
  font-weight: 700;
  line-height: 1.35;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.publicacion-galeria__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.35rem 0.8rem;
}

.publicacion-galeria__dato {
  display: inline-flex;
  align-items: center;
  gap: 0.22rem;
  min-width: 0;
  overflow: hidden;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.publicacion-galeria__dato .material-symbols-outlined {
  flex: 0 0 auto;
  color: var(--color-primary);
  font-size: 0.95rem;
}

@media (max-width: 620px) {
  .publicacion-galeria__media {
    aspect-ratio: 16 / 9;
    max-height: 360px;
  }

  .publicacion-galeria__miniatura {
    flex-basis: calc((100% - 1.35rem) / 4);
    width: calc((100% - 1.35rem) / 4);
  }
}
</style>
