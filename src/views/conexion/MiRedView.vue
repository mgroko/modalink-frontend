<template>
  <div class="mi-red">
    <header class="mi-red__header">
      <div>
        <h1 class="mi-red__titulo">Mi red</h1>
        <p class="mi-red__subtitulo">
          Gestioná tus solicitudes de conexión y encontrá personas de la
          comunidad.
        </p>
      </div>
    </header>

    <div class="mi-red__tabs" role="tablist" aria-label="Mi red">
      <button
        type="button"
        class="mi-red__tab"
        :class="{ 'mi-red__tab--activo': tab === 'solicitudes' }"
        role="tab"
        :aria-selected="tab === 'solicitudes'"
        @click="cambiarTab('solicitudes')"
      >
        Solicitudes
      </button>
      <button
        type="button"
        class="mi-red__tab"
        :class="{ 'mi-red__tab--activo': tab === 'buscar' }"
        role="tab"
        :aria-selected="tab === 'buscar'"
        @click="cambiarTab('buscar')"
      >
        Buscar personas
      </button>
    </div>

    <section class="mi-red__panel" role="tabpanel">
      <SolicitudesConexionPanel v-if="tab === 'solicitudes'" />
      <BuscarPersonasPanel v-else />
    </section>
  </div>
</template>

<script>
import SolicitudesConexionPanel from "../../components/conexion/SolicitudesConexionPanel.vue";
import BuscarPersonasPanel from "../../components/conexion/BuscarPersonasPanel.vue";

export default {
  name: "MiRedView",
  components: {
    SolicitudesConexionPanel,
    BuscarPersonasPanel,
  },
  data() {
    return {
      tab: "solicitudes",
    };
  },
  watch: {
    "$route.query.tab"(nuevo) {
      const tab = this.normalizarTab(nuevo);
      if (tab !== this.tab) this.tab = tab;
    },
  },
  mounted() {
    this.tab = this.normalizarTab(this.$route.query.tab);
  },
  methods: {
    normalizarTab(valor) {
      return valor === "buscar" ? "buscar" : "solicitudes";
    },
    cambiarTab(tab) {
      if (tab === this.tab) return;
      this.tab = tab;
      this.$router
        .replace({
          name: "mi-red",
          query: { tab },
        })
        .catch(() => {});
    },
  },
};
</script>

<style scoped>
.mi-red {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.mi-red__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.mi-red__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1.6rem;
  font-weight: 800;
}

.mi-red__subtitulo {
  margin: 0.3rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.88rem;
}

.mi-red__tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  border-bottom: 1px solid var(--color-border);
}

.mi-red__tab {
  min-height: 44px;
  padding: 0 1rem;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
}

.mi-red__tab:hover {
  color: var(--color-primary);
}

.mi-red__tab--activo {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.mi-red__panel {
  padding: 1.25rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
}

@media (max-width: 640px) {
  .mi-red__panel {
    padding: 1rem;
  }
}
</style>
