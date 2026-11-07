<template>
  <div class="auditoria">
    <section class="auditoria__encabezado">
      <h1>Informe de auditoría</h1>
      <p class="auditoria__subtitulo">
        Eventos críticos de la plataforma en un rango de fechas. Solo lectura.
      </p>
    </section>

    <!-- Estado sin permiso (403 ROL_NO_PERMITIDO) -->
    <section v-if="sinPermiso" class="auditoria__permiso">
      <span class="material-symbols-outlined auditoria__permiso-icono" aria-hidden="true">lock</span>
      <h2>No tenés permiso</h2>
      <p>Esta sección es solo para Administradores.</p>
      <VaButton @click="volverAlDashboard">Volver al Dashboard</VaButton>
    </section>

    <template v-else>
      <AuditoriaFiltros
        v-model="filtros"
        :catalogo="catalogo"
        :cargando-catalogo="catalogoCargando"
        :consultando="consultando"
        @consultar="consultar"
        @limpiar="limpiarFiltros"
      />

      <BaseAlert v-if="errorFiltros" :message="errorFiltros" type="warning" />
      <BaseAlert v-if="catalogoError" :message="catalogoError" type="warning" />
      <BaseAlert v-if="exportacionMensaje" :message="exportacionMensaje" type="error" />
      <BaseAlert v-if="mensajeError" :message="mensajeError" type="error" />

      <AuditoriaResumen
        :aplicados="aplicados"
        :resumen="resumen"
        :cargando="cargandoResumen"
        :resumen-error="resumenError"
        :catalogo="catalogo"
        :total-listado="paginacion.totalElementos"
      />

      <div v-if="puedeReintentar" class="auditoria__reintento">
        <VaButton preset="primary" icon="mso-refresh" @click="reintentar">
          Reintentar
        </VaButton>
      </div>

      <section class="auditoria__eventos" aria-label="Eventos de auditoría">
        <header class="auditoria__eventos-cabecera">
          <div class="auditoria__eventos-titulo">
            <h2>Eventos</h2>
            <span class="auditoria__orden">Del más reciente al más antiguo</span>
          </div>
          <div class="auditoria__exportaciones">
            <span v-if="notaExportacion" class="auditoria__nota-exportacion">
              {{ notaExportacion }}
            </span>
            <VaButton
              preset="secondary"
              icon="mso-download"
              :loading="exportando === 'CSV'"
              :disabled="!puedeExportar || !!exportando"
              @click="exportar('CSV')"
            >
              Exportar CSV
            </VaButton>
            <VaButton
              preset="secondary"
              icon="mso-description"
              :loading="exportando === 'PDF'"
              :disabled="!puedeExportar || !!exportando"
              @click="exportar('PDF')"
            >
              Exportar PDF
            </VaButton>
          </div>
        </header>

        <AuditoriaSkeleton
          v-if="cargandoListado && !eventos.length"
          data-testid="auditoria-cargando"
        />

        <div
          v-else-if="!mensajeError && eventos.length === 0"
          class="auditoria__vacio"
          data-testid="auditoria-vacio"
        >
          <h3>{{ TEXTO_VACIO_AUDITORIA }}</h3>
          <p>{{ TEXTO_VACIO_SUBTITULO_AUDITORIA }}</p>
        </div>

        <AuditoriaTabla
          v-else-if="!mensajeError"
          :eventos="eventos"
          :cargando="cargandoListado"
          :paginacion="paginacion"
          :tamano="tamano"
          :catalogo="catalogo"
          @cambiar-pagina="cambiarPagina"
          @cambiar-tamano="cambiarTamano"
        />
      </section>
    </template>
  </div>
</template>

<script>
import BaseAlert from "../../components/AlertaBase.vue";
import AuditoriaFiltros from "../../components/admin/auditoria/AuditoriaFiltros.vue";
import AuditoriaResumen from "../../components/admin/auditoria/AuditoriaResumen.vue";
import AuditoriaSkeleton from "../../components/admin/auditoria/AuditoriaSkeleton.vue";
import AuditoriaTabla from "../../components/admin/auditoria/AuditoriaTabla.vue";
import auditoriaService from "../../services/auditoriaService";
import { mensajeErrorApi } from "../../utils/apiError";
import {
  AUDITORIA_EXPORT_MAX_REGISTROS,
  TAMANO_AUDITORIA_POR_DEFECTO,
  TEXTO_VACIO_AUDITORIA,
  TEXTO_VACIO_SUBTITULO_AUDITORIA,
  construirParamsAuditoria,
  construirParamsExportacion,
  esPermisoDenegadoAuditoria,
  validarFiltrosAuditoria,
  mensajeErrorAuditoria,
  nombreArchivoExportacion,
  nombreDesdeContentDisposition,
  rangoUltimosDias,
  tiposSinDuplicados,
} from "../../utils/auditoriaConstants";

const TEXTO_RESUMEN_ERROR = "No se pudo cargar el resumen.";

/**
 * UC-67 — Informe de auditoría (solo Administradores).
 *
 * El estado se divide en:
 * - `filtros` (borrador): lo que se edita en la barra, no consulta por sí solo.
 * - `aplicados`: último filtro consultado; alimenta listado, resumen y export.
 * La consulta se dispara con "Consultar"; la paginación y el tamaño de página
 * reutilizan `aplicados` sin revalidar.
 */
export default {
  name: "AuditoriaAdminView",
  components: {
    BaseAlert,
    AuditoriaFiltros,
    AuditoriaResumen,
    AuditoriaSkeleton,
    AuditoriaTabla,
  },
  data() {
    const rango = rangoUltimosDias(7);
    return {
      filtros: {
        fechaDesde: rango.fechaDesde,
        fechaHasta: rango.fechaHasta,
        tipos: [],
      },
      aplicados: null,
      tamano: TAMANO_AUDITORIA_POR_DEFECTO,
      catalogo: [],
      catalogoCargando: false,
      catalogoError: "",
      eventos: [],
      paginacion: {
        paginaActual: 0,
        totalPaginas: 1,
        totalElementos: 0,
        primera: true,
        ultima: true,
      },
      resumen: null,
      cargandoListado: false,
      cargandoResumen: false,
      mensajeError: "",
      puedeReintentar: false,
      errorFiltros: "",
      exportando: null,
      exportacionMensaje: "",
      sinPermiso: false,
      idCargaListado: 0,
      idCargaCatalogo: 0,
      idCargaResumen: 0,
      idCargaExportacion: 0,
      resumenError: "",
      controladorListado: null,
      controladorResumen: null,
      controladorCatalogo: null,
      controladorExportacion: null,
      TEXTO_VACIO_AUDITORIA,
      TEXTO_VACIO_SUBTITULO_AUDITORIA,
    };
  },
  computed: {
    consultando() {
      return this.cargandoListado || this.cargandoResumen;
    },
    puedeExportar() {
      return (
        !!this.aplicados &&
        !this.sinPermiso &&
        !this.exportando &&
        this.totalAplicado > 0 &&
        this.totalAplicado <= AUDITORIA_EXPORT_MAX_REGISTROS
      );
    },
    totalAplicado() {
      return Number(this.paginacion.totalElementos) || 0;
    },
    notaExportacion() {
      if (!this.aplicados || this.consultando) return "";
      if (this.totalAplicado > AUDITORIA_EXPORT_MAX_REGISTROS) {
        return `El resultado (${this.formatearNumero(
          this.totalAplicado
        )}) supera el máximo exportable (${AUDITORIA_EXPORT_MAX_REGISTROS.toLocaleString(
          "es-AR"
        )} registros).`;
      }
      return "";
    },
  },
  created() {
    this.controladorListado = null;
    this.controladorResumen = null;
    this.controladorCatalogo = null;
    this.controladorExportacion = null;
  },
  mounted() {
    this.cargarCatalogo();
    this.consultar();
  },
  beforeUnmount() {
    [this.controladorListado, this.controladorResumen, this.controladorCatalogo, this.controladorExportacion]
      .forEach((controlador) => controlador?.abort());
  },
  methods: {
    formatearNumero(valor) {
      const numero = Number(valor);
      return Number.isFinite(numero) ? numero.toLocaleString("es-AR") : "0";
    },
    /* ---------------- Catálogo ---------------- */

    async cargarCatalogo() {
      const corrida = ++this.idCargaCatalogo;
      if (this.controladorCatalogo) this.controladorCatalogo.abort();
      this.controladorCatalogo = new AbortController();

      this.catalogoCargando = true;
      this.catalogoError = "";
      try {
        const response = await auditoriaService.tipos(
          this.controladorCatalogo.signal
        );
        if (corrida !== this.idCargaCatalogo) return;
        this.catalogo = Array.isArray(response?.data) ? response.data : [];
      } catch (error) {
        if (corrida !== this.idCargaCatalogo) return;
        this.catalogo = [];
        this.catalogoError =
          "No se pudieron cargar los tipos de evento. Podés consultar sin filtro de tipos.";
      } finally {
        if (corrida === this.idCargaCatalogo) this.catalogoCargando = false;
      }
    },

    /* ---------------- Consultas ---------------- */

    // Botón "Consultar": valida el borrador y consulta listado + resumen.
    async consultar() {
      const error = validarFiltrosAuditoria(this.filtros);
      this.errorFiltros = error?.mensaje || "";
      if (error) return;

      this.sinPermiso = false;
      this.mensajeError = "";
      this.puedeReintentar = false;
      this.exportacionMensaje = "";

      this.aplicados = {
        fechaDesde: this.filtros.fechaDesde,
        fechaHasta: this.filtros.fechaHasta,
        tipos: tiposSinDuplicados(this.filtros.tipos),
      };

      await Promise.allSettled([this.cargarListado(0), this.cargarResumen()]);
    },

    // Paginación y cambio de tamaño: usan el filtro ya aplicado.
    async cambiarPagina(delta) {
      const destino = this.paginacion.paginaActual + delta;
      if (destino < 0 || destino >= Math.max(1, this.paginacion.totalPaginas)) return;
      await this.cargarListado(destino);
    },

    async cambiarTamano(nuevo) {
      const cantidad = Number(nuevo) || TAMANO_AUDITORIA_POR_DEFECTO;
      if (cantidad === this.tamano) return;
      this.tamano = cantidad;
      if (!this.aplicados) return;
      await this.cargarListado(0);
    },

    async cargarListado(pagina = 0) {
      if (!this.aplicados) return;

      const corrida = ++this.idCargaListado;
      if (this.controladorListado) this.controladorListado.abort();
      this.controladorListado = new AbortController();

      this.cargandoListado = true;
      if (pagina === 0) this.exportacionMensaje = "";

      const params = construirParamsAuditoria(this.aplicados, {
        pagina,
        tamano: this.tamano,
      });

      try {
        const response = await auditoriaService.listar(
          params,
          this.controladorListado.signal
        );
        if (corrida !== this.idCargaListado) return;

        const data = response?.data || {};
        this.eventos = Array.isArray(data.contenido) ? data.contenido : [];
        this.paginacion = {
          paginaActual: Number(data.paginaActual) || 0,
          totalPaginas: Number(data.totalPaginas) || 1,
          totalElementos: Number(data.totalElementos) || 0,
          primera: data.primera !== false,
          ultima: data.ultima !== false,
        };
      } catch (errorCarga) {
        if (corrida !== this.idCargaListado) return;
        if (this.esCancelado(errorCarga)) return;
        this.manejarErrorListado(errorCarga);
      } finally {
        if (corrida === this.idCargaListado) this.cargandoListado = false;
      }
    },

    async cargarResumen() {
      if (!this.aplicados) return;

      const corrida = ++this.idCargaResumen;
      if (this.controladorResumen) this.controladorResumen.abort();
      this.controladorResumen = new AbortController();

      this.cargandoResumen = true;
      this.resumenError = "";

      const params = construirParamsAuditoria(this.aplicados);

      try {
        const response = await auditoriaService.resumen(
          params,
          this.controladorResumen.signal
        );
        if (corrida !== this.idCargaResumen) return;
        this.resumen = response?.data || null;
      } catch (errorCarga) {
        if (corrida !== this.idCargaResumen) return;
        if (this.esCancelado(errorCarga)) return;
        // El resumen no bloquea el listado.
        this.resumen = null;
        this.resumenError = TEXTO_RESUMEN_ERROR;
      } finally {
        if (corrida === this.idCargaResumen) this.cargandoResumen = false;
      }
    },

    /* ---------------- Exportación ---------------- */

    async exportar(formato) {
      if (!this.puedeExportar || this.exportando) return;

      const corrida = ++this.idCargaExportacion;
      if (this.controladorExportacion) this.controladorExportacion.abort();
      this.controladorExportacion = new AbortController();
      if (corrida !== this.idCargaExportacion) return;

      this.exportando = formato;
      this.exportacionMensaje = "";

      const params = construirParamsExportacion(formato, this.aplicados);

      try {
        const response = await auditoriaService.exportar(
          params,
          this.controladorExportacion.signal
        );
        const nombre =
          nombreDesdeContentDisposition(
            response?.headers?.['content-disposition']
          ) ||
          nombreArchivoExportacion(
            this.aplicados.fechaDesde,
            this.aplicados.fechaHasta,
            formato
          );
        this.descargarArchivo(response?.data, nombre);
      } catch (error) {
        await this.manejarErrorExportacion(error);
      } finally {
        if (corrida === this.idCargaExportacion) this.exportando = null;
      }
    },

    descargarArchivo(blob, nombre) {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = nombre;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      URL.revokeObjectURL(url);
    },

    /**
     * En exportación los errores llegan como blob; se intenta parsear el
     * cuerpo para extraer `codigo`/`message` del backend (§2.4 y §4).
     */
    async manejarErrorExportacion(error) {
      if (this.esCancelado(error)) return;
      const cuerpo = await this.leerCuerpoBlob(error);
      if (cuerpo?.message) this.exportacionMensaje = cuerpo.message;
      else this.exportacionMensaje = mensajeErrorAuditoria(error);
    },

    async leerCuerpoBlob(error) {
      const data = error?.response?.data;
      if (data instanceof Blob) {
        try {
          const texto = await data.text();
          return JSON.parse(texto);
        } catch {
          return null;
        }
      }
      return data || null;
    },

    /* ---------------- Errores y estados ---------------- */

    manejarErrorListado(error) {
      if (esPermisoDenegadoAuditoria(error)) {
        this.sinPermiso = true;
        return;
      }

      // Un tipo quedó inactivo entre la carga del catálogo y la consulta:
      // se limpian los inválidos para dejar los filtros coherentes.
      if (error?.response?.data?.codigo === "TIPO_EVENTO_INVALIDO") {
        const codes = new Set(this.catalogo.map((tipo) => tipo.codigo));
        const validas = tiposSinDuplicados(this.filtros.tipos).filter((codigo) =>
          codes.has(codigo)
        );
        this.filtros = { ...this.filtros, tipos: validas };
        this.aplicados = { ...this.aplicados, tipos: validas };
        this.mensajeError = mensajeErrorAuditoria(error);
        return;
      }

      this.eventos = [];
      this.paginacion = {
        paginaActual: 0,
        totalPaginas: 1,
        totalElementos: 0,
        primera: true,
        ultima: true,
      };
      this.puedeReintentar = !error?.response?.status || error.response.status >= 500;
      this.mensajeError = mensajeErrorApi(
        error,
        "No se pudieron cargar los eventos de auditoría."
      );
    },

    esCancelado(error) {
      return (
        error?.code === "ERR_CANCELED" ||
        error?.name === "CanceledError" ||
        error?.response?.code === "ERR_CANCELED"
      );
    },

    reintentar() {
      this.consultar();
    },

    volverAlDashboard() {
      this.$router.push({ name: "dashboard-admin" });
    },

    /* ---------------- Filtros borrador ---------------- */

    limpiarFiltros() {
      const rango = rangoUltimosDias(7);
      this.filtros = {
        fechaDesde: rango.fechaDesde,
        fechaHasta: rango.fechaHasta,
        tipos: [],
      };
      this.errorFiltros = "";
      this.consultar();
    },
  },
};
</script>

<style scoped>
.auditoria {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.auditoria__encabezado {
  display: grid;
  gap: 0.15rem;
}

.auditoria__encabezado h1 {
  margin: 0;
  color: var(--color-text);
  font-size: 1.45rem;
  font-weight: 800;
}

.auditoria__subtitulo {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.auditoria__eventos {
  display: grid;
  gap: 0.75rem;
}

.auditoria__eventos-cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.auditoria__eventos-titulo {
  display: grid;
  gap: 0.1rem;
}

.auditoria__eventos-titulo h2 {
  margin: 0;
  color: var(--color-text);
  font-size: 1.05rem;
  font-weight: 800;
}

.auditoria__orden {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}

.auditoria__exportaciones {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.auditoria__nota-exportacion {
  color: var(--color-warning-text);
  font-size: 0.72rem;
}

.auditoria__reintento {
  display: flex;
  justify-content: center;
}

.auditoria__vacio {
  display: grid;
  gap: 0.3rem;
  place-items: center;
  margin: 3rem auto;
  max-width: 420px;
  padding: 2.25rem 1.5rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: 12px;
  text-align: center;
}

.auditoria__vacio h3 {
  margin: 0;
  color: var(--color-text);
  font-size: 0.95rem;
  font-weight: 700;
}

.auditoria__vacio p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.auditoria__permiso {
  display: grid;
  gap: 0.5rem;
  max-width: 420px;
  margin: 3rem auto;
  padding: 2.25rem 1.5rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: 12px;
  text-align: center;
}

.auditoria__permiso-icono {
  margin: 0 auto;
  color: var(--color-accent);
  font-size: 2.2rem;
}

.auditoria__permiso h2 {
  margin: 0;
  color: var(--color-text);
  font-size: 1.1rem;
  font-weight: 800;
}

.auditoria__permiso p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}
</style>
