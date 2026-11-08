<template>
  <section class="historial-contratos">
    <div class="historial-contratos__filtros">
      <VaInput
        v-model="filtros.nombre"
        class="historial-contratos__filtro"
        label="Buscar contrato"
        placeholder="Nombre del contrato"
        clearable
        :disabled="cargando"
        @keyup.enter="cargar(0)"
      />

      <VaSelect
        class="historial-contratos__filtro"
        label="Tipo de evento"
        placeholder="Todos"
        :model-value="filtros.tipo"
        :options="opcionesTipo"
        value-by="value"
        text-by="text"
        clearable
        :disabled="cargando"
        @update:model-value="filtros.tipo = $event || ''"
      />

      <div class="historial-contratos__acciones-filtro">
        <VaButton
          preset="primary"
          :loading="cargando"
          :disabled="cargando"
          @click="cargar(0)"
        >
          Filtrar
        </VaButton>
        <VaButton
          v-if="hayFiltrosActivos"
          preset="secondary"
          :disabled="cargando"
          @click="limpiarFiltros"
        >
          Limpiar
        </VaButton>
      </div>
    </div>

    <BaseAlert v-if="error" :message="error" type="error" />

    <div
      v-if="error && puedeReintentar"
      class="historial-contratos__reintento"
    >
      <VaButton preset="primary" icon="mso-refresh" @click="cargar()">
        Reintentar
      </VaButton>
    </div>

    <div v-if="cargando" class="historial-contratos__estado">
      <span class="material-symbols-outlined historial-contratos__estado-icono">
        hourglass_empty
      </span>
      Cargando historial de contratos...
    </div>

    <div
      v-else-if="!error && !eventos.length"
      class="historial-contratos__estado historial-contratos__vacio"
    >
      <span class="material-symbols-outlined historial-contratos__estado-icono">
        description
      </span>
      <p class="historial-contratos__vacio-titulo">{{ mensajeVacio }}</p>
      <VaButton
        v-if="hayFiltrosActivos"
        preset="secondary"
        @click="limpiarFiltros"
      >
        Limpiar filtros
      </VaButton>
    </div>

    <template v-else-if="!error">
      <p class="historial-contratos__resumen">
        {{ paginacion.totalElementos }}
        evento{{ paginacion.totalElementos === 1 ? "" : "s" }} de contrato(s)
      </p>

      <div class="historial-contratos__tabla-wrapper">
        <table class="historial-contratos__tabla">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Contrato</th>
              <th>Tipo</th>
              <th>Evento</th>
              <th>Parte</th>
              <th>Responsable</th>
              <th>Versión</th>
              <th>Motivo</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="evento in eventos" :key="evento.clave">
              <td class="historial-contratos__fecha">
                {{ formatearFecha(evento.fechaHora) }}
              </td>

              <td>
                <button
                  type="button"
                  class="historial-contratos__contrato"
                  :disabled="evento.idContrato == null"
                  @click="irADetalle(evento)"
                >
                  {{ evento.nombreContrato || `Contrato #${evento.idContrato ?? "—"}` }}
                </button>
                <div class="historial-contratos__estado-fila">
                  <EstadoContratoBadge :estado="evento.estadoContrato" />
                  <span
                    v-if="esProyectoFinalizado(evento)"
                    class="historial-contratos__historico"
                  >
                    {{ etiquetaEstadoProyectoContrato(evento.estadoProyecto) }}
                  </span>
                </div>
              </td>

              <td>{{ evento.nombreTipoAcuerdo || evento.codigoTipoAcuerdo || "—" }}</td>

              <td>
                <span
                  class="historial-contratos__chip"
                  :style="estiloTipo(evento.tipoEvento)"
                >
                  {{ etiquetaTipoEventoContrato(evento.tipoEvento) }}
                </span>
              </td>

              <td>{{ evento.nombreParte || "—" }}</td>
              <td>{{ evento.nombreOperador || "—" }}</td>
              <td>{{ evento.version ?? "—" }}</td>
              <td class="historial-contratos__motivo">{{ evento.motivo || "—" }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-if="paginacion.totalPaginas > 1"
        class="historial-contratos__paginacion"
      >
        <VaButton
          preset="secondary"
          size="small"
          icon="mso-chevron_left"
          :disabled="paginacion.primera || cargando"
          @click="irAPagina(-1)"
        >
          Anterior
        </VaButton>
        <span class="historial-contratos__pagina">
          Página {{ paginacion.paginaActual + 1 }} de
          {{ paginacion.totalPaginas }}
        </span>
        <VaButton
          preset="secondary"
          size="small"
          icon="mso-chevron_right"
          :disabled="paginacion.ultima || cargando"
          @click="irAPagina(1)"
        >
          Siguiente
        </VaButton>
      </div>
    </template>
  </section>
</template>

<script>
import BaseAlert from "../AlertaBase.vue";
import EstadoContratoBadge from "../contrato/EstadoContratoBadge.vue";
import proyectoService from "../../services/proyectoService.js";
import { formatearFecha } from "../../utils/fechas.js";
import {
  OPCIONES_TIPO_EVENTO_CONTRATO,
  coloresTipoEventoContrato,
  etiquetaEstadoProyectoContrato,
  etiquetaTipoEventoContrato,
  mensajeErrorHistorialContratos,
  normalizarPaginaHistorialContratos,
} from "../../utils/historialContratoConstants.js";
import {
  conVolver,
  crearRutaVolver,
} from "../../utils/navegacionContratos.js";

const PAGINA_INICIAL = {
  paginaActual: 0,
  tamanoPagina: 20,
  totalElementos: 0,
  totalPaginas: 0,
  primera: true,
  ultima: true,
};

/*
 * Historial de eventos de contratos del proyecto. El backend decide la
 * visibilidad: Director ve todo; un miembro ve solo sus contratos.
 */
export default {
  name: "HistorialContratosProyecto",
  components: { BaseAlert, EstadoContratoBadge },
  props: {
    idProyecto: {
      type: [Number, String],
      required: true,
    },
    tipoInicial: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      eventos: [],
      cargando: false,
      error: "",
      puedeReintentar: false,
      paginacion: { ...PAGINA_INICIAL },
      filtros: {
        nombre: "",
        tipo: String(this.tipoInicial || "").toUpperCase(),
      },
      opcionesTipo: OPCIONES_TIPO_EVENTO_CONTRATO,
      idCarga: 0,
    };
  },
  computed: {
    hayFiltrosActivos() {
      return (
        String(this.filtros.nombre || "").trim() !== "" ||
        String(this.filtros.tipo || "").trim() !== ""
      );
    },
    mensajeVacio() {
      if (this.hayFiltrosActivos) {
        return "No hay eventos de contrato para los filtros seleccionados.";
      }
      if (this.paginacion.paginaActual > 0) {
        return "No hay eventos en esta página.";
      }
      return "Todavía no hay eventos de contratos en este proyecto.";
    },
  },
  watch: {
    idProyecto(nuevo, anterior) {
      if (String(nuevo) === String(anterior)) return;
      this.resetear();
      this.cargar(0);
    },
    tipoInicial(nuevo) {
      this.filtros = {
        ...this.filtros,
        tipo: String(nuevo || "").toUpperCase(),
      };
      this.cargar(0);
    },
  },
  created() {
    this.controlador = null;
  },
  mounted() {
    this.cargar(0);
  },
  beforeUnmount() {
    this.abortar();
  },
  methods: {
    formatearFecha,
    etiquetaTipoEventoContrato,
    etiquetaEstadoProyectoContrato,
    estiloTipo(tipo) {
      const colores = coloresTipoEventoContrato(tipo);
      return {
        backgroundColor: colores.fondo,
        color: colores.texto,
        borderColor: colores.borde,
      };
    },
    esProyectoFinalizado(evento) {
      const estado = String(evento?.estadoProyecto || "").toUpperCase();
      return estado === "FINALIZADO" || estado === "CANCELADO";
    },
    resetear() {
      this.eventos = [];
      this.paginacion = { ...PAGINA_INICIAL };
      this.error = "";
      this.puedeReintentar = false;
    },
    abortar() {
      if (this.controlador) {
        this.controlador.abort();
        this.controlador = null;
      }
    },
    esCancelacion(error) {
      return (
        error?.code === "ERR_CANCELED" ||
        error?.name === "CanceledError" ||
        error?.name === "AbortError"
      );
    },
    async cargar(pagina = this.paginacion.paginaActual) {
      const corrida = ++this.idCarga;
      this.abortar();
      this.controlador = new AbortController();

      this.cargando = true;
      this.error = "";
      this.puedeReintentar = false;

      try {
        const response = await proyectoService.listarHistorialContratos(
          this.idProyecto,
          {
            tipo: this.filtros.tipo || "",
            nombre: String(this.filtros.nombre || "").trim(),
            page: Math.max(0, Number(pagina) || 0),
            size:
              this.paginacion.tamanoPagina > 0
                ? this.paginacion.tamanoPagina
                : PAGINA_INICIAL.tamanoPagina,
          },
          this.controlador.signal
        );
        if (corrida !== this.idCarga) return;

        const normalizada = normalizarPaginaHistorialContratos(response?.data);
        this.eventos = normalizada.contenido;
        this.paginacion = {
          paginaActual: normalizada.paginaActual,
          tamanoPagina: normalizada.tamanoPagina,
          totalElementos: normalizada.totalElementos,
          totalPaginas: normalizada.totalPaginas,
          primera: normalizada.primera,
          ultima: normalizada.ultima,
        };
      } catch (error) {
        if (corrida !== this.idCarga || this.esCancelacion(error)) return;
        this.eventos = [];
        this.error = mensajeErrorHistorialContratos(error);
        const status = error?.response?.status;
        this.puedeReintentar = !status || status >= 500;
      } finally {
        if (corrida === this.idCarga) this.cargando = false;
      }
    },
    limpiarFiltros() {
      this.filtros = { nombre: "", tipo: "" };
      this.cargar(0);
    },
    irAPagina(delta) {
      const destino = this.paginacion.paginaActual + delta;
      if (destino < 0 || destino >= this.paginacion.totalPaginas) return;
      this.cargar(destino);
    },
    irADetalle(evento) {
      if (evento?.idContrato == null) return;
      this.$router.push(
        conVolver(
          {
            name: "detalle-contrato",
            params: {
              idProyecto: this.idProyecto,
              idContrato: evento.idContrato,
            },
          },
          crearRutaVolver(this.$route)
        )
      );
    },
  },
};
</script>

<style scoped>
.historial-contratos {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.historial-contratos__filtros {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding: 0.9rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
}

.historial-contratos__filtro {
  min-width: 220px;
  flex: 1 1 220px;
}

.historial-contratos__acciones-filtro {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.historial-contratos__reintento {
  display: flex;
  justify-content: center;
}

.historial-contratos__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2.25rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-size: 0.86rem;
  text-align: center;
}

.historial-contratos__estado-icono {
  font-size: 1.6rem;
}

.historial-contratos__vacio-titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 0.92rem;
  font-weight: 600;
}

.historial-contratos__resumen {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.historial-contratos__tabla-wrapper {
  overflow-x: auto;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
}

.historial-contratos__tabla {
  width: 100%;
  min-width: 980px;
  border-collapse: collapse;
  font-size: 0.82rem;
}

.historial-contratos__tabla th {
  padding: 0.7rem 0.8rem;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-muted);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-align: left;
  text-transform: uppercase;
  white-space: nowrap;
}

.historial-contratos__tabla td {
  padding: 0.75rem 0.8rem;
  border-bottom: 1px solid var(--color-border-soft);
  color: var(--color-text);
  vertical-align: top;
}

.historial-contratos__tabla tbody tr:last-child td {
  border-bottom: 0;
}

.historial-contratos__fecha {
  color: var(--color-text-muted);
  white-space: nowrap;
}

.historial-contratos__contrato {
  display: block;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-text);
  font-size: 0.84rem;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  overflow-wrap: anywhere;
}

.historial-contratos__contrato:hover:not(:disabled) {
  color: var(--color-primary);
  text-decoration: underline;
}

.historial-contratos__contrato:disabled {
  cursor: default;
}

.historial-contratos__estado-fila {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.25rem;
}

.historial-contratos__historico {
  color: var(--color-warning-text);
  font-size: 0.72rem;
  font-weight: 600;
}

.historial-contratos__chip {
  display: inline-block;
  padding: 0.2rem 0.55rem;
  border: 1px solid;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
}

.historial-contratos__motivo {
  color: var(--color-text-muted);
  max-width: 220px;
}

.historial-contratos__paginacion {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.historial-contratos__pagina {
  color: var(--color-text-muted);
  font-size: 0.82rem;
}

@media (max-width: 700px) {
  .historial-contratos__filtros {
    align-items: stretch;
    flex-direction: column;
  }

  .historial-contratos__filtro {
    min-width: 0;
    width: 100%;
  }

  .historial-contratos__acciones-filtro {
    justify-content: flex-end;
  }
}
</style>
