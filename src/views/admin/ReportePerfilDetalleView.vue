<template>
  <div class="reporte-perfil-detalle">
    <div class="reporte-perfil-detalle__volver">
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
    <BaseAlert v-if="mensajeError && !noEncontrado" :message="mensajeError" type="error" />

    <div v-if="puedeReintentar" class="reporte-perfil-detalle__reintento">
      <VaButton preset="primary" icon="mso-refresh" @click="cargar">
        Reintentar
      </VaButton>
    </div>

    <div v-if="cargando" class="reporte-perfil-detalle__estado">
      <span class="material-symbols-outlined">hourglass_empty</span>
      Cargando reporte...
    </div>

    <div
      v-else-if="noEncontrado"
      class="reporte-perfil-detalle__estado"
    >
      <span class="material-symbols-outlined">search_off</span>
      {{ mensajeError || "El reporte no existe o ya no está disponible." }}
    </div>

    <template v-else-if="reporte">
      <header class="reporte-perfil-detalle__cabecera">
        <div>
          <h1>Reporte #{{ reporte.idReporte }}</h1>
          <p class="reporte-perfil-detalle__fecha">
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

      <section class="reporte-perfil-detalle__panel">
        <h2 class="reporte-perfil-detalle__titulo">Motivo del reporte</h2>
        <p class="reporte-perfil-detalle__motivo">
          {{ reporte.motivoDescripcion || etiquetaMotivo(reporte.motivo) }}
        </p>
        <p class="reporte-perfil-detalle__descripcion">
          {{ reporte.descripcion || "Sin descripción." }}
        </p>
      </section>

      <div class="reporte-perfil-detalle__grid">
        <section class="reporte-perfil-detalle__panel">
          <h2 class="reporte-perfil-detalle__titulo">Perfil reportado</h2>
          <dl class="reporte-perfil-detalle__datos">
            <div>
              <dt>Nombre artístico</dt>
              <dd>{{ reporte.perfilReportado?.nombreArtistico || "—" }}</dd>
            </div>
            <div>
              <dt>Profesión</dt>
              <dd>{{ reporte.perfilReportado?.profesion || "—" }}</dd>
            </div>
            <div>
              <dt>Estado</dt>
              <dd>{{ reporte.perfilReportado?.estado || "—" }}</dd>
            </div>
            <div>
              <dt>ID de perfil</dt>
              <dd>{{ reporte.perfilReportado?.idPerfil ?? "—" }}</dd>
            </div>
          </dl>
          <VaButton
            v-if="idUsuarioReportado != null"
            preset="secondary"
            size="small"
            @click="verUsuario(idUsuarioReportado)"
          >
            Ver usuario reportado
          </VaButton>
        </section>

        <section class="reporte-perfil-detalle__panel">
          <h2 class="reporte-perfil-detalle__titulo">Usuario reportado</h2>
          <dl class="reporte-perfil-detalle__datos">
            <div>
              <dt>Nombre</dt>
              <dd>{{ nombreCompleto(reporte.usuarioReportado) }}</dd>
            </div>
            <div>
              <dt>Correo</dt>
              <dd>{{ reporte.usuarioReportado?.correo || "—" }}</dd>
            </div>
            <div>
              <dt>DNI</dt>
              <dd>{{ reporte.usuarioReportado?.dni || "—" }}</dd>
            </div>
            <div>
              <dt>Estado</dt>
              <dd>{{ reporte.usuarioReportado?.estado || "—" }}</dd>
            </div>
          </dl>
          <VaButton
            v-if="idUsuarioReportado != null"
            preset="secondary"
            size="small"
            @click="verUsuario(idUsuarioReportado)"
          >
            Ver usuario
          </VaButton>
        </section>

        <section class="reporte-perfil-detalle__panel">
          <h2 class="reporte-perfil-detalle__titulo">Autor del reporte</h2>
          <dl class="reporte-perfil-detalle__datos">
            <div>
              <dt>Nombre</dt>
              <dd>{{ nombreCompleto(reporte.autor) }}</dd>
            </div>
            <div>
              <dt>Correo</dt>
              <dd>{{ reporte.autor?.correo || "—" }}</dd>
            </div>
            <div>
              <dt>DNI</dt>
              <dd>{{ reporte.autor?.dni || "—" }}</dd>
            </div>
            <div>
              <dt>Perfil autor</dt>
              <dd>
                {{ reporte.autor?.nombreArtistico || "—" }}
                <template v-if="reporte.autor?.idPerfil != null">
                  (#{{ reporte.autor.idPerfil }})
                </template>
              </dd>
            </div>
          </dl>
          <VaButton
            v-if="idUsuarioAutor != null"
            preset="secondary"
            size="small"
            @click="verUsuario(idUsuarioAutor)"
          >
            Ver autor
          </VaButton>
        </section>

        <section class="reporte-perfil-detalle__panel">
          <h2 class="reporte-perfil-detalle__titulo">Gestión</h2>
          <dl class="reporte-perfil-detalle__datos">
            <div>
              <dt>Administrador revisor</dt>
              <dd>{{ reporte.nombreAdminRevisor || "Sin asignar" }}</dd>
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
        v-if="reporte.estado === ESTADOS_REPORTE_PERFIL.PENDIENTE"
        class="reporte-perfil-detalle__panel reporte-perfil-detalle__acciones"
      >
        <div>
          <h2 class="reporte-perfil-detalle__titulo">Resolver reporte</h2>
          <p class="reporte-perfil-detalle__nota">
            Podés marcar el reporte como resuelto o descartarlo. La acción no
            se puede revertir.
          </p>
        </div>
        <div class="reporte-perfil-detalle__botones">
          <VaButton
            color="success"
            :disabled="cambiandoEstado"
            @click="abrirConfirmacion(ESTADOS_REPORTE_PERFIL.RESUELTO)"
          >
            Marcar como resuelto
          </VaButton>
          <VaButton
            color="danger"
            preset="secondary"
            :disabled="cambiandoEstado"
            @click="abrirConfirmacion(ESTADOS_REPORTE_PERFIL.DESCARTADO)"
          >
            Descartar
          </VaButton>
        </div>
      </section>

      <section v-else class="reporte-perfil-detalle__panel">
        <p class="reporte-perfil-detalle__nota">
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

      <p class="reporte-perfil-detalle__confirmacion">
        {{ mensajeConfirmacion }}
      </p>

      <BaseAlert v-if="errorEstado" :message="errorEstado" type="error" />

      <template #footer>
        <div class="reporte-perfil-detalle__acciones-modal">
          <VaButton
            preset="secondary"
            :disabled="cambiandoEstado"
            @click="cerrarConfirmacion"
          >
            Cancelar
          </VaButton>
          <VaButton
            :color="
              estadoDestino === ESTADOS_REPORTE_PERFIL.RESUELTO
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
  </div>
</template>

<script>
import adminService from "../../services/adminService";
import BaseAlert from "../../components/AlertaBase.vue";
import { mensajeErrorApi } from "../../utils/apiError";
import { formatearFecha } from "../../utils/fechas.js";
import {
  ESTADOS_REPORTE_PERFIL,
  colorEstadoReportePerfil,
  etiquetaEstadoReportePerfil,
  etiquetaMotivoReportePerfil,
} from "../../utils/reportePerfilConstants.js";

export default {
  name: "ReportePerfilDetalleView",
  components: { BaseAlert },
  data() {
    return {
      ESTADOS_REPORTE_PERFIL,
      reporte: null,
      cargando: true,
      noEncontrado: false,
      mensajeError: "",
      mensajeExito: "",
      puedeReintentar: false,
      modalEstadoVisible: false,
      estadoDestino: ESTADOS_REPORTE_PERFIL.RESUELTO,
      cambiandoEstado: false,
      errorEstado: "",
      idCarga: 0,
    };
  },
  computed: {
    idReporte() {
      const id = Number(this.$route.params.id);
      return Number.isInteger(id) && id > 0 ? id : null;
    },
    idUsuarioReportado() {
      return this.reporte?.usuarioReportado?.idUsuario ?? null;
    },
    idUsuarioAutor() {
      return this.reporte?.autor?.idUsuario ?? null;
    },
    tituloConfirmacion() {
      return this.estadoDestino === ESTADOS_REPORTE_PERFIL.RESUELTO
        ? "Marcar reporte como resuelto"
        : "Descartar reporte";
    },
    mensajeConfirmacion() {
      return this.estadoDestino === ESTADOS_REPORTE_PERFIL.RESUELTO
        ? "El reporte quedará marcado como resuelto. Esta acción no se puede revertir."
        : "El reporte quedará descartado. Esta acción no se puede revertir.";
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
    etiquetaEstado: etiquetaEstadoReportePerfil,
    colorEstado: colorEstadoReportePerfil,
    etiquetaMotivo: etiquetaMotivoReportePerfil,
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
        const response = await adminService.obtenerReportePerfil(
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
        const response = await adminService.cambiarEstadoReportePerfil(
          this.reporte.idReporte,
          this.estadoDestino
        );
        this.reporte = response?.data || this.reporte;
        this.modalEstadoVisible = false;
        this.mensajeExito =
          this.estadoDestino === ESTADOS_REPORTE_PERFIL.RESUELTO
            ? "El reporte quedó marcado como resuelto."
            : "El reporte quedó descartado.";
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
    verUsuario(idUsuario) {
      if (idUsuario == null) return;
      this.$router.push({
        name: "gestion-usuarios",
        query: { usuario: idUsuario },
      });
    },
    volver() {
      this.$router.push({ name: "admin-reportes-perfil" });
    },
  },
};
</script>

<style scoped>
.reporte-perfil-detalle {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.reporte-perfil-detalle__volver {
  display: flex;
  justify-content: flex-start;
}

.reporte-perfil-detalle__reintento {
  display: flex;
  justify-content: center;
}

.reporte-perfil-detalle__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2.5rem 1rem;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.reporte-perfil-detalle__cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.reporte-perfil-detalle__cabecera h1 {
  margin: 0;
  color: var(--color-text);
  font-size: 1.45rem;
  font-weight: 800;
}

.reporte-perfil-detalle__fecha {
  margin: 0.25rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.82rem;
}

.reporte-perfil-detalle__panel {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  padding: 1rem 1.1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.reporte-perfil-detalle__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 0.95rem;
  font-weight: 700;
}

.reporte-perfil-detalle__motivo {
  margin: 0;
  color: var(--color-text);
  font-size: 0.9rem;
  font-weight: 600;
}

.reporte-perfil-detalle__descripcion {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  line-height: 1.5;
  white-space: pre-wrap;
}

.reporte-perfil-detalle__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
}

.reporte-perfil-detalle__datos {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin: 0;
}

.reporte-perfil-detalle__datos div {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
}

.reporte-perfil-detalle__datos dt {
  color: var(--color-text-muted);
  font-size: 0.78rem;
}

.reporte-perfil-detalle__datos dd {
  margin: 0;
  color: var(--color-text);
  font-size: 0.82rem;
  text-align: right;
  overflow-wrap: anywhere;
}

.reporte-perfil-detalle__acciones {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.reporte-perfil-detalle__botones {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.reporte-perfil-detalle__nota {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.82rem;
  line-height: 1.45;
}

.reporte-perfil-detalle__confirmacion {
  margin: 0 0 1rem;
  color: var(--color-text);
  font-size: 0.9rem;
  line-height: 1.5;
}

.reporte-perfil-detalle__acciones-modal {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  width: 100%;
}
</style>
