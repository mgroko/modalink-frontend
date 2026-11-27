<template>
  <div class="public-layout">
    <header class="public-layout__header">
      <RouterLink to="/" class="public-layout__brand">ModaLink</RouterLink>

      <div class="public-layout__actions">
        <ThemeToggle />
        <RouterLink :to="{ name: 'login' }" class="public-layout__login">
          Iniciar sesión
        </RouterLink>
        <RouterLink :to="{ name: 'registro' }" class="public-layout__cta">
          Crear cuenta
        </RouterLink>
      </div>
    </header>

    <main class="public-layout__main">
      <slot />
    </main>

    <footer class="public-layout__footer">
      <span>ModaLink · La red donde la moda se conecta</span>
      <nav class="public-layout__footer-nav" aria-label="Enlaces de la plataforma">
        <RouterLink :to="{ name: 'normas-convivencia' }">
          Normas de convivencia
        </RouterLink>
        <RouterLink :to="{ name: 'login' }">Iniciar sesión</RouterLink>
      </nav>
    </footer>
  </div>
</template>

<script>
import ThemeToggle from "./ThemeToggle.vue";

export default {
  name: "PublicLayout",
  components: { ThemeToggle },
};
</script>

<style scoped>
.public-layout {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
  color: var(--color-text);
}

.public-layout__header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem clamp(1rem, 4vw, 3rem);
  border-bottom: 1px solid var(--color-border-soft);
  background: color-mix(in srgb, var(--color-surface) 88%, transparent);
  backdrop-filter: blur(12px);
}

.public-layout__brand {
  color: var(--color-text);
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  text-decoration: none;
}

.public-layout__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.public-layout__login {
  color: var(--color-text-muted);
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
}

.public-layout__login:hover {
  color: var(--color-primary);
}

.public-layout__cta {
  padding: 0.55rem 0.95rem;
  border-radius: 999px;
  background: var(--color-primary);
  color: var(--color-on-primary);
  font-size: 0.88rem;
  font-weight: 700;
  text-decoration: none;
  transition: background-color 0.2s ease, transform 0.15s ease;
}

.public-layout__cta:hover {
  background: var(--color-primary-dark);
}

.public-layout__cta:active {
  transform: scale(0.97);
}

.public-layout__main {
  flex: 1;
  width: 100%;
  max-width: 1120px;
  margin: 0 auto;
  padding: clamp(1.5rem, 4vw, 3.5rem) clamp(1rem, 4vw, 2rem);
}

.public-layout__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  width: 100%;
  max-width: 1120px;
  margin: 0 auto;
  padding: 1.25rem clamp(1rem, 4vw, 2rem)
    calc(1.5rem + env(safe-area-inset-bottom));
  border-top: 1px solid var(--color-border-soft);
  color: var(--color-text-muted);
  font-size: 0.82rem;
}

.public-layout__footer-nav {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.public-layout__footer-nav a {
  color: var(--color-text-muted);
  font-weight: 600;
  text-decoration: none;
}

.public-layout__footer-nav a:hover {
  color: var(--color-primary);
}

@media (max-width: 640px) {
  .public-layout__login {
    display: none;
  }

  .public-layout__footer {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media print {
  .public-layout__header,
  .public-layout__footer {
    display: none !important;
  }

  .public-layout__main {
    max-width: none;
    padding: 0;
  }

  .public-layout {
    background: #ffffff;
  }
}
</style>
