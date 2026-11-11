<template>
  <div
    v-if="!estado.noDisponible"
    class="publicacion-interacciones"
    @click.stop
  >
    <button
      type="button"
      class="publicacion-interacciones__accion publicacion-interacciones__accion--me-gusta"
      :class="{ 'publicacion-interacciones__accion--activa': estado.meGusta }"
      :disabled="estado.pendienteMeGusta"
      :aria-busy="estado.pendienteMeGusta ? 'true' : 'false'"
      :aria-pressed="estado.meGusta ? 'true' : 'false'"
      :aria-label="etiquetaMeGusta"
      :title="etiquetaMeGusta"
      @click.stop="alternar"
    >
      <span class="material-symbols-outlined" aria-hidden="true">
        {{ estado.meGusta ? "favorite" : "favorite_border" }}
      </span>
      <span class="publicacion-interacciones__numero">
        {{ estado.cantidadMeGusta }}
      </span>
    </button>

    <button
      v-if="mostrarComentarios"
      type="button"
      class="publicacion-interacciones__accion"
      :aria-label="`Ver comentarios (${estado.cantidadComentarios})`"
      title="Ver comentarios"
      @click.stop="$emit('ver-comentarios', publicacion)"
    >
      <span class="material-symbols-outlined" aria-hidden="true">
        chat_bubble
      </span>
      <span class="publicacion-interacciones__numero">
        {{ estado.cantidadComentarios }}
      </span>
    </button>
  </div>
</template>

<script>
import { useToast } from "vuestic-ui";
import {
  clasificarErrorPublicacion,
  mensajeErrorApi,
} from "../../utils/apiError";
import {
  alternarMeGusta,
  estadoInteraccion,
  sincronizarPublicacion,
} from "../../services/publicacionInteraccionState";

export default {
  name: "PublicacionInteracciones",
  props: {
    publicacion: {
      type: Object,
      default: null,
    },
    mostrarComentarios: {
      type: Boolean,
      default: true,
    },
  },
  emits: [
    "ver-comentarios",
    "no-disponible",
    "sin-perfil",
    "perfil-inactivo",
  ],
  setup() {
    return { toast: useToast() };
  },
  computed: {
    estado() {
      return estadoInteraccion(
        this.publicacion?.idPublicacion,
        this.publicacion
      );
    },
    etiquetaMeGusta() {
      return this.estado.meGusta ? "Quitar Me gusta" : "Me gusta";
    },
  },
  watch: {
    publicacion: {
      immediate: true,
      handler(publicacion) {
        sincronizarPublicacion(publicacion);
      },
    },
  },
  methods: {
    async alternar() {
      if (!this.publicacion?.idPublicacion || this.estado.pendienteMeGusta) {
        return;
      }

      try {
        await alternarMeGusta(this.publicacion);
      } catch (error) {
        const tipo = clasificarErrorPublicacion(error);

        if (tipo === "PUBLICACION_NO_DISPONIBLE") {
          this.$emit("no-disponible", this.publicacion);
          return;
        }
        if (tipo === "SIN_PERFIL") {
          this.$emit("sin-perfil", this.publicacion);
          return;
        }
        if (tipo === "PERFIL_INACTIVO") {
          this.$emit("perfil-inactivo", this.publicacion);
          return;
        }

        this.toast.init({
          title: "No se pudo actualizar el Me gusta",
          message: mensajeErrorApi(
            error,
            "Intentá nuevamente en unos instantes."
          ),
          color: "danger",
          position: "top-right",
          duration: 5000,
        });
      }
    },
  },
};
</script>

<style scoped>
.publicacion-interacciones {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.publicacion-interacciones__accion {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.45rem;
  color: var(--color-text-muted);
  background: transparent;
  border: 0;
  border-radius: 999px;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    color 0.15s ease,
    background-color 0.15s ease;
}

.publicacion-interacciones__accion:hover,
.publicacion-interacciones__accion:focus-visible {
  color: var(--color-primary);
  background: var(--color-surface-soft);
  outline: none;
}

.publicacion-interacciones__accion .material-symbols-outlined {
  font-size: 1.15rem;
}

.publicacion-interacciones__accion--me-gusta.publicacion-interacciones__accion--activa {
  color: var(--color-primary);
}

.publicacion-interacciones__accion:disabled {
  cursor: wait;
  opacity: 0.55;
}

.publicacion-interacciones__numero {
  min-width: 1ch;
  text-align: left;
}
</style>
