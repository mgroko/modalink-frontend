<template>
  <VaModal
    :model-value="modelValue"
    hide-default-actions
    size="medium"
    :no-dismiss="confirmando"
    blur
    class="reemplazo-confirmar"
    @update:model-value="onCambioVisibilidad"
  >
    <template #header>
      <h3 class="va-h5 reemplazo-confirmar__titulo">
        Confirmar candidatos
      </h3>
    </template>

    <div class="reemplazo-confirmar__contenido">
      <p class="reemplazo-confirmar__intro">
        Elegí a qué candidatos querés invitar para cubrir la vacante. Se
        enviará una invitación a cada uno.
      </p>

      <div
        v-if="propuestos.length"
        class="reemplazo-confirmar__cabecera-lista"
      >
        <span>{{ propuestos.length }} candidatos propuestos</span>
        <button
          type="button"
          class="reemplazo-confirmar__toggle"
          :disabled="confirmando"
          @click="alternarTodos"
        >
          {{ todosSeleccionados ? "Deseleccionar todos" : "Seleccionar todos" }}
        </button>
      </div>

      <p v-if="!propuestos.length" class="reemplazo-confirmar__vacio">
        No hay candidatos propuestos para invitar.
      </p>

      <ul v-else class="reemplazo-confirmar__lista">
        <li
          v-for="candidato in propuestos"
          :key="candidato.idCandidato"
          class="reemplazo-confirmar__item"
        >
          <label class="reemplazo-confirmar__label">
            <input
              v-model="seleccionados"
              type="checkbox"
              :value="candidato.idCandidato"
              :disabled="confirmando"
            />
            <span class="reemplazo-confirmar__datos">
              <span class="reemplazo-confirmar__nombre">
                {{ candidato.nombreArtistico || "Perfil" }}
                <span
                  v-if="candidato.alternativo"
                  class="reemplazo-confirmar__alternativo"
                >
                  Alternativo
                </span>
              </span>
              <span class="reemplazo-confirmar__detalle">
                {{ candidato.profesion || "Sin profesión" }}
                <template v-if="candidato.ciudad?.nombre">
                  · {{ candidato.ciudad.nombre }}
                </template>
                · Concordancia:
                {{ formatearPuntajeReemplazo(candidato.puntaje) }}
              </span>
            </span>
          </label>
        </li>
      </ul>

      <BaseAlert v-if="error" :message="error" type="error" />

      <VaTextarea
        v-model="mensaje"
        label="Mensaje para los candidatos (opcional)"
        placeholder="Podés agregar un mensaje para acompañar la invitación."
        :max-length="LIMITE_MENSAJE_REEMPLAZO"
        counter
        :rows="3"
        :disabled="confirmando"
      />
    </div>

    <template #footer>
      <div class="reemplazo-confirmar__acciones">
        <VaButton preset="secondary" :disabled="confirmando" @click="cerrar">
          Volver
        </VaButton>
        <VaButton
          preset="primary"
          :loading="confirmando"
          :disabled="!puedeConfirmar"
          @click="confirmar"
        >
          Enviar invitaciones
        </VaButton>
      </div>
    </template>
  </VaModal>
</template>

<script>
import BaseAlert from "../AlertaBase.vue";
import {
  ESTADOS_CANDIDATO_REEMPLAZO,
  LIMITE_MENSAJE_REEMPLAZO,
  formatearPuntajeReemplazo,
} from "../../utils/reemplazoConstants.js";

export default {
  name: "ModalConfirmarReemplazo",
  components: { BaseAlert },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    candidatos: {
      type: Array,
      default: () => [],
    },
    confirmando: {
      type: Boolean,
      default: false,
    },
    error: {
      type: String,
      default: "",
    },
  },
  emits: ["update:modelValue", "confirmar"],
  data() {
    return {
      LIMITE_MENSAJE_REEMPLAZO,
      seleccionados: [],
      mensaje: "",
    };
  },
  computed: {
    propuestos() {
      return (Array.isArray(this.candidatos) ? this.candidatos : []).filter(
        (candidato) =>
          candidato?.estado === ESTADOS_CANDIDATO_REEMPLAZO.PROPUESTO
      );
    },
    todosSeleccionados() {
      return (
        this.propuestos.length > 0 &&
        this.propuestos.every((candidato) =>
          this.seleccionados.includes(candidato.idCandidato)
        )
      );
    },
    puedeConfirmar() {
      return this.seleccionados.length > 0 && !this.confirmando;
    },
  },
  watch: {
    modelValue(visible) {
      if (visible) this.limpiar();
    },
  },
  methods: {
    formatearPuntajeReemplazo,
    limpiar() {
      this.seleccionados = [];
      this.mensaje = "";
    },
    alternarTodos() {
      this.seleccionados = this.todosSeleccionados
        ? []
        : this.propuestos.map((candidato) => candidato.idCandidato);
    },
    onCambioVisibilidad(valor) {
      if (this.confirmando && !valor) return;
      this.$emit("update:modelValue", valor);
    },
    cerrar() {
      if (this.confirmando) return;
      this.$emit("update:modelValue", false);
    },
    confirmar() {
      if (!this.puedeConfirmar) return;
      this.$emit("confirmar", {
        idsCandidatos: [...this.seleccionados],
        mensaje: this.mensaje,
      });
    },
  },
};
</script>

<style scoped>
.reemplazo-confirmar__titulo {
  margin: 0;
}

.reemplazo-confirmar__contenido {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.reemplazo-confirmar__intro {
  margin: 0;
  color: var(--color-text);
  font-size: 0.9rem;
  line-height: 1.5;
}

.reemplazo-confirmar__cabecera-lista {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  color: var(--color-text-muted);
  font-size: 0.78rem;
}

.reemplazo-confirmar__toggle {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-primary);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.reemplazo-confirmar__toggle:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.reemplazo-confirmar__lista {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  max-height: 19rem;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
}

.reemplazo-confirmar__item {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
}

.reemplazo-confirmar__label {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  padding: 0.65rem 0.75rem;
  cursor: pointer;
}

.reemplazo-confirmar__label input {
  margin-top: 0.2rem;
  accent-color: var(--color-primary);
}

.reemplazo-confirmar__datos {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.reemplazo-confirmar__nombre {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
  color: var(--color-text);
  font-size: 0.86rem;
  font-weight: 700;
}

.reemplazo-confirmar__alternativo {
  padding: 0.05rem 0.4rem;
  border-radius: 999px;
  background: var(--color-warning-soft);
  color: var(--color-warning-text);
  font-size: 0.6rem;
  font-weight: 700;
}

.reemplazo-confirmar__detalle {
  color: var(--color-text-muted);
  font-size: 0.74rem;
  line-height: 1.4;
}

.reemplazo-confirmar__vacio {
  margin: 0;
  padding: 0.8rem;
  border: 1px dashed var(--color-border);
  border-radius: 8px;
  color: var(--color-text-muted);
  font-size: 0.82rem;
  text-align: center;
}

.reemplazo-confirmar__acciones {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  width: 100%;
}
</style>
