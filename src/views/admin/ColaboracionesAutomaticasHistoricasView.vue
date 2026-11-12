<template>
  <div class="colab-historicas">
    <header class="colab-historicas__encabezado">
      <button type="button" class="colab-historicas__volver" @click="volverConfiguracion">
        <span class="material-symbols-outlined" aria-hidden="true">arrow_back</span>
        Volver a configuración
      </button>
      <h1>Colaboraciones automáticas históricas</h1>
      <p>
        Procesá publicaciones e imágenes ya existentes para completar huellas
        faltantes y detectar coincidencias. El procesamiento corre en segundo
        plano y no confirma ni rechaza propuestas automáticamente.
      </p>
    </header>

    <BaseAlert :message="exito" type="success" />
    <BaseAlert :message="errorFormulario" type="error" />

    <div v-if="!puedeConfigurar" class="colab-historicas__estado">
      <span class="material-symbols-outlined colab-historicas__estado-icono">
        lock
      </span>
      No tenés permisos para administrar este procesamiento.
    </div>

    <template v-else>
      <section class="colab-historicas__card">
        <header class="colab-historicas__card-cabecera">
          <div>
            <h2>Nuevo procesamiento</h2>
            <p class="colab-historicas__ayuda">
              Configurá el alcance. La previsualización es opcional y no
              modifica datos.
            </p>
          </div>
          <VaButton
            preset="secondary"
            size="small"
            icon="mso-restart_alt"
            :disabled="ocupado"
            @click="limpiarFormulario"
          >
            Limpiar
          </VaButton>
        </header>

        <div class="colab-historicas__form">
          <VaSelect
            v-model="form.modo"
            class="colab-historicas__campo"
            label="Modo"
            :options="opcionesModo"
            value-by="value"
            text-by="text"
            :disabled="ocupado"
          />

          <VaSelect
            :model-value="form.idPerfil"
            class="colab-historicas__campo"
            label="Perfil"
            placeholder="Buscar por nombre o ID"
            :options="opcionesPerfiles"
            value-by="idPerfil"
            text-by="etiqueta"
            :loading="cargandoPerfiles"
            clearable
            searchable
            :min-search-chars="0"
            no-options-text="Sin perfiles"
            :disabled="ocupado"
            @update:model-value="cambiarPerfil"
            @update:search="programarBusquedaPerfiles"
          />

          <VaSelect
            :model-value="form.idPublicacion"
            class="colab-historicas__campo"
            label="Publicación"
            placeholder="Buscar por título o ID"
            :options="opcionesPublicaciones"
            value-by="idPublicacion"
            text-by="etiqueta"
            :loading="cargandoPublicaciones"
            clearable
            searchable
            :min-search-chars="0"
            no-options-text="Sin publicaciones"
            :disabled="ocupado"
            @update:model-value="cambiarPublicacion"
            @update:search="programarBusquedaPublicaciones"
          />

          <VaInput
            v-model="form.fechaDesde"
            class="colab-historicas__campo"
            label="Desde"
            type="date"
            clearable
            :disabled="ocupado"
          />

          <VaInput
            v-model="form.fechaHasta"
            class="colab-historicas__campo"
            label="Hasta"
            type="date"
            clearable
            :disabled="ocupado"
          />

          <VaInput
            v-model="form.limitePublicaciones"
            class="colab-historicas__campo"
            label="Límite de publicaciones"
            type="number"
            min="1"
            clearable
            placeholder="Todas"
            hint="Opcional. Limita cuántas publicaciones se procesan."
            :disabled="ocupado"
          />

          <VaInput
            v-model.number="form.tamanoLote"
            class="colab-historicas__campo"
            label="Tamaño de lote"
            type="number"
            min="1"
            :disabled="ocupado"
            hint="Por defecto 50 publicaciones por lote."
          />

          <div class="colab-historicas__switch">
            <VaSwitch
              v-model="form.notificar"
              label="Enviar notificaciones"
              :disabled="ocupado"
            />
            <p>
              Por defecto está desactivado para no generar notificaciones
              masivas. Las propuestas igual aparecen en el listado de cada
              perfil.
            </p>
          </div>
        </div>

        <p class="colab-historicas__ayuda">
          {{ ayudaPublicacion }}
        </p>

        <div class="colab-historicas__acciones">
          <VaButton
            icon="mso-search"
            :loading="previsualizando"
            :disabled="procesando"
            @click="previsualizar"
          >
            Previsualizar impacto
          </VaButton>
          <VaButton
            color="primary"
            icon="mso-play_arrow"
            :disabled="previsualizando || procesando"
            :loading="procesando"
            @click="abrirConfirmacionProcesar"
          >
            Procesar publicaciones
          </VaButton>
        </div>

        <section
          v-if="preview"
          class="colab-historicas__preview"
          aria-live="polite"
        >
          <header class="colab-historicas__preview-cabecera">
            <span class="material-symbols-outlined" aria-hidden="true">
              query_stats
            </span>
            <div>
              <h3>Impacto estimado</h3>
              <p>La previsualización no crea propuestas ni modifica datos.</p>
            </div>
          </header>

          <div class="colab-historicas__preview-grid">
            <div class="colab-historicas__preview-item">
              <span>Publicaciones</span>
              <strong>{{ preview.publicaciones }}</strong>
            </div>
            <div class="colab-historicas__preview-item">
              <span>Imágenes</span>
              <strong>{{ preview.imagenes }}</strong>
            </div>
            <div class="colab-historicas__preview-item">
              <span>Sin SHA-256</span>
              <strong>{{ preview.imagenesSinSha256 }}</strong>
            </div>
            <div class="colab-historicas__preview-item">
              <span>Sin pHash</span>
              <strong>{{ preview.imagenesSinPhash }}</strong>
            </div>
            <div class="colab-historicas__preview-item">
              <span>Ilegibles</span>
              <strong>{{ preview.imagenesIlegibles }}</strong>
            </div>
            <div class="colab-historicas__preview-item">
              <span>Pares candidatos estimados</span>
              <strong>{{ preview.paresCandidatosEstimados }}</strong>
            </div>
          </div>
        </section>
      </section>

      <section class="colab-historicas__card">
        <header class="colab-historicas__card-cabecera">
          <div>
            <h2>Procesamientos</h2>
            <p class="colab-historicas__ayuda">
              Historial de jobs. Los contadores se actualizan automáticamente
              mientras hay un procesamiento activo.
            </p>
          </div>
          <VaButton
            preset="secondary"
            size="small"
            icon="mso-refresh"
            :disabled="cargandoLista"
            @click="buscar(paginacion.paginaActual)"
          >
            Actualizar
          </VaButton>
        </header>

        <div class="colab-historicas__filtros-lista">
          <VaSelect
            v-model="filtros.estado"
            class="colab-historicas__campo"
            label="Estado"
            :options="opcionesEstado"
            value-by="value"
            text-by="text"
            @update:modelValue="buscar(0)"
          />
          <VaInput
            v-model="filtros.fechaDesde"
            class="colab-historicas__campo"
            label="Desde"
            type="date"
            clearable
            @update:modelValue="buscar(0)"
          />
          <VaInput
            v-model="filtros.fechaHasta"
            class="colab-historicas__campo"
            label="Hasta"
            type="date"
            clearable
            @update:modelValue="buscar(0)"
          />
          <VaSelect
            v-model="filtros.tamano"
            class="colab-historicas__campo colab-historicas__campo--tamano"
            label="Resultados"
            :options="opcionesTamano"
            value-by="value"
            text-by="text"
            @update:modelValue="buscar(0)"
          />
          <VaButton
            preset="secondary"
            icon="mso-filter_alt_off"
            class="colab-historicas__limpiar-filtros"
            @click="limpiarFiltrosLista"
          >
            Limpiar filtros
          </VaButton>
        </div>

        <BaseAlert v-if="errorFechasLista" :message="errorFechasLista" type="error" />
        <BaseAlert v-if="errorLista" :message="errorLista" type="error" />

        <div v-if="puedeReintentarLista" class="colab-historicas__reintento">
          <VaButton preset="primary" icon="mso-refresh" @click="buscar(paginacion.paginaActual)">
            Reintentar
          </VaButton>
        </div>

        <p v-if="!cargandoLista && !errorLista" class="colab-historicas__resumen">
          {{ paginacion.totalElementos }}
          procesamiento{{ paginacion.totalElementos === 1 ? "" : "s" }}
          <template v-if="paginacion.totalPaginas > 1">
            · Página {{ paginacion.paginaActual + 1 }} de
            {{ paginacion.totalPaginas }}
          </template>
        </p>

        <div v-if="cargandoLista" class="colab-historicas__estado">
          <span class="material-symbols-outlined">hourglass_empty</span>
          Cargando procesamientos...
        </div>

        <div
          v-else-if="!errorLista && !procesamientos.length"
          class="colab-historicas__estado colab-historicas__vacio"
        >
          <span class="material-symbols-outlined">inbox</span>
          {{ hayFiltrosLista ? "No hay procesamientos con esos filtros." : "Todavía no se ejecutó ningún procesamiento." }}
        </div>

        <template v-else-if="!errorLista">
          <div class="colab-historicas__tabla-wrapper">
            <VaDataTable
              :items="procesamientos"
              :columns="columnas"
              striped
              hoverable
              no-pagination
            >
              <template #cell(idProcesamiento)="{ value, rowData }">
                <div class="colab-historicas__job">
                  <strong>#{{ value }}</strong>
                  <span v-if="rowData.idUsuarioAdmin != null">
                    Admin #{{ rowData.idUsuarioAdmin }}
                  </span>
                </div>
              </template>

              <template #cell(estado)="{ value }">
                <VaBadge
                  :text="etiquetaEstadoProcesamiento(value)"
                  :color="colorEstadoProcesamiento(value)"
                  outline
                />
              </template>

              <template #cell(modo)="{ value }">
                {{ etiquetaModoProcesamiento(value) }}
              </template>

              <template #cell(progreso)="{ rowData }">
                <div class="colab-historicas__progreso">
                  <div class="colab-historicas__progreso-fila">
                    <span>
                      Publicaciones
                      {{ rowData.publicacionesProcesadas }}/{{
                        rowData.totalPublicaciones
                      }}
                    </span>
                    <span class="colab-historicas__barra">
                      <span
                        class="colab-historicas__barra-relleno"
                        :style="{
                          width: `${porcentajeProgreso(
                            rowData.publicacionesProcesadas,
                            rowData.totalPublicaciones
                          )}%`,
                        }"
                      />
                    </span>
                  </div>
                  <div class="colab-historicas__progreso-fila">
                    <span>
                      Imágenes
                      {{ rowData.imagenesProcesadas }}/{{ rowData.totalImagenes }}
                    </span>
                    <span class="colab-historicas__barra">
                      <span
                        class="colab-historicas__barra-relleno"
                        :style="{
                          width: `${porcentajeProgreso(
                            rowData.imagenesProcesadas,
                            rowData.totalImagenes
                          )}%`,
                        }"
                      />
                    </span>
                  </div>
                </div>
              </template>

              <template #cell(propuestas)="{ rowData }">
                <div class="colab-historicas__contadores">
                  <span>Creadas: <strong>{{ rowData.propuestasCreadas }}</strong></span>
                  <span>Omitidas: <strong>{{ rowData.propuestasOmitidas }}</strong></span>
                  <span :class="{ 'colab-historicas__contador--error': rowData.errores > 0 }">
                    Errores: <strong>{{ rowData.errores }}</strong>
                  </span>
                </div>
              </template>

              <template #cell(fechas)="{ rowData }">
                <div class="colab-historicas__fechas">
                  <span>Inicio: {{ formatearFecha(rowData.fechaInicio) }}</span>
                  <span>Fin: {{ formatearFecha(rowData.fechaFin) }}</span>
                </div>
              </template>

              <template #cell(acciones)="{ rowData }">
                <div class="colab-historicas__acciones-tabla">
                  <VaButton
                    size="small"
                    preset="primary"
                    icon="mso-visibility"
                    @click="irADetalle(rowData)"
                  >
                    Ver detalle
                  </VaButton>
                  <VaButton
                    v-if="esProcesamientoActivo(rowData.estado)"
                    size="small"
                    preset="secondary"
                    color="danger"
                    icon="mso-cancel"
                    @click="abrirCancelar(rowData)"
                  >
                    Cancelar
                  </VaButton>
                </div>
              </template>
            </VaDataTable>
          </div>

          <PaginacionResultados
            :paginacion="paginacion"
            @cambiar="irAPagina"
          />
        </template>
      </section>
    </template>

    <VaModal
      v-model="modalProcesarVisible"
      hide-default-actions
      blur
      size="small"
      :no-dismiss="procesando"
    >
      <template #header>
        <h3 class="va-h5">Iniciar procesamiento histórico</h3>
      </template>

      <p class="colab-historicas__modal-texto">
        Se creará un job asíncrono. El procesamiento completa huellas
        faltantes y genera propuestas pendientes; no confirma ni rechaza
        propuestas automáticamente.
      </p>

      <dl class="colab-historicas__modal-resumen">
        <div>
          <dt>Modo</dt>
          <dd>{{ etiquetaModoProcesamiento(form.modo) }}</dd>
        </div>
        <div>
          <dt>Perfil</dt>
          <dd>{{ textoPerfilSeleccionado }}</dd>
        </div>
        <div>
          <dt>Publicación</dt>
          <dd>{{ textoPublicacionSeleccionada }}</dd>
        </div>
        <div>
          <dt>Rango de fechas</dt>
          <dd>{{ textoRangoFechas }}</dd>
        </div>
        <div>
          <dt>Límite de publicaciones</dt>
          <dd>{{ form.limitePublicaciones || "Sin límite" }}</dd>
        </div>
        <div>
          <dt>Tamaño de lote</dt>
          <dd>{{ form.tamanoLote }}</dd>
        </div>
        <div>
          <dt>Notificaciones</dt>
          <dd>{{ form.notificar ? "Sí" : "No" }}</dd>
        </div>
      </dl>

      <p v-if="preview" class="colab-historicas__modal-texto">
        La previsualización estimó
        <strong>{{ preview.publicaciones }}</strong> publicaciones,
        <strong>{{ preview.imagenes }}</strong> imágenes y
        <strong>{{ preview.paresCandidatosEstimados }}</strong> pares
        candidatos.
      </p>

      <template #footer>
        <div class="colab-historicas__modal-acciones">
          <VaButton
            preset="secondary"
            :disabled="procesando"
            @click="modalProcesarVisible = false"
          >
            Cancelar
          </VaButton>
          <VaButton
            color="primary"
            :loading="procesando"
            :disabled="procesando"
            @click="confirmarProcesar"
          >
            Iniciar procesamiento
          </VaButton>
        </div>
      </template>
    </VaModal>

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

      <p class="colab-historicas__modal-texto">
        El worker se detendrá entre lotes. Lo ya procesado no se borra y los
        contadores quedan disponibles en el historial.
      </p>

      <p v-if="procesamientoCancelar" class="colab-historicas__modal-texto">
        Procesamiento <strong>#{{ procesamientoCancelar.idProcesamiento }}</strong>
        en estado
        <strong>{{ etiquetaEstadoProcesamiento(procesamientoCancelar.estado) }}</strong>.
      </p>

      <BaseAlert v-if="errorCancelar" :message="errorCancelar" type="error" />

      <template #footer>
        <div class="colab-historicas__modal-acciones">
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
import perfilService from "../../services/perfilService.js";
import publicacionService from "../../services/publicacionService.js";
import { tienePermiso } from "../../services/authState";
import BaseAlert from "../../components/AlertaBase.vue";
import PaginacionResultados from "../../components/busqueda/PaginacionResultados.vue";
import { formatearFecha } from "../../utils/fechas.js";
import { validarRangoFechas } from "../../utils/parametrosPostulaciones.js";
import {
  MODOS_PROCESAMIENTO_HISTORICO,
  OPCIONES_ESTADO_PROCESAMIENTO,
  OPCIONES_MODO_PROCESAMIENTO,
  OPCIONES_TAMANO_PAGINA_PROCESAMIENTOS,
  TAMANO_LOTE_DEFAULT,
  TAMANO_PAGINA_PROCESAMIENTOS_DEFAULT,
  INTERVALO_POLLING_MS,
  colorEstadoProcesamiento,
  construirPayloadPreviewHistorica,
  construirPayloadProcesamientoHistorico,
  esProcesamientoActivo,
  etiquetaEstadoProcesamiento,
  etiquetaModoProcesamiento,
  mensajeErrorProcesamientoHistorico,
  normalizarPaginaProcesamientosHistoricos,
  normalizarPreviewHistorica,
  paginacionProcesamientosInicial,
  porcentajeProgreso,
  validarFiltrosProcesamientoHistorico,
} from "../../utils/colaboracionAutomaticaHistoricaConstants.js";

const DEBOUNCE_BUSQUEDA = 350;

function filtrosListaIniciales() {
  return {
    estado: "",
    fechaDesde: "",
    fechaHasta: "",
    tamano: TAMANO_PAGINA_PROCESAMIENTOS_DEFAULT,
  };
}

function formularioInicial() {
  return {
    modo: MODOS_PROCESAMIENTO_HISTORICO.AMBOS,
    idPerfil: null,
    idPublicacion: null,
    fechaDesde: "",
    fechaHasta: "",
    limitePublicaciones: "",
    tamanoLote: TAMANO_LOTE_DEFAULT,
    notificar: false,
  };
}

export default {
  name: "ColaboracionesAutomaticasHistoricasView",
  components: {
    BaseAlert,
    PaginacionResultados,
  },
  data() {
    return {
      form: formularioInicial(),
      preview: null,
      previsualizando: false,
      procesando: false,
      errorFormulario: "",
      exito: "",
      modalProcesarVisible: false,
      perfiles: [],
      perfilSeleccionado: null,
      busquedaPerfiles: "",
      cargandoPerfiles: false,
      controladorPerfiles: null,
      temporizadorPerfiles: null,
      publicaciones: [],
      publicacionSeleccionada: null,
      busquedaPublicaciones: "",
      cargandoPublicaciones: false,
      controladorPublicaciones: null,
      temporizadorPublicaciones: null,
      filtros: filtrosListaIniciales(),
      procesamientos: [],
      paginacion: paginacionProcesamientosInicial(),
      cargandoLista: true,
      cargandoListaSilencioso: false,
      errorLista: "",
      errorFechasLista: "",
      puedeReintentarLista: false,
      idCargaLista: 0,
      controladorLista: null,
      controladorPreview: null,
      intervaloLista: null,
      modalCancelarVisible: false,
      procesamientoCancelar: null,
      cancelando: false,
      errorCancelar: "",
      opcionesModo: OPCIONES_MODO_PROCESAMIENTO,
      opcionesEstado: OPCIONES_ESTADO_PROCESAMIENTO,
      opcionesTamano: OPCIONES_TAMANO_PAGINA_PROCESAMIENTOS,
      columnas: [
        { key: "idProcesamiento", label: "Job" },
        { key: "estado", label: "Estado" },
        { key: "modo", label: "Modo" },
        { key: "progreso", label: "Progreso" },
        { key: "propuestas", label: "Propuestas" },
        { key: "fechas", label: "Fechas" },
        { key: "acciones", label: "Acciones" },
      ],
    };
  },
  computed: {
    puedeConfigurar() {
      return tienePermiso("ADMINISTRAR_CONFIGURACION");
    },
    ocupado() {
      return this.previsualizando || this.procesando;
    },
    hayProcesamientosActivos() {
      return this.procesamientos.some((procesamiento) =>
        esProcesamientoActivo(procesamiento.estado)
      );
    },
    hayFiltrosLista() {
      return (
        !!this.filtros.estado ||
        !!this.filtros.fechaDesde ||
        !!this.filtros.fechaHasta ||
        Number(this.filtros.tamano) !== TAMANO_PAGINA_PROCESAMIENTOS_DEFAULT
      );
    },
    opcionesPerfiles() {
      const lista = [...this.perfiles];
      const idActual = this.form.idPerfil;

      if (idActual != null && !lista.some((perfil) => String(perfil.idPerfil) === String(idActual))) {
        const seleccionado = this.perfilSeleccionado;
        lista.unshift(
          seleccionado &&
            String(seleccionado.idPerfil) === String(idActual)
            ? seleccionado
            : {
                idPerfil: idActual,
                etiqueta: `Perfil #${idActual}`,
              }
        );
      }

      const busqueda = String(this.busquedaPerfiles || "").trim();
      if (/^\d+$/.test(busqueda)) {
        const idBuscado = Number(busqueda);
        if (
          idBuscado > 0 &&
          !lista.some((perfil) => String(perfil.idPerfil) === String(idBuscado))
        ) {
          lista.unshift({
            idPerfil: idBuscado,
            etiqueta: `Perfil #${idBuscado}`,
          });
        }
      }

      return lista;
    },
    opcionesPublicaciones() {
      const lista = [...this.publicaciones];
      const idActual = this.form.idPublicacion;

      if (idActual != null && !lista.some((publicacion) => String(publicacion.idPublicacion) === String(idActual))) {
        const seleccionada = this.publicacionSeleccionada;
        lista.unshift(
          seleccionada &&
            String(seleccionada.idPublicacion) === String(idActual)
            ? seleccionada
            : {
                idPublicacion: idActual,
                etiqueta: `Publicación #${idActual}`,
              }
        );
      }

      const busqueda = String(this.busquedaPublicaciones || "").trim();
      if (/^\d+$/.test(busqueda)) {
        const idBuscado = Number(busqueda);
        if (
          idBuscado > 0 &&
          !lista.some(
            (publicacion) =>
              String(publicacion.idPublicacion) === String(idBuscado)
          )
        ) {
          lista.unshift({
            idPublicacion: idBuscado,
            etiqueta: `Publicación #${idBuscado}`,
          });
        }
      }

      return lista;
    },
    ayudaPublicacion() {
      if (this.form.idPerfil == null) {
        return "Elegí un perfil para buscar sus publicaciones por título, o escribí un ID numérico para seleccionar una publicación directamente.";
      }
      return "Buscá por título entre las publicaciones del perfil seleccionado, o escribí un ID numérico.";
    },
    textoPerfilSeleccionado() {
      if (this.form.idPerfil == null) return "Todos los perfiles";
      return this.perfilSeleccionado?.etiqueta || `Perfil #${this.form.idPerfil}`;
    },
    textoPublicacionSeleccionada() {
      if (this.form.idPublicacion == null) return "Todas las publicaciones";
      return (
        this.publicacionSeleccionada?.etiqueta ||
        `Publicación #${this.form.idPublicacion}`
      );
    },
    textoRangoFechas() {
      if (!this.form.fechaDesde && !this.form.fechaHasta) {
        return "Sin restricción";
      }
      const desde = this.form.fechaDesde || "sin límite";
      const hasta = this.form.fechaHasta || "sin límite";
      return `${desde} — ${hasta}`;
    },
  },
  watch: {
    form: {
      deep: true,
      handler() {
        // La previsualización y los mensajes corresponden a una configuración
        // concreta; al cambiarla dejan de ser válidos.
        this.preview = null;
        this.errorFormulario = "";
        this.exito = "";
      },
    },
  },
  mounted() {
    if (!this.puedeConfigurar) {
      this.cargandoLista = false;
      return;
    }
    this.buscarPerfiles("");
    this.buscar(0);
    this.iniciarPollingLista();
  },
  beforeUnmount() {
    this.detenerPollingLista();
    clearTimeout(this.temporizadorPerfiles);
    clearTimeout(this.temporizadorPublicaciones);
    this.abortarPerfiles();
    this.abortarPublicaciones();
    this.abortarLista();
    this.abortarPreview();
  },
  methods: {
    formatearFecha,
    etiquetaEstadoProcesamiento,
    colorEstadoProcesamiento,
    etiquetaModoProcesamiento,
    esProcesamientoActivo,
    porcentajeProgreso,
    volverConfiguracion() {
      this.$router.push({ name: "configuracion-sistema" });
    },
    abortarPerfiles() {
      if (this.controladorPerfiles) {
        this.controladorPerfiles.abort();
        this.controladorPerfiles = null;
      }
    },
    abortarPublicaciones() {
      if (this.controladorPublicaciones) {
        this.controladorPublicaciones.abort();
        this.controladorPublicaciones = null;
      }
    },
    abortarLista() {
      if (this.controladorLista) {
        this.controladorLista.abort();
        this.controladorLista = null;
      }
    },
    abortarPreview() {
      if (this.controladorPreview) {
        this.controladorPreview.abort();
        this.controladorPreview = null;
      }
    },
    programarBusquedaPerfiles(texto) {
      this.busquedaPerfiles = String(texto || "");
      clearTimeout(this.temporizadorPerfiles);
      this.temporizadorPerfiles = setTimeout(
        () => this.buscarPerfiles(this.busquedaPerfiles),
        DEBOUNCE_BUSQUEDA
      );
    },
    async buscarPerfiles(texto) {
      this.abortarPerfiles();
      const controller = new AbortController();
      this.controladorPerfiles = controller;
      this.cargandoPerfiles = true;

      try {
        const limpio = String(texto || "").trim();
        const params = { page: 0, size: 20 };
        if (limpio) params.nombreArtistico = limpio;

        const response = await perfilService.buscar(
          params,
          controller.signal
        );
        if (this.controladorPerfiles !== controller) return;

        const data = response?.data;
        const contenido = Array.isArray(data)
          ? data
          : Array.isArray(data?.contenido)
            ? data.contenido
            : [];

        this.perfiles = contenido
          .filter((perfil) => perfil?.idPerfil != null)
          .map((perfil) => ({
            idPerfil: Number(perfil.idPerfil),
            nombreArtistico: perfil.nombreArtistico || "Perfil",
            etiqueta: `${perfil.nombreArtistico || "Perfil"} · #${perfil.idPerfil}`,
          }));
      } catch (error) {
        if (
          this.controladorPerfiles !== controller ||
          error?.code === "ERR_CANCELED" ||
          error?.name === "CanceledError"
        ) {
          return;
        }
        // El selector permite ingresar IDs manualmente si la búsqueda falla.
        this.perfiles = [];
      } finally {
        if (this.controladorPerfiles === controller) {
          this.cargandoPerfiles = false;
          this.controladorPerfiles = null;
        }
      }
    },
    cambiarPerfil(valor) {
      this.form.idPerfil =
        valor == null || valor === "" ? null : Number(valor);
      this.perfilSeleccionado =
        this.opcionesPerfiles.find(
          (perfil) => String(perfil.idPerfil) === String(this.form.idPerfil)
        ) || null;

      this.form.idPublicacion = null;
      this.publicacionSeleccionada = null;
      this.publicaciones = [];
      this.busquedaPublicaciones = "";
      this.cargarPublicaciones("");
    },
    programarBusquedaPublicaciones(texto) {
      this.busquedaPublicaciones = String(texto || "");
      clearTimeout(this.temporizadorPublicaciones);
      this.temporizadorPublicaciones = setTimeout(
        () => this.cargarPublicaciones(this.busquedaPublicaciones),
        DEBOUNCE_BUSQUEDA
      );
    },
    async cargarPublicaciones(texto) {
      this.abortarPublicaciones();
      const idPerfil = this.form.idPerfil;

      if (idPerfil == null) {
        this.publicaciones = [];
        this.cargandoPublicaciones = false;
        return;
      }

      const controller = new AbortController();
      this.controladorPublicaciones = controller;
      this.cargandoPublicaciones = true;

      try {
        const limpio = String(texto || "").trim();
        const params = { page: 0, size: 20 };
        if (limpio) params.titulo = limpio;

        const response = await publicacionService.listarPorPerfil(
          idPerfil,
          params,
          controller.signal
        );
        if (this.controladorPublicaciones !== controller) return;

        const contenido = Array.isArray(response?.data?.contenido)
          ? response.data.contenido
          : [];

        this.publicaciones = contenido
          .filter((publicacion) => publicacion?.idPublicacion != null)
          .map((publicacion) => ({
            idPublicacion: Number(publicacion.idPublicacion),
            titulo: publicacion.titulo || "Publicación",
            etiqueta: `${publicacion.titulo || "Publicación"} · #${publicacion.idPublicacion}`,
          }));
      } catch (error) {
        if (
          this.controladorPublicaciones !== controller ||
          error?.code === "ERR_CANCELED" ||
          error?.name === "CanceledError"
        ) {
          return;
        }
        this.publicaciones = [];
      } finally {
        if (this.controladorPublicaciones === controller) {
          this.cargandoPublicaciones = false;
          this.controladorPublicaciones = null;
        }
      }
    },
    cambiarPublicacion(valor) {
      this.form.idPublicacion =
        valor == null || valor === "" ? null : Number(valor);
      this.publicacionSeleccionada =
        this.opcionesPublicaciones.find(
          (publicacion) =>
            String(publicacion.idPublicacion) ===
            String(this.form.idPublicacion)
        ) || null;
    },
    limpiarFormulario() {
      this.form = formularioInicial();
      this.preview = null;
      this.errorFormulario = "";
      this.exito = "";
      this.perfilSeleccionado = null;
      this.publicacionSeleccionada = null;
      this.publicaciones = [];
      this.busquedaPerfiles = "";
      this.busquedaPublicaciones = "";
      clearTimeout(this.temporizadorPerfiles);
      clearTimeout(this.temporizadorPublicaciones);
      this.buscarPerfiles("");
    },
    async previsualizar() {
      if (this.ocupado) return;

      const error = validarFiltrosProcesamientoHistorico(this.form);
      if (error) {
        this.errorFormulario = error;
        this.preview = null;
        return;
      }

      this.abortarPreview();
      const controller = new AbortController();
      this.controladorPreview = controller;
      this.previsualizando = true;
      this.errorFormulario = "";
      this.exito = "";

      try {
        const response =
          await adminColaboracionAutomaticaHistoricaService.previsualizar(
            construirPayloadPreviewHistorica(this.form),
            controller.signal
          );
        if (this.controladorPreview !== controller) return;

        this.preview = normalizarPreviewHistorica(response?.data);
        this.exito =
          "Previsualización calculada. No se modificaron datos ni se crearon propuestas.";
      } catch (errorPreview) {
        if (
          this.controladorPreview !== controller ||
          errorPreview?.code === "ERR_CANCELED" ||
          errorPreview?.name === "CanceledError"
        ) {
          return;
        }
        this.preview = null;
        this.errorFormulario = mensajeErrorProcesamientoHistorico(
          errorPreview,
          "No se pudo previsualizar el procesamiento."
        );
      } finally {
        if (this.controladorPreview === controller) {
          this.previsualizando = false;
          this.controladorPreview = null;
        }
      }
    },
    abrirConfirmacionProcesar() {
      if (this.ocupado) return;

      const error = validarFiltrosProcesamientoHistorico(this.form);
      if (error) {
        this.errorFormulario = error;
        return;
      }

      this.errorFormulario = "";
      this.modalProcesarVisible = true;
    },
    async confirmarProcesar() {
      if (this.procesando) return;

      this.procesando = true;
      this.errorFormulario = "";
      this.exito = "";

      try {
        const response =
          await adminColaboracionAutomaticaHistoricaService.procesar(
            construirPayloadProcesamientoHistorico(this.form)
          );
        const id = Number(
          response?.data?.idProcesamiento ??
            response?.data?.procesamiento?.idProcesamiento
        );

        this.modalProcesarVisible = false;
        if (Number.isFinite(id) && id > 0) {
          this.$router.push({
            name: "admin-colaboracion-historica",
            params: { id },
          });
          return;
        }

        this.exito = "Procesamiento iniciado correctamente.";
        this.buscar(0);
      } catch (errorProceso) {
        this.modalProcesarVisible = false;
        this.errorFormulario = mensajeErrorProcesamientoHistorico(
          errorProceso,
          "No se pudo iniciar el procesamiento."
        );
        if (errorProceso?.response?.status === 409) {
          this.buscar(0);
        }
      } finally {
        this.procesando = false;
      }
    },
    async buscar(pagina = 0, { silencioso = false } = {}) {
      const corrida = ++this.idCargaLista;
      this.abortarLista();

      const errorFechas = validarRangoFechas(
        this.filtros.fechaDesde,
        this.filtros.fechaHasta
      );
      if (errorFechas) {
        this.cargandoLista = false;
        this.cargandoListaSilencioso = false;
        this.errorFechasLista = errorFechas;
        this.errorLista = "";
        this.puedeReintentarLista = false;
        return;
      }
      this.errorFechasLista = "";

      const controller = new AbortController();
      this.controladorLista = controller;

      if (silencioso) this.cargandoListaSilencioso = true;
      else this.cargandoLista = true;

      if (!silencioso) {
        this.errorLista = "";
        this.puedeReintentarLista = false;
      }

      const params = {
        page: pagina,
        size: Number(this.filtros.tamano) || TAMANO_PAGINA_PROCESAMIENTOS_DEFAULT,
      };
      if (this.filtros.estado) params.estado = this.filtros.estado;
      if (this.filtros.fechaDesde) params.fechaDesde = this.filtros.fechaDesde;
      if (this.filtros.fechaHasta) params.fechaHasta = this.filtros.fechaHasta;

      try {
        const response =
          await adminColaboracionAutomaticaHistoricaService.listar(
            params,
            controller.signal
          );
        if (corrida !== this.idCargaLista) return;

        const data = normalizarPaginaProcesamientosHistoricos(response?.data);
        this.procesamientos = data.contenido;
        this.paginacion = {
          paginaActual: data.paginaActual,
          tamanoPagina: data.tamanoPagina,
          totalElementos: data.totalElementos,
          totalPaginas: data.totalPaginas,
          primera: data.primera,
          ultima: data.ultima,
        };
      } catch (errorLista) {
        if (
          corrida !== this.idCargaLista ||
          errorLista?.code === "ERR_CANCELED" ||
          errorLista?.name === "CanceledError"
        ) {
          return;
        }
        if (!silencioso) this.manejarErrorLista(errorLista);
      } finally {
        if (corrida === this.idCargaLista) {
          if (silencioso) this.cargandoListaSilencioso = false;
          else this.cargandoLista = false;
          this.controladorLista = null;
        }
      }
    },
    manejarErrorLista(error) {
      const status = error?.response?.status;
      this.procesamientos = [];
      this.paginacion = paginacionProcesamientosInicial(
        Number(this.filtros.tamano) || TAMANO_PAGINA_PROCESAMIENTOS_DEFAULT
      );

      if (status === 400) {
        this.errorLista =
          error?.response?.data?.message || "Revisá los filtros ingresados.";
        return;
      }
      if (status === 403) {
        this.errorLista =
          error?.response?.data?.message ||
          "No tenés permisos para ver estos procesamientos.";
        return;
      }
      if (!status || status >= 500) {
        this.puedeReintentarLista = true;
        this.errorLista =
          "No se pudieron cargar los procesamientos. Inténtalo nuevamente.";
        return;
      }
      this.errorLista = mensajeErrorProcesamientoHistorico(
        error,
        "No se pudieron cargar los procesamientos."
      );
    },
    irAPagina(delta) {
      const destino = this.paginacion.paginaActual + delta;
      if (destino < 0 || destino >= this.paginacion.totalPaginas) return;
      this.buscar(destino);
    },
    limpiarFiltrosLista() {
      this.filtros = filtrosListaIniciales();
      this.errorFechasLista = "";
      this.buscar(0);
    },
    iniciarPollingLista() {
      this.detenerPollingLista();
      if (!this.puedeConfigurar) return;
      this.intervaloLista = setInterval(() => {
        if (this.cargandoLista || this.cargandoListaSilencioso) return;
        if (this.errorFechasLista) return;
        if (!this.hayProcesamientosActivos) return;
        this.buscar(this.paginacion.paginaActual, { silencioso: true });
      }, INTERVALO_POLLING_MS);
    },
    detenerPollingLista() {
      if (this.intervaloLista) {
        clearInterval(this.intervaloLista);
        this.intervaloLista = null;
      }
    },
    irADetalle(procesamiento) {
      if (procesamiento?.idProcesamiento == null) return;
      this.$router.push({
        name: "admin-colaboracion-historica",
        params: { id: procesamiento.idProcesamiento },
      });
    },
    abrirCancelar(procesamiento) {
      if (!procesamiento || !esProcesamientoActivo(procesamiento.estado)) {
        return;
      }
      this.procesamientoCancelar = procesamiento;
      this.errorCancelar = "";
      this.modalCancelarVisible = true;
    },
    cerrarCancelar() {
      if (this.cancelando) return;
      this.modalCancelarVisible = false;
      this.procesamientoCancelar = null;
      this.errorCancelar = "";
    },
    async confirmarCancelar() {
      if (this.cancelando || !this.procesamientoCancelar) return;

      this.cancelando = true;
      this.errorCancelar = "";

      try {
        await adminColaboracionAutomaticaHistoricaService.cancelar(
          this.procesamientoCancelar.idProcesamiento
        );
        this.modalCancelarVisible = false;
        this.procesamientoCancelar = null;
        this.exito =
          "Cancelación solicitada. El worker se detendrá entre lotes.";
        this.buscar(this.paginacion.paginaActual);
      } catch (errorCancelacion) {
        this.errorCancelar = mensajeErrorProcesamientoHistorico(
          errorCancelacion,
          "El procesamiento ya no se puede cancelar."
        );
        if (errorCancelacion?.response?.status === 409) {
          this.buscar(this.paginacion.paginaActual);
        }
      } finally {
        this.cancelando = false;
      }
    },
  },
};
</script>

<style scoped>
.colab-historicas {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
}

.colab-historicas__encabezado h1 {
  margin: 0;
  color: var(--color-text);
  font-size: clamp(1.5rem, 2vw, 2rem);
}

.colab-historicas__encabezado p {
  max-width: 900px;
  margin: 0.35rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  line-height: 1.5;
}

.colab-historicas__volver {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin-bottom: 0.7rem;
  padding: 0;
  color: var(--color-primary);
  background: transparent;
  border: 0;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}

.colab-historicas__volver:hover {
  text-decoration: underline;
}

.colab-historicas__volver .material-symbols-outlined {
  font-size: 1rem;
}

.colab-historicas__card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.25rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
}

.colab-historicas__card-cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.colab-historicas__card-cabecera h2 {
  margin: 0;
  color: var(--color-text);
  font-size: 1.05rem;
  font-weight: 700;
}

.colab-historicas__ayuda {
  max-width: 820px;
  margin: 0.25rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.82rem;
  line-height: 1.5;
}

.colab-historicas__form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 0.75rem;
  align-items: start;
}

.colab-historicas__campo--tamano {
  max-width: 180px;
}

.colab-historicas__switch {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding-top: 0.35rem;
}

.colab-historicas__switch p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  line-height: 1.4;
}

.colab-historicas__acciones {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.colab-historicas__preview {
  padding: 1rem;
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border-soft);
  border-radius: 12px;
}

.colab-historicas__preview-cabecera {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
}

.colab-historicas__preview-cabecera .material-symbols-outlined {
  color: var(--color-primary);
}

.colab-historicas__preview-cabecera h3 {
  margin: 0;
  color: var(--color-text);
  font-size: 0.95rem;
}

.colab-historicas__preview-cabecera p {
  margin: 0.15rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.78rem;
}

.colab-historicas__preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.6rem;
  margin-top: 0.85rem;
}

.colab-historicas__preview-item {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.7rem 0.8rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: 8px;
}

.colab-historicas__preview-item span {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}

.colab-historicas__preview-item strong {
  color: var(--color-text);
  font-size: 1.1rem;
}

.colab-historicas__filtros-lista {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.75rem;
  align-items: end;
  padding: 0.9rem;
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border-soft);
  border-radius: 12px;
}

.colab-historicas__limpiar-filtros {
  justify-self: start;
}

.colab-historicas__resumen {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.colab-historicas__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem 1rem;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  text-align: center;
}

.colab-historicas__vacio .material-symbols-outlined {
  font-size: 2rem;
}

.colab-historicas__tabla-wrapper {
  overflow-x: auto;
}

.colab-historicas__job {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.colab-historicas__job span {
  color: var(--color-text-muted);
  font-size: 0.72rem;
}

.colab-historicas__progreso {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 210px;
}

.colab-historicas__progreso-fila {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  color: var(--color-text-muted);
  font-size: 0.72rem;
}

.colab-historicas__barra {
  display: block;
  width: 100%;
  height: 5px;
  background: var(--color-surface-muted);
  border-radius: 999px;
  overflow: hidden;
}

.colab-historicas__barra-relleno {
  display: block;
  height: 100%;
  background: var(--color-primary);
  border-radius: 999px;
  transition: width 0.2s ease;
}

.colab-historicas__contadores {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  color: var(--color-text-muted);
  font-size: 0.72rem;
  white-space: nowrap;
}

.colab-historicas__contadores strong {
  color: var(--color-text);
}

.colab-historicas__contador--error strong {
  color: var(--color-danger-text);
}

.colab-historicas__fechas {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  color: var(--color-text-muted);
  font-size: 0.72rem;
  white-space: nowrap;
}

.colab-historicas__acciones-tabla {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.colab-historicas__reintento {
  display: flex;
  justify-content: center;
}

.colab-historicas__modal-texto {
  margin: 0 0 0.75rem;
  color: var(--color-text);
  font-size: 0.88rem;
  line-height: 1.5;
}

.colab-historicas__modal-resumen {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin: 0 0 0.75rem;
}

.colab-historicas__modal-resumen div {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
}

.colab-historicas__modal-resumen dt {
  color: var(--color-text-muted);
  font-size: 0.78rem;
}

.colab-historicas__modal-resumen dd {
  margin: 0;
  color: var(--color-text);
  font-size: 0.82rem;
  text-align: right;
}

.colab-historicas__modal-acciones {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  width: 100%;
}

@media (max-width: 720px) {
  .colab-historicas__card {
    padding: 1rem;
  }

  .colab-historicas__filtros-lista {
    grid-template-columns: 1fr;
  }

  .colab-historicas__limpiar-filtros {
    justify-self: stretch;
  }
}
</style>
