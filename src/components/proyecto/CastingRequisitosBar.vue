<template>
  <section v-if="requerimiento" class="casting-requisitos">
    <div class="casting-requisitos__cabecera">
      <div>
        <p class="casting-requisitos__titulo">
          {{
            requerimiento.tipo === "ACTIVIDAD"
              ? "Requisitos de la actividad"
              : "Requisitos del requerimiento"
          }}
        </p>
        <p class="casting-requisitos__subtitulo">
          {{ requerimiento.descripcion || "Sin descripción" }}
        </p>
      </div>

      <span class="casting-requisitos__cupo">
        {{ textoCupoActual }}
      </span>
    </div>

    <div
      v-if="requerimiento.caracteristicas?.length || requerimiento.habilidades?.length || requerimiento.agendaRequerida"
      class="casting-requisitos__chips"
    >
      <span
        v-for="caracteristica in requerimiento.caracteristicas"
        :key="`car-${caracteristica.idCaracteristica}`"
        class="casting-requisitos__chip"
      >
        {{ etiquetaCaracteristica(caracteristica) }}
        <strong>{{ formatearValorRequerido(caracteristica) }}</strong>
      </span>

      <span
        v-for="habilidad in requerimiento.habilidades"
        :key="`hab-${habilidad.idHabilidad}`"
        class="casting-requisitos__chip"
      >
        {{ habilidad.nombre }}
      </span>

      <span
        v-if="requerimiento.agendaRequerida"
        class="casting-requisitos__chip"
      >
        Agenda disponible
      </span>
    </div>

    <p v-else class="casting-requisitos__vacio">
      El requerimiento no tiene características adicionales.
    </p>
  </section>
</template>

<script>
import {
  etiquetaCaracteristica,
  formatearValorRequerido,
  textoCupo,
} from "../../utils/castingConstants.js";

export default {
  name: "CastingRequisitosBar",
  props: {
    requerimiento: {
      type: Object,
      default: null,
    },
  },
  computed: {
    textoCupoActual() {
      return textoCupo(this.requerimiento);
    },
  },
  methods: {
    etiquetaCaracteristica,
    formatearValorRequerido,
  },
};
</script>

<style scoped>
.casting-requisitos {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  padding: 0.9rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: var(--color-surface);
}

.casting-requisitos__cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.casting-requisitos__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.casting-requisitos__subtitulo {
  margin: 0.15rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.casting-requisitos__cupo {
  padding: 0.28rem 0.65rem;
  border: 1px solid var(--color-primary);
  border-radius: 999px;
  background: var(--color-surface-muted);
  color: var(--color-primary);
  font-size: 0.78rem;
  font-weight: 700;
  white-space: nowrap;
}

.casting-requisitos__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.casting-requisitos__chip {
  padding: 0.28rem 0.65rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  font-size: 0.76rem;
  line-height: 1.3;
}

.casting-requisitos__chip strong {
  color: var(--color-text);
  font-weight: 700;
}

.casting-requisitos__vacio {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.78rem;
}
</style>
