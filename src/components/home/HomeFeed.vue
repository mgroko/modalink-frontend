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
        <div class="home-feed__layout">
          <div class="home-feed__principal">
            <BaseAlert
              v-if="errorProyectos && mostrarProyectos"
              :message="errorProyectos"
              type="error"
              class="home-feed__alerta"
            />

            <HomePublicacionesFeed
              v-if="mostrarPublicaciones"
              variante="home"
              :publicaciones="publicaciones"
              :cargando="cargandoPublicaciones"
              :error="errorPublicaciones"
              :hay-mas="hayMasPublicaciones"
              :cargando-mas="cargandoMasPublicaciones"
              @abrir-publicacion="$emit('abrir-publicacion', $event)"
              @ver-comentarios="$emit('ver-comentarios', $event)"
              @no-disponible="$emit('no-disponible', $event)"
              @sin-perfil="$emit('sin-perfil', $event)"
              @perfil-inactivo="$emit('perfil-inactivo', $event)"
              @ver-proyecto="$emit('ver-proyecto-publicacion', $event)"
              @editar="$emit('editar-publicacion', $event)"
              @invitar="$emit('invitar-colaborador', $event)"
              @eliminar="$emit('eliminar-publicacion', $event)"
              @reintentar="$emit('reintentar-publicaciones')"
              @cargar-mas="$emit('cargar-mas-publicaciones')"
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
              titulo="Oportunidades disponibles"
              :hay-items="oportunidadesVisibles.length > 0"
              texto-vacio="No hay oportunidades abiertas para tu perfil por ahora."
              :ver-todo="true"
              texto-ver-todo="Ver todas"
              @ver-todo="verTodasOportunidades"
            >
              <OportunidadCard
                v-for="oportunidad in oportunidadesVisibles"
                :key="`${oportunidad.tipo}:${oportunidad.idRequerimiento}`"
                :oportunidad="oportunidad"
                @postular="$emit('postular', $event)"
              />
            </HomeFeedSection>
          </div>

          <aside class="home-feed__aside">
            <BaseAlert
              v-if="errorProyectos && mostrarProyectosAside"
              :message="errorProyectos"
              type="error"
            />

            <HomeAsideSection
              v-if="mostrarProyectosAside"
              titulo="Proyectos"
              :hay-items="proyectosAsideVisibles.length > 0"
              texto-vacio="No hay proyectos visibles."
              texto-ver-todo="Ver todo"
              @ver-todo="verTodosProyectos"
            >
              <ProyectoHomeCardCompacto
                v-for="proyecto in proyectosAsideVisibles"
                :key="proyecto.idProyecto"
                :proyecto="proyecto"
                @abrir="$emit('abrir-proyecto', $event)"
              />
            </HomeAsideSection>

            <HomeAsideSection
              v-if="mostrarOportunidadesAside"
              titulo="Oportunidades"
              :hay-items="oportunidadesAsideVisibles.length > 0"
              texto-vacio="No hay oportunidades abiertas."
              texto-ver-todo="Ver todas"
              @ver-todo="verTodasOportunidades"
            >
              <OportunidadHomeCardCompacto
                v-for="oportunidad in oportunidadesAsideVisibles"
                :key="`${oportunidad.tipo}:${oportunidad.idRequerimiento}`"
                :oportunidad="oportunidad"
                @postular="$emit('postular', $event)"
              />
            </HomeAsideSection>
          </aside>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import BaseAlert from "../AlertaBase.vue";
import HomeFeedTabs from "./HomeFeedTabs.vue";
import HomeFeedSection from "./HomeFeedSection.vue";
import HomeAsideSection from "./HomeAsideSection.vue";
import ProyectoHomeCard from "./ProyectoHomeCard.vue";
import ProyectoHomeCardCompacto from "./ProyectoHomeCardCompacto.vue";
import OportunidadCard from "./OportunidadCard.vue";
import OportunidadHomeCardCompacto from "./OportunidadHomeCardCompacto.vue";
import HomePublicacionesFeed from "./HomePublicacionesFeed.vue";

const TABS = [
  { id: "todo", label: "Todo", icon: "grid_view" },
  { id: "proyectos", label: "Proyectos", icon: "business_center" },
  { id: "oportunidades", label: "Oportunidades", icon: "send" },
];

const SUBTITULOS = {
  todo: "Proyectos, oportunidades y publicaciones de tus contactos",
  proyectos: "Proyectos visibles para tu perfil",
  oportunidades: "Oportunidades abiertas que coinciden con tu perfil",
};

export default {
  name: "HomeFeed",
  components: {
    BaseAlert,
    HomeAsideSection,
    HomeFeedTabs,
    HomeFeedSection,
    HomePublicacionesFeed,
    OportunidadCard,
    OportunidadHomeCardCompacto,
    ProyectoHomeCard,
    ProyectoHomeCardCompacto,
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
    publicaciones: {
      type: Array,
      default: () => [],
    },
    cargandoPublicaciones: {
      type: Boolean,
      default: false,
    },
    errorPublicaciones: {
      type: String,
      default: "",
    },
    hayMasPublicaciones: {
      type: Boolean,
      default: false,
    },
    cargandoMasPublicaciones: {
      type: Boolean,
      default: false,
    },
  },
  emits: [
    "cambiar-tab",
    "postular",
    "abrir-proyecto",
    "ver-todos-proyectos",
    "ver-todas-oportunidades",
    "nueva-publicacion",
    "abrir-publicacion",
    "ver-comentarios",
    "no-disponible",
    "sin-perfil",
    "perfil-inactivo",
    "ver-proyecto-publicacion",
    "editar-publicacion",
    "invitar-colaborador",
    "eliminar-publicacion",
    "reintentar-publicaciones",
    "cargar-mas-publicaciones",
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
        if (tab.id === "oportunidades") {
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
      return this.tabActiva === "proyectos";
    },
    mostrarOportunidades() {
      return this.tabActiva === "oportunidades";
    },
    mostrarPublicaciones() {
      return this.tabActiva === "todo";
    },
    mostrarProyectosAside() {
      return this.tabActiva !== "proyectos";
    },
    mostrarOportunidadesAside() {
      return this.tabActiva !== "oportunidades";
    },
    proyectosVisibles() {
      return this.proyectos;
    },
    oportunidadesVisibles() {
      return this.oportunidades;
    },
    proyectosAsideVisibles() {
      return this.proyectos.slice(0, 3);
    },
    oportunidadesAsideVisibles() {
      return this.oportunidades.slice(0, 3);
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
    verTodasOportunidades() {
      if (this.tabActiva === "todo") {
        this.$emit("cambiar-tab", "oportunidades");
        return;
      }
      this.$emit("ver-todas-oportunidades");
    },
  },
};
</script>

<style scoped>
.home-feed {
  display: flex;
  flex-direction: column;
}

.home-feed__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  align-items: start;
  gap: 1.5rem;
}

.home-feed__principal {
  min-width: 0;
}

.home-feed__aside {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  position: sticky;
  top: 1rem;
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

@media (max-width: 1050px) {
  .home-feed__layout {
    grid-template-columns: 1fr;
  }

  .home-feed__aside {
    position: static;
    order: 2;
  }
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
