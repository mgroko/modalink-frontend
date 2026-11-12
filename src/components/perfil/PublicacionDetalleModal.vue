<template>
  <VaModal
    :model-value="modelValue"
    hide-default-actions
    size="auto"
    max-width="1240px"
    no-padding
    blur
    class="detalle-publicacion"
    @update:model-value="alCambiarVisible"
  >
    <div class="detalle-publicacion__panel">
      <div class="detalle-publicacion__galeria">
        <PublicacionGaleriaViewer
          :key="`${idEfectivo}-${indiceInicial}-${aperturaGaleria}`"
          :imagenes="imagenes"
          :titulo="publicacionActual?.titulo || ''"
          :indice-inicial="indiceInicial"
        />
      </div>

      <div class="detalle-publicacion__contenido">
        <header class="detalle-publicacion__cabecera">
          <template v-if="publicacionActual">
            <span class="detalle-publicacion__avatar" aria-hidden="true">
              <img
                v-if="autorFoto"
                :src="autorFoto"
                :alt="autorNombre"
              />
              <template v-else>{{ inicialesAutor }}</template>
            </span>

            <div class="detalle-publicacion__autor">
              <strong>{{ autorNombre }}</strong>
              <span>
                {{ autorProfesion }}
                <template v-if="fechaRelativa"> · {{ fechaRelativa }}</template>
              </span>
            </div>
          </template>

          <div class="detalle-publicacion__acciones-cabecera">
            <button
              v-if="puedeReportar"
              type="button"
              class="detalle-publicacion__reportar"
              aria-label="Reportar publicación"
              title="Reportar publicación"
              @click="abrirReporte"
            >
              <span class="material-symbols-outlined" aria-hidden="true">
                flag
              </span>
            </button>

            <button
              type="button"
              class="detalle-publicacion__cerrar"
              aria-label="Cerrar detalle de publicación"
              title="Cerrar"
              @click="cerrar"
            >
              <span class="material-symbols-outlined" aria-hidden="true">
                close
              </span>
            </button>
          </div>
        </header>

        <div
          v-if="cargando && !publicacionActual"
          class="detalle-publicacion__estado"
          role="status"
          aria-live="polite"
        >
          <span class="material-symbols-outlined" aria-hidden="true">
            hourglass_empty
          </span>
          Cargando publicación...
        </div>

        <div
          v-else-if="error && !publicacionActual"
          class="detalle-publicacion__estado detalle-publicacion__estado--error"
        >
          <p>{{ error }}</p>
          <VaButton preset="secondary" size="small" icon="mso-refresh" @click="abrir">
            Reintentar
          </VaButton>
        </div>

        <div
          v-else-if="publicacionActual"
          class="detalle-publicacion__scroll"
        >
          <section class="detalle-publicacion__info">
            <h2 class="detalle-publicacion__titulo">
              {{ publicacionActual.titulo }}
            </h2>

            <div
              v-if="ubicacionTexto || publicacionActual.proyecto"
              class="detalle-publicacion__meta"
            >
              <span v-if="ubicacionTexto" class="detalle-publicacion__dato">
                <span class="material-symbols-outlined" aria-hidden="true">
                  location_on
                </span>
                {{ ubicacionTexto }}
              </span>

              <button
                v-if="proyectoVisible"
                type="button"
                class="detalle-publicacion__dato detalle-publicacion__dato--accion"
                @click="$emit('ver-proyecto', publicacionActual.proyecto)"
              >
                <span class="material-symbols-outlined" aria-hidden="true">
                  folder
                </span>
                Proyecto: {{ publicacionActual.proyecto.nombre }}
              </button>
              <span
                v-else-if="publicacionActual.proyecto"
                class="detalle-publicacion__dato"
              >
                <span class="material-symbols-outlined" aria-hidden="true">
                  folder
                </span>
                Proyecto: {{ publicacionActual.proyecto.nombre }}
              </span>
            </div>

            <p
              v-if="publicacionActual.descripcion"
              class="detalle-publicacion__descripcion"
            >
              {{ publicacionActual.descripcion }}
            </p>

            <div
              v-if="colaboradores.length"
              class="detalle-publicacion__colaboradores"
            >
              <span
                class="material-symbols-outlined detalle-publicacion__colaboradores-icono"
                aria-hidden="true"
              >
                group
              </span>

              <span
                v-for="colaborador in colaboradoresVisibles"
                :key="colaborador.idPerfil || colaborador.nombreArtistico"
                class="detalle-publicacion__colaborador"
              >
                <span class="detalle-publicacion__colaborador-avatar">
                  <img
                    v-if="colaboradorFoto(colaborador)"
                    :src="colaboradorFoto(colaborador)"
                    :alt="colaboradorNombre(colaborador)"
                  />
                  <template v-else>
                    {{ inicialesColaborador(colaborador) }}
                  </template>
                </span>
                {{ colaboradorNombre(colaborador) }}
              </span>

              <span
                v-if="colaboradoresRestantes > 0"
                class="detalle-publicacion__colaboradores-mas"
              >
                y {{ colaboradoresRestantes }} más
              </span>
            </div>
          </section>

          <div class="detalle-publicacion__interacciones">
            <PublicacionInteracciones
              :publicacion="publicacionActual"
              :mostrar-comentarios="false"
              @no-disponible="alNoDisponible"
              @sin-perfil="alSinPerfil"
              @perfil-inactivo="alPerfilInactivo"
            />

            <button
              type="button"
              class="detalle-publicacion__comentarios-label"
              @click="irAComentarios"
            >
              <span class="material-symbols-outlined" aria-hidden="true">
                chat_bubble
              </span>
              Comentarios · {{ cantidadComentarios }}
            </button>
          </div>

          <PublicacionComentarios
            ref="comentarios"
            :id-publicacion="idEfectivo"
            :publicacion="publicacionActual"
            :enfocar-al-montar="enfocarComentarios"
            @no-disponible="alNoDisponible"
            @sin-perfil="alSinPerfil"
            @perfil-inactivo="alPerfilInactivo"
          />
        </div>
      </div>
    </div>

    <ReportarPublicacionModal
      v-if="puedeReportar"
      v-model="modalReporteVisible"
      :publicacion="publicacionActual"
      @reportado="alReportar"
      @no-disponible="alNoDisponible"
    />
  </VaModal>
</template>

<script>
import publicacionService from "../../services/publicacionService";
import {
  estadoInteraccion,
  marcarNoDisponible,
  sincronizarPublicacion,
} from "../../services/publicacionInteraccionState";
import { resolverFotoUrl } from "../../utils/fotos.js";
import { formatearTiempoRelativo } from "../../utils/fechas.js";
import { formatUbicacionPublicacion } from "../../utils/ubicacion.js";
import { normalizarPublicacion } from "../../utils/publicacionConstants.js";
import {
  clasificarErrorPublicacion,
  mensajeErrorApi,
} from "../../utils/apiError";
import { esAdmin, idPerfilActivo } from "../../services/authState";
import { useToast } from "vuestic-ui";
import PublicacionGaleriaViewer from "./PublicacionGaleriaViewer.vue";
import PublicacionInteracciones from "./PublicacionInteracciones.vue";
import PublicacionComentarios from "./PublicacionComentarios.vue";
import ReportarPublicacionModal from "./ReportarPublicacionModal.vue";

export default {
  name: "PublicacionDetalleModal",
  components: {
    PublicacionGaleriaViewer,
    PublicacionInteracciones,
    PublicacionComentarios,
    ReportarPublicacionModal,
  },
  setup() {
    return { toast: useToast() };
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    publicacion: {
      type: Object,
      default: null,
    },
    idPublicacion: {
      type: [Number, String],
      default: null,
    },
    indiceInicial: {
      type: Number,
      default: 0,
    },
    enfocarComentarios: {
      type: Boolean,
      default: false,
    },
  },
  emits: [
    "update:modelValue",
    "cerrar",
    "ver-proyecto",
    "no-disponible",
    "sin-perfil",
    "perfil-inactivo",
  ],
  data() {
    return {
      publicacionActual: null,
      cargando: false,
      error: "",
      controlador: null,
      modalReporteVisible: false,
      aperturaGaleria: 0,
    };
  },
  computed: {
    idEfectivo() {
      return (
        this.idPublicacion ??
        this.publicacion?.idPublicacion ??
        this.publicacionActual?.idPublicacion ??
        null
      );
    },
    imagenes() {
      return Array.isArray(this.publicacionActual?.imagenes)
        ? this.publicacionActual.imagenes
        : [];
    },
    autorNombre() {
      return (
        this.publicacionActual?.autor?.nombreArtistico ||
        this.publicacionActual?.autor?.nombre ||
        "Perfil"
      );
    },
    autorProfesion() {
      return this.publicacionActual?.autor?.profesion || "Profesional";
    },
    autorFoto() {
      return resolverFotoUrl(this.publicacionActual?.autor?.fotoUrl);
    },
    inicialesAutor() {
      return this.inicialesDe(this.autorNombre);
    },
    fechaRelativa() {
      return formatearTiempoRelativo(
        this.publicacionActual?.fechaPublicacion
      );
    },
    ubicacionTexto() {
      return formatUbicacionPublicacion(this.publicacionActual?.ubicacion);
    },
    proyectoVisible() {
      return this.publicacionActual?.proyecto?.puedeVerProyecto === true;
    },
    colaboradores() {
      return Array.isArray(this.publicacionActual?.colaboradores)
        ? this.publicacionActual.colaboradores
        : [];
    },
    colaboradoresVisibles() {
      return this.colaboradores.slice(0, 4);
    },
    colaboradoresRestantes() {
      return Math.max(0, this.colaboradores.length - 4);
    },
    cantidadComentarios() {
      return estadoInteraccion(
        this.idEfectivo,
        this.publicacionActual
      ).cantidadComentarios;
    },
    idPerfilActivoActual() {
      return idPerfilActivo();
    },
    puedeReportar() {
      if (esAdmin()) return false;
      const idActivo = idPerfilActivo();
      const idAutor = this.publicacionActual?.autor?.idPerfil ?? null;
      const estado = String(
        this.publicacionActual?.estado || ""
      ).toUpperCase();
      return (
        idActivo != null &&
        idAutor != null &&
        String(idActivo) !== String(idAutor) &&
        estado === "ACTIVA"
      );
    },
  },
  watch: {
    modelValue: {
      immediate: true,
      handler(abierto) {
        if (abierto) this.abrir();
        else this.abortar();
      },
    },
    publicacion: {
      handler(publicacion) {
        if (!publicacion) return;
        const normalizada = normalizarPublicacion(publicacion);
        if (!normalizada) return;
        this.publicacionActual = normalizada;
        sincronizarPublicacion(normalizada);
      },
    },
    idEfectivo() {
      if (this.modelValue) this.abrir();
    },
    idPerfilActivoActual() {
      if (this.modelValue) this.abrir();
    },
    enfocarComentarios(activo) {
      if (activo && this.modelValue) this.irAComentarios();
    },
  },
  beforeUnmount() {
    this.abortar();
  },
  methods: {
    abortar() {
      if (this.controlador) {
        this.controlador.abort();
        this.controlador = null;
      }
    },
    abrir() {
      this.aperturaGaleria += 1;
      this.abortar();

      const id = this.idEfectivo;
      if (id == null || id === "") {
        this.publicacionActual = null;
        this.error = "No se encontró la publicación.";
        this.cargando = false;
        return;
      }

      this.error = "";
      if (
        this.publicacionActual &&
        String(this.publicacionActual.idPublicacion) !== String(id)
      ) {
        this.publicacionActual = null;
      }

      if (
        this.publicacion &&
        String(this.publicacion.idPublicacion) === String(id)
      ) {
        const normalizada = normalizarPublicacion(this.publicacion);
        this.publicacionActual = normalizada;
        if (normalizada) sincronizarPublicacion(normalizada);
      } else if (!this.publicacionActual) {
        this.cargando = true;
      }

      this.cargarDetalle(id, Boolean(this.publicacionActual));

      if (this.enfocarComentarios) {
        this.$nextTick(() => this.irAComentarios());
      }
    },
    async cargarDetalle(id, silencioso = false) {
      this.abortar();
      const controller = new AbortController();
      this.controlador = controller;

      if (!silencioso) this.cargando = true;

      try {
        const response = await publicacionService.obtenerDetalle(
          id,
          controller.signal
        );
        if (this.controlador !== controller) return;

        const normalizada = normalizarPublicacion(response?.data);
        if (!normalizada) {
          this.publicacionActual = null;
          this.error = "La publicación no está disponible.";
          return;
        }

        this.publicacionActual = normalizada;
        sincronizarPublicacion(normalizada, true);
        this.error = "";
      } catch (error) {
        if (
          this.controlador !== controller ||
          error?.code === "ERR_CANCELED" ||
          error?.name === "CanceledError"
        ) {
          return;
        }

        const tipo = clasificarErrorPublicacion(error);
        if (tipo === "PUBLICACION_NO_DISPONIBLE") {
          const idPublicacion = this.idEfectivo;
          marcarNoDisponible(idPublicacion);
          this.publicacionActual = null;
          this.error =
            error?.response?.data?.message ||
            "La publicación no existe o no está disponible.";
          this.$emit("no-disponible", { idPublicacion });
          return;
        }
        if (tipo === "SIN_PERFIL") {
          this.publicacionActual = null;
          this.error =
            error?.response?.data?.message ||
            "Seleccioná un perfil para abrir la publicación.";
          this.$emit("sin-perfil", { idPublicacion: this.idEfectivo });
          return;
        }
        if (tipo === "PERFIL_INACTIVO") {
          this.publicacionActual = null;
          this.error =
            error?.response?.data?.message ||
            "El perfil activo no se encuentra disponible.";
          this.$emit("perfil-inactivo", { idPublicacion: this.idEfectivo });
          return;
        }

        if (!silencioso || !this.publicacionActual) {
          this.error = mensajeErrorApi(
            error,
            "No se pudo cargar la publicación."
          );
        }
      } finally {
        if (this.controlador === controller) {
          this.cargando = false;
          this.controlador = null;
        }
      }
    },
    irAComentarios() {
      this.$nextTick(() => {
        const comentarios = this.$refs.comentarios;
        comentarios?.enfocarComposer?.();
        comentarios?.$el?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      });
    },
    alNoDisponible() {
      const idPublicacion = this.idEfectivo;
      marcarNoDisponible(idPublicacion);
      this.error =
        "La publicación no está disponible o ya no podés interactuar con ella.";
      this.publicacionActual = null;
      this.$emit("no-disponible", { idPublicacion });
    },
    alSinPerfil() {
      this.error = "Seleccioná un perfil para abrir la publicación.";
      this.publicacionActual = null;
      this.$emit("sin-perfil", { idPublicacion: this.idEfectivo });
    },
    alPerfilInactivo() {
      this.error = "El perfil activo no se encuentra disponible.";
      this.publicacionActual = null;
      this.$emit("perfil-inactivo", { idPublicacion: this.idEfectivo });
    },
    abrirReporte() {
      if (!this.puedeReportar) return;
      this.modalReporteVisible = true;
    },
    alReportar() {
      this.toast.init({
        title: "Reporte enviado",
        message: "Será revisado por un administrador.",
        color: "success",
        position: "top-right",
        duration: 5000,
      });
    },
    alCambiarVisible(visible) {
      this.$emit("update:modelValue", visible);
      if (!visible) this.$emit("cerrar");
    },
    cerrar() {
      this.$emit("update:modelValue", false);
      this.$emit("cerrar");
    },
    colaboradorNombre(colaborador) {
      return (
        colaborador?.nombreArtistico ||
        colaborador?.nombre ||
        "Colaborador"
      );
    },
    colaboradorFoto(colaborador) {
      return resolverFotoUrl(colaborador?.fotoUrl);
    },
    inicialesColaborador(colaborador) {
      return this.inicialesDe(this.colaboradorNombre(colaborador));
    },
    inicialesDe(nombre) {
      return String(nombre || "?")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((parte) => parte.charAt(0).toUpperCase())
        .join("");
    },
  },
};
</script>

<style scoped>
.detalle-publicacion :deep(.va-modal__dialog) {
  width: min(1240px, 96vw);
  max-width: min(1240px, 96vw);
  max-height: 90vh;
  background: var(--color-surface);
  color: var(--color-text);
  border-radius: 18px;
  overflow: hidden;
}

.detalle-publicacion :deep(.va-modal__content) {
  padding: 0;
}

.detalle-publicacion__panel {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(360px, 0.9fr);
  height: min(820px, 87vh);
  min-height: 0;
  background: var(--color-surface);
}

.detalle-publicacion__galeria {
  display: flex;
  min-width: 0;
  min-height: 0;
  padding: 1rem;
  background: var(--color-surface-soft);
}

.detalle-publicacion__contenido {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  background: var(--color-surface);
  border-left: 1px solid var(--color-border-soft);
}

.detalle-publicacion__cabecera {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  flex: 0 0 auto;
  padding: 1rem 1.1rem 0.85rem;
}

.detalle-publicacion__acciones-cabecera {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-left: auto;
}

.detalle-publicacion__acciones-cabecera :deep(.publicacion-menu) {
  margin-left: 0;
}

.detalle-publicacion__avatar {
  display: grid;
  width: 2.6rem;
  height: 2.6rem;
  flex: 0 0 2.6rem;
  place-items: center;
  overflow: hidden;
  color: var(--color-on-primary);
  background: var(--color-primary);
  border-radius: 50%;
  font-size: 0.7rem;
  font-weight: 700;
}

.detalle-publicacion__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detalle-publicacion__autor {
  display: grid;
  gap: 0.1rem;
  min-width: 0;
}

.detalle-publicacion__autor strong {
  overflow: hidden;
  color: var(--color-text);
  font-size: 0.9rem;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detalle-publicacion__autor span {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}

.detalle-publicacion__cerrar,
.detalle-publicacion__reportar {
  display: grid;
  width: 2.2rem;
  height: 2.2rem;
  margin-left: 0;
  padding: 0;
  place-items: center;
  color: var(--color-text-muted);
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border-soft);
  border-radius: 50%;
  cursor: pointer;
}

.detalle-publicacion__reportar:hover,
.detalle-publicacion__reportar:focus-visible {
  color: var(--color-danger-text);
  border-color: var(--color-danger-border, var(--color-border-soft));
  outline: none;
}

.detalle-publicacion__cerrar:hover,
.detalle-publicacion__cerrar:focus-visible {
  color: var(--color-text);
  border-color: var(--color-primary-light);
  outline: none;
}

.detalle-publicacion__cerrar .material-symbols-outlined,
.detalle-publicacion__reportar .material-symbols-outlined {
  font-size: 1.2rem;
}

.detalle-publicacion__scroll {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  min-height: 0;
  overflow-y: auto;
  padding: 0 1.1rem 1rem;
  scrollbar-width: thin;
}

.detalle-publicacion__info {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.detalle-publicacion__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1.45rem;
  font-weight: 800;
  line-height: 1.2;
}

.detalle-publicacion__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem 0.9rem;
}

.detalle-publicacion__dato {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0;
  color: var(--color-text-muted);
  background: none;
  border: 0;
  font: inherit;
  font-size: 0.78rem;
  text-align: left;
}

.detalle-publicacion__dato .material-symbols-outlined {
  color: var(--color-primary);
  font-size: 1rem;
}

.detalle-publicacion__dato--accion {
  cursor: pointer;
}

.detalle-publicacion__dato--accion:hover,
.detalle-publicacion__dato--accion:focus-visible {
  color: var(--color-primary);
  outline: none;
  text-decoration: underline;
}

.detalle-publicacion__descripcion {
  margin: 0;
  color: var(--color-text);
  font-size: 0.86rem;
  line-height: 1.55;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.detalle-publicacion__colaboradores {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.detalle-publicacion__colaboradores-icono {
  color: var(--color-text-muted);
  font-size: 1rem;
}

.detalle-publicacion__colaborador {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  color: var(--color-text);
  font-size: 0.76rem;
}

.detalle-publicacion__colaborador-avatar {
  display: grid;
  width: 1.45rem;
  height: 1.45rem;
  place-items: center;
  overflow: hidden;
  color: var(--color-on-primary);
  background: var(--color-primary);
  border-radius: 50%;
  font-size: 0.5rem;
  font-weight: 700;
}

.detalle-publicacion__colaborador-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detalle-publicacion__colaboradores-mas {
  color: var(--color-text-muted);
  font-size: 0.72rem;
}

.detalle-publicacion__interacciones {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.55rem 0;
  border-top: 1px solid var(--color-border-soft);
  border-bottom: 1px solid var(--color-border-soft);
}

.detalle-publicacion__comentarios-label {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.35rem;
  color: var(--color-text);
  background: none;
  border: 0;
  border-radius: 6px;
  font: inherit;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
}

.detalle-publicacion__comentarios-label:hover,
.detalle-publicacion__comentarios-label:focus-visible {
  color: var(--color-primary);
  outline: none;
}

.detalle-publicacion__comentarios-label .material-symbols-outlined {
  font-size: 1.05rem;
}

.detalle-publicacion__estado {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  flex: 1;
  gap: 0.5rem;
  padding: 2rem 1rem;
  color: var(--color-text-muted);
  font-size: 0.86rem;
  text-align: center;
}

.detalle-publicacion__estado--error {
  color: var(--color-danger-text);
}

.detalle-publicacion__estado p {
  margin: 0;
}

@media (max-width: 900px) {
  .detalle-publicacion :deep(.va-modal__dialog) {
    width: 100vw;
    max-width: 100vw;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }

  .detalle-publicacion__panel {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(220px, 38vh) minmax(0, 1fr);
    height: 100vh;
  }

  .detalle-publicacion__galeria {
    padding: 0.6rem;
  }

  .detalle-publicacion__contenido {
    border-top: 1px solid var(--color-border-soft);
    border-left: 0;
  }

  .detalle-publicacion__cabecera {
    padding: 0.75rem 0.9rem;
  }

  .detalle-publicacion__scroll {
    padding: 0 0.9rem 0.9rem;
  }
}
</style>
