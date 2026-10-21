<template>
  <div
    class="dropzone"
    :class="{
      'dropzone--compacta': compacta,
      'dropzone--activa': arrastrando,
      'dropzone--deshabilitada': deshabilitada,
    }"
    @dragover.prevent="arrastrando = true"
    @dragleave.prevent="alSalirArrastre"
    @drop.prevent="alSoltar"
  >
    <span class="dropzone__icono material-symbols-outlined" aria-hidden="true">
      upload
    </span>

    <template v-if="compacta">
      <div class="dropzone__textos">
        <p class="dropzone__titulo">Arrastra más imágenes aquí</p>
        <p class="dropzone__ayuda">JPG, PNG o WEBP · Hasta 10 MB por imagen</p>
      </div>
      <VaButton
        preset="primary"
        icon="mso-folder_open"
        :disabled="deshabilitada"
        @click="seleccionar"
      >
        Seleccionar archivos
      </VaButton>
    </template>

    <template v-else>
      <p class="dropzone__titulo">Arrastra y suelta tus imágenes aquí</p>
      <p class="dropzone__subtitulo">o selecciónalas desde tu equipo</p>
      <VaButton
        preset="primary"
        icon="mso-folder_open"
        :disabled="deshabilitada"
        @click="seleccionar"
      >
        Seleccionar archivos
      </VaButton>
      <p class="dropzone__ayuda">
        JPG, PNG o WEBP · Hasta 10 MB por imagen · Máximo 10 imágenes
      </p>
    </template>

    <input
      ref="input"
      class="dropzone__input"
      type="file"
      multiple
      accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
      :disabled="deshabilitada"
      @change="alSeleccionar"
    />
  </div>
</template>

<script>
/*
 * Dropzone del moodboard (ficha UC-24 §7.5): DnD nativo sin librerías.
 * Sólo entrega File[] al padre — la validación y las previews viven en
 * MoodboardSeccion. Compacta = hay imágenes (mockup "con imagenes").
 */
export default {
  name: "DropzoneImagenes",
  props: {
    compacta: {
      type: Boolean,
      default: false,
    },
    deshabilitada: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["agregar"],
  data() {
    return {
      arrastrando: false,
    };
  },
  methods: {
    seleccionar() {
      if (this.deshabilitada) return;
      this.$refs.input?.click();
    },
    alSeleccionar(evento) {
      const archivos = Array.from(evento.target.files || []);
      if (archivos.length > 0) this.$emit("agregar", archivos);
      evento.target.value = "";
    },
    alSoltar(evento) {
      this.arrastrando = false;
      if (this.deshabilitada) return;
      const archivos = Array.from(evento.dataTransfer?.files || []);
      if (archivos.length > 0) this.$emit("agregar", archivos);
    },
    alSalirArrastre(evento) {
      if (evento.currentTarget.contains(evento.relatedTarget)) return;
      this.arrastrando = false;
    },
  },
};
</script>

<style scoped>
.dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.65rem;
  padding: 2rem 1.5rem;
  border: 2px dashed var(--color-info-border);
  border-radius: 12px;
  background: var(--color-surface-soft);
  text-align: center;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.dropzone--activa {
  border-color: var(--color-primary);
  background: var(--color-info-soft);
}

.dropzone--deshabilitada {
  opacity: 0.6;
  pointer-events: none;
}

.dropzone__icono {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: var(--color-surface);
  color: var(--color-primary);
  font-size: 1.5rem;
}

.dropzone__titulo {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
}

.dropzone__subtitulo {
  margin: 0;
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.dropzone__ayuda {
  margin: 0;
  font-size: 0.78rem;
  color: var(--color-text-muted);
}

.dropzone--compacta {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 1.25rem;
  text-align: left;
}

.dropzone--compacta .dropzone__icono {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  font-size: 1.3rem;
}

.dropzone--compacta .dropzone__textos {
  flex: 1;
}

.dropzone--compacta .dropzone__titulo {
  font-size: 0.9rem;
}

.dropzone--compacta .dropzone__ayuda {
  margin-top: 0.15rem;
}

.dropzone__input {
  display: none;
}
</style>
