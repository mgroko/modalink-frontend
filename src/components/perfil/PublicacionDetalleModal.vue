<template>
  <VaModal
    :model-value="modelValue"
    hide-default-actions
    size="large"
    blur
    class="detalle-publicacion"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <article v-if="publicacion" class="detalle-publicacion__contenido">
      <header class="detalle-publicacion__autor">
        <span class="detalle-publicacion__avatar">
          <img
            v-if="autorFoto"
            :src="autorFoto"
            :alt="autorNombre"
            class="detalle-publicacion__avatar-img"
          />
          <span v-else>{{ inicialesAutor }}</span>
        </span>

        <div class="detalle-publicacion__autor-datos">
          <strong>{{ autorNombre }}</strong>
          <span>
            {{ autorProfesion }}
            <template v-if="fechaRelativa"> · {{ fechaRelativa }}</template>
          </span>
        </div>
      </header>

      <h2 class="detalle-publicacion__titulo">{{ publicacion.titulo }}</h2>

      <div
        v-if="ubicacionTexto || publicacion.proyecto"
        class="detalle-publicacion__meta"
      >
        <span v-if="ubicacionTexto" class="detalle-publicacion__meta-item">
          <span class="material-symbols-outlined">location_on</span>
          {{ ubicacionTexto }}
        </span>
        <span
          v-if="publicacion.proyecto"
          class="detalle-publicacion__meta-item"
        >
          <span class="material-symbols-outlined">folder</span>
          Proyecto: {{ publicacion.proyecto.nombre }}
        </span>
      </div>

      <div
        v-if="imagenes.length"
        class="detalle-publicacion__collage"
        :class="`detalle-publicacion__collage--${imagenesVisibles.length}`"
        role="button"
        tabindex="0"
        aria-label="Abrir visor de imágenes"
        @click="$emit('abrir-galeria', publicacion)"
        @keydown.enter.prevent="$emit('abrir-galeria', publicacion)"
        @keydown.space.prevent="$emit('abrir-galeria', publicacion)"
      >
        <figure
          v-for="(imagen, indice) in imagenesVisibles"
          :key="imagen.idImagen || indice"
          class="detalle-publicacion__figura"
        >
          <img
            class="detalle-publicacion__imagen"
            :src="resolverImagen(imagen)"
            :alt="`${publicacion.titulo} — imagen ${indice + 1}`"
          />
          <span
            v-if="indice === imagenesVisibles.length - 1 && imagenesRestantes > 0"
            class="detalle-publicacion__mas"
          >
            +{{ imagenesRestantes }}
          </span>
        </figure>
      </div>

      <div v-if="publicacion.descripcion" class="detalle-publicacion__descripcion">
        <p :class="{ 'detalle-publicacion__texto--expandido': expandida }">
          {{ publicacion.descripcion }}
        </p>
        <button
          v-if="descripcionLarga"
          type="button"
          class="detalle-publicacion__ver-mas"
          :aria-expanded="expandida ? 'true' : 'false'"
          @click="expandida = !expandida"
        >
          {{ expandida ? "ver menos" : "ver más" }}
        </button>
      </div>
    </article>

    <template #footer>
      <div class="detalle-publicacion__acciones">
        <VaButton preset="secondary" @click="$emit('update:modelValue', false)">
          Cerrar
        </VaButton>
        <VaButton
          v-if="proyectoVisible"
          color="primary"
          icon-right="mso-arrow_forward"
          @click="$emit('ver-proyecto', publicacion.proyecto)"
        >
          Ver proyecto
        </VaButton>
      </div>
    </template>
  </VaModal>
</template>

<script>
import { resolverFotoUrl } from "../../utils/fotos.js";
import { formatearTiempoRelativo } from "../../utils/fechas.js";
import { formatUbicacionPublicacion } from "../../utils/ubicacion.js";

export default {
  name: "PublicacionDetalleModal",
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    publicacion: {
      type: Object,
      default: null,
    },
  },
  emits: ["update:modelValue", "abrir-galeria", "ver-proyecto"],
  data() {
    return {
      expandida: false,
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
    imagenesVisibles() {
      return this.imagenes.slice(0, 2);
    },
    imagenesRestantes() {
      return Math.max(0, this.imagenes.length - this.imagenesVisibles.length);
    },
    autorNombre() {
      return (
        this.publicacion?.autor?.nombreArtistico ||
        this.publicacion?.autor?.nombre ||
        "Perfil"
      );
    },
    autorProfesion() {
      return this.publicacion?.autor?.profesion || "Profesional";
    },
    autorFoto() {
      return resolverFotoUrl(this.publicacion?.autor?.fotoUrl);
    },
    inicialesAutor() {
      return this.autorNombre
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((parte) => parte.charAt(0).toUpperCase())
        .join("");
    },
    fechaRelativa() {
      return formatearTiempoRelativo(this.publicacion?.fechaPublicacion);
    },
    ubicacionTexto() {
      return formatUbicacionPublicacion(this.publicacion?.ubicacion);
    },
    proyectoVisible() {
      return this.publicacion?.proyecto?.puedeVerProyecto === true;
    },
    descripcionLarga() {
      return String(this.publicacion?.descripcion || "").length > 240;
    },
  },
  watch: {
    "publicacion.idPublicacion"() {
      this.expandida = false;
    },
    modelValue(abierto) {
      if (abierto) this.expandida = false;
    },
  },
  methods: {
    resolverImagen(imagen) {
      return resolverFotoUrl(imagen?.url);
    },
  },
};
</script>

<style scoped>
.detalle-publicacion__contenido {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.detalle-publicacion__autor {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}

.detalle-publicacion__avatar {
  display: grid;
  width: 2.8rem;
  height: 2.8rem;
  flex: 0 0 2.8rem;
  place-items: center;
  overflow: hidden;
  color: var(--color-on-primary);
  background: var(--color-primary);
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 700;
}

.detalle-publicacion__avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detalle-publicacion__autor-datos {
  display: grid;
  gap: 0.1rem;
}

.detalle-publicacion__autor-datos strong {
  color: var(--color-text);
  font-size: 0.9rem;
}

.detalle-publicacion__autor-datos span {
  color: var(--color-text-muted);
  font-size: 0.76rem;
}

.detalle-publicacion__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1.35rem;
  font-weight: 750;
  line-height: 1.25;
}

.detalle-publicacion__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem 1.25rem;
}

.detalle-publicacion__meta-item {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.detalle-publicacion__meta-item .material-symbols-outlined {
  font-size: 1rem;
  color: var(--color-primary);
}

.detalle-publicacion__collage {
  display: grid;
  gap: 0.5rem;
  height: 340px;
  margin-top: 0.15rem;
  border-radius: 10px;
  cursor: zoom-in;
}

.detalle-publicacion__collage--1 {
  grid-template-columns: 1fr;
}

.detalle-publicacion__collage--2 {
  grid-template-columns: repeat(2, 1fr);
}

.detalle-publicacion__figura {
  position: relative;
  min-width: 0;
  min-height: 0;
  margin: 0;
}

.detalle-publicacion__imagen {
  width: 100%;
  height: 100%;
  border-radius: 10px;
  object-fit: cover;
  background: var(--color-surface-muted);
}

.detalle-publicacion__mas {
  position: absolute;
  right: 0.65rem;
  bottom: 0.65rem;
  display: grid;
  min-width: 2.4rem;
  height: 2.4rem;
  padding: 0 0.45rem;
  place-items: center;
  color: var(--color-on-primary);
  background: rgba(35, 33, 52, 0.8);
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 700;
}

.detalle-publicacion__descripcion {
  display: grid;
  gap: 0.25rem;
}

.detalle-publicacion__descripcion p {
  display: -webkit-box;
  overflow: hidden;
  margin: 0;
  color: var(--color-text);
  font-size: 0.86rem;
  line-height: 1.55;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.detalle-publicacion__descripcion p.detalle-publicacion__texto--expandido {
  display: block;
  overflow: visible;
  -webkit-line-clamp: unset;
}

.detalle-publicacion__ver-mas {
  width: fit-content;
  padding: 0;
  color: var(--color-primary);
  background: none;
  border: 0;
  font: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.detalle-publicacion__ver-mas:hover {
  text-decoration: underline;
}

.detalle-publicacion__acciones {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.65rem;
  width: 100%;
}

@media (max-width: 560px) {
  .detalle-publicacion__collage {
    height: 260px;
  }

  .detalle-publicacion__acciones {
    flex-direction: column-reverse;
  }
}
</style>
