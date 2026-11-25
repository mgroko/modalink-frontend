<template>
  <div class="selector-requerimiento-general">
    <VaInput
      v-model="busqueda"
      class="selector-requerimiento-general__input"
      placeholder="Buscar por profesión o descripción..."
      clearable
      :disabled="deshabilitado"
    >
      <template #prependInner>
        <span class="material-symbols-outlined" aria-hidden="true">search</span>
      </template>
    </VaInput>

    <button
      v-if="permitirNinguno"
      type="button"
      class="selector-requerimiento-general__item selector-requerimiento-general__item--ninguno"
      :class="{
        'selector-requerimiento-general__item--seleccionado':
          modelValue == null,
      }"
      :disabled="deshabilitado"
      :aria-pressed="modelValue == null ? 'true' : 'false'"
      @click="seleccionarNinguno"
    >
      <span class="selector-requerimiento-general__radio" aria-hidden="true">
        <span
          v-if="modelValue == null"
          class="selector-requerimiento-general__radio-punto"
        ></span>
      </span>
      <span class="selector-requerimiento-general__cuerpo">
        <span class="selector-requerimiento-general__titulo">
          {{ textoNinguno }}
        </span>
      </span>
    </button>

    <p
      v-if="!filtrados.length && !permitirNinguno"
      class="selector-requerimiento-general__vacio"
    >
      <span class="material-symbols-outlined" aria-hidden="true">work_off</span>
      No hay requerimientos generales disponibles con los filtros actuales.
    </p>

    <ul v-else class="selector-requerimiento-general__lista">
      <li
        v-for="requerimiento in filtrados"
        :key="requerimiento.idRequerimientoGral"
      >
        <button
          type="button"
          class="selector-requerimiento-general__item"
          :class="{
            'selector-requerimiento-general__item--seleccionado':
              estaSeleccionado(requerimiento),
          }"
          :disabled="deshabilitado"
          :aria-pressed="
            estaSeleccionado(requerimiento) ? 'true' : 'false'
          "
          @click="seleccionar(requerimiento)"
        >
          <span class="selector-requerimiento-general__radio" aria-hidden="true">
            <span
              v-if="estaSeleccionado(requerimiento)"
              class="selector-requerimiento-general__radio-punto"
            ></span>
          </span>

          <span class="selector-requerimiento-general__cuerpo">
            <span class="selector-requerimiento-general__titulo">
              {{ requerimiento.nombreProfesion || "Profesión no informada" }}
            </span>

            <span class="selector-requerimiento-general__meta">
              <template v-if="requerimiento.cantidad != null">
                {{ requerimiento.cantidad }}
                {{ requerimiento.cantidad === 1 ? "persona" : "personas" }}
              </template>
              <template v-if="requerimiento.faltantes != null">
                · {{ textoFaltantes(requerimiento.faltantes) }}
              </template>
            </span>

            <span
              v-if="requerimiento.descripcion"
              class="selector-requerimiento-general__descripcion"
            >
              {{ requerimiento.descripcion }}
            </span>

            <span
              v-if="requerimiento.satisfecho"
              class="selector-requerimiento-general__badge"
            >
              Cupo completo
            </span>
          </span>
        </button>
      </li>
    </ul>
  </div>
</template>

<script>
/*
 * Selector de requerimientos generales existentes del proyecto.
 *
 * Es presentacional: el padre decide qué requerimientos ofrece (por ejemplo,
 * sólo los que todavía tienen cupo) y este componente sólo filtra por
 * profesión y texto. El backend sigue siendo la fuente de verdad del cupo.
 */
export default {
  name: "SelectorRequerimientoGeneral",
  props: {
    requerimientos: {
      type: Array,
      default: () => [],
    },
    modelValue: {
      type: [Number, String],
      default: null,
    },
    /** Cuando se indica, sólo se muestran requerimientos de esa profesión. */
    idProfesion: {
      type: [Number, String],
      default: null,
    },
    deshabilitado: {
      type: Boolean,
      default: false,
    },
    /** Agrega una opción explícita para dejar al miembro sin requerimiento. */
    permitirNinguno: {
      type: Boolean,
      default: false,
    },
    textoNinguno: {
      type: String,
      default: "Sin requerimiento general",
    },
  },
  emits: ["update:modelValue", "seleccionado"],
  data() {
    return {
      busqueda: "",
    };
  },
  computed: {
    filtrados() {
      const texto = this.normalizarTexto(this.busqueda);
      return (this.requerimientos || [])
        .filter((requerimiento) => {
          if (requerimiento?.idRequerimientoGral == null) return false;

          const esSeleccionado =
            this.modelValue != null &&
            String(this.modelValue) ===
              String(requerimiento.idRequerimientoGral);

          // El requerimiento ya seleccionado se muestra aunque el filtro de
          // profesión lo excluya, para que el usuario pueda verlo o cambiarlo.
          if (
            this.idProfesion != null &&
            String(requerimiento.idProfesion) !== String(this.idProfesion) &&
            !esSeleccionado
          ) {
            return false;
          }
          if (!texto) return true;
          const contenido = [
            requerimiento.nombreProfesion,
            requerimiento.descripcion,
          ]
            .filter(Boolean)
            .join(" ");
          return (
            esSeleccionado ||
            this.normalizarTexto(contenido).includes(texto)
          );
        })
        .sort((a, b) => {
          const profesion = String(a?.nombreProfesion || "").localeCompare(
            String(b?.nombreProfesion || ""),
            "es"
          );
          if (profesion !== 0) return profesion;
          return Number(a?.idRequerimientoGral) - Number(b?.idRequerimientoGral);
        });
    },
  },
  methods: {
    normalizarTexto(valor) {
      return String(valor || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
    },
    estaSeleccionado(requerimiento) {
      return (
        this.modelValue != null &&
        String(this.modelValue) ===
          String(requerimiento.idRequerimientoGral)
      );
    },
    textoFaltantes(faltantes) {
      const numero = Number(faltantes);
      if (!Number.isFinite(numero) || numero <= 0) return "sin vacantes";
      return `${numero} ${numero === 1 ? "vacante" : "vacantes"}`;
    },
    seleccionar(requerimiento) {
      if (this.deshabilitado) return;
      this.$emit("update:modelValue", requerimiento.idRequerimientoGral);
      this.$emit("seleccionado", requerimiento);
    },
    seleccionarNinguno() {
      if (this.deshabilitado) return;
      this.$emit("update:modelValue", null);
      this.$emit("seleccionado", null);
    },
  },
};
</script>

<style scoped>
.selector-requerimiento-general {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.selector-requerimiento-general__input {
  width: 100%;
}

.selector-requerimiento-general__lista {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  max-height: 360px;
  margin: 0;
  padding: 0 0.15rem 0 0;
  overflow-y: auto;
  list-style: none;
}

.selector-requerimiento-general__item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  width: 100%;
  padding: 0.85rem 1rem;
  border: 1px solid var(--color-border-strong);
  border-radius: 10px;
  background: var(--color-surface);
  color: var(--color-text);
  text-align: left;
  cursor: pointer;
}

.selector-requerimiento-general__item:hover:not(:disabled) {
  border-color: var(--color-primary);
}

.selector-requerimiento-general__item--seleccionado {
  border-color: var(--color-primary);
  background: var(--color-info-soft);
}

.selector-requerimiento-general__item--ninguno {
  border-style: dashed;
}

.selector-requerimiento-general__item:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.selector-requerimiento-general__radio {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
  margin-top: 0.15rem;
  border: 2px solid var(--color-border-strong);
  border-radius: 50%;
  background: var(--color-surface);
}

.selector-requerimiento-general__item--seleccionado
  .selector-requerimiento-general__radio {
  border-color: var(--color-primary);
}

.selector-requerimiento-general__radio-punto {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-primary);
}

.selector-requerimiento-general__cuerpo {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.selector-requerimiento-general__titulo {
  color: var(--color-text);
  font-size: 0.92rem;
  font-weight: 700;
  line-height: 1.35;
}

.selector-requerimiento-general__meta {
  color: var(--color-text-muted);
  font-size: 0.8rem;
  line-height: 1.4;
}

.selector-requerimiento-general__descripcion {
  color: var(--color-text-muted);
  font-size: 0.78rem;
  line-height: 1.45;
}

.selector-requerimiento-general__badge {
  align-self: flex-start;
  margin-top: 0.15rem;
  padding: 0.08rem 0.42rem;
  border: 1px solid var(--color-warning-border);
  border-radius: 999px;
  background: var(--color-warning-soft, var(--color-surface-muted));
  color: var(--color-warning-text, var(--color-text-muted));
  font-size: 0.68rem;
  font-weight: 600;
}

.selector-requerimiento-general__vacio {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin: 0;
  padding: 1.1rem 0.9rem;
  border: 1px dashed var(--color-border-strong);
  border-radius: 10px;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  font-size: 0.84rem;
  line-height: 1.45;
}

.selector-requerimiento-general__vacio .material-symbols-outlined {
  font-size: 1.2rem;
}
</style>
