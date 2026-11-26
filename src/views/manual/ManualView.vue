<template>
  <div class="manual-page">
    <aside class="manual-sidebar">
      <div class="manual-sidebar__header">
        <p class="manual-sidebar__eyebrow">
          {{ esAdmin ? "Administración" : "Ayuda" }}
        </p>
        <h1 class="manual-sidebar__titulo">{{ tituloManual }}</h1>
        <p v-if="indice" class="manual-sidebar__version">
          Versión {{ indice.version }}
        </p>
      </div>

      <form class="manual-search" @submit.prevent="buscar">
        <label class="manual-search__label" for="manual-busqueda">
          Buscar en el manual
        </label>
        <div class="manual-search__row">
          <input
            id="manual-busqueda"
            v-model="consulta"
            type="search"
            placeholder="Palabras clave"
            autocomplete="off"
          />
          <button type="submit" :disabled="buscando">
            {{ buscando ? "..." : "Buscar" }}
          </button>
        </div>
      </form>

      <section
        v-if="busquedaRealizada"
        class="manual-resultados"
        aria-live="polite"
      >
        <div class="manual-resultados__cabecera">
          <p class="manual-resultados__titulo">
            {{ resultados.length }} resultado(s)
          </p>
          <button
            type="button"
            class="manual-resultados__limpiar"
            @click="limpiarBusqueda"
          >
            Limpiar
          </button>
        </div>
        <ul v-if="resultados.length" class="manual-resultados__lista">
          <li
            v-for="resultado in resultados"
            :key="`${resultado.capituloId}-${resultado.seccionId}-${resultado.fragmento}`"
          >
            <RouterLink
              :to="{
                name: rutaCapitulo,
                params: { id: resultado.capituloId },
                hash: `#${resultado.seccionId}`,
              }"
            >
              <strong>{{ resultado.capituloTitulo }}</strong>
              <span class="manual-resultados__seccion">
                {{ resultado.seccion }}
              </span>
              <small>{{ resultado.fragmento }}</small>
            </RouterLink>
          </li>
        </ul>
        <p v-else class="manual-resultados__vacio">
          No encontramos coincidencias.
        </p>
      </section>

      <nav class="manual-indice" aria-label="Capítulos del manual">
        <p class="manual-indice__titulo">Capítulos</p>
        <RouterLink
          v-for="capituloIndice in indice?.capitulos || []"
          :key="capituloIndice.id"
          :to="{ name: rutaCapitulo, params: { id: capituloIndice.id } }"
          class="manual-indice__item"
          :class="{
            'manual-indice__item--activo': capituloIndice.id === capitulo?.id,
          }"
          :aria-current="
            capituloIndice.id === capitulo?.id ? 'page' : undefined
          "
        >
          <span class="manual-indice__numero">
            {{ capituloIndice.etiqueta || capituloIndice.numero }}
          </span>
          <span>{{ capituloIndice.titulo }}</span>
        </RouterLink>
      </nav>

      <RouterLink :to="volverA" class="manual-sidebar__volver">
        <span class="material-symbols-outlined">arrow_back</span>
        Volver a la app
      </RouterLink>
    </aside>

    <main class="manual-main">
      <div v-if="cargando" class="manual-estado" role="status">
        <span class="manual-estado__spinner" aria-hidden="true"></span>
        Cargando el manual…
      </div>

      <div
        v-else-if="error"
        class="manual-estado manual-estado--error"
        role="alert"
      >
        <p>{{ error }}</p>
        <button type="button" class="manual-estado__reintentar" @click="cargar">
          Reintentar
        </button>
      </div>

      <article v-else-if="capitulo" class="manual-lector">
        <header class="manual-lector__header">
          <div>
            <p class="manual-lector__eyebrow">
              {{ capitulo.etiqueta || `Capítulo ${capitulo.numero}` }}
            </p>
            <h2>{{ capitulo.titulo }}</h2>
          </div>
          <div class="manual-lector__acciones">
            <RouterLink
              :to="{ name: rutaIndice }"
              class="manual-lector__accion"
            >
              Índice
            </RouterLink>
            <button
              type="button"
              class="manual-lector__accion"
              @click="imprimir"
            >
              Imprimir
            </button>
          </div>
        </header>

        <nav
          v-if="capitulo.secciones.length"
          class="manual-toc"
          aria-label="Contenido del capítulo"
        >
          <p class="manual-toc__titulo">En este capítulo</p>
          <ol>
            <li
              v-for="seccion in capitulo.secciones"
              :key="seccion.id"
              :class="`manual-toc__nivel-${seccion.nivel}`"
            >
              <a href="#" @click.prevent="irASeccion(seccion.id)">
                {{ seccion.titulo }}
              </a>
            </li>
          </ol>
        </nav>

        <div class="manual-contenido" v-html="capitulo.html"></div>

        <nav class="manual-nav" aria-label="Navegación entre capítulos">
          <RouterLink
            v-if="capitulo.anterior"
            :to="{
              name: rutaCapitulo,
              params: { id: capitulo.anterior.id },
            }"
            class="manual-nav__link"
          >
            <span>Anterior</span>
            <strong>{{ capitulo.anterior.titulo }}</strong>
          </RouterLink>
          <span v-else></span>

          <RouterLink
            v-if="capitulo.siguiente"
            :to="{
              name: rutaCapitulo,
              params: { id: capitulo.siguiente.id },
            }"
            class="manual-nav__link manual-nav__link--siguiente"
          >
            <span>Siguiente</span>
            <strong>{{ capitulo.siguiente.titulo }}</strong>
          </RouterLink>
        </nav>
      </article>

      <div v-else class="manual-portada">
        <p class="manual-portada__eyebrow">
          {{ esAdmin ? "Manual de administración" : "Manual de usuario" }}
        </p>
        <h2>{{ tituloManual }}</h2>
        <p class="manual-portada__intro">
          Consultá el paso a paso de cada función. Elegí un capítulo del
          índice o usá el buscador.
        </p>

        <div class="manual-portada__grid">
          <RouterLink
            v-for="capituloIndice in indice?.capitulos || []"
            :key="capituloIndice.id"
            :to="{ name: rutaCapitulo, params: { id: capituloIndice.id } }"
            class="manual-portada__card"
          >
            <span class="manual-portada__numero">
              {{ capituloIndice.etiqueta || capituloIndice.numero }}
            </span>
            <strong>{{ capituloIndice.titulo }}</strong>
          </RouterLink>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import manualService from "../../services/manualService";
import { esAdmin as esAdminSesion } from "../../services/authState";

export default {
  name: "ManualView",
  data() {
    return {
      indice: null,
      capitulo: null,
      consulta: "",
      resultados: [],
      busquedaRealizada: false,
      buscando: false,
      cargando: true,
      error: "",
    };
  },
  computed: {
    esAdmin() {
      return esAdminSesion();
    },
    tituloManual() {
      return this.esAdmin ? "Manual de administración" : "Manual de usuario";
    },
    rutaIndice() {
      return this.esAdmin ? "admin-manual" : "manual";
    },
    rutaCapitulo() {
      return this.esAdmin ? "admin-manual-capitulo" : "manual-capitulo";
    },
    volverA() {
      return this.esAdmin
        ? { name: "dashboard-admin" }
        : { name: "home" };
    },
  },
  watch: {
    "$route.params.id"() {
      this.cargar();
    },
  },
  mounted() {
    this.cargar();
  },
  methods: {
    async cargar() {
      this.cargando = true;
      this.error = "";

      try {
        const respuestaIndice = await manualService.obtenerIndice();
        this.indice = respuestaIndice?.data || null;

        const id = this.$route.params.id;
        if (id) {
          const respuestaCapitulo = await manualService.obtenerCapitulo(id);
          this.capitulo = respuestaCapitulo?.data || null;
          await this.$nextTick();
          this.scrollAlHash();
        } else {
          this.capitulo = null;
        }
      } catch {
        this.error =
          "No pudimos cargar el manual. Reintentá en unos instantes.";
      } finally {
        this.cargando = false;
      }
    },
    async buscar() {
      const consulta = this.consulta.trim();
      if (consulta.length < 2) {
        this.resultados = [];
        this.busquedaRealizada = false;
        return;
      }

      this.buscando = true;
      this.busquedaRealizada = true;
      try {
        const respuesta = await manualService.buscar(consulta);
        this.resultados = respuesta?.data || [];
      } catch {
        this.resultados = [];
      } finally {
        this.buscando = false;
      }
    },
    limpiarBusqueda() {
      this.consulta = "";
      this.resultados = [];
      this.busquedaRealizada = false;
    },
    irASeccion(id) {
      const seccion = document.getElementById(id);
      if (seccion) {
        seccion.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    scrollAlHash() {
      const hash = this.$route.hash;
      if (hash) {
        const seccion = document.getElementById(hash.slice(1));
        if (seccion) {
          seccion.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
      }
      window.scrollTo({ top: 0 });
    },
    imprimir() {
      window.print();
    },
  },
};
</script>

<style scoped>
.manual-page {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 1.5rem;
  width: 100%;
  max-width: 1240px;
  margin: 0 auto;
  align-items: start;
}

.manual-sidebar {
  position: sticky;
  top: 96px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  padding: 1rem;
  border: 1px solid var(--color-border-soft);
  border-radius: 16px;
  background: var(--color-surface);
}

.manual-sidebar__eyebrow {
  margin: 0 0 0.35rem;
  color: var(--color-primary);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.manual-sidebar__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1.35rem;
  font-weight: 700;
  line-height: 1.2;
}

.manual-sidebar__version {
  margin: 0.35rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.manual-search {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border-soft);
}

.manual-search__label {
  display: block;
  margin-bottom: 0.4rem;
  color: var(--color-text-muted);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.manual-search__row {
  display: flex;
  gap: 0.4rem;
}

.manual-search__row input {
  min-width: 0;
  flex: 1;
  padding: 0.5rem 0.6rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  font-size: 0.85rem;
}

.manual-search__row input:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
}

.manual-search__row button {
  padding: 0.5rem 0.7rem;
  border: 0;
  border-radius: 8px;
  background: var(--color-primary);
  color: var(--color-on-primary);
  font: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
}

.manual-search__row button:disabled {
  opacity: 0.6;
  cursor: wait;
}

.manual-resultados {
  margin-top: 0.9rem;
  padding: 0.7rem;
  border: 1px solid var(--color-border-soft);
  border-radius: 10px;
  background: var(--color-surface-soft);
}

.manual-resultados__cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.manual-resultados__titulo {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  font-weight: 700;
}

.manual-resultados__limpiar {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-primary);
  font: inherit;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
}

.manual-resultados__lista {
  display: grid;
  gap: 0.5rem;
  margin: 0.6rem 0 0;
  padding: 0;
  list-style: none;
}

.manual-resultados__lista a {
  display: block;
  padding: 0.5rem;
  border-radius: 8px;
  color: var(--color-text);
  text-decoration: none;
}

.manual-resultados__lista a:hover {
  background: var(--color-hover);
}

.manual-resultados__lista strong {
  display: block;
  font-size: 0.82rem;
}

.manual-resultados__seccion {
  display: block;
  margin-top: 0.1rem;
  color: var(--color-primary);
  font-size: 0.76rem;
  font-weight: 600;
}

.manual-resultados__lista small {
  display: block;
  margin-top: 0.25rem;
  color: var(--color-text-muted);
  font-size: 0.74rem;
  line-height: 1.4;
}

.manual-resultados__vacio {
  margin: 0.6rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.manual-indice {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border-soft);
}

.manual-indice__titulo {
  margin: 0 0 0.45rem;
  color: var(--color-text-muted);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.manual-indice__item {
  display: flex;
  align-items: baseline;
  gap: 0.55rem;
  padding: 0.4rem 0.5rem;
  border-radius: 8px;
  color: var(--color-text-muted);
  font-size: 0.84rem;
  line-height: 1.35;
  text-decoration: none;
}

.manual-indice__item:hover {
  background: var(--color-hover);
  color: var(--color-text);
}

.manual-indice__item--activo {
  background: var(--color-chip);
  color: var(--color-primary);
  font-weight: 700;
}

.manual-indice__numero {
  flex: 0 0 auto;
  min-width: 1.5rem;
  color: var(--color-text-subtle);
  font-size: 0.74rem;
  font-weight: 700;
}

.manual-indice__item--activo .manual-indice__numero {
  color: var(--color-primary);
}

.manual-sidebar__volver {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: 1rem;
  color: var(--color-text-muted);
  font-size: 0.8rem;
  font-weight: 600;
  text-decoration: none;
}

.manual-sidebar__volver:hover {
  color: var(--color-primary);
}

.manual-sidebar__volver .material-symbols-outlined {
  font-size: 1rem;
}

.manual-main {
  min-width: 0;
  padding: clamp(1.25rem, 3vw, 2.5rem);
  border: 1px solid var(--color-border-soft);
  border-radius: 18px;
  background: var(--color-surface);
  box-shadow: 0 24px 50px -40px var(--color-shadow);
}

.manual-estado {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;
  min-height: 40vh;
  color: var(--color-text-muted);
  font-size: 0.92rem;
}

.manual-estado--error {
  flex-direction: column;
  color: var(--color-danger-text);
  text-align: center;
}

.manual-estado__spinner {
  width: 18px;
  height: 18px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: manual-girar 0.8s linear infinite;
}

@keyframes manual-girar {
  to {
    transform: rotate(360deg);
  }
}

.manual-estado__reintentar {
  padding: 0.5rem 0.9rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-primary);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.manual-lector__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border-soft);
}

.manual-lector__eyebrow {
  margin: 0 0 0.35rem;
  color: var(--color-primary);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.manual-lector__header h2 {
  margin: 0;
  color: var(--color-text);
  font-size: clamp(1.5rem, 2.6vw, 2.1rem);
  font-weight: 700;
  letter-spacing: -0.015em;
  line-height: 1.2;
}

.manual-lector__acciones {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 0 0 auto;
}

.manual-lector__accion {
  padding: 0.4rem 0.7rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-text-muted);
  font: inherit;
  font-size: 0.78rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
}

.manual-lector__accion:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.manual-toc {
  margin: 1.25rem 0;
  padding: 0.9rem 1rem;
  border: 1px solid var(--color-border-soft);
  border-radius: 12px;
  background: var(--color-surface-soft);
}

.manual-toc__titulo {
  margin: 0 0 0.45rem;
  color: var(--color-text-muted);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.manual-toc ol {
  display: grid;
  gap: 0.3rem;
  margin: 0;
  padding-left: 1.1rem;
}

.manual-toc a {
  color: var(--color-text-muted);
  font-size: 0.84rem;
  line-height: 1.4;
  text-decoration: none;
}

.manual-toc a:hover {
  color: var(--color-primary);
  text-decoration: underline;
}

.manual-toc__nivel-3 {
  margin-left: 0.8rem;
}

.manual-contenido {
  overflow-x: auto;
  color: var(--color-text);
}

.manual-contenido :deep(h2),
.manual-contenido :deep(h3) {
  scroll-margin-top: 96px;
  color: var(--color-text);
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.3;
}

.manual-contenido :deep(h2) {
  margin: 1.8rem 0 0.6rem;
  padding-top: 0.8rem;
  border-top: 1px solid var(--color-border-soft);
  font-size: clamp(1.2rem, 2vw, 1.5rem);
}

.manual-contenido :deep(h2:first-child) {
  margin-top: 0;
  padding-top: 0;
  border-top: 0;
}

.manual-contenido :deep(h3) {
  margin: 1.2rem 0 0.4rem;
  font-size: 1.08rem;
}

.manual-contenido :deep(p) {
  margin: 0.65rem 0;
  font-size: 0.95rem;
  line-height: 1.75;
}

.manual-contenido :deep(ul),
.manual-contenido :deep(ol) {
  display: grid;
  gap: 0.4rem;
  margin: 0.7rem 0;
  padding-left: 1.3rem;
  font-size: 0.95rem;
  line-height: 1.65;
}

.manual-contenido :deep(strong) {
  font-weight: 700;
}

.manual-contenido :deep(a) {
  color: var(--color-primary);
  font-weight: 600;
  text-decoration: underline;
}

.manual-contenido :deep(blockquote) {
  margin: 1rem 0;
  padding: 0.85rem 1rem;
  border-left: 3px solid var(--color-primary);
  border-radius: 0 10px 10px 0;
  background: var(--color-surface-soft);
  color: var(--color-text);
}

.manual-contenido :deep(blockquote p) {
  margin: 0;
}

.manual-contenido :deep(code) {
  padding: 0.1rem 0.3rem;
  border-radius: 4px;
  background: var(--color-surface-muted);
  font-size: 0.88em;
}

.manual-contenido :deep(table) {
  width: 100%;
  margin: 1rem 0;
  border-collapse: collapse;
  font-size: 0.88rem;
}

.manual-contenido :deep(th),
.manual-contenido :deep(td) {
  padding: 0.5rem 0.6rem;
  border: 1px solid var(--color-border-soft);
  text-align: left;
  vertical-align: top;
}

.manual-contenido :deep(th) {
  background: var(--color-surface-soft);
  font-weight: 700;
}

.manual-contenido :deep(hr) {
  margin: 1.5rem 0;
  border: 0;
  border-top: 1px solid var(--color-border-soft);
}

.manual-contenido :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 10px;
}

.manual-nav {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--color-border-soft);
}

.manual-nav__link {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  max-width: 45%;
  padding: 0.65rem 0.8rem;
  border: 1px solid var(--color-border-soft);
  border-radius: 10px;
  color: var(--color-text);
  text-decoration: none;
}

.manual-nav__link:hover {
  border-color: var(--color-primary);
}

.manual-nav__link span {
  color: var(--color-text-muted);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.manual-nav__link strong {
  font-size: 0.88rem;
}

.manual-nav__link--siguiente {
  text-align: right;
}

.manual-portada__eyebrow {
  margin: 0 0 0.5rem;
  color: var(--color-primary);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.manual-portada h2 {
  margin: 0;
  color: var(--color-text);
  font-size: clamp(1.7rem, 3vw, 2.4rem);
  font-weight: 700;
  letter-spacing: -0.02em;
}

.manual-portada__intro {
  margin: 0.6rem 0 1.5rem;
  color: var(--color-text-muted);
  font-size: 0.95rem;
  line-height: 1.65;
}

.manual-portada__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
}

.manual-portada__card {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.9rem;
  border: 1px solid var(--color-border-soft);
  border-radius: 12px;
  background: var(--color-surface-soft);
  color: var(--color-text);
  text-decoration: none;
  transition: border-color 0.2s ease, transform 0.15s ease;
}

.manual-portada__card:hover {
  border-color: var(--color-primary);
  transform: translateY(-1px);
}

.manual-portada__numero {
  color: var(--color-primary);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.manual-portada__card strong {
  font-size: 0.9rem;
  line-height: 1.35;
}

@media (max-width: 900px) {
  .manual-page {
    grid-template-columns: 1fr;
  }

  .manual-main {
    order: 1;
  }

  .manual-sidebar {
    order: 2;
    position: static;
    max-height: none;
  }
}

@media (max-width: 560px) {
  .manual-lector__header {
    flex-direction: column;
  }

  .manual-lector__acciones {
    align-self: flex-start;
  }

  .manual-nav {
    flex-direction: column;
  }

  .manual-nav__link {
    max-width: none;
  }

  .manual-nav__link--siguiente {
    text-align: left;
  }
}

@media print {
  .manual-sidebar,
  .manual-toc,
  .manual-nav,
  .manual-lector__acciones {
    display: none !important;
  }

  .manual-page {
    display: block;
    max-width: none;
  }

  .manual-main {
    padding: 0;
    border: 0;
    box-shadow: none;
  }
}
</style>
