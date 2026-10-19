<template>
  <div class="moodboard">
    <template v-if="mostrarEncabezado">
      <p class="moodboard__titulo">Moodboard</p>
      <p class="moodboard__ayuda">
        Definí la inspiración del proyecto: paleta, materiales, inspiración (opcional).
      </p>
    </template>

    <DropzoneImagenes
      v-if="!soloLectura"
      :compacta="imagenes.length > 0"
      :deshabilitada="procesando"
      @agregar="alAgregarArchivos"
    />

    <VaAlert
      v-if="rechazadas.length > 0"
      color="#FEF3C7"
      icon="mso-warning"
      class="moodboard__rechazadas"
      :style="{ color: '#92400e' }"
    >
      <p class="moodboard__rechazadas-titulo">
        Algunas imágenes no se agregaron:
      </p>
      <ul class="moodboard__rechazadas-lista">
        <li v-for="(rechazada, i) in rechazadas" :key="i">
          {{ rechazada.motivo }}
        </li>
      </ul>
    </VaAlert>

    <div v-if="procesando" class="moodboard__procesando" role="status">
      <span class="moodboard__spinner" aria-hidden="true" />
      Validando imágenes…
    </div>

    <CollageMoodboard
      v-if="imagenes.length > 0"
      :imagenes="imagenes"
      :solo-lectura="soloLectura"
      @quitar="quitarImagen"
      @ampliar="galeriaAbierta = true"
    />

    <VaTextarea
      :model-value="modelValue"
      label="Descripción (opcional)"
      placeholder="Descripción del tablero..."
      :max-length="200"
      :disabled="soloLectura"
      counter
      :rows="3"
      :rules="[reglas.max200]"
      :error="!!error"
      :error-messages="errorMessages"
      @update:model-value="$emit('update:modelValue', $event)"
    />

    <ModalGaleriaMoodboard
      v-model="galeriaAbierta"
      :imagenes="imagenes"
      :solo-lectura="soloLectura"
      @quitar="quitarImagen"
    />
  </div>
</template>

<script>
import { reglasProyecto } from "../../utils/reglas.js";
import DropzoneImagenes from "./DropzoneImagenes.vue";
import CollageMoodboard from "./CollageMoodboard.vue";
import ModalGaleriaMoodboard from "./ModalGaleriaMoodboard.vue";
import {
  agregarImagenesMoodboard,
  crearItemImagen,
  revocarPreviews,
} from "../../utils/moodboardImagenes.js";

/*
 * Paso 4 del wizard (mockups CrearProyecto - Moodboard con/sin imagenes.png).
 * Las imágenes se retienen como previews locales en la vista padre
 * (`v-model:imagenes`): agregar/quitar es 100% UI (ficha UC-24 §7.1) y la
 * subida recién ocurre en Finalizar.
 */
export default {
  name: "MoodboardSeccion",
  components: {
    DropzoneImagenes,
    CollageMoodboard,
    ModalGaleriaMoodboard,
  },
  props: {
    modelValue: {
      type: String,
      default: "",
    },
    imagenes: {
      type: Array,
      default: () => [],
    },
    procesando: {
      type: Boolean,
      default: false,
    },
    error: {
      type: Boolean,
      default: false,
    },
    errorMessages: {
      type: [String, Array],
      default: "",
    },
    mostrarEncabezado: {
      type: Boolean,
      default: true,
    },
    /**
     * Modo edición (UC-36): las imágenes del moodboard no se modifican desde
     * este endpoint, así que se muestran en sólo lectura y sin dropzone.
     */
    soloLectura: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["update:modelValue", "update:imagenes", "update:procesando"],
  data() {
    return {
      reglas: reglasProyecto,
      rechazadas: [],
      galeriaAbierta: false,
    };
  },
  methods: {
    async alAgregarArchivos(archivos) {
      if (this.procesando) return;
      this.$emit("update:procesando", true);
      this.rechazadas = [];
      try {
        const existentes = this.imagenes.map((imagen) => imagen.archivo);
        const { validas, rechazadas } = await agregarImagenesMoodboard(
          existentes,
          archivos
        );
        this.rechazadas = rechazadas;
        if (validas.length > 0) {
          this.$emit("update:imagenes", [
            ...this.imagenes,
            ...validas.map(crearItemImagen),
          ]);
        }
      } finally {
        this.$emit("update:procesando", false);
      }
    },
    quitarImagen(indice) {
      const item = this.imagenes[indice];
      if (!item) return;
      revocarPreviews([item]);
      this.$emit(
        "update:imagenes",
        this.imagenes.filter((_, i) => i !== indice)
      );
      if (this.imagenes.length <= 1) this.galeriaAbierta = false;
    },
  },
};
</script>

<style scoped>
.moodboard {
  display: grid;
  gap: 1rem;
}

.moodboard__titulo {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--va-text-primary);
}

.moodboard__ayuda {
  margin: 0.2rem 0 0.75rem;
  font-size: 0.8rem;
  color: var(--va-secondary);
}

.moodboard__rechazadas {
  padding: 0.65rem 0.9rem;
}

.moodboard__rechazadas-titulo {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 600;
}

.moodboard__rechazadas-lista {
  margin: 0.25rem 0 0;
  padding-left: 1.1rem;
  font-size: 0.8rem;
}

.moodboard__rechazadas-lista li + li {
  margin-top: 0.15rem;
}

.moodboard__procesando {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.82rem;
  color: var(--color-text-muted);
}

.moodboard__spinner {
  width: 14px;
  height: 14px;
  border: 2px solid #c7d2fe;
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: moodboard-spinner 0.7s linear infinite;
}

@keyframes moodboard-spinner {
  to {
    transform: rotate(360deg);
  }
}
</style>
