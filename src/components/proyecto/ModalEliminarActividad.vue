<template>
  <VaModal
    :model-value="modelValue"
    hide-default-actions
    :no-dismiss="eliminando"
    blur
    size="medium"
    class="eliminar-actividad-modal"
    @update:model-value="onCambioVisibilidad"
  >
    <template #header>
      <h3 class="va-h5 eliminar-actividad-modal__titulo">
        Eliminar actividad
      </h3>
    </template>

    <p class="eliminar-actividad-modal__intro">
      Se eliminará la actividad
      <strong>{{ nombreActividad }}</strong>
      <template v-if="nombreProyecto">
        del proyecto <strong>{{ nombreProyecto }}</strong>
      </template>
      y se recalculará el cronograma.
    </p>

    <dl class="eliminar-actividad-modal__ficha">
      <div class="eliminar-actividad-modal__fila-dato">
        <dt>Descripción</dt>
        <dd>{{ actividad.descripcion || "—" }}</dd>
      </div>
      <div class="eliminar-actividad-modal__fila-dato">
        <dt>Fechas</dt>
        <dd>{{ fechasActividad }}</dd>
      </div>
      <div class="eliminar-actividad-modal__fila-dato">
        <dt>Estado</dt>
        <dd>{{ etiquetaEstadoActividad(actividad.estado) || "—" }}</dd>
      </div>
    </dl>

    <ul class="eliminar-actividad-modal__advertencias">
      <li>La actividad se eliminará físicamente de la planificación.</li>
      <li>Las predecesoras se conectarán directamente con sus sucesoras.</li>
      <li>
        Los integrantes marcados <strong>Eliminar</strong> saldrán del proyecto
        y recibirán una notificación con el motivo de baja.
      </li>
      <li>
        Los integrantes marcados <strong>Guardar</strong> continuarán en el
        proyecto y recibirán un aviso de continuidad.
      </li>
      <li>
        Los integrantes con otras actividades del proyecto se conservan
        automáticamente.
      </li>
      <li>
        Se eliminan las asignaciones, postulaciones e invitaciones vinculadas a
        sus requerimientos.
      </li>
    </ul>

    <BaseAlert
      v-if="errorCarga"
      :message="errorCarga"
      type="error"
      class="eliminar-actividad-modal__alerta"
    />

    <div v-if="errorCarga && puedeReintentarCarga" class="eliminar-actividad-modal__reintento">
      <VaButton preset="primary" size="small" @click="cargarExclusivos()">
        Reintentar
      </VaButton>
    </div>

    <p v-if="conflictoEnCurso" class="eliminar-actividad-modal__aviso">
      <span class="material-symbols-outlined" aria-hidden="true">info</span>
      {{ error || TEXTO_CONFLICTO_EN_CURSO }}
    </p>

    <BaseAlert
      v-else-if="error"
      :message="error"
      type="error"
      class="eliminar-actividad-modal__alerta"
    />

    <div class="eliminar-actividad-modal__form">
      <VaTextarea
        v-model="motivo"
        label="Motivo de la eliminación"
        placeholder="Contanos por qué eliminás la actividad..."
        :max-length="LIMITE_MOTIVO_ACTIVIDAD"
        counter
        :rows="3"
        :disabled="eliminando"
        :error="!!errorMotivo"
        :error-messages="errorMotivo || undefined"
      />
    </div>

    <section class="eliminar-actividad-modal__seccion">
      <h4 class="eliminar-actividad-modal__subtitulo">
        Integrantes exclusivos de la actividad
      </h4>

      <div v-if="cargandoExclusivos" class="eliminar-actividad-modal__cargando">
        <span class="material-symbols-outlined" aria-hidden="true">hourglass_empty</span>
        Cargando integrantes...
      </div>

      <template v-else-if="!errorCarga">
        <p class="eliminar-actividad-modal__nota">
          Estos integrantes sólo participan de esta actividad. Elegí si salen
          del proyecto o si continúan en él.
        </p>

        <p v-if="todosBloqueados" class="eliminar-actividad-modal__aviso">
          <span class="material-symbols-outlined" aria-hidden="true">info</span>
          Ningún integrante se puede eliminar del proyecto; podés continuar
          guardándolos.
        </p>

        <div v-if="hayExclusivos" class="eliminar-actividad-modal__filas">
          <article
            v-for="miembro in miembros"
            :key="miembro.idMiembro"
            class="eliminar-actividad-modal__integrante"
          >
            <div class="eliminar-actividad-modal__integrante-datos">
              <p class="eliminar-actividad-modal__nombre">
                {{ miembro.nombreArtistico || "Perfil" }}
              </p>
              <p class="eliminar-actividad-modal__profesion">
                {{ miembro.nombreProfesion || "Sin profesión" }}
              </p>
            </div>

            <div
              class="eliminar-actividad-modal__opciones"
              role="radiogroup"
              :aria-label="`Decisión para ${miembro.nombreArtistico || 'el integrante'}`"
            >
              <label
                class="eliminar-actividad-modal__opcion"
                :class="{
                  'eliminar-actividad-modal__opcion--activa':
                    accionDe(miembro) === ACCIONES_DECISION.GUARDAR,
                }"
              >
                <input
                  type="radio"
                  :name="`decision-${miembro.idMiembro}`"
                  :value="ACCIONES_DECISION.GUARDAR"
                  :checked="accionDe(miembro) === ACCIONES_DECISION.GUARDAR"
                  :disabled="eliminando"
                  @change="elegir(miembro, ACCIONES_DECISION.GUARDAR)"
                />
                Guardar en el proyecto
              </label>

              <label
                class="eliminar-actividad-modal__opcion"
                :class="{
                  'eliminar-actividad-modal__opcion--activa':
                    accionDe(miembro) === ACCIONES_DECISION.ELIMINAR,
                  'eliminar-actividad-modal__opcion--deshabilitada':
                    !miembro.puedeEliminar,
                }"
                :title="
                  !miembro.puedeEliminar
                    ? textoMotivoNoEliminableExclusivo(miembro.motivoNoEliminable)
                    : undefined
                "
              >
                <input
                  type="radio"
                  :name="`decision-${miembro.idMiembro}`"
                  :value="ACCIONES_DECISION.ELIMINAR"
                  :checked="accionDe(miembro) === ACCIONES_DECISION.ELIMINAR"
                  :disabled="eliminando || !miembro.puedeEliminar"
                  @change="elegir(miembro, ACCIONES_DECISION.ELIMINAR)"
                />
                Eliminar del proyecto
              </label>
            </div>

            <p
              v-if="!miembro.puedeEliminar"
              class="eliminar-actividad-modal__motivo-bloqueo"
            >
              {{ textoMotivoNoEliminableExclusivo(miembro.motivoNoEliminable) }}
            </p>

            <div
              v-if="accionDe(miembro) === ACCIONES_DECISION.ELIMINAR"
              class="eliminar-actividad-modal__motivo-baja"
            >
              <VaTextarea
                :model-value="motivoBajaDe(miembro)"
                label="Motivo de baja (opcional)"
                placeholder="Si lo dejás vacío se usa el motivo de la actividad"
                :max-length="LIMITE_MOTIVO_BAJA"
                counter
                :rows="2"
                :disabled="eliminando"
                :error="!!errorDeFila(miembro)"
                :error-messages="errorDeFila(miembro) || undefined"
                @update:model-value="actualizarMotivoBaja(miembro, $event)"
              />
            </div>
          </article>
        </div>

        <p v-else class="eliminar-actividad-modal__sin-exclusivos">
          Esta actividad no tiene integrantes exclusivos que requieran una
          decisión. Se enviará la eliminación con
          <code>decisiones: []</code>.
        </p>
      </template>
    </section>

    <template #footer>
      <div class="eliminar-actividad-modal__acciones">
        <VaButton
          preset="secondary"
          :disabled="eliminando"
          @click="cerrar"
        >
          Volver
        </VaButton>

        <VaButton
          v-if="conflictoEnCurso && puedeIrActividad"
          preset="primary"
          :disabled="eliminando"
          @click="$emit('ir-actividad')"
        >
          Ir a la actividad
        </VaButton>

        <VaButton
          color="danger"
          :loading="eliminando"
          :disabled="!puedeConfirmar"
          :aria-busy="eliminando ? 'true' : 'false'"
          @click="confirmar"
        >
          {{ eliminando ? "Eliminando…" : "Eliminar actividad" }}
        </VaButton>
      </div>
    </template>
  </VaModal>
</template>

<script>
import BaseAlert from "../AlertaBase.vue";
import actividadService from "../../services/actividadService.js";
import { formatearFechaCorta } from "../../utils/fechas.js";
import { mensajeErrorApi } from "../../utils/apiError";
import {
  ACCIONES_DECISION,
  LIMITE_MOTIVO_ACTIVIDAD,
  LIMITE_MOTIVO_BAJA,
  TEXTO_CONFLICTO_EN_CURSO,
  construirDecisiones,
  construirSeleccion,
  decisionInicial,
  deduplicarMiembrosExclusivos,
  textoMotivoNoEliminableExclusivo,
  validarMotivoFallback,
} from "../../utils/eliminacionActividadConstants.js";
import { etiquetaEstadoActividad } from "../../utils/actividadConstants.js";

/*
 * Modal de UC-51. Es dueño del GET de integrantes exclusivos y de la
 * selección por fila; el contenedor ejecuta el POST y maneja los errores
 * 403/404/409. Ante un 400 de decisiones el padre incrementa
 * `tokenRefrescoExclusivos` y acá se recarga la lista reiniciando decisiones.
 */
export default {
  name: "ModalEliminarActividad",
  components: { BaseAlert },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    idProyecto: {
      type: [Number, String],
      default: null,
    },
    actividad: {
      type: Object,
      default: () => ({}),
    },
    nombreProyecto: {
      type: String,
      default: "",
    },
    eliminando: {
      type: Boolean,
      default: false,
    },
    error: {
      type: String,
      default: "",
    },
    errorMotivo: {
      type: String,
      default: "",
    },
    erroresPorMiembro: {
      type: Object,
      default: () => ({}),
    },
    conflictoEnCurso: {
      type: Boolean,
      default: false,
    },
    puedeIrActividad: {
      type: Boolean,
      default: false,
    },
    tokenRefrescoExclusivos: {
      type: Number,
      default: 0,
    },
  },
  emits: [
    "update:modelValue",
    "confirmar",
    "ir-actividad",
    "recargar",
    "limpiar-error",
    "limpiar-errores-filas",
  ],
  data() {
    return {
      ACCIONES_DECISION,
      LIMITE_MOTIVO_ACTIVIDAD,
      LIMITE_MOTIVO_BAJA,
      TEXTO_CONFLICTO_EN_CURSO,
      motivo: "",
      miembros: [],
      seleccion: {},
      cargandoExclusivos: false,
      errorCarga: "",
      puedeReintentarCarga: false,
      idCarga: 0,
    };
  },
  computed: {
    nombreActividad() {
      return this.actividad?.nombre || "esta actividad";
    },
    idActividad() {
      return this.actividad?.idActividad ?? null;
    },
    fechasActividad() {
      const inicio = formatearFechaCorta(this.actividad?.fechaHoraInicio);
      const fin = formatearFechaCorta(this.actividad?.fechaHoraFin);
      if (!this.actividad?.fechaHoraInicio && !this.actividad?.fechaHoraFin) {
        return "Sin programar";
      }
      return `${inicio} - ${fin}`;
    },
    hayExclusivos() {
      return this.miembros.length > 0;
    },
    todosBloqueados() {
      return (
        this.hayExclusivos &&
        this.miembros.every((miembro) => miembro.puedeEliminar !== true)
      );
    },
    motivoNormalizado() {
      return String(this.motivo || "").trim();
    },
    idsConErrorFallback() {
      return validarMotivoFallback(
        this.motivo,
        this.miembros,
        this.seleccion
      ).idsConError;
    },
    hayErrorEnFilas() {
      const ids = new Set(
        this.miembros.map((miembro) => String(miembro.idMiembro))
      );
      return Object.keys(this.erroresPorMiembro || {}).some((id) =>
        ids.has(String(id))
      );
    },
    puedeConfirmar() {
      return (
        !this.eliminando &&
        !this.cargandoExclusivos &&
        !this.errorCarga &&
        !this.conflictoEnCurso &&
        !this.errorMotivo &&
        !!this.motivoNormalizado &&
        this.motivoNormalizado.length <= LIMITE_MOTIVO_ACTIVIDAD &&
        this.idsConErrorFallback.length === 0 &&
        !this.hayErrorEnFilas
      );
    },
  },
  watch: {
    modelValue(visible) {
      if (visible) {
        this.iniciar();
      } else {
        this.limpiar();
      }
    },
    tokenRefrescoExclusivos() {
      if (!this.modelValue) return;
      this.cargarExclusivos();
    },
    motivo() {
      if (this.error || this.errorMotivo) {
        this.$emit("limpiar-error");
      }
    },
  },
  created() {
    this.controladorExclusivos = null;
  },
  beforeUnmount() {
    this.abortarCarga();
  },
  methods: {
    etiquetaEstadoActividad,
    textoMotivoNoEliminableExclusivo,
    accionDe(miembro) {
      return (
        this.seleccion[miembro?.idMiembro]?.accion ||
        ACCIONES_DECISION.GUARDAR
      );
    },
    motivoBajaDe(miembro) {
      return this.seleccion[miembro?.idMiembro]?.motivoBaja || "";
    },
    errorDeFila(miembro) {
      const id = miembro?.idMiembro;
      const backend = this.erroresPorMiembro?.[id];
      if (backend) return backend;
      if (
        this.idsConErrorFallback.some(
          (idConError) => String(idConError) === String(id)
        )
      ) {
        return "Ingresá un motivo de baja de hasta 100 caracteres: el motivo de la actividad supera ese límite.";
      }
      return "";
    },
    iniciar() {
      this.motivo = "";
      this.miembros = [];
      this.seleccion = {};
      this.errorCarga = "";
      this.puedeReintentarCarga = false;
      this.cargandoExclusivos = true;
      this.cargarExclusivos();
    },
    async cargarExclusivos() {
      if (!this.idProyecto || !this.idActividad) {
        this.cargandoExclusivos = false;
        this.errorCarga =
          "No se pudo identificar la actividad a eliminar. Cerrá el modal y recargá la página.";
        this.puedeReintentarCarga = false;
        return;
      }

      this.abortarCarga();
      const corrida = ++this.idCarga;
      this.controladorExclusivos = new AbortController();
      this.cargandoExclusivos = true;
      this.errorCarga = "";
      this.puedeReintentarCarga = false;

      try {
        const response = await actividadService.listarMiembrosExclusivos(
          this.idProyecto,
          this.idActividad,
          this.controladorExclusivos.signal
        );
        if (corrida !== this.idCarga) return;

        const lista = deduplicarMiembrosExclusivos(response?.data);
        this.miembros = lista;
        this.seleccion = construirSeleccion(lista);
      } catch (error) {
        if (this.esCancelacion(error) || corrida !== this.idCarga) return;

        this.miembros = [];
        this.seleccion = {};
        const status = error?.response?.status;

        if (status === 404) {
          this.$emit("recargar");
          this.$emit("update:modelValue", false);
          return;
        }

        this.errorCarga = mensajeErrorApi(
          error,
          status === 403
            ? "No tenés permiso para eliminar esta actividad."
            : "No se pudieron cargar los integrantes de la actividad."
        );
        this.puedeReintentarCarga = !status || status >= 500;
      } finally {
        if (corrida === this.idCarga) this.cargandoExclusivos = false;
      }
    },
    abortarCarga() {
      if (this.controladorExclusivos) {
        this.controladorExclusivos.abort();
        this.controladorExclusivos = null;
      }
    },
    esCancelacion(error) {
      return (
        error?.code === "ERR_CANCELED" ||
        error?.name === "CanceledError" ||
        error?.name === "AbortError"
      );
    },
    elegir(miembro, accion) {
      if (this.eliminando) return;
      if (
        accion === ACCIONES_DECISION.ELIMINAR &&
        miembro?.puedeEliminar !== true
      ) {
        return;
      }

      const actual =
        this.seleccion[miembro.idMiembro] || decisionInicial(miembro);
      this.seleccion[miembro.idMiembro] = { ...actual, accion };
      this.$emit("limpiar-errores-filas");
    },
    actualizarMotivoBaja(miembro, valor) {
      const actual =
        this.seleccion[miembro.idMiembro] || decisionInicial(miembro);
      this.seleccion[miembro.idMiembro] = {
        ...actual,
        motivoBaja: String(valor ?? ""),
      };
      this.$emit("limpiar-errores-filas");
    },
    onCambioVisibilidad(valor) {
      if (this.eliminando && !valor) return;
      this.$emit("update:modelValue", valor);
    },
    cerrar() {
      if (this.eliminando) return;
      this.$emit("update:modelValue", false);
    },
    confirmar() {
      if (!this.puedeConfirmar) return;
      this.$emit("confirmar", {
        motivo: this.motivoNormalizado,
        decisiones: construirDecisiones(this.miembros, this.seleccion),
      });
    },
    limpiar() {
      this.abortarCarga();
      this.idCarga += 1;
      this.motivo = "";
      this.miembros = [];
      this.seleccion = {};
      this.cargandoExclusivos = false;
      this.errorCarga = "";
      this.puedeReintentarCarga = false;
    },
  },
};
</script>

<style scoped>
.eliminar-actividad-modal__titulo {
  margin: 0;
}

.eliminar-actividad-modal__intro {
  margin: 0.25rem 0 0.9rem;
  color: var(--color-text);
  font-size: 0.94rem;
  line-height: 1.5;
}

.eliminar-actividad-modal__ficha {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin: 0 0 0.85rem;
  padding: 0.8rem 0.95rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface-muted);
}

.eliminar-actividad-modal__fila-dato {
  display: grid;
  grid-template-columns: 6.5rem 1fr;
  gap: 0.75rem;
  align-items: baseline;
}

.eliminar-actividad-modal__fila-dato dt {
  color: var(--color-text-muted);
  font-size: 0.76rem;
  font-weight: 600;
}

.eliminar-actividad-modal__fila-dato dd {
  margin: 0;
  color: var(--color-text);
  font-size: 0.86rem;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.eliminar-actividad-modal__advertencias {
  margin: 0 0 0.9rem;
  padding-left: 1.15rem;
  color: var(--color-text-muted);
  font-size: 0.82rem;
  line-height: 1.5;
}

.eliminar-actividad-modal__alerta {
  margin-top: 0 !important;
  margin-bottom: 0.9rem;
}

.eliminar-actividad-modal__reintento {
  margin: -0.35rem 0 0.9rem;
}

.eliminar-actividad-modal__aviso {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin: 0 0 0.9rem;
  padding: 0.7rem 0.85rem;
  border: 1px solid var(--color-warning-border);
  border-radius: 10px;
  background: var(--color-warning-soft);
  color: var(--color-warning-text);
  font-size: 0.84rem;
  line-height: 1.45;
}

.eliminar-actividad-modal__aviso .material-symbols-outlined {
  font-size: 1.1rem;
}

.eliminar-actividad-modal__form {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.eliminar-actividad-modal__seccion {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
}

.eliminar-actividad-modal__subtitulo {
  margin: 0;
  color: var(--color-text);
  font-size: 0.92rem;
  font-weight: 700;
}

.eliminar-actividad-modal__nota {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.82rem;
  line-height: 1.45;
}

.eliminar-actividad-modal__cargando {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.eliminar-actividad-modal__filas {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  margin-top: 0.15rem;
}

.eliminar-actividad-modal__integrante {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding: 0.8rem 0.9rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
}

.eliminar-actividad-modal__integrante-datos {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.eliminar-actividad-modal__nombre {
  margin: 0;
  color: var(--color-text);
  font-size: 0.9rem;
  font-weight: 700;
}

.eliminar-actividad-modal__profesion {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.78rem;
}

.eliminar-actividad-modal__opciones {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.eliminar-actividad-modal__opcion {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.42rem 0.7rem;
  border: 1px solid var(--color-border-strong);
  border-radius: 8px;
  background: var(--color-surface-soft);
  color: var(--color-text);
  font-size: 0.8rem;
  cursor: pointer;
}

.eliminar-actividad-modal__opcion--activa {
  border-color: var(--color-primary);
  background: var(--color-primary-soft, var(--color-surface-muted));
  font-weight: 600;
}

.eliminar-actividad-modal__opcion--deshabilitada {
  cursor: not-allowed;
  opacity: 0.55;
}

.eliminar-actividad-modal__opcion input {
  margin: 0;
  accent-color: var(--color-primary);
}

.eliminar-actividad-modal__motivo-bloqueo {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.78rem;
  line-height: 1.4;
}

.eliminar-actividad-modal__motivo-baja {
  padding-top: 0.15rem;
}

.eliminar-actividad-modal__sin-exclusivos {
  margin: 0;
  padding: 0.75rem 0.9rem;
  border: 1px dashed var(--color-border-strong);
  border-radius: 10px;
  color: var(--color-text-muted);
  font-size: 0.84rem;
  line-height: 1.5;
}

.eliminar-actividad-modal__acciones {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.75rem;
  width: 100%;
}

@media (max-width: 520px) {
  .eliminar-actividad-modal__fila-dato {
    grid-template-columns: 1fr;
    gap: 0.1rem;
  }

  .eliminar-actividad-modal__opciones {
    flex-direction: column;
    align-items: stretch;
  }

  .eliminar-actividad-modal__acciones {
    flex-direction: column-reverse;
    align-items: stretch;
  }
}
</style>
