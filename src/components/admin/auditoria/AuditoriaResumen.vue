<template>
  <section class="auditoria-resumen" aria-label="Resumen de auditoría">
    <div class="auditoria-resumen__tarjetas">
      <article class="auditoria-resumen__tarjeta">
        <span class="auditoria-resumen__etiqueta">Eventos encontrados</span>
        <strong v-if="!cargando" class="auditoria-resumen__valor">
          {{ formatearNumero(total) }}
        </strong>
        <span v-else class="auditoria-resumen__skeleton auditoria-resumen__skeleton--valor" />
        <span class="auditoria-resumen__detalle">
          Entre el {{ fechaDesdeCorta }} y el {{ fechaHastaCorta }}
        </span>
      </article>

      <article class="auditoria-resumen__tarjeta">
        <span class="auditoria-resumen__etiqueta">Tipos de evento</span>
        <strong v-if="!cargando" class="auditoria-resumen__valor">
          {{ formatearNumero(cantidadTipos) }}
        </strong>
        <span v-else class="auditoria-resumen__skeleton auditoria-resumen__skeleton--valor" />
        <span class="auditoria-resumen__detalle">{{ textoTipos }}</span>
      </article>

      <article class="auditoria-resumen__tarjeta">
        <span class="auditoria-resumen__etiqueta">Rango consultado</span>
        <strong v-if="!cargando" class="auditoria-resumen__valor">
          {{ rangoDias }} <small>{{ rangoDias === 1 ? "día" : "días" }}</small>
        </strong>
        <span v-else class="auditoria-resumen__skeleton auditoria-resumen__skeleton--valor" />
        <span class="auditoria-resumen__detalle">
          Máximo permitido: {{ rangoMaximo }} días
        </span>
      </article>
    </div>

    <div class="auditoria-resumen__desglose">
      <button
        type="button"
        class="auditoria-resumen__desglose-boton"
        :aria-expanded="desgloseAbierto ? 'true' : 'false'"
        @click="desgloseAbierto = !desgloseAbierto"
      >
        {{ desgloseAbierto ? "Ocultar desglose" : "Ver desglose" }}
        <span class="material-symbols-outlined" aria-hidden="true">
          {{ desgloseAbierto ? "expand_less" : "expand_more" }}
        </span>
      </button>

      <div v-if="desgloseAbierto" class="auditoria-resumen__desglose-contenido">
        <div v-if="resumenError" class="auditoria-resumen__desglose-error">
          {{ resumenError }}
        </div>

        <template v-else>
          <div class="auditoria-resumen__columna">
            <h3>Por tipo de evento</h3>
            <div v-if="desgloseTipos.length" class="auditoria-resumen__lista">
              <div
                v-for="item in desgloseTipos"
                :key="`tipo-${item.codigo}`"
                class="auditoria-resumen__item"
              >
                <span>{{ etiquetaTipo(item) }}</span>
                <span class="auditoria-resumen__total">{{ formatearNumero(item.total) }}</span>
              </div>
            </div>
            <p v-else class="auditoria-resumen__vacio">Sin datos.</p>
          </div>

          <div class="auditoria-resumen__columna">
            <h3>Por entidad</h3>
            <div v-if="desgloseEntidades.length" class="auditoria-resumen__lista">
              <div
                v-for="item in desgloseEntidades"
                :key="`entidad-${item.entidad}`"
                class="auditoria-resumen__item"
              >
                <span>{{ item.entidad || "—" }}</span>
                <span class="auditoria-resumen__total">{{ formatearNumero(item.total) }}</span>
              </div>
            </div>
            <p v-else class="auditoria-resumen__vacio">Sin datos.</p>
          </div>
        </template>
      </div>
    </div>
  </section>
</template>

<script>
import {
  formatearFechaAuditoria,
  diasEntreInclusive,
  AUDITORIA_RANGO_MAX_DIAS,
  CODIGO_SIN_TIPO,
  ETIQUETA_SIN_TIPO,
} from "../../../utils/auditoriaConstants";

/**
 * Resumen agregado de UC-67 (§2.3): tres tarjetas KPI y un panel colapsable
 * con el desglose por tipo de evento y por entidad. En móvil la vista oculta
 * toda la sección, como en el mockup.
 */
export default {
  name: "AuditoriaResumen",
  props: {
    aplicados: { type: Object, default: null },
    resumen: { type: Object, default: null },
    cargando: { type: Boolean, default: false },
    resumenError: { type: String, default: "" },
    catalogo: { type: Array, default: () => [] },
    totalListado: { type: Number, default: 0 },
  },
  data() {
    return {
      desgloseAbierto: false,
      rangoMaximo: AUDITORIA_RANGO_MAX_DIAS,
    };
  },
  computed: {
    total() {
      if (this.resumen?.totalRegistros != null) return Number(this.resumen.totalRegistros);
      return this.totalListado;
    },
    conFiltroTipos() {
      return (this.aplicados?.tipos || []).length > 0;
    },
    cantidadTipos() {
      return this.conFiltroTipos
        ? this.aplicados.tipos.length
        : this.catalogo.length;
    },
    textoTipos() {
      if (this.conFiltroTipos) {
        const cantidad = this.aplicados.tipos.length;
        return `${cantidad} ${cantidad === 1 ? "tipo seleccionado" : "tipos seleccionados"}`;
      }
      return this.catalogo.length
        ? "Todos los tipos activos"
        : "Catálogo no disponible";
    },
    rangoDias() {
      return diasEntreInclusive(
        this.aplicados?.fechaDesde,
        this.aplicados?.fechaHasta
      );
    },
    fechaDesdeCorta() {
      return formatearFechaAuditoria(this.aplicados?.fechaDesde);
    },
    fechaHastaCorta() {
      return formatearFechaAuditoria(this.aplicados?.fechaHasta);
    },
    desgloseTipos() {
      return this.resumen?.porTipoEvento || [];
    },
    desgloseEntidades() {
      return this.resumen?.porEntidad || [];
    },
  },
  methods: {
    formatearNumero(valor) {
      const numero = Number(valor);
      if (!Number.isFinite(numero)) return 0;
      return numero.toLocaleString("es-AR");
    },
    etiquetaTipo(item) {
      return item?.codigo === CODIGO_SIN_TIPO
        ? ETIQUETA_SIN_TIPO
        : item?.nombre || item?.codigo || "—";
    },
  },
};
</script>

<style scoped>
.auditoria-resumen {
  display: grid;
  gap: 0.6rem;
}

.auditoria-resumen__tarjetas {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.auditoria-resumen__tarjeta {
  display: grid;
  gap: 0.2rem;
  align-content: start;
  padding: 1rem 1.15rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: 12px;
}

.auditoria-resumen__etiqueta {
  color: var(--color-text-muted);
  font-size: 0.78rem;
  font-weight: 600;
}

.auditoria-resumen__valor {
  color: var(--color-text);
  font-size: 2.1rem;
  font-weight: 800;
  line-height: 1.15;
}

.auditoria-resumen__valor small {
  color: var(--color-text-muted);
  font-size: 0.95rem;
  font-weight: 600;
}

.auditoria-resumen__detalle {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}

.auditoria-resumen__skeleton {
  display: inline-block;
  width: 5rem;
  height: 1.6rem;
  background: var(--color-skeleton);
  border-radius: 0.4rem;
  animation: auditoria-resumen-pulso 1.2s ease-in-out infinite alternate;
}

.auditoria-resumen__desglose {
  display: grid;
  gap: 0.4rem;
}

.auditoria-resumen__desglose-boton {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  width: fit-content;
  padding: 0.15rem 0;
  color: var(--color-primary);
  background: none;
  border: 0;
  font: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.auditoria-resumen__desglose-contenido {
  display: grid;
  gap: 1rem;
  padding: 0.9rem 1.15rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: 12px;
}

@media (min-width: 720px) {
  .auditoria-resumen__desglose-contenido {
    grid-template-columns: 1fr 1fr;
  }
}

.auditoria-resumen__columna h3 {
  margin: 0 0 0.5rem;
  color: var(--color-text-muted);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.auditoria-resumen__lista {
  display: grid;
  gap: 0.35rem;
}

.auditoria-resumen__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  color: var(--color-text);
  font-size: 0.82rem;
}

.auditoria-resumen__item > span:first-child {
  overflow: hidden;
  min-width: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.auditoria-resumen__total {
  flex: 0 0 auto;
  color: var(--color-text-muted);
  font-weight: 700;
}

.auditoria-resumen__vacio {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.auditoria-resumen__desglose-error {
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

@keyframes auditoria-resumen-pulso {
  from {
    opacity: 1;
  }
  to {
    opacity: 0.55;
  }
}

@media (prefers-reduced-motion: reduce) {
  .auditoria-resumen__skeleton {
    animation: none;
  }
}

@media (max-width: 720px) {
  .auditoria-resumen {
    display: none;
  }
}
</style>
