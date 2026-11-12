<template>
  <div class="reportes-publicacion">
    <section class="reportes-publicacion__encabezado">
      <h1>Reportes de publicaciones</h1>
      <p class="reportes-publicacion__subtitulo">
        Revisá y gestioná los reportes enviados sobre publicaciones.
      </p>
    </section>

    <section
      class="reportes-publicacion__filtros"
      aria-label="Filtros de reportes de publicaciones"
    >
      <VaSelect
        v-model="filtros.estado"
        class="reportes-publicacion__campo"
        label="Estado"
        :options="opcionesEstado"
        value-by="value"
        text-by="text"
        @update:modelValue="buscar(0)"
      />
      <VaSelect
        v-model="filtros.motivo"
        class="reportes-publicacion__campo"
        label="Motivo"
        :options="opcionesMotivo"
        value-by="value"
        text-by="text"
        @update:modelValue="buscar(0)"
      />
      <VaInput
        v-model="filtros.fechaDesde"
        class="reportes-publicacion__campo"
        label="Desde"
        type="date"
        @update:modelValue="buscar(0)"
      />
      <VaInput
        v-model="filtros.fechaHasta"
        class="reportes-publicacion__campo"
        label="Hasta"
        type="date"
        @update:modelValue="buscar(0)"
      />
      <VaSelect
        v-model="filtros.tamano"
        class="reportes-publicacion__campo reportes-publicacion__campo--tamano"
        label="Resultados"
        :options="opcionesTamano"
        value-by="value"
        text-by="text"
        @update:modelValue="buscar(0)"
      />
      <VaButton
        preset="secondary"
        icon="mso-filter_alt_off"
        class="reportes-publicacion__limpiar"
        @click="limpiarFiltros"
      >
        Limpiar filtros
      </VaButton>
    </section>

    <BaseAlert v-if="errorFechas" :message="errorFechas" type="error" />
    <BaseAlert v-if="mensajeError" :message="mensajeError" type="error" />

    <div v-if="puedeReintentar" class="reportes-publicacion__reintento">
      <VaButton preset="primary" icon="mso-refresh" @click="reintentar">
        Reintentar
      </VaButton>
    </div>

    <p
      v-if="!cargando && !mensajeError"
      class="reportes-publicacion__resumen"
    >
      {{ paginacion.totalElementos }} reporte(s)
      <template v-if="!esTodos && paginacion.totalPaginas > 1">
        · Página {{ paginacion.paginaActual + 1 }} de
        {{ paginacion.totalPaginas }}
      </template>
    </p>

    <div v-if="cargando" class="reportes-publicacion__estado">
      <span class="material-symbols-outlined">hourglass_empty</span>
      Cargando reportes...
    </div>

    <div
      v-else-if="!mensajeError && reportes.length === 0"
      class="reportes-publicacion__estado reportes-publicacion__vacio"
    >
      <span class="material-symbols-outlined">inbox</span>
      {{
        hayFiltros
          ? "No hay reportes que coincidan con los filtros."
          : "No hay reportes de publicaciones."
      }}
    </div>

    <template v-else-if="!mensajeError">
      <VaDataTable
        class="reportes-publicacion__tabla"
        :items="reportes"
        :columns="columnas"
        striped
        hoverable
        no-pagination
      >
        <template #cell(fechaReporte)="{ value }">
          {{ formatearFecha(value) }}
        </template>

        <template #cell(tituloPublicacion)="{ rowData }">
          <span class="reportes-publicacion__publicacion">
            <template v-if="rowData.publicacionEliminada">
              Publicación eliminada
            </template>
            <template v-else>
              {{ rowData.tituloPublicacion || "—" }}
            </template>
            <VaBadge
              v-if="rowData.estadoPublicacion === 'OCULTA'"
              text="Oculta"
              color="warning"
              outline
            />
          </span>
        </template>

        <template #cell(nombrePerfilPublicacion)="{ rowData }">
          {{ rowData.nombrePerfilPublicacion || "—" }}
        </template>

        <template #cell(autor)="{ rowData }">
          {{ textoAutor(rowData) }}
        </template>

        <template #cell(motivoDescripcion)="{ rowData }">
          {{ textoMotivo(rowData) }}
        </template>

        <template #cell(estado)="{ value }">
          <VaBadge
            :text="etiquetaEstadoReportePublicacion(value)"
            :color="colorEstadoReportePublicacion(value)"
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
        class="reportes-publicacion__paginacion"
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
        <span class="reportes-publicacion__pagina">
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
  ESTADO_REPORTE_PUBLICACION_POR_DEFECTO,
  OPCIONES_ESTADO_REPORTE_PUBLICACION,
  OPCIONES_MOTIVO_FILTRO_REPORTE_PUBLICACION,
  OPCIONES_TAMANO_REPORTES_PUBLICACION,
  TAMANO_REPORTES_PUBLICACION_POR_DEFECTO,
  colorEstadoReportePublicacion,
  construirParamsReportesPublicacion,
  etiquetaEstadoReportePublicacion,
  etiquetaMotivoReportePublicacion,
} from "../../utils/reportePublicacionConstants.js";

function filtrosIniciales() {
  return {
    estado: ESTADO_REPORTE_PUBLICACION_POR_DEFECTO,
    motivo: "",
    fechaDesde: "",
    fechaHasta: "",
    tamano: TAMANO_REPORTES_PUBLICACION_POR_DEFECTO,
  };
}

export default {
  name: "ReportesPublicacionView",
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
        { key: "tituloPublicacion", label: "Publicación" },
        { key: "nombrePerfilPublicacion", label: "Perfil dueño" },
        { key: "autor", label: "Autor del reporte" },
        { key: "motivoDescripcion", label: "Motivo" },
        { key: "estado", label: "Estado" },
        { key: "acciones", label: "Acciones" },
      ],
      opcionesEstado: OPCIONES_ESTADO_REPORTE_PUBLICACION,
      opcionesMotivo: OPCIONES_MOTIVO_FILTRO_REPORTE_PUBLICACION,
      opcionesTamano: OPCIONES_TAMANO_REPORTES_PUBLICACION,
    };
  },
  computed: {
    esTodos() {
      return Number(this.filtros.tamano) === 0;
    },
    hayFiltros() {
      return (
        this.filtros.estado !== ESTADO_REPORTE_PUBLICACION_POR_DEFECTO ||
        !!this.filtros.motivo ||
        !!this.filtros.fechaDesde ||
        !!this.filtros.fechaHasta
      );
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
    etiquetaEstadoReportePublicacion,
    colorEstadoReportePublicacion,
    textoMotivo(reporte) {
      return (
        reporte?.motivoDescripcion ||
        etiquetaMotivoReportePublicacion(reporte?.motivo)
      );
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

      const params = construirParamsReportesPublicacion({
        ...this.filtros,
        pagina,
      });

      try {
        const response = await adminService.listarReportesPublicacion(
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
        name: "admin-reporte-publicacion",
        params: { id: reporte.idReporte },
      });
    },
  },
};
</script>

<style scoped>
.reportes-publicacion {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.reportes-publicacion__encabezado h1 {
  margin: 0;
  color: var(--color-text);
  font-size: 1.45rem;
  font-weight: 800;
}

.reportes-publicacion__subtitulo {
  margin: 0.25rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.reportes-publicacion__filtros {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.75rem;
  align-items: end;
  padding: 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.reportes-publicacion__campo--tamano {
  max-width: 180px;
}

.reportes-publicacion__limpiar {
  align-self: end;
}

.reportes-publicacion__reintento {
  display: flex;
  justify-content: center;
}

.reportes-publicacion__resumen {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.82rem;
}

.reportes-publicacion__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2.25rem 1rem;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.reportes-publicacion__vacio {
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
}

.reportes-publicacion__tabla {
  background: var(--color-surface);
  border-radius: 12px;
}

.reportes-publicacion__publicacion {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.reportes-publicacion__paginacion {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.reportes-publicacion__pagina {
  color: var(--color-text-muted);
  font-size: 0.8rem;
}
</style>
