<template>
  <section class="perfil-hero" :class="{ 'perfil-hero--compacto': compacto }">
    <button
      ref="avatarBoton"
      type="button"
      class="perfil-hero__avatar perfil-hero__avatar--boton"
      :disabled="!fotoUrl"
      :aria-label="
        fotoUrl
          ? 'Ampliar foto de perfil'
          : 'El perfil no tiene foto de perfil'
      "
      @click="abrirFoto"
    >
      <img
        v-if="fotoUrl"
        :src="fotoUrl"
        :alt="perfil?.nombreArtistico || 'Foto de perfil'"
      />
      <span v-else class="material-symbols-outlined">person</span>
    </button>

    <div class="perfil-hero__info">
      <div class="perfil-hero__nombre-fila">
        <h1 class="perfil-hero__nombre">{{ perfil?.nombreArtistico || "Sin nombre artístico" }}</h1>
        <span v-if="valoracion != null" class="perfil-hero__valoracion">
          <span class="material-symbols-outlined">star</span>
          {{ valoracion }}
        </span>
      </div>
      <p class="perfil-hero__profesion">{{ profesionTexto }}</p>
      <IndicadorPresencia
        v-if="perfil?.idPerfil"
        :en-linea="enLinea"
        class="perfil-hero__presencia"
      />
      <p v-if="ubicacionTexto" class="perfil-hero__ubicacion">{{ ubicacionTexto }}</p>
      <p v-if="perfil?.biografia" class="perfil-hero__descripcion">{{ perfil.biografia }}</p>
    </div>

    <button
      v-if="esPropio && !compacto"
      class="perfil-hero__editar"
      title="Editar perfil"
      @click="$emit('editar')"
    >
      <span class="material-symbols-outlined">edit</span>
    </button>

    <Teleport to="body">
      <div
        v-if="fotoAmpliada"
        ref="lightbox"
        class="perfil-hero__lightbox"
        role="dialog"
        aria-modal="true"
        aria-label="Foto de perfil ampliada"
        tabindex="-1"
        @click.self="cerrarFoto"
      >
        <button
          type="button"
          class="perfil-hero__lightbox-cerrar"
          aria-label="Cerrar foto ampliada"
          @click="cerrarFoto"
        >
          <span class="material-symbols-outlined">close</span>
        </button>

        <img
          class="perfil-hero__lightbox-img"
          :src="fotoUrl"
          :alt="perfil?.nombreArtistico || 'Foto de perfil'"
        />
      </div>
    </Teleport>
  </section>
</template>

<script>
import { formatUbicacion } from "../../utils/ubicacion.js";
import { resolverFotoUrl } from "../../utils/fotos.js";
import IndicadorPresencia from "../conexion/IndicadorPresencia.vue";
import {
  enLineaDe,
  desuscribirPerfiles,
  suscribirPerfiles,
} from "../../services/presenciaState";

export default {
  name: "PerfilHero",
  components: {
    IndicadorPresencia,
  },
  props: {
    perfil: {
      type: Object,
      default: null,
    },
    esPropio: {
      type: Boolean,
      default: true,
    },
    compacto: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["editar"],
  data() {
    return {
      idPresencia: null,
      fotoAmpliada: false,
      overflowAnterior: "",
    };
  },
  computed: {
    enLinea() {
      return enLineaDe(this.perfil?.idPerfil, this.perfil?.enLinea);
    },
    fotoUrl() {
      return resolverFotoUrl(
        this.perfil?.fotoUrl || this.perfil?.urlFoto || this.perfil?.fotoPerfil
      );
    },
    profesionTexto() {
      return (
        this.perfil?.profesion ||
        this.perfil?.profesionPrincipal ||
        this.perfil?.profesiones?.[0]?.nombre ||
        "Profesional"
      );
    },
    valoracion() {
      const valor = this.perfil?.valoracion ?? this.perfil?.rating ?? this.perfil?.promedioValoracion;
      return valor != null && valor !== "" ? valor : null;
    },
    ubicacionTexto() {
      return formatUbicacion(this.perfil) || "";
    },
  },
  watch: {
    "perfil.idPerfil"() {
      this.cerrarFoto();
      this.actualizarSuscripcion();
    },
  },
  mounted() {
    this.actualizarSuscripcion();
  },
  beforeUnmount() {
    this.quitarSuscripcion();
    this.cerrarFoto();
  },
  methods: {
    actualizarSuscripcion() {
      const id = this.perfil?.idPerfil ?? null;
      if (this.idPresencia != null && this.idPresencia !== id) {
        desuscribirPerfiles([this.idPresencia]);
      }
      this.idPresencia = id;
      if (id != null) suscribirPerfiles([id]);
    },
    quitarSuscripcion() {
      if (this.idPresencia != null) {
        desuscribirPerfiles([this.idPresencia]);
        this.idPresencia = null;
      }
    },
    abrirFoto() {
      if (!this.fotoUrl || this.fotoAmpliada) return;

      this.overflowAnterior = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      this.fotoAmpliada = true;
      document.addEventListener("keydown", this.alPresionarTecla);

      this.$nextTick(() => this.$refs.lightbox?.focus());
    },
    cerrarFoto() {
      if (!this.fotoAmpliada) return;

      this.fotoAmpliada = false;
      document.body.style.overflow = this.overflowAnterior || "";
      document.removeEventListener("keydown", this.alPresionarTecla);

      this.$nextTick(() => this.$refs.avatarBoton?.focus());
    },
    alPresionarTecla(evento) {
      if (evento.key === "Escape") this.cerrarFoto();
    },
  },
};
</script>

<style scoped>
.perfil-hero {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 1.25rem;
  padding: 1.5rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.perfil-hero__avatar {
  width: 84px;
  height: 84px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.perfil-hero__avatar--boton {
  padding: 0;
  border: 0;
  font: inherit;
  cursor: zoom-in;
}

.perfil-hero__avatar--boton:disabled {
  cursor: default;
}

.perfil-hero__avatar--boton:not(:disabled):hover {
  box-shadow: 0 0 0 3px var(--color-hover);
}

.perfil-hero__avatar--boton:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.perfil-hero--compacto .perfil-hero__avatar {
  width: 48px;
  height: 48px;
}

.perfil-hero__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.perfil-hero__avatar .material-symbols-outlined {
  font-size: 2.4rem;
}

.perfil-hero--compacto .perfil-hero__avatar .material-symbols-outlined {
  font-size: 1.5rem;
}

.perfil-hero__info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
  flex: 1;
}

.perfil-hero__nombre-fila {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.perfil-hero__nombre {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-text);
}

.perfil-hero--compacto .perfil-hero__nombre {
  font-size: 1.05rem;
}

.perfil-hero__valoracion {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.perfil-hero__valoracion .material-symbols-outlined {
  font-size: 1.1rem;
  color: var(--color-warning);
}

.perfil-hero__profesion {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

.perfil-hero__presencia {
  margin-top: 0.1rem;
}

.perfil-hero__ubicacion {
  margin: 0;
  font-size: 0.82rem;
  color: var(--color-text-muted);
}

.perfil-hero__descripcion {
  margin: 0.5rem 0 0;
  font-size: 0.85rem;
  color: var(--color-text-muted);
  line-height: 1.5;
}

.perfil-hero--compacto .perfil-hero__descripcion {
  display: none;
}

.perfil-hero__editar {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-muted);
  padding: 0.35rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
}

.perfil-hero__editar:hover {
  background: var(--color-surface-muted);
  color: var(--color-text);
}

.perfil-hero__editar .material-symbols-outlined {
  font-size: 1.15rem;
}

.perfil-hero--compacto {
  padding: 0.85rem 1rem;
  gap: 0.75rem;
}

.perfil-hero__lightbox {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: rgba(0, 0, 0, 0.82);
}

.perfil-hero__lightbox:focus {
  outline: none;
}

.perfil-hero__lightbox-img {
  max-width: min(92vw, 1100px);
  max-height: 88vh;
  object-fit: contain;
  border-radius: 12px;
  background: var(--color-surface);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
}

.perfil-hero__lightbox-cerrar {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  cursor: pointer;
}

.perfil-hero__lightbox-cerrar:hover {
  background: rgba(255, 255, 255, 0.24);
}

.perfil-hero__lightbox-cerrar .material-symbols-outlined {
  font-size: 1.4rem;
}

@media (max-width: 600px) {
  .perfil-hero__lightbox {
    padding: 1rem;
  }

  .perfil-hero__lightbox-img {
    max-width: 100%;
    max-height: 82vh;
  }
}
</style>
