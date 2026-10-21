<template>
  <VaModal
    :model-value="modelValue"
    hide-default-actions
    blur
    size="large"
    class="galeria-moodboard-modal"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #header>
      <div class="galeria-moodboard-modal__header">
        <h3 class="va-h5 galeria-moodboard-modal__titulo">
          Ampliar vista
        </h3>
        <span class="galeria-moodboard-modal__contador">
          {{ imagenes.length }} de {{ maximo }} imágenes
        </span>
      </div>
    </template>

    <div class="galeria-moodboard-modal__grid">
      <figure
        v-for="(imagen, i) in imagenes"
        :key="imagen.id"
        class="galeria-moodboard-modal__item"
      >
        <img
          class="galeria-moodboard-modal__img"
          :src="imagen.preview"
          :alt="imagen.nombre"
        />
        <button
          v-if="!soloLectura"
          type="button"
          class="galeria-moodboard-modal__quitar"
          :title="`Quitar ${imagen.nombre}`"
          :aria-label="`Quitar ${imagen.nombre}`"
          @click="$emit('quitar', i)"
        >
          <span class="material-symbols-outlined" aria-hidden="true">close</span>
        </button>
        <figcaption class="galeria-moodboard-modal__nombre">
          {{ imagen.nombre }}
        </figcaption>
      </figure>
    </div>

    <template #footer>
      <div class="galeria-moodboard-modal__acciones">
        <VaButton preset="primary" @click="$emit('update:modelValue', false)">
          Cerrar
        </VaButton>
      </div>
    </template>
  </VaModal>
</template>

<script>
import { MOODBOARD_IMAGENES } from "../../utils/proyectoConstants.js";

/*
 * "Ampliar vista" (mockup CrearProyecto - Moodboard con imagenes.png):
 * galería ampliada con ✕ por imagen (decisión de diseño), consistente
 * con los chips del collage. La eliminación vive en el padre.
 */
export default {
  name: "ModalGaleriaMoodboard",
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    imagenes: {
      type: Array,
      default: () => [],
    },
    /*
     * Vista de detalle del proyecto (sólo lectura): oculta los botones ✕,
     * que no aplican fuera del wizard de creación.
     */
    soloLectura: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["update:modelValue", "quitar"],
  computed: {
    maximo() {
      return MOODBOARD_IMAGENES.MAX_IMAGENES;
    },
  },
};
</script>

<style scoped>
.galeria-moodboard-modal__header {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
}

.galeria-moodboard-modal__titulo {
  margin: 0;
}

.galeria-moodboard-modal__contador {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.galeria-moodboard-modal__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.85rem;
  max-height: 65vh;
  overflow-y: auto;
}

.galeria-moodboard-modal__item {
  position: relative;
  margin: 0;
}

.galeria-moodboard-modal__img {
  width: 100%;
  height: 180px;
  border-radius: 8px;
  object-fit: cover;
  background: var(--color-surface-muted);
}

.galeria-moodboard-modal__quitar {
  position: absolute;
  top: 0.4rem;
  right: 0.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: rgba(35, 33, 52, 0.75);
  color: #fff;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.galeria-moodboard-modal__quitar:hover {
  background: var(--color-danger);
}

.galeria-moodboard-modal__quitar .material-symbols-outlined {
  font-size: 1rem;
}

.galeria-moodboard-modal__nombre {
  overflow: hidden;
  margin-top: 0.3rem;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.galeria-moodboard-modal__acciones {
  display: flex;
  justify-content: flex-end;
  width: 100%;
}
</style>
