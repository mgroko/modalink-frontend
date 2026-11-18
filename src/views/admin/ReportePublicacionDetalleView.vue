<template>
  <div class="reporte-publicacion-detalle">
    <div class="reporte-publicacion-detalle__volver">
      <VaButton
        preset="secondary"
        size="small"
        icon="mso-arrow_back"
        @click="volver"
      >
        Volver a reportes
      </VaButton>
    </div>

    <BaseAlert v-if="mensajeExito" :message="mensajeExito" type="success" />
    <BaseAlert
      v-if="mensajeError && !noEncontrado"
      :message="mensajeError"
      type="error"
    />

    <div v-if="puedeReintentar" class="reporte-publicacion-detalle__reintento">
      <VaButton preset="primary" icon="mso-refresh" @click="cargar">
        Reintentar
      </VaButton>
    </div>

    <div v-if="cargando" class="reporte-publicacion-detalle__estado">
      <span class="material-symbols-outlined">hourglass_empty</span>
      Cargando reporte...
    </div>

    <div
      v-else-if="noEncontrado"
      class="reporte-publicacion-detalle__estado"
    >
      <span class="material-symbols-outlined">search_off</span>
      {{ mensajeError || "El reporte no existe o ya no está disponible." }}
    </div>

    <template v-else-if="reporte">
      <header class="reporte-publicacion-detalle__cabecera">
        <div>
          <h1>Reporte #{{ reporte.idReporte }}</h1>
          <p class="reporte-publicacion-detalle__fecha">
            {{ formatearFecha(reporte.fechaReporte) }} ·
            {{ etiquetaMotivo(reporte.motivo) }}
          </p>
        </div>
        <VaBadge
          :text="etiquetaEstado(reporte.estado)"
          :color="colorEstado(reporte.estado)"
          outline
        />
      </header>

      <section class="reporte-publicacion-detalle__panel">
        <h2 class="reporte-publicacion-detalle__titulo">Motivo del reporte</h2>
        <p class="reporte-publicacion-detalle__motivo">
          {{ reporte.motivoDescripcion || etiquetaMotivo(reporte.motivo) }}
        </p>
        <p class="reporte-publicacion-detalle__descripcion">
          {{ reporte.descripcion || "Sin descripción." }}
        </p>
      </section>

      <div class="reporte-publicacion-detalle__grid">
        <section class="reporte-publicacion-detalle__panel">
          <h2 class="reporte-publicacion-detalle__titulo">
            Publicación reportada
          </h2>

          <p
            v-if="reporte.publicacionEliminada"
            class="reporte-publicacion-detalle__nota reporte-publicacion-detalle__nota--warning"
          >
            La publicación fue eliminada. El reporte se conserva como
            evidencia.
          </p>

          <template v-else-if="reporte.publicacion">
            <div
              v-if="imagenesPublicacion.length"
              class="reporte-publicacion-detalle__galeria"
            >
              <button
                v-for="(imagen, indice) in imagenesPublicacion"
                :key="imagen.idImagen || indice"
                type="button"
                class="reporte-publicacion-detalle__miniatura"
                :aria-label="`Ampliar imagen ${indice + 1} de la publicación`"
                @click="abrirGaleria(indice)"
              >
                <img
                  :src="resolverFotoUrl(imagen.url)"
                  :alt="`${reporte.publicacion.titulo || 'Publicación'} — imagen ${indice + 1}`"
                />
              </button>
            </div>

            <dl class="reporte-publicacion-detalle__datos">
              <div>
                <dt>Título</dt>
                <dd>{{ reporte.publicacion.titulo || "—" }}</dd>
              </div>
              <div>
                <dt>Descripción</dt>
                <dd>{{ reporte.publicacion.descripcion || "—" }}</dd>
              </div>
              <div>
                <dt>Fecha de publicación</dt>
                <dd>{{ formatearFecha(reporte.publicacion.fechaPublicacion) }}</dd>
              </div>
              <div>
                <dt>Estado</dt>
                <dd>
                  <VaBadge
                    :text="
                      reporte.publicacion.estado === ESTADOS_PUBLICACION.OCULTA
                        ? 'Oculta'
                        : 'Activa'
                    "
                    :color="
                      reporte.publicacion.estado === ESTADOS_PUBLICACION.OCULTA
                        ? 'warning'
                        : 'success'
                    "
                    outline
                  />
                </dd>
              </div>
              <div>
                <dt>Perfil dueño</dt>
                <dd>{{ reporte.publicacion.nombreArtistico || "—" }}</dd>
              </div>
              <div>
                <dt>Usuario dueño</dt>
                <dd>{{ reporte.publicacion.nombreUsuario || "—" }}</dd>
              </div>
              <div>
                <dt>Proyecto</dt>
                <dd>{{ reporte.publicacion.proyecto?.nombre || "—" }}</dd>
              </div>
              <div>
                <dt>Ubicación</dt>
                <dd>{{ ubicacionPublicacion || "—" }}</dd>
              </div>
              <div>
                <dt>Me gusta</dt>
                <dd>{{ reporte.publicacion.cantidadMeGusta ?? 0 }}</dd>
              </div>
              <div>
                <dt>Comentarios</dt>
                <dd>{{ reporte.publicacion.cantidadComentarios ?? 0 }}</dd>
              </div>
              <div>
                <dt>Reportes</dt>
                <dd>
                  {{ reporte.publicacion.cantidadReportes ?? 0 }}
                  <template
                    v-if="reporte.publicacion.cantidadReportesPendientes"
                  >
                    ({{ reporte.publicacion.cantidadReportesPendientes }}
                    pendiente{{
                      reporte.publicacion.cantidadReportesPendientes === 1
                        ? ""
                        : "s"
                    }})
                  </template>
                </dd>
              </div>
            </dl>

            <div
              v-if="colaboradoresPublicacion.length"
              class="reporte-publicacion-detalle__colaboradores"
            >
              <span class="reporte-publicacion-detalle__colaboradores-label">
                Colaboradores:
              </span>
              <VaBadge
                v-for="colaborador in colaboradoresPublicacion"
                :key="colaborador.idPerfil"
                :text="colaborador.nombreArtistico"
                color="info"
                outline
              />
            </div>

            <div class="reporte-publicacion-detalle__moderacion">
              <p class="reporte-publicacion-detalle__nota">
                La moderación es independiente del estado del reporte. Al
                ocultar, la publicación deja de ser visible para todos los
                usuarios.
              </p>
              <div class="reporte-publicacion-detalle__botones">
                <VaButton
                  v-if="puedeOcultarPublicacion"
                  color="danger"
                  icon="mso-visibility_off"
                  :disabled="moderandoPublicacion"
                  @click="abrirModeracion(ESTADOS_PUBLICACION.OCULTA)"
                >
                  Ocultar publicación
                </VaButton>
                <VaButton
                  v-else-if="puedeReactivarPublicacion"
                  color="success"
                  icon="mso-visibility"
                  :disabled="moderandoPublicacion"
                  @click="abrirModeracion(ESTADOS_PUBLICACION.ACTIVA)"
                >
                  Reactivar publicación
                </VaButton>
              </div>
            </div>
          </template>

          <p v-else class="reporte-publicacion-detalle__nota">
            No hay datos de la publicación.
          </p>
        </section>

        <section class="reporte-publicacion-detalle__panel">
          <h2 class="reporte-publicacion-detalle__titulo">
            Autor del reporte
          </h2>
          <dl class="reporte-publicacion-detalle__datos">
            <div>
              <dt>Nombre</dt>
              <dd>{{ nombreCompleto(reporte.autor) }}</dd>
            </div>
            <div>
              <dt>Correo</dt>
              <dd>{{ reporte.autor?.correo || "—" }}</dd>
            </div>
            <div>
              <dt>Perfil artístico</dt>
              <dd>{{ reporte.autor?.nombreArtistico || "—" }}</dd>
            </div>
            <div>
              <dt>ID de perfil</dt>
              <dd>{{ reporte.autor?.idPerfil ?? "—" }}</dd>
            </div>
          </dl>
        </section>

        <section class="reporte-publicacion-detalle__panel">
          <h2 class="reporte-publicacion-detalle__titulo">Gestión</h2>
          <dl class="reporte-publicacion-detalle__datos">
            <div>
              <dt>Administrador revisor</dt>
              <dd>{{ reporte.nombreAdminRevisor || "Sin asignar" }}</dd>
            </div>
            <div v-if="reporte.idAdminRevisor != null">
              <dt>ID administrador</dt>
              <dd>{{ reporte.idAdminRevisor }}</dd>
            </div>
            <div>
              <dt>Fecha de resolución</dt>
              <dd>
                {{
                  reporte.fechaResolucion
                    ? formatearFecha(reporte.fechaResolucion)
                    : "—"
                }}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <section
        v-if="reporte.estado === ESTADOS_REPORTE_PUBLICACION.PENDIENTE"
        class="reporte-publicacion-detalle__panel reporte-publicacion-detalle__acciones"
      >
        <div>
          <h2 class="reporte-publicacion-detalle__titulo">
            Resolver reporte
          </h2>
          <p class="reporte-publicacion-detalle__nota">
            Podés marcar el reporte como resuelto o descartarlo. La acción no
            se puede revertir.
          </p>
        </div>
        <div class="reporte-publicacion-detalle__botones">
          <VaButton
            color="success"
            :disabled="cambiandoEstado"
            @click="abrirConfirmacion(ESTADOS_REPORTE_PUBLICACION.RESUELTO)"
          >
            Marcar como resuelto
          </VaButton>
          <VaButton
            color="danger"
            preset="secondary"
            :disabled="cambiandoEstado"
            @click="abrirConfirmacion(ESTADOS_REPORTE_PUBLICACION.DESCARTADO)"
          >
            Descartar
          </VaButton>
        </div>
      </section>

      <section v-else class="reporte-publicacion-detalle__panel">
        <p class="reporte-publicacion-detalle__nota">
          Este reporte ya fue gestionado y no admite más cambios de estado.
        </p>
      </section>
    </template>

    <VaModal
      v-model="modalEstadoVisible"
      hide-default-actions
      blur
      size="small"
    >
      <template #header>
        <h3 class="va-h5">{{ tituloConfirmacion }}</h3>
      </template>

      <p class="reporte-publicacion-detalle__confirmacion">
        {{ mensajeConfirmacion }}
      </p>

      <BaseAlert v-if="errorEstado" :message="errorEstado" type="error" />

      <template #footer>
        <div class="reporte-publicacion-detalle__acciones-modal">
          <VaButton
            preset="secondary"
            :disabled="cambiandoEstado"
            @click="cerrarConfirmacion"
          >
            Cancelar
          </VaButton>
          <VaButton
            :color="
              estadoDestino === ESTADOS_REPORTE_PUBLICACION.RESUELTO
                ? 'success'
                : 'danger'
            "
            :loading="cambiandoEstado"
            @click="confirmarCambioEstado"
          >
            Confirmar
          </VaButton>
        </div>
      </template>
    </VaModal>

    <GaleriaPublicacionModal
      v-model="galeriaVisible"
      :imagenes="imagenesPublicacion"
      :titulo="reporte?.publicacion?.titulo || 'Publicación'"
      :indice-inicial="indiceGaleria"
    />

    <VaModal
      v-model="modalModeracionVisible"
      hide-default-actions
      blur
      size="small"
    >
      <template #header>
        <h3 class="va-h5">{{ tituloModeracion }}</h3>
      </template>

      <div class="reporte-publicacion-detalle__moderacion-form">
        <p class="reporte-publicacion-detalle__confirmacion">
          {{ mensajeModeracion }}
        </p>

        <VaTextarea
          v-model="motivoModeracion"
          label="Motivo"
          :max-length="200"
          counter
          :rows="3"
          :error="!!errorMotivoModeracion"
          :error-messages="errorMotivoModeracion || undefined"
          placeholder="Explicá brevemente el motivo de la moderación"
        />

        <BaseAlert v-if="errorModeracion" :message="errorModeracion" type="error" />
      </div>

      <template #footer>
        <div class="reporte-publicacion-detalle__acciones-modal">
          <VaButton
            preset="secondary"
            :disabled="moderandoPublicacion"
            @click="cerrarModeracion"
          >
            Cancelar
          </VaButton>
          <VaButton
            :color="
              estadoPublicacionDestino === ESTADOS_PUBLICACION.OCULTA
                ? 'danger'
                : 'success'
            "
            :loading="moderandoPublicacion"
            :disabled="moderandoPublicacion"
            @click="confirmarModeracion"
          >
            {{ estadoPublicacionDestino === ESTADOS_PUBLICACION.OCULTA ? "Ocultar" : "Reactivar" }}
          </VaButton>
        </div>
      </template>
    </VaModal>
  </div>
</template>

<script>
import adminService from "../../services/adminService";
import BaseAlert from "../../components/AlertaBase.vue";
import GaleriaPublicacionModal from "../../components/perfil/GaleriaPublicacionModal.vue";
import { mensajeErrorApi } from "../../utils/apiError";
import { formatearFecha } from "../../utils/fechas.js";
import { resolverFotoUrl } from "../../utils/fotos.js";
import { formatUbicacionPublicacion } from "../../utils/ubicacion.js";
import {
  ESTADOS_PUBLICACION,
  ESTADOS_REPORTE_PUBLICACION,
  colorEstadoReportePublicacion,
  etiquetaEstadoReportePublicacion,
  etiquetaMotivoReportePublicacion,
} from "../../utils/reportePublicacionConstants.js";

export default {
  name: "ReportePublicacionDetalleView",
  components: { BaseAlert, GaleriaPublicacionModal },
  data() {
    return {
      ESTADOS_PUBLICACION,
      ESTADOS_REPORTE_PUBLICACION,
      reporte: null,
      cargando: true,
      noEncontrado: false,
      mensajeError: "",
      mensajeExito: "",
      puedeReintentar: false,
      modalEstadoVisible: false,
      estadoDestino: ESTADOS_REPORTE_PUBLICACION.RESUELTO,
      cambiandoEstado: false,
      errorEstado: "",
      modalModeracionVisible: false,
      estadoPublicacionDestino: ESTADOS_PUBLICACION.OCULTA,
      motivoModeracion: "",
      moderandoPublicacion: false,
      errorModeracion: "",
      errorMotivoModeracion: "",
      galeriaVisible: false,
      indiceGaleria: 0,
      idCarga: 0,
    };
  },
  computed: {
    idReporte() {
      const id = Number(this.$route.params.id);
      return Number.isInteger(id) && id > 0 ? id : null;
    },
    tituloConfirmacion() {
      return this.estadoDestino === ESTADOS_REPORTE_PUBLICACION.RESUELTO
        ? "Marcar reporte como resuelto"
        : "Descartar reporte";
    },
    mensajeConfirmacion() {
      return this.estadoDestino === ESTADOS_REPORTE_PUBLICACION.RESUELTO
        ? "El reporte quedará marcado como resuelto. Esta acción no se puede revertir."
        : "El reporte quedará descartado. Esta acción no se puede revertir.";
    },
    imagenesPublicacion() {
      const imagenes = this.reporte?.publicacion?.imagenes || [];
      // Mismo criterio que la galería para que el índice clickeado coincida.
      return [...imagenes].sort(
        (a, b) => (Number(a.orden) || 0) - (Number(b.orden) || 0)
      );
    },
    colaboradoresPublicacion() {
      return this.reporte?.publicacion?.colaboradores || [];
    },
    ubicacionPublicacion() {
      return formatUbicacionPublicacion(this.reporte?.publicacion?.ubicacion);
    },
    puedeOcultarPublicacion() {
      const publicacion = this.reporte?.publicacion;
      if (!publicacion || this.reporte?.publicacionEliminada) return false;
      if (typeof publicacion.puedeOcultar === "boolean") {
        return publicacion.puedeOcultar;
      }
      return publicacion.estado === ESTADOS_PUBLICACION.ACTIVA;
    },
    puedeReactivarPublicacion() {
      const publicacion = this.reporte?.publicacion;
      if (!publicacion || this.reporte?.publicacionEliminada) return false;
      if (typeof publicacion.puedeReactivar === "boolean") {
        return publicacion.puedeReactivar;
      }
      return publicacion.estado === ESTADOS_PUBLICACION.OCULTA;
    },
    tituloModeracion() {
      return this.estadoPublicacionDestino === ESTADOS_PUBLICACION.OCULTA
        ? "Ocultar publicación"
        : "Reactivar publicación";
    },
    mensajeModeracion() {
      return this.estadoPublicacionDestino === ESTADOS_PUBLICACION.OCULTA
        ? "La publicación dejará de ser visible para todos los usuarios. El dueño recibirá una notificación y solo podrá ver el título y la descripción desde su perfil."
        : "La publicación volverá a ser visible para los usuarios. El dueño recibirá una notificación con un enlace a la publicación.";
    },
  },
  created() {
    this.controlador = null;
  },
  mounted() {
    this.cargar();
  },
  beforeUnmount() {
    if (this.controlador) this.controlador.abort();
  },
  methods: {
    formatearFecha,
    resolverFotoUrl,
    etiquetaEstado: etiquetaEstadoReportePublicacion,
    colorEstado: colorEstadoReportePublicacion,
    etiquetaMotivo: etiquetaMotivoReportePublicacion,
    nombreCompleto(persona) {
      const nombre = [persona?.nombre, persona?.apellido]
        .filter(Boolean)
        .join(" ")
        .trim();
      return nombre || "—";
    },
    async cargar() {
      if (this.idReporte == null) {
        this.cargando = false;
        this.noEncontrado = true;
        return;
      }

      const corrida = ++this.idCarga;
      if (this.controlador) this.controlador.abort();
      this.controlador = new AbortController();

      this.cargando = true;
      this.noEncontrado = false;
      this.mensajeError = "";
      this.mensajeExito = "";
      this.puedeReintentar = false;

      try {
        const response = await adminService.obtenerReportePublicacion(
          this.idReporte,
          this.controlador.signal
        );
        if (corrida !== this.idCarga) return;
        this.reporte = response?.data || null;
        this.noEncontrado = !this.reporte;
      } catch (error) {
        if (
          corrida !== this.idCarga ||
          error?.code === "ERR_CANCELED" ||
          error?.name === "CanceledError"
        ) {
          return;
        }
        this.manejarErrorCarga(error);
      } finally {
        if (corrida === this.idCarga) this.cargando = false;
      }
    },
    manejarErrorCarga(error) {
      const status = error?.response?.status;
      const mensaje = error?.response?.data?.message || "";
      this.reporte = null;

      if (status === 404) {
        this.noEncontrado = true;
        this.mensajeError =
          mensaje || "El reporte no existe o ya no está disponible.";
        return;
      }
      if (status === 403) {
        this.mensajeError =
          mensaje || "No tenés permisos para ver este reporte.";
        return;
      }
      if (!status || status >= 500) {
        this.puedeReintentar = true;
        this.mensajeError =
          "No se pudo cargar el reporte. Inténtalo nuevamente.";
        return;
      }
      this.mensajeError = mensajeErrorApi(
        error,
        "No se pudo cargar el reporte."
      );
    },
    abrirConfirmacion(estado) {
      if (this.cambiandoEstado) return;
      this.estadoDestino = estado;
      this.errorEstado = "";
      this.mensajeError = "";
      this.modalEstadoVisible = true;
    },
    cerrarConfirmacion() {
      if (this.cambiandoEstado) return;
      this.modalEstadoVisible = false;
      this.errorEstado = "";
    },
    async confirmarCambioEstado() {
      if (this.cambiandoEstado || this.reporte?.idReporte == null) return;

      this.cambiandoEstado = true;
      this.errorEstado = "";
      try {
        const response = await adminService.cambiarEstadoReportePublicacion(
          this.reporte.idReporte,
          this.estadoDestino
        );
        this.reporte = response?.data || this.reporte;
        this.modalEstadoVisible = false;
        this.mensajeExito =
          this.estadoDestino === ESTADOS_REPORTE_PUBLICACION.RESUELTO
            ? "El reporte quedó marcado como resuelto."
            : "El reporte quedó descartado.";
        window.dispatchEvent(
          new CustomEvent("reportes-publicacion-actualizados")
        );
      } catch (error) {
        await this.manejarErrorEstado(error);
      } finally {
        this.cambiandoEstado = false;
      }
    },
    async manejarErrorEstado(error) {
      const status = error?.response?.status;
      const mensaje = error?.response?.data?.message || "";

      if (status === 409) {
        this.modalEstadoVisible = false;
        await this.cargar();
        this.mensajeError =
          mensaje || "El reporte ya fue gestionado por otro administrador.";
        return;
      }
      if (status === 404) {
        this.modalEstadoVisible = false;
        this.noEncontrado = true;
        this.mensajeError =
          mensaje || "El reporte no existe o ya no está disponible.";
        return;
      }
      if (status === 403) {
        this.errorEstado =
          mensaje || "No tenés permisos para gestionar este reporte.";
        return;
      }
      if (!status || status >= 500) {
        this.errorEstado =
          "No se pudo cambiar el estado. Inténtalo nuevamente.";
        return;
      }
      this.errorEstado = mensajeErrorApi(
        error,
        "No se pudo cambiar el estado del reporte."
      );
    },
    abrirModeracion(estado) {
      if (this.moderandoPublicacion) return;
      this.estadoPublicacionDestino = estado;
      this.motivoModeracion = "";
      this.errorModeracion = "";
      this.errorMotivoModeracion = "";
      this.modalModeracionVisible = true;
    },
    cerrarModeracion() {
      if (this.moderandoPublicacion) return;
      this.modalModeracionVisible = false;
      this.errorModeracion = "";
      this.errorMotivoModeracion = "";
    },
    validarMotivoModeracion() {
      const motivo = String(this.motivoModeracion || "").trim();
      if (
        this.estadoPublicacionDestino === ESTADOS_PUBLICACION.OCULTA &&
        !motivo
      ) {
        this.errorMotivoModeracion =
          "El motivo es obligatorio al ocultar una publicación.";
        return false;
      }
      if (motivo.length > 200) {
        this.errorMotivoModeracion =
          "El motivo no puede superar los 200 caracteres.";
        return false;
      }
      this.errorMotivoModeracion = "";
      return true;
    },
    async confirmarModeracion() {
      if (
        this.moderandoPublicacion ||
        this.reporte?.publicacion?.idPublicacion == null
      ) {
        return;
      }
      if (!this.validarMotivoModeracion()) return;

      this.moderandoPublicacion = true;
      this.errorModeracion = "";
      try {
        const response = await adminService.moderarPublicacion(
          this.reporte.publicacion.idPublicacion,
          {
            estado: this.estadoPublicacionDestino,
            motivo: this.motivoModeracion,
          }
        );
        this.reporte.publicacion = response?.data || this.reporte.publicacion;
        this.modalModeracionVisible = false;
        this.mensajeExito =
          this.estadoPublicacionDestino === ESTADOS_PUBLICACION.OCULTA
            ? "La publicación quedó oculta."
            : "La publicación quedó reactivada.";
        window.dispatchEvent(
          new CustomEvent("reportes-publicacion-actualizados")
        );
      } catch (error) {
        await this.manejarErrorModeracion(error);
      } finally {
        this.moderandoPublicacion = false;
      }
    },
    async manejarErrorModeracion(error) {
      const status = error?.response?.status;
      const mensaje = error?.response?.data?.message || "";

      if (status === 409) {
        this.modalModeracionVisible = false;
        await this.cargar();
        this.mensajeError =
          mensaje || "La publicación ya fue moderada por otro administrador.";
        return;
      }
      if (status === 404) {
        this.modalModeracionVisible = false;
        await this.cargar();
        this.mensajeError =
          mensaje || "La publicación ya no existe o fue eliminada.";
        return;
      }
      if (status === 403) {
        this.errorModeracion =
          mensaje || "No tenés permisos para moderar esta publicación.";
        return;
      }
      if (!status || status >= 500) {
        this.errorModeracion =
          "No se pudo moderar la publicación. Inténtalo nuevamente.";
        return;
      }
      this.errorModeracion = mensajeErrorApi(
        error,
        "No se pudo moderar la publicación."
      );
    },
    abrirGaleria(indice) {
      this.indiceGaleria = Number(indice) || 0;
      this.galeriaVisible = true;
    },
    volver() {
      this.$router.push({ name: "admin-reportes-publicacion" });
    },
  },
};
</script>

<style scoped>
.reporte-publicacion-detalle {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.reporte-publicacion-detalle__volver {
  display: flex;
  justify-content: flex-start;
}

.reporte-publicacion-detalle__reintento {
  display: flex;
  justify-content: center;
}

.reporte-publicacion-detalle__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2.5rem 1rem;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.reporte-publicacion-detalle__cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.reporte-publicacion-detalle__cabecera h1 {
  margin: 0;
  color: var(--color-text);
  font-size: 1.45rem;
  font-weight: 800;
}

.reporte-publicacion-detalle__fecha {
  margin: 0.25rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.82rem;
}

.reporte-publicacion-detalle__panel {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  padding: 1rem 1.1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.reporte-publicacion-detalle__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 0.95rem;
  font-weight: 700;
}

.reporte-publicacion-detalle__motivo {
  margin: 0;
  color: var(--color-text);
  font-size: 0.9rem;
  font-weight: 600;
}

.reporte-publicacion-detalle__descripcion {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  line-height: 1.5;
  white-space: pre-wrap;
}

.reporte-publicacion-detalle__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
}

.reporte-publicacion-detalle__datos {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin: 0;
}

.reporte-publicacion-detalle__datos div {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
}

.reporte-publicacion-detalle__datos dt {
  color: var(--color-text-muted);
  font-size: 0.78rem;
}

.reporte-publicacion-detalle__datos dd {
  margin: 0;
  color: var(--color-text);
  font-size: 0.82rem;
  text-align: right;
  overflow-wrap: anywhere;
}

.reporte-publicacion-detalle__acciones {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.reporte-publicacion-detalle__botones {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.reporte-publicacion-detalle__nota {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.82rem;
  line-height: 1.45;
}

.reporte-publicacion-detalle__nota--warning {
  color: var(--color-warning-text);
  background: var(--color-warning-soft);
  border: 1px solid var(--color-warning-border);
  border-radius: 8px;
  padding: 0.6rem 0.75rem;
}

.reporte-publicacion-detalle__confirmacion {
  margin: 0 0 1rem;
  color: var(--color-text);
  font-size: 0.9rem;
  line-height: 1.5;
}

.reporte-publicacion-detalle__acciones-modal {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  width: 100%;
}

.reporte-publicacion-detalle__galeria {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.55rem;
}

.reporte-publicacion-detalle__miniatura {
  display: block;
  width: 100%;
  padding: 0;
  overflow: hidden;
  aspect-ratio: 1;
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border);
  border-radius: 9px;
  cursor: zoom-in;
}

.reporte-publicacion-detalle__miniatura:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.reporte-publicacion-detalle__miniatura img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.18s ease;
}

.reporte-publicacion-detalle__miniatura:hover img {
  transform: scale(1.03);
}

.reporte-publicacion-detalle__colaboradores {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.reporte-publicacion-detalle__colaboradores-label {
  color: var(--color-text-muted);
  font-size: 0.78rem;
}

.reporte-publicacion-detalle__moderacion {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border);
}

.reporte-publicacion-detalle__moderacion-form {
  display: grid;
  gap: 0.75rem;
}
</style>
