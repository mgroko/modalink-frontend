<template>
  <VaModal
    :model-value="modelValue"
    hide-default-actions
    :no-dismiss="finalizando"
    blur
    size="large"
    class="finalizar-proyecto-modal"
    @update:model-value="onCambioVisibilidad"
  >
    <template #header>
      <div class="finalizar-proyecto-modal__header">
        <div class="finalizar-proyecto-modal__header-texto">
          <h3 class="va-h5 finalizar-proyecto-modal__titulo">
            {{
              requiereConfirmacionPrematura
                ? "Finalizar proyecto de forma anticipada"
                : "Finalizar proyecto"
            }}
          </h3>
          <p v-if="nombreProyecto" class="finalizar-proyecto-modal__subtitulo">
            {{ nombreProyecto }}
          </p>
        </div>
        <span v-if="preview?.estado" class="finalizar-proyecto-modal__estado">
          Estado actual: {{ preview.estado }}
        </span>
      </div>
    </template>

    <div class="finalizar-proyecto-modal__cuerpo" aria-live="polite">
      <div v-if="cargandoPreview" class="finalizar-proyecto-modal__cargando">
        <span class="material-symbols-outlined" aria-hidden="true">
          hourglass_empty
        </span>
        Verificando si el proyecto puede finalizarse...
      </div>

      <template v-else>
        <BaseAlert
          v-if="errorPreview"
          :message="formatearFechasEnTexto(errorPreview)"
          type="error"
        />

        <div
          v-if="errorPreview && puedeReintentarPreview"
          class="finalizar-proyecto-modal__reintento"
        >
          <VaButton preset="secondary" size="small" @click="reintentar">
            Reintentar
          </VaButton>
        </div>

        <template v-if="preview">
          <dl class="finalizar-proyecto-modal__resumen">
            <div class="finalizar-proyecto-modal__dato">
              <dt>Entrega</dt>
              <dd>{{ fechaEntregaTexto }}</dd>
            </div>
            <div class="finalizar-proyecto-modal__dato">
              <dt>Fecha actual</dt>
              <dd>{{ fechaActualTexto }}</dd>
            </div>
          </dl>

          <BaseAlert
            v-if="bloqueos.length"
            :message="mensajeBloqueos"
            type="error"
          />

          <ul v-if="bloqueos.length" class="finalizar-proyecto-modal__bloqueos">
            <li
              v-for="(bloqueo, indice) in bloqueos"
              :key="`${bloqueo.codigo}-${indice}`"
              class="finalizar-proyecto-modal__bloqueo"
            >
              <span
                class="material-symbols-outlined finalizar-proyecto-modal__bloqueo-icono"
                aria-hidden="true"
              >
                error
              </span>
              <span class="finalizar-proyecto-modal__bloqueo-texto">
                {{ textoBloqueo(bloqueo) }}
              </span>
            </li>
          </ul>

          <BaseAlert
            v-if="advertencias.length"
            :message="mensajeAdvertencias"
            type="warning"
          />

          <label
            v-if="requiereConfirmacionPrematura"
            class="finalizar-proyecto-modal__confirmacion-prematura"
          >
            <VaCheckbox
              v-model="confirmoPrematura"
              color="warning"
              :disabled="finalizando || preview.puedeFinalizar !== true"
            />
            <span>
              Entiendo que la fecha de entrega estipulada todavía no se alcanzó
              y quiero finalizar el proyecto de forma anticipada.
            </span>
          </label>

          <p
            v-if="
              !bloqueos.length &&
              !advertencias.length &&
              preview.puedeFinalizar
            "
            class="finalizar-proyecto-modal__listo"
          >
            <span class="material-symbols-outlined" aria-hidden="true">
              check_circle
            </span>
            Todo listo para finalizar. Se notificará a los integrantes para que
            califiquen al equipo.
          </p>

          <div class="finalizar-proyecto-modal__progreso">
            <div class="finalizar-proyecto-modal__progreso-fila">
              <span class="finalizar-proyecto-modal__progreso-titulo">
                Calificaciones
              </span>
              <span class="finalizar-proyecto-modal__progreso-contador">
                {{ realizadas }} de {{ requeridas }}
              </span>
            </div>
            <div class="finalizar-proyecto-modal__barra" aria-hidden="true">
              <div
                class="finalizar-proyecto-modal__barra-relleno"
                :style="{ width: `${porcentaje}%` }"
              />
            </div>
          </div>

          <p v-if="!miembros.length" class="finalizar-proyecto-modal__vacio">
            No hay integrantes para calificar. Podés finalizar el proyecto.
          </p>

          <div v-else class="finalizar-proyecto-modal__lista">
            <CalificacionMiembroCard
              v-for="miembro in miembros"
              :key="miembro.idPerfil"
              :miembro="miembro"
              :valoracion="valoracionDe(miembro)"
              :resenia="reseniaDe(miembro)"
              :nombre-profesion="profesiones[miembro.idPerfil]"
              :ya-calificado="miembro.yaCalificado === true"
              :disabled="finalizando || preview.puedeFinalizar !== true"
              :error-valoracion="errorValoracionDe(miembro)"
              :error-resenia="errorReseniaDe(miembro)"
              @update:valoracion="actualizarValoracion(miembro, $event)"
              @update:resenia="actualizarResenia(miembro, $event)"
              @touch-resenia="marcarTocado(miembro, 'resenia')"
            />
          </div>

          <p
            v-if="!puedeConfirmar && preview.puedeFinalizar && !finalizando"
            class="finalizar-proyecto-modal__ayuda"
          >
            Completá la valoración y la reseña de todos los integrantes para
            habilitar la finalización.
          </p>
        </template>

        <p v-else-if="!errorPreview" class="finalizar-proyecto-modal__vacio">
          No pudimos verificar el proyecto. Cerrá el diálogo e intentá
          nuevamente.
        </p>
      </template>
    </div>

    <BaseAlert
      :message="formatearFechasEnTexto(errorFinalizacion)"
      type="error"
    />

    <template #footer>
      <div class="finalizar-proyecto-modal__acciones">
        <VaButton preset="secondary" :disabled="finalizando" @click="cancelar">
          Cancelar
        </VaButton>
        <VaButton
          preset="primary"
          :disabled="!puedeConfirmar"
          :loading="finalizando"
          @click="confirmar"
        >
          {{
            requiereConfirmacionPrematura
              ? "Finalizar de forma anticipada"
              : "Finalizar proyecto"
          }}
        </VaButton>
      </div>
    </template>
  </VaModal>
</template>

<script>
import BaseAlert from "../AlertaBase.vue";
import CalificacionMiembroCard from "./CalificacionMiembroCard.vue";
import {
  formatearFechaCorta,
  formatearFechasEnTexto,
} from "../../utils/fechas.js";
import {
  contarCalificacionesCompletas,
  mensajeCodigoFinalizacion,
  validarCalificaciones,
} from "../../utils/finalizacionConstants.js";

/*
 * Modal de UC-37 Finalizar proyecto. El padre hace el GET de previsualización,
 * enriquece profesiones y ejecuta el POST; el modal solo presenta, valida el
 * formulario local y emite el payload de calificaciones.
 *
 * La reseña es obligatoria por contrato: la tarjeta la muestra siempre visible
 * y el botón Finalizar se habilita recién cuando todos los integrantes
 * pendientes tienen valoración (1-5) y reseña (1-200 caracteres).
 */
export default {
  name: "ModalFinalizarProyecto",
  components: { BaseAlert, CalificacionMiembroCard },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    nombreProyecto: {
      type: String,
      default: "",
    },
    preview: {
      type: Object,
      default: null,
    },
    profesiones: {
      type: Object,
      default: () => ({}),
    },
    cargandoPreview: {
      type: Boolean,
      default: false,
    },
    errorPreview: {
      type: String,
      default: "",
    },
    puedeReintentarPreview: {
      type: Boolean,
      default: false,
    },
    finalizando: {
      type: Boolean,
      default: false,
    },
    errorFinalizacion: {
      type: String,
      default: "",
    },
    faltantes: {
      type: Array,
      default: () => [],
    },
  },
  emits: ["update:modelValue", "confirmar", "reintentar"],
  data() {
    return {
      formulario: {},
      tocado: {},
      confirmoPrematura: false,
    };
  },
  computed: {
    miembros() {
      return Array.isArray(this.preview?.miembrosACalificar)
        ? this.preview.miembrosACalificar
        : [];
    },
    bloqueos() {
      return Array.isArray(this.preview?.bloqueos)
        ? this.preview.bloqueos
        : [];
    },
    advertencias() {
      return Array.isArray(this.preview?.advertencias)
        ? this.preview.advertencias
        : [];
    },
    requiereConfirmacionPrematura() {
      return (
        this.preview?.requiereConfirmacionPrematura === true ||
        this.advertencias.some(
          (advertencia) => advertencia?.codigo === "FECHA_ENTREGA_FUTURA"
        )
      );
    },
    mensajeAdvertencias() {
      const mensajes = this.advertencias
        .map((advertencia) =>
          formatearFechasEnTexto(advertencia?.mensaje)
        )
        .filter(Boolean);
      return mensajes.length
        ? mensajes.join(" ")
        : "La fecha de entrega estipulada todavía no se alcanzó.";
    },
    requeridas() {
      const requeridas = Number(this.preview?.calificacionesRequeridas);
      return Number.isInteger(requeridas) && requeridas >= 0
        ? requeridas
        : this.miembros.length;
    },
    realizadas() {
      return contarCalificacionesCompletas(this.miembros, this.formulario);
    },
    porcentaje() {
      if (!this.requeridas) return 0;
      return Math.min(
        100,
        Math.round((this.realizadas / this.requeridas) * 100)
      );
    },
    validacion() {
      return validarCalificaciones(this.miembros, this.formulario);
    },
    puedeConfirmar() {
      return (
        this.preview?.puedeFinalizar === true &&
        !this.cargandoPreview &&
        !this.finalizando &&
        !this.errorPreview &&
        this.validacion.valido &&
        (!this.requiereConfirmacionPrematura || this.confirmoPrematura)
      );
    },
    mensajeBloqueos() {
      return this.bloqueos.length === 1
        ? "El proyecto todavía no se puede finalizar."
        : `El proyecto todavía no se puede finalizar (${this.bloqueos.length} bloqueos).`;
    },
    fechaEntregaTexto() {
      return formatearFechaCorta(this.preview?.fechaEntrega);
    },
    fechaActualTexto() {
      return formatearFechaCorta(this.preview?.fechaActual);
    },
  },
  watch: {
    modelValue(valor) {
      if (!valor) {
        this.formulario = {};
        this.tocado = {};
        this.confirmoPrematura = false;
      }
    },
    preview: {
      immediate: true,
      handler() {
        if (!this.requiereConfirmacionPrematura) {
          this.confirmoPrematura = false;
        }
        this.sincronizarFormulario();
      },
    },
    faltantes: {
      immediate: true,
      handler(valor) {
        this.marcarFaltantes(valor);
      },
    },
  },
  methods: {
    formatearFechasEnTexto,
    mensajeCodigo(codigo) {
      return mensajeCodigoFinalizacion(codigo);
    },
    textoBloqueo(bloqueo) {
      const texto =
        bloqueo?.mensaje ||
        this.mensajeCodigo(bloqueo?.codigo) ||
        bloqueo?.codigo ||
        "";
      return formatearFechasEnTexto(texto);
    },
    sincronizarFormulario() {
      const siguiente = {};
      for (const miembro of this.miembros) {
        if (miembro.yaCalificado === true) continue;
        const actual = this.formulario[miembro.idPerfil];
        siguiente[miembro.idPerfil] = {
          valoracion: actual?.valoracion ?? 0,
          resenia: actual?.resenia ?? "",
        };
      }
      this.formulario = siguiente;
    },
    valoracionDe(miembro) {
      return Number(this.formulario[miembro?.idPerfil]?.valoracion) || 0;
    },
    reseniaDe(miembro) {
      return this.formulario[miembro?.idPerfil]?.resenia || "";
    },
    actualizarValoracion(miembro, valoracion) {
      const idPerfil = miembro?.idPerfil;
      if (idPerfil == null) return;
      const actual = this.formulario[idPerfil] || { resenia: "" };
      this.formulario = {
        ...this.formulario,
        [idPerfil]: {
          ...actual,
          valoracion: Number(valoracion) || 0,
        },
      };
      this.marcarTocado(miembro, "valoracion");
    },
    actualizarResenia(miembro, resenia) {
      const idPerfil = miembro?.idPerfil;
      if (idPerfil == null) return;
      const actual = this.formulario[idPerfil] || { valoracion: 0 };
      this.formulario = {
        ...this.formulario,
        [idPerfil]: {
          ...actual,
          resenia: String(resenia ?? ""),
        },
      };
    },
    marcarTocado(miembro, campo) {
      const idPerfil = miembro?.idPerfil;
      if (idPerfil == null) return;
      const actual = this.tocado[idPerfil] || {};
      this.tocado = {
        ...this.tocado,
        [idPerfil]: { ...actual, [campo]: true },
      };
    },
    marcarFaltantes(valor) {
      if (!Array.isArray(valor) || !valor.length) return;
      const siguiente = { ...this.tocado };
      for (const item of valor) {
        const idPerfil = Number(item);
        if (!Number.isInteger(idPerfil) || idPerfil <= 0) continue;
        siguiente[idPerfil] = { valoracion: true, resenia: true };
      }
      this.tocado = siguiente;
    },
    errorValoracionDe(miembro) {
      const idPerfil = miembro?.idPerfil;
      if (!this.tocado[idPerfil]?.valoracion) return "";
      return this.validacion.errores[idPerfil]?.valoracion || "";
    },
    errorReseniaDe(miembro) {
      const idPerfil = miembro?.idPerfil;
      if (!this.tocado[idPerfil]?.resenia) return "";
      return this.validacion.errores[idPerfil]?.resenia || "";
    },
    onCambioVisibilidad(valor) {
      if (this.finalizando && !valor) return;
      this.$emit("update:modelValue", valor);
    },
    cancelar() {
      if (this.finalizando) return;
      this.$emit("update:modelValue", false);
    },
    reintentar() {
      if (this.finalizando) return;
      this.$emit("reintentar");
    },
    confirmar() {
      if (!this.puedeConfirmar || this.finalizando) return;
      this.$emit(
        "confirmar",
        this.validacion.calificaciones,
        this.confirmoPrematura === true
      );
    },
  },
};
</script>

<style scoped>
.finalizar-proyecto-modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
}

.finalizar-proyecto-modal__header-texto {
  min-width: 0;
}

.finalizar-proyecto-modal__titulo {
  margin: 0;
}

.finalizar-proyecto-modal__subtitulo {
  margin: 0.2rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.82rem;
  overflow-wrap: anywhere;
}

.finalizar-proyecto-modal__estado {
  flex: none;
  padding: 0.2rem 0.6rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
}

.finalizar-proyecto-modal__cuerpo {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  max-height: min(68vh, 640px);
  overflow-y: auto;
  padding-right: 0.15rem;
}

.finalizar-proyecto-modal__cargando {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
  color: var(--color-text-muted);
  font-size: 0.92rem;
}

.finalizar-proyecto-modal__reintento {
  display: flex;
  justify-content: flex-start;
}

.finalizar-proyecto-modal__resumen {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
  margin: 0;
  padding: 0.75rem;
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border);
  border-radius: 10px;
}

.finalizar-proyecto-modal__dato {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.finalizar-proyecto-modal__dato dt {
  color: var(--color-text-muted);
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.finalizar-proyecto-modal__dato dd {
  margin: 0;
  color: var(--color-text);
  font-size: 0.86rem;
  font-weight: 600;
}

.finalizar-proyecto-modal__bloqueos {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.finalizar-proyecto-modal__bloqueo {
  display: flex;
  gap: 0.5rem;
  padding: 0.55rem 0.65rem;
  background: var(--color-danger-soft);
  border: 1px solid var(--color-danger-border);
  border-radius: 8px;
}

.finalizar-proyecto-modal__bloqueo-icono {
  color: var(--color-danger-text);
  font-size: 1.1rem;
  line-height: 1.2;
}

.finalizar-proyecto-modal__bloqueo-texto {
  color: var(--color-danger-text);
  font-size: 0.84rem;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.finalizar-proyecto-modal__listo {
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
  margin: 0;
  color: var(--color-success-text);
  font-size: 0.86rem;
  font-weight: 600;
}

.finalizar-proyecto-modal__listo .material-symbols-outlined {
  font-size: 1.1rem;
}

.finalizar-proyecto-modal__progreso {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.finalizar-proyecto-modal__progreso-fila {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  font-size: 0.82rem;
}

.finalizar-proyecto-modal__progreso-titulo {
  color: var(--color-text);
  font-weight: 600;
}

.finalizar-proyecto-modal__progreso-contador {
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}

.finalizar-proyecto-modal__barra {
  height: 6px;
  border-radius: 999px;
  background: var(--color-surface-muted);
  overflow: hidden;
}

.finalizar-proyecto-modal__barra-relleno {
  height: 100%;
  background: var(--color-primary);
  transition: width 0.2s ease;
}

.finalizar-proyecto-modal__lista {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.finalizar-proyecto-modal__vacio,
.finalizar-proyecto-modal__ayuda {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.84rem;
  line-height: 1.45;
}

.finalizar-proyecto-modal__ayuda {
  color: var(--color-warning-text);
  font-weight: 600;
}

.finalizar-proyecto-modal__confirmacion-prematura {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.75rem;
  border: 1px solid var(--color-warning-border, var(--color-border));
  border-radius: 10px;
  background: var(--color-warning-soft);
  color: var(--color-warning-text);
  font-size: 0.84rem;
  font-weight: 600;
  line-height: 1.45;
  cursor: pointer;
}

.finalizar-proyecto-modal__confirmacion-prematura
  :deep(.va-checkbox__square) {
  border-color: var(--color-warning-text);
}

.finalizar-proyecto-modal__acciones {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
  width: 100%;
}

@media (max-width: 600px) {
  .finalizar-proyecto-modal__header {
    flex-direction: column;
  }

  .finalizar-proyecto-modal__resumen {
    grid-template-columns: 1fr;
  }

  .finalizar-proyecto-modal__acciones {
    flex-direction: column-reverse;
    align-items: stretch;
  }
}
</style>
