<template>
  <VaModal
    :model-value="modelValue"
    hide-default-actions
    size="large"
    max-width="1040px"
    blur
    class="publicacion-admin-detalle"
    @update:model-value="alCambiarVisible"
  >
    <template #header>
      <div class="publicacion-admin-detalle__cabecera">
        <h3 class="va-h5">
          Publicación{{ idPublicacion != null ? ` #${idPublicacion}` : "" }}
        </h3>
        <span class="publicacion-admin-detalle__readonly">Solo lectura</span>
      </div>
    </template>

    <div
      v-if="cargando"
      class="publicacion-admin-detalle__estado"
      role="status"
      aria-live="polite"
    >
      Cargando publicación...
    </div>

    <BaseAlert v-else-if="error" :message="error" type="error" />

    <template v-else-if="publicacion">
      <div v-if="imagenes.length" class="publicacion-admin-detalle__galeria">
        <button
          v-for="(imagen, indice) in imagenes"
          :key="imagen.idImagen || indice"
          type="button"
          class="publicacion-admin-detalle__miniatura"
          :aria-label="`Ampliar imagen ${indice + 1} de la publicación`"
          @click="abrirGaleria(indice)"
        >
          <img
            :src="resolverFotoUrl(imagen.url)"
            :alt="`${publicacion.titulo || 'Publicación'} — imagen ${indice + 1}`"
          />
        </button>
      </div>

      <h4 class="publicacion-admin-detalle__titulo">
        {{ publicacion.titulo || "Sin título" }}
      </h4>

      <div class="publicacion-admin-detalle__meta">
        <VaBadge :text="etiquetaEstado" :color="colorEstado" outline />
        <span>{{ formatearFecha(publicacion.fechaPublicacion) }}</span>
      </div>

      <p class="publicacion-admin-detalle__descripcion">
        {{ publicacion.descripcion || "Sin descripción." }}
      </p>

      <dl class="publicacion-admin-detalle__datos">
        <div>
          <dt>Perfil</dt>
          <dd>{{ publicacion.nombreArtistico || "—" }}</dd>
        </div>
        <div>
          <dt>Usuario</dt>
          <dd>{{ publicacion.nombreUsuario || "—" }}</dd>
        </div>
        <div>
          <dt>Proyecto</dt>
          <dd>{{ publicacion.proyecto?.nombre || "—" }}</dd>
        </div>
        <div>
          <dt>Ubicación</dt>
          <dd>{{ ubicacion || "—" }}</dd>
        </div>
        <div>
          <dt>Me gusta</dt>
          <dd>{{ publicacion.cantidadMeGusta ?? 0 }}</dd>
        </div>
        <div>
          <dt>Comentarios</dt>
          <dd>{{ publicacion.cantidadComentarios ?? 0 }}</dd>
        </div>
        <div>
          <dt>Reportes</dt>
          <dd>
            {{ publicacion.cantidadReportes ?? 0 }}
            <template v-if="publicacion.cantidadReportesPendientes">
              ({{ publicacion.cantidadReportesPendientes }} pendiente{{
                publicacion.cantidadReportesPendientes === 1 ? "" : "s"
              }})
            </template>
          </dd>
        </div>
      </dl>

      <div
        v-if="publicacion.colaboradores?.length"
        class="publicacion-admin-detalle__colaboradores"
      >
        <span class="publicacion-admin-detalle__colaboradores-label">
          Colaboradores:
        </span>
        <VaBadge
          v-for="colaborador in publicacion.colaboradores"
          :key="colaborador.idPerfil"
          :text="colaborador.nombreArtistico || 'Sin nombre'"
          color="info"
          outline
        />
      </div>
    </template>

    <p v-else class="publicacion-admin-detalle__estado">
      No hay datos de la publicación.
    </p>

    <template #footer>
      <div class="publicacion-admin-detalle__acciones">
        <VaButton
          v-if="error"
          preset="secondary"
          icon="mso-refresh"
          :disabled="cargando"
          @click="cargar"
        >
          Reintentar
        </VaButton>
        <VaButton preset="secondary" @click="cerrar">Cerrar</VaButton>
      </div>
    </template>
  </VaModal>

  <GaleriaPublicacionModal
    v-model="galeriaVisible"
    :imagenes="imagenes"
    :titulo="publicacion?.titulo || 'Publicación'"
    :indice-inicial="indiceGaleria"
  />
</template>

<script>
import adminService from "../../services/adminService";
import BaseAlert from "../AlertaBase.vue";
import GaleriaPublicacionModal from "../perfil/GaleriaPublicacionModal.vue";
import { mensajeErrorApi } from "../../utils/apiError";
import { formatearFecha } from "../../utils/fechas";
import { resolverFotoUrl } from "../../utils/fotos";
import { formatUbicacionPublicacion } from "../../utils/ubicacion";

export default {
  name: "PublicacionAdminDetalleModal",
  components: { BaseAlert, GaleriaPublicacionModal },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    idPublicacion: {
      type: [Number, String],
      default: null,
    },
  },
  emits: ["update:modelValue"],
  data() {
    return {
      publicacion: null,
      cargando: false,
      error: "",
      controlador: null,
      galeriaVisible: false,
      indiceGaleria: 0,
    };
  },
  computed: {
    imagenes() {
      const imagenes = this.publicacion?.imagenes || [];
      // Mismo criterio que la galería para que el índice clickeado coincida.
      return [...imagenes].sort(
        (a, b) => (Number(a.orden) || 0) - (Number(b.orden) || 0)
      );
    },
    etiquetaEstado() {
      return this.publicacion?.estado === "OCULTA" ? "Oculta" : "Activa";
    },
    colorEstado() {
      return this.publicacion?.estado === "OCULTA" ? "warning" : "success";
    },
    ubicacion() {
      return formatUbicacionPublicacion(this.publicacion?.ubicacion);
    },
  },
  watch: {
    modelValue(visible) {
      if (visible) {
        this.cargar();
      } else {
        this.abortar();
      }
    },
    idPublicacion() {
      if (this.modelValue) this.cargar();
    },
  },
  mounted() {
    if (this.modelValue) this.cargar();
  },
  beforeUnmount() {
    this.abortar();
  },
  methods: {
    formatearFecha,
    resolverFotoUrl,
    alCambiarVisible(valor) {
      this.$emit("update:modelValue", valor);
      if (!valor) this.abortar();
    },
    cerrar() {
      this.$emit("update:modelValue", false);
      this.abortar();
    },
    abrirGaleria(indice) {
      this.indiceGaleria = Number(indice) || 0;
      this.galeriaVisible = true;
    },
    abortar() {
      if (this.controlador) {
        this.controlador.abort();
        this.controlador = null;
      }
    },
    async cargar() {
      const id = this.idPublicacion;
      if (id == null || id === "") {
        this.publicacion = null;
        this.error = "No se encontró la publicación.";
        this.cargando = false;
        return;
      }

      this.abortar();
      const controller = new AbortController();
      this.controlador = controller;
      this.cargando = true;
      this.error = "";
      this.publicacion = null;

      try {
        const response = await adminService.obtenerPublicacion(
          id,
          controller.signal
        );
        if (this.controlador !== controller) return;

        if (!response?.data) {
          this.error = "La publicación no está disponible.";
          return;
        }

        this.publicacion = response.data;
      } catch (error) {
        if (
          this.controlador !== controller ||
          error?.code === "ERR_CANCELED" ||
          error?.name === "CanceledError"
        ) {
          return;
        }

        this.error = mensajeErrorApi(
          error,
          "No se pudo cargar la publicación."
        );
      } finally {
        if (this.controlador === controller) {
          this.cargando = false;
          this.controlador = null;
        }
      }
    },
  },
};
</script>

<style scoped>
.publicacion-admin-detalle__cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.publicacion-admin-detalle__readonly {
  padding: 0.28rem 0.6rem;
  color: var(--color-text-muted);
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  font-size: 0.75rem;
}
.publicacion-admin-detalle__estado {
  padding: 2rem;
  color: var(--color-text-muted);
  text-align: center;
}
.publicacion-admin-detalle__galeria {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.publicacion-admin-detalle__miniatura {
  padding: 0;
  overflow: hidden;
  aspect-ratio: 1;
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border-soft);
  border-radius: 0.5rem;
  cursor: zoom-in;
}
.publicacion-admin-detalle__miniatura:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
.publicacion-admin-detalle__miniatura img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.publicacion-admin-detalle__titulo {
  margin: 0 0 0.4rem;
  color: var(--color-text);
  font-size: 1.15rem;
}
.publicacion-admin-detalle__meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  color: var(--color-text-muted);
  font-size: 0.82rem;
}
.publicacion-admin-detalle__descripcion {
  margin: 0 0 1rem;
  color: var(--color-text);
  white-space: pre-wrap;
  line-height: 1.55;
}
.publicacion-admin-detalle__datos {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.8rem;
  margin: 0;
}
.publicacion-admin-detalle__datos div {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}
.publicacion-admin-detalle__datos dt {
  color: var(--color-text-muted);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.publicacion-admin-detalle__datos dd {
  margin: 0;
  color: var(--color-text);
  overflow-wrap: anywhere;
}
.publicacion-admin-detalle__colaboradores {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  margin-top: 1rem;
}
.publicacion-admin-detalle__colaboradores-label {
  color: var(--color-text-muted);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.publicacion-admin-detalle__acciones {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
</style>
