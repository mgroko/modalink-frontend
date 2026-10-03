<template>
  <div class="buscar-perfil">
    <h1 class="buscar-perfil__titulo">Buscar perfiles</h1>
    <p class="buscar-perfil__subtitulo">
      Encontrá profesionales por nombre, profesión o ubicación.
    </p>

    <section class="buscar-perfil__filtros">
      <VaInput
        v-model="filtros.q"
        class="buscar-perfil__campo buscar-perfil__campo--texto"
        placeholder="Nombre artístico o profesión"
        @keyup.enter="buscarAhora"
        @input="programarBusqueda"
      >
        <template #prependInner>
          <span class="material-symbols-outlined buscar-perfil__icono-campo">search</span>
        </template>
      </VaInput>

      <VaSelect
        v-model="filtros.idProfesion"
        class="buscar-perfil__campo"
        :options="profesiones"
        value-by="idProfesion"
        :text-by="(option) => option.nombre"
        placeholder="Profesión"
        clearable
        :loading="cargandoProfesiones"
        @update:modelValue="buscarAhora"
      />

      <VaSelect
        v-model="filtros.tamano"
        class="buscar-perfil__campo buscar-perfil__campo--tamano"
        :options="opcionesTamano"
        value-by="value"
        text-by="text"
        placeholder="Resultados"
        @update:modelValue="buscarAhora"
      />

      <VaButton preset="secondary" @click="limpiarFiltros">
        Limpiar filtros
      </VaButton>
    </section>

    <BaseAlert v-if="mensajeError" :message="mensajeError" type="error" />

    <div v-if="cargando" class="buscar-perfil__estado">
      <span class="material-symbols-outlined buscar-perfil__estado-icono">hourglass_empty</span>
      Buscando perfiles...
    </div>

    <template v-else>
      <p v-if="paginacion.totalElementos > 0" class="buscar-perfil__resumen">
        {{ paginacion.totalElementos }} perfil(es) encontrado(s)
        <template v-if="!esTodos">
          · Página {{ paginacion.paginaActual + 1 }} de {{ paginacion.totalPaginas }}
        </template>
      </p>

      <div v-if="perfiles.length === 0" class="buscar-perfil__estado">
        <span class="material-symbols-outlined buscar-perfil__estado-icono">search_off</span>
        <span>No encontramos ningún perfil que coincida con tus criterios de búsqueda.</span>
        <VaButton preset="secondary" size="small" @click="limpiarFiltros">
          Restablecer filtros
        </VaButton>
      </div>

      <div v-else class="buscar-perfil__grid">
        <article
          v-for="perfil in perfiles"
          :key="perfil.idPerfil"
          class="perfil-busqueda"
          role="button"
          tabindex="0"
          @click="irAPerfil(perfil)"
          @keydown.enter="irAPerfil(perfil)"
          @keydown.space.prevent="irAPerfil(perfil)"
        >
          <div class="perfil-busqueda__foto">
            <img
              v-if="perfil.fotoUrl"
              :src="perfil.fotoUrl"
              :alt="perfil.nombreArtistico"
            />
            <span v-else class="perfil-busqueda__inicial">
              {{ inicialDe(perfil.nombreArtistico) }}
            </span>
          </div>

          <div class="perfil-busqueda__cuerpo">
            <h3 class="perfil-busqueda__nombre">{{ perfil.nombreArtistico }}</h3>

            <VaBadge
              v-if="perfil.profesion"
              :text="perfil.profesion"
              color="secondary"
              outline
              class="perfil-busqueda__profesion"
            />

            <p v-if="perfil.nombreUsuario" class="perfil-busqueda__nombre-real">
              {{ perfil.nombreUsuario }} {{ perfil.apellidoUsuario }}
            </p>

            <p v-if="ubicacionTexto(perfil)" class="perfil-busqueda__ubicacion">
              <span class="material-symbols-outlined">location_on</span>
              {{ ubicacionTexto(perfil) }}
            </p>

            <div v-if="habilidadesVisibles(perfil).length" class="perfil-busqueda__habilidades">
              <span
                v-for="habilidad in habilidadesVisibles(perfil)"
                :key="habilidad"
                class="perfil-busqueda__habilidad"
              >
                {{ habilidad }}
              </span>
              <span
                v-if="habilidadesExtras(perfil) > 0"
                class="perfil-busqueda__habilidad perfil-busqueda__habilidad--mas"
              >
                +{{ habilidadesExtras(perfil) }}
              </span>
            </div>
          </div>

          <div class="perfil-busqueda__footer">
            <VaButton
              color="primary"
              size="small"
              @click.stop="irAPerfil(perfil)"
            >
              Ver perfil
            </VaButton>
          </div>
        </article>
      </div>

      <div
        v-if="!esTodos && paginacion.totalPaginas > 1"
        class="buscar-perfil__paginacion"
      >
        <VaButton
          preset="secondary"
          size="small"
          icon="mso-chevron_left"
          :disabled="paginacion.primera"
          @click="cambiarPagina(-1)"
        >
          Anterior
        </VaButton>
        <VaButton
          preset="secondary"
          size="small"
          icon-right="mso-chevron_right"
          :disabled="paginacion.ultima"
          @click="cambiarPagina(1)"
        >
          Siguiente
        </VaButton>
      </div>
    </template>
  </div>
</template>

<script>
import perfilService from "../../services/perfilService";
import BaseAlert from "../../components/AlertaBase.vue";

const DEBOUNCE_MS = 350;

export default {
  name: "BuscarPerfilView",
  components: {
    BaseAlert,
  },
  data() {
    return {
      filtros: {
        q: "",
        idProfesion: null,
        tamano: { text: "20 por página", value: 20 },
      },
      opcionesTamano: [
        { text: "20 por página", value: 20 },
        { text: "50 por página", value: 50 },
        { text: "Ver todos", value: 0 },
      ],
      profesiones: [],
      cargandoProfesiones: false,
      perfiles: [],
      paginacion: {
        paginaActual: 0,
        tamanoPagina: 20,
        totalElementos: 0,
        totalPaginas: 0,
        primera: true,
        ultima: true,
      },
      cargando: true,
      mensajeError: "",
      debounceHandle: null,
    };
  },
  computed: {
    esTodos() {
      return this.filtros.tamano?.value === 0;
    },
  },
  async mounted() {
    const q = this.$route.query.q;
    if (typeof q === "string" && q.trim()) {
      this.filtros.q = q.trim();
    }
    await Promise.all([this.cargarProfesiones(), this.buscar()]);
  },
  watch: {
    "$route.query.q"(nuevo) {
      this.filtros.q = typeof nuevo === "string" ? nuevo : "";
      this.buscarAhora();
    },
  },
  methods: {
    inicialDe(valor) {
      return String(valor || "?").charAt(0).toUpperCase();
    },
    ubicacionTexto(perfil) {
      return [perfil?.localidad, perfil?.provincia].filter(Boolean).join(", ");
    },
    habilidadesVisibles(perfil) {
      const lista = Array.isArray(perfil?.habilidades) ? perfil.habilidades : [];
      return lista.slice(0, 4);
    },
    habilidadesExtras(perfil) {
      const lista = Array.isArray(perfil?.habilidades) ? perfil.habilidades : [];
      return Math.max(0, lista.length - 4);
    },
    irAPerfil(perfil) {
      if (perfil?.idPerfil) {
        this.$router.push({ name: "ver-perfil", params: { id: perfil.idPerfil } });
      }
    },
    async cargarProfesiones() {
      this.cargandoProfesiones = true;
      try {
        const response = await perfilService.listarProfesiones();
        const datos = response?.data;
        this.profesiones = Array.isArray(datos) ? datos : datos?.profesiones || [];
      } catch {
        this.profesiones = [];
      } finally {
        this.cargandoProfesiones = false;
      }
    },
    programarBusqueda() {
      clearTimeout(this.debounceHandle);
      this.debounceHandle = setTimeout(() => this.buscar(0), DEBOUNCE_MS);
    },
    buscarAhora() {
      clearTimeout(this.debounceHandle);
      this.buscar(0);
    },
    cambiarPagina(delta) {
      const destino = this.paginacion.paginaActual + delta;
      if (destino < 0 || destino >= this.paginacion.totalPaginas) return;
      this.buscar(destino);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    limpiarFiltros() {
      this.filtros.q = "";
      this.filtros.idProfesion = null;
      this.filtros.tamano = { text: "20 por página", value: 20 };
      this.buscarAhora();
    },
    buildParams(page) {
      const params = {
        page,
        size: this.filtros.tamano?.value ?? 20,
      };

      if (params.size === 0) {
        params.todos = true;
        delete params.size;
        delete params.page;
      }

      // El texto libre se interpreta principalmente como nombre artístico;
      // si no arroja resultados se reintenta como profesión (ver buscar()).
      const texto = this.filtros.q.trim();
      if (texto) {
        params.nombreArtistico = texto;
      }
      if (this.filtros.idProfesion != null) {
        params.idProfesion = this.filtros.idProfesion;
      }
      return params;
    },
    normalizarPagina(data) {
      return {
        paginaActual: data.paginaActual ?? 0,
        tamanoPagina: data.tamanoPagina ?? 20,
        totalElementos: data.totalElementos ?? 0,
        totalPaginas: data.totalPaginas ?? 1,
        primera: data.primera ?? true,
        ultima: data.ultima ?? true,
      };
    },
    async buscar(page = 0) {
      this.cargando = true;
      this.mensajeError = "";

      try {
        const params = this.buildParams(page);
        let response = await perfilService.buscar(params);
        let data = response?.data || {};

        // Sin resultados por nombre artístico y sin filtro de profesión:
        // se reintenta interpretando el texto como nombre de profesión.
        if (
          (data.totalElementos ?? 0) === 0 &&
          params.nombreArtistico &&
          params.idProfesion == null
        ) {
          const alternativo = { ...params, profesion: params.nombreArtistico };
          delete alternativo.nombreArtistico;
          const resAlt = await perfilService.buscar(alternativo);
          const dataAlt = resAlt?.data || {};
          if ((dataAlt.totalElementos ?? 0) > 0) {
            data = dataAlt;
          }
        }

        this.perfiles = Array.isArray(data.contenido) ? data.contenido : [];
        this.paginacion = this.normalizarPagina(data);
      } catch (error) {
        const status = error?.response?.status;
        this.perfiles = [];
        if (status === 401) {
          this.$router.push({
            name: "login",
            query: { redirect: this.$route.fullPath },
          });
        } else if (status === 403) {
          this.mensajeError = "Tu cuenta no se encuentra habilitada para realizar búsquedas.";
        } else {
          this.mensajeError = "Ocurrió un error al buscar perfiles. Inténtalo nuevamente.";
        }
      } finally {
        this.cargando = false;
      }
    },
  },
  beforeUnmount() {
    clearTimeout(this.debounceHandle);
  },
};
</script>

<style scoped>
.buscar-perfil {
  width: 100%;
}

.buscar-perfil__titulo {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 0.25rem;
}

.buscar-perfil__subtitulo {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  margin: 0 0 1.25rem;
}

.buscar-perfil__filtros {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--color-surface);
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  margin-bottom: 1rem;
}

.buscar-perfil__campo {
  min-width: 180px;
}

.buscar-perfil__campo--texto {
  flex: 1;
  min-width: 220px;
}

.buscar-perfil__campo--tamano {
  min-width: 150px;
}

.buscar-perfil__icono-campo {
  font-size: 1.1rem;
  color: var(--color-text-muted);
}

.buscar-perfil__resumen {
  margin: 0 0 0.85rem;
  font-size: 0.82rem;
  color: var(--color-text-muted);
}

.buscar-perfil__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}

.perfil-busqueda {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem 1.25rem 1rem;
  background: var(--color-surface);
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  transition: box-shadow 0.15s, transform 0.15s, border-color 0.15s;
}

.perfil-busqueda:hover {
  box-shadow: 0 8px 20px rgba(35, 33, 52, 0.08);
  transform: translateY(-2px);
  border-color: var(--color-primary-light);
}

.perfil-busqueda:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.perfil-busqueda__foto {
  width: 84px;
  height: 84px;
  border-radius: 50%;
  overflow: hidden;
  background: #edeef4;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.perfil-busqueda__foto img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.perfil-busqueda__inicial {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-secondary);
}

.perfil-busqueda__cuerpo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
}

.perfil-busqueda__nombre {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-text);
}

.perfil-busqueda__profesion {
  font-size: 0.75rem;
}

.perfil-busqueda__nombre-real {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.perfil-busqueda__ubicacion {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.perfil-busqueda__ubicacion .material-symbols-outlined {
  font-size: 1rem;
}

.perfil-busqueda__habilidades {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.35rem;
}

.perfil-busqueda__habilidad {
  background: #f0f0f6;
  border: 1px solid #e5e7eb;
  color: var(--color-text);
  font-size: 0.72rem;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
}

.perfil-busqueda__habilidad--mas {
  background: var(--color-surface);
  color: var(--color-text-muted);
}

.perfil-busqueda__footer {
  margin-top: auto;
  padding-top: 0.5rem;
}

.buscar-perfil__paginacion {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.buscar-perfil__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  text-align: center;
}

.buscar-perfil__estado-icono {
  font-size: 2.5rem;
}
</style>
