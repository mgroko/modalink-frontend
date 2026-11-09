<template>
  <section class="tyc-panel" aria-labelledby="tyc-panel-titulo">
    <header class="tyc-panel__cabecera">
      <h2 id="tyc-panel-titulo" class="tyc-panel__titulo">
        Términos y condiciones
      </h2>

      <span
        v-if="!cargando && !error && terminos && !esPlantilla"
        class="tyc-panel__badge tyc-panel__badge--vigente"
      >
        {{ vigencia }}
      </span>
    </header>

    <div v-if="cargando" class="tyc-panel__estado" aria-live="polite">
      <span class="material-symbols-outlined" aria-hidden="true">
        hourglass_empty
      </span>
      Cargando términos y condiciones...
    </div>

    <div v-else-if="error" class="tyc-panel__error">
      <BaseAlert :message="error" type="error" />
      <VaButton
        size="small"
        preset="secondary"
        icon="mso-refresh"
        @click="$emit('reintentar')"
      >
        Reintentar
      </VaButton>
    </div>

    <template v-else>
      <p v-if="esPlantilla || !terminos" class="tyc-panel__vacio">
        Este perfil no tiene términos y condiciones configurados aún.
      </p>
      <p v-else class="tyc-panel__texto">{{ terminos.descripcion }}</p>

      <div v-if="esPropio && puedeConfigurar" class="tyc-panel__acciones">
        <VaButton
          preset="primary"
          icon="mso-edit"
          @click="$emit('configurar')"
        >
          Configurar términos y condiciones
        </VaButton>
      </div>
    </template>
  </section>
</template>

<script>
import BaseAlert from "../AlertaBase.vue";
import {
  esTerminosPlantilla,
  textoVigenciaTerminos,
} from "../../utils/terminosCondiciones.js";

export default {
  name: "TerminosCondicionesPanel",
  components: { BaseAlert },
  props: {
    terminos: {
      type: Object,
      default: null,
    },
    cargando: {
      type: Boolean,
      default: false,
    },
    error: {
      type: String,
      default: "",
    },
    esPropio: {
      type: Boolean,
      default: false,
    },
    puedeConfigurar: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["reintentar", "configurar"],
  computed: {
    esPlantilla() {
      return esTerminosPlantilla(this.terminos);
    },
    vigencia() {
      return textoVigenciaTerminos(this.terminos);
    },
  },
};
</script>

<style scoped>
.tyc-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem 1.75rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.tyc-panel__cabecera {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.tyc-panel__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: clamp(1.4rem, 2vw, 1.8rem);
  font-weight: 700;
  line-height: 1.2;
}

.tyc-panel__badge {
  display: inline-flex;
  align-items: center;
  padding: 0.22rem 0.7rem;
  border-radius: 999px;
  font-size: 0.74rem;
  font-weight: 600;
  line-height: 1.4;
}

.tyc-panel__badge--vigente {
  border: 1px solid var(--color-success-border);
  background: var(--color-success-soft);
  color: var(--color-success-text);
}

.tyc-panel__texto {
  max-width: 78ch;
  margin: 0;
  color: var(--color-text);
  font-size: 0.98rem;
  line-height: 1.7;
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.tyc-panel__acciones {
  display: flex;
  justify-content: flex-start;
  padding-top: 0.25rem;
}

.tyc-panel__estado {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 0;
  color: var(--color-text-muted);
  font-size: 0.86rem;
}

.tyc-panel__error {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
}

.tyc-panel__vacio {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.86rem;
}

@media (max-width: 640px) {
  .tyc-panel {
    padding: 1.25rem;
  }

  .tyc-panel__acciones :deep(.va-button) {
    width: 100%;
  }
}
</style>
