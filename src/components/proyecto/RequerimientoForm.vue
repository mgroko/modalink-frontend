<template>
  <div
    class="requerimiento"
    :class="{ 'requerimiento--resaltado': resaltado }"
    :aria-describedby="soloLectura ? `requerimiento-bloqueo-${indice}` : undefined"
  >
    <div class="requerimiento__encabezado">
      <div class="requerimiento__encabezado-info">
        <span class="requerimiento__numero" aria-hidden="true">{{ indice + 1 }}</span>
        <div class="requerimiento__encabezado-texto">
          <div class="requerimiento__encabezado-titulos">
            <span class="requerimiento__titulo">Requerimiento {{ indice + 1 }}</span>
            <span v-if="soloLectura" class="requerimiento__badge-satisfecho">
              {{ etiquetaBloqueo }}
            </span>
          </div>
          <p class="requerimiento__resumen">{{ resumen }}</p>
        </div>
      </div>

      <button
        v-if="!soloLectura && mostrarEliminar"
        type="button"
        class="requerimiento__quitar"
        :disabled="!eliminarPermitido"
        title="Quitar requerimiento"
        @click="$emit('eliminar')"
      >
        Quitar
      </button>
    </div>

    <p
      v-if="soloLectura"
      :id="`requerimiento-bloqueo-${indice}`"
      class="requerimiento__hint"
    >
      {{ motivoBloqueo }}
    </p>

    <div v-if="resaltado" class="requerimiento__conflicto" role="alert">
      <p>{{ mensajeConflicto }}</p>
      <div class="requerimiento__conflicto-acciones">
        <VaButton
          preset="secondary"
          size="small"
          @click="$emit('descartar-cambios')"
        >
          Descartar cambios
        </VaButton>
        <VaButton
          preset="secondary"
          size="small"
          title="Se pierden los cambios no guardados del formulario"
          @click="$emit('gestionar-postulaciones')"
        >
          Gestionar postulaciones
        </VaButton>
      </div>
    </div>

    <div class="requerimiento__fila">
      <div class="requerimiento__campo">
        <span class="requerimiento__label">Cantidad de personas *</span>
        <CantidadStepper
          v-model="modelValue.cantidad"
          :disabled="soloLectura"
          :rules="[reglas.requerido, reglas.cantidadPositiva]"
          :error="!!errores.cantidad"
          :error-message="errores.cantidad || ''"
          :aria-label="`Cantidad de personas del requerimiento ${indice + 1}`"
        />
      </div>

      <div class="requerimiento__campo">
        <span class="requerimiento__label">Profesión *</span>
        <VaSelect
          :key="selectProfesionKey"
          :model-value="modelValue.idProfesion"
          :options="profesiones"
          value-by="idProfesion"
          :text-by="(o) => capitalizar(o.nombre)"
          placeholder="Ej: Modelo"
          :disabled="soloLectura"
          :rules="[reglas.requerido]"
          :error="errores.idProfesion ? true : undefined"
          :error-messages="errores.idProfesion || undefined"
          :aria-label="`Profesión del requerimiento ${indice + 1}`"
          @update:model-value="alCambiarProfesion"
        />
      </div>
    </div>

    <hr class="requerimiento__divisor" />

    <section class="requerimiento__seccion">
      <div class="requerimiento__seccion-cabecera">
        <p class="requerimiento__seccion-titulo">Características técnicas</p>
        <p class="requerimiento__seccion-ayuda">
          Preferencias opcionales, no excluyentes. Las medidas se expresan en
          centímetros (cm).
        </p>
      </div>

      <p v-if="!modelValue.idProfesion" class="requerimiento__hint">
        Las características se filtran por profesión. Seleccioná una para poder
        agregar características.
      </p>

      <AgregarCaracteristicas
        v-else-if="!soloLectura"
        :catalogo="caracteristicasCatalogo"
        :agregadas="caracteristicasAgregadas"
        :cargando="cargandoCaracteristicas"
        @agregar="agregarCaracteristica"
      />

      <div
        v-if="(modelValue.caracteristicas || []).length"
        class="requerimiento__caracteristicas"
      >
        <CaracteristicaRequerimientoCard
          v-for="(carac, i) in modelValue.caracteristicas"
          :key="carac.idCaracteristica"
          :caracteristica="carac"
          :catalogo="catalogoDe(carac.idCaracteristica)"
          :solo-lectura="soloLectura"
          :error="errorDeCaracteristica(i)"
          @quitar="quitarCaracteristica(i)"
        />
      </div>
    </section>

    <HabilidadesRequerimiento
      v-if="mostrarHabilidades"
      v-model="modelValue.habilidades"
      :options="habilidades"
      :loading="cargandoHabilidades"
      :disabled="soloLectura"
      :error="!!errores.habilidades"
      :error-message="errores.habilidades || ''"
    />

    <div class="requerimiento__campo">
      <span class="requerimiento__label">Descripción de la vacante</span>
      <VaTextarea
        v-model="modelValue.descripcion"
        placeholder="Contá en pocas líneas qué buscás para esta producción…"
        :max-length="200"
        maxlength="200"
        :max-rows="4"
        :disabled="soloLectura"
        counter
        :rules="[reglas.max200]"
        :error="errores.descripcion ? true : undefined"
        :error-messages="errores.descripcion || undefined"
        input-aria-label="Descripción de la vacante"
      />
    </div>

    <VaModal
      v-model="modalCambioProfesionVisible"
      hide-default-actions
      no-dismiss
      blur
      @update:model-value="alCerrarModalCambioProfesion"
    >
      <h3 class="va-h5">Cambiar profesión</h3>
      <p class="requerimiento__modal-texto">{{ textoCambioProfesion }}</p>
      <template #footer>
        <div class="requerimiento__modal-acciones">
          <VaButton preset="secondary" @click="cancelarCambioProfesion">
            Cancelar
          </VaButton>
          <VaButton color="danger" @click="confirmarCambioProfesion">
            Cambiar profesión
          </VaButton>
        </div>
      </template>
    </VaModal>
  </div>
</template>

<script>
import perfilService from "../../services/perfilService.js";
import { reglasProyecto } from "../../utils/reglas.js";
import {
  capitalizar,
  resumenRequerimiento,
} from "../../utils/requerimientoUi.js";
import CantidadStepper from "./CantidadStepper.vue";
import AgregarCaracteristicas from "./AgregarCaracteristicas.vue";
import CaracteristicaRequerimientoCard from "./CaracteristicaRequerimientoCard.vue";
import HabilidadesRequerimiento from "./HabilidadesRequerimiento.vue";

export default {
  name: "RequerimientoForm",
  components: {
    CantidadStepper,
    AgregarCaracteristicas,
    CaracteristicaRequerimientoCard,
    HabilidadesRequerimiento,
  },
  props: {
    modelValue: {
      type: Object,
      required: true,
    },
    profesiones: {
      type: Array,
      default: () => [],
    },
    habilidades: {
      type: Array,
      default: () => [],
    },
    cargandoHabilidades: {
      type: Boolean,
      default: false,
    },
    indice: {
      type: Number,
      default: 0,
    },
    eliminarPermitido: {
      type: Boolean,
      default: true,
    },
    mostrarEliminar: {
      type: Boolean,
      default: true,
    },
    /** Requerimiento con cupo completo o protegido: sólo lectura y badge. */
    soloLectura: {
      type: Boolean,
      default: false,
    },
    /** Texto del badge cuando `soloLectura` está activo. */
    etiquetaBloqueo: {
      type: String,
      default: "Cupo completo",
    },
    /** Explica por qué el requerimiento está bloqueado. */
    motivoBloqueo: {
      type: String,
      default: "Tiene miembros activos: no se puede editar ni eliminar.",
    },
    /** Resalta el requerimiento que devolvió 409 REQUERIMIENTO_CON_VINCULOS. */
    resaltado: {
      type: Boolean,
      default: false,
    },
    /** Mensaje del conflicto mostrado cuando `resaltado` es true. */
    mensajeConflicto: {
      type: String,
      default: "",
    },
    /** Permite ocultar el selector de habilidades en contextos especiales. */
    mostrarHabilidades: {
      type: Boolean,
      default: true,
    },
    errores: {
      type: Object,
      default: () => ({}),
    },
  },
  emits: [
    "update:modelValue",
    "eliminar",
    "catalogo-cargado",
    "descartar-cambios",
    "gestionar-postulaciones",
  ],
  data() {
    return {
      reglas: reglasProyecto,
      caracteristicasCatalogo: [],
      cargandoCaracteristicas: false,
      /** Fuerza a remontar el select si se cancela el cambio de profesión. */
      selectProfesionKey: 0,
      modalCambioProfesionVisible: false,
      cambioProfesionPendiente: null,
    };
  },
  computed: {
    profesionActual() {
      return (
        this.profesiones.find(
          (profesion) => profesion.idProfesion === this.modelValue.idProfesion
        ) || null
      );
    },
    caracteristicasAgregadas() {
      return (this.modelValue.caracteristicas || []).map(
        (caracteristica) => caracteristica.idCaracteristica
      );
    },
    cantidadCaracteristicas() {
      return (this.modelValue.caracteristicas || []).length;
    },
    cantidadHabilidades() {
      return Array.isArray(this.modelValue.habilidades)
        ? this.modelValue.habilidades.length
        : 0;
    },
    resumen() {
      return resumenRequerimiento({
        cantidad: this.modelValue.cantidad,
        profesion: this.profesionActual?.nombre || "",
        caracteristicas: this.cantidadCaracteristicas,
        habilidades: this.cantidadHabilidades,
      });
    },
    profesionPendienteNombre() {
      return (
        this.profesiones.find(
          (profesion) => profesion.idProfesion === this.cambioProfesionPendiente
        )?.nombre || ""
      );
    },
    textoCambioProfesion() {
      const total = this.cantidadCaracteristicas;
      const detalle =
        total === 1
          ? "Se va a quitar la única característica cargada de este requerimiento."
          : `Se van a quitar las ${total} características cargadas de este requerimiento.`;
      return this.profesionPendienteNombre
        ? `Vas a cambiar la profesión a ${this.profesionPendienteNombre}. ${detalle}`
        : detalle;
    },
  },
  watch: {
    "modelValue.idProfesion": {
      immediate: true,
      handler(idProfesion, anterior) {
        if (!this.modelValue) return;
        if (anterior != null && idProfesion !== anterior) {
          this.modelValue.caracteristicas = [];
        }
        this.cargarCaracteristicas(idProfesion);
      },
    },
  },
  methods: {
    async cargarCaracteristicas(idProfesion) {
      this.caracteristicasCatalogo = [];
      if (!idProfesion) return;

      this.cargandoCaracteristicas = true;
      try {
        const response = await perfilService.caracteristicasPorProfesion(idProfesion);
        if (this.modelValue.idProfesion !== idProfesion) return;
        const datos = response?.data;
        this.caracteristicasCatalogo = Array.isArray(datos)
          ? datos
          : datos?.caracteristicas || [];
        this.$emit("catalogo-cargado", {
          idProfesion,
          caracteristicas: this.caracteristicasCatalogo,
        });
      } catch {
        this.caracteristicasCatalogo = [];
      } finally {
        this.cargandoCaracteristicas = false;
      }
    },
    agregarCaracteristica(idCaracteristica) {
      if (idCaracteristica == null) return;
      if (!Array.isArray(this.modelValue.caracteristicas)) {
        this.modelValue.caracteristicas = [];
      }
      this.modelValue.caracteristicas.push({
        idCaracteristica,
        valorMin: null,
        valorMax: null,
        valores: [],
      });
    },
    quitarCaracteristica(indice) {
      this.modelValue.caracteristicas.splice(indice, 1);
    },
    catalogoDe(idCaracteristica) {
      return (
        this.caracteristicasCatalogo.find(
          (caracteristica) => caracteristica.idCaracteristica === idCaracteristica
        ) || null
      );
    },
    errorDeCaracteristica(indice) {
      return this.errores[`caracteristicas.${indice}`];
    },
    alCambiarProfesion(idProfesion) {
      if (this.soloLectura) return;
      if (idProfesion === this.modelValue.idProfesion) return;

      if (
        idProfesion != null &&
        this.modelValue.idProfesion != null &&
        this.cantidadCaracteristicas > 0
      ) {
        this.cambioProfesionPendiente = idProfesion;
        this.modalCambioProfesionVisible = true;
        return;
      }

      this.aplicarCambioProfesion(idProfesion);
    },
    aplicarCambioProfesion(idProfesion) {
      this.cambioProfesionPendiente = null;
      this.modalCambioProfesionVisible = false;
      this.modelValue.caracteristicas = [];
      this.modelValue.idProfesion = idProfesion;
      this.selectProfesionKey += 1;
    },
    confirmarCambioProfesion() {
      this.aplicarCambioProfesion(this.cambioProfesionPendiente);
    },
    cancelarCambioProfesion() {
      this.cambioProfesionPendiente = null;
      this.modalCambioProfesionVisible = false;
      this.selectProfesionKey += 1;
    },
    alCerrarModalCambioProfesion(visible) {
      // Cierre por Escape u otro medio sin confirmar: se descarta el cambio.
      if (!visible && this.cambioProfesionPendiente != null) {
        this.cancelarCambioProfesion();
      }
    },
    capitalizar,
  },
};
</script>

<style scoped>
.requerimiento {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1.5rem;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-surface);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.requerimiento--resaltado {
  border-color: var(--color-danger-border, #fca5a5);
  box-shadow: 0 0 0 2px var(--color-danger-soft, rgba(220, 38, 38, 0.12));
}

/* ── Encabezado ── */
.requerimiento__encabezado {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.requerimiento__encabezado-info {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  min-width: 0;
}

.requerimiento__numero {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: var(--color-info-soft);
  color: var(--color-info-text);
  font-size: 0.95rem;
  font-weight: 700;
}

.requerimiento__encabezado-texto {
  min-width: 0;
}

.requerimiento__encabezado-titulos {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
}

.requerimiento__titulo {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text);
}

.requerimiento__resumen {
  margin: 0.15rem 0 0;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.requerimiento__quitar {
  flex: 0 0 auto;
  padding: 0.2rem 0;
  border: none;
  background: none;
  color: var(--color-danger-text);
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.requerimiento__quitar:hover:not(:disabled) {
  text-decoration: underline;
}

.requerimiento__quitar:focus-visible {
  outline: 2px solid var(--color-danger);
  outline-offset: 2px;
}

.requerimiento__quitar:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.requerimiento__badge-satisfecho {
  display: inline-block;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  background: var(--color-success-soft);
  color: var(--color-success-text);
  font-size: 0.72rem;
  font-weight: 600;
}

/* ── Campos ── */
.requerimiento__fila {
  display: grid;
  grid-template-columns: minmax(0, 0.7fr) minmax(0, 1fr);
  gap: 1rem;
}

.requerimiento__campo {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
}

.requerimiento__label {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.requerimiento__divisor {
  height: 1px;
  margin: 0;
  border: 0;
  background: var(--color-border);
}

.requerimiento__seccion {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.requerimiento__seccion-cabecera {
  display: flex;
  flex-direction: column;
}

.requerimiento__seccion-titulo {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
}

.requerimiento__seccion-ayuda {
  margin: 0.15rem 0 0;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.requerimiento__caracteristicas {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.requerimiento__hint {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

/* ── Conflicto ── */
.requerimiento__conflicto {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.7rem 0.8rem;
  border: 1px solid var(--color-danger-border, #fca5a5);
  border-radius: 8px;
  background: var(--color-danger-soft, rgba(220, 38, 38, 0.1));
  color: var(--color-danger-text, #dc2626);
  font-size: 0.82rem;
}

.requerimiento__conflicto p {
  margin: 0;
}

.requerimiento__conflicto-acciones {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

/* ── Modal de cambio de profesión ── */
.requerimiento__modal-texto {
  margin: 0.75rem 0 0;
  font-size: 0.9rem;
  color: var(--color-text);
}

.requerimiento__modal-acciones {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  width: 100%;
}

@media (max-width: 600px) {
  .requerimiento {
    padding: 1.1rem;
  }

  .requerimiento__fila {
    grid-template-columns: 1fr;
  }
}
</style>
