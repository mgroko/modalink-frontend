<template>
  <VaModal
    :model-value="modelValue"
    hide-default-actions
    blur
    :size="advertencia ? 'medium' : 'small'"
    class="exito-proyecto-modal"
    @update:model-value="onCambioVisibilidad"
  >
    <template #header>
      <h3 class="va-h5 exito-proyecto-modal__titulo">Proyecto creado</h3>
    </template>

    <div class="exito-proyecto-modal__contenido">
      <template v-if="advertencia">
        <div class="exito-proyecto-modal__aviso-icono" aria-hidden="true">
          <span class="material-symbols-outlined">warning</span>
        </div>

        <p class="exito-proyecto-modal__mensaje">
          <strong>{{ nombreProyecto }}</strong> se creó como
        </p>

        <EstadoProyectoBadge :estado="estado" />

        <VaAlert color="#FEF3C7" icon="mso-warning" class="exito-proyecto-modal__aviso"
          :style="{ color: '#92400e' }">
          {{ advertencia }}
        </VaAlert>

        <VaButton
          class="exito-proyecto-modal__ir"
          :loading="cargandoReintento"
          :disabled="cargandoReintento"
          @click="$emit('reintentar')"
        >
          Reintentar subida
        </VaButton>

        <VaButton
          preset="secondary"
          :disabled="cargandoReintento"
          @click="$emit('continuar-sin-imagenes')"
        >
          Continuar sin imágenes
        </VaButton>
      </template>

      <template v-else>
        <div class="exito-proyecto-modal__check" aria-hidden="true">
          <span class="material-symbols-outlined">check</span>
        </div>

        <p class="exito-proyecto-modal__mensaje">
          <strong>{{ nombreProyecto }}</strong> se creó como
        </p>

        <EstadoProyectoBadge :estado="estado" />

        <VaButton class="exito-proyecto-modal__ir" @click="irAlProyecto">
          Ir al proyecto
        </VaButton>

        <p class="exito-proyecto-modal__cuenta">
          Redirigiendo en {{ restantes }} s…
        </p>
      </template>
    </div>
  </VaModal>
</template>

<script>
import EstadoProyectoBadge from "./EstadoProyectoBadge.vue";
import { ESTADOS_PROYECTO } from "../../utils/proyectoConstants.js";

const SEGUNDOS_REDIRECCION = 5;

/*
 * Modal de éxito post-creación (Modal confirmación.png).
 * Redirige solo a los 5 s; el usuario puede ir antes con el botón o
 * cancelar el auto-redireccionamiento cerrando el modal.
 *
 * Modo advertencia (ficha UC-24 §7.1/§7.5.4): el proyecto se creó pero
 * falló la subida de imágenes del moodboard. Mientras `advertencia` tenga
 * texto no hay cuenta regresiva ni "Ir al proyecto": sólo Reintentar
 * (repite sólo el POST de imágenes con el idProyecto existente) o
 * Continuar sin imágenes. Cerrar el modal (X/ESC/overlay) equivale a
 * Continuar sin imágenes: la vista emite `continuar-sin-imagenes`.
 */
export default {
  name: "ModalExitoProyecto",
  components: { EstadoProyectoBadge },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    proyecto: {
      type: Object,
      default: null,
    },
    advertencia: {
      type: String,
      default: "",
    },
    cargandoReintento: {
      type: Boolean,
      default: false,
    },
  },
  emits: [
    "update:modelValue",
    "ir-al-proyecto",
    "reintentar",
    "continuar-sin-imagenes",
  ],
  data() {
    return {
      restantes: SEGUNDOS_REDIRECCION,
      temporizador: null,
      ESTADOS_PROYECTO,
    };
  },
  computed: {
    nombreProyecto() {
      return this.proyecto?.nombre || "El proyecto";
    },
    estado() {
      return this.proyecto?.estado || ESTADOS_PROYECTO.BORRADOR;
    },
  },
  watch: {
    modelValue: {
      immediate: true,
      handler(valor) {
        if (valor) this.alAbrir();
        else this.detenerCuenta();
      },
    },
    advertencia() {
      if (!this.modelValue) return;
      if (this.advertencia) this.detenerCuenta();
      else this.iniciarCuenta();
    },
  },
  beforeUnmount() {
    this.detenerCuenta();
  },
  methods: {
    alAbrir() {
      if (this.advertencia) {
        this.detenerCuenta();
        return;
      }
      this.iniciarCuenta();
    },
    iniciarCuenta() {
      this.detenerCuenta();
      this.restantes = SEGUNDOS_REDIRECCION;
      this.temporizador = setInterval(() => {
        this.restantes -= 1;
        if (this.restantes <= 0) {
          this.detenerCuenta();
          this.emitirIrAlProyecto();
        }
      }, 1000);
    },
    detenerCuenta() {
      if (this.temporizador) {
        clearInterval(this.temporizador);
        this.temporizador = null;
      }
    },
    emitirIrAlProyecto() {
      this.$emit("ir-al-proyecto");
    },
    irAlProyecto() {
      this.detenerCuenta();
      this.$emit("update:modelValue", false);
      this.emitirIrAlProyecto();
    },
    onCambioVisibilidad(valor) {
      if (valor) {
        this.alAbrir();
        return;
      }
      if (this.advertencia) {
        // No se puede descartar mientras el reintento está en vuelo: los
        // archivos retenidos son los que viajan en la petición.
        if (this.cargandoReintento) return;
        this.$emit("continuar-sin-imagenes");
        return;
      }
      this.detenerCuenta();
      this.$emit("update:modelValue", false);
    },
  },
};
</script>

<style scoped>
.exito-proyecto-modal__titulo {
  margin: 0;
}

.exito-proyecto-modal__contenido {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 0 0.25rem;
  text-align: center;
}

.exito-proyecto-modal__check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 132px;
  height: 132px;
  border-radius: 50%;
  background: #22c55e;
  color: #fff;
}

.exito-proyecto-modal__check .material-symbols-outlined {
  font-size: 76px;
  font-weight: 700;
}

.exito-proyecto-modal__aviso-icono {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: #f59e0b;
  color: #fff;
}

.exito-proyecto-modal__aviso-icono .material-symbols-outlined {
  font-size: 54px;
  font-weight: 700;
}

.exito-proyecto-modal__aviso {
  width: 100%;
  padding: 0.65rem 0.9rem;
  text-align: left;
  font-size: 0.85rem;
}

.exito-proyecto-modal__mensaje {
  margin: 0;
  color: var(--color-text, #232134);
  font-size: 1rem;
}

.exito-proyecto-modal__ir {
  margin-top: 0.5rem;
}

.exito-proyecto-modal__cuenta {
  margin: 0;
  color: var(--color-text-muted, #6b6980);
  font-size: 0.78rem;
}
</style>
