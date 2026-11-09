<template>
  <section class="resenas-card">
    <h3 class="resenas-card__titulo">Reseñas</h3>

    <div v-if="cargando" class="resenas-card__vacio">Cargando reseñas…</div>

    <div v-else-if="error" class="resenas-card__error">
      <span>{{ error }}</span>
      <button type="button" class="resenas-card__link" @click="$emit('reintentar')">
        Reintentar
      </button>
    </div>

    <div v-else-if="resumenNormalizado.total === 0" class="resenas-card__vacio">
      Aún no hay reseñas.
    </div>

    <template v-else>
      <div class="resenas-card__promedio">
        <b class="resenas-card__promedio-numero">{{ promedioTexto }}</b>
        <div>
          <span
            class="resenas-card__estrellas"
            :aria-label="`${estrellas} de 5 estrellas`"
          >
            <span
              v-for="n in 5"
              :key="n"
              class="material-symbols-outlined"
              :class="{ 'resenas-card__estrella--activa': n <= estrellas }"
            >star</span>
          </span>
          <div class="resenas-card__total">{{ totalTexto }}</div>
        </div>
      </div>

      <article
        v-for="resena in resenas"
        :key="resena.idCalificacion"
        class="resenas-card__item"
        role="button"
        tabindex="0"
        @click="$emit('ver-resena', resena.idCalificacion)"
        @keydown.enter.prevent="$emit('ver-resena', resena.idCalificacion)"
        @keydown.space.prevent="$emit('ver-resena', resena.idCalificacion)"
      >
        <div class="resenas-card__item-cabecera">
          <span class="resenas-card__avatar">
            <img
              v-if="foto(resena)"
              :src="foto(resena)"
              :alt="nombre(resena)"
            />
            <span v-else>{{ inicialesDeResena(resena) }}</span>
          </span>
          <button
            type="button"
            class="resenas-card__autor"
            @click.stop="$emit('ver-perfil-autor', resena.emisor?.idPerfil)"
            @keydown.stop
          >
            {{ nombre(resena) }}
          </button>
        </div>

        <span
          class="resenas-card__estrellas resenas-card__estrellas--item"
          :aria-label="`${resena.valoracion} de 5 estrellas`"
        >
          <span
            v-for="n in 5"
            :key="n"
            class="material-symbols-outlined"
            :class="{ 'resenas-card__estrella--activa': n <= resena.valoracion }"
          >star</span>
        </span>

        <p class="resenas-card__descripcion">{{ resena.resenia }}</p>
      </article>

      <div class="resenas-card__acciones">
        <button type="button" class="resenas-card__link" @click="$emit('ver-todas')">
          Ver todas
        </button>
      </div>
    </template>
  </section>
</template>

<script>
import { resolverFotoUrl } from "../../utils/fotos";
import {
  estrellasLlenas,
  formatearPromedio,
  iniciales as inicialesDe,
  nombreAutor,
  normalizarResumen,
  textoTotalResenas,
} from "../../utils/resenasConstants";

export default {
  name: "ResenasCard",
  props: {
    resumen: {
      type: Object,
      default: () => ({ promedio: 0, total: 0, distribucion: [] }),
    },
    resenas: {
      type: Array,
      default: () => [],
    },
    cargando: {
      type: Boolean,
      default: false,
    },
    error: {
      type: String,
      default: "",
    },
  },
  emits: ["ver-todas", "ver-resena", "ver-perfil-autor", "reintentar"],
  computed: {
    resumenNormalizado() {
      return normalizarResumen(this.resumen);
    },
    promedioTexto() {
      return formatearPromedio(this.resumenNormalizado.promedio);
    },
    estrellas() {
      return estrellasLlenas(this.resumenNormalizado.promedio);
    },
    totalTexto() {
      return textoTotalResenas(this.resumenNormalizado.total);
    },
  },
  methods: {
    nombre(resena) {
      return nombreAutor(resena?.emisor);
    },
    inicialesDeResena(resena) {
      return inicialesDe(this.nombre(resena));
    },
    foto(resena) {
      return resolverFotoUrl(resena?.emisor?.fotoUrl);
    },
  },
};
</script>

<style scoped>
.resenas-card {
  padding: 1.25rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.resenas-card__titulo {
  margin: 0 0 0.85rem;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-text);
}

.resenas-card__vacio {
  font-size: 0.82rem;
  color: var(--color-text-muted);
}

.resenas-card__error {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.35rem;
  font-size: 0.78rem;
  color: var(--color-danger-text);
}

.resenas-card__promedio {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-bottom: 0.5rem;
}

.resenas-card__promedio-numero {
  font-size: 1.9rem;
  line-height: 1;
  font-weight: 800;
  color: var(--color-text);
}

.resenas-card__estrellas {
  display: inline-flex;
  align-items: center;
  gap: 0.02rem;
}

.resenas-card__estrellas .material-symbols-outlined {
  font-size: 0.95rem;
  color: var(--color-border-strong);
}

.resenas-card__estrella--activa {
  color: var(--color-warning) !important;
}

.resenas-card__total {
  font-size: 0.72rem;
  color: var(--color-text-muted);
}

.resenas-card__item {
  display: block;
  width: 100%;
  padding: 0.75rem 0;
  border: 0;
  border-top: 1px solid var(--color-border-soft);
  background: none;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.resenas-card__item:hover .resenas-card__autor {
  text-decoration: underline;
}

.resenas-card__item-cabecera {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.resenas-card__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--color-surface-muted);
  color: var(--color-text);
  font-size: 0.68rem;
  font-weight: 700;
  flex: none;
}

.resenas-card__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.resenas-card__autor {
  padding: 0;
  border: 0;
  background: none;
  color: var(--color-text);
  font-size: 0.82rem;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
}

.resenas-card__estrellas--item {
  margin-top: 0.25rem;
}

.resenas-card__descripcion {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0.35rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.8rem;
  line-height: 1.4;
}

.resenas-card__acciones {
  margin-top: 0.55rem;
}

.resenas-card__link {
  padding: 0;
  border: 0;
  background: none;
  color: var(--color-primary);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}
</style>
