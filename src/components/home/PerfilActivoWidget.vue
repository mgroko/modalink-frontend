<template>
  <section class="perfil-activo-widget">
    <div class="perfil-activo-widget__avatar">
      <img
        v-if="fotoResuelta"
        :src="fotoResuelta"
        :alt="perfil.nombreArtistico"
      />
      <span v-else class="material-symbols-outlined">person</span>
    </div>

    <div class="perfil-activo-widget__contenido">
      <span class="perfil-activo-widget__etiqueta">Perfil activo</span>
      <h2>{{ perfil.nombreArtistico || "Sin nombre artistico" }}</h2>
      <p>{{ perfil.profesionPrincipal || perfil.profesion || "Profesional creativo" }}</p>
      <p v-if="perfil.biografia" class="perfil-activo-widget__biografia">
        {{ perfil.biografia }}
      </p>
    </div>

    <VaBadge :text="perfil.estado || 'Activo'" color="success" outline />
  </section>
</template>

<script>
import { resolverFotoUrl } from "../../utils/fotos.js";

export default {
  name: "PerfilActivoWidget",
  props: {
    perfil: {
      type: Object,
      required: true,
    },
  },
  computed: {
    fotoResuelta() {
      return resolverFotoUrl(
        this.perfil.urlFoto || this.perfil.fotoPerfil || this.perfil.fotoUrl
      );
    },
  },
};
</script>

<style scoped>
.perfil-activo-widget {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.25rem;
  background: var(--color-surface);
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

.perfil-activo-widget__avatar {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 50%;
  background: #f3f4f6;
  color: var(--color-text-muted);
}

.perfil-activo-widget__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.perfil-activo-widget__contenido {
  flex: 1;
  min-width: 0;
}

.perfil-activo-widget__etiqueta {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}

.perfil-activo-widget h2 {
  margin: 0.15rem 0;
  color: var(--color-text);
  font-size: 1.1rem;
}

.perfil-activo-widget p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.perfil-activo-widget__biografia {
  margin-top: 0.5rem !important;
}
</style>
