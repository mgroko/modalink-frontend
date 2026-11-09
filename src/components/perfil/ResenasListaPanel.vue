<template>
  <section class="resenas-lista">
    <button
      type="button"
      class="resenas-lista__volver"
      @click="$emit('volver-perfil')"
    >
      ← Volver al perfil
    </button>

    <div class="resenas-lista__cabecera">
      <h2 class="resenas-lista__titulo">
        Reseñas de {{ nombrePerfil || "este perfil" }}
      </h2>
    </div>

    <div v-if="cargando" class="resenas-lista__estado">
      Cargando reseñas…
    </div>

    <template v-else>
      <BaseAlert v-if="error" :message="error" type="error" />
      <VaButton
        v-if="error"
        class="resenas-lista__reintento"
        preset="secondary"
        @click="reintentar"
      >
        Reintentar
      </VaButton>

      <div
        v-else-if="resumenNormalizado.total === 0"
        class="resenas-lista__vacio"
      >
        Aún no hay reseñas para este perfil.
      </div>

      <template v-else>
        <div class="resenas-lista__resumen">
          <div class="resenas-lista__promedio">
            <b class="resenas-lista__promedio-numero">{{ promedioTexto }}</b>
            <div>
              <span
                class="resenas-lista__estrellas"
                :aria-label="`${estrellas} de 5 estrellas`"
              >
                <span
                  v-for="n in 5"
                  :key="n"
                  class="material-symbols-outlined"
                  :class="{ 'resenas-lista__estrella--activa': n <= estrellas }"
                >star</span>
              </span>
              <div class="resenas-lista__total">{{ totalTexto }}</div>
            </div>
          </div>

          <div class="resenas-lista__barras">
            <div
              v-for="fila in resumenNormalizado.distribucion"
              :key="fila.valoracion"
              class="resenas-lista__barra"
            >
              <span class="resenas-lista__barra-label">
                {{ fila.valoracion }}★
              </span>
              <div class="resenas-lista__barra-track">
                <span :style="{ width: `${porcentajeBarra(fila)}%` }"></span>
              </div>
              <span class="resenas-lista__barra-cantidad">
                {{ fila.cantidad }}
              </span>
            </div>
          </div>
        </div>

        <div class="resenas-lista__items">
          <article
            v-for="resena in calificaciones"
            :key="resena.idCalificacion"
            class="resenas-lista__item"
            role="button"
            tabindex="0"
            @click="$emit('ver-resena', resena.idCalificacion)"
            @keydown.enter.prevent="$emit('ver-resena', resena.idCalificacion)"
            @keydown.space.prevent="$emit('ver-resena', resena.idCalificacion)"
          >
            <div class="resenas-lista__item-cabecera">
              <span class="resenas-lista__avatar">
                <img
                  v-if="foto(resena)"
                  :src="foto(resena)"
                  :alt="nombre(resena)"
                />
                <span v-else>{{ inicialesDeResena(resena) }}</span>
              </span>

              <div class="resenas-lista__item-info">
                <button
                  type="button"
                  class="resenas-lista__autor"
                  @click.stop="$emit('ver-perfil-autor', resena.emisor?.idPerfil)"
                  @keydown.stop
                >
                  {{ nombre(resena) }}
                </button>
                <span class="resenas-lista__profesion">
                  {{ resena.emisor.profesion || "Profesional" }}
                </span>
              </div>

              <span
                class="resenas-lista__estrellas"
                :aria-label="`${resena.valoracion} de 5 estrellas`"
              >
                <span
                  v-for="n in 5"
                  :key="n"
                  class="material-symbols-outlined"
                  :class="{ 'resenas-lista__estrella--activa': n <= resena.valoracion }"
                >star</span>
              </span>
            </div>

            <span v-if="resena.proyecto.nombre" class="resenas-lista__chip">
              {{ resena.proyecto.nombre }}
            </span>

            <p class="resenas-lista__texto">{{ resena.resenia }}</p>
          </article>
        </div>

        <div v-if="hayMas" class="resenas-lista__mas">
          <VaButton
            preset="secondary"
            :loading="cargandoMas"
            @click="cargarMas"
          >
            Cargar más reseñas
          </VaButton>
        </div>
      </template>
    </template>
  </section>
</template>

<script>
import BaseAlert from "../AlertaBase.vue";
import calificacionPerfilService from "../../services/calificacionPerfilService";
import { mensajeErrorApi } from "../../utils/apiError";
import { resolverFotoUrl } from "../../utils/fotos";
import {
  estrellasLlenas,
  formatearPromedio,
  iniciales as inicialesDe,
  nombreAutor,
  normalizarResena,
  normalizarResumen,
  porcentaje,
  textoTotalResenas,
} from "../../utils/resenasConstants";

export default {
  name: "ResenasListaPanel",
  components: {
    BaseAlert,
  },
  props: {
    idPerfil: {
      type: [Number, String],
      required: true,
    },
    nombrePerfil: {
      type: String,
      default: "",
    },
    esPropio: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["ver-resena", "ver-perfil-autor", "volver-perfil"],
  data() {
    return {
      resumen: { promedio: 0, total: 0, distribucion: [] },
      calificaciones: [],
      pagina: 0,
      totalPaginas: 0,
      ultima: true,
      cargando: true,
      cargandoMas: false,
      error: "",
      controlador: null,
    };
  },
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
    hayMas() {
      return !this.ultima;
    },
  },
  watch: {
    idPerfil() {
      this.cargar(0, false);
    },
  },
  mounted() {
    this.cargar(0, false);
  },
  beforeUnmount() {
    this.abortar();
  },
  methods: {
    async cargar(pagina = 0, acumular = false) {
      if (acumular) {
        this.cargandoMas = true;
      } else {
        this.abortar();
        this.cargando = true;
        this.cargandoMas = false;
        this.error = "";
      }

      const controller = new AbortController();
      this.controlador = controller;

      try {
        const response = await calificacionPerfilService.listar(this.idPerfil, {
          page: pagina,
          size: 10,
          signal: controller.signal,
        });

        const data = response?.data || {};
        const paginaData = data.calificaciones || {};
        const nuevas = Array.isArray(paginaData.contenido)
          ? paginaData.contenido.map(normalizarResena)
          : [];

        this.resumen = normalizarResumen(data.resumen);
        this.calificaciones = acumular
          ? [...this.calificaciones, ...nuevas]
          : nuevas;
        this.pagina = Number(paginaData.paginaActual ?? pagina) || 0;
        this.totalPaginas = Number(paginaData.totalPaginas) || 0;
        this.ultima = paginaData.ultima !== false;
      } catch (error) {
        if (esCancelado(error)) return;
        this.error = mensajeErrorApi(
          error,
          "No se pudieron cargar las reseñas."
        );
      } finally {
        if (this.controlador === controller) {
          this.cargando = false;
          this.cargandoMas = false;
        }
      }
    },
    cargarMas() {
      if (this.cargandoMas || this.ultima) return;
      this.cargar(this.pagina + 1, true);
    },
    reintentar() {
      this.cargar(0, false);
    },
    abortar() {
      if (this.controlador) {
        this.controlador.abort();
        this.controlador = null;
      }
    },
    nombre(resena) {
      return nombreAutor(resena?.emisor);
    },
    inicialesDeResena(resena) {
      return inicialesDe(this.nombre(resena));
    },
    foto(resena) {
      return resolverFotoUrl(resena?.emisor?.fotoUrl);
    },
    porcentajeBarra(fila) {
      return porcentaje(fila?.cantidad, this.resumenNormalizado.total);
    },
  },
};

function esCancelado(error) {
  return error?.name === "CanceledError" || error?.code === "ERR_CANCELED";
}
</script>

<style scoped>
.resenas-lista {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 1.25rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.resenas-lista__volver {
  align-self: flex-start;
  padding: 0;
  border: 0;
  background: none;
  color: var(--color-primary);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}

.resenas-lista__cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.resenas-lista__titulo {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--color-text);
}

.resenas-lista__estado,
.resenas-lista__vacio {
  padding: 1rem;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.resenas-lista__reintento {
  align-self: flex-start;
}

.resenas-lista__resumen {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.resenas-lista__promedio {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.resenas-lista__promedio-numero {
  font-size: 2rem;
  line-height: 1;
  font-weight: 800;
  color: var(--color-text);
}

.resenas-lista__estrellas {
  display: inline-flex;
  align-items: center;
  gap: 0.02rem;
}

.resenas-lista__estrellas .material-symbols-outlined {
  font-size: 0.95rem;
  color: var(--color-border-strong);
}

.resenas-lista__estrella--activa {
  color: var(--color-warning) !important;
}

.resenas-lista__total {
  font-size: 0.72rem;
  color: var(--color-text-muted);
}

.resenas-lista__barras {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.resenas-lista__barra {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.resenas-lista__barra-label {
  width: 24px;
  flex: none;
}

.resenas-lista__barra-track {
  flex: 1;
  height: 8px;
  overflow: hidden;
  background: var(--color-border);
  border-radius: 999px;
}

.resenas-lista__barra-track span {
  display: block;
  height: 100%;
  background: var(--color-warning);
  border-radius: 999px;
}

.resenas-lista__barra-cantidad {
  width: 20px;
  flex: none;
  text-align: right;
}

.resenas-lista__items {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--color-border-soft);
}

.resenas-lista__item {
  display: block;
  width: 100%;
  padding: 0.85rem 0;
  border: 0;
  border-bottom: 1px solid var(--color-border-soft);
  background: none;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.resenas-lista__item:last-child {
  border-bottom: 0;
}

.resenas-lista__item:hover .resenas-lista__autor {
  text-decoration: underline;
}

.resenas-lista__item-cabecera {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.resenas-lista__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--color-surface-muted);
  color: var(--color-text);
  font-size: 0.78rem;
  font-weight: 700;
  flex: none;
}

.resenas-lista__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.resenas-lista__item-info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
  flex: 1;
}

.resenas-lista__autor {
  align-self: flex-start;
  padding: 0;
  border: 0;
  background: none;
  color: var(--color-text);
  font-size: 0.85rem;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
}

.resenas-lista__profesion {
  font-size: 0.72rem;
  color: var(--color-text-muted);
}

.resenas-lista__chip {
  display: inline-block;
  margin-top: 0.55rem;
  padding: 0.2rem 0.6rem;
  background: var(--color-surface-muted);
  border-radius: 999px;
  color: var(--color-primary);
  font-size: 0.7rem;
  font-weight: 600;
}

.resenas-lista__texto {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0.45rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.82rem;
  line-height: 1.45;
}

.resenas-lista__mas {
  display: flex;
  justify-content: center;
  padding-top: 0.25rem;
}
</style>
