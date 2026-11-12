<template>
  <section
    class="home-publicaciones"
    :class="{ 'home-publicaciones--home': variante === 'home' }"
    aria-label="Publicaciones de contactos"
  >
    <header class="home-publicaciones__cabecera">
      <h2 class="home-publicaciones__titulo">Publicaciones</h2>
      <span class="home-publicaciones__subtitulo">
        Lo último de tus contactos
      </span>
    </header>

    <div v-if="cargando" class="home-publicaciones__estado" role="status" aria-live="polite">
      <span class="material-symbols-outlined">hourglass_empty</span>
      Cargando publicaciones...
    </div>

    <div
      v-else-if="error && !publicaciones.length"
      class="home-publicaciones__estado home-publicaciones__estado--error"
    >
      <span class="material-symbols-outlined">error</span>
      <span>{{ error }}</span>
      <VaButton preset="secondary" size="small" icon="mso-refresh" @click="$emit('reintentar')">
        Reintentar
      </VaButton>
    </div>

    <div v-else-if="!publicaciones.length" class="home-publicaciones__vacio">
      Todavía no hay publicaciones de tus contactos.
    </div>

    <template v-else>
      <div class="home-publicaciones__lista">
        <PublicacionCard
          v-for="publicacion in publicaciones"
          :key="publicacion.idPublicacion"
          :publicacion="publicacion"
          :variante="variante"
          mostrar-acciones-baja
          clickable
          @abrir="$emit('abrir-publicacion', $event)"
          @ver-comentarios="$emit('ver-comentarios', $event)"
          @no-disponible="$emit('no-disponible', $event)"
          @sin-perfil="$emit('sin-perfil', $event)"
          @perfil-inactivo="$emit('perfil-inactivo', $event)"
          @ver-proyecto="$emit('ver-proyecto', $event)"
          @editar="$emit('editar', $event)"
          @invitar="$emit('invitar', $event)"
          @eliminar="$emit('eliminar', $event)"
        />
      </div>

      <div v-if="hayMas" class="home-publicaciones__mas">
        <VaButton
          preset="secondary"
          :loading="cargandoMas"
          :disabled="cargandoMas"
          @click="$emit('cargar-mas')"
        >
          Cargar más publicaciones
        </VaButton>
      </div>
    </template>
  </section>
</template>

<script>
import PublicacionCard from "../perfil/PublicacionCard.vue";

export default {
  name: "HomePublicacionesFeed",
  components: { PublicacionCard },
  props: {
    publicaciones: {
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
    hayMas: {
      type: Boolean,
      default: false,
    },
    cargandoMas: {
      type: Boolean,
      default: false,
    },
    variante: {
      type: String,
      default: "default",
    },
  },
  emits: [
    "abrir-publicacion",
    "ver-comentarios",
    "no-disponible",
    "sin-perfil",
    "perfil-inactivo",
    "ver-proyecto",
    "editar",
    "invitar",
    "eliminar",
    "reintentar",
    "cargar-mas",
  ],
};
</script>

<style scoped>
.home-publicaciones {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
  padding: 1.15rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.home-publicaciones--home {
  max-width: none;
  margin: 0;
  padding: 0;
  background: transparent;
  border: 0;
  border-radius: 0;
}

.home-publicaciones--home .home-publicaciones__titulo {
  font-size: 1.15rem;
}

.home-publicaciones--home .home-publicaciones__lista {
  gap: 1rem;
}

.home-publicaciones__cabecera {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.home-publicaciones__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1.05rem;
  font-weight: 800;
}

.home-publicaciones__subtitulo {
  color: var(--color-text-muted);
  font-size: 0.78rem;
}

.home-publicaciones__lista {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.home-publicaciones__estado,
.home-publicaciones__vacio {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.45rem;
  padding: 1.5rem 0.75rem;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  text-align: center;
}

.home-publicaciones__estado--error {
  color: var(--color-danger-text);
}

.home-publicaciones__estado .material-symbols-outlined {
  font-size: 1.2rem;
}

.home-publicaciones__mas {
  display: flex;
  justify-content: center;
  padding-top: 0.25rem;
}
</style>
