<template>
  <article class="normas-page" aria-labelledby="normas-titulo">
    <div v-if="cargando" class="normas-state" role="status">
      <span class="normas-state__spinner" aria-hidden="true"></span>
      <span>Cargando las normas de convivencia…</span>
    </div>

    <div v-else-if="error" class="normas-state normas-state--error" role="alert">
      <p>{{ error }}</p>
      <button type="button" class="normas-state__retry" @click="cargar">
        Reintentar
      </button>
    </div>

    <template v-else-if="normas">
      <header class="normas-hero">
        <p class="normas-hero__eyebrow">Condición de la plataforma</p>
        <h1 id="normas-titulo" class="normas-hero__title">{{ normas.titulo }}</h1>

        <div class="normas-hero__meta">
          <span class="normas-badge">Versión {{ normas.version }}</span>
          <span>Vigente desde {{ formatearFechaCorta(normas.vigenteDesde) }}</span>
          <span v-if="normas.vigenteHasta">
            · Vigente hasta {{ formatearFechaCorta(normas.vigenteHasta) }}
          </span>
        </div>

        <p v-if="esHistorica" class="normas-hero__historica">
          Estás viendo una versión histórica.
          <RouterLink :to="{ name: 'normas-convivencia' }">
            Ver la versión vigente
          </RouterLink>
        </p>
      </header>

      <blockquote v-if="normas.regla" class="normas-rule">
        {{ normas.regla }}
      </blockquote>

      <div class="normas-grid">
        <nav class="normas-toc" aria-label="Contenido de las normas">
          <p class="normas-toc__titulo">Contenido</p>
          <ol>
            <li v-for="seccion in normas.secciones" :key="seccion.id">
              <a :href="`#${seccion.id}`">{{ seccion.titulo }}</a>
            </li>
            <li>
              <a href="#historial">Historial de versiones</a>
            </li>
          </ol>
        </nav>

        <div class="normas-contenido">
          <section
            v-for="seccion in normas.secciones"
            :id="seccion.id"
            :key="seccion.id"
            class="normas-section"
          >
            <h2>{{ seccion.titulo }}</h2>
            <p v-for="(parrafo, index) in seccion.parrafos" :key="index">
              {{ parrafo }}
            </p>
            <ul v-if="seccion.items.length">
              <li v-for="(item, index) in seccion.items" :key="index">
                {{ item }}
              </li>
            </ul>
          </section>

          <section id="historial" class="normas-section normas-history">
            <h2>Historial de versiones</h2>
            <div class="normas-history__scroll">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Versión</th>
                    <th scope="col">Vigencia</th>
                    <th scope="col">Cambios</th>
                    <th scope="col"><span class="sr-only">Acción</span></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="version in normas.historial" :key="version.version">
                    <td><strong>{{ version.version }}</strong></td>
                    <td>
                      Desde {{ formatearFechaCorta(version.vigenteDesde) }}
                      <template v-if="version.vigenteHasta">
                        · hasta {{ formatearFechaCorta(version.vigenteHasta) }}
                      </template>
                      <template v-else>· vigente</template>
                    </td>
                    <td>{{ version.cambios }}</td>
                    <td>
                      <RouterLink
                        v-if="version.vigenteHasta"
                        :to="{
                          name: 'normas-convivencia',
                          query: { version: version.version },
                        }"
                      >
                        Ver
                      </RouterLink>
                      <span v-else class="normas-history__actual">Actual</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      <footer class="normas-ayuda">
        <p>
          ¿Necesitás ayuda?
          <RouterLink :to="{ name: 'login' }">Iniciá sesión</RouterLink>
          o
          <RouterLink :to="{ name: 'registro' }">creá tu cuenta</RouterLink>.
        </p>
        <RouterLink to="/" class="normas-ayuda__volver">
          Volver al inicio
        </RouterLink>
      </footer>
    </template>
  </article>
</template>

<script>
import normasConvivenciaService from "../../services/normasConvivenciaService";
import { formatearFechaCorta } from "../../utils/fechas";

export default {
  name: "NormasConvivenciaView",
  data() {
    return {
      cargando: true,
      error: "",
      normas: null,
    };
  },
  computed: {
    esHistorica() {
      return Boolean(this.normas?.vigenteHasta);
    },
  },
  watch: {
    "$route.query.version"() {
      this.cargar();
    },
  },
  mounted() {
    this.cargar();
  },
  methods: {
    formatearFechaCorta,
    async cargar() {
      this.cargando = true;
      this.error = "";
      const version = this.$route.query.version;

      try {
        const respuesta = version
          ? await normasConvivenciaService.obtenerVersion(version)
          : await normasConvivenciaService.obtenerVigente();

        this.normas = respuesta?.data || null;

        if (!this.normas) {
          throw new Error("Respuesta vacía");
        }
      } catch {
        this.normas = null;
        this.error =
          "No pudimos cargar las normas de convivencia. Reintentá en unos instantes.";
      } finally {
        this.cargando = false;
      }
    },
  },
};
</script>

<style scoped>
.normas-page {
  width: 100%;
  max-width: 980px;
  margin: 0 auto;
}

.normas-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  min-height: 45vh;
  color: var(--color-text-muted);
  font-size: 0.95rem;
}

.normas-state--error {
  flex-direction: column;
  text-align: center;
  color: var(--color-danger-text);
}

.normas-state--error p {
  margin: 0;
  max-width: 420px;
}

.normas-state__spinner {
  width: 18px;
  height: 18px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: normas-girar 0.8s linear infinite;
}

@keyframes normas-girar {
  to {
    transform: rotate(360deg);
  }
}

.normas-state__retry {
  padding: 0.55rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-primary);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.normas-state__retry:hover {
  border-color: var(--color-primary);
}

.normas-hero {
  padding: clamp(1.5rem, 3vw, 2.5rem);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  background: var(--color-surface);
  box-shadow: 0 24px 50px -38px var(--color-shadow);
}

.normas-hero__eyebrow {
  margin: 0 0 0.65rem;
  color: var(--color-primary);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.normas-hero__title {
  margin: 0;
  color: var(--color-text);
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.1;
}

.normas-hero__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.55rem;
  margin-top: 1rem;
  color: var(--color-text-muted);
  font-size: 0.86rem;
}

.normas-badge {
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  background: var(--color-chip);
  color: var(--color-primary);
  font-weight: 800;
}

.normas-hero__historica {
  margin: 1rem 0 0;
  padding: 0.7rem 0.9rem;
  border: 1px solid var(--color-warning-border);
  border-radius: 10px;
  background: var(--color-warning-soft);
  color: var(--color-warning-text);
  font-size: 0.86rem;
  font-weight: 600;
}

.normas-hero__historica a {
  color: inherit;
  font-weight: 800;
}

.normas-rule {
  margin: 1.5rem 0 2rem;
  padding: 1.15rem 1.35rem;
  border: 0;
  border-left: 4px solid var(--color-primary);
  border-radius: 0 14px 14px 0;
  background: var(--color-surface-soft);
  color: var(--color-text);
  font-size: 1.02rem;
  line-height: 1.7;
}

.normas-grid {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: clamp(1.5rem, 4vw, 3rem);
  align-items: start;
}

.normas-toc {
  position: sticky;
  top: 90px;
  padding: 1rem 1.1rem;
  border: 1px solid var(--color-border-soft);
  border-radius: 14px;
  background: var(--color-surface);
}

.normas-toc__titulo {
  margin: 0 0 0.7rem;
  color: var(--color-text-muted);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.normas-toc ol {
  display: grid;
  gap: 0.45rem;
  margin: 0;
  padding-left: 1.15rem;
}

.normas-toc a {
  color: var(--color-text-muted);
  font-size: 0.85rem;
  line-height: 1.4;
  text-decoration: none;
}

.normas-toc a:hover {
  color: var(--color-primary);
  text-decoration: underline;
}

.normas-contenido {
  min-width: 0;
}

.normas-section {
  scroll-margin-top: 96px;
  padding: 1.5rem 0;
  border-bottom: 1px solid var(--color-border-soft);
}

.normas-section:first-child {
  padding-top: 0;
}

.normas-section h2 {
  margin: 0;
  color: var(--color-text);
  font-size: clamp(1.25rem, 2vw, 1.55rem);
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.3;
}

.normas-section p {
  margin: 0.75rem 0 0;
  color: var(--color-text);
  font-size: 0.96rem;
  line-height: 1.75;
}

.normas-section ul {
  display: grid;
  gap: 0.5rem;
  margin: 0.9rem 0 0;
  padding-left: 1.2rem;
  color: var(--color-text);
  font-size: 0.96rem;
  line-height: 1.65;
}

.normas-history {
  border-bottom: 0;
}

.normas-history__scroll {
  margin-top: 1rem;
  overflow-x: auto;
}

.normas-history table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}

.normas-history th,
.normas-history td {
  padding: 0.65rem 0.55rem;
  border-bottom: 1px solid var(--color-border-soft);
  text-align: left;
  vertical-align: top;
}

.normas-history th {
  color: var(--color-text-muted);
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.normas-history a {
  color: var(--color-primary);
  font-weight: 700;
  text-decoration: none;
}

.normas-history a:hover {
  text-decoration: underline;
}

.normas-history__actual {
  color: var(--color-success-text);
  font-weight: 700;
}

.normas-ayuda {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 2rem;
  padding: 1.25rem 1.35rem;
  border: 1px solid var(--color-border-soft);
  border-radius: 14px;
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.normas-ayuda p {
  margin: 0;
}

.normas-ayuda a {
  color: var(--color-primary);
  font-weight: 700;
  text-decoration: none;
}

.normas-ayuda a:hover {
  text-decoration: underline;
}

.normas-ayuda__volver {
  white-space: nowrap;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 900px) {
  .normas-grid {
    grid-template-columns: 1fr;
  }

  .normas-toc {
    position: static;
  }

  .normas-toc ol {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .normas-toc ol {
    grid-template-columns: 1fr;
  }

  .normas-hero {
    padding: 1.25rem;
  }

  .normas-rule {
    padding: 1rem;
    font-size: 0.95rem;
  }

  .normas-ayuda {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media print {
  .normas-toc,
  .normas-ayuda {
    display: none !important;
  }

  .normas-hero,
  .normas-rule {
    box-shadow: none;
  }

  .normas-grid {
    display: block;
  }

  .normas-page {
    max-width: none;
  }
}
</style>
