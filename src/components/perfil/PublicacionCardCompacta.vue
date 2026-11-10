<template>
  <article
    class="publicacion-compacta"
    role="button"
    tabindex="0"
    :aria-label="`Ver publicación: ${publicacion.titulo}`"
    @click="$emit('abrir', publicacion)"
    @keydown.enter.prevent="$emit('abrir', publicacion)"
    @keydown.space.prevent="$emit('abrir', publicacion)"
  >
    <div class="publicacion-compacta__media">
      <img
        v-if="portada"
        :src="portada"
        :alt="publicacion.titulo"
        class="publicacion-compacta__img"
      />
      <span v-else class="material-symbols-outlined publicacion-compacta__sin-imagen">
        image
      </span>

      <span v-if="imagenesRestantes > 0" class="publicacion-compacta__mas">
        +{{ imagenesRestantes }}
      </span>
    </div>

    <div class="publicacion-compacta__cuerpo">
      <h3 class="publicacion-compacta__titulo">{{ publicacion.titulo }}</h3>
      <p class="publicacion-compacta__fecha">
        {{ fechaRelativa }}
      </p>
    </div>
  </article>
</template>

<script>
import { resolverFotoUrl } from "../../utils/fotos.js";
import { formatearTiempoRelativo } from "../../utils/fechas.js";

export default {
  name: "PublicacionCardCompacta",
  props: {
    publicacion: {
      type: Object,
      required: true,
    },
  },
  emits: ["abrir"],
  computed: {
    imagenes() {
      return Array.isArray(this.publicacion?.imagenes)
        ? this.publicacion.imagenes
        : [];
    },
    portada() {
      return resolverFotoUrl(this.imagenes[0]?.url);
    },
    imagenesRestantes() {
      return Math.max(0, this.imagenes.length - 1);
    },
    fechaRelativa() {
      return formatearTiempoRelativo(this.publicacion?.fechaPublicacion);
    },
  },
};
</script>

<style scoped>
.publicacion-compacta {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
}

.publicacion-compacta:hover,
.publicacion-compacta:focus-visible {
  border-color: var(--color-primary-light);
  box-shadow: 0 0.4rem 1.2rem rgba(35, 33, 52, 0.08);
  outline: none;
  transform: translateY(-1px);
}

.publicacion-compacta__media {
  position: relative;
  display: grid;
  min-height: 180px;
  max-height: 220px;
  place-items: center;
  overflow: hidden;
  background: var(--color-surface-muted);
}

.publicacion-compacta__img {
  width: 100%;
  height: 100%;
  min-height: 180px;
  max-height: 220px;
  object-fit: cover;
}

.publicacion-compacta__sin-imagen {
  color: var(--color-text-subtle);
  font-size: 2rem;
}

.publicacion-compacta__mas {
  position: absolute;
  right: 0.6rem;
  bottom: 0.6rem;
  display: grid;
  min-width: 2rem;
  height: 2rem;
  padding: 0 0.4rem;
  place-items: center;
  color: var(--color-on-primary);
  background: rgba(35, 33, 52, 0.78);
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
}

.publicacion-compacta__cuerpo {
  display: grid;
  gap: 0.3rem;
  padding: 0.85rem 0.9rem 0.95rem;
}

.publicacion-compacta__titulo {
  overflow: hidden;
  margin: 0;
  color: var(--color-text);
  font-size: 0.85rem;
  font-weight: 600;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.publicacion-compacta__fecha {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.74rem;
}
</style>
