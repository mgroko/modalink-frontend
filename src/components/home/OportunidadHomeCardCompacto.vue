<template>
  <article
    class="oportunidad-compacta"
    role="button"
    tabindex="0"
    @click="$emit('abrir', oportunidad)"
    @keydown.enter.self.prevent="$emit('abrir', oportunidad)"
    @keydown.space.self.prevent="$emit('abrir', oportunidad)"
  >
    <header class="oportunidad-compacta__cabecera">
      <h3 class="oportunidad-compacta__titulo">{{ titulo }}</h3>

      <EstadoPostulacionBadge
        v-if="yaPostulado"
        :estado="estadoPostulacion"
      />
      <span
        v-else
        class="oportunidad-compacta__estado"
        :class="{
          'oportunidad-compacta__estado--disponible': puedePostular,
        }"
      >
        {{ puedePostular ? "Disponible" : "No disponible" }}
      </span>
    </header>

    <p class="oportunidad-compacta__meta">
      {{ profesion }} · {{ metaFecha }}
    </p>

    <div class="oportunidad-compacta__pie">
      <span v-if="cuposTexto" class="oportunidad-compacta__cupos">
        {{ cuposTexto }}
      </span>
      <button
        v-if="puedePostular"
        type="button"
        class="oportunidad-compacta__postular"
        @click.stop="$emit('postular', oportunidad)"
      >
        Postular
      </button>
    </div>
  </article>
</template>

<script>
import EstadoPostulacionBadge from "../proyecto/EstadoPostulacionBadge.vue";
import { formatearFechaCorta } from "../../utils/fechas.js";
import { TIPOS_POSTULACION } from "../../utils/postulacionConstants.js";

export default {
  name: "OportunidadHomeCardCompacto",
  components: { EstadoPostulacionBadge },
  props: {
    oportunidad: {
      type: Object,
      required: true,
    },
  },
  emits: ["postular", "abrir"],
  computed: {
    esActividad() {
      return (
        String(this.oportunidad?.tipo || "").toUpperCase() ===
        TIPOS_POSTULACION.ACTIVIDAD
      );
    },
    titulo() {
      return this.oportunidad?.nombreProyecto || "Proyecto";
    },
    profesion() {
      return this.oportunidad?.nombreProfesion || "Perfil";
    },
    metaFecha() {
      const fecha = this.esActividad
        ? this.oportunidad?.fechaHoraInicioActividad
        : this.oportunidad?.fechaEntrega;
      if (!fecha) return "Fecha a definir";
      return `${this.esActividad ? "Inicia" : "Hasta"} ${formatearFechaCorta(
        fecha
      )}`;
    },
    cuposTexto() {
      if (this.oportunidad?.satisfecho === true) return "Cupo completo";
      const faltantes = Number(this.oportunidad?.faltantes);
      if (Number.isFinite(faltantes)) {
        if (faltantes <= 0) return "Cupo completo";
        return `${faltantes} cupo${faltantes === 1 ? "" : "s"} disponible${
          faltantes === 1 ? "" : "s"
        }`;
      }
      const cantidad = Number(this.oportunidad?.cantidad);
      if (Number.isFinite(cantidad) && cantidad > 0) {
        return `${cantidad} cupo${cantidad === 1 ? "" : "s"}`;
      }
      return "";
    },
    yaPostulado() {
      return this.oportunidad?.yaPostulado === true;
    },
    puedePostular() {
      return (
        this.oportunidad?.puedePostularse === true && !this.yaPostulado
      );
    },
    estadoPostulacion() {
      return this.oportunidad?.estadoPostulacion || "PENDIENTE";
    },
  },
};
</script>

<style scoped>
.oportunidad-compacta {
  display: grid;
  gap: 0.35rem;
  padding: 0.8rem 0.85rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  cursor: pointer;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}

.oportunidad-compacta:hover {
  border-color: var(--color-primary-light);
  box-shadow: 0 6px 16px rgba(35, 33, 52, 0.07);
}

.oportunidad-compacta:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.oportunidad-compacta__cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
}

.oportunidad-compacta__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 0.82rem;
  font-weight: 700;
  line-height: 1.35;
}

.oportunidad-compacta__estado {
  flex: 0 0 auto;
  padding: 0.12rem 0.45rem;
  color: var(--color-text-muted);
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  font-size: 0.64rem;
  font-weight: 600;
  white-space: nowrap;
}

.oportunidad-compacta__estado--disponible {
  color: var(--color-success-text);
  background: var(--color-success-soft);
  border-color: var(--color-success-border);
}

.oportunidad-compacta__meta {
  margin: 0;
  overflow: hidden;
  color: var(--color-text-muted);
  font-size: 0.72rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.oportunidad-compacta__pie {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.oportunidad-compacta__cupos {
  color: var(--color-text-muted);
  font-size: 0.7rem;
}

.oportunidad-compacta__postular {
  padding: 0;
  color: var(--color-primary);
  background: none;
  border: 0;
  font: inherit;
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
}

.oportunidad-compacta__postular:hover {
  text-decoration: underline;
}
</style>
