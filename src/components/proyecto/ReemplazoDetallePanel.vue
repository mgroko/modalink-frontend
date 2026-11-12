<template>
  <section class="reemplazo-detalle">
    <div v-if="cargando" class="reemplazo-detalle__mensaje">
      Cargando detalle del reemplazo...
    </div>

    <template v-else>
      <BaseAlert v-if="error" :message="error" type="error" />

      <div v-if="error && puedeReintentar" class="reemplazo-detalle__reintento">
        <VaButton preset="primary" size="small" @click="$emit('reintentar')">
          Reintentar
        </VaButton>
      </div>

      <div v-if="!detalle && !error" class="reemplazo-detalle__mensaje">
        Seleccioná un proceso para ver su detalle.
      </div>

      <template v-if="reemplazo">
        <header class="reemplazo-detalle__cabecera">
          <div class="reemplazo-detalle__identidad">
            <p class="reemplazo-detalle__eyebrow">
              {{ etiquetaTipoReemplazo(reemplazo.tipo) }}
              <span aria-hidden="true">·</span>
              {{ etiquetaOrigenReemplazo(reemplazo.origen) }}
            </p>
            <h3 class="reemplazo-detalle__titulo">
              {{ descripcionVacante(reemplazo) }}
            </h3>
            <p class="reemplazo-detalle__subtitulo">
              {{ detalleVacante(reemplazo) }}
            </p>

            <div class="reemplazo-detalle__meta">
              <span
                class="reemplazo-detalle__estado"
                :class="`reemplazo-detalle__estado--${tonoEstado}`"
              >
                {{ etiquetaEstadoReemplazo(reemplazo.estado) }}
              </span>
              <span>Proyecto: {{ reemplazo.nombreProyecto }}</span>
              <span v-if="reemplazo.perfilBaja">
                Baja de {{ reemplazo.perfilBaja }}
              </span>
              <span>Creado: {{ fechaCreacion }}</span>
              <span v-if="reemplazo.fechaCierre">
                Cerrado: {{ fechaCierre }}
              </span>
              <span v-if="reemplazo.motivoCierre">
                Motivo de cierre: {{ reemplazo.motivoCierre }}
              </span>
              <span>
                {{ reemplazo.totalCandidatos }} candidatos ·
                {{ reemplazo.totalInvitados }} invitados
              </span>
            </div>
          </div>

          <div class="reemplazo-detalle__acciones">
            <VaButton
              v-if="puedeConfirmar"
              preset="primary"
              size="small"
              :disabled="procesando"
              @click="confirmarSeleccion"
            >
              {{ etiquetaConfirmar }}
            </VaButton>
            <VaButton
              v-if="puedeRegenerar"
              preset="secondary"
              size="small"
              :disabled="procesando"
              @click="$emit('regenerar')"
            >
              Regenerar candidatos
            </VaButton>
            <VaButton
              v-if="puedeCancelar"
              preset="secondary"
              color="danger"
              size="small"
              :disabled="procesando"
              @click="$emit('cancelar')"
            >
              Cancelar proceso
            </VaButton>
          </div>
        </header>

        <div
          v-if="reemplazo.estado === ESTADOS_REEMPLAZO.SIN_CANDIDATOS"
          class="reemplazo-detalle__aviso"
        >
          El proceso quedó sin candidatos. Podés regenerar la búsqueda o
          cancelar el proceso.
        </div>

        <div
          v-if="reemplazo.estado === ESTADOS_REEMPLAZO.PENDIENTE_APROBACION"
          class="reemplazo-detalle__aviso reemplazo-detalle__aviso--info"
        >
          {{ textoAvisoAprobacion }}
        </div>

        <section
          v-if="aceptados.length"
          class="reemplazo-detalle__seccion"
        >
          <h4 class="reemplazo-detalle__seccion-titulo">
            Pendientes de aprobación
          </h4>
          <div class="reemplazo-detalle__lista">
            <CandidatoReemplazoCard
              v-for="candidato in aceptados"
              :key="candidato.idCandidato"
              :candidato="candidato"
              mostrar-acciones-decision
              :procesando="procesando"
              @aprobar="$emit('aprobar', $event)"
              @rechazar="$emit('rechazar', $event)"
            />
          </div>
        </section>

        <section
          v-if="propuestos.length"
          class="reemplazo-detalle__seccion"
        >
          <header class="reemplazo-detalle__seccion-cabecera">
            <div>
              <h4 class="reemplazo-detalle__seccion-titulo">
                Candidatos propuestos
              </h4>
              <p class="reemplazo-detalle__seccion-resumen">
                {{ textoResumenPropuestos }}
              </p>
            </div>
            <div
              class="reemplazo-detalle__leyenda"
              aria-label="Referencia de coincidencia de requisitos"
            >
              <span
                class="reemplazo-detalle__leyenda-item reemplazo-detalle__leyenda-item--success"
              >
                <span class="material-symbols-outlined" aria-hidden="true">
                  check_circle
                </span>
                Cumple lo pedido
              </span>
              <span
                class="reemplazo-detalle__leyenda-item reemplazo-detalle__leyenda-item--warning"
              >
                <span class="material-symbols-outlined" aria-hidden="true">
                  warning
                </span>
                Difiere o falta
              </span>
              <span
                class="reemplazo-detalle__leyenda-item reemplazo-detalle__leyenda-item--neutral"
              >
                <span class="material-symbols-outlined" aria-hidden="true">
                  remove_circle
                </span>
                Sin requisito
              </span>
            </div>
          </header>
          <div class="reemplazo-detalle__lista">
            <CandidatoReemplazoCard
              v-for="candidato in propuestos"
              :key="candidato.idCandidato"
              :candidato="candidato"
              :mejor-opcion="
                String(candidato.idCandidato) === String(mejorOpcionId)
              "
              seleccionable
              :seleccionado="estaSeleccionado(candidato)"
              @seleccionar="alternarSeleccion"
            />
          </div>
        </section>

        <section
          v-if="invitados.length"
          class="reemplazo-detalle__seccion"
        >
          <h4 class="reemplazo-detalle__seccion-titulo">
            Invitaciones enviadas
          </h4>
          <div class="reemplazo-detalle__lista">
            <CandidatoReemplazoCard
              v-for="candidato in invitados"
              :key="candidato.idCandidato"
              :candidato="candidato"
            />
          </div>
        </section>

        <section
          v-if="cerrados.length"
          class="reemplazo-detalle__seccion"
        >
          <h4 class="reemplazo-detalle__seccion-titulo">
            Historial del proceso
          </h4>
          <div class="reemplazo-detalle__lista">
            <CandidatoReemplazoCard
              v-for="candidato in cerrados"
              :key="candidato.idCandidato"
              :candidato="candidato"
            />
          </div>
        </section>

        <p
          v-if="!candidatos.length && !esSinCandidatos"
          class="reemplazo-detalle__vacio"
        >
          Este proceso todavía no tiene candidatos.
        </p>
      </template>
    </template>
  </section>
</template>

<script>
import BaseAlert from "../AlertaBase.vue";
import CandidatoReemplazoCard from "./CandidatoReemplazoCard.vue";
import { formatearFecha } from "../../utils/fechas.js";
import {
  ESTADOS_CANDIDATO_REEMPLAZO,
  ESTADOS_REEMPLAZO,
  candidatoCumpleTodo,
  descripcionVacante,
  detalleVacante,
  etiquetaAccionConfirmarReemplazo,
  etiquetaEstadoReemplazo,
  etiquetaOrigenReemplazo,
  etiquetaTipoReemplazo,
  mejorCandidatoReemplazo,
  puedeCancelarReemplazo,
  puedeConfirmarReemplazo,
  puedeRegenerarReemplazo,
  puntajeNumericoReemplazo,
  tonoEstadoReemplazo,
} from "../../utils/reemplazoConstants.js";

export default {
  name: "ReemplazoDetallePanel",
  components: { BaseAlert, CandidatoReemplazoCard },
  props: {
    detalle: {
      type: Object,
      default: null,
    },
    cargando: {
      type: Boolean,
      default: false,
    },
    error: {
      type: String,
      default: "",
    },
    puedeReintentar: {
      type: Boolean,
      default: false,
    },
    procesando: {
      type: Boolean,
      default: false,
    },
  },
  emits: [
    "cancelar",
    "confirmar",
    "aprobar",
    "rechazar",
    "regenerar",
    "reintentar",
  ],
  data() {
    return {
      ESTADOS_REEMPLAZO,
      seleccionadosPropuestos: [],
    };
  },
  computed: {
    reemplazo() {
      return this.detalle?.reemplazo || null;
    },
    candidatos() {
      return Array.isArray(this.detalle?.candidatos)
        ? this.detalle.candidatos
        : [];
    },
    propuestos() {
      return this.candidatos.filter(
        (candidato) =>
          candidato?.estado === ESTADOS_CANDIDATO_REEMPLAZO.PROPUESTO
      );
    },
    invitados() {
      return this.candidatos.filter(
        (candidato) =>
          candidato?.estado === ESTADOS_CANDIDATO_REEMPLAZO.INVITADO
      );
    },
    aceptados() {
      return this.candidatos.filter(
        (candidato) =>
          candidato?.estado ===
          ESTADOS_CANDIDATO_REEMPLAZO.ACEPTADO_PENDIENTE_APROBACION
      );
    },
    cerrados() {
      const abiertos = new Set([
        ESTADOS_CANDIDATO_REEMPLAZO.PROPUESTO,
        ESTADOS_CANDIDATO_REEMPLAZO.INVITADO,
        ESTADOS_CANDIDATO_REEMPLAZO.ACEPTADO_PENDIENTE_APROBACION,
      ]);
      return this.candidatos.filter(
        (candidato) => !abiertos.has(candidato?.estado)
      );
    },
    estado() {
      return this.reemplazo?.estado || "";
    },
    tonoEstado() {
      return tonoEstadoReemplazo(this.estado);
    },
    puedeConfirmar() {
      return (
        puedeConfirmarReemplazo(this.estado) && this.propuestos.length > 0
      );
    },
    etiquetaConfirmar() {
      const etiqueta = etiquetaAccionConfirmarReemplazo(this.estado);
      const cantidad = this.seleccionadosPropuestos.length;
      return cantidad ? `${etiqueta} (${cantidad})` : etiqueta;
    },
    mejorOpcionId() {
      const mejor = mejorCandidatoReemplazo(this.propuestos);
      if (!mejor || puntajeNumericoReemplazo(mejor) == null) return null;
      return mejor.idCandidato;
    },
    cumpleTodoCount() {
      return this.propuestos.filter(
        (candidato) =>
          puntajeNumericoReemplazo(candidato) != null &&
          candidatoCumpleTodo(candidato)
      ).length;
    },
    textoResumenPropuestos() {
      const total = this.propuestos.length;
      const cumple = this.cumpleTodoCount;
      const candidatos = `${total} candidato${total === 1 ? "" : "s"}`;
      const cumpleTexto =
        cumple === 1
          ? "1 cumple todo lo pedido"
          : `${cumple} cumplen todo lo pedido`;
      return `${candidatos} · ${cumpleTexto}`;
    },
    puedeRegenerar() {
      return puedeRegenerarReemplazo(this.estado);
    },
    puedeCancelar() {
      return puedeCancelarReemplazo(this.estado);
    },
    esSinCandidatos() {
      return this.estado === ESTADOS_REEMPLAZO.SIN_CANDIDATOS;
    },
    textoAvisoAprobacion() {
      const cantidad = this.aceptados.length;
      if (cantidad <= 1) {
        return "Hay un candidato que aceptó la invitación. Aprobá o rechazá su incorporación para cerrar el proceso.";
      }
      return `Hay ${cantidad} candidatos que aceptaron la invitación. Elegí a cuál incorporar; al aprobarlo, las demás invitaciones se cancelan.`;
    },
    fechaCreacion() {
      return this.reemplazo?.fechaCreacion
        ? formatearFecha(this.reemplazo.fechaCreacion)
        : "";
    },
    fechaCierre() {
      return this.reemplazo?.fechaCierre
        ? formatearFecha(this.reemplazo.fechaCierre)
        : "";
    },
  },
  watch: {
    propuestos(nuevos) {
      const ids = new Set(
        (nuevos || []).map((candidato) => String(candidato.idCandidato))
      );
      this.seleccionadosPropuestos = this.seleccionadosPropuestos.filter(
        (id) => ids.has(String(id))
      );
    },
  },
  methods: {
    descripcionVacante,
    detalleVacante,
    etiquetaEstadoReemplazo,
    etiquetaOrigenReemplazo,
    etiquetaTipoReemplazo,
    estaSeleccionado(candidato) {
      return this.seleccionadosPropuestos.some(
        (id) => String(id) === String(candidato?.idCandidato)
      );
    },
    alternarSeleccion(candidato) {
      const id = candidato?.idCandidato;
      if (id == null) return;
      const existe = this.seleccionadosPropuestos.some(
        (seleccionado) => String(seleccionado) === String(id)
      );
      this.seleccionadosPropuestos = existe
        ? this.seleccionadosPropuestos.filter(
            (seleccionado) => String(seleccionado) !== String(id)
          )
        : [...this.seleccionadosPropuestos, id];
    },
    confirmarSeleccion() {
      this.$emit("confirmar", {
        idsCandidatos: [...this.seleccionadosPropuestos],
      });
    },
  },
};
</script>

<style scoped>
.reemplazo-detalle {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
}

.reemplazo-detalle__mensaje {
  padding: 1.5rem 1rem;
  color: var(--color-text-muted);
  font-size: 0.86rem;
  text-align: center;
}

.reemplazo-detalle__reintento {
  display: flex;
  justify-content: flex-start;
}

.reemplazo-detalle__cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 1rem 1.1rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface-soft);
}

.reemplazo-detalle__identidad {
  flex: 1 1 18rem;
  min-width: 0;
}

.reemplazo-detalle__eyebrow {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.reemplazo-detalle__titulo {
  margin: 0.2rem 0 0;
  color: var(--color-text);
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1.3;
}

.reemplazo-detalle__subtitulo {
  margin: 0.15rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.reemplazo-detalle__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.35rem 0.8rem;
  margin-top: 0.55rem;
  color: var(--color-text-muted);
  font-size: 0.74rem;
}

.reemplazo-detalle__estado {
  display: inline-flex;
  align-items: center;
  padding: 0.1rem 0.5rem;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 0.66rem;
  font-weight: 700;
  line-height: 1.6;
}

.reemplazo-detalle__estado--warning {
  border-color: var(--color-warning-border);
  background: var(--color-warning-soft);
  color: var(--color-warning-text);
}

.reemplazo-detalle__estado--info {
  border-color: var(--color-info-border);
  background: var(--color-info-soft);
  color: var(--color-info-text);
}

.reemplazo-detalle__estado--success {
  border-color: var(--color-success-border);
  background: var(--color-success-soft);
  color: var(--color-success-text);
}

.reemplazo-detalle__estado--danger {
  border-color: var(--color-danger-border);
  background: var(--color-danger-soft);
  color: var(--color-danger-text);
}

.reemplazo-detalle__estado--neutral {
  border-color: var(--color-border);
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
}

.reemplazo-detalle__acciones {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.reemplazo-detalle__aviso {
  padding: 0.65rem 0.8rem;
  border: 1px solid var(--color-warning-border);
  border-radius: 8px;
  background: var(--color-warning-soft);
  color: var(--color-warning-text);
  font-size: 0.8rem;
  line-height: 1.5;
}

.reemplazo-detalle__aviso--info {
  border-color: var(--color-info-border);
  background: var(--color-info-soft);
  color: var(--color-info-text);
}

.reemplazo-detalle__seccion {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.reemplazo-detalle__seccion-cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem 1rem;
  flex-wrap: wrap;
}

.reemplazo-detalle__seccion-titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 0.88rem;
  font-weight: 700;
}

.reemplazo-detalle__seccion-resumen {
  margin: 0.2rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.78rem;
}

.reemplazo-detalle__leyenda {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.reemplazo-detalle__leyenda-item {
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
  padding: 0.2rem 0.55rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
}

.reemplazo-detalle__leyenda-item .material-symbols-outlined {
  font-size: 0.95rem;
}

.reemplazo-detalle__leyenda-item--success {
  border-color: var(--color-success-border);
  background: var(--color-success-soft);
  color: var(--color-success-text);
}

.reemplazo-detalle__leyenda-item--warning {
  border-color: var(--color-warning-border);
  background: var(--color-warning-soft);
  color: var(--color-warning-text);
}

.reemplazo-detalle__leyenda-item--neutral {
  border-color: var(--color-border);
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
}

.reemplazo-detalle__lista {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.reemplazo-detalle__vacio {
  margin: 0;
  padding: 1.1rem;
  border: 1px dashed var(--color-border);
  border-radius: 9px;
  color: var(--color-text-muted);
  font-size: 0.82rem;
  text-align: center;
}

@media (max-width: 720px) {
  .reemplazo-detalle__cabecera {
    flex-direction: column;
  }

  .reemplazo-detalle__acciones {
    width: 100%;
  }
}
</style>
