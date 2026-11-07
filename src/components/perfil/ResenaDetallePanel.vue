<template>
  <section class="resena-detalle">
    <button
      type="button"
      class="resena-detalle__volver"
      @click="$emit('volver-listado')"
    >
      ← Todas las reseñas
    </button>

    <div v-if="cargando" class="resena-detalle__estado">
      Cargando reseña…
    </div>

    <div v-else-if="noEncontrada" class="resena-detalle__vacio">
      <p>La reseña no existe o ya no está disponible.</p>
      <VaButton preset="secondary" @click="$emit('volver-listado')">
        Volver al listado
      </VaButton>
    </div>

    <template v-else>
      <BaseAlert v-if="error" :message="error" type="error" />
      <VaButton
        v-if="error"
        class="resena-detalle__reintento"
        preset="secondary"
        @click="reintentar"
      >
        Reintentar
      </VaButton>

      <template v-else-if="resena">
        <div class="resena-detalle__autor">
          <span class="resena-detalle__avatar">
            <img
              v-if="foto"
              :src="foto"
              :alt="nombreAutorResena"
            />
            <span v-else>{{ inicialesAutor }}</span>
          </span>

          <div class="resena-detalle__autor-info">
            <button
              type="button"
              class="resena-detalle__nombre"
              @click="$emit('ver-perfil-autor', resena.emisor?.idPerfil)"
            >
              {{ nombreAutorResena }}
            </button>
            <span class="resena-detalle__profesion">
              {{ resena.emisor.profesion || "Profesional" }}
            </span>
          </div>
        </div>

        <div class="resena-detalle__meta">
          <span
            class="resena-detalle__estrellas"
            :aria-label="`${resena.valoracion} de 5 estrellas`"
          >
            <span
              v-for="n in 5"
              :key="n"
              class="material-symbols-outlined"
              :class="{ 'resena-detalle__estrella--activa': n <= resena.valoracion }"
            >star</span>
          </span>
          <span class="resena-detalle__fecha">{{ fechaTexto }}</span>
        </div>

        <span class="resena-detalle__label">Proyecto asociado</span>
        <span v-if="resena.proyecto.nombre" class="resena-detalle__chip">
          <span class="material-symbols-outlined resena-detalle__chip-icono">folder</span>
          {{ resena.proyecto.nombre }}
        </span>
        <span v-else class="resena-detalle__sin-dato">Sin proyecto asociado</span>

        <span class="resena-detalle__label">Descripción</span>
        <div class="resena-detalle__quote">{{ resena.resenia }}</div>

        <div class="resena-detalle__acciones">
          <VaButton preset="secondary" @click="$emit('volver-listado')">
            Volver al listado
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
import { formatearFechaResena } from "../../utils/fechas";
import { resolverFotoUrl } from "../../utils/fotos";
import {
  iniciales as inicialesDe,
  nombreAutor,
  normalizarResena,
} from "../../utils/resenasConstants";

export default {
  name: "ResenaDetallePanel",
  components: {
    BaseAlert,
  },
  props: {
    idPerfil: {
      type: [Number, String],
      required: true,
    },
    idCalificacion: {
      type: [Number, String],
      required: true,
    },
  },
  emits: ["volver-listado", "ver-perfil-autor"],
  data() {
    return {
      resena: null,
      cargando: true,
      noEncontrada: false,
      error: "",
      controlador: null,
    };
  },
  computed: {
    nombreAutorResena() {
      return nombreAutor(this.resena?.emisor);
    },
    inicialesAutor() {
      return inicialesDe(this.nombreAutorResena);
    },
    foto() {
      return resolverFotoUrl(this.resena?.emisor?.fotoUrl);
    },
    fechaTexto() {
      return formatearFechaResena(this.resena?.fechaRegistro);
    },
  },
  watch: {
    idPerfil() {
      this.cargar();
    },
    idCalificacion() {
      this.cargar();
    },
  },
  mounted() {
    this.cargar();
  },
  beforeUnmount() {
    this.abortar();
  },
  methods: {
    async cargar() {
      this.abortar();
      this.cargando = true;
      this.noEncontrada = false;
      this.error = "";
      this.resena = null;

      const controller = new AbortController();
      this.controlador = controller;

      try {
        const response = await calificacionPerfilService.obtener(
          this.idPerfil,
          this.idCalificacion,
          controller.signal
        );

        this.resena = normalizarResena(response?.data);
      } catch (error) {
        if (esCancelado(error)) return;

        if (error?.response?.status === 404) {
          this.noEncontrada = true;
          return;
        }

        this.error = mensajeErrorApi(
          error,
          "No se pudo cargar la reseña."
        );
      } finally {
        if (this.controlador === controller) {
          this.cargando = false;
        }
      }
    },
    reintentar() {
      this.cargar();
    },
    abortar() {
      if (this.controlador) {
        this.controlador.abort();
        this.controlador = null;
      }
    },
  },
};

function esCancelado(error) {
  return error?.name === "CanceledError" || error?.code === "ERR_CANCELED";
}
</script>

<style scoped>
.resena-detalle {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 1.25rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.resena-detalle__volver {
  align-self: flex-start;
  padding: 0;
  border: 0;
  background: none;
  color: var(--color-primary);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}

.resena-detalle__estado,
.resena-detalle__vacio {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.resena-detalle__vacio p {
  margin: 0;
}

.resena-detalle__reintento {
  align-self: flex-start;
}

.resena-detalle__autor {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.25rem;
}

.resena-detalle__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--color-surface-muted);
  color: var(--color-text);
  font-size: 1rem;
  font-weight: 700;
  flex: none;
}

.resena-detalle__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.resena-detalle__autor-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.resena-detalle__nombre {
  align-self: flex-start;
  padding: 0;
  border: 0;
  background: none;
  color: var(--color-text);
  font-size: 1.05rem;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
}

.resena-detalle__nombre:hover {
  text-decoration: underline;
}

.resena-detalle__profesion {
  font-size: 0.78rem;
  color: var(--color-text-muted);
}

.resena-detalle__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.resena-detalle__estrellas {
  display: inline-flex;
  align-items: center;
  gap: 0.03rem;
}

.resena-detalle__estrellas .material-symbols-outlined {
  font-size: 1.35rem;
  color: var(--color-border-strong);
}

.resena-detalle__estrella--activa {
  color: var(--color-warning) !important;
}

.resena-detalle__fecha {
  font-size: 0.78rem;
  color: var(--color-text-muted);
}

.resena-detalle__label {
  margin-top: 0.35rem;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--color-text);
}

.resena-detalle__chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  align-self: flex-start;
  padding: 0.25rem 0.7rem;
  background: var(--color-surface-muted);
  border-radius: 999px;
  color: var(--color-primary);
  font-size: 0.75rem;
  font-weight: 600;
}

.resena-detalle__chip-icono {
  font-size: 0.95rem;
}

.resena-detalle__sin-dato {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.resena-detalle__quote {
  padding: 0.9rem 1rem;
  background: var(--color-surface-soft);
  border-radius: 10px;
  color: var(--color-text);
  font-size: 0.9rem;
  line-height: 1.55;
  white-space: pre-wrap;
}

.resena-detalle__acciones {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.5rem;
}
</style>
