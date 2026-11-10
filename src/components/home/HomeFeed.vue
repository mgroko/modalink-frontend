<template>
  <div class="home-feed">
    <header class="home-feed__cabecera">
      <div class="home-feed__titulo-grupo">
        <h1 class="home-feed__titulo">Inicio</h1>
        <p class="home-feed__subtitulo">{{ subtitulo }}</p>
      </div>

      <button
        type="button"
        class="home-feed__cta"
        @click="$emit('nueva-publicacion')"
      >
        Nueva publicación
      </button>
    </header>

    <HomeFeedTabs
      :tabs="tabs"
      :activa="tabActiva"
      @cambiar="$emit('cambiar-tab', $event)"
    />

    <div
      id="home-feed-panel"
      role="tabpanel"
      :aria-busy="cargando ? 'true' : 'false'"
    >
      <div v-if="cargando" class="home-feed__estado">
        <span class="material-symbols-outlined" aria-hidden="true">hourglass_empty</span>
        Cargando inicio...
      </div>

      <template v-else>
        <BaseAlert
          v-if="errorProyectos && mostrarProyectos"
          :message="errorProyectos"
          type="error"
          class="home-feed__alerta"
        />

        <HomeFeedSection
          v-if="mostrarProyectos"
          titulo="Proyectos"
          :hay-items="proyectosVisibles.length > 0"
          :texto-vacio="textoVacioProyectos"
          :ver-todo="true"
          :texto-ver-todo="textoVerTodoProyectos"
          @ver-todo="verTodosProyectos"
        >
          <ProyectoHomeCard
            v-for="proyecto in proyectosVisibles"
            :key="proyecto.idProyecto"
            :proyecto="proyecto"
            @abrir="$emit('abrir-proyecto', $event)"
          />
        </HomeFeedSection>

        <HomeFeedSection
          v-if="mostrarOportunidades"
          titulo="Postulaciones disponibles"
          :hay-items="oportunidadesVisibles.length > 0"
          texto-vacio="No hay oportunidades abiertas para tu perfil por ahora."
          :ver-todo="true"
          texto-ver-todo="Ver todas"
          @ver-todo="$emit('ver-todas-oportunidades')"
        >
          <OportunidadCard
            v-for="oportunidad in oportunidadesVisibles"
            :key="`${oportunidad.tipo}:${oportunidad.idRequerimiento}`"
            :oportunidad="oportunidad"
            @postular="$emit('postular', $event)"
          />
        </HomeFeedSection>
      </template>
    </div>
  </div>
</template>

<script>
import BaseAlert from "../AlertaBase.vue";
import HomeFeedTabs from "./HomeFeedTabs.vue";
import HomeFeedSection from "./HomeFeedSection.vue";
import ProyectoHomeCard from "./ProyectoHomeCard.vue";
import OportunidadCard from "./OportunidadCard.vue";

const TABS = [
  { id: "todo", label: "Todo", icon: "grid_view" },
  { id: "proyectos", label: "Proyectos", icon: "business_center" },
  { id: "postulaciones", label: "Postulaciones", icon: "send" },
];

const SUBTITULOS = {
  todo: "Proyectos y oportunidades para tu perfil",
  proyectos: "Proyectos visibles para tu perfil",
  postulaciones: "Búsquedas abiertas que coinciden con tu perfil",
};

export default {
  name: "HomeFeed",
  components: {
    BaseAlert,
    HomeFeedTabs,
    HomeFeedSection,
    ProyectoHomeCard,
    OportunidadCard,
  },
  props: {
    tabActiva: {
      type: String,
      default: "todo",
    },
    proyectos: {
      type: Array,
      default: () => [],
    },
    oportunidades: {
      type: Array,
      default: () => [],
    },
    totalProyectos: {
      type: Number,
      default: 0,
    },
    totalOportunidades: {
      type: Number,
      default: 0,
    },
    cargando: {
      type: Boolean,
      default: false,
    },
    errorProyectos: {
      type: String,
      default: "",
    },
  },
  emits: [
    "cambiar-tab",
    "postular",
    "abrir-proyecto",
    "ver-todos-proyectos",
    "ver-todas-oportunidades",
    "nueva-publicacion",
  ],
  computed: {
    tabs() {
      return TABS.map((tab) => {
        if (tab.id === "proyectos") {
          return {
            ...tab,
            count: Number(this.totalProyectos) || this.proyectos.length,
          };
        }
        if (tab.id === "postulaciones") {
          return {
            ...tab,
            count: Number(this.totalOportunidades) || this.oportunidades.length,
          };
        }
        return tab;
      });
    },
    subtitulo() {
      return SUBTITULOS[this.tabActiva] || SUBTITULOS.todo;
    },
    mostrarProyectos() {
      return this.tabActiva === "todo" || this.tabActiva === "proyectos";
    },
    mostrarOportunidades() {
      return this.tabActiva === "todo" || this.tabActiva === "postulaciones";
    },
    proyectosVisibles() {
      return this.tabActiva === "todo"
        ? this.proyectos.slice(0, 3)
        : this.proyectos;
    },
    oportunidadesVisibles() {
      return this.tabActiva === "todo"
        ? this.oportunidades.slice(0, 3)
        : this.oportunidades;
    },
    textoVerTodoProyectos() {
      return this.tabActiva === "todo" ? "Ver todo" : "Ver todos";
    },
    textoVacioProyectos() {
      return this.errorProyectos
        ? ""
        : "Todavía no hay proyectos visibles para tu perfil.";
    },
  },
  methods: {
    verTodosProyectos() {
      if (this.tabActiva === "todo") {
        this.$emit("cambiar-tab", "proyectos");
        return;
      }
      this.$emit("ver-todos-proyectos");
    },
  },
};
</script>

<style scoped>
.home-feed {
  display: flex;
  flex-direction: column;
}

.home-feed__cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.home-feed__titulo-grupo {
  min-width: 0;
}

.home-feed__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.2;
}

.home-feed__subtitulo {
  margin: 0.2rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.82rem;
}

.home-feed__cta-wrapper {
  position: relative;
  display: inline-flex;
  cursor: not-allowed;
}

.home-feed__cta-wrapper::after {
  content: attr(data-tooltip);
  position: absolute;
  right: 0;
  bottom: calc(100% + 6px);
  padding: 0.3rem 0.5rem;
  border-radius: 6px;
  background: var(--color-text);
  color: var(--color-surface);
  font-size: 0.7rem;
  line-height: 1.2;
  white-space: nowrap;
  opacity: 0;
  transform: translateY(2px);
  transition:
    opacity 0.12s,
    transform 0.12s;
  pointer-events: none;
}

.home-feed__cta-wrapper:hover::after,
.home-feed__cta-wrapper:focus-within::after {
  opacity: 1;
  transform: translateY(0);
}

.home-feed__cta {
  padding: 0.55rem 0.9rem;
  border: 0;
  border-radius: 8px;
  background: linear-gradient(90deg, var(--color-accent), var(--color-primary));
  color: #ffffff;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: filter 0.15s ease;
}

.home-feed__cta:hover,
.home-feed__cta:focus-visible {
  filter: brightness(1.06);
}

.home-feed__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.home-feed__estado .material-symbols-outlined {
  font-size: 2rem;
}

.home-feed__alerta {
  margin-bottom: 0.75rem;
}

@media (max-width: 640px) {
  .home-feed__titulo {
    font-size: 1.3rem;
  }

  .home-feed__cta {
    padding: 0.5rem 0.75rem;
    font-size: 0.78rem;
  }
}
</style>
