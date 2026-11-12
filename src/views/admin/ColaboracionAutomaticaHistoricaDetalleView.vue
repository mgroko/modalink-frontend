<template>
  <div class="detalle-historica">
    <button type="button" class="detalle-historica__volver" @click="volver">
      <span class="material-symbols-outlined" aria-hidden="true">arrow_back</span>
      Volver a procesamientos
    </button>

    <BaseAlert :message="exito" type="success" />
    <BaseAlert :message="error" type="error" />

    <div v-if="!puedeConfigurar" class="detalle-historica__estado">
      <span class="material-symbols-outlined detalle-historica__estado-icono">
        lock
      </span>
      No tenés permisos para ver este procesamiento.
    </div>

    <div v-else-if="cargando && !procesamiento" class="detalle-historica__estado">
      <span class="material-symbols-outlined">hourglass_empty</span>
      Cargando procesamiento...
    </div>

    <div v-else-if="!procesamiento" class="detalle-historica__estado">
      <span class="material-symbols-outlined">search_off</span>
      <p>{{ error || "El procesamiento no existe o ya no está disponible." }}</p>
      <VaButton
        v-if="puedeReintentar"
        preset="primary"
        icon="mso-refresh"
        @click="cargar()"
      >
        Reintentar
      </VaButton>
      <VaButton preset="secondary" @click="volver">
        Volver a procesamientos
      </VaButton>
    </div>

    <template v-else>
      <header class="detalle-historica__cabecera">
        <div>
          <p class="detalle-historica__eyebrow">Procesamiento histórico</p>
          <h1>#{{ procesamiento.idProcesamiento }}</h1>
          <p class="detalle-historica__subtitulo">
            {{ etiquetaModoProcesamiento(procesamiento.modo) }} ·
            Creado el {{ formatearFecha(procesamiento.fechaInicio) }}
          </p>
        </div>
        <VaBadge
          :text="etiquetaEstadoProcesamiento(procesamiento.estado)"
          :color="colorEstadoProcesamiento(procesamiento.estado)"
          outline
        />
      </header>

      <section class="detalle-historica__card">
        <header class="detalle-historica__card-cabecera">
          <div>
            <h2>Progreso</h2>
            <p class="detalle-historica__ayuda">
              Los contadores se actualizan automáticamente mientras el job
              está pendiente o en progreso.
            </p>
          </div>
          <div class="detalle-historica__acciones">
            <VaButton
              preset="secondary"
              size="small"
              icon="mso-refresh"
              :loading="cargando || cargandoSilencioso"
              @click="cargar()"
            >
              Actualizar
            </VaButton>
            <VaButton
              v-if="puedeCancelar"
              preset="secondary"
              color="danger"
              size="small"
              icon="mso-cancel"
              @click="abrirCancelar"
            >
              Cancelar procesamiento
            </VaButton>
          </div>
        </header>

        <div class="detalle-historica__progreso-grid">
          <div class="detalle-historica__progreso-bloque">
            <div class="detalle-historica__progreso-datos">
              <span>Publicaciones</span>
              <strong>
                {{ procesamiento.publicacionesProcesadas }} /
                {{ procesamiento.totalPublicaciones }}
              </strong>
            </div>
            <div class="detalle-historica__barra">
              <span
                class="detalle-historica__barra-relleno"
                :style="{
                  width: `${porcentajeProgreso(
                    procesamiento.publicacionesProcesadas,
                    procesamiento.totalPublicaciones
                  )}%`,
                }"
              />
            </div>
          </div>

          <div class="detalle-historica__progreso-bloque">
            <div class="detalle-historica__progreso-datos">
              <span>Imágenes</span>
              <strong>
                {{ procesamiento.imagenesProcesadas }} /
                {{ procesamiento.totalImagenes }}
              </strong>
            </div>
            <div class="detalle-historica__barra">
              <span
                class="detalle-historica__barra-relleno"
                :style="{
                  width: `${porcentajeProgreso(
                    procesamiento.imagenesProcesadas,
                    procesamiento.totalImagenes
                  )}%`,
                }"
              />
            </div>
          </div>
        </div>

        <div class="detalle-historica__contadores">
          <div class="detalle-historica__contador">
            <span>Hashes calculados</span>
            <strong>{{ procesamiento.hashesCalculados }}</strong>
          </div>
          <div class="detalle-historica__contador">
            <span>Propuestas creadas</span>
            <strong>{{ procesamiento.propuestasCreadas }}</strong>
          </div>
          <div class="detalle-historica__contador">
            <span>Propuestas omitidas</span>
            <strong>{{ procesamiento.propuestasOmitidas }}</strong>
          </div>
          <div
            class="detalle-historica__contador"
            :class="{ 'detalle-historica__contador--error': procesamiento.errores > 0 }"
          >
            <span>Errores</span>
            <strong>{{ procesamiento.errores }}</strong>
          </div>
        </div>

        <BaseAlert
          v-if="procesamiento.mensajeError"
          :message="procesamiento.mensajeError"
          type="error"
        />
      </section>

      <section class="detalle-historica__card">
        <h2>Datos del procesamiento</h2>
        <dl class="detalle-historica__datos">
          <div>
            <dt>Modo</dt>
            <dd>{{ etiquetaModoProcesamiento(procesamiento.modo) }}</dd>
          </div>
          <div>
            <dt>Perfil</dt>
            <dd>{{ textoFiltroPerfil }}</dd>
          </div>
          <div>
            <dt>Publicación</dt>
            <dd>{{ textoFiltroPublicacion }}</dd>
          </div>
          <div>
            <dt>Rango de fechas</dt>
            <dd>{{ textoRangoFiltros }}</dd>
          </div>
          <div>
            <dt>Notificaciones</dt>
            <dd>{{ procesamiento.notificar ? "Sí" : "No" }}</dd>
          </div>
          <div>
            <dt>Tamaño de lote</dt>
            <dd>{{ procesamiento.tamanoLote }}</dd>
          </div>
          <div>
            <dt>Límite de publicaciones</dt>
            <dd>{{ procesamiento.limitePublicaciones ?? "Sin límite" }}</dd>
          </div>
          <div>
            <dt>Administrador</dt>
            <dd>
              {{ procesamiento.idUsuarioAdmin != null ? `#${procesamiento.idUsuarioAdmin}` : "—" }}
            </dd>
          </div>
          <div>
            <dt>Inicio</dt>
            <dd>{{ formatearFecha(procesamiento.fechaInicio) }}</dd>
          </div>
          <div>
            <dt>Fin</dt>
            <dd>{{ formatearFecha(procesamiento.fechaFin) }}</dd>
          </div>
          <div>
            <dt>Última publicación procesada</dt>
            <dd>
              {{ procesamiento.ultimoIdPublicacion != null ? `#${procesamiento.ultimoIdPublicacion}` : "—" }}
            </dd>
          </div>
        </dl>
      </section>

      <section class="detalle-historica__card">
        <header class="detalle-historica__card-cabecera">
          <div>
            <h2>Errores del procesamiento</h2>
            <p class="detalle-historica__ayuda">
              Los errores por imagen no abortan el job. Se listan para revisar
              archivos ilegibles o faltantes.
            </p>
          </div>
          <VaButton
            preset="secondary"
            size="small"
            icon="mso-refresh"
            :loading="cargandoErrores"
            :disabled="procesamiento.errores === 0"
            @click="cargarErrores(paginacionErrores.paginaActual)"
          >
            Actualizar errores
          </VaButton>
        </header>

        <p v-if="procesamiento.errores === 0" class="detalle-historica__nota">
          Sin errores registrados.
        </p>

        <template v-else>
          <BaseAlert v-if="errorErrores" :message="errorErrores" type="error" />

          <div v-if="cargandoErrores" class="detalle-historica__estado">
            <span class="material-symbols-outlined">hourglass_empty</span>
            Cargando errores...
          </div>

          <div
            v-else-if="!errorErrores && !errores.length"
            class="detalle-historica__estado"
          >
            <span class="material-symbols-outlined">inbox</span>
            No hay errores para mostrar en esta página.
          </div>

          <template v-else-if="!errorErrores">
            <div class="detalle-historica__tabla-wrapper">
              <VaDataTable
                :items="errores"
                :columns="columnasErrores"
                striped
                hoverable
                no-pagination
              >
                <template #cell(idError)="{ value }">
                  #{{ value }}
                </template>
                <template #cell(idPublicacion)="{ value }">
                  {{ value != null ? `#${value}` : "—" }}
                </template>
                <template #cell(idImagen)="{ value }">
                  {{ value != null ? `#${value}` : "—" }}
                </template>
                <template #cell(nombreArchivo)="{ value }">
                  {{ value || "—" }}
                </template>
                <template #cell(mensaje)="{ value }">
                  <span class="detalle-historica__mensaje-error">{{ value }}</span>
                </template>
                <template #cell(fechaRegistro)="{ value }">
                  {{ formatearFecha(value) }}
                </template>
              </VaDataTable>
            </div>

            <PaginacionResultados
              :paginacion="paginacionErrores"
              @cambiar="irAPaginaErrores"
            />
          </template>
        </template>
      </section>
    </template>

    <VaModal
      v-model="modalCancelarVisible"
      hide-default-actions
      blur
      size="small"
      :no-dismiss="cancelando"
    >
      <template #header>
        <h3 class="va-h5">Cancelar procesamiento</h3>
      </template>

      <p class="detalle-historica__modal-texto">
        El worker se detendrá entre lotes. Lo ya procesado no se borra y los
        contadores quedan disponibles en el historial.
      </p>

      <BaseAlert v-if="errorCancelar" :message="errorCancelar" type="error" />

      <template #footer>
        <div class="detalle-historica__modal-acciones">
          <VaButton
            preset="secondary"
            :disabled="cancelando"
            @click="cerrarCancelar"
          >
            Volver
          </VaButton>
          <VaButton
            color="danger"
            :loading="cancelando"
            :disabled="cancelando"
            @click="confirmarCancelar"
          >
            Cancelar procesamiento
          </VaButton>
        </div>
      </template>
    </VaModal>
  </div>
</template>

<script>
import adminColaboracionAutomaticaHistoricaService from "../../services/adminColaboracionAutomaticaHistoricaService.js";
import { tienePermiso } from "../../services/authState";
import BaseAlert from "../../components/AlertaBase.vue";
import PaginacionResultados from "../../components/busqueda/PaginacionResultados.vue";
import { formatearFecha } from "../../utils/fechas.js";
import {
  INTERVALO_POLLING_MS,
  TAMANO_PAGINA_ERRORES_DEFAULT,
  colorEstadoProcesamiento,
  esProcesamientoActivo,
  etiquetaEstadoProcesamiento,
  etiquetaModoProcesamiento,
  mensajeErrorProcesamientoHistorico,
  normalizarPaginaErroresHistoricos,
  normalizarProcesamientoHistorico,
  paginacionProcesamientosInicial,
  porcentajeProgreso,
} from "../../utils/colaboracionAutomaticaHistoricaConstants.js";

export default {
  name: "ColaboracionAutomaticaHistoricaDetalleView",
  components: {
    BaseAlert,
    PaginacionResultados,
  },
  data() {
    return {
      procesamiento: null,
      cargando: true,
      cargandoSilencioso: false,
      error: "",
      puedeReintentar: false,
      idCarga: 0,
      controlador: null,
      intervalo: null,
      errores: [],
      paginacionErrores: paginacionProcesamientosInicial(
        TAMANO_PAGINA_ERRORES_DEFAULT
      ),
      cargandoErrores: false,
      errorErrores: "",
      controladorErrores: null,
      idCargaErrores: 0,
      erroresConocidos: -1,
      modalCancelarVisible: false,
      cancelando: false,
      errorCancelar: "",
      exito: "",
      columnasErrores: [
        { key: "idError", label: "Error" },
        { key: "idPublicacion", label: "Publicación" },
        { key: "idImagen", label: "Imagen" },
        { key: "nombreArchivo", label: "Archivo" },
        { key: "mensaje", label: "Mensaje" },
        { key: "fechaRegistro", label: "Fecha" },
      ],
    };
  },
  computed: {
    id() {
      const id = Number(this.$route.params.id);
      return Number.isInteger(id) && id > 0 ? id : null;
    },
    puedeConfigurar() {
      return tienePermiso("ADMINISTRAR_CONFIGURACION");
    },
    activo() {
      return esProcesamientoActivo(this.procesamiento?.estado);
    },
    puedeCancelar() {
      return this.activo && !this.cancelando;
    },
    textoFiltroPerfil() {
      return this.procesamiento?.filtroIdPerfil != null
        ? `#${this.procesamiento.filtroIdPerfil}`
        : "Todos los perfiles";
    },
    textoFiltroPublicacion() {
      return this.procesamiento?.filtroIdPublicacion != null
        ? `#${this.procesamiento.filtroIdPublicacion}`
        : "Todas las publicaciones";
    },
    textoRangoFiltros() {
      const desde = this.procesamiento?.filtroFechaDesde;
      const hasta = this.procesamiento?.filtroFechaHasta;
      if (!desde && !hasta) return "Sin restricción";
      return `${formatearFecha(desde)} — ${formatearFecha(hasta)}`;
    },
  },
  watch: {
    "$route.params.id"() {
      this.procesamiento = null;
      this.error = "";
      this.puedeReintentar = false;
      this.errores = [];
      this.paginacionErrores = paginacionProcesamientosInicial(
        TAMANO_PAGINA_ERRORES_DEFAULT
      );
      this.erroresConocidos = -1;
      this.cargar();
      this.iniciarPolling();
    },
  },
  mounted() {
    if (!this.puedeConfigurar) {
      this.cargando = false;
      return;
    }
    this.cargar();
    this.iniciarPolling();
  },
  beforeUnmount() {
    this.detenerPolling();
    this.abortar();
    this.abortarErrores();
  },
  methods: {
    formatearFecha,
    etiquetaEstadoProcesamiento,
    colorEstadoProcesamiento,
    etiquetaModoProcesamiento,
    porcentajeProgreso,
    volver() {
      this.$router.push({ name: "admin-colaboraciones-historicas" });
    },
    abortar() {
      if (this.controlador) {
        this.controlador.abort();
        this.controlador = null;
      }
    },
    abortarErrores() {
      if (this.controladorErrores) {
        this.controladorErrores.abort();
        this.controladorErrores = null;
      }
    },
    async cargar({ silencioso = false } = {}) {
      if (!this.puedeConfigurar) {
        this.cargando = false;
        return;
      }
      if (this.id == null) {
        this.cargando = false;
        this.error = "El procesamiento indicado no es válido.";
        return;
      }

      const corrida = ++this.idCarga;
      this.abortar();
      const controller = new AbortController();
      this.controlador = controller;

      if (silencioso) this.cargandoSilencioso = true;
      else {
        this.cargando = true;
        this.error = "";
        this.puedeReintentar = false;
      }

      try {
        const response =
          await adminColaboracionAutomaticaHistoricaService.obtener(
            this.id,
            controller.signal
          );
        if (corrida !== this.idCarga) return;

        const data = normalizarProcesamientoHistorico(response?.data);
        if (!data) {
          this.procesamiento = null;
          this.error =
            "No se encontró el procesamiento o la respuesta no es válida.";
          this.detenerPolling();
          return;
        }

        this.procesamiento = data;
        this.error = "";
        this.puedeReintentar = false;
        if (!esProcesamientoActivo(data.estado)) {
          this.detenerPolling();
        } else if (!this.intervalo) {
          this.iniciarPolling();
        }

        if (data.errores > 0) {
          const debeRecargar =
            this.erroresConocidos < 0 ||
            data.errores > this.erroresConocidos ||
            !this.errores.length;
          if (debeRecargar && !this.cargandoErrores) {
            this.cargarErrores(0);
          }
        }
      } catch (errorCarga) {
        if (
          corrida !== this.idCarga ||
          errorCarga?.code === "ERR_CANCELED" ||
          errorCarga?.name === "CanceledError"
        ) {
          return;
        }

        const status = errorCarga?.response?.status;
        if (status === 404) {
          this.procesamiento = null;
          this.error =
            errorCarga?.response?.data?.message ||
            "El procesamiento no existe o ya no está disponible.";
          this.detenerPolling();
          return;
        }

        if (!silencioso) {
          this.error = mensajeErrorProcesamientoHistorico(
            errorCarga,
            "No se pudo cargar el procesamiento."
          );
          if (!status || status >= 500) this.puedeReintentar = true;
        }
      } finally {
        if (corrida === this.idCarga) {
          if (silencioso) this.cargandoSilencioso = false;
          else this.cargando = false;
          this.controlador = null;
        }
      }
    },
    async cargarErrores(pagina = 0) {
      if (this.id == null || this.procesamiento?.errores === 0) return;

      const corrida = ++this.idCargaErrores;
      this.abortarErrores();
      const controller = new AbortController();
      this.controladorErrores = controller;
      this.cargandoErrores = true;
      this.errorErrores = "";

      try {
        const response =
          await adminColaboracionAutomaticaHistoricaService.listarErrores(
            this.id,
            {
              page: pagina,
              size: TAMANO_PAGINA_ERRORES_DEFAULT,
            },
            controller.signal
          );
        if (corrida !== this.idCargaErrores) return;

        const data = normalizarPaginaErroresHistoricos(response?.data);
        this.errores = data.contenido;
        this.paginacionErrores = {
          paginaActual: data.paginaActual,
          tamanoPagina: data.tamanoPagina,
          totalElementos: data.totalElementos,
          totalPaginas: data.totalPaginas,
          primera: data.primera,
          ultima: data.ultima,
        };
        this.erroresConocidos = data.totalElementos;
      } catch (errorCarga) {
        if (
          corrida !== this.idCargaErrores ||
          errorCarga?.code === "ERR_CANCELED" ||
          errorCarga?.name === "CanceledError"
        ) {
          return;
        }
        this.errorErrores = mensajeErrorProcesamientoHistorico(
          errorCarga,
          "No se pudieron cargar los errores del procesamiento."
        );
      } finally {
        if (corrida === this.idCargaErrores) {
          this.cargandoErrores = false;
          this.controladorErrores = null;
        }
      }
    },
    irAPaginaErrores(delta) {
      const destino = this.paginacionErrores.paginaActual + delta;
      if (destino < 0 || destino >= this.paginacionErrores.totalPaginas) {
        return;
      }
      this.cargarErrores(destino);
    },
    iniciarPolling() {
      this.detenerPolling();
      if (!this.puedeConfigurar) return;
      this.intervalo = setInterval(() => {
        if (this.cargando || this.cargandoSilencioso) return;
        if (!esProcesamientoActivo(this.procesamiento?.estado)) {
          this.detenerPolling();
          return;
        }
        this.cargar({ silencioso: true });
      }, INTERVALO_POLLING_MS);
    },
    detenerPolling() {
      if (this.intervalo) {
        clearInterval(this.intervalo);
        this.intervalo = null;
      }
    },
    abrirCancelar() {
      if (!this.puedeCancelar) return;
      this.errorCancelar = "";
      this.modalCancelarVisible = true;
    },
    cerrarCancelar() {
      if (this.cancelando) return;
      this.modalCancelarVisible = false;
      this.errorCancelar = "";
    },
    async confirmarCancelar() {
      if (this.cancelando || !this.procesamiento) return;

      this.cancelando = true;
      this.errorCancelar = "";

      try {
        await adminColaboracionAutomaticaHistoricaService.cancelar(
          this.procesamiento.idProcesamiento
        );
        this.modalCancelarVisible = false;
        this.exito =
          "Cancelación solicitada. El worker se detendrá entre lotes.";
        await this.cargar();
      } catch (errorCancelacion) {
        this.errorCancelar = mensajeErrorProcesamientoHistorico(
          errorCancelacion,
          "El procesamiento ya no se puede cancelar."
        );
        if (errorCancelacion?.response?.status === 409) {
          await this.cargar();
        }
      } finally {
        this.cancelando = false;
      }
    },
  },
};
</script>

<style scoped>
.detalle-historica {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.detalle-historica__volver {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  align-self: flex-start;
  padding: 0;
  color: var(--color-primary);
  background: transparent;
  border: 0;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}

.detalle-historica__volver:hover {
  text-decoration: underline;
}

.detalle-historica__volver .material-symbols-outlined {
  font-size: 1rem;
}

.detalle-historica__cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.detalle-historica__eyebrow {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.detalle-historica__cabecera h1 {
  margin: 0.15rem 0 0;
  color: var(--color-text);
  font-size: clamp(1.5rem, 2vw, 2rem);
  font-weight: 800;
}

.detalle-historica__subtitulo {
  margin: 0.25rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.detalle-historica__card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.25rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
}

.detalle-historica__card h2 {
  margin: 0;
  color: var(--color-text);
  font-size: 1.05rem;
  font-weight: 700;
}

.detalle-historica__card-cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.detalle-historica__ayuda {
  max-width: 820px;
  margin: 0.25rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.82rem;
  line-height: 1.5;
}

.detalle-historica__acciones {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.detalle-historica__progreso-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
}

.detalle-historica__progreso-bloque {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.85rem;
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border-soft);
  border-radius: 10px;
}

.detalle-historica__progreso-datos {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  color: var(--color-text-muted);
  font-size: 0.82rem;
}

.detalle-historica__progreso-datos strong {
  color: var(--color-text);
  font-size: 0.9rem;
}

.detalle-historica__barra {
  display: block;
  width: 100%;
  height: 7px;
  background: var(--color-surface-muted);
  border-radius: 999px;
  overflow: hidden;
}

.detalle-historica__barra-relleno {
  display: block;
  height: 100%;
  background: var(--color-primary);
  border-radius: 999px;
  transition: width 0.2s ease;
}

.detalle-historica__contadores {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.6rem;
}

.detalle-historica__contador {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.7rem 0.8rem;
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border-soft);
  border-radius: 8px;
}

.detalle-historica__contador span {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}

.detalle-historica__contador strong {
  color: var(--color-text);
  font-size: 1.1rem;
}

.detalle-historica__contador--error strong {
  color: var(--color-danger-text);
}

.detalle-historica__datos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 0.6rem 1.25rem;
  margin: 0;
}

.detalle-historica__datos div {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  padding-bottom: 0.35rem;
  border-bottom: 1px solid var(--color-border-soft);
}

.detalle-historica__datos dt {
  color: var(--color-text-muted);
  font-size: 0.78rem;
}

.detalle-historica__datos dd {
  margin: 0;
  color: var(--color-text);
  font-size: 0.82rem;
  text-align: right;
  overflow-wrap: anywhere;
}

.detalle-historica__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem 1rem;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  text-align: center;
}

.detalle-historica__estado-icono {
  font-size: 2rem;
}

.detalle-historica__nota {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.detalle-historica__tabla-wrapper {
  overflow-x: auto;
}

.detalle-historica__mensaje-error {
  color: var(--color-danger-text);
  overflow-wrap: anywhere;
}

.detalle-historica__modal-texto {
  margin: 0 0 0.75rem;
  color: var(--color-text);
  font-size: 0.88rem;
  line-height: 1.5;
}

.detalle-historica__modal-acciones {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  width: 100%;
}

@media (max-width: 720px) {
  .detalle-historica__card {
    padding: 1rem;
  }
}
</style>
