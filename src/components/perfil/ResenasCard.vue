<template>
  <section class="resenas-card">
    <h3 class="resenas-card__titulo">Reseñas</h3>

    <div v-if="resenas.length === 0" class="resenas-card__vacio">
      Aún no hay reseñas.
    </div>

    <article
      v-for="(resena, index) in resenas"
      :key="index"
      class="resenas-card__item"
    >
      <div class="resenas-card__cabecera">
        <span class="resenas-card__autor">{{ resena.autor }}</span>
        <span class="resenas-card__estrellas">
          <span
            v-for="n in 5"
            :key="n"
            class="material-symbols-outlined"
            :class="{ 'resenas-card__estrella--activa': n <= (resena.valoracion || 0) }"
          >star</span>
          <span class="resenas-card__numero">{{ resena.valoracion || 0 }}</span>
        </span>
      </div>
      <p class="resenas-card__descripcion">{{ resena.descripcion }}</p>
      <p v-if="resena.proyecto" class="resenas-card__proyecto">{{ resena.proyecto }}</p>
    </article>
  </section>
</template>

<script>
export default {
  name: "ResenasCard",
  props: {
    resenas: {
      type: Array,
      default: () => [],
    },
  },
};
</script>

<style scoped>
.resenas-card {
  padding: 1.25rem;
  background: var(--color-surface);
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

.resenas-card__titulo {
  margin: 0 0 1rem;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-text);
}

.resenas-card__vacio {
  font-size: 0.82rem;
  color: var(--color-text-muted);
}

.resenas-card__item {
  padding: 0.75rem;
  background: #f7f7fa;
  border-radius: 8px;
  margin-bottom: 0.6rem;
}

.resenas-card__cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.resenas-card__autor {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--color-text);
}

.resenas-card__estrellas {
  display: inline-flex;
  align-items: center;
  gap: 0.05rem;
}

.resenas-card__estrellas .material-symbols-outlined {
  font-size: 0.95rem;
  color: #d1d5db;
}

.resenas-card__estrella--activa {
  color: #f59e0b !important;
}

.resenas-card__numero {
  font-size: 0.78rem;
  color: var(--color-text-muted);
  margin-left: 0.15rem;
}

.resenas-card__descripcion {
  margin: 0.35rem 0 0;
  font-size: 0.8rem;
  color: var(--color-text);
}

.resenas-card__proyecto {
  margin: 0.3rem 0 0;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}
</style>
