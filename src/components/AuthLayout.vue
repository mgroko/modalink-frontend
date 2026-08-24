<template>
  <div class="auth-layout">
    <RouterLink to="/" class="auth-layout__brand" aria-label="Ir al inicio">
      <span class="auth-layout__brand-text">ModaLink</span>
    </RouterLink>

    <main class="auth-layout__content">
      <slot />
    </main>
  </div>
</template>

<script>
export default {
  name: "AuthLayout",
};
</script>

<style scoped>
.auth-layout {
  min-height: 100vh;
  display: flex;
  background: var(--va-background-secondary, #ffffe7);
}

.auth-layout__brand {
  width: 35vw;
  min-width: 280px;
  background: var(--va-primary, #b865a4);
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}

.auth-layout__brand-text {
  color: #fff;
  font-size: 2rem;
  font-weight: 750;
  letter-spacing: 0.20em;
}

.auth-layout__content {
  flex: 1;
  display: flex;
  align-items: center;  
  justify-content: center;
  padding: 2.5rem 1.5rem;    
}

@media (max-width: 1024px) {
  .auth-layout {
    flex-direction: column;
  }

  .auth-layout__brand {
    width: 100%;
    min-width: 0;
    padding: 1.5rem;
    justify-content: flex-start;
  }

  .auth-layout__content {
    padding: 1.5rem;
  }
}


</style>