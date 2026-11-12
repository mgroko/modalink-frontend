<template>
  <article class="colaboracion-automatica-card">
    <header class="colaboracion-automatica-card__cabecera">
      <div class="colaboracion-automatica-card__identidad">
        <span class="material-symbols-outlined" aria-hidden="true">
          auto_awesome
        </span>
        <div>
          <p class="colaboracion-automatica-card__titulo">
            Colaboración automática
          </p>
          <p class="colaboracion-automatica-card__descripcion">
            {{ descripcionEstado }}
          </p>
        </div>
      </div>
      <EstadoColaboracionAutomaticaBadge :estado="estado" />
    </header>

    <div class="colaboracion-automatica-card__publicaciones">
      <div
        class="colaboracion-automatica-card__publicacion"
        :class="{
          'colaboracion-automatica-card__publicacion--eliminada':
            propiaEliminada,
          'colaboracion-automatica-card__publicacion--clickeable':
            puedeAbrirPropia,
        }"
        :role="puedeAbrirPropia ? 'button' : null"
        :tabindex="puedeAbrirPropia ? 0 : null"
        @click="verPublicacion(propia)"
        @keydown.enter="verPublicacion(propia)"
      >
        <div class="colaboracion-automatica-card__portada">
          <img
            v-if="portadaPropia"
            :src="portadaPropia"
            :alt="tituloPropia"
          />
          <span v-else class="material-symbols-outlined" aria-hidden="true">
            image
          </span>
        </div>
        <div class="colaboracion-automatica-card__publicacion-info">
          <span class="colaboracion-automatica-card__rol">
            Tu publicación
          </span>
          <strong>{{ tituloPropia }}</strong>
          <span
            v-if="propiaEliminada"
            class="colaboracion-automatica-card__aviso"
          >
            Publicación eliminada
          </span>
        </div>
      </div>

      <span
        class="colaboracion-automatica-card__conector material-symbols-outlined"
        aria-hidden="true"
      >
        sync_alt
      </span>

      <div
        class="colaboracion-automatica-card__publicacion"
        :class="{
          'colaboracion-automatica-card__publicacion--eliminada':
            contraparteEliminada,
          'colaboracion-automatica-card__publicacion--clickeable':
            puedeAbrirContraparte,
        }"
        :role="puedeAbrirContraparte ? 'button' : null"
        :tabindex="puedeAbrirContraparte ? 0 : null"
        @click="verPublicacion(contraparte)"
        @keydown.enter="verPublicacion(contraparte)"
      >
        <div class="colaboracion-automatica-card__portada">
          <img
            v-if="portadaContraparte"
            :src="portadaContraparte"
            :alt="tituloContraparte"
          />
          <span v-else class="material-symbols-outlined" aria-hidden="true">
            image
          </span>
        </div>
        <div class="colaboracion-automatica-card__publicacion-info">
          <span class="colaboracion-automatica-card__rol">
            Publicación de {{ nombreContraparte }}
          </span>
          <strong>{{ tituloContraparte }}</strong>
          <span
            v-if="contraparteEliminada"
            class="colaboracion-automatica-card__aviso"
          >
            Publicación eliminada
          </span>
        </div>
      </div>
    </div>

    <div class="colaboracion-automatica-card__detalle">
      <div class="colaboracion-automatica-card__contraparte">
        <span class="colaboracion-automatica-card__avatar">
          <img
            v-if="fotoContraparte"
            :src="fotoContraparte"
            :alt="nombreContraparte"
          />
          <template v-else>{{ inicialContraparte }}</template>
        </span>
        <div class="colaboracion-automatica-card__contraparte-info">
          <strong>{{ nombreContraparte }}</strong>
          <span>{{ profesionContraparte || "Perfil" }}</span>
        </div>
        <button
          v-if="perfil?.idPerfil != null"
          type="button"
          class="colaboracion-automatica-card__link"
          @click="$emit('ver-perfil', perfil)"
        >
          Ver perfil
        </button>
      </div>

      <div
        v-if="urlImagen"
        class="colaboracion-automatica-card__evidencia"
      >
        <img :src="urlImagen" alt="Imagen compartida" />
        <div>
          <strong>Imagen en común</strong>
          <span>Evidencia de la detección automática</span>
        </div>
      </div>

      <div class="colaboracion-automatica-card__estados">
        <span>
          Vos: <strong>{{ etiquetaMiEstado }}</strong>
        </span>
        <span>
          {{ nombreContraparte }}:
          <strong>{{ etiquetaEstadoContraparte }}</strong>
        </span>
      </div>

      <p
        v-if="fechaDeteccion"
        class="colaboracion-automatica-card__meta"
      >
        <span class="material-symbols-outlined" aria-hidden="true">
          calendar_today
        </span>
        Detectada el {{ fechaDeteccion }}
      </p>
      <p
        v-if="fechaConfirmacion"
        class="colaboracion-automatica-card__meta"
      >
        <span class="material-symbols-outlined" aria-hidden="true">
          event_available
        </span>
        Confirmada el {{ fechaConfirmacion }}
      </p>
      <p
        v-if="fechaDisolucion"
        class="colaboracion-automatica-card__meta"
      >
        <span class="material-symbols-outlined" aria-hidden="true">
          event_busy
        </span>
        Disuelta el {{ fechaDisolucion }}
      </p>
    </div>

    <footer class="colaboracion-automatica-card__acciones">
      <VaButton
        v-if="puedeConfirmar"
        color="primary"
        size="small"
        :loading="procesando && accion === 'confirmar'"
        :disabled="procesando"
        @click="$emit('confirmar', colaboracion)"
      >
        Confirmar
      </VaButton>
      <VaButton
        v-if="puedeRechazar"
        preset="secondary"
        color="danger"
        size="small"
        :loading="procesando && accion === 'rechazar'"
        :disabled="procesando"
        @click="$emit('rechazar', colaboracion)"
      >
        Rechazar
      </VaButton>
      <button
        type="button"
        class="colaboracion-automatica-card__ver-detalle"
        @click="$emit('ver-detalle', colaboracion)"
      >
        Ver detalle
      </button>
    </footer>
  </article>
</template>

<script>
import EstadoColaboracionAutomaticaBadge from "./EstadoColaboracionAutomaticaBadge.vue";
import { resolverFotoUrl } from "../../utils/fotos.js";
import { formatearFechaCorta } from "../../utils/fechas.js";
import {
  ETIQUETAS_ESTADO_COLABORACION_AUTOMATICA,
  descripcionEstadoColaboracionAutomatica,
  normalizarEstadoColaboracionAutomatica,
} from "../../utils/colaboracionesAutomaticasConstants.js";

export default {
  name: "ColaboracionAutomaticaCard",
  components: { EstadoColaboracionAutomaticaBadge },
  props: {
    colaboracion: {
      type: Object,
      required: true,
    },
    procesando: {
      type: Boolean,
      default: false,
    },
    accion: {
      type: String,
      default: "",
    },
  },
  emits: ["confirmar", "rechazar", "ver-detalle", "ver-perfil", "ver-publicacion"],
  computed: {
    propia() {
      return this.colaboracion?.publicacionPropia || null;
    },
    contraparte() {
      return this.colaboracion?.publicacionContraparte || null;
    },
    perfil() {
      return this.colaboracion?.perfilContraparte || null;
    },
    imagen() {
      return this.colaboracion?.imagen || null;
    },
    nombreContraparte() {
      return this.perfil?.nombreArtistico || "la contraparte";
    },
    profesionContraparte() {
      return this.perfil?.profesion || "";
    },
    fotoContraparte() {
      return resolverFotoUrl(this.perfil?.fotoUrl);
    },
    inicialContraparte() {
      return (
        String(this.perfil?.nombreArtistico || "?")
          .trim()
          .charAt(0)
          .toUpperCase() || "?"
      );
    },
    portadaPropia() {
      return resolverFotoUrl(this.propia?.portadaUrl);
    },
    portadaContraparte() {
      return resolverFotoUrl(this.contraparte?.portadaUrl);
    },
    urlImagen() {
      return resolverFotoUrl(this.imagen?.url);
    },
    propiaEliminada() {
      return this.propia?.eliminada === true;
    },
    contraparteEliminada() {
      return this.contraparte?.eliminada === true;
    },
    puedeAbrirPropia() {
      return !this.propiaEliminada && this.propia?.idPublicacion != null;
    },
    puedeAbrirContraparte() {
      return (
        !this.contraparteEliminada &&
        this.contraparte?.idPublicacion != null
      );
    },
    tituloPropia() {
      return this.propiaEliminada
        ? "Publicación eliminada"
        : this.propia?.titulo || "Tu publicación";
    },
    tituloContraparte() {
      return this.contraparteEliminada
        ? "Publicación eliminada"
        : this.contraparte?.titulo || "Publicación";
    },
    estado() {
      return (
        normalizarEstadoColaboracionAutomatica(
          this.colaboracion?.estado
        ) ||
        this.colaboracion?.estado ||
        ""
      );
    },
    miEstado() {
      return (
        normalizarEstadoColaboracionAutomatica(
          this.colaboracion?.miEstado
        ) ||
        this.colaboracion?.miEstado ||
        ""
      );
    },
    estadoContraparte() {
      return (
        normalizarEstadoColaboracionAutomatica(
          this.colaboracion?.estadoContraparte
        ) ||
        this.colaboracion?.estadoContraparte ||
        ""
      );
    },
    etiquetaMiEstado() {
      return (
        ETIQUETAS_ESTADO_COLABORACION_AUTOMATICA[this.miEstado] ||
        this.miEstado ||
        "—"
      );
    },
    etiquetaEstadoContraparte() {
      return (
        ETIQUETAS_ESTADO_COLABORACION_AUTOMATICA[this.estadoContraparte] ||
        this.estadoContraparte ||
        "—"
      );
    },
    descripcionEstado() {
      return descripcionEstadoColaboracionAutomatica(
        this.colaboracion,
        this.nombreContraparte
      );
    },
    fechaDeteccion() {
      return formatearFechaCorta(this.colaboracion?.fechaDeteccion);
    },
    fechaConfirmacion() {
      return this.colaboracion?.fechaConfirmacion
        ? formatearFechaCorta(this.colaboracion.fechaConfirmacion)
        : "";
    },
    fechaDisolucion() {
      return this.colaboracion?.fechaDisolucion
        ? formatearFechaCorta(this.colaboracion.fechaDisolucion)
        : "";
    },
    puedeConfirmar() {
      return this.colaboracion?.puedeConfirmar === true;
    },
    puedeRechazar() {
      return this.colaboracion?.puedeRechazar === true;
    },
  },
  methods: {
    verPublicacion(publicacion) {
      if (publicacion?.eliminada || publicacion?.idPublicacion == null) return;
      this.$emit("ver-publicacion", publicacion);
    },
  },
};
</script>

<style scoped>
.colaboracion-automatica-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem 1.15rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: 14px;
  box-shadow: 0 1px 2px rgba(35, 33, 52, 0.03);
}

.colaboracion-automatica-card__cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.colaboracion-automatica-card__identidad {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  min-width: 0;
}

.colaboracion-automatica-card__identidad > .material-symbols-outlined {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  color: var(--color-primary);
  background: var(--color-chip);
  border-radius: 50%;
  font-size: 1.1rem;
}

.colaboracion-automatica-card__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 0.92rem;
  font-weight: 700;
}

.colaboracion-automatica-card__descripcion {
  margin: 0.16rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.78rem;
  line-height: 1.45;
}

.colaboracion-automatica-card__publicaciones {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 0.65rem;
}

.colaboracion-automatica-card__publicacion {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  min-width: 0;
  padding: 0.55rem;
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border-soft);
  border-radius: 10px;
}

.colaboracion-automatica-card__publicacion--clickeable {
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.colaboracion-automatica-card__publicacion--clickeable:hover,
.colaboracion-automatica-card__publicacion--clickeable:focus-visible {
  background: var(--color-surface);
  border-color: var(--color-primary);
  outline: none;
}

.colaboracion-automatica-card__publicacion--eliminada {
  opacity: 0.8;
}

.colaboracion-automatica-card__portada {
  display: grid;
  width: 72px;
  height: 62px;
  flex: 0 0 72px;
  place-items: center;
  overflow: hidden;
  color: var(--color-text-subtle);
  background: var(--color-chip);
  border-radius: 8px;
}

.colaboracion-automatica-card__portada img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.colaboracion-automatica-card__publicacion-info {
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
  min-width: 0;
}

.colaboracion-automatica-card__publicacion-info strong {
  overflow: hidden;
  color: var(--color-text);
  font-size: 0.84rem;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.colaboracion-automatica-card__rol {
  color: var(--color-text-muted);
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.colaboracion-automatica-card__aviso {
  color: var(--color-warning-text);
  font-size: 0.68rem;
  font-weight: 600;
}

.colaboracion-automatica-card__conector {
  color: var(--color-text-subtle);
  font-size: 1.2rem;
}

.colaboracion-automatica-card__detalle {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.55rem 1rem;
  padding-top: 0.2rem;
}

.colaboracion-automatica-card__contraparte {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.colaboracion-automatica-card__avatar {
  display: inline-grid;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  place-items: center;
  overflow: hidden;
  color: var(--color-on-primary);
  background: var(--color-primary);
  border-radius: 50%;
  font-size: 0.72rem;
  font-weight: 700;
}

.colaboracion-automatica-card__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.colaboracion-automatica-card__contraparte-info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.colaboracion-automatica-card__contraparte-info strong {
  color: var(--color-text);
  font-size: 0.8rem;
  font-weight: 700;
}

.colaboracion-automatica-card__contraparte-info span {
  color: var(--color-text-muted);
  font-size: 0.7rem;
}

.colaboracion-automatica-card__link {
  padding: 0;
  color: var(--color-primary);
  background: none;
  border: 0;
  font: inherit;
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
}

.colaboracion-automatica-card__evidencia {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-width: 0;
  padding: 0.3rem 0.45rem;
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border-soft);
  border-radius: 8px;
}

.colaboracion-automatica-card__evidencia img {
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  object-fit: cover;
  border-radius: 6px;
}

.colaboracion-automatica-card__evidencia div {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.colaboracion-automatica-card__evidencia strong {
  color: var(--color-text);
  font-size: 0.72rem;
}

.colaboracion-automatica-card__evidencia span {
  color: var(--color-text-muted);
  font-size: 0.65rem;
}

.colaboracion-automatica-card__estados {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 0.8rem;
  color: var(--color-text-muted);
  font-size: 0.72rem;
}

.colaboracion-automatica-card__estados strong {
  color: var(--color-text);
}

.colaboracion-automatica-card__meta {
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.72rem;
}

.colaboracion-automatica-card__meta .material-symbols-outlined {
  color: var(--color-text-subtle);
  font-size: 0.9rem;
}

.colaboracion-automatica-card__acciones {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding-top: 0.1rem;
}

.colaboracion-automatica-card__ver-detalle {
  margin-left: 0.25rem;
  padding: 0;
  color: var(--color-primary);
  background: none;
  border: 0;
  font: inherit;
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
}

@media (max-width: 760px) {
  .colaboracion-automatica-card__publicaciones {
    grid-template-columns: 1fr;
  }

  .colaboracion-automatica-card__conector {
    justify-self: center;
    transform: rotate(90deg);
  }

  .colaboracion-automatica-card__acciones {
    justify-content: flex-start;
  }
}

@media (max-width: 520px) {
  .colaboracion-automatica-card__cabecera {
    flex-direction: column;
  }

  .colaboracion-automatica-card__publicacion {
    align-items: flex-start;
  }

  .colaboracion-automatica-card__portada {
    width: 58px;
    height: 58px;
    flex-basis: 58px;
  }
}
</style>
