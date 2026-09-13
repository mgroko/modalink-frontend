<template>
  <section class="perfil-hero" :class="{ 'perfil-hero--compacto': compacto }">
    <div class="perfil-hero__avatar">
      <img
        v-if="fotoUrl"
        :src="fotoUrl"
        :alt="perfil?.nombreArtistico || 'Foto de perfil'"
      />
      <span v-else class="material-symbols-outlined">person</span>
    </div>

    <div class="perfil-hero__info">
      <div class="perfil-hero__nombre-fila">
        <h1 class="perfil-hero__nombre">{{ perfil?.nombreArtistico || "Sin nombre artístico" }}</h1>
        <span v-if="valoracion != null" class="perfil-hero__valoracion">
          <span class="material-symbols-outlined">star</span>
          {{ valoracion }}
        </span>
      </div>
      <p class="perfil-hero__profesion">{{ profesionTexto }}</p>
      <p v-if="!compacto && ubicacionTexto" class="perfil-hero__ubicacion">{{ ubicacionTexto }}</p>
      <p v-if="!compacto && perfil?.biografia" class="perfil-hero__descripcion">{{ perfil.biografia }}</p>
    </div>

    <button
      v-if="esPropio && !compacto"
      class="perfil-hero__editar"
      title="Editar perfil"
      @click="$emit('editar')"
    >
      <span class="material-symbols-outlined">edit</span>
    </button>
  </section>
</template>

<script>
export default {
  name: "PerfilHero",
  props: {
    perfil: {
      type: Object,
      default: null,
    },
    ubicacion: {
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
  computed: {
    fotoUrl() {
      return this.perfil?.fotoUrl || this.perfil?.urlFoto || this.perfil?.fotoPerfil || null;
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
      const ubicacion = this.ubicacion || this.perfil?.ubicacion;
      if (!ubicacion) return "";
      const texto = [ubicacion.localidad?.nombre || ubicacion.localidad, ubicacion.provincia?.nombre || ubicacion.provincia]
        .filter(Boolean)
        .join(", ");
      return texto;
    },
  },
};
</script>

<style scoped>
.perfil-hero {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.5rem;
  background: var(--color-surface);
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

.perfil-hero__avatar {
  width: 84px;
  height: 84px;
  border-radius: 50%;
  overflow: hidden;
  background: #f3f4f6;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
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
  gap: 0.15rem;
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
  color: #f59e0b;
}

.perfil-hero__profesion {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

.perfil-hero__ubicacion {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.perfil-hero__descripcion {
  margin: 0.4rem 0 0;
  font-size: 0.85rem;
  color: var(--color-text-muted);
  line-height: 1.5;
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
  background: #f3f4f6;
  color: var(--color-text);
}

.perfil-hero__editar .material-symbols-outlined {
  font-size: 1.15rem;
}

.perfil-hero--compacto {
  padding: 0.85rem 1rem;
  gap: 0.75rem;
}
</style>
