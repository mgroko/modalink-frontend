<template>
  <section class="publicaciones-ocultas" aria-label="Publicaciones ocultas">
    <header class="publicaciones-ocultas__cabecera">
      <div>
        <h2 class="publicaciones-ocultas__titulo">Publicaciones ocultas</h2>
        <p class="publicaciones-ocultas__ayuda">
          Solo vos podés ver estas publicaciones. Fueron ocultadas por el
          administrador y la única acción disponible es eliminarlas.
        </p>
      </div>

      <div class="publicaciones-ocultas__buscador">
        <VaInput
          v-model="texto"
          placeholder="Buscar por título o descripción"
          clearable
          aria-label="Buscar publicaciones ocultas"
          @keyup.enter="buscar"
        >
          <template #prependInner>
            <span class="material-symbols-outlined" aria-hidden="true">
              search
            </span>
          </template>
        </VaInput>
        <VaButton preset="secondary" icon="mso-search" @click="buscar">
          Buscar
        </VaButton>
      </div>
    </header>

    <BaseAlert v-if="error" :message="error" type="error" />

    <div v-if="cargando" class="publicaciones-ocultas__estado" role="status">
      <span class="publicaciones-ocultas__spinner" aria-hidden="true"></span>
      Cargando publicaciones ocultas...
    </div>

    <div v-else-if="error" class="publicaciones-ocultas__estado">
      <VaButton preset="secondary" icon="mso-refresh" @click="cargar">
        Reintentar
      </VaButton>
    </div>

    <p v-else-if="!publicaciones.length" class="publicaciones-ocultas__vacio">
      {{ texto.trim() ? "No se encontraron publicaciones ocultas con ese texto." : "No tenés publicaciones ocultas." }}
    </p>

    <ul v-else class="publicaciones-ocultas__lista">
      <li
        v-for="publicacion in publicaciones"
        :key="publicacion.idPublicacion"
        class="publicaciones-ocultas__item"
      >
        <span
          class="material-symbols-outlined publicaciones-ocultas__icono"
          aria-hidden="true"
        >
          error
        </span>

        <div class="publicaciones-ocultas__contenido">
          <h3 class="publicaciones-ocultas__item-titulo">
            {{ publicacion.titulo }}
          </h3>
          <p class="publicaciones-ocultas__descripcion">
            {{ publicacion.descripcion || "Sin descripción." }}
          </p>
          <VaBadge
            :text="LEYENDA_PUBLICACION_OCULTA"
            color="warning"
            outline
          />
        </div>

        <VaButton
          color="danger"
          preset="secondary"
          icon="mso-delete"
          :disabled="eliminando"
          @click="abrirEliminar(publicacion)"
        >
          Eliminar
        </VaButton>
      </li>
    </ul>

    <PaginacionResultados
      v-if="!cargando && publicaciones.length"
      :paginacion="paginacion"
      @cambiar="cambiarPagina"
    />

    <ModalEliminarPublicacion
      v-model="modalEliminarVisible"
      :publicacion="publicacionEliminar"
      :eliminando="eliminando"
      :error="errorEliminar"
      @confirmar="confirmarEliminar"
    />
  </section>
</template>

<script>
import BaseAlert from "../AlertaBase.vue";
import PaginacionResultados from "../busqueda/PaginacionResultados.vue";
import ModalEliminarPublicacion from "./ModalEliminarPublicacion.vue";
import publicacionService from "../../services/publicacionService";
import { mensajeErrorApi } from "../../utils/apiError";
import { LEYENDA_PUBLICACION_OCULTA } from "../../utils/reportePublicacionConstants.js";
import { useToast } from "vuestic-ui";

const TAMANIO_PAGINA = 10;

export default {
  name: "PublicacionesOcultasPanel",
  components: {
    BaseAlert,
    ModalEliminarPublicacion,
    PaginacionResultados,
  },
  setup() {
    return { toast: useToast() };
  },
  data() {
    return {
      LEYENDA_PUBLICACION_OCULTA,
      publicaciones: [],
      texto: "",
      cargando: false,
      error: "",
      controlador: null,
      paginacion: {
        paginaActual: 0,
        totalPaginas: 1,
        totalElementos: 0,
        primera: true,
        ultima: true,
      },
      modalEliminarVisible: false,
      publicacionEliminar: null,
      eliminando: false,
      errorEliminar: "",
    };
  },
  mounted() {
    this.cargar();
  },
  beforeUnmount() {
    if (this.controlador) this.controlador.abort();
  },
  methods: {
    buscar() {
      this.cargar({ pagina: 0 });
    },
    cambiarPagina(delta) {
      this.cargar({
        pagina: Math.max(0, (this.paginacion.paginaActual || 0) + delta),
      });
    },
    async cargar({ pagina = this.paginacion.paginaActual || 0 } = {}) {
      if (this.controlador) this.controlador.abort();
      this.controlador = new AbortController();
      const controller = this.controlador;

      this.cargando = true;
      this.error = "";

      try {
        const response = await publicacionService.listarOcultas(
          {
            texto: this.texto,
            page: pagina,
            size: TAMANIO_PAGINA,
          },
          controller.signal
        );

        if (this.controlador !== controller) return;
        const data = response?.data || {};
        this.publicaciones = data.contenido || [];
        this.paginacion = {
          paginaActual: data.paginaActual ?? pagina,
          totalPaginas: data.totalPaginas ?? 1,
          totalElementos: data.totalElementos ?? this.publicaciones.length,
          primera: data.primera ?? true,
          ultima: data.ultima ?? true,
        };
      } catch (err) {
        if (
          this.controlador !== controller ||
          err?.code === "ERR_CANCELED" ||
          err?.name === "CanceledError"
        ) {
          return;
        }
        this.publicaciones = [];
        this.error = mensajeErrorApi(
          err,
          "No se pudieron cargar las publicaciones ocultas."
        );
      } finally {
        if (this.controlador === controller) {
          this.cargando = false;
          this.controlador = null;
        }
      }
    },
    abrirEliminar(publicacion) {
      if (!publicacion?.idPublicacion || this.eliminando) return;
      this.publicacionEliminar = publicacion;
      this.errorEliminar = "";
      this.modalEliminarVisible = true;
    },
    async confirmarEliminar() {
      const publicacion = this.publicacionEliminar;
      if (!publicacion?.idPublicacion || this.eliminando) return;

      this.eliminando = true;
      this.errorEliminar = "";
      try {
        await publicacionService.eliminar(publicacion.idPublicacion);
        this.modalEliminarVisible = false;
        this.publicaciones = this.publicaciones.filter(
          (item) => item.idPublicacion !== publicacion.idPublicacion
        );
        this.paginacion = {
          ...this.paginacion,
          totalElementos: Math.max(0, (this.paginacion.totalElementos || 1) - 1),
        };
        this.toast.init({
          title: "Publicación eliminada",
          message: "La publicación se eliminó definitivamente.",
          color: "success",
          position: "top-right",
          duration: 5000,
        });

        if (!this.publicaciones.length && this.paginacion.paginaActual > 0) {
          await this.cargar({
            pagina: this.paginacion.paginaActual - 1,
          });
        }
      } catch (err) {
        const status = err?.response?.status;
        if (status === 404) {
          this.modalEliminarVisible = false;
          this.publicaciones = this.publicaciones.filter(
            (item) => item.idPublicacion !== publicacion.idPublicacion
          );
          this.toast.init({
            title: "Publicación no disponible",
            message:
              err?.response?.data?.message ||
              "La publicación ya no existe o ya no está asociada a tu perfil.",
            color: "info",
            position: "top-right",
            duration: 5000,
          });
        } else {
          this.errorEliminar = mensajeErrorApi(
            err,
            "No se pudo eliminar la publicación."
          );
        }
      } finally {
        this.eliminando = false;
      }
    },
  },
};
</script>

<style scoped>
.publicaciones-ocultas {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.publicaciones-ocultas__cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.publicaciones-ocultas__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1rem;
  font-weight: 700;
}

.publicaciones-ocultas__ayuda {
  margin: 0.3rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.82rem;
  line-height: 1.5;
}

.publicaciones-ocultas__buscador {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: min(100%, 360px);
}

.publicaciones-ocultas__estado,
.publicaciones-ocultas__vacio {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem 1rem;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.publicaciones-ocultas__spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: girar 0.8s linear infinite;
}

.publicaciones-ocultas__lista {
  display: grid;
  gap: 0.75rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.publicaciones-ocultas__item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.85rem;
  background: var(--color-surface-soft);
  border: 1px solid var(--color-warning-border);
  border-radius: 10px;
}

.publicaciones-ocultas__icono {
  color: var(--color-warning-text);
  font-size: 1.4rem;
}

.publicaciones-ocultas__contenido {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 0;
}

.publicaciones-ocultas__item-titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 0.9rem;
  font-weight: 700;
}

.publicaciones-ocultas__descripcion {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.82rem;
  line-height: 1.45;
  white-space: pre-wrap;
}

@keyframes girar {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 620px) {
  .publicaciones-ocultas__item {
    flex-direction: column;
  }

  .publicaciones-ocultas__buscador {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
