<template>
  <VaModal
    :model-value="modelValue"
    hide-default-actions
    blur
    size="small"
    class="exito-proyecto-modal"
    @update:model-value="onCambioVisibilidad"
  >
    <template #header>
      <h3 class="va-h5 exito-proyecto-modal__titulo">Proyecto creado</h3>
    </template>

    <div class="exito-proyecto-modal__contenido">
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
  },
  emits: ["update:modelValue", "ir-al-proyecto"],
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
        if (valor) this.iniciarCuenta();
        else this.detenerCuenta();
      },
    },
  },
  beforeUnmount() {
    this.detenerCuenta();
  },
  methods: {
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
        this.iniciarCuenta();
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
