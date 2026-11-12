<template>
  <VaModal
    :model-value="modelValue"
    hide-default-actions
    size="large"
    blur
    class="catalogo-requerimientos"
    @update:model-value="cambiarVisibilidad"
  >
    <template #header>
      <h3 class="va-h5 catalogo-requerimientos__titulo">
        Requerimientos de otras actividades
      </h3>
    </template>

    <p class="catalogo-requerimientos__ayuda">
      Elegí los requerimientos que querés recuperar. Se copiarán sus datos,
      características y habilidades en esta actividad.
    </p>

    <div class="catalogo-requerimientos__buscador">
      <VaInput
        v-model="busqueda"
        placeholder="Buscar por actividad, profesión o descripción"
        removable
      >
        <template #prependInner>
          <VaIcon name="mso-search" color="grey" size="small" />
        </template>
      </VaInput>
    </div>

    <BaseAlert :message="error" type="error" />

    <div v-if="!actividadesConRequerimientos.length" class="catalogo-requerimientos__nota">
      Todavía no hay requerimientos cargados en otras actividades del proyecto.
    </div>
    <div v-else-if="!gruposVisibles.length" class="catalogo-requerimientos__nota">
      Sin resultados para "{{ busqueda }}".
    </div>

    <div v-else class="catalogo-requerimientos__grupos">
      <section
        v-for="grupo in gruposVisibles"
        :key="grupo.idActividad"
        class="catalogo-requerimientos__grupo"
      >
        <header class="catalogo-requerimientos__grupo-header">
          <VaCheckbox
            class="catalogo-requerimientos__grupo-check"
            :model-value="grupoCompleto(grupo)"
            :indeterminate="grupoParcial(grupo)"
            :aria-label="`Seleccionar todos los requerimientos de ${grupo.nombre}`"
            @update:modelValue="alternarGrupo(grupo)"
          />
          <div class="catalogo-requerimientos__grupo-titulo">
            <strong>{{ grupo.nombre }}</strong>
            <span class="catalogo-requerimientos__estado">
              {{ etiquetaEstadoActividad(grupo.estado) }}
            </span>
          </div>
          <span class="catalogo-requerimientos__grupo-cantidad">
            {{ grupo.requerimientos.length }}
            {{ grupo.requerimientos.length === 1 ? "requerimiento" : "requerimientos" }}
          </span>
        </header>

        <div class="catalogo-requerimientos__items">
          <div
            v-for="requerimiento in grupo.requerimientos"
            :key="clave(grupo.idActividad, requerimiento)"
            class="catalogo-requerimientos__item"
          >
            <VaCheckbox
              :model-value="estaSeleccionado(grupo.idActividad, requerimiento)"
              :aria-label="`Seleccionar requerimiento ${nombreProfesion(requerimiento)}`"
              @update:modelValue="alternar(grupo.idActividad, requerimiento)"
            />
            <div class="catalogo-requerimientos__item-texto">
              <strong>
                {{ requerimiento.cantidad }} ×
                {{ nombreProfesion(requerimiento) }}
              </strong>
              <p v-if="requerimiento.descripcion">
                {{ requerimiento.descripcion }}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>

    <div
      v-if="hayRequerimientosActuales && totalSeleccionados > 0"
      class="catalogo-requerimientos__modo"
    >
      <span class="catalogo-requerimientos__modo-titulo">
        Ya tenés requerimientos cargados. ¿Cómo querés incorporar los seleccionados?
      </span>
      <VaRadio
        v-model="modo"
        :options="opcionesModo"
        value-by="value"
        text-by="text"
      />
    </div>

    <template #footer>
      <div class="catalogo-requerimientos__footer">
        <span class="catalogo-requerimientos__contador">
          {{ totalSeleccionados }}
          {{ totalSeleccionados === 1 ? "seleccionado" : "seleccionados" }}
        </span>

        <div class="catalogo-requerimientos__acciones">
          <VaButton
            preset="secondary"
            :disabled="procesando"
            @click="cambiarVisibilidad(false)"
          >
            Cancelar
          </VaButton>
          <VaButton
            :loading="procesando"
            :disabled="!totalSeleccionados || procesando"
            @click="confirmar"
          >
            {{ textoConfirmar }}
          </VaButton>
        </div>
      </div>
    </template>
  </VaModal>
</template>

<script>
import BaseAlert from "../AlertaBase.vue";
import { etiquetaEstadoActividad } from "../../utils/actividadConstants.js";

function normalizarTexto(valor) {
  return String(valor || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export default {
  name: "CatalogoRequerimientosActividades",
  components: { BaseAlert },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    actividades: {
      type: Array,
      default: () => [],
    },
    profesiones: {
      type: Array,
      default: () => [],
    },
    hayRequerimientosActuales: {
      type: Boolean,
      default: false,
    },
    procesando: {
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
      busqueda: "",
      seleccionados: [],
      modo: "agregar",
      opcionesModo: [
        { text: "Agregar a los existentes", value: "agregar" },
        { text: "Reemplazar los existentes", value: "reemplazar" },
      ],
    };
  },
  computed: {
    actividadesConRequerimientos() {
      return (this.actividades || []).filter(
        (actividad) =>
          Array.isArray(actividad?.requerimientos) &&
          actividad.requerimientos.length > 0
      );
    },
    gruposVisibles() {
      const texto = normalizarTexto(this.busqueda);

      return this.actividadesConRequerimientos
        .map((actividad) => {
          const requerimientos = actividad.requerimientos.filter(
            (requerimiento) => {
              if (!texto) return true;
              const objetivo = normalizarTexto(
                [
                  actividad.nombre,
                  actividad.estado,
                  requerimiento.nombreProfesion,
                  requerimiento.descripcion,
                  this.nombreProfesion(requerimiento),
                ]
                  .filter(Boolean)
                  .join(" ")
              );
              return objetivo.includes(texto);
            }
          );

          return {
            idActividad: actividad.idActividad,
            nombre: actividad.nombre,
            estado: actividad.estado,
            requerimientos,
          };
        })
        .filter((grupo) => grupo.requerimientos.length > 0);
    },
    totalSeleccionados() {
      return this.seleccionados.length;
    },
    textoConfirmar() {
      if (this.modo === "reemplazar" && this.hayRequerimientosActuales) {
        return "Reemplazar seleccionados";
      }
      return "Agregar seleccionados";
    },
  },
  watch: {
    modelValue(abierto) {
      if (!abierto) return;
      this.busqueda = "";
      this.seleccionados = [];
      this.modo = "agregar";
    },
  },
  methods: {
    etiquetaEstadoActividad,
    cambiarVisibilidad(abierto) {
      if (this.procesando && !abierto) return;
      this.$emit("update:modelValue", abierto);
    },
    clave(idActividad, requerimiento) {
      return `${idActividad}:${requerimiento.idRequerimiento}`;
    },
    nombreProfesion(requerimiento) {
      if (requerimiento?.nombreProfesion) return requerimiento.nombreProfesion;

      const profesion = (this.profesiones || []).find(
        (item) => String(item.idProfesion) === String(requerimiento?.idProfesion)
      );
      return profesion?.nombre || "Profesión sin definir";
    },
    estaSeleccionado(idActividad, requerimiento) {
      const clave = this.clave(idActividad, requerimiento);
      return this.seleccionados.some(
        (item) => this.clave(item.idActividad, item.requerimiento) === clave
      );
    },
    alternar(idActividad, requerimiento) {
      const clave = this.clave(idActividad, requerimiento);
      const existe = this.seleccionados.some(
        (item) => this.clave(item.idActividad, item.requerimiento) === clave
      );

      if (existe) {
        this.seleccionados = this.seleccionados.filter(
          (item) => this.clave(item.idActividad, item.requerimiento) !== clave
        );
        return;
      }

      this.seleccionados.push({ idActividad, requerimiento });
    },
    grupoCompleto(grupo) {
      return (
        grupo.requerimientos.length > 0 &&
        grupo.requerimientos.every((requerimiento) =>
          this.estaSeleccionado(grupo.idActividad, requerimiento)
        )
      );
    },
    grupoParcial(grupo) {
      const seleccionados = grupo.requerimientos.filter((requerimiento) =>
        this.estaSeleccionado(grupo.idActividad, requerimiento)
      );
      return (
        seleccionados.length > 0 &&
        seleccionados.length < grupo.requerimientos.length
      );
    },
    alternarGrupo(grupo) {
      const claves = new Set(
        grupo.requerimientos.map((requerimiento) =>
          this.clave(grupo.idActividad, requerimiento)
        )
      );

      if (this.grupoCompleto(grupo)) {
        this.seleccionados = this.seleccionados.filter(
          (item) => !claves.has(this.clave(item.idActividad, item.requerimiento))
        );
        return;
      }

      const faltantes = grupo.requerimientos.filter(
        (requerimiento) =>
          !this.estaSeleccionado(grupo.idActividad, requerimiento)
      );
      this.seleccionados.push(
        ...faltantes.map((requerimiento) => ({
          idActividad: grupo.idActividad,
          requerimiento,
        }))
      );
    },
    confirmar() {
      if (!this.totalSeleccionados || this.procesando) return;

      this.$emit("confirmar", {
        seleccionados: this.seleccionados.map((item) => ({
          idActividad: item.idActividad,
          idRequerimiento: item.requerimiento.idRequerimiento,
        })),
        modo: this.hayRequerimientosActuales ? this.modo : "agregar",
      });
    },
  },
};
</script>

<style scoped>
.catalogo-requerimientos__titulo {
  margin: 0;
}

.catalogo-requerimientos__ayuda {
  margin: 0 0 1rem;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  line-height: 1.5;
}

.catalogo-requerimientos__buscador {
  margin-bottom: 0.85rem;
}

.catalogo-requerimientos__grupos {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 24rem;
  overflow-y: auto;
  padding-right: 0.25rem;
}

.catalogo-requerimientos__grupo {
  border: 1px solid var(--color-border-soft);
  border-radius: 0.75rem;
  overflow: hidden;
}

.catalogo-requerimientos__grupo-header {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.65rem 0.8rem;
  background: var(--color-surface-soft);
  border-bottom: 1px solid var(--color-border-soft);
}

.catalogo-requerimientos__grupo-check {
  --va-checkbox-horizontal-gap: 0;
  flex: 0 0 auto;
}

.catalogo-requerimientos__grupo-titulo {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.45rem;
  min-width: 0;
  flex: 1;
}

.catalogo-requerimientos__grupo-titulo strong {
  overflow: hidden;
  color: var(--color-text);
  font-size: 0.85rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.catalogo-requerimientos__estado {
  padding: 0.1rem 0.4rem;
  color: var(--color-text-muted);
  background: var(--color-surface-muted);
  border-radius: 999px;
  font-size: 0.65rem;
  font-weight: 600;
  white-space: nowrap;
}

.catalogo-requerimientos__grupo-cantidad {
  color: var(--color-text-muted);
  font-size: 0.7rem;
  white-space: nowrap;
}

.catalogo-requerimientos__items {
  display: flex;
  flex-direction: column;
}

.catalogo-requerimientos__item {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.6rem 0.8rem;
  border-bottom: 1px solid var(--color-border-soft);
}

.catalogo-requerimientos__item:last-child {
  border-bottom: 0;
}

.catalogo-requerimientos__item-texto {
  min-width: 0;
}

.catalogo-requerimientos__item-texto strong {
  display: block;
  color: var(--color-text);
  font-size: 0.82rem;
}

.catalogo-requerimientos__item-texto p {
  margin: 0.15rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.76rem;
  line-height: 1.4;
}

.catalogo-requerimientos__modo {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-top: 1rem;
  padding: 0.75rem 0.85rem;
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border-soft);
  border-radius: 0.65rem;
}

.catalogo-requerimientos__modo-titulo {
  color: var(--color-text);
  font-size: 0.8rem;
  font-weight: 600;
}

.catalogo-requerimientos__nota {
  padding: 1.25rem 0.5rem;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  text-align: center;
}

.catalogo-requerimientos__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
}

.catalogo-requerimientos__contador {
  color: var(--color-text-muted);
  font-size: 0.78rem;
  white-space: nowrap;
}

.catalogo-requerimientos__acciones {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

@media (max-width: 560px) {
  .catalogo-requerimientos__footer {
    align-items: stretch;
    flex-direction: column;
  }

  .catalogo-requerimientos__acciones {
    flex-direction: column-reverse;
  }
}
</style>
