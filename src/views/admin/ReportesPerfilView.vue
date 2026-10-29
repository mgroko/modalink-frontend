<template>
  <div class="reportes-perfil">
    <section class="reportes-perfil__encabezado">
      <h1>Reportes de perfil</h1>
      <p class="reportes-perfil__subtitulo">
        Revisá y gestioná los reportes enviados por los usuarios.
      </p>
    </section>

    <section class="reportes-perfil__filtros" aria-label="Filtros de reportes">
      <VaSelect
        v-model="filtros.estado"
        class="reportes-perfil__campo"
        label="Estado"
        :options="opcionesEstado"
        value-by="value"
        text-by="text"
        @update:modelValue="buscar(0)"
      />
      <VaSelect
        v-model="filtros.motivo"
        class="reportes-perfil__campo"
        label="Motivo"
        :options="opcionesMotivo"
        value-by="value"
        text-by="text"
        @update:modelValue="buscar(0)"
      />
      <VaInput
        v-model="filtros.fechaDesde"
        class="reportes-perfil__campo"
        label="Desde"
        type="date"
        @update:modelValue="buscar(0)"
      />
      <VaInput
        v-model="filtros.fechaHasta"
        class="reportes-perfil__campo"
        label="Hasta"
        type="date"
        @update:modelValue="buscar(0)"
      />
      <VaSelect
        v-model="filtros.tamano"
        class="reportes-perfil__campo reportes-perfil__campo--tamano"
        label="Resultados"
        :options="opcionesTamano"
        value-by="value"
        text-by="text"
        @update:modelValue="buscar(0)"
      />
      <VaButton
        preset="secondary"
        icon="mso-filter_alt_off"
        class="reportes-perfil__limpiar"
        @click="limpiarFiltros"
      >
        Limpiar filtros
      </VaButton>
    </section>

    <BaseAlert v-if="errorFechas" :message="errorFechas" type="error" />
    <BaseAlert v-if="mensajeError" :message="mensajeError" type="error" />

    <div v-if="puedeReintentar" class="reportes-perfil__reintento">
      <VaButton preset="primary" icon="mso-refresh" @click="reintentar">
        Reintentar
      </VaButton>
    </div>

    <p v-if="!cargando && !mensajeError" class="reportes-perfil__resumen">
      {{ paginacion.totalElementos }} reporte(s)
      <template v-if="!esTodos && paginacion.totalPaginas > 1">
        · Página {{ paginacion.paginaActual + 1 }} de
        {{ paginacion.totalPaginas }}
      </template>
    </p>

    <div v-if="cargando" class="reportes-perfil__estado">
      <span class="material-symbols-outlined">hourglass_empty</span>
      Cargando reportes...
    </div>

    <div
      v-else-if="!mensajeError && reportes.length === 0"
      class="reportes-perfil__estado reportes-perfil__vacio"
    >
      <span class="material-symbols-outlined">inbox</span>
      No hay reportes para los filtros seleccionados.
    </div>

    <template v-else-if="!mensajeError">
      <VaDataTable
        class="reportes-perfil__tabla"
        :items="reportes"
        :columns="columnas"
        striped
        hoverable
        no-pagination
      >
        <template #cell(fechaReporte)="{ value }">
          {{ formatearFecha(value) }}
        </template>

        <template #cell(motivoDescripcion)="{ rowData }">
          {{ textoMotivo(rowData) }}
        </template>

        <template #cell(nombrePerfilReportado)="{ rowData }">
          {{ textoPerfilReportado(rowData) }}
        </template>

        <template #cell(autor)="{ rowData }">
          {{ textoAutor(rowData) }}
        </template>

        <template #cell(estado)="{ value }">
          <VaBadge
            :text="etiquetaEstadoReportePerfil(value)"
            :color="colorEstadoReportePerfil(value)"
            outline
          />
        </template>

        <template #cell(acciones)="{ rowData }">
          <VaButton
            size="small"
            preset="primary"
            icon="mso-visibility"
            @click="verDetalle(rowData)"
          >
            Ver detalle
          </VaButton>
        </template>
      </VaDataTable>

      <div
        v-if="!esTodos && paginacion.totalPaginas > 1"
        class="reportes-perfil__paginacion"
      >
        <VaButton
          preset="secondary"
          size="small"
          icon="mso-chevron_left"
          :disabled="paginacion.primera"
          @click="irAPagina(-1)"
        >
          Anterior
        </VaButton>
        <span class="reportes-perfil__pagina">
          Página {{ paginacion.paginaActual + 1 }} de
          {{ paginacion.totalPaginas }}
        </span>
        <VaButton
          preset="secondary"
          size="small"
          icon="mso-chevron_right"
          :disabled="paginacion.ultima"
          @click="irAPagina(1)"
        >
          Siguiente
        </VaButton>
      </div>
    </template>
  </div>
</template>

<script>
import adminService from "../../services/adminService";
import BaseAlert from "../../components/AlertaBase.vue";
import { mensajeErrorApi } from "../../utils/apiError";
import { formatearFecha } from "../../utils/fechas.js";
import { validarRangoFechas } from "../../utils/parametrosPostulaciones.js";
import {
  ESTADO_REPORTE_POR_DEFECTO,
  OPCIONES_ESTADO_REPORTE_PERFIL,
  OPCIONES_MOTIVO_FILTRO_REPORTE_PERFIL,
  OPCIONES_TAMANO_REPORTES,
  TAMANO_REPORTES_POR_DEFECTO,
  colorEstadoReportePerfil,
  construirParamsReportesPerfil,
  etiquetaEstadoReportePerfil,
  etiquetaMotivoReportePerfil,
} from "../../utils/reportePerfilConstants.js";

function filtrosIniciales() {
  return {
    estado: ESTADO_REPORTE_POR_DEFECTO,
    motivo: "",
    fechaDesde: "",
    fechaHasta: "",
    tamano: TAMANO_REPORTES_POR_DEFECTO,
  };
}

export default {
  name: "ReportesPerfilView",
  components: { BaseAlert },
  data() {
    return {
      filtros: filtrosIniciales(),
      reportes: [],
      paginacion: {
        paginaActual: 0,
        totalPaginas: 1,
        totalElementos: 0,
        primera: true,
        ultima: true,
      },
      cargando: true,
      mensajeError: "",
      errorFechas: "",
      puedeReintentar: false,
      idCarga: 0,
      columnas: [
        { key: "fechaReporte", label: "Fecha" },
        { key: "motivoDescripcion", label: "Motivo" },
        { key: "nombrePerfilReportado", label: "Perfil reportado" },
        { key: "autor", label: "Autor" },
        { key: "estado", label: "Estado" },
        { key: "acciones", label: "Acciones" },
      ],
      opcionesEstado: OPCIONES_ESTADO_REPORTE_PERFIL,
      opcionesMotivo: OPCIONES_MOTIVO_FILTRO_REPORTE_PERFIL,
      opcionesTamano: OPCIONES_TAMANO_REPORTES,
    };
  },
  computed: {
    esTodos() {
      return Number(this.filtros.tamano) === 0;
    },
  },
  created() {
    this.controlador = null;
  },
  mounted() {
    this.buscar(0);
  },
  beforeUnmount() {
    if (this.controlador) this.controlador.abort();
  },
  methods: {
    formatearFecha,
    etiquetaEstadoReportePerfil,
    colorEstadoReportePerfil,
    textoMotivo(reporte) {
      return (
        reporte?.motivoDescripcion ||
        etiquetaMotivoReportePerfil(reporte?.motivo)
      );
    },
    textoPerfilReportado(reporte) {
      if (reporte?.nombrePerfilReportado) return reporte.nombrePerfilReportado;
      return reporte?.idPerfilReportado != null
        ? `Perfil #${reporte.idPerfilReportado}`
        : "—";
    },
    textoAutor(reporte) {
      return (
        reporte?.nombrePerfilAutor ||
        reporte?.nombreUsuarioAutor ||
        "—"
      );
    },
    async buscar(pagina = 0) {
      const error = validarRangoFechas(
        this.filtros.fechaDesde,
        this.filtros.fechaHasta
      );
      this.errorFechas = error;
      if (error) {
        this.mensajeError = "";
        this.puedeReintentar = false;
        return;
      }

      const corrida = ++this.idCarga;
      if (this.controlador) this.controlador.abort();
      this.controlador = new AbortController();

      this.cargando = true;
      this.mensajeError = "";
      this.puedeReintentar = false;

      const params = construirParamsReportesPerfil({
        ...this.filtros,
        pagina,
      });

      try {
        const response = await adminService.listarReportesPerfil(
          params,
          this.controlador.signal
        );
        if (corrida !== this.idCarga) return;

        const data = response?.data || {};
        this.reportes = Array.isArray(data.contenido) ? data.contenido : [];
        this.paginacion = {
          paginaActual: Number(data.paginaActual) || 0,
          totalPaginas: Number(data.totalPaginas) || 1,
          totalElementos: Number(data.totalElementos) || 0,
          primera: data.primera !== false,
          ultima: data.ultima !== false,
        };
      } catch (errorCarga) {
        if (
          corrida !== this.idCarga ||
          errorCarga?.code === "ERR_CANCELED" ||
          errorCarga?.name === "CanceledError"
        ) {
          return;
        }
        this.manejarError(errorCarga);
      } finally {
        if (corrida === this.idCarga) this.cargando = false;
      }
    },
    manejarError(error) {
      const status = error?.response?.status;
      const mensaje = error?.response?.data?.message || "";
      this.reportes = [];

      if (status === 401) {
        this.mensajeError = mensajeErrorApi(
          error,
          "Tu sesión expiró. Iniciá sesión nuevamente."
        );
        return;
      }
      if (status === 403) {
        this.mensajeError =
          mensaje || "No tenés permisos para ver los reportes.";
        return;
      }
      if (status === 400) {
        this.mensajeError =
          mensaje || "Revisá los filtros e intentá nuevamente.";
        return;
      }
      if (!status || status >= 500) {
        this.puedeReintentar = true;
        this.mensajeError =
          "No se pudieron cargar los reportes. Inténtalo nuevamente.";
        return;
      }
      this.mensajeError = mensajeErrorApi(
        error,
        "No se pudieron cargar los reportes."
      );
    },
    reintentar() {
      this.buscar(this.paginacion.paginaActual);
    },
    irAPagina(delta) {
      const destino = this.paginacion.paginaActual + delta;
      if (destino < 0 || destino >= this.paginacion.totalPaginas) return;
      this.buscar(destino);
    },
    limpiarFiltros() {
      this.filtros = filtrosIniciales();
      this.errorFechas = "";
      this.buscar(0);
    },
    verDetalle(reporte) {
      if (reporte?.idReporte == null) return;
      this.$router.push({
        name: "admin-reporte-perfil",
        params: { id: reporte.idReporte },
      });
    },
  },
};
</script>

<style scoped>
.reportes-perfil {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.reportes-perfil__encabezado h1 {
  margin: 0;
  color: var(--color-text);
  font-size: 1.45rem;
  font-weight: 800;
}

.reportes-perfil__subtitulo {
  margin: 0.25rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.reportes-perfil__filtros {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.75rem;
  align-items: end;
  padding: 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.reportes-perfil__campo--tamano {
  max-width: 180px;
}

.reportes-perfil__limpiar {
  align-self: end;
}

.reportes-perfil__reintento {
  display: flex;
  justify-content: center;
}

.reportes-perfil__resumen {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.82rem;
}

.reportes-perfil__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2.25rem 1rem;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.reportes-perfil__vacio {
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
}

.reportes-perfil__tabla {
  background: var(--color-surface);
  border-radius: 12px;
}

.reportes-perfil__paginacion {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.reportes-perfil__pagina {
  color: var(--color-text-muted);
  font-size: 0.8rem;
}
</style>
