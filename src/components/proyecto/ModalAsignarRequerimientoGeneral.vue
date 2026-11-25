<template>
  <VaModal
    :model-value="modelValue"
    hide-default-actions
    :no-dismiss="asignando"
    blur
    size="medium"
    class="asignar-requerimiento-modal"
    @update:model-value="onCambioVisibilidad"
  >
    <template #header>
      <h3 class="va-h5 asignar-requerimiento-modal__titulo">
        Requerimiento general
      </h3>
    </template>

    <p class="asignar-requerimiento-modal__intro">
      Asigná, cambiá o quitá el requerimiento general de
      <strong>{{ nombreMiembro }}</strong>
      en el proyecto <strong>{{ nombreProyecto || "este proyecto" }}</strong>.
    </p>

    <p
      v-if="miembro?.idRequerimientoGral != null"
      class="asignar-requerimiento-modal__actual"
    >
      Actualmente cubre:
      <strong>{{ nombreActual }}</strong>
    </p>
    <p v-else class="asignar-requerimiento-modal__actual asignar-requerimiento-modal__actual--vacio">
      Actualmente no tiene un requerimiento general asignado.
    </p>

    <p
      v-if="miembro?.idProfesion != null"
      class="asignar-requerimiento-modal__filtro"
    >
      <span class="material-symbols-outlined" aria-hidden="true">filter_alt</span>
      Sólo se muestran requerimientos de
      {{ miembro?.nombreProfesion || "su profesión" }}.
    </p>

    <SelectorRequerimientoGeneral
      :model-value="seleccion"
      :requerimientos="requerimientosCompatibles"
      :id-profesion="miembro?.idProfesion ?? null"
      :deshabilitado="asignando"
      permitir-ninguno
      :texto-ninguno="
        miembro?.idRequerimientoGral != null
          ? 'Quitar requerimiento general'
          : 'Sin requerimiento general'
      "
      @update:model-value="seleccion = $event"
    />

    <p
      v-if="!requerimientosCompatibles.length"
      class="asignar-requerimiento-modal__nota"
    >
      No hay requerimientos generales abiertos para la profesión de este
      miembro.
    </p>

    <BaseAlert
      v-if="error"
      :message="error"
      type="error"
      class="asignar-requerimiento-modal__alerta"
    />

    <template #footer>
      <div class="asignar-requerimiento-modal__acciones">
        <VaButton
          preset="secondary"
          :disabled="asignando"
          @click="cerrar"
        >
          Cancelar
        </VaButton>
        <VaButton
          preset="primary"
          :loading="asignando"
          :disabled="!puedeConfirmar"
          :aria-busy="asignando ? 'true' : 'false'"
          @click="confirmar"
        >
          Guardar
        </VaButton>
      </div>
    </template>
  </VaModal>
</template>

<script>
import BaseAlert from "../AlertaBase.vue";
import SelectorRequerimientoGeneral from "./SelectorRequerimientoGeneral.vue";

/*
 * UC-36: asignar, reasignar o desasignar el requerimiento general de un
 * miembro. El componente es presentacional: el padre ejecuta el PUT y le
 * devuelve `asignando`/`error`.
 */
export default {
  name: "ModalAsignarRequerimientoGeneral",
  components: { BaseAlert, SelectorRequerimientoGeneral },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    miembro: {
      type: Object,
      default: null,
    },
    requerimientos: {
      type: Array,
      default: () => [],
    },
    nombreProyecto: {
      type: String,
      default: "",
    },
    asignando: {
      type: Boolean,
      default: false,
    },
    error: {
      type: String,
      default: "",
    },
  },
  emits: ["update:modelValue", "confirmar"],
  data() {
    return {
      seleccion: null,
    };
  },
  computed: {
    nombreMiembro() {
      return (
        this.miembro?.nombreArtistico ||
        this.miembro?.nombreUsuario ||
        "este miembro"
      );
    },
    nombreActual() {
      const actual = this.miembro?.idRequerimientoGral;
      if (actual == null) return "";

      const encontrado = (this.requerimientos || []).find(
        (requerimiento) =>
          String(requerimiento?.idRequerimientoGral) === String(actual)
      );

      return (
        encontrado?.nombreProfesion ||
        this.miembro?.nombreProfesionRequerimiento ||
        `Requerimiento #${actual}`
      );
    },
    requerimientosCompatibles() {
      const idProfesion = this.miembro?.idProfesion;
      const actual = this.miembro?.idRequerimientoGral;

      return (this.requerimientos || []).filter((requerimiento) => {
        if (requerimiento?.idRequerimientoGral == null) return false;
        // El requerimiento actual se muestra siempre, aunque ya esté
        // satisfecho o sus datos hayan cambiado: permite desasignarlo.
        if (String(requerimiento.idRequerimientoGral) === String(actual)) {
          return true;
        }
        if (
          idProfesion != null &&
          String(requerimiento.idProfesion) !== String(idProfesion)
        ) {
          return false;
        }
        if (requerimiento.satisfecho === true) return false;
        if (
          requerimiento.faltantes != null &&
          Number(requerimiento.faltantes) <= 0
        ) {
          return false;
        }
        return true;
      });
    },
    puedeConfirmar() {
      if (this.asignando) return false;
      const actual = this.miembro?.idRequerimientoGral ?? null;
      const siguiente = this.seleccion ?? null;
      return String(actual ?? "") !== String(siguiente ?? "");
    },
  },
  watch: {
    modelValue(visible) {
      if (visible) {
        this.inicializarSeleccion();
        return;
      }
      this.limpiar();
    },
    miembro() {
      if (this.modelValue) this.inicializarSeleccion();
    },
  },
  methods: {
    inicializarSeleccion() {
      this.seleccion = this.miembro?.idRequerimientoGral ?? null;
    },
    limpiar() {
      this.seleccion = null;
    },
    onCambioVisibilidad(valor) {
      if (this.asignando && !valor) return;
      this.$emit("update:modelValue", valor);
    },
    cerrar() {
      if (this.asignando) return;
      this.$emit("update:modelValue", false);
    },
    confirmar() {
      if (!this.puedeConfirmar) return;
      this.$emit("confirmar", {
        idRequerimientoGral: this.seleccion ?? null,
      });
    },
  },
};
</script>

<style scoped>
.asignar-requerimiento-modal__titulo {
  margin: 0;
}

.asignar-requerimiento-modal__intro,
.asignar-requerimiento-modal__actual,
.asignar-requerimiento-modal__nota {
  margin: 0 0 0.65rem;
  color: var(--color-text, #232134);
  font-size: 0.92rem;
  line-height: 1.5;
}

.asignar-requerimiento-modal__actual {
  padding: 0.55rem 0.7rem;
  border: 1px solid var(--color-info-border, var(--color-border));
  border-radius: 8px;
  background: var(--color-info-soft, var(--color-surface-muted));
  color: var(--color-info-text, var(--color-text));
  font-size: 0.84rem;
}

.asignar-requerimiento-modal__actual--vacio {
  border-color: var(--color-border);
  background: var(--color-surface-muted);
  color: var(--color-text-muted, #5b5b6b);
}

.asignar-requerimiento-modal__filtro {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin: 0 0 0.65rem;
  color: var(--color-text-muted, #5b5b6b);
  font-size: 0.8rem;
  line-height: 1.4;
}

.asignar-requerimiento-modal__filtro .material-symbols-outlined {
  font-size: 1rem;
}

.asignar-requerimiento-modal__nota {
  color: var(--color-text-muted, #5b5b6b);
  font-size: 0.8rem;
}

.asignar-requerimiento-modal__alerta {
  margin: 0.75rem 0 0 !important;
}

.asignar-requerimiento-modal__acciones {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
  width: 100%;
}
</style>
