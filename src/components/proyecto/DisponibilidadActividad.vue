<template>
  <section class="disponibilidad-actividad">
    <header class="disponibilidad-actividad__cabecera">
      <h4 class="disponibilidad-actividad__titulo">{{ titulo }}</h4>
      <VaButton
        preset="secondary"
        size="small"
        :loading="cargando"
        :disabled="cargando"
        @click="cargar"
      >
        Reconsultar
      </VaButton>
    </header>

    <p v-if="cargando" class="disponibilidad-actividad__nota">
      Consultando disponibilidad...
    </p>

    <BaseAlert v-else-if="error" :message="error" type="error" />

    <template v-else-if="resultado">
      <div class="disponibilidad-actividad__badges">
        <span
          class="disponibilidad-actividad__badge"
          :class="
            resultado.disponible
              ? 'disponibilidad-actividad__badge--ok'
              : 'disponibilidad-actividad__badge--no'
          "
        >
          {{ resultado.disponible ? "Disponible" : "Sin disponibilidad" }}
        </span>
        <span
          v-if="resultado.provisional"
          class="disponibilidad-actividad__badge disponibilidad-actividad__badge--provisional"
        >
          Provisional
        </span>
      </div>

      <dl class="disponibilidad-actividad__detalle">
        <div>
          <dt>Ventana evaluada</dt>
          <dd>{{ ventanaEvaluada }}</dd>
        </div>
        <div>
          <dt>Hueco seleccionado</dt>
          <dd>{{ huecoSeleccionado }}</dd>
        </div>
      </dl>

      <p
        v-if="!resultado.disponible"
        class="disponibilidad-actividad__motivo"
      >
        <span class="material-symbols-outlined" aria-hidden="true">info</span>
        {{ mensaje }}
      </p>

      <p
        v-if="resultado.provisional"
        class="disponibilidad-actividad__nota disponibilidad-actividad__nota--provisional"
      >
        La evaluación es provisional porque el proyecto todavía no confirmó su
        fecha de inicio. El sistema volverá a validar la disponibilidad al
        confirmar la postulación o asignación.
      </p>

      <div v-if="miembros.length" class="disponibilidad-actividad__miembros">
        <h5 class="disponibilidad-actividad__subtitulo">
          Detalle por miembro
        </h5>

        <article
          v-for="(miembro, indice) in miembros"
          :key="`${miembro.idUsuario ?? 'miembro'}-${indice}`"
          class="disponibilidad-actividad__miembro"
        >
          <header class="disponibilidad-actividad__miembro-cabecera">
            <strong>
              {{
                miembro.idUsuario != null
                  ? `Perfil #${miembro.idUsuario}`
                  : "Miembro"
              }}
            </strong>
            <span
              class="disponibilidad-actividad__badge"
              :class="
                miembro.disponible
                  ? 'disponibilidad-actividad__badge--ok'
                  : 'disponibilidad-actividad__badge--no'
              "
            >
              {{ miembro.disponible ? "Disponible" : "Sin disponibilidad" }}
            </span>
          </header>

          <p class="disponibilidad-actividad__miembro-texto">
            Ventana: {{ formatearVentana(miembro.inicioEvaluado, miembro.finEvaluado) }}
          </p>

          <p
            v-if="miembro.huecos.length"
            class="disponibilidad-actividad__miembro-texto"
          >
            Huecos:
            {{ formatearHuecos(miembro.huecos).map((hueco) => hueco.texto).join(" · ") }}
          </p>

          <p
            v-else
            class="disponibilidad-actividad__miembro-texto disponibilidad-actividad__miembro-texto--vacio"
          >
            Sin huecos en la ventana evaluada.
          </p>

          <p
            v-if="miembro.motivo"
            class="disponibilidad-actividad__miembro-texto disponibilidad-actividad__miembro-texto--motivo"
          >
            {{ mensajeMotivo(miembro.motivo) }}
          </p>
        </article>
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
import {
  formatearHuecos,
  formatearVentana,
  mensajeMotivo,
  normalizarResultado,
} from "../../utils/disponibilidadConstants.js";

/*
 * Panel de disponibilidad (ficha CPM §6 y §10). Consulta de solo lectura: no
 * reserva ni asigna. Si la consulta falla por un error técnico, emite `null`
 * para que el contenedor pueda permitir continuar; el sistema revalida igual.
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
    autoCargar: {
      type: Boolean,
      default: true,
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
      idCarga: 0,
    };
  },
  computed: {
    miembros() {
      return this.resultado?.miembros || [];
    },
    ventanaEvaluada() {
      return formatearVentana(
        this.resultado?.inicioEvaluado,
        this.resultado?.finEvaluado
      );
    },
    huecoSeleccionado() {
      if (
        this.resultado?.inicioSeleccionado == null &&
        this.resultado?.finSeleccionado == null
      ) {
        return "Sin hueco seleccionado";
      }
      return formatearVentana(
        this.resultado?.inicioSeleccionado,
        this.resultado?.finSeleccionado
      );
    },
    mensaje() {
      return mensajeMotivo(this.resultado?.motivo);
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
  },
  created() {
    this.controlador = null;
  },
  mounted() {
    if (this.autoCargar) this.cargar();
  },
  beforeUnmount() {
    this.abortar();
  },
  methods: {
    formatearVentana,
    formatearHuecos,
    mensajeMotivo,
    reconsultarSiCorresponde() {
      if (this.autoCargar) this.cargar();
    },
    async cargar() {
      if (this.idProyecto == null || this.idActividad == null) return;

      const corrida = ++this.idCarga;
      this.abortar();
      this.controlador = new AbortController();

      this.cargando = true;
      this.error = "";
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
        this.error = this.mensajeError(error);
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
  gap: 0.6rem;
  margin-top: 0.85rem;
  padding: 0.9rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface-muted);
}

.disponibilidad-actividad__cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.disponibilidad-actividad__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 0.86rem;
  font-weight: 700;
}

.disponibilidad-actividad__subtitulo {
  margin: 0 0 0.45rem;
  color: var(--color-text);
  font-size: 0.78rem;
  font-weight: 700;
}

.disponibilidad-actividad__badges {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.disponibilidad-actividad__badge {
  display: inline-block;
  padding: 0.12rem 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
}

.disponibilidad-actividad__badge--ok {
  border-color: var(--color-success-border);
  background: var(--color-success-soft);
  color: var(--color-success-text);
}

.disponibilidad-actividad__badge--no {
  border-color: var(--color-danger-border);
  background: var(--color-danger-soft);
  color: var(--color-danger-text);
}

.disponibilidad-actividad__badge--provisional {
  border-color: var(--color-warning-border);
  background: var(--color-warning-soft);
  color: var(--color-warning-text);
}

.disponibilidad-actividad__detalle {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.5rem;
  margin: 0;
}

.disponibilidad-actividad__detalle div {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.disponibilidad-actividad__detalle dt {
  color: var(--color-text-muted);
  font-size: 0.72rem;
  font-weight: 600;
}

.disponibilidad-actividad__detalle dd {
  margin: 0;
  color: var(--color-text);
  font-size: 0.8rem;
}

.disponibilidad-actividad__nota {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.78rem;
  line-height: 1.45;
}

.disponibilidad-actividad__nota--provisional {
  color: var(--color-warning-text);
}

.disponibilidad-actividad__motivo {
  display: flex;
  align-items: flex-start;
  gap: 0.35rem;
  margin: 0;
  padding: 0.55rem 0.65rem;
  border: 1px solid var(--color-danger-border);
  border-radius: 8px;
  background: var(--color-danger-soft);
  color: var(--color-danger-text);
  font-size: 0.78rem;
  line-height: 1.45;
}

.disponibilidad-actividad__motivo .material-symbols-outlined {
  font-size: 1rem;
}

.disponibilidad-actividad__miembros {
  margin-top: 0.35rem;
  padding-top: 0.6rem;
  border-top: 1px solid var(--color-border-soft);
}

.disponibilidad-actividad__miembro {
  padding: 0.55rem 0.65rem;
  border: 1px solid var(--color-border-soft);
  border-radius: 8px;
  background: var(--color-surface);
}

.disponibilidad-actividad__miembro + .disponibilidad-actividad__miembro {
  margin-top: 0.45rem;
}

.disponibilidad-actividad__miembro-cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  color: var(--color-text);
  font-size: 0.8rem;
}

.disponibilidad-actividad__miembro-texto {
  margin: 0.25rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.76rem;
  line-height: 1.4;
}

.disponibilidad-actividad__miembro-texto--vacio {
  font-style: italic;
}

.disponibilidad-actividad__miembro-texto--motivo {
  color: var(--color-danger-text);
}
</style>
