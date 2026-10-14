<template>
  <div class="collage">
    <div class="collage__encabezado">
      <div class="collage__encabezado-izq">
        <span class="collage__titulo">Previsualización</span>
        <span class="collage__contador-chip">{{ imagenes.length }} imágenes</span>
      </div>
      <button
        type="button"
        class="collage__ampliar"
        title="Ampliar vista"
        @click="$emit('ampliar')"
      >
        <span class="material-symbols-outlined" aria-hidden="true">open_in_full</span>
        Ampliar vista
      </button>
    </div>

    <div class="collage__grid" :class="`collage__grid--${columnas}`">
      <img
        v-for="imagen in imagenes"
        :key="imagen.id"
        class="collage__img"
        :src="imagen.preview"
        :alt="imagen.nombre"
        :title="imagen.nombre"
        @click="$emit('ampliar')"
        @keydown.enter="$emit('ampliar')"
      />
    </div>

    <div class="collage__pie" :class="{ 'collage__pie--solo': soloLectura }">
      <span v-if="!soloLectura" class="collage__pie-ok">
        <span class="material-symbols-outlined" aria-hidden="true">check_circle</span>
        El collage se actualiza al agregar imágenes.
      </span>
      <span class="collage__pie-contador">
        {{ imagenes.length }} de {{ maximo }} imágenes
      </span>
    </div>

    <ul class="collage__chips">
      <li v-for="(imagen, i) in imagenes" :key="imagen.id" class="collage__chip">
        <span class="collage__chip-nombre" :title="imagen.nombre">
          {{ imagen.nombre }}
        </span>
        <button
          v-if="!soloLectura"
          type="button"
          class="collage__chip-quitar"
          :title="`Quitar ${imagen.nombre}`"
          :aria-label="`Quitar ${imagen.nombre}`"
          @click="$emit('quitar', i)"
        >
          <span class="material-symbols-outlined" aria-hidden="true">close</span>
        </button>
      </li>
    </ul>
  </div>
</template>

<script>
import { MOODBOARD_IMAGENES } from "../../utils/proyectoConstants.js";

/*
 * Previsualización del moodboard (mockup CrearProyecto - Moodboard con
 * imagenes.png): grid uniforme de altura fija, chips con ✕ y contadores.
 * Sólo lee `imagenes` (items con preview blob) y notifica quitar/ampliar.
 */
export default {
  name: "CollageMoodboard",
  props: {
    imagenes: {
      type: Array,
      default: () => [],
    },
    /*
     * Vista de detalle del proyecto (sólo lectura): oculta el aviso de
     * previsualización y los botones ✕ de los chips, que no aplican.
     */
    soloLectura: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["quitar", "ampliar"],
  computed: {
    maximo() {
      return MOODBOARD_IMAGENES.MAX_IMAGENES;
    },
    columnas() {
      const n = this.imagenes.length;
      if (n <= 1) return 1;
      if (n <= 3) return 2;
      return 3;
    },
  },
};
</script>

<style scoped>
.collage {
  display: grid;
  gap: 0.65rem;
}

.collage__encabezado {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.collage__encabezado-izq {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.collage__titulo {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text);
}

.collage__contador-chip {
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  background: #eef2ff;
  color: var(--color-primary);
  font-size: 0.75rem;
  font-weight: 600;
}

.collage__ampliar {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0;
  border: none;
  background: none;
  color: var(--color-secondary);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}

.collage__ampliar:hover {
  color: var(--color-secondary-dark);
  text-decoration: underline;
}

.collage__ampliar .material-symbols-outlined {
  font-size: 1rem;
}

.collage__grid {
  display: grid;
  gap: 0.5rem;
  height: 380px;
}

.collage__grid--1 {
  grid-template-columns: 1fr;
}

.collage__grid--2 {
  grid-template-columns: repeat(2, 1fr);
}

.collage__grid--3 {
  grid-template-columns: repeat(3, 1fr);
}

.collage__img {
  width: 100%;
  height: 100%;
  min-height: 0;
  border-radius: 8px;
  object-fit: cover;
  background: #f3f4f6;
  cursor: zoom-in;
}

.collage__pie {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.collage__pie--solo {
  justify-content: flex-end;
}

.collage__pie-ok {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.collage__pie-ok .material-symbols-outlined {
  font-size: 1rem;
  color: #16a34a;
}

.collage__pie-contador {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.collage__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.collage__chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  max-width: 220px;
  padding: 0.35rem 0.5rem 0.35rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
}

.collage__chip-nombre {
  overflow: hidden;
  font-size: 0.78rem;
  color: var(--color-text);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.collage__chip-quitar {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: none;
  color: var(--color-text-muted);
  cursor: pointer;
}

.collage__chip-quitar:hover {
  color: #b91c1c;
}

.collage__chip-quitar .material-symbols-outlined {
  font-size: 1rem;
}
</style>
