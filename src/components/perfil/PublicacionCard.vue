<template>
  <article v-if="publicacion" class="publicacion-card" :class="`publicacion-card--${modo}`">
    <header class="publicacion-card__autor">
      <span class="publicacion-card__avatar">
        <img
          v-if="autorFoto"
          :src="autorFoto"
          :alt="autorNombre"
          class="publicacion-card__avatar-img"
        />
        <span v-else>{{ inicialesAutor }}</span>
      </span>

      <div class="publicacion-card__autor-datos">
        <RouterLink
          v-if="autorId != null"
          :to="{ name: 'ver-perfil', params: { id: autorId } }"
          class="publicacion-card__autor-nombre"
        >
          {{ autorNombre }}
        </RouterLink>
        <strong v-else>{{ autorNombre }}</strong>
        <span>
          {{ autorProfesion }}
          <template v-if="fechaRelativa"> · {{ fechaRelativa }}</template>
        </span>
      </div>

      <button
        v-if="esPropia"
        type="button"
        class="publicacion-card__editar"
        title="Editar publicación"
        aria-label="Editar publicación"
        @click="$emit('editar', publicacion)"
      >
        <span class="material-symbols-outlined">edit</span>
      </button>
    </header>

    <h2 class="publicacion-card__titulo">{{ publicacion.titulo }}</h2>

    <div v-if="ubicacionTexto || publicacion.proyecto" class="publicacion-card__chips">
      <span v-if="ubicacionTexto" class="publicacion-card__chip">
        <span class="material-symbols-outlined">location_on</span>
        {{ ubicacionTexto }}
      </span>
      <span v-if="publicacion.proyecto" class="publicacion-card__chip">
        <span class="material-symbols-outlined">folder</span>
        {{ publicacion.proyecto.nombre }}
      </span>
    </div>

    <div
      v-if="imagenes.length"
      class="publicacion-card__collage"
      :class="`publicacion-card__collage--${imagenesVisibles.length}`"
      role="button"
      tabindex="0"
      aria-label="Abrir visor de imágenes"
      @click="$emit('abrir-galeria', publicacion)"
      @keydown.enter.prevent="$emit('abrir-galeria', publicacion)"
      @keydown.space.prevent="$emit('abrir-galeria', publicacion)"
    >
      <figure
        v-for="(imagen, indice) in imagenesVisibles"
        :key="imagen.idImagen || indice"
        class="publicacion-card__figura"
      >
        <img
          class="publicacion-card__imagen"
          :src="resolverImagen(imagen)"
          :alt="`${publicacion.titulo} — imagen ${indice + 1}`"
        />
        <span
          v-if="indice === imagenesVisibles.length - 1 && imagenesRestantes > 0"
          class="publicacion-card__mas"
        >
          +{{ imagenesRestantes }}
        </span>
      </figure>
    </div>

    <div v-if="publicacion.descripcion" class="publicacion-card__descripcion">
      <p :class="{ 'publicacion-card__texto--expandido': expandida }">
        {{ publicacion.descripcion }}
      </p>
      <button
        v-if="descripcionLarga"
        type="button"
        class="publicacion-card__ver-mas"
        :aria-expanded="expandida ? 'true' : 'false'"
        @click="expandida = !expandida"
      >
        {{ expandida ? "ver menos" : "ver más" }}
      </button>
    </div>

    <footer
      v-if="modo === 'modal' || proyectoVisible"
      class="publicacion-card__footer"
    >
      <VaButton
        v-if="modo === 'modal'"
        preset="secondary"
        @click="$emit('cerrar')"
      >
        Cerrar
      </VaButton>
      <VaButton
        v-if="proyectoVisible"
        color="primary"
        icon-right="mso-arrow_forward"
        @click="$emit('ver-proyecto', publicacion.proyecto)"
      >
        Ver proyecto
      </VaButton>
    </footer>
  </article>
</template>

<script>
import { resolverFotoUrl } from "../../utils/fotos.js";
import { formatearTiempoRelativo } from "../../utils/fechas.js";
import { formatUbicacionPublicacion } from "../../utils/ubicacion.js";
import { idPerfilActivo } from "../../services/authState";

export default {
  name: "PublicacionCard",
  props: {
    publicacion: {
      type: Object,
      default: null,
    },
    modo: {
      type: String,
      default: "inline",
      validator: (valor) => ["inline", "modal"].includes(valor),
    },
  },
  emits: ["abrir-galeria", "ver-proyecto", "cerrar", "editar"],
  data() {
    return {
      expandida: false,
    };
  },
  computed: {
    imagenes() {
      return Array.isArray(this.publicacion?.imagenes)
        ? [...this.publicacion.imagenes].sort(
            (a, b) => (Number(a.orden) || 0) - (Number(b.orden) || 0)
          )
        : [];
    },
    imagenesVisibles() {
      return this.imagenes.slice(0, 2);
    },
    imagenesRestantes() {
      return Math.max(0, this.imagenes.length - this.imagenesVisibles.length);
    },
    autorId() {
      return this.publicacion?.autor?.idPerfil ?? null;
    },
    esPropia() {
      const idActivo = idPerfilActivo();
      return (
        idActivo != null &&
        this.autorId != null &&
        String(this.autorId) === String(idActivo)
      );
    },
    autorNombre() {
      return (
        this.publicacion?.autor?.nombreArtistico ||
        this.publicacion?.autor?.nombre ||
        "Perfil"
      );
    },
    autorProfesion() {
      return this.publicacion?.autor?.profesion || "Profesional";
    },
    autorFoto() {
      return resolverFotoUrl(this.publicacion?.autor?.fotoUrl);
    },
    inicialesAutor() {
      return this.autorNombre
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((parte) => parte.charAt(0).toUpperCase())
        .join("");
    },
    fechaRelativa() {
      return formatearTiempoRelativo(this.publicacion?.fechaPublicacion);
    },
    ubicacionTexto() {
      return formatUbicacionPublicacion(this.publicacion?.ubicacion);
    },
    proyectoVisible() {
      return this.publicacion?.proyecto?.puedeVerProyecto === true;
    },
    descripcionLarga() {
      return String(this.publicacion?.descripcion || "").length > 240;
    },
  },
  watch: {
    "publicacion.idPublicacion"() {
      this.expandida = false;
    },
  },
  methods: {
    resolverImagen(imagen) {
      return resolverFotoUrl(imagen?.url);
    },
  },
};
</script>

<style scoped>
.publicacion-card {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  padding: 1.15rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
}

.publicacion-card--modal {
  padding: 0;
  border: 0;
  background: transparent;
}

.publicacion-card__autor {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}

.publicacion-card__avatar {
  display: grid;
  width: 2.8rem;
  height: 2.8rem;
  flex: 0 0 2.8rem;
  place-items: center;
  overflow: hidden;
  color: var(--color-on-primary);
  background: var(--color-primary);
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 700;
}

.publicacion-card__avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.publicacion-card__autor-datos {
  display: grid;
  gap: 0.1rem;
}

.publicacion-card__editar {
  display: grid;
  width: 2rem;
  height: 2rem;
  margin-left: auto;
  padding: 0;
  place-items: center;
  color: var(--color-text-muted);
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border-soft);
  border-radius: 50%;
  cursor: pointer;
}

.publicacion-card__editar:hover,
.publicacion-card__editar:focus-visible {
  color: var(--color-primary);
  border-color: var(--color-primary-light);
  outline: none;
}

.publicacion-card__editar .material-symbols-outlined {
  font-size: 1rem;
}

.publicacion-card__autor-datos strong,
.publicacion-card__autor-nombre {
  width: fit-content;
  color: var(--color-text);
  font-size: 0.9rem;
  font-weight: 700;
  text-decoration: none;
}

.publicacion-card__autor-nombre:hover,
.publicacion-card__autor-nombre:focus-visible {
  color: var(--color-primary);
  text-decoration: underline;
  outline: none;
}

.publicacion-card__autor-datos span {
  color: var(--color-text-muted);
  font-size: 0.76rem;
}

.publicacion-card__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1.35rem;
  font-weight: 750;
  line-height: 1.25;
}

.publicacion-card__chips {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.publicacion-card__chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.6rem;
  color: var(--color-text-muted);
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border-soft);
  border-radius: 999px;
  font-size: 0.76rem;
}

.publicacion-card__chip .material-symbols-outlined {
  font-size: 0.95rem;
  color: var(--color-primary);
}

.publicacion-card__collage {
  display: grid;
  gap: 0.5rem;
  height: 340px;
  border-radius: 10px;
  cursor: zoom-in;
}

.publicacion-card__collage--1 {
  grid-template-columns: 1fr;
}

.publicacion-card__collage--2 {
  grid-template-columns: repeat(2, 1fr);
}

.publicacion-card__figura {
  position: relative;
  min-width: 0;
  min-height: 0;
  margin: 0;
}

.publicacion-card__imagen {
  width: 100%;
  height: 100%;
  border-radius: 10px;
  object-fit: cover;
  background: var(--color-surface-muted);
}

.publicacion-card__mas {
  position: absolute;
  right: 0.65rem;
  bottom: 0.65rem;
  display: grid;
  min-width: 2.4rem;
  height: 2.4rem;
  padding: 0 0.45rem;
  place-items: center;
  color: var(--color-on-primary);
  background: rgba(35, 33, 52, 0.8);
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 700;
}

.publicacion-card__descripcion {
  display: grid;
  gap: 0.25rem;
}

.publicacion-card__descripcion p {
  display: -webkit-box;
  overflow: hidden;
  margin: 0;
  color: var(--color-text);
  font-size: 0.86rem;
  line-height: 1.55;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.publicacion-card__descripcion p.publicacion-card__texto--expandido {
  display: block;
  overflow: visible;
  -webkit-line-clamp: unset;
}

.publicacion-card__ver-mas {
  width: fit-content;
  padding: 0;
  color: var(--color-primary);
  background: none;
  border: 0;
  font: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.publicacion-card__ver-mas:hover {
  text-decoration: underline;
}

.publicacion-card__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.65rem;
  margin-top: 0.15rem;
  padding-top: 0.8rem;
  border-top: 1px solid var(--color-border-soft);
}

@media (max-width: 560px) {
  .publicacion-card {
    padding: 0.9rem;
  }

  .publicacion-card__collage {
    height: 240px;
  }

  .publicacion-card__footer {
    flex-direction: column-reverse;
  }
}
</style>
