<template>
  <VaModal
    :model-value="modelValue"
    hide-default-actions
    :no-dismiss="eliminando"
    blur
    size="small"
    class="eliminar-publicacion"
    @update:model-value="cambiarVisibilidad"
  >
    <template #header>
      <h3 class="va-h5 eliminar-publicacion__titulo">{{ titulo }}</h3>
    </template>

    <div class="eliminar-publicacion__contenido">
      <div class="eliminar-publicacion__resumen">
        <div class="eliminar-publicacion__portada">
          <img
            v-if="portada"
            :src="portada"
            :alt="publicacion?.titulo || 'Publicación'"
          />
          <span v-else class="material-symbols-outlined" aria-hidden="true">
            image
          </span>
        </div>
        <strong>{{ publicacion?.titulo || "esta publicación" }}</strong>
      </div>

      <p class="eliminar-publicacion__intro">{{ textoIntro }}</p>
      <p class="eliminar-publicacion__aviso">{{ textoAviso }}</p>

      <BaseAlert v-if="error" :message="error" type="error" />
    </div>

    <template #footer>
      <div class="eliminar-publicacion__acciones">
        <VaButton
          preset="secondary"
          :disabled="eliminando"
          @click="cerrar"
        >
          Cancelar
        </VaButton>
        <VaButton
          color="danger"
          :loading="eliminando"
          :disabled="eliminando"
          :aria-busy="eliminando ? 'true' : 'false'"
          @click="$emit('confirmar')"
        >
          {{ textoConfirmar }}
        </VaButton>
      </div>
    </template>
  </VaModal>
</template>

<script>
import BaseAlert from "../AlertaBase.vue";
import { resolverFotoUrl } from "../../utils/fotos.js";
import {
  ACCIONES_BAJA_PUBLICACION,
  etiquetaAccionBaja,
} from "../../utils/publicacionConstants.js";

export default {
  name: "ModalEliminarPublicacion",
  components: { BaseAlert },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    publicacion: {
      type: Object,
      default: null,
    },
    modo: {
      type: String,
      default: ACCIONES_BAJA_PUBLICACION.DUENO,
    },
    eliminando: {
      type: Boolean,
      default: false,
    },
    error: {
      type: String,
      default: "",
    },
  },
  emits: ["update:modelValue", "confirmar"],
  computed: {
    esDueno() {
      return this.modo === ACCIONES_BAJA_PUBLICACION.DUENO;
    },
    titulo() {
      return this.esDueno ? "Eliminar publicación" : "Quitar de mi perfil";
    },
    textoConfirmar() {
      return etiquetaAccionBaja(this.modo);
    },
    portada() {
      const url =
        this.publicacion?.portadaUrl ||
        this.publicacion?.imagenes?.[0]?.url ||
        null;
      return resolverFotoUrl(url);
    },
    textoIntro() {
      if (this.esDueno) {
        return "Vas a eliminar esta publicación de forma definitiva.";
      }
      return "Vas a quitar esta publicación de tu perfil.";
    },
    textoAviso() {
      if (this.esDueno) {
        return "También se eliminarán sus imágenes, solicitudes de colaboración y notificaciones asociadas. Esta acción no se puede deshacer.";
      }
      return "La publicación seguirá existiendo para el dueño y los demás colaboradores. No se eliminarán sus imágenes ni solicitudes.";
    },
  },
  methods: {
    cambiarVisibilidad(valor) {
      if (this.eliminando && !valor) return;
      this.$emit("update:modelValue", valor);
    },
    cerrar() {
      if (this.eliminando) return;
      this.$emit("update:modelValue", false);
    },
  },
};
</script>

<style scoped>
.eliminar-publicacion__titulo {
  margin: 0;
}

.eliminar-publicacion__contenido {
  display: grid;
  gap: 0.75rem;
}

.eliminar-publicacion__resumen {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.6rem;
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border);
  border-radius: 9px;
}

.eliminar-publicacion__portada {
  display: grid;
  width: 3.5rem;
  height: 3.5rem;
  flex: 0 0 3.5rem;
  place-items: center;
  overflow: hidden;
  color: var(--color-text-subtle);
  background: var(--color-surface-muted);
  border-radius: 7px;
}

.eliminar-publicacion__portada img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.eliminar-publicacion__resumen strong {
  overflow: hidden;
  color: var(--color-text);
  font-size: 0.86rem;
  line-height: 1.35;
  text-overflow: ellipsis;
}

.eliminar-publicacion__intro {
  margin: 0;
  color: var(--color-text);
  font-size: 0.88rem;
  line-height: 1.5;
}

.eliminar-publicacion__aviso {
  margin: 0;
  padding: 0.6rem 0.7rem;
  color: var(--color-warning-text);
  background: var(--color-warning-soft);
  border: 1px solid var(--color-warning-border);
  border-radius: 8px;
  font-size: 0.77rem;
  line-height: 1.5;
}

.eliminar-publicacion__acciones {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  width: 100%;
}

@media (max-width: 520px) {
  .eliminar-publicacion__acciones {
    flex-direction: column-reverse;
  }
}
</style>
