<template>
  <div class="casting-polaroids">
    <div v-if="!polaroids.length" class="casting-polaroids__vacio">
      <span class="material-symbols-outlined" aria-hidden="true">
        photo_camera
      </span>
      <p>Este perfil todavía no tiene polaroids.</p>
    </div>

    <template v-else>
      <div class="casting-polaroids__carrusel">
        <button
          v-if="paginas.length > 1"
          type="button"
          class="casting-polaroids__flecha"
          :disabled="paginaActual === 0"
          aria-label="Polaroids anteriores"
          @click="anterior"
        >
          <span class="material-symbols-outlined" aria-hidden="true">
            chevron_left
          </span>
        </button>

        <div class="casting-polaroids__fotos">
          <button
            v-for="(polaroid, indice) in fotosPagina"
            :key="polaroid.idPolaroid || indice"
            type="button"
            class="casting-polaroids__foto"
            :aria-label="`Ver polaroid ${etiqueta(polaroid)}`"
            @click="abrirVisor(indice)"
          >
            <img
              :src="resolverFotoUrl(polaroid.url)"
              :alt="polaroid.tipo?.nombreCompleto || 'Polaroid'"
              class="casting-polaroids__imagen"
              loading="lazy"
            />
            <span class="casting-polaroids__etiqueta">
              {{ etiqueta(polaroid) }}
            </span>
          </button>
        </div>

        <button
          v-if="paginas.length > 1"
          type="button"
          class="casting-polaroids__flecha"
          :disabled="paginaActual >= paginas.length - 1"
          aria-label="Polaroids siguientes"
          @click="siguiente"
        >
          <span class="material-symbols-outlined" aria-hidden="true">
            chevron_right
          </span>
        </button>
      </div>

      <p v-if="paginas.length > 1" class="casting-polaroids__contador">
        {{ paginaActual + 1 }} / {{ paginas.length }}
      </p>
    </template>

    <ModalVisorPolaroids
      v-model="visorVisible"
      :polaroids="polaroids"
      :indice-inicial="indiceVisor"
    />
  </div>
</template>

<script>
import ModalVisorPolaroids from "../perfil/ModalVisorPolaroids.vue";
import { resolverFotoUrl } from "../../utils/fotos.js";
import {
  agruparEnPaginas,
  etiquetaPolaroid,
} from "../../utils/castingConstants.js";

export default {
  name: "CastingPolaroids",
  components: { ModalVisorPolaroids },
  props: {
    polaroids: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      paginaActual: 0,
      visorVisible: false,
      indiceVisor: 0,
    };
  },
  computed: {
    paginas() {
      return agruparEnPaginas(this.polaroids, 3);
    },
    fotosPagina() {
      return this.paginas[this.paginaActual] || [];
    },
  },
  watch: {
    polaroids() {
      if (this.paginaActual >= this.paginas.length) {
        this.paginaActual = Math.max(0, this.paginas.length - 1);
      }
    },
  },
  methods: {
    resolverFotoUrl,
    etiqueta(polaroid) {
      return etiquetaPolaroid(polaroid);
    },
    anterior() {
      if (this.paginaActual > 0) this.paginaActual -= 1;
    },
    siguiente() {
      if (this.paginaActual < this.paginas.length - 1) {
        this.paginaActual += 1;
      }
    },
    abrirVisor(indicePagina) {
      this.indiceVisor = this.paginaActual * 3 + indicePagina;
      this.visorVisible = true;
    },
  },
};
</script>

<style scoped>
.casting-polaroids {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.casting-polaroids__vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  min-height: 8.5rem;
  padding: 1rem;
  border: 1px dashed var(--color-border);
  border-radius: 12px;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  font-size: 0.8rem;
  text-align: center;
}

.casting-polaroids__vacio p {
  margin: 0;
}

.casting-polaroids__vacio .material-symbols-outlined {
  font-size: 1.5rem;
}

.casting-polaroids__carrusel {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.casting-polaroids__fotos {
  display: flex;
  flex: 1;
  align-items: stretch;
  justify-content: center;
  gap: 0.55rem;
  min-width: 0;
}

.casting-polaroids__foto {
  display: flex;
  flex: 0 1 32%;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 0;
  padding: 0;
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.casting-polaroids__imagen {
  width: 100%;
  aspect-ratio: 3 / 4;
  object-fit: cover;
  border-radius: 10px;
  background: var(--color-surface-muted);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.casting-polaroids__foto:hover .casting-polaroids__imagen {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgb(0 0 0 / 0.18);
}

.casting-polaroids__foto:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: 10px;
}

.casting-polaroids__etiqueta {
  color: var(--color-text-muted);
  font-size: 0.7rem;
  line-height: 1.2;
  text-align: center;
}

.casting-polaroids__flecha {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 1.65rem;
  height: 2.2rem;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
}

.casting-polaroids__flecha:disabled {
  opacity: 0.35;
  cursor: default;
}

.casting-polaroids__flecha .material-symbols-outlined {
  font-size: 1.15rem;
}

.casting-polaroids__contador {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.7rem;
  text-align: center;
}
</style>
