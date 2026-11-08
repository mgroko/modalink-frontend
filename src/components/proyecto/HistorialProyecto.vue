<template>
  <section class="historial-proyecto">
    <header class="historial-proyecto__cabecera">
      <div>
        <h2 class="historial-proyecto__titulo">Historial</h2>
        <p class="historial-proyecto__subtitulo">{{ subtitulo }}</p>
      </div>
    </header>

    <div class="historial-proyecto__tabs" role="tablist" aria-label="Secciones del historial">
      <button
        v-if="esDirector"
        type="button"
        role="tab"
        class="historial-proyecto__tab"
        :class="{ 'historial-proyecto__tab--activa': seccion === 'miembros' }"
        :aria-selected="seccion === 'miembros'"
        @click="cambiarSeccion('miembros')"
      >
        Miembros
      </button>
      <button
        type="button"
        role="tab"
        class="historial-proyecto__tab"
        :class="{ 'historial-proyecto__tab--activa': seccion === 'contratos' }"
        :aria-selected="seccion === 'contratos'"
        @click="cambiarSeccion('contratos')"
      >
        Contratos
      </button>
    </div>

    <HistorialMiembrosProyecto
      v-if="esDirector && seccion === 'miembros'"
      :id-proyecto="idProyecto"
    />

    <HistorialContratosProyecto
      v-else
      :id-proyecto="idProyecto"
      :tipo-inicial="tipoInicial"
    />
  </section>
</template>

<script>
import HistorialContratosProyecto from "./HistorialContratosProyecto.vue";
import HistorialMiembrosProyecto from "./HistorialMiembrosProyecto.vue";

/*
 * Pestaña Historial del proyecto.
 *
 * - Director: ve movimientos de miembros y eventos de todos los contratos.
 * - Miembro activo: ve únicamente el historial de sus propios contratos.
 *
 * La visibilidad real de los datos la resuelve el backend.
 */
export default {
  name: "HistorialProyecto",
  components: {
    HistorialContratosProyecto,
    HistorialMiembrosProyecto,
  },
  props: {
    idProyecto: {
      type: [Number, String],
      required: true,
    },
    esDirector: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      seccion: this.seccionDesdeQuery(),
    };
  },
  computed: {
    subtitulo() {
      return this.esDirector
        ? "Movimientos de miembros y eventos de contratos del proyecto."
        : "Eventos de los contratos donde participaste.";
    },
    tipoInicial() {
      return String(this.$route?.query?.tipo || "").toUpperCase();
    },
  },
  watch: {
    esDirector(valor) {
      if (!valor && this.seccion === "miembros") {
        this.seccion = "contratos";
      }
    },
    "$route.query.seccion"() {
      const solicitada = this.seccionDesdeQuery();
      if (solicitada !== this.seccion) {
        this.seccion = solicitada;
      }
    },
  },
  methods: {
    seccionDesdeQuery() {
      const solicitada = String(
        this.$route?.query?.seccion || ""
      ).toLowerCase();
      if (solicitada === "miembros") {
        return this.esDirector ? "miembros" : "contratos";
      }
      if (solicitada === "contratos") {
        return "contratos";
      }
      if (this.$route?.query?.tipo) {
        return "contratos";
      }
      return this.esDirector ? "miembros" : "contratos";
    },
    cambiarSeccion(seccion) {
      if (seccion === this.seccion) return;
      if (seccion === "miembros" && !this.esDirector) return;
      this.seccion = seccion;
      this.$router
        .replace({
          query: {
            ...this.$route.query,
            tab: "historial",
            seccion,
          },
        })
        .catch(() => {});
    },
  },
};
</script>

<style scoped>
.historial-proyecto {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.historial-proyecto__cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.historial-proyecto__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1.05rem;
  font-weight: 700;
}

.historial-proyecto__subtitulo {
  margin: 0.25rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.82rem;
}

.historial-proyecto__tabs {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.4rem;
  border-bottom: 1px solid var(--color-border);
}

.historial-proyecto__tab {
  padding: 0.5rem 0.9rem;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
}

.historial-proyecto__tab:hover {
  color: var(--color-text);
}

.historial-proyecto__tab--activa {
  border-bottom-color: var(--color-primary);
  color: var(--color-primary);
}
</style>
