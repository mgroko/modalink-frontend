<template>
  <VaModal
    :model-value="modelValue"
    hide-default-actions
    :no-dismiss="confirmando"
    blur
    size="small"
    class="confirmar-proyecto-modal"
    @update:model-value="onCambioVisibilidad"
  >
    <template #header>
      <h3 class="va-h5 confirmar-proyecto-modal__titulo">Confirmar proyecto</h3>
    </template>

    <div class="confirmar-proyecto-modal__cuerpo" aria-live="polite">
      <div v-if="cargandoPreview" class="confirmar-proyecto-modal__cargando">
        <span class="material-symbols-outlined" aria-hidden="true">
          hourglass_empty
        </span>
        Verificando si el proyecto puede confirmarse...
      </div>

      <template v-else>
        <BaseAlert :message="errorPreview" type="error" />

        <div
          v-if="errorPreview && puedeReintentarPreview"
          class="confirmar-proyecto-modal__reintento"
        >
          <VaButton preset="secondary" size="small" @click="reintentar">
            Reintentar
          </VaButton>
        </div>

        <template v-if="preview">
          <p v-if="actualizandoPreview" class="confirmar-proyecto-modal__actualizando">
            Actualizando la verificación...
          </p>

          <dl class="confirmar-proyecto-modal__resumen">
            <div class="confirmar-proyecto-modal__dato">
              <dt>Estado</dt>
              <dd>{{ preview.estado || "—" }}</dd>
            </div>
            <div class="confirmar-proyecto-modal__dato">
              <dt>Inicio propuesto</dt>
              <dd>{{ fechaInicioPropuestaTexto }}</dd>
            </div>
            <div class="confirmar-proyecto-modal__dato">
              <dt>Entrega</dt>
              <dd>{{ fechaEntregaTexto }}</dd>
            </div>
          </dl>

          <BaseAlert
            v-if="bloqueos.length"
            :message="mensajeBloqueos"
            type="error"
          />

          <ul v-if="bloqueos.length" class="confirmar-proyecto-modal__bloqueos">
            <li
              v-for="(bloqueo, indice) in bloqueos"
              :key="`${bloqueo.codigo}-${indice}`"
              class="confirmar-proyecto-modal__bloqueo"
            >
              <span
                class="material-symbols-outlined confirmar-proyecto-modal__bloqueo-icono"
                aria-hidden="true"
              >
                error
              </span>
              <div class="confirmar-proyecto-modal__bloqueo-texto">
                <p class="confirmar-proyecto-modal__bloqueo-mensaje">
                  {{
                    bloqueo.mensaje ||
                    mensajeCodigo(bloqueo.codigo) ||
                    bloqueo.codigo
                  }}
                </p>
              </div>
            </li>
          </ul>

          <p
            v-if="!bloqueos.length && preview.puedeConfirmar"
            class="confirmar-proyecto-modal__listo"
          >
            <span class="material-symbols-outlined" aria-hidden="true">
              check_circle
            </span>
            Todo listo para confirmar. Se fijará el inicio y se agendarán las
            actividades.
          </p>

          <p v-if="resumenPropuesta" class="confirmar-proyecto-modal__propuesta">
            {{ resumenPropuesta }}
          </p>

          <p class="confirmar-proyecto-modal__aviso">
            Al confirmar, el proyecto pasa a Confirmado y no puede volver a
            Publicado. Los horarios propuestos se persisten en las agendas de
            los integrantes.
          </p>

          <p
            v-if="!hayRequerimientos"
            class="confirmar-proyecto-modal__vacio"
          >
            El proyecto no tiene requerimientos cargados.
          </p>

          <details
            v-if="requerimientosGenerales.length"
            class="confirmar-proyecto-modal__grupo"
            :open="hayFaltantesGenerales"
          >
            <summary class="confirmar-proyecto-modal__grupo-titulo">
              <span>Requerimientos generales</span>
              <span class="confirmar-proyecto-modal__grupo-cupo">
                {{ resumenCupo(requerimientosGenerales) }}
              </span>
            </summary>
            <ul class="confirmar-proyecto-modal__requerimientos">
              <li
                v-for="(requerimiento, indice) in requerimientosGenerales"
                :key="`general-${requerimiento.idRequerimiento ?? indice}`"
                class="confirmar-proyecto-modal__requerimiento"
                :class="{
                  'confirmar-proyecto-modal__requerimiento--pendiente':
                    requerimiento.satisfecho === false,
                }"
              >
                <div class="confirmar-proyecto-modal__requerimiento-info">
                  <p class="confirmar-proyecto-modal__requerimiento-nombre">
                    {{ requerimiento.nombreProfesion }}
                  </p>
                  <p
                    v-if="requerimiento.nombreActividad"
                    class="confirmar-proyecto-modal__requerimiento-detalle"
                  >
                    {{ requerimiento.nombreActividad }}
                  </p>
                </div>
                <span class="confirmar-proyecto-modal__requerimiento-cupo">
                  {{ requerimiento.cubiertos }}/{{ requerimiento.cantidad }}
                </span>
                <span
                  v-if="requerimiento.faltantes > 0"
                  class="confirmar-proyecto-modal__requerimiento-falta"
                >
                  Falta {{ requerimiento.faltantes }}
                </span>
              </li>
            </ul>
          </details>

          <details
            v-if="requerimientosActividad.length"
            class="confirmar-proyecto-modal__grupo"
            :open="hayFaltantesActividad"
          >
            <summary class="confirmar-proyecto-modal__grupo-titulo">
              <span>Requerimientos de actividad</span>
              <span class="confirmar-proyecto-modal__grupo-cupo">
                {{ resumenCupo(requerimientosActividad) }}
              </span>
            </summary>
            <ul class="confirmar-proyecto-modal__requerimientos">
              <li
                v-for="(requerimiento, indice) in requerimientosActividad"
                :key="`actividad-${requerimiento.idActividad ?? indice}-${requerimiento.idRequerimiento ?? indice}`"
                class="confirmar-proyecto-modal__requerimiento"
                :class="{
                  'confirmar-proyecto-modal__requerimiento--pendiente':
                    requerimiento.satisfecho === false,
                }"
              >
                <div class="confirmar-proyecto-modal__requerimiento-info">
                  <p class="confirmar-proyecto-modal__requerimiento-nombre">
                    {{ requerimiento.nombreProfesion }}
                  </p>
                  <p
                    v-if="requerimiento.nombreActividad"
                    class="confirmar-proyecto-modal__requerimiento-detalle"
                  >
                    {{ requerimiento.nombreActividad }}
                  </p>
                </div>
                <span class="confirmar-proyecto-modal__requerimiento-cupo">
                  {{ requerimiento.cubiertos }}/{{ requerimiento.cantidad }}
                </span>
                <span
                  v-if="requerimiento.faltantes > 0"
                  class="confirmar-proyecto-modal__requerimiento-falta"
                >
                  Falta {{ requerimiento.faltantes }}
                </span>
              </li>
            </ul>
          </details>
        </template>

        <p v-else-if="!errorPreview" class="confirmar-proyecto-modal__vacio">
          No pudimos verificar el proyecto. Cerrá el diálogo e intentá
          nuevamente.
        </p>
      </template>
    </div>

    <BaseAlert :message="errorConfirmacion" type="error" />

    <template #footer>
      <div class="confirmar-proyecto-modal__acciones">
        <VaButton preset="secondary" :disabled="confirmando" @click="cancelar">
          Cancelar
        </VaButton>
        <VaButton
          preset="primary"
          :disabled="!puedeConfirmar"
          :loading="confirmando"
          @click="confirmar"
        >
          Confirmar
        </VaButton>
      </div>
    </template>
  </VaModal>
</template>

<script>
/*
 * UC-60 Confirmar proyecto. Componente presentacional: el padre hace el GET de
 * previsualización y el POST de confirmación. El botón Confirmar sólo se
 * habilita con `puedeConfirmar === true` y sin error de verificación.
 */
import BaseAlert from "../AlertaBase.vue";
import {
  formatearFechaHoraConfirmacion,
  mensajeCodigoConfirmacion,
} from "../../utils/confirmacionConstants.js";
import { formatearFechaCorta } from "../../utils/fechas.js";

export default {
  name: "ModalConfirmarProyecto",
  components: { BaseAlert },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    preview: {
      type: Object,
      default: null,
    },
    cargandoPreview: {
      type: Boolean,
      default: false,
    },
    actualizandoPreview: {
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
    confirmando: {
      type: Boolean,
      default: false,
    },
    errorConfirmacion: {
      type: String,
      default: "",
    },
  },
  emits: ["update:modelValue", "confirmar", "reintentar"],
  computed: {
    bloqueos() {
      return Array.isArray(this.preview?.bloqueos) ? this.preview.bloqueos : [];
    },
    requerimientosGenerales() {
      return Array.isArray(this.preview?.requerimientosGenerales)
        ? this.preview.requerimientosGenerales
        : [];
    },
    requerimientosActividad() {
      return Array.isArray(this.preview?.requerimientosActividad)
        ? this.preview.requerimientosActividad
        : [];
    },
    hayRequerimientos() {
      return (
        this.requerimientosGenerales.length > 0 ||
        this.requerimientosActividad.length > 0
      );
    },
    hayFaltantesGenerales() {
      return this.requerimientosGenerales.some(
        (requerimiento) =>
          requerimiento.satisfecho === false || requerimiento.faltantes > 0
      );
    },
    hayFaltantesActividad() {
      return this.requerimientosActividad.some(
        (requerimiento) =>
          requerimiento.satisfecho === false || requerimiento.faltantes > 0
      );
    },
    puedeConfirmar() {
      return (
        this.preview?.puedeConfirmar === true &&
        this.bloqueos.length === 0 &&
        !this.cargandoPreview &&
        !this.actualizandoPreview &&
        !this.errorPreview
      );
    },
    mensajeBloqueos() {
      return this.bloqueos.length === 1
        ? "El proyecto todavía no se puede confirmar."
        : `El proyecto todavía no se puede confirmar (${this.bloqueos.length} bloqueos).`;
    },
    fechaInicioPropuestaTexto() {
      return formatearFechaHoraConfirmacion(
        this.preview?.fechaInicioPropuesta
      );
    },
    fechaEntregaTexto() {
      return formatearFechaCorta(this.preview?.fechaEntrega);
    },
    resumenPropuesta() {
      const total = Array.isArray(this.preview?.propuestaHorarios)
        ? this.preview.propuestaHorarios.length
        : 0;
      if (!total) return "";
      return total === 1
        ? "1 actividad programada en la propuesta."
        : `${total} actividades programadas en la propuesta.`;
    },
  },
  methods: {
    mensajeCodigo(codigo) {
      return mensajeCodigoConfirmacion(codigo);
    },
    resumenCupo(requerimientos) {
      const total = requerimientos.reduce(
        (acumulado, requerimiento) => acumulado + (requerimiento.cantidad || 0),
        0
      );
      const cubiertos = requerimientos.reduce(
        (acumulado, requerimiento) => acumulado + (requerimiento.cubiertos || 0),
        0
      );
      return `${cubiertos} de ${total} cubiertos`;
    },
    onCambioVisibilidad(valor) {
      if (this.confirmando && !valor) return;
      this.$emit("update:modelValue", valor);
    },
    cancelar() {
      if (this.confirmando) return;
      this.$emit("update:modelValue", false);
    },
    confirmar() {
      if (!this.puedeConfirmar || this.confirmando) return;
      this.$emit("confirmar");
    },
    reintentar() {
      if (this.confirmando) return;
      this.$emit("reintentar");
    },
  },
};
</script>

<style scoped>
.confirmar-proyecto-modal__titulo {
  margin: 0;
}

.confirmar-proyecto-modal__cuerpo {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: min(62vh, 560px);
  overflow-y: auto;
  padding-right: 0.15rem;
}

.confirmar-proyecto-modal__cargando {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
  color: var(--color-text-muted);
  font-size: 0.92rem;
}

.confirmar-proyecto-modal__reintento {
  display: flex;
  justify-content: flex-start;
}

.confirmar-proyecto-modal__actualizando {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.82rem;
}

.confirmar-proyecto-modal__resumen {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin: 0;
  padding: 0.75rem;
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border);
  border-radius: 10px;
}

.confirmar-proyecto-modal__dato {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  min-width: 0;
}

.confirmar-proyecto-modal__dato dt {
  flex-shrink: 0;
  color: var(--color-text-muted);
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.confirmar-proyecto-modal__dato dd {
  margin: 0;
  color: var(--color-text);
  font-size: 0.88rem;
  font-weight: 600;
  text-align: right;
  overflow-wrap: anywhere;
}

.confirmar-proyecto-modal__bloqueos {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.confirmar-proyecto-modal__bloqueo {
  display: flex;
  gap: 0.5rem;
  padding: 0.55rem 0.65rem;
  background: var(--color-danger-soft);
  border: 1px solid var(--color-danger-border);
  border-radius: 8px;
}

.confirmar-proyecto-modal__bloqueo-icono {
  color: var(--color-danger-text);
  font-size: 1.1rem;
  line-height: 1.2;
}

.confirmar-proyecto-modal__bloqueo-texto {
  min-width: 0;
}

.confirmar-proyecto-modal__bloqueo-mensaje {
  margin: 0;
  color: var(--color-danger-text);
  font-size: 0.86rem;
  font-weight: 600;
}

.confirmar-proyecto-modal__listo {
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
  margin: 0;
  color: var(--color-success-text);
  font-size: 0.86rem;
  font-weight: 600;
}

.confirmar-proyecto-modal__listo .material-symbols-outlined {
  font-size: 1.1rem;
}

.confirmar-proyecto-modal__propuesta {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.82rem;
}

.confirmar-proyecto-modal__aviso {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.82rem;
  line-height: 1.45;
}

.confirmar-proyecto-modal__vacio {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.86rem;
}

.confirmar-proyecto-modal__grupo {
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
}

.confirmar-proyecto-modal__grupo-titulo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.6rem 0.75rem;
  color: var(--color-text);
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  list-style: none;
}

.confirmar-proyecto-modal__grupo-titulo::-webkit-details-marker {
  display: none;
}

.confirmar-proyecto-modal__grupo-titulo::before {
  content: "chevron_right";
  font-family: "Material Symbols Outlined";
  font-size: 1.05rem;
  color: var(--color-text-muted);
  transition: transform 0.15s ease;
}

.confirmar-proyecto-modal__grupo[open]
  .confirmar-proyecto-modal__grupo-titulo::before {
  transform: rotate(90deg);
}

.confirmar-proyecto-modal__grupo-titulo > :first-child {
  flex: 1;
  min-width: 0;
}

.confirmar-proyecto-modal__grupo-cupo {
  color: var(--color-text-muted);
  font-size: 0.76rem;
  font-weight: 500;
  white-space: nowrap;
}

.confirmar-proyecto-modal__requerimientos {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  max-height: 170px;
  overflow-y: auto;
  margin: 0;
  padding: 0 0.65rem 0.65rem;
  list-style: none;
}

.confirmar-proyecto-modal__requerimiento {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.confirmar-proyecto-modal__requerimiento--pendiente {
  background: var(--color-danger-soft);
  border-color: var(--color-danger-border);
}

.confirmar-proyecto-modal__requerimiento-info {
  flex: 1;
  min-width: 0;
}

.confirmar-proyecto-modal__requerimiento-nombre {
  margin: 0;
  color: var(--color-text);
  font-size: 0.84rem;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.confirmar-proyecto-modal__requerimiento-detalle {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.74rem;
  overflow-wrap: anywhere;
}

.confirmar-proyecto-modal__requerimiento-cupo {
  color: var(--color-text);
  font-size: 0.8rem;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.confirmar-proyecto-modal__requerimiento-falta {
  padding: 0.1rem 0.4rem;
  background: var(--color-danger-border);
  color: var(--color-danger-text);
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  white-space: nowrap;
}

.confirmar-proyecto-modal__acciones {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
  width: 100%;
}

@media (max-width: 520px) {
  .confirmar-proyecto-modal__requerimiento {
    flex-wrap: wrap;
  }
}
</style>
