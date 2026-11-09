<template>
  <div class="auditoria-tabla">
    <!-- Desktop: tabla con detalle expandido inline -->
    <div class="auditoria-tabla__desktop">
      <VaDataTable
        :key="tablaKey"
        class="auditoria-tabla__tabla"
        :items="eventos"
        :columns="columnas"
        :loading="cargando"
        striped
        hoverable
        no-pagination
      >
        <template #cell(fechaHora)="{ rowData }">
          <div class="auditoria-tabla__fecha">{{ formatearFechaAuditoria(rowData.fechaHora) }}</div>
          <div class="auditoria-tabla__hora">{{ formatearHoraAuditoria(rowData.fechaHora) }}</div>
        </template>

        <template #cell(evento)="{ rowData }">
          <div class="auditoria-tabla__evento">
            <AuditoriaChipEvento :evento="rowData" :catalogo="catalogo" />
            <span v-if="esEventoHistorico(rowData)" class="auditoria-tabla__historico">Histórico</span>
          </div>
          <div v-if="esEventoOtro(rowData)" class="auditoria-tabla__otro">
            {{ rowData.tipoEventoOriginal }}
          </div>
        </template>

        <template #cell(entidad)="{ rowData }">
          {{ textoEntidadEvento(rowData) }}
        </template>

        <template #cell(operador)="{ rowData }">
          <div class="auditoria-tabla__operador">
            <span
              class="auditoria-tabla__avatar"
              :class="clasesAvatar(rowData)"
            >
              <span v-if="esEventoHistorico(rowData)" class="material-symbols-outlined" aria-hidden="true">history</span>
              <template v-else>{{ inicialesOperador(rowData) }}</template>
            </span>
            <span class="auditoria-tabla__operador-nombre">{{ rowData.operador || "—" }}</span>
          </div>
        </template>

        <template #cell(ipUsuario)="{ rowData }">
          <span class="auditoria-tabla__ip">{{ rowData.ipUsuario || "—" }}</span>
        </template>

        <template #cell(detalle)="{ row }">
          <button
            type="button"
            class="auditoria-tabla__alternar"
            :aria-expanded="row.isExpandableRowVisible ? 'true' : 'false'"
            @click="row.toggleRowDetails()"
          >
            {{ row.isExpandableRowVisible ? "Ocultar" : "Ver detalle" }}
            <span class="material-symbols-outlined" aria-hidden="true">
              {{ row.isExpandableRowVisible ? "expand_less" : "expand_more" }}
            </span>
          </button>
        </template>

        <template #expandableRow="{ rowData }">
          <AuditoriaDetalleEvento :evento="rowData" :catalogo="catalogo" modo="desktop" />
        </template>
      </VaDataTable>
    </div>

    <!-- Móvil: lista de cards + panel de detalle a pantalla completa -->
    <div class="auditoria-tabla__movil">
      <p class="auditoria-tabla__conteo-movil">
        {{ paginacion.totalElementos }} {{ paginacion.totalElementos === 1 ? "evento" : "eventos" }}
      </p>

      <article
        v-for="evento in eventos"
        :key="`m-${evento.idAuditoria}`"
        class="auditoria-tabla__card"
      >
        <header class="auditoria-tabla__card-cabecera">
          <span class="auditoria-tabla__fecha">
            {{ formatearFechaAuditoria(evento.fechaHora) }} · {{ formatearHoraAuditoria(evento.fechaHora) }}
          </span>
          <button type="button" class="auditoria-tabla__alternar" @click="abrirDetalle(evento)">
            Ver detalle
            <span class="material-symbols-outlined" aria-hidden="true">expand_more</span>
          </button>
        </header>
        <div class="auditoria-tabla__evento">
          <AuditoriaChipEvento :evento="evento" :catalogo="catalogo" />
          <span v-if="esEventoHistorico(evento)" class="auditoria-tabla__historico">Histórico</span>
        </div>
        <div class="auditoria-tabla__card-operador">
          <span class="auditoria-tabla__avatar" :class="clasesAvatar(evento)">
            <span v-if="esEventoHistorico(evento)" class="material-symbols-outlined" aria-hidden="true">history</span>
            <template v-else>{{ inicialesOperador(evento) }}</template>
          </span>
          <div class="auditoria-tabla__card-datos">
            <span class="auditoria-tabla__operador-nombre">{{ evento.operador || "—" }}</span>
            <span class="auditoria-tabla__card-entidad">{{ textoEntidadEvento(evento) }}</span>
          </div>
        </div>
      </article>
    </div>

    <!-- Detalle móvil a pantalla completa (overlay, escenario D6/D10) -->
    <transition name="auditoria-overlay">
      <div
        v-if="detalleMovil"
        class="auditoria-tabla__overlay"
        role="dialog"
        aria-modal="true"
      >
        <header class="auditoria-tabla__overlay-cabecera">
          <button
            type="button"
            class="auditoria-tabla__overlay-volver"
            aria-label="Volver"
            @click="cerrarDetalle"
          >
            <span class="material-symbols-outlined" aria-hidden="true">chevron_left</span>
          </button>
          <h2 class="auditoria-tabla__overlay-titulo">Evento #{{ detalleMovil.idAuditoria }}</h2>
          <span class="auditoria-tabla__avatar auditoria-tabla__avatar--cabecera" :class="clasesAvatar(detalleMovil)">
            <span v-if="esEventoHistorico(detalleMovil)" class="material-symbols-outlined" aria-hidden="true">history</span>
            <template v-else>{{ inicialesOperador(detalleMovil) }}</template>
          </span>
        </header>
        <div class="auditoria-tabla__overlay-lote">
          <AuditoriaDetalleEvento :evento="detalleMovil" :catalogo="catalogo" modo="movil" />
        </div>
      </div>
    </transition>

    <!-- Pie común: conteo, paginación y tamaño de página -->
    <div v-if="eventos.length" class="auditoria-tabla__pie">
      <span class="auditoria-tabla__conteo">
        Mostrando {{ rangoMostrado }} de {{ formatearNumero(paginacion.totalElementos) }} eventos
      </span>

      <div v-if="paginacion.totalPaginas > 1" class="auditoria-tabla__paginacion">
        <VaButton
          preset="secondary"
          size="small"
          icon="mso-chevron_left"
          :disabled="paginacion.primera"
          @click="$emit('cambiar-pagina', -1)"
        >
          Anterior
        </VaButton>
        <span class="auditoria-tabla__pagina">
          Página {{ paginacion.paginaActual + 1 }} de {{ paginacion.totalPaginas }}
        </span>
        <VaButton
          preset="secondary"
          size="small"
          icon-suffix="mso-chevron_right"
          :disabled="paginacion.ultima"
          @click="$emit('cambiar-pagina', 1)"
        >
          Siguiente
        </VaButton>
      </div>

      <VaSelect
        class="auditoria-tabla__tamano"
        :model-value="tamano"
        :options="opcionesTamano"
        value-by="value"
        text-by="text"
        :disabled="cargando"
        @update:modelValue="$emit('cambiar-tamano', $event)"
      />
    </div>
  </div>
</template>

<script>
import AuditoriaChipEvento from "./AuditoriaChipEvento.vue";
import AuditoriaDetalleEvento from "./AuditoriaDetalleEvento.vue";
import {
  OPCIONES_TAMANO_AUDITORIA,
  esEventoHistorico,
  esEventoOtro,
  formatearFechaAuditoria,
  formatearHoraAuditoria,
  inicialesOperador,
  textoEntidadEvento,
} from "../../../utils/auditoriaConstants";

/**
 * Listado de eventos de UC-67. Desktop: `VaDataTable` con detalle expandido
 * (`expandableRow` + `toggleRowDetails`). Móvil: cards y panel de detalle a
 * pantalla completa, según los mockups. Paginación estilo resto del admin
 * (Anterior/Siguiente) con selector de tamaño.
 */
export default {
  name: "AuditoriaTabla",
  components: { AuditoriaChipEvento, AuditoriaDetalleEvento },
  props: {
    eventos: { type: Array, default: () => [] },
    cargando: { type: Boolean, default: false },
    paginacion: {
      type: Object,
      required: true,
      // { paginaActual, totalPaginas, totalElementos, primera, ultima }
    },
    tamano: { type: Number, default: 20 },
    catalogo: { type: Array, default: () => [] },
  },
  emits: ["cambiar-pagina", "cambiar-tamano"],
  data() {
    return {
      columnas: [
        { key: "fechaHora", label: "Fecha y hora" },
        { key: "evento", label: "Evento" },
        { key: "entidad", label: "Entidad" },
        { key: "operador", label: "Operador" },
        { key: "ipUsuario", label: "IP" },
        { key: "detalle", label: "" },
      ],
      opcionesTamano: OPCIONES_TAMANO_AUDITORIA,
      detalleMovil: null,
    };
  },
  computed: {
    /**
     * La expansión interna de VaDataTable queda indexada por fila; al cambiar
     * los datos (página o consulta) se recrea la tabla para que ninguna fila
     * herede el panel expandido de otra.
     */
    tablaKey() {
      return this.eventos.map((evento) => evento.idAuditoria).join("-") || "vacia";
    },
    rangoMostrado() {
      const total = Number(this.paginacion.totalElementos) || 0;
      if (!total) return "0";
      const desde = this.paginacion.paginaActual * this.tamano + 1;
      const hasta = Math.min(total, desde + this.eventos.length - 1);
      return `${this.formatearNumero(desde)}–${this.formatearNumero(hasta)}`;
    },
  },
  methods: {
    esEventoHistorico,
    esEventoOtro,
    formatearFechaAuditoria,
    formatearHoraAuditoria,
    inicialesOperador,
    textoEntidadEvento,
    formatearNumero(valor) {
      const numero = Number(valor);
      return Number.isFinite(numero) ? numero.toLocaleString("es-AR") : "0";
    },
    clasesAvatar(evento) {
      if (esEventoHistorico(evento)) return "auditoria-tabla__avatar--historico";
      if (inicialesOperador(evento) === "S" && evento?.idUsuario == null) {
        return "auditoria-tabla__avatar--sistema";
      }
      return "";
    },
    abrirDetalle(evento) {
      this.detalleMovil = evento;
    },
    cerrarDetalle() {
      this.detalleMovil = null;
    },
    escucharTeclado(evento) {
      if (evento.key === "Escape") this.cerrarDetalle();
    },
  },
  watch: {
    detalleMovil(abierto) {
      if (abierto) {
        document.addEventListener("keydown", this.escucharTeclado);
      } else {
        document.removeEventListener("keydown", this.escucharTeclado);
      }
    },
  },
  beforeUnmount() {
    document.removeEventListener("keydown", this.escucharTeclado);
  },
};
</script>

<style scoped>
.auditoria-tabla {
  display: grid;
  gap: 0.75rem;
}

.auditoria-tabla :deep(th) {
  color: var(--color-primary);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  white-space: nowrap;
}

.auditoria-tabla :deep(td) {
  font-size: 0.82rem;
  vertical-align: top;
}

.auditoria-tabla :deep(td.va-data-table__table-expanded-content) {
  padding: 0 !important;
  background: inherit;
}

.auditoria-tabla__tabla {
  background: var(--color-surface);
  border-radius: 12px;
}

.auditoria-tabla__fecha {
  color: var(--color-text);
  font-weight: 700;
  white-space: nowrap;
}

.auditoria-tabla__hora {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}

.auditoria-tabla__evento {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.35rem;
  max-width: 15rem;
}

.auditoria-tabla__historico {
  padding: 0.1rem 0.4rem;
  color: var(--color-text-muted);
  background: var(--color-surface-muted);
  border-radius: 999px;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.auditoria-tabla__otro {
  margin-top: 0.2rem;
  color: var(--color-text-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.7rem;
  overflow-wrap: anywhere;
}

.auditoria-tabla__operador {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.auditoria-tabla__operador-nombre {
  overflow: hidden;
  min-width: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.auditoria-tabla__avatar {
  display: grid;
  flex: 0 0 1.9rem;
  width: 1.9rem;
  height: 1.9rem;
  place-items: center;
  color: var(--color-on-primary);
  background: color-mix(in srgb, var(--color-accent) 72%, var(--color-primary));
  border-radius: 50%;
  font-size: 0.65rem;
  font-weight: 700;
}

.auditoria-tabla__avatar .material-symbols-outlined {
  font-size: 1.05rem;
}

.auditoria-tabla__avatar--sistema {
  color: var(--color-on-primary);
  background: var(--color-support);
}

.auditoria-tabla__avatar--historico {
  color: var(--color-text-muted);
  background: var(--color-surface-muted);
}

.auditoria-tabla__avatar--cabecera {
  flex-basis: 2.4rem;
  width: 2.4rem;
  height: 2.4rem;
}

.auditoria-tabla__ip {
  color: var(--color-text-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.75rem;
}

.auditoria-tabla__alternar {
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
  padding: 0.2rem 0.3rem;
  color: var(--color-primary);
  background: none;
  border: 0;
  border-radius: 0.4rem;
  font: inherit;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.auditoria-tabla__alternar .material-symbols-outlined {
  font-size: 1.05rem;
}

.auditoria-tabla__alternar:hover {
  background: var(--color-hover);
}

.auditoria-tabla__pie {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 0.5rem 0.25rem 0;
}

.auditoria-tabla__conteo {
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.auditoria-tabla__paginacion {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.auditoria-tabla__pagina {
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.auditoria-tabla__tamano {
  width: 9.5rem;
}

/* Móvil */
.auditoria-tabla__conteo-movil {
  margin: 0 0 0.25rem;
  color: var(--color-text);
  font-size: 0.95rem;
  font-weight: 700;
}

.auditoria-tabla__card {
  display: grid;
  gap: 0.55rem;
  margin-bottom: 0.75rem;
  padding: 0.85rem 0.95rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: 12px;
}

.auditoria-tabla__card-cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.auditoria-tabla__card-operador {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.auditoria-tabla__card-datos {
  display: grid;
  gap: 0.1rem;
  min-width: 0;
}

.auditoria-tabla__card-entidad {
  overflow: hidden;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Overlay de detalle móvil */
.auditoria-tabla__overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  grid-template-rows: auto 1fr;
  background: var(--color-bg);
}

.auditoria-tabla__overlay-cabecera {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border-soft);
}

.auditoria-tabla__overlay-volver {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.2rem;
  height: 2.2rem;
  padding: 0;
  color: var(--color-primary);
  background: none;
  border: 0;
  border-radius: 50%;
  font-size: 1.2rem;
  cursor: pointer;
}

.auditoria-tabla__overlay-volver .material-symbols-outlined {
  font-size: 1.5rem;
}

.auditoria-tabla__overlay-titulo {
  flex: 1;
  margin: 0;
  color: var(--color-text);
  font-size: 1.05rem;
  font-weight: 800;
}

.auditoria-tabla__overlay-lote {
  padding: 1rem;
  overflow-y: auto;
}

/* Transición del overlay */
.auditoria-overlay-enter-active,
.auditoria-overlay-leave-active {
  transition: opacity 0.18s ease;
}

.auditoria-overlay-enter-from,
.auditoria-overlay-leave-to {
  opacity: 0;
}

/* Visibilidad por breakpoint */
@media (max-width: 720px) {
  .auditoria-tabla__desktop {
    display: none;
  }
}

@media (min-width: 721px) {
  .auditoria-tabla__movil {
    display: none;
  }
}

@media (min-width: 721px) {
  .auditoria-tabla__overlay {
    display: none;
  }
}

@media (max-width: 560px) {
  .auditoria-tabla__pie {
    justify-content: center;
  }
}
</style>
