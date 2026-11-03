<template>
  <section v-if="reprogramacion" class="reprogramacion-resumen">
    <header class="reprogramacion-resumen__cabecera">
      <div>
        <h3 class="reprogramacion-resumen__titulo">Reprogramación automática</h3>
        <p class="reprogramacion-resumen__subtitulo">
          Resultado de guardar la jornada en los proyectos confirmados.
        </p>
      </div>
    </header>

    <p v-if="sinProyectos" class="reprogramacion-resumen__info">
      <span class="material-symbols-outlined" aria-hidden="true">info</span>
      No hubo proyectos confirmados afectados.
    </p>

    <section v-if="exitosos.length" class="reprogramacion-resumen__bloque">
      <h4 class="reprogramacion-resumen__subtitulo-fuerte">
        Proyectos reprogramados
      </h4>

      <ul class="reprogramacion-resumen__lista">
        <li
          v-for="proyecto in exitosos"
          :key="`exito-${proyecto.idProyecto}`"
          class="reprogramacion-resumen__item reprogramacion-resumen__item--exito"
        >
          <div class="reprogramacion-resumen__item-cabecera">
            <div>
              <p class="reprogramacion-resumen__nombre">
                {{ proyecto.nombreProyecto || `Proyecto #${proyecto.idProyecto}` }}
              </p>
              <p class="reprogramacion-resumen__detalle">
                {{ cantidadMovidas(proyecto) }}
                {{
                  cantidadMovidas(proyecto) === 1
                    ? "actividad movida"
                    : "actividades movidas"
                }}
              </p>
            </div>

            <router-link
              class="reprogramacion-resumen__enlace"
              :to="enlaceCronograma(proyecto.idProyecto)"
            >
              Ver cronograma
              <span class="material-symbols-outlined" aria-hidden="true">
                arrow_forward
              </span>
            </router-link>
          </div>

          <div
            v-if="proyecto.conflictosFijos.length"
            class="reprogramacion-resumen__aviso"
          >
            <p class="reprogramacion-resumen__aviso-titulo">
              <span class="material-symbols-outlined" aria-hidden="true">
                warning
              </span>
              Actividades que no se movieron
            </p>
            <p class="reprogramacion-resumen__aviso-texto">
              Hay actividades en curso o finalizadas que quedaron fuera de la
              nueva disponibilidad.
            </p>
            <ul class="reprogramacion-resumen__bloqueos">
              <li
                v-for="(bloqueo, indice) in proyecto.conflictosFijos"
                :key="`conflicto-${proyecto.idProyecto}-${indice}`"
              >
                {{ bloqueo.mensaje || bloqueo.codigo }}
              </li>
            </ul>
          </div>
        </li>
      </ul>
    </section>

    <section v-if="fallidos.length" class="reprogramacion-resumen__bloque">
      <h4 class="reprogramacion-resumen__subtitulo-fuerte">
        Proyectos que no se pudieron reprogramar
      </h4>
      <p class="reprogramacion-resumen__nota">
        Estos proyectos no se modificaron. Podés corregir la disponibilidad y
        reintentar.
      </p>

      <ul class="reprogramacion-resumen__lista">
        <li
          v-for="proyecto in fallidos"
          :key="`fallido-${proyecto.idProyecto}`"
          class="reprogramacion-resumen__item reprogramacion-resumen__item--fallido"
        >
          <div class="reprogramacion-resumen__item-cabecera">
            <div>
              <p class="reprogramacion-resumen__nombre">
                {{ proyecto.nombreProyecto || `Proyecto #${proyecto.idProyecto}` }}
              </p>
              <p v-if="proyecto.codigo" class="reprogramacion-resumen__codigo">
                {{ proyecto.codigo }}
              </p>
            </div>
          </div>

          <p class="reprogramacion-resumen__detalle">
            {{ proyecto.mensaje || "El proyecto no tiene un plan viable." }}
          </p>

          <ul
            v-if="proyecto.bloqueos.length"
            class="reprogramacion-resumen__bloqueos"
          >
            <li
              v-for="(bloqueo, indice) in proyecto.bloqueos"
              :key="`bloqueo-${proyecto.idProyecto}-${indice}`"
            >
              {{ bloqueo.mensaje || bloqueo.codigo }}
            </li>
          </ul>

          <div
            v-if="errorDe(proyecto.idProyecto)"
            class="reprogramacion-resumen__error"
          >
            <p>{{ errorDe(proyecto.idProyecto).mensaje }}</p>
            <ul
              v-if="errorDe(proyecto.idProyecto).bloqueos.length"
              class="reprogramacion-resumen__bloqueos"
            >
              <li
                v-for="(bloqueo, indice) in errorDe(proyecto.idProyecto).bloqueos"
                :key="`error-${proyecto.idProyecto}-${indice}`"
              >
                {{ bloqueo.mensaje || bloqueo.codigo }}
              </li>
            </ul>
          </div>

          <VaButton
            v-if="esDirector(proyecto.idProyecto)"
            preset="secondary"
            size="small"
            :loading="reintentandoId != null && String(reintentandoId) === String(proyecto.idProyecto)"
            :disabled="reintentandoId != null"
            @click="$emit('reintentar', proyecto.idProyecto)"
          >
            Reintentar reprogramación
          </VaButton>
        </li>
      </ul>
    </section>
  </section>
</template>

<script>
import { cantidadActividadesMovidas } from "../../utils/reprogramacionConstants.js";

export default {
  name: "ReprogramacionResumen",
  props: {
    reprogramacion: {
      type: Object,
      default: null,
    },
    proyectosDirector: {
      type: Array,
      default: () => [],
    },
    reintentandoId: {
      type: [Number, String],
      default: null,
    },
    erroresReintento: {
      type: Object,
      default: () => ({}),
    },
  },
  emits: ["reintentar"],
  computed: {
    totalProyectos() {
      return Number(this.reprogramacion?.totalProyectos) || 0;
    },
    sinProyectos() {
      return (
        this.totalProyectos === 0 &&
        this.exitosos.length === 0 &&
        this.fallidos.length === 0
      );
    },
    exitosos() {
      return Array.isArray(this.reprogramacion?.exitosos)
        ? this.reprogramacion.exitosos
        : [];
    },
    fallidos() {
      return Array.isArray(this.reprogramacion?.fallidos)
        ? this.reprogramacion.fallidos
        : [];
    },
  },
  methods: {
    cantidadMovidas(proyecto) {
      return cantidadActividadesMovidas(proyecto);
    },
    enlaceCronograma(idProyecto) {
      return {
        name: "dashboard-proyecto",
        params: { id: idProyecto },
        query: { tab: "planificacion", vista: "cronograma" },
      };
    },
    esDirector(idProyecto) {
      return this.proyectosDirector.some(
        (id) => String(id) === String(idProyecto)
      );
    },
    errorDe(idProyecto) {
      return this.erroresReintento?.[idProyecto] ||
        this.erroresReintento?.[String(idProyecto)] ||
        null;
    },
  },
};
</script>

<style scoped>
.reprogramacion-resumen {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.25rem;
  padding: 1rem 1.15rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
}

.reprogramacion-resumen__cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.reprogramacion-resumen__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1rem;
}

.reprogramacion-resumen__subtitulo {
  margin: 0.2rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.reprogramacion-resumen__info {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin: 0;
  padding: 0.6rem 0.7rem;
  border: 1px solid var(--color-info-border);
  border-radius: 8px;
  background: var(--color-info-soft);
  color: var(--color-info-text);
  font-size: 0.82rem;
}

.reprogramacion-resumen__info .material-symbols-outlined {
  font-size: 1rem;
}

.reprogramacion-resumen__bloque {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.reprogramacion-resumen__subtitulo-fuerte {
  margin: 0;
  color: var(--color-text);
  font-size: 0.86rem;
  font-weight: 700;
}

.reprogramacion-resumen__nota {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.8rem;
  line-height: 1.45;
}

.reprogramacion-resumen__lista {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.reprogramacion-resumen__item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem 0.8rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface-soft);
}

.reprogramacion-resumen__item--exito {
  border-color: var(--color-success-border);
}

.reprogramacion-resumen__item--fallido {
  border-color: var(--color-warning-border);
}

.reprogramacion-resumen__item-cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.reprogramacion-resumen__nombre {
  margin: 0;
  color: var(--color-text);
  font-size: 0.86rem;
  font-weight: 600;
}

.reprogramacion-resumen__detalle {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.78rem;
  line-height: 1.4;
}

.reprogramacion-resumen__codigo {
  margin: 0.15rem 0 0;
  color: var(--color-warning-text);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.reprogramacion-resumen__enlace {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  color: var(--color-primary);
  font-size: 0.78rem;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
}

.reprogramacion-resumen__enlace:hover {
  text-decoration: underline;
}

.reprogramacion-resumen__enlace .material-symbols-outlined {
  font-size: 1rem;
}

.reprogramacion-resumen__aviso {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.55rem 0.65rem;
  border: 1px solid var(--color-warning-border);
  border-radius: 7px;
  background: var(--color-warning-soft);
  color: var(--color-warning-text);
}

.reprogramacion-resumen__aviso-titulo {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin: 0;
  font-size: 0.78rem;
  font-weight: 700;
}

.reprogramacion-resumen__aviso-titulo .material-symbols-outlined {
  font-size: 0.95rem;
}

.reprogramacion-resumen__aviso-texto {
  margin: 0;
  font-size: 0.76rem;
  line-height: 1.4;
}

.reprogramacion-resumen__bloqueos {
  margin: 0;
  padding-left: 1rem;
  font-size: 0.76rem;
  line-height: 1.4;
}

.reprogramacion-resumen__error {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.55rem 0.65rem;
  border: 1px solid var(--color-danger-border);
  border-radius: 7px;
  background: var(--color-danger-soft);
  color: var(--color-danger-text);
  font-size: 0.78rem;
}

.reprogramacion-resumen__error p {
  margin: 0;
}
</style>
