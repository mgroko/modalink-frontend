<template>
  <section class="disponibilidad-actividad">
    <header class="disponibilidad-actividad__cabecera">
      <h4 class="disponibilidad-actividad__titulo">{{ titulo }}</h4>
      <VaButton
        v-if="!sinFechaEntregaTotal"
        preset="secondary"
        size="small"
        :loading="cargando"
        :disabled="cargando"
        @click="cargar"
      >
        {{ textoReconsultar }}
      </VaButton>
    </header>

    <p v-if="cargando" class="disponibilidad-actividad__nota">
      Consultando disponibilidad...
    </p>

    <BaseAlert v-else-if="error" :message="error" type="error" />

    <div
      v-else-if="sinFechaEntregaTotal"
      class="disponibilidad-actividad__sin-fecha"
      role="status"
    >
      <span class="material-symbols-outlined" aria-hidden="true">
        event_busy
      </span>
      <div>
        <p class="disponibilidad-actividad__sin-fecha-titulo">
          Falta fecha de entrega
        </p>
        <p class="disponibilidad-actividad__sin-fecha-texto">
          No se puede evaluar la disponibilidad hasta que el proyecto tenga una
          fecha de entrega.
        </p>
      </div>
    </div>

    <template v-else-if="resultado">
      <div
        class="disponibilidad-actividad__estado"
        :class="
          resultado.disponible
            ? 'disponibilidad-actividad__estado--ok'
            : 'disponibilidad-actividad__estado--no'
        "
      >
        <span
          class="material-symbols-outlined disponibilidad-actividad__estado-icono"
          aria-hidden="true"
        >
          {{ iconoEstado }}
        </span>

        <div class="disponibilidad-actividad__estado-cuerpo">
          <p class="disponibilidad-actividad__estado-titulo">
            {{ tituloEstado }}
          </p>
          <p class="disponibilidad-actividad__estado-texto">
            {{ textoEstado }}
          </p>

          <p
            v-if="horarioPropuesto"
            class="disponibilidad-actividad__horario"
          >
            <strong>Horario propuesto:</strong> {{ horarioPropuesto }}
          </p>

          <p
            v-if="!resultado.disponible && nombresBloqueantesTexto"
            class="disponibilidad-actividad__bloqueantes"
          >
            Perfiles que no coinciden: {{ nombresBloqueantesTexto }}.
          </p>

          <VaButton
            v-if="mostrarAcciones && !resultado.disponible && metaResultado.accion"
            preset="secondary"
            size="small"
            class="disponibilidad-actividad__accion-motivo"
            @click="ejecutarAccionMotivo"
          >
            {{ textoAccionMotivo }}
          </VaButton>
        </div>
      </div>

      <div class="disponibilidad-actividad__chips">
        <span
          v-if="etiquetaPreferencia"
          class="disponibilidad-actividad__chip"
          :class="{
            'disponibilidad-actividad__chip--ajuste':
              !esPreferenciaExacta && resultado.disponible,
          }"
        >
          {{ etiquetaPreferencia }}
        </span>
        <span
          v-if="resultado.provisional"
          class="disponibilidad-actividad__chip disponibilidad-actividad__chip--provisional"
        >
          Evaluación provisional
        </span>
      </div>

      <p
        v-if="resultado.provisional"
        class="disponibilidad-actividad__nota disponibilidad-actividad__nota--provisional"
      >
        La evaluación es provisional hasta que el proyecto confirme su fecha de
        inicio. El sistema volverá a validar la disponibilidad al confirmar.
      </p>

      <div
        v-if="reprogramacion.length"
        class="disponibilidad-actividad__reprogramacion"
      >
        <p class="disponibilidad-actividad__reprogramacion-titulo">
          Actividades que se moverán
        </p>
        <ul class="disponibilidad-actividad__reprogramacion-lista">
          <li
            v-for="movimiento in reprogramacion"
            :key="movimiento.clave"
          >
            <strong>{{ movimiento.nombre }}</strong>
            <span
              v-if="movimiento.movimiento"
              class="disponibilidad-actividad__movimiento"
            >
              {{ movimiento.movimiento }}
            </span>
          </li>
        </ul>
        <p class="disponibilidad-actividad__reprogramacion-texto">
          Al confirmar la asignación, estas actividades se reprograman y el
          cronograma se recalcula.
        </p>
      </div>
    </template>

    <p v-else class="disponibilidad-actividad__nota">
      Todavía no se consultó la disponibilidad.
    </p>
  </section>
</template>

<script>
import BaseAlert from "../AlertaBase.vue";
import actividadService from "../../services/actividadService.js";
import { esErrorSinFechaEntrega } from "../../utils/cpmConstants.js";
import {
  ACCIONES_MOTIVO_DISPONIBILIDAD,
  etiquetaResultadoPreferencia,
  formatearHorarioDisponibilidad,
  formatearReprogramacion,
  mensajeMotivo,
  metaMotivo,
  normalizarResultado,
} from "../../utils/disponibilidadConstants.js";

/*
 * Panel de disponibilidad (ficha CPM §6 y §10). Consulta de solo lectura: no
 * reserva ni asigna. Si la consulta falla por un error técnico, emite `null`
 * para que el contenedor pueda permitir continuar; el sistema revalida igual.
 *
 * La UI muestra un resumen legible del resultado. No expone ventanas técnicas
 * ni la lista completa de huecos de cada miembro.
 */
export default {
  name: "DisponibilidadActividad",
  components: { BaseAlert },
  props: {
    idProyecto: {
      type: [Number, String],
      required: true,
    },
    idActividad: {
      type: [Number, String],
      required: true,
    },
    /** Array vacío = perfil activo del solicitante (sin `idPerfil`). */
    idPerfiles: {
      type: Array,
      default: () => [],
    },
    titulo: {
      type: String,
      default: "Disponibilidad",
    },
    /**
     * Ajusta el texto del resumen sin cambiar la lógica:
     * postulacion | aceptacion | asignacion | invitacion
     */
    contexto: {
      type: String,
      default: "asignacion",
      validator: (valor) =>
        ["postulacion", "aceptacion", "asignacion", "invitacion"].includes(
          valor
        ),
    },
    autoCargar: {
      type: Boolean,
      default: true,
    },
    /** El proyecto no tiene fecha de entrega: no se consulta ni se evalúa. */
    sinFechaEntrega: {
      type: Boolean,
      default: false,
    },
    /** Sólo el preview de asignación muestra las actividades a mover. */
    mostrarReprogramacion: {
      type: Boolean,
      default: false,
    },
    /** Habilita las acciones sugeridas por `codigoMotivo`. */
    mostrarAcciones: {
      type: Boolean,
      default: false,
    },
    tokenRefresco: {
      type: Number,
      default: 0,
    },
  },
  emits: ["actualizado", "cargando"],
  data() {
    return {
      resultado: null,
      cargando: false,
      error: "",
      sinFechaEntregaError: false,
      idCarga: 0,
    };
  },
  computed: {
    sinFechaEntregaTotal() {
      return this.sinFechaEntrega || this.sinFechaEntregaError;
    },
    mensaje() {
      return mensajeMotivo(
        this.resultado?.codigoMotivo,
        this.resultado?.motivo
      );
    },
    metaResultado() {
      return metaMotivo(this.resultado?.codigoMotivo);
    },
    textoReconsultar() {
      return this.resultado && !this.resultado.disponible
        ? "Volver a consultar"
        : "Reconsultar";
    },
    tituloEstado() {
      if (!this.resultado?.disponible) return "No hay un horario en común";

      if (this.contexto === "postulacion") return "Podés postularte";
      if (this.contexto === "aceptacion") return "Hay disponibilidad";
      if (this.contexto === "invitacion") return "Podés aceptar la invitación";
      return "Hay un horario en común";
    },
    textoEstado() {
      if (!this.resultado?.disponible) return this.mensaje;

      if (this.contexto === "postulacion") {
        return "Tu agenda coincide con la del equipo de esta actividad.";
      }
      if (this.contexto === "aceptacion") {
        return "El postulante y el equipo tienen un horario en común.";
      }
      if (this.contexto === "invitacion") {
        return "Tu agenda coincide con la del equipo de esta actividad.";
      }
      return "Los miembros de la actividad tienen un horario en común.";
    },
    iconoEstado() {
      return this.resultado?.disponible
        ? "check_circle"
        : this.metaResultado.icono;
    },
    horarioPropuesto() {
      if (!this.resultado?.disponible) return "";
      return formatearHorarioDisponibilidad(
        this.resultado?.inicioSeleccionado,
        this.resultado?.finSeleccionado
      );
    },
    miembrosBloqueantesNombres() {
      const bloqueantes = Array.isArray(
        this.resultado?.miembrosBloqueantes
      )
        ? this.resultado.miembrosBloqueantes
        : [];
      if (!bloqueantes.length) return [];

      const ids = new Set(bloqueantes.map((id) => String(id)));
      const miembros = Array.isArray(this.resultado?.miembros)
        ? this.resultado.miembros
        : [];

      return miembros
        .filter(
          (miembro) =>
            ids.has(String(miembro.idUsuario)) ||
            ids.has(String(miembro.idPerfil))
        )
        .map((miembro) => miembro.nombreArtistico)
        .filter(Boolean);
    },
    nombresBloqueantesTexto() {
      const nombres = this.miembrosBloqueantesNombres;
      if (!nombres.length) return "";
      if (nombres.length <= 3) return nombres.join(", ");
      return `${nombres.slice(0, 3).join(", ")} y ${
        nombres.length - 3
      } más`;
    },
    textoAccionMotivo() {
      if (
        this.metaResultado.accion ===
        ACCIONES_MOTIVO_DISPONIBILIDAD.CALENDARIO
      ) {
        return "Revisar calendario";
      }
      if (
        this.metaResultado.accion ===
        ACCIONES_MOTIVO_DISPONIBILIDAD.CRONOGRAMA
      ) {
        return "Ver cronograma";
      }
      return "";
    },
    reprogramacion() {
      if (!this.mostrarReprogramacion) return [];
      const lista = Array.isArray(this.resultado?.reprogramacionPropuesta)
        ? this.resultado.reprogramacionPropuesta
        : [];
      return lista.map((actividad, indice) => ({
        clave: `${actividad?.idActividad ?? "actividad"}-${indice}`,
        ...formatearReprogramacion(actividad),
      }));
    },
    etiquetaPreferencia() {
      return etiquetaResultadoPreferencia(
        this.resultado?.resultadoPreferencia,
        this.resultado?.desvioMinutos
      );
    },
    esPreferenciaExacta() {
      return this.resultado?.resultadoPreferencia === "EXACTO";
    },
  },
  watch: {
    idProyecto() {
      this.reconsultarSiCorresponde();
    },
    idActividad() {
      this.reconsultarSiCorresponde();
    },
    idPerfiles: {
      deep: true,
      handler() {
        this.reconsultarSiCorresponde();
      },
    },
    tokenRefresco() {
      this.reconsultarSiCorresponde();
    },
    sinFechaEntrega(valor) {
      this.sinFechaEntregaError = false;
      this.resultado = null;
      this.error = "";
      if (valor) {
        this.abortar();
        this.cargando = false;
        this.$emit("actualizado", null);
        return;
      }
      if (this.autoCargar) this.cargar();
    },
  },
  created() {
    this.controlador = null;
  },
  mounted() {
    if (this.autoCargar && !this.sinFechaEntregaTotal) this.cargar();
  },
  beforeUnmount() {
    this.abortar();
  },
  methods: {
    reconsultarSiCorresponde() {
      if (this.autoCargar) this.cargar();
    },
    ejecutarAccionMotivo() {
      const accion = this.metaResultado.accion;
      if (accion === ACCIONES_MOTIVO_DISPONIBILIDAD.CALENDARIO) {
        this.$router.push({ name: "calendario" });
        return;
      }
      if (accion === ACCIONES_MOTIVO_DISPONIBILIDAD.CRONOGRAMA) {
        this.$router.push({
          name: "dashboard-proyecto",
          params: { id: this.idProyecto },
          query: { tab: "planificacion", vista: "cronograma" },
        });
      }
    },
    async cargar() {
      if (this.idProyecto == null || this.idActividad == null) return;
      if (this.sinFechaEntrega) {
        this.abortar();
        this.cargando = false;
        this.resultado = null;
        this.error = "";
        this.sinFechaEntregaError = false;
        this.$emit("actualizado", null);
        return;
      }

      const corrida = ++this.idCarga;
      this.abortar();
      this.controlador = new AbortController();

      this.cargando = true;
      this.error = "";
      this.sinFechaEntregaError = false;
      this.$emit("cargando", true);

      try {
        const response = await actividadService.obtenerDisponibilidad(
          this.idProyecto,
          this.idActividad,
          { idPerfil: this.idPerfiles },
          this.controlador.signal
        );
        if (corrida !== this.idCarga) return;

        this.resultado = normalizarResultado(response?.data);
        this.$emit("actualizado", this.resultado);
      } catch (error) {
        if (this.esCancelacion(error) || corrida !== this.idCarga) return;

        this.resultado = null;
        this.sinFechaEntregaError = esErrorSinFechaEntrega(error);
        this.error = this.sinFechaEntregaError ? "" : this.mensajeError(error);
        this.$emit("actualizado", null);
      } finally {
        if (corrida === this.idCarga) {
          this.cargando = false;
          this.$emit("cargando", false);
        }
      }
    },
    mensajeError(error) {
      const status = error?.response?.status;
      const mensaje = error?.response?.data?.message || "";

      if (status === 401) {
        return "Tu sesión expiró. Iniciá sesión nuevamente.";
      }
      if (status === 403) {
        return (
          mensaje ||
          "No tenés permiso para consultar la disponibilidad de otros perfiles."
        );
      }
      if (status === 404) {
        return mensaje || "La actividad o el proyecto ya no están disponibles.";
      }
      if (status === 409) {
        return mensaje || "La actividad está cancelada.";
      }
      if (status === 400) {
        return mensaje || "No se pudo consultar la disponibilidad.";
      }
      return "No pudimos verificar la disponibilidad. El sistema volverá a validarla al confirmar.";
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
  },
};
</script>

<style scoped>
.disponibilidad-actividad {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  margin-top: 0.85rem;
  padding: 0.9rem 1rem;
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border);
  border-radius: 10px;
}

.disponibilidad-actividad__cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.disponibilidad-actividad__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 0.9rem;
  font-weight: 700;
}

.disponibilidad-actividad__nota {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.8rem;
  line-height: 1.5;
}

.disponibilidad-actividad__nota--provisional {
  margin-top: -0.15rem;
  font-size: 0.76rem;
}

.disponibilidad-actividad__sin-fecha {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.75rem 0.8rem;
  color: var(--color-warning-text);
  background: var(--color-warning-soft);
  border: 1px solid var(--color-warning-border);
  border-radius: 9px;
}

.disponibilidad-actividad__sin-fecha .material-symbols-outlined {
  flex: 0 0 auto;
  font-size: 1.15rem;
}

.disponibilidad-actividad__sin-fecha-titulo {
  margin: 0 0 0.15rem;
  font-size: 0.82rem;
  font-weight: 700;
}

.disponibilidad-actividad__sin-fecha-texto {
  margin: 0;
  font-size: 0.78rem;
  line-height: 1.45;
}

.disponibilidad-actividad__estado {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  padding: 0.8rem 0.85rem;
  border: 1px solid;
  border-radius: 9px;
}

.disponibilidad-actividad__estado--ok {
  color: var(--color-success-text);
  background: var(--color-success-soft);
  border-color: var(--color-success-border);
}

.disponibilidad-actividad__estado--no {
  color: var(--color-warning-text);
  background: var(--color-warning-soft);
  border-color: var(--color-warning-border);
}

.disponibilidad-actividad__estado-icono {
  flex: 0 0 auto;
  font-size: 1.2rem;
}

.disponibilidad-actividad__estado-cuerpo {
  display: grid;
  gap: 0.25rem;
  min-width: 0;
}

.disponibilidad-actividad__estado-titulo {
  margin: 0;
  font-size: 0.88rem;
  font-weight: 700;
  line-height: 1.3;
}

.disponibilidad-actividad__estado-texto {
  margin: 0;
  color: var(--color-text);
  font-size: 0.79rem;
  line-height: 1.5;
}

.disponibilidad-actividad__horario {
  margin: 0.1rem 0 0;
  color: var(--color-text);
  font-size: 0.79rem;
  line-height: 1.45;
}

.disponibilidad-actividad__bloqueantes {
  margin: 0.1rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.76rem;
  line-height: 1.45;
}

.disponibilidad-actividad__accion-motivo {
  justify-self: start;
  margin-top: 0.15rem;
}

.disponibilidad-actividad__chips {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.disponibilidad-actividad__chip {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.5rem;
  color: var(--color-success-text);
  background: var(--color-success-soft);
  border: 1px solid var(--color-success-border);
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 600;
}

.disponibilidad-actividad__chip--ajuste,
.disponibilidad-actividad__chip--provisional {
  color: var(--color-warning-text);
  background: var(--color-warning-soft);
  border-color: var(--color-warning-border);
}

.disponibilidad-actividad__reprogramacion {
  padding: 0.75rem 0.85rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: 9px;
}

.disponibilidad-actividad__reprogramacion-titulo {
  margin: 0 0 0.35rem;
  color: var(--color-text);
  font-size: 0.8rem;
  font-weight: 700;
}

.disponibilidad-actividad__reprogramacion-lista {
  display: grid;
  gap: 0.25rem;
  margin: 0;
  padding-left: 1.1rem;
  color: var(--color-text);
  font-size: 0.77rem;
  line-height: 1.45;
}

.disponibilidad-actividad__movimiento {
  color: var(--color-text-muted);
}

.disponibilidad-actividad__reprogramacion-texto {
  margin: 0.35rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.74rem;
  line-height: 1.45;
}
</style>
