<template>
  <VaModal
    :model-value="modelValue"
    hide-default-actions
    :no-dismiss="operacionEnCurso"
    blur
    size="large"
    class="gestion-polaroids"
    @update:model-value="cambiarVisibilidad"
  >
    <template #header>
      <div class="gestion-polaroids__header">
        <div class="gestion-polaroids__header-titulo">
          <h3 class="va-h5 gestion-polaroids__titulo">Polaroids</h3>
          <span class="gestion-polaroids__contador">
            {{ ordenLocal.length }} de {{ maximo }}
          </span>
        </div>
        <VaButton
          preset="secondary"
          :disabled="operacionEnCurso"
          @click="cerrar"
        >
          Listo
        </VaButton>
      </div>
    </template>

    <div class="gestion-polaroids__contenido">
      <p class="gestion-polaroids__ayuda">
        Arrastrá las fotos para cambiar el orden. Se guarda al soltar.
      </p>

      <BaseAlert v-if="error" :message="error" type="error" />

      <div
        v-if="polaroidAEliminar"
        class="gestion-polaroids__confirmar"
      >
        <p class="gestion-polaroids__confirmar-texto">
          ¿Eliminar la polaroid
          <strong>{{
            polaroidAEliminar.tipo?.nombreCompleto || "seleccionada"
          }}</strong
          >? Esta acción no se puede deshacer.
        </p>
        <BaseAlert v-if="errorEliminar" :message="errorEliminar" type="error" />
        <div class="gestion-polaroids__confirmar-acciones">
          <VaButton
            preset="secondary"
            size="small"
            :disabled="eliminando"
            @click="cancelarEliminar"
          >
            Cancelar
          </VaButton>
          <VaButton
            color="danger"
            size="small"
            :loading="eliminando"
            :disabled="eliminando"
            @click="confirmarEliminar"
          >
            Eliminar
          </VaButton>
        </div>
      </div>

      <div class="gestion-polaroids__grid">
        <article
          v-for="(polaroid, indice) in ordenLocal"
          :key="polaroid.idPolaroid"
          class="gestion-polaroids__item"
          :class="{
            'gestion-polaroids__item--arrastrando':
              arrastrandoIndice === indice,
          }"
          @dragover.prevent
          @drop.prevent="soltarEn(indice)"
        >
          <div class="gestion-polaroids__item-cabecera">
            <span
              class="gestion-polaroids__handle"
              draggable="true"
              :aria-label="`Reordenar polaroid ${indice + 1}`"
              title="Arrastrar para reordenar"
              @dragstart="iniciarArrastre(indice, $event)"
              @dragend="terminarArrastre"
            >
              <span class="material-symbols-outlined" aria-hidden="true">
                drag_indicator
              </span>
            </span>
            <span class="gestion-polaroids__posicion">
              Posición {{ indice + 1 }}
            </span>
            <div class="gestion-polaroids__mover">
              <button
                type="button"
                class="gestion-polaroids__mover-btn"
                aria-label="Mover polaroid hacia arriba"
                :disabled="indice === 0 || operacionEnCurso"
                @click="mover(indice, -1)"
              >
                <span class="material-symbols-outlined" aria-hidden="true">
                  keyboard_arrow_up
                </span>
              </button>
              <button
                type="button"
                class="gestion-polaroids__mover-btn"
                aria-label="Mover polaroid hacia abajo"
                :disabled="
                  indice === ordenLocal.length - 1 || operacionEnCurso
                "
                @click="mover(indice, 1)"
              >
                <span class="material-symbols-outlined" aria-hidden="true">
                  keyboard_arrow_down
                </span>
              </button>
            </div>
          </div>

          <img
            :src="resolverImagen(polaroid)"
            :alt="polaroid.tipo?.nombreCompleto || 'Polaroid'"
            class="gestion-polaroids__imagen"
          />

          <p class="gestion-polaroids__tipo">
            {{ polaroid.tipo?.nombreCompleto || "Polaroid" }}
          </p>

          <div class="gestion-polaroids__acciones">
            <VaButton
              preset="secondary"
              size="small"
              icon="mso-image"
              :disabled="operacionEnCurso"
              @click="abrirReemplazo(polaroid)"
            >
              Reemplazar
            </VaButton>
            <VaButton
              preset="secondary"
              size="small"
              icon="mso-sell"
              :disabled="operacionEnCurso"
              @click="abrirCambioTipo(polaroid)"
            >
              Cambiar tipo
            </VaButton>
            <VaButton
              preset="secondary"
              color="danger"
              size="small"
              icon="mso-delete"
              :disabled="operacionEnCurso"
              @click="abrirEliminar(polaroid)"
            >
              Eliminar
            </VaButton>
          </div>
        </article>

        <button
          v-if="puedeAgregar"
          type="button"
          class="gestion-polaroids__agregar"
          :disabled="operacionEnCurso"
          @click="abrirAlta"
        >
          <span class="material-symbols-outlined" aria-hidden="true">add</span>
          <strong>Agregar foto</strong>
          <span>Podés sumar {{ restantes }} más</span>
        </button>
      </div>
    </div>

    <ModalFormPolaroid
      v-model="formVisible"
      :id-perfil="idPerfil"
      :modo="formModo"
      :polaroid="polaroidForm"
      @actualizado="alActualizarPolaroid"
    />
  </VaModal>
</template>

<script>
import BaseAlert from "../AlertaBase.vue";
import ModalFormPolaroid from "./ModalFormPolaroid.vue";
import polaroidService from "../../services/polaroidService";
import { resolverFotoUrl } from "../../utils/fotos.js";
import {
  MODOS_FORM_POLAROID,
  mensajeErrorPolaroid,
} from "../../utils/polaroidConstants.js";

export default {
  name: "ModalGestionPolaroids",
  components: {
    BaseAlert,
    ModalFormPolaroid,
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    idPerfil: {
      type: [Number, String],
      required: true,
    },
    polaroids: {
      type: Array,
      default: () => [],
    },
    maximo: {
      type: Number,
      default: 8,
    },
  },
  emits: ["update:modelValue", "actualizado"],
  data() {
    return {
      ordenLocal: [],
      arrastrandoIndice: null,
      guardandoOrden: false,
      error: "",
      formVisible: false,
      formModo: MODOS_FORM_POLAROID.CREAR,
      polaroidForm: null,
      polaroidAEliminar: null,
      eliminando: false,
      errorEliminar: "",
    };
  },
  computed: {
    operacionEnCurso() {
      return this.guardandoOrden || this.eliminando;
    },
    puedeAgregar() {
      return this.ordenLocal.length < this.maximo;
    },
    restantes() {
      return Math.max(0, this.maximo - this.ordenLocal.length);
    },
  },
  watch: {
    modelValue(abierto) {
      if (abierto) {
        this.sincronizarOrden();
        this.error = "";
        this.polaroidAEliminar = null;
        this.errorEliminar = "";
      }
    },
    polaroids: {
      deep: true,
      handler() {
        if (!this.guardandoOrden) this.sincronizarOrden();
      },
    },
  },
  methods: {
    sincronizarOrden() {
      this.ordenLocal = [...this.polaroids].sort(
        (a, b) => (Number(a.orden) || 0) - (Number(b.orden) || 0)
      );
    },
    resolverImagen(polaroid) {
      return resolverFotoUrl(polaroid?.url);
    },
    cambiarVisibilidad(valor) {
      if (this.operacionEnCurso && !valor) return;
      this.$emit("update:modelValue", valor);
    },
    cerrar() {
      if (this.operacionEnCurso) return;
      this.$emit("update:modelValue", false);
    },
    abrirAlta() {
      if (!this.puedeAgregar || this.operacionEnCurso) return;
      this.formModo = MODOS_FORM_POLAROID.CREAR;
      this.polaroidForm = null;
      this.formVisible = true;
    },
    abrirReemplazo(polaroid) {
      if (this.operacionEnCurso) return;
      this.formModo = MODOS_FORM_POLAROID.REEMPLAZAR;
      this.polaroidForm = polaroid;
      this.formVisible = true;
    },
    abrirCambioTipo(polaroid) {
      if (this.operacionEnCurso) return;
      this.formModo = MODOS_FORM_POLAROID.TIPO;
      this.polaroidForm = polaroid;
      this.formVisible = true;
    },
    alActualizarPolaroid() {
      this.error = "";
      this.$emit("actualizado");
    },
    iniciarArrastre(indice, evento) {
      if (this.operacionEnCurso) {
        evento.preventDefault();
        return;
      }
      this.arrastrandoIndice = indice;
      if (evento.dataTransfer) {
        evento.dataTransfer.effectAllowed = "move";
        evento.dataTransfer.setData("text/plain", String(indice));
      }
    },
    terminarArrastre() {
      this.arrastrandoIndice = null;
    },
    async soltarEn(destino) {
      const origen = this.arrastrandoIndice;
      this.arrastrandoIndice = null;
      if (origen == null || origen === destino || this.operacionEnCurso) {
        return;
      }
      await this.reordenar(origen, destino);
    },
    async mover(indice, delta) {
      const destino = indice + delta;
      if (
        destino < 0 ||
        destino >= this.ordenLocal.length ||
        this.operacionEnCurso
      ) {
        return;
      }
      await this.reordenar(indice, destino);
    },
    async reordenar(origen, destino) {
      const anterior = [...this.ordenLocal];
      const nuevo = [...this.ordenLocal];
      const [movida] = nuevo.splice(origen, 1);
      nuevo.splice(destino, 0, movida);
      this.ordenLocal = nuevo;
      this.guardandoOrden = true;
      this.error = "";

      try {
        await polaroidService.reordenar(
          this.idPerfil,
          nuevo.map((polaroid) => polaroid.idPolaroid)
        );
        this.$emit("actualizado");
      } catch (error) {
        this.ordenLocal = anterior;
        this.error = mensajeErrorPolaroid(
          error,
          "No se pudo guardar el nuevo orden."
        );
      } finally {
        this.guardandoOrden = false;
      }
    },
    abrirEliminar(polaroid) {
      if (this.operacionEnCurso) return;
      this.errorEliminar = "";
      this.polaroidAEliminar = polaroid;
    },
    cancelarEliminar() {
      if (this.eliminando) return;
      this.polaroidAEliminar = null;
      this.errorEliminar = "";
    },
    async confirmarEliminar() {
      if (!this.polaroidAEliminar || this.eliminando) return;
      this.eliminando = true;
      this.errorEliminar = "";

      try {
        await polaroidService.eliminar(
          this.idPerfil,
          this.polaroidAEliminar.idPolaroid
        );
        this.polaroidAEliminar = null;
        this.$emit("actualizado");
      } catch (error) {
        this.errorEliminar = mensajeErrorPolaroid(
          error,
          "No se pudo eliminar la polaroid."
        );
      } finally {
        this.eliminando = false;
      }
    },
  },
};
</script>

<style scoped>
.gestion-polaroids__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
}

.gestion-polaroids__header-titulo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.gestion-polaroids__titulo {
  margin: 0;
}

.gestion-polaroids__contador {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.55rem;
  color: var(--color-text-muted);
  background: var(--color-surface-muted);
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
}

.gestion-polaroids__contenido {
  display: grid;
  gap: 0.9rem;
}

.gestion-polaroids__ayuda {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.gestion-polaroids__confirmar {
  display: grid;
  gap: 0.5rem;
  padding: 0.7rem 0.8rem;
  background: var(--color-danger-soft);
  border: 1px solid var(--color-danger-border);
  border-radius: 9px;
}

.gestion-polaroids__confirmar-texto {
  margin: 0;
  color: var(--color-danger-text);
  font-size: 0.8rem;
  line-height: 1.45;
}

.gestion-polaroids__confirmar-acciones {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.gestion-polaroids__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
}

.gestion-polaroids__item {
  display: grid;
  gap: 0.5rem;
  padding: 0.7rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  transition:
    border-color 0.15s ease,
    opacity 0.15s ease;
}

.gestion-polaroids__item--arrastrando {
  border-color: var(--color-primary);
  opacity: 0.7;
}

.gestion-polaroids__item-cabecera {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.gestion-polaroids__handle {
  display: inline-flex;
  color: var(--color-text-subtle);
  cursor: grab;
}

.gestion-polaroids__handle:active {
  cursor: grabbing;
}

.gestion-polaroids__handle .material-symbols-outlined {
  font-size: 1.1rem;
}

.gestion-polaroids__posicion {
  color: var(--color-text-muted);
  font-size: 0.72rem;
  font-weight: 600;
}

.gestion-polaroids__mover {
  display: flex;
  gap: 0.1rem;
  margin-left: auto;
}

.gestion-polaroids__mover-btn {
  display: grid;
  width: 1.45rem;
  height: 1.45rem;
  padding: 0;
  place-items: center;
  color: var(--color-text-muted);
  background: transparent;
  border: 0;
  border-radius: 5px;
  cursor: pointer;
}

.gestion-polaroids__mover-btn:hover:not(:disabled) {
  color: var(--color-primary);
  background: var(--color-surface-soft);
}

.gestion-polaroids__mover-btn:disabled {
  cursor: default;
  opacity: 0.3;
}

.gestion-polaroids__mover-btn .material-symbols-outlined {
  font-size: 1rem;
}

.gestion-polaroids__imagen {
  width: 100%;
  aspect-ratio: 4 / 5;
  object-fit: cover;
  background: var(--color-surface-muted);
  border-radius: 8px;
}

.gestion-polaroids__tipo {
  margin: 0;
  color: var(--color-text);
  font-size: 0.77rem;
  font-weight: 600;
  line-height: 1.35;
}

.gestion-polaroids__acciones {
  display: grid;
  gap: 0.35rem;
}

.gestion-polaroids__agregar {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  min-height: 18rem;
  padding: 1rem;
  color: var(--color-text-muted);
  background: var(--color-surface-soft);
  border: 2px dashed var(--color-border-strong);
  border-radius: 10px;
  font: inherit;
  font-size: 0.78rem;
  cursor: pointer;
}

.gestion-polaroids__agregar:hover:not(:disabled) {
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.gestion-polaroids__agregar:disabled {
  cursor: default;
  opacity: 0.6;
}

.gestion-polaroids__agregar .material-symbols-outlined {
  font-size: 1.6rem;
}

@media (max-width: 700px) {
  .gestion-polaroids__grid {
    grid-template-columns: 1fr;
  }

  .gestion-polaroids__agregar {
    min-height: 10rem;
  }
}
</style>
