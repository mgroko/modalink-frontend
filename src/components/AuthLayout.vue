<template>
  <div class="auth-layout">
    <aside class="auth-layout__brand">
      <img
        v-for="(img, index) in imagenes"
        :key="img"
        :src="img"
        alt=""
        class="auth-layout__brand-slide"
        :class="{ 'auth-layout__brand-slide--visible': index === imagenActiva }"
      />

      <div class="auth-layout__brand-overlay" aria-hidden="true"></div>

      <RouterLink to="/" class="auth-layout__brand-link">
        <span class="auth-layout__brand-text">ModaLink</span>
      </RouterLink>

      <div class="auth-layout__brand-bottom">
        <p class="auth-layout__tagline">La red donde la moda se conecta.</p>

        <div class="auth-layout__controls">
          <div class="auth-layout__dots" role="tablist" aria-label="Imagenes del carrusel">
            <button
              v-for="(img, index) in imagenes"
              :key="'dot-' + index"
              type="button"
              class="auth-layout__dot"
              :class="{ 'auth-layout__dot--active': index === imagenActiva }"
              :aria-label="`Ir a la imagen ${index + 1}`"
              :aria-pressed="index === imagenActiva"
              @click="irAImagen(index)"
            ></button>
          </div>

          <div class="auth-layout__arrows">
            <button
              type="button"
              class="auth-layout__arrow"
              aria-label="Imagen anterior"
              @click="imagenAnterior"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="14 6 8 12 14 18" />
              </svg>
            </button>
            <button
              type="button"
              class="auth-layout__arrow"
              aria-label="Imagen siguiente"
              @click="imagenSiguiente"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="10 6 16 12 10 18" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </aside>

    <main class="auth-layout__content">
      <slot />
    </main>

    <div class="auth-layout__theme">
      <ThemeToggle />
    </div>
  </div>
</template>

<script>
import ThemeToggle from "./ThemeToggle.vue";
import foto1 from "../assets/auth/DSC_0275.jpg";
import foto2 from "../assets/auth/DSC_0162.jpg";
import foto3 from "../assets/auth/DSC_0244.jpg";
import foto4 from "../assets/auth/DSC_0212.jpg";
import foto5 from "../assets/auth/DSC_0245.jpg";
import foto6 from "../assets/auth/DSC_0026.jpg";
import foto7 from "../assets/auth/DSC_0120.jpg";
import foto8 from "../assets/auth/DSC_0115.jpg";
import foto9 from "../assets/auth/DSC_0102-2.jpg";
import foto10 from "../assets/auth/ro1.jpeg";
import foto11 from "../assets/auth/ro2.jpeg";

const INTERVALO_ROTACION = 5000;

export default {
  name: "AuthLayout",
  components: {
    ThemeToggle,
  },
  data() {
    return {
      imagenes: [
        foto1,
        foto2,
        foto3,
        foto4,
        foto5,
        foto6,
        foto7,
        foto8,
        foto9,
        foto10,
        foto11
      ],
      imagenActiva: 0,
      intervalo: null,
    };
  },
  mounted() {
    this.iniciarRotacion();
  },
  beforeUnmount() {
    this.detenerRotacion();
  },
  methods: {
    iniciarRotacion() {
      if (this.imagenes.length <= 1) return;
      this.detenerRotacion();
      this.intervalo = setInterval(this.imagenSiguiente, INTERVALO_ROTACION);
    },
    detenerRotacion() {
      if (this.intervalo) {
        clearInterval(this.intervalo);
        this.intervalo = null;
      }
    },
    reiniciarRotacion() {
      this.iniciarRotacion();
    },
    irAImagen(index) {
      this.imagenActiva = index;
      this.reiniciarRotacion();
    },
    imagenAnterior() {
      this.imagenActiva =
        (this.imagenActiva - 1 + this.imagenes.length) % this.imagenes.length;
      this.reiniciarRotacion();
    },
    imagenSiguiente() {
      this.imagenActiva = (this.imagenActiva + 1) % this.imagenes.length;
      this.reiniciarRotacion();
    },
  },
};
</script>

<style scoped>
.auth-layout {
  position: relative;
  min-height: 100vh;
  display: flex;
  background: var(--color-bg);
}

.auth-layout__theme {
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
  z-index: 5;
}

/* ---------- Panel izquierdo: carrusel ---------- */
.auth-layout__brand {
  position: relative;
  width: 44vw;
  min-width: 300px;
  background: var(--color-primary-dark);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
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

/* Gradiente para dar contraste a los textos sobre la foto */
.auth-layout__brand-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(73, 71, 118, 0.5) 0%,
    rgba(35, 33, 52, 0.15) 42%,
    rgba(30, 26, 54, 0.88) 100%
  );
}

.auth-layout__brand-link {
  position: relative;
  z-index: 1;
  align-self: flex-start;
  margin: 2.25rem 0 0 3rem;
  text-decoration: none;
}

.auth-layout__brand-text {
  font-family: inherit;
  color: #ffffff;
  font-size: 1.9rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.35);
}

.auth-layout__brand-bottom {
  position: relative;
  z-index: 1;
  padding: 0 3rem 2.25rem;
}

.auth-layout__tagline {
  margin: 0 0 2.5rem;
  max-width: 15ch;
  font-family: inherit;
  color: #ffffff;
  font-size: clamp(1.75rem, 2.6vw, 2.5rem);
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.01em;
  text-shadow: 0 2px 14px rgba(0, 0, 0, 0.35);
}

/* Dots + flechas */
.auth-layout__controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
}

.auth-layout__dots {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.auth-layout__dot {
  width: 7px;
  height: 7px;
  padding: 0;
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.45);
  cursor: pointer;
  transition: width 0.25s ease, background 0.25s ease;
}

.auth-layout__dot--active {
  width: 28px;
  background: #ffffff;
}

.auth-layout__arrows {
  display: flex;
  gap: 0.75rem;
}

.auth-layout__arrow {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.35);
  background: rgba(255, 255, 255, 0.14);
  color: #ffffff;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.15s ease;
}

.auth-layout__arrow svg {
  width: 20px;
  height: 20px;
}

.auth-layout__arrow:hover {
  background: rgba(255, 255, 255, 0.28);
}

.auth-layout__arrow:active {
  transform: scale(0.94);
}

/* ---------- Panel derecho: contenido ---------- */
.auth-layout__content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-y: auto;
  padding: 2.5rem 1.5rem;
  max-height: 100vh;
}

/* ---------- Responsive ---------- */
@media (max-width: 1024px) {
  .auth-layout {
    flex-direction: column;
  }

  .auth-layout__brand {
    width: 100%;
    min-width: 0;
    min-height: 260px;
  }

  .auth-layout__brand-link {
    margin: 1.5rem;
  }

  .auth-layout__brand-text {
    font-size: 1.5rem;
  }

  .auth-layout__tagline {
    display: none;
  }

  .auth-layout__brand-bottom {
    padding: 0 1.5rem 1.25rem;
  }

  .auth-layout__content {
    max-height: none;
    padding: 1.5rem;
  }
}
</style>
