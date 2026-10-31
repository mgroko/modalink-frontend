<template>
  <VaModal
    :model-value="modelValue"
    hide-default-actions
    :no-dismiss="asignando"
    blur
    size="medium"
    class="asignar-actividad-modal"
    @update:model-value="onCambioVisibilidad"
  >
    <template #header>
      <h3 class="va-h5 asignar-actividad-modal__titulo">
        Asignar actividad
      </h3>
    </template>

    <p class="asignar-actividad-modal__intro">
      Asigná la actividad
      <strong>{{ actividad?.nombre || "seleccionada" }}</strong>
      del proyecto <strong>{{ nombreProyecto || "este proyecto" }}</strong> a un
      miembro activo.
    </p>

    <dl class="asignar-actividad-modal__detalle">
      <div class="asignar-actividad-modal__fila">
        <dt>Duración</dt>
        <dd>{{ duracionActividad }}</dd>
      </div>
      <div class="asignar-actividad-modal__fila">
        <dt>Estado</dt>
        <dd>{{ etiquetaEstadoActividad(actividad?.estado) || "—" }}</dd>
      </div>
      <div class="asignar-actividad-modal__fila">
        <dt>Asignados</dt>
        <dd>{{ textoAsignados }}</dd>
      </div>
    </dl>

    <p
      v-if="!tieneFechaEntrega"
      class="asignar-actividad-modal__aviso asignar-actividad-modal__aviso--bloqueo"
    >
      <span class="material-symbols-outlined" aria-hidden="true">event_busy</span>
      El proyecto no tiene fecha de entrega. No se puede asignar una actividad
      hasta que se defina.
    </p>

    <section class="asignar-actividad-modal__seccion">
      <h4 class="asignar-actividad-modal__subtitulo">Miembro destinatario</h4>

      <SelectorMiembroProyecto
        v-if="modelValue"
        :id-proyecto="idProyecto"
        :model-value="idPerfilSeleccionado"
        :id-perfiles-asignados="idPerfilesAsignados"
        :deshabilitado="asignando || !tieneFechaEntrega"
        :token-refresco="tokenRefrescoMiembros"
        @update:model-value="onCambioSeleccionId"
        @seleccionado="onSeleccionado"
      />
    </section>

    <p
      v-if="esDirectorSeleccionado"
      class="asignar-actividad-modal__aviso"
    >
      <span class="material-symbols-outlined" aria-hidden="true">info</span>
      El perfil seleccionado es director. La asignación no vincula un
      requerimiento ni consume cupo.
    </p>

    <DisponibilidadActividad
      v-if="
        modelValue &&
        idPerfilSeleccionado != null &&
        tieneFechaEntrega &&
        idActividad != null
      "
      :id-proyecto="idProyecto"
      :id-actividad="idActividad"
      :id-perfiles="idsDisponibilidad"
      :titulo="tituloDisponibilidad"
      :token-refresco="tokenRefrescoDisponibilidad"
      @actualizado="onDisponibilidad"
    />

    <p class="asignar-actividad-modal__nota">
      La asignación no agenda ni reserva un horario. El hueco usado para validar
      la disponibilidad no se guarda en la actividad; el cronograma sigue
      siendo responsabilidad del CPM.
    </p>

    <BaseAlert
      v-if="error"
      :message="error"
      type="error"
      class="asignar-actividad-modal__alerta"
    />

    <template #footer>
      <div class="asignar-actividad-modal__acciones">
        <VaButton preset="secondary" :disabled="asignando" @click="cerrar">
          Cancelar
        </VaButton>
        <VaButton
          preset="primary"
          :loading="asignando"
          :disabled="!puedeConfirmar"
          :aria-busy="asignando ? 'true' : 'false'"
          @click="confirmar"
        >
          {{ textoConfirmar }}
        </VaButton>
      </div>
    </template>
  </VaModal>
</template>

<script>
import BaseAlert from "../AlertaBase.vue";
import DisponibilidadActividad from "./DisponibilidadActividad.vue";
import SelectorMiembroProyecto from "./SelectorMiembroProyecto.vue";
import {
  etiquetaEstadoActividad,
  formatearDuracionMinutos,
} from "../../utils/actividadConstants.js";
import { perfilesAsignadosDe } from "../../utils/asignacionConstants.js";

/*
 * Confirmación de UC-70. El contenedor hace el POST; este modal sólo muestra la
 * actividad, el selector de miembros y la disponibilidad. El backend revalida
 * siempre la disponibilidad y las reglas de negocio.
 */
export default {
  name: "ModalAsignarActividad",
  components: {
    BaseAlert,
    DisponibilidadActividad,
    SelectorMiembroProyecto,
  },
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
      default: null,
    },
    nombreProyecto: {
      type: String,
      default: "",
    },
    idPerfilesAsignados: {
      type: Array,
      default: () => [],
    },
    tieneFechaEntrega: {
      type: Boolean,
      default: true,
    },
    asignando: {
      type: Boolean,
      default: false,
    },
    error: {
      type: String,
      default: "",
    },
    /** Se incrementa desde el padre para recargar el selector tras un 409. */
    tokenRefrescoMiembros: {
      type: Number,
      default: 0,
    },
    /** Se incrementa desde el padre para reconsultar tras un 409. */
    tokenRefrescoDisponibilidad: {
      type: Number,
      default: 0,
    },
  },
  emits: ["update:modelValue", "confirmar"],
  data() {
    return {
      idPerfilSeleccionado: null,
      miembroSeleccionado: null,
      disponibilidad: null,
    };
  },
  computed: {
    idActividad() {
      return this.actividad?.idActividad ?? null;
    },
    duracionActividad() {
      return formatearDuracionMinutos(this.actividad?.duracionMinutos);
    },
    perfilesAsignados() {
      const desdeActividad = perfilesAsignadosDe(this.actividad);
      if (desdeActividad.length) return desdeActividad;
      return Array.isArray(this.idPerfilesAsignados)
        ? this.idPerfilesAsignados
        : [];
    },
    textoAsignados() {
      const total = this.perfilesAsignados.length;
      if (!total) return "Sin miembros asignados";
      return total === 1
        ? "1 miembro ya asignado"
        : `${total} miembros ya asignados`;
    },
    idsDisponibilidad() {
      const ids = [];
      const agregar = (idPerfil) => {
        if (idPerfil == null || idPerfil === "") return;
        if (ids.some((id) => String(id) === String(idPerfil))) return;
        ids.push(idPerfil);
      };

      agregar(this.idPerfilSeleccionado);
      this.perfilesAsignados.forEach(agregar);
      return ids;
    },
    tituloDisponibilidad() {
      return this.perfilesAsignados.length
        ? "Disponibilidad del miembro y asignados"
        : "Disponibilidad del miembro";
    },
    esDirectorSeleccionado() {
      return (
        String(this.miembroSeleccionado?.rol || "").toUpperCase() === "DIRECTOR"
      );
    },
    puedeConfirmar() {
      return (
        !this.asignando &&
        this.tieneFechaEntrega &&
        this.idPerfilSeleccionado != null &&
        this.disponibilidad?.disponible !== false
      );
    },
    textoConfirmar() {
      if (this.asignando) return "Asignando…";
      return "Confirmar asignación";
    },
  },
  watch: {
    modelValue(valor) {
      if (valor) {
        this.reiniciarSeleccion();
      } else {
        this.limpiar();
      }
    },
    idPerfilesAsignados: {
      deep: true,
      handler() {
        if (!this.modelValue) return;
        this.disponibilidad = null;
      },
    },
  },
  methods: {
    etiquetaEstadoActividad,
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
        idPerfil: this.idPerfilSeleccionado,
        miembro: this.miembroSeleccionado,
      });
    },
    onCambioSeleccionId(valor) {
      this.idPerfilSeleccionado = valor ?? null;
      if (valor == null || valor === "") {
        this.miembroSeleccionado = null;
        this.disponibilidad = null;
      }
    },
    onSeleccionado(miembro) {
      this.miembroSeleccionado = miembro || null;
      this.idPerfilSeleccionado = miembro?.idPerfil ?? null;
      this.disponibilidad = null;
    },
    onDisponibilidad(resultado) {
      this.disponibilidad = resultado;
    },
    reiniciarSeleccion() {
      this.idPerfilSeleccionado = null;
      this.miembroSeleccionado = null;
      this.disponibilidad = null;
    },
    limpiar() {
      this.idPerfilSeleccionado = null;
      this.miembroSeleccionado = null;
      this.disponibilidad = null;
    },
  },
};
</script>

<style scoped>
.asignar-actividad-modal__titulo {
  margin: 0;
}

.asignar-actividad-modal__intro {
  margin: 0.25rem 0 0.9rem;
  color: var(--color-text);
  font-size: 0.94rem;
  line-height: 1.5;
}

.asignar-actividad-modal__detalle {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0 0 0.9rem;
  padding: 0.85rem 0.95rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface-muted);
}

.asignar-actividad-modal__fila {
  display: grid;
  grid-template-columns: 7.5rem 1fr;
  gap: 0.75rem;
  align-items: baseline;
}

.asignar-actividad-modal__fila dt {
  color: var(--color-text-muted);
  font-size: 0.76rem;
  font-weight: 600;
}

.asignar-actividad-modal__fila dd {
  margin: 0;
  color: var(--color-text);
  font-size: 0.86rem;
  line-height: 1.45;
}

.asignar-actividad-modal__seccion {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  margin-bottom: 0.85rem;
}

.asignar-actividad-modal__subtitulo {
  margin: 0;
  color: var(--color-text);
  font-size: 0.9rem;
  font-weight: 700;
}

.asignar-actividad-modal__nota {
  margin: 0.6rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.78rem;
  line-height: 1.5;
}

.asignar-actividad-modal__aviso {
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
  margin: 0.75rem 0 0;
  padding: 0.6rem 0.7rem;
  border: 1px solid var(--color-warning-border);
  border-radius: 8px;
  background: var(--color-warning-soft);
  color: var(--color-warning-text);
  font-size: 0.8rem;
  line-height: 1.45;
}

.asignar-actividad-modal__aviso--bloqueo {
  border-color: var(--color-danger-border);
  background: var(--color-danger-soft);
  color: var(--color-danger-text);
}

.asignar-actividad-modal__aviso .material-symbols-outlined {
  font-size: 1rem;
}

.asignar-actividad-modal__alerta {
  margin-top: 0.85rem !important;
}

.asignar-actividad-modal__acciones {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
  width: 100%;
}
</style>
