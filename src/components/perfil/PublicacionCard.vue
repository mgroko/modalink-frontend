<template>
  <article
    v-if="publicacion"
    class="publicacion-card"
    :class="[
      `publicacion-card--${modo}`,
      `publicacion-card--${variante}`,
      { 'publicacion-card--clickable': clickable },
    ]"
    @click="alClickTarjeta"
  >
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
          @click.stop
        >
          {{ autorNombre }}
        </RouterLink>
        <strong v-else>{{ autorNombre }}</strong>
        <span>
          {{ autorProfesion }}
          <template v-if="fechaRelativa"> · {{ fechaRelativa }}</template>
        </span>
      </div>

      <PublicacionMenuAcciones
        :publicacion="publicacion"
        :mostrar-acciones-baja="mostrarAccionesBaja"
        :permitir-baja-colaborador="permitirBajaColaborador"
        @editar="$emit('editar', $event)"
        @invitar="$emit('invitar', $event)"
        @eliminar="$emit('eliminar', $event)"
        @no-disponible="$emit('no-disponible', $event)"
      />
    </header>

    <h2 class="publicacion-card__titulo">
      <button
        v-if="clickable"
        type="button"
        class="publicacion-card__titulo-boton"
        @click.stop="alClickTarjeta"
      >
        {{ publicacion.titulo }}
      </button>
      <template v-else>{{ publicacion.titulo }}</template>
    </h2>

    <div
      v-if="variante === 'home' && (ubicacionTexto || publicacion.proyecto)"
      class="publicacion-card__meta-home"
    >
      <span v-if="ubicacionTexto" class="publicacion-card__meta-home-item">
        <span class="material-symbols-outlined" aria-hidden="true">
          location_on
        </span>
        {{ ubicacionTexto }}
      </span>
      <span
        v-if="publicacion.proyecto"
        class="publicacion-card__meta-home-item publicacion-card__meta-home-item--proyecto"
      >
        Proyecto: {{ publicacion.proyecto.nombre }}
      </span>
    </div>

    <div
      v-else-if="ubicacionTexto || publicacion.proyecto"
      class="publicacion-card__chips"
    >
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
      aria-label="Abrir detalle de la publicación"
      @click.stop="abrirConIndice(0)"
      @keydown.enter.stop.prevent="abrirConIndice(0)"
      @keydown.space.stop.prevent="abrirConIndice(0)"
    >
      <figure
        v-for="(imagen, indice) in imagenesVisibles"
        :key="imagen.idImagen || indice"
        class="publicacion-card__figura"
        @click.stop="abrirConIndice(indice)"
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
        @click.stop="expandida = !expandida"
      >
        {{ expandida ? "ver menos" : "ver más" }}
      </button>
    </div>

    <div
      v-if="colaboradores.length"
      class="publicacion-card__colaboradores"
    >
      <span
        class="material-symbols-outlined publicacion-card__colaboradores-icono"
        aria-hidden="true"
      >
        {{ variante === "home" ? "person" : "group" }}
      </span>

      <component
        :is="colaboradorId(colaborador) != null ? 'RouterLink' : 'span'"
        v-for="colaborador in colaboradoresVisibles"
        :key="colaborador.idPerfil || colaborador.nombreArtistico"
        :to="
          colaboradorId(colaborador) != null
            ? {
                name: 'ver-perfil',
                params: { id: colaboradorId(colaborador) },
              }
            : undefined
        "
        class="publicacion-card__colaborador"
        @click="alClickColaborador($event, colaborador)"
      >
        <span class="publicacion-card__colaborador-avatar" aria-hidden="true">
          <img
            v-if="colaboradorFoto(colaborador)"
            :src="colaboradorFoto(colaborador)"
            :alt="colaboradorNombre(colaborador)"
          />
          <template v-else>{{ inicialesColaborador(colaborador) }}</template>
        </span>
        {{ colaboradorNombre(colaborador) }}
      </component>

      <span
        v-if="colaboradoresRestantes > 0"
        class="publicacion-card__colaboradores-mas"
      >
        y {{ colaboradoresRestantes }} más
      </span>
    </div>

    <footer
      v-if="mostrarInteracciones || modo === 'modal' || proyectoVisible"
      class="publicacion-card__footer"
    >
      <PublicacionInteracciones
        v-if="mostrarInteracciones"
        :publicacion="publicacion"
        @ver-comentarios="$emit('ver-comentarios', $event)"
        @no-disponible="$emit('no-disponible', $event)"
        @sin-perfil="$emit('sin-perfil', $event)"
        @perfil-inactivo="$emit('perfil-inactivo', $event)"
      />

      <div class="publicacion-card__acciones">
        <VaButton
          v-if="modo === 'modal'"
          preset="secondary"
          @click.stop="$emit('cerrar')"
        >
          Cerrar
        </VaButton>
        <VaButton
          v-if="proyectoVisible"
          color="primary"
          icon-right="mso-arrow_forward"
          @click.stop="$emit('ver-proyecto', publicacion.proyecto)"
        >
          Ver proyecto
        </VaButton>
      </div>
    </footer>
  </article>
</template>

<script>
import { resolverFotoUrl } from "../../utils/fotos.js";
import { formatearTiempoRelativo } from "../../utils/fechas.js";
import { formatUbicacionPublicacion } from "../../utils/ubicacion.js";
import PublicacionInteracciones from "./PublicacionInteracciones.vue";
import PublicacionMenuAcciones from "./PublicacionMenuAcciones.vue";

export default {
  name: "PublicacionCard",
  components: { PublicacionInteracciones, PublicacionMenuAcciones },
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
    variante: {
      type: String,
      default: "default",
      validator: (valor) => ["default", "home"].includes(valor),
    },
    mostrarAccionesBaja: {
      type: Boolean,
      default: false,
    },
    permitirBajaColaborador: {
      type: Boolean,
      default: true,
    },
    clickable: {
      type: Boolean,
      default: false,
    },
    mostrarInteracciones: {
      type: Boolean,
      default: true,
    },
  },
  emits: [
    "abrir",
    "ver-comentarios",
    "no-disponible",
    "sin-perfil",
    "perfil-inactivo",
    "ver-proyecto",
    "cerrar",
    "editar",
    "invitar",
    "eliminar",
  ],
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
    colaboradores() {
      return Array.isArray(this.publicacion?.colaboradores)
        ? this.publicacion.colaboradores
        : [];
    },
    colaboradoresVisibles() {
      return this.colaboradores.slice(0, 3);
    },
    colaboradoresRestantes() {
      return Math.max(0, this.colaboradores.length - 3);
    },
  },
  watch: {
    "publicacion.idPublicacion"() {
      this.expandida = false;
    },
  },
  methods: {
    alClickTarjeta() {
      if (!this.clickable) return;
      this.abrirConIndice(0);
    },
    abrirConIndice(indice) {
      this.$emit("abrir", {
        publicacion: this.publicacion,
        indice: Number(indice) || 0,
      });
    },
    resolverImagen(imagen) {
      return resolverFotoUrl(imagen?.url);
    },
    colaboradorId(colaborador) {
      return colaborador?.idPerfil ?? colaborador?.perfil?.idPerfil ?? null;
    },
    alClickColaborador(evento, colaborador) {
      // Un colaborador sin perfil sigue abriendo la tarjeta; con perfil,
      // navega al perfil sin disparar el click del contenedor.
      if (this.colaboradorId(colaborador) != null) evento.stopPropagation();
    },
    colaboradorNombre(colaborador) {
      return (
        colaborador?.nombreArtistico ||
        colaborador?.nombre ||
        "Colaborador"
      );
    },
    colaboradorFoto(colaborador) {
      return resolverFotoUrl(colaborador?.fotoUrl);
    },
    inicialesColaborador(colaborador) {
      return this.colaboradorNombre(colaborador)
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((parte) => parte.charAt(0).toUpperCase())
        .join("");
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

.publicacion-card--clickable {
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.publicacion-card--clickable:hover,
.publicacion-card--clickable:focus-visible {
  border-color: var(--color-primary-light);
  box-shadow: 0 0.4rem 1.2rem rgba(35, 33, 52, 0.08);
  outline: none;
}

.publicacion-card--modal {
  padding: 0;
  border: 0;
  background: transparent;
}

.publicacion-card--home {
  gap: 1rem;
  padding: 1.25rem 1.35rem;
  border-radius: 14px;
}

.publicacion-card--home .publicacion-card__titulo {
  font-size: 1.55rem;
  font-weight: 750;
}

.publicacion-card--home .publicacion-card__collage {
  height: 360px;
}

.publicacion-card--home .publicacion-card__descripcion p {
  -webkit-line-clamp: 2;
}

.publicacion-card--home .publicacion-card__footer {
  margin-top: 0.2rem;
  padding-top: 0.9rem;
}

.publicacion-card__meta-home {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  color: var(--color-text-muted);
  font-size: 0.78rem;
}

.publicacion-card__meta-home-item {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  min-width: 0;
}

.publicacion-card__meta-home-item .material-symbols-outlined {
  flex: 0 0 auto;
  color: var(--color-primary);
  font-size: 0.95rem;
}

.publicacion-card__meta-home-item--proyecto {
  margin-left: auto;
  text-align: right;
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
  flex: 1 1 auto;
  min-width: 0;
  gap: 0.1rem;
}

.publicacion-card__autor-nombre {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

.publicacion-card__titulo-boton {
  padding: 0;
  color: inherit;
  background: none;
  border: 0;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.publicacion-card__titulo-boton:hover,
.publicacion-card__titulo-boton:focus-visible {
  color: var(--color-primary);
  outline: none;
  text-decoration: underline;
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
  width: 100%;
  aspect-ratio: 2 / 1;
  max-height: 520px;
  border-radius: 10px;
  cursor: zoom-in;
}

.publicacion-card__collage--1 {
  aspect-ratio: 4 / 3;
  grid-template-columns: 1fr;
}

.publicacion-card__collage--2 {
  aspect-ratio: 2 / 1;
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

.publicacion-card__colaboradores {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.4rem;
  padding-top: 0.1rem;
}

.publicacion-card__colaboradores-icono {
  color: var(--color-text-muted);
  font-size: 1rem;
}

.publicacion-card__colaborador {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.15rem 0.45rem 0.15rem 0.2rem;
  color: var(--color-text);
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border-soft);
  border-radius: 999px;
  font-size: 0.72rem;
}

a.publicacion-card__colaborador {
  text-decoration: none;
}

a.publicacion-card__colaborador:hover {
  color: var(--color-primary);
  border-color: var(--color-primary-light);
}

a.publicacion-card__colaborador:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.publicacion-card__colaborador-avatar {
  display: grid;
  width: 1.2rem;
  height: 1.2rem;
  place-items: center;
  overflow: hidden;
  color: var(--color-on-primary);
  background: var(--color-primary);
  border-radius: 50%;
  font-size: 0.5rem;
  font-weight: 700;
}

.publicacion-card__colaborador-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.publicacion-card__colaboradores-mas {
  color: var(--color-text-muted);
  font-size: 0.72rem;
}

.publicacion-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-top: 0.15rem;
  padding-top: 0.8rem;
  border-top: 1px solid var(--color-border-soft);
}

.publicacion-card__acciones {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-left: auto;
}

@media (max-width: 560px) {
  .publicacion-card {
    padding: 0.9rem;
  }

  .publicacion-card__collage--1 {
    aspect-ratio: 1 / 1;
  }

  .publicacion-card__collage--2 {
    aspect-ratio: 3 / 2;
  }

  .publicacion-card__footer {
    align-items: center;
    flex-direction: row;
  }

  .publicacion-card__acciones {
    margin-left: auto;
  }
}
</style>
