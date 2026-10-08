<template>
  <div class="skeleton-perfil" role="status">
    <span class="sr-only">Cargando perfil...</span>

    <div class="skeleton-perfil__hero" aria-hidden="true">
      <div class="skeleton-perfil__avatar skeleton-shimmer"></div>
      <div class="skeleton-perfil__info">
        <div class="skeleton-perfil__bar skeleton-perfil__bar--nombre skeleton-shimmer"></div>
        <div class="skeleton-perfil__bar skeleton-perfil__bar--sub skeleton-shimmer"></div>
        <div class="skeleton-perfil__bar skeleton-perfil__bar--texto skeleton-shimmer"></div>
      </div>
    </div>

    <div class="skeleton-perfil__panel" aria-hidden="true">
      <div class="skeleton-perfil__bar skeleton-perfil__bar--titulo skeleton-shimmer"></div>
      <div class="skeleton-perfil__chips">
        <span
          v-for="n in 5"
          :key="n"
          class="skeleton-perfil__chip skeleton-shimmer"
        ></span>
      </div>
    </div>

    <div class="skeleton-perfil__panel" aria-hidden="true">
      <div class="skeleton-perfil__bar skeleton-perfil__bar--titulo skeleton-shimmer"></div>
      <div class="skeleton-perfil__grid">
        <div v-for="n in 8" :key="n" class="skeleton-perfil__campo">
          <div class="skeleton-perfil__bar skeleton-perfil__bar--label skeleton-shimmer"></div>
          <div class="skeleton-perfil__bar skeleton-perfil__bar--valor skeleton-shimmer"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "SkeletonPerfil",
};
</script>

<style scoped>
.skeleton-perfil {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.skeleton-perfil__hero,
.skeleton-perfil__panel {
  padding: 1.5rem;
  background: var(--color-surface);
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

.skeleton-perfil__hero {
  display: flex;
  align-items: flex-start;
  gap: 1.25rem;
}

.skeleton-perfil__avatar {
  width: 84px;
  height: 84px;
  border-radius: 50%;
  flex-shrink: 0;
}

.skeleton-perfil__info {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  flex: 1;
  min-width: 0;
  padding-top: 0.35rem;
}

.skeleton-perfil__panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.skeleton-perfil__bar {
  border-radius: 6px;
}

.skeleton-perfil__bar--nombre {
  width: 45%;
  height: 22px;
}

.skeleton-perfil__bar--sub {
  width: 30%;
  height: 14px;
}

.skeleton-perfil__bar--texto {
  width: 70%;
  height: 12px;
  margin-top: 0.35rem;
}

.skeleton-perfil__bar--titulo {
  width: 200px;
  max-width: 60%;
  height: 14px;
}

.skeleton-perfil__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.skeleton-perfil__chip {
  height: 30px;
  border-radius: 999px;
}

.skeleton-perfil__chip:nth-child(1) { width: 95px; }
.skeleton-perfil__chip:nth-child(2) { width: 70px; }
.skeleton-perfil__chip:nth-child(3) { width: 115px; }
.skeleton-perfil__chip:nth-child(4) { width: 85px; }
.skeleton-perfil__chip:nth-child(5) { width: 100px; }

.skeleton-perfil__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 0.75rem;
}

.skeleton-perfil__campo {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.skeleton-perfil__bar--label {
  width: 65%;
  height: 8px;
}

.skeleton-perfil__bar--valor {
  width: 45%;
  height: 14px;
}

.skeleton-shimmer {
  position: relative;
  overflow: hidden;
  background: #eef0f4;
}

.skeleton-shimmer::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.75), transparent);
  animation: skeleton-shimmer 1.4s ease-in-out infinite;
}

@keyframes skeleton-shimmer {
  100% {
    transform: translateX(100%);
  }
}

@media (max-width: 900px) {
  .skeleton-perfil__hero {
    padding: 1rem;
  }

  .skeleton-perfil__avatar {
    width: 56px;
    height: 56px;
  }
}
</style>
