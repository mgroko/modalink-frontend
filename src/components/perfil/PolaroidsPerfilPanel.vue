<template>
  <section v-if="mostrarPanel" class="polaroids-perfil inicio-perfil__panel">
    <div class="polaroids-perfil__cabecera">
      <div class="polaroids-perfil__titulo-grupo">
        <h2 class="inicio-perfil__panel-titulo">Polaroids</h2>
        <span class="polaroids-perfil__contador">
          {{ total }} de {{ maximo }}
        </span>
      </div>

      <VaButton
        v-if="puedeGestionar"
        preset="secondary"
        size="small"
        icon="mso-settings"
        @click="abrirGestion(false)"
      >
        Gestionar polaroids
      </VaButton>
    </div>

    <div
      v-if="cargando"
      class="polaroids-perfil__estado"
      role="status"
      aria-live="polite"
    >
      <span class="material-symbols-outlined" aria-hidden="true">
        hourglass_empty
      </span>
      Cargando polaroids...
    </div>

    <div v-else-if="error" class="polaroids-perfil__estado">
      <BaseAlert :message="error" type="error" />
      <VaButton preset="secondary" icon="mso-refresh" @click="cargar">
        Reintentar
      </VaButton>
    </div>

    <div v-else-if="!polaroids.length" class="polaroids-perfil__vacio">
      <span class="material-symbols-outlined" aria-hidden="true">
        photo_camera
      </span>
      <p>Todavía no hay polaroids.</p>
      <VaButton
        v-if="puedeGestionar"
        color="primary"
        icon="mso-add"
        @click="abrirGestion(true)"
      >
        Agregar polaroid
      </VaButton>
    </div>

    <div v-else class="polaroids-perfil__grid">
      <button
        v-for="(polaroid, indice) in polaroids"
        :key="polaroid.idPolaroid"
        type="button"
        class="polaroids-perfil__item"
        :aria-label="`Ver ${polaroid.tipo?.nombreCompleto || 'polaroid'}`"
        @click="abrirVisor(indice)"
      >
        <img
          :src="resolverImagen(polaroid)"
          :alt="polaroid.tipo?.nombreCompleto || 'Polaroid'"
          class="polaroids-perfil__imagen"
        />
        <span class="polaroids-perfil__tipo">
          {{ polaroid.tipo?.nombreCompleto || "Polaroid" }}
        </span>
      </button>
    </div>

    <ModalVisorPolaroids
      v-model="modalVisorVisible"
      :polaroids="polaroids"
      :indice-inicial="indiceVisor"
    />

    <ModalGestionPolaroids
      ref="gestion"
      v-model="modalGestionVisible"
      :id-perfil="idPerfil"
      :polaroids="polaroids"
      :maximo="maximo"
      @actualizado="cargar"
    />
  </section>
</template>

<script>
import BaseAlert from "../AlertaBase.vue";
import ModalGestionPolaroids from "./ModalGestionPolaroids.vue";
import ModalVisorPolaroids from "./ModalVisorPolaroids.vue";
import polaroidService from "../../services/polaroidService";
import { resolverFotoUrl } from "../../utils/fotos.js";
import {
  POLAROID_MAX_FALLBACK,
  mensajeErrorPolaroid,
  normalizarListadoPolaroids,
} from "../../utils/polaroidConstants.js";

export default {
  name: "PolaroidsPerfilPanel",
  components: {
    BaseAlert,
    ModalGestionPolaroids,
    ModalVisorPolaroids,
  },
  props: {
    idPerfil: {
      type: [Number, String],
      required: true,
    },
    esPropio: {
      type: Boolean,
      default: false,
    },
    puedeGestionar: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      cargando: true,
      error: "",
      maximo: POLAROID_MAX_FALLBACK,
      total: 0,
      polaroids: [],
      controlador: null,
      modalVisorVisible: false,
      indiceVisor: 0,
      modalGestionVisible: false,
    };
  },
  watch: {
    idPerfil() {
      this.cargar();
    },
  },
  mounted() {
    this.cargar();
  },
  computed: {
    mostrarPanel() {
      return (
        this.esPropio ||
        this.cargando ||
        this.total > 0 ||
        !!this.error
      );
    },
  },
  beforeUnmount() {
    if (this.controlador) this.controlador.abort();
  },
  methods: {
    resolverImagen(polaroid) {
      return resolverFotoUrl(polaroid?.url);
    },
    async cargar() {
      if (this.idPerfil == null) return;

      if (this.controlador) this.controlador.abort();
      const controller = new AbortController();
      this.controlador = controller;
      this.cargando = true;
      this.error = "";

      try {
        const response = await polaroidService.listar(
          this.idPerfil,
          controller.signal
        );
        if (this.controlador !== controller) return;

        const data = normalizarListadoPolaroids(response?.data);
        this.maximo = data.maximo;
        this.total = data.total;
        this.polaroids = data.polaroids;
      } catch (error) {
        if (
          this.controlador !== controller ||
          error?.code === "ERR_CANCELED" ||
          error?.name === "CanceledError"
        ) {
          return;
        }
        this.polaroids = [];
        this.total = 0;
        this.error = mensajeErrorPolaroid(
          error,
          "No se pudieron cargar las polaroids."
        );
      } finally {
        if (this.controlador === controller) {
          this.cargando = false;
          this.controlador = null;
        }
      }
    },
    abrirVisor(indice) {
      this.indiceVisor = indice;
      this.modalVisorVisible = true;
    },
    abrirGestion(abrirAlta) {
      if (!this.puedeGestionar) return;
      this.modalGestionVisible = true;
      if (abrirAlta) {
        this.$nextTick(() => this.$refs.gestion?.abrirAlta());
      }
    },
  },
};
</script>

<style scoped>
.polaroids-perfil {
  display: grid;
  gap: 0.9rem;
}

.polaroids-perfil__cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.polaroids-perfil__titulo-grupo {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.polaroids-perfil__titulo-grupo .inicio-perfil__panel-titulo {
  margin: 0;
}

.polaroids-perfil__contador {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.55rem;
  color: var(--color-text-muted);
  background: var(--color-surface-muted);
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
}

.polaroids-perfil__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.8rem;
}

.polaroids-perfil__item {
  display: grid;
  gap: 0.35rem;
  min-width: 0;
  padding: 0;
  color: var(--color-text);
  text-align: left;
  background: transparent;
  border: 0;
  font: inherit;
  cursor: zoom-in;
}

.polaroids-perfil__imagen {
  width: 100%;
  aspect-ratio: 4 / 5;
  object-fit: cover;
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border);
  border-radius: 7px;
  transition:
    border-color 0.15s ease,
    transform 0.15s ease;
}

.polaroids-perfil__item:hover .polaroids-perfil__imagen,
.polaroids-perfil__item:focus-visible .polaroids-perfil__imagen {
  border-color: var(--color-primary);
  transform: translateY(-1px);
}

.polaroids-perfil__item:focus-visible {
  outline: none;
}

.polaroids-perfil__tipo {
  overflow: hidden;
  color: var(--color-text);
  font-size: 0.76rem;
  font-weight: 600;
  line-height: 1.35;
  text-overflow: ellipsis;
}

.polaroids-perfil__estado,
.polaroids-perfil__vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.55rem;
  padding: 1.7rem 1rem;
  color: var(--color-text-muted);
  font-size: 0.82rem;
  text-align: center;
}

.polaroids-perfil__vacio .material-symbols-outlined {
  font-size: 2rem;
}

.polaroids-perfil__vacio p {
  margin: 0;
}

@media (max-width: 900px) {
  .polaroids-perfil__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .polaroids-perfil__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
