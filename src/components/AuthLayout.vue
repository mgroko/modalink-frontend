<template>
  <div class="auth-layout">
    <div class="auth-layout__brand">
      <img
        v-for="(img, index) in imagenes"
        :key="img"
        :src="img"
        alt=""
        class="auth-layout__brand-slide"
        :class="{ 'auth-layout__brand-slide--visible': index === imagenActiva }"
      />

      <RouterLink to="/" class="auth-layout__brand-link" aria-label="Ir al inicio">
        <span class="auth-layout__brand-text">ModaLink</span>
      </RouterLink>
    </div>

    <main class="auth-layout__content">
      <slot />
    </main>
  </div>
</template>

<script>
import foto1 from "../assets/auth/DSC_0162.jpg";
import foto2 from "../assets/auth/DSC_0102-2.jpg";
import foto3 from "../assets/auth/DSC_0120.jpg";
import foto4 from "../assets/auth/DSC_0115.jpg";
import foto5 from "../assets/auth/DSC_0275.jpg";
import foto6 from "../assets/auth/DSC_0244.jpg";
import foto7 from "../assets/auth/DSC_0178.jpg";
import foto8 from "../assets/auth/DSC_0308.jpg";
import foto9 from "../assets/auth/DSC_0325.jpg";

const INTERVALO_ROTACION = 5000;

export default {
  name: "AuthLayout",
  data() {
    return {
      imagenes: [foto1, foto2, foto3, foto4, foto5, foto6, foto7, foto8, foto9],
      imagenActiva: 0,
      intervalo: null,
    };
  },
  mounted() {
    if (this.imagenes.length > 1) {
      this.intervalo = setInterval(this.avanzarImagen, INTERVALO_ROTACION);
    }
  },
  beforeUnmount() {
    if (this.intervalo) clearInterval(this.intervalo);
  },
  methods: {
    avanzarImagen() {
      this.imagenActiva = (this.imagenActiva + 1) % this.imagenes.length;
    },
  },
};
</script>

<style scoped>
.auth-layout {
  min-height: 100vh;
  display: flex;
  background: var(--va-background-secondary, #F5F5F8);
}

.auth-layout__brand {
  position: relative;
  width: 40vw;
  min-width: 280px;
  background: var(--va-primary, #494776);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.auth-layout__brand-slide {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  opacity: 0;
  transition: opacity 0.9s ease;
}

.auth-layout__brand-slide--visible {
  opacity: 1;
}

.auth-layout__brand-link {
  position: relative;
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  z-index: 1;
}

.auth-layout__brand-text {
  color: #ecfeff;
  font-size: 3rem;
  font-weight: 1000;
  letter-spacing: 0.20em;
  text-shadow: 0 4px 10px rgba(0, 0, 0, 0.45);
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

  .auth-layout__brand-link {
    justify-content: flex-start;
    padding: 0;
  }

  .auth-layout__content {
    padding: 1.5rem;
  }
}
</style>
