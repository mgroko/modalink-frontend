<template>
  <div class="requerimiento">
    <div class="requerimiento__encabezado">
      <span class="requerimiento__titulo">Requerimiento {{ indice + 1 }}</span>
      <VaButton
        preset="secondary"
        size="small"
        color="danger"
        icon="mso-delete"
        :disabled="!eliminarPermitido"
        title="Quitar requerimiento"
        @click="$emit('eliminar')"
      >
        Quitar
      </VaButton>
    </div>

    <div class="requerimiento__fila">
      <VaInput
        v-model="modelValue.cantidad"
        type="number"
        label="Cantidad de personas*"
        placeholder="Ej: 2"
        :rules="[reglas.requerido, reglas.cantidadPositiva]"
        :error="!!errores.cantidad"
        :error-messages="errores.cantidad"
      />

      <VaSelect
        v-model="modelValue.idProfesion"
        :options="profesiones"
        value-by="idProfesion"
        :text-by="(o) => capitalizar(o.nombre)"
        label="Profesión*"
        placeholder="Ej: Modelo"
        :rules="[reglas.requerido]"
        :error="!!errores.idProfesion"
        :error-messages="errores.idProfesion"
      />
    </div>

    <div class="requerimiento__seccion">
      <p class="requerimiento__seccion-titulo">Características técnicas</p>
      <p class="requerimiento__seccion-ayuda">
        Preferencias técnicas por profesión (opcional, no excluyentes)
      </p>

      <div class="requerimiento__bloque">
        <p v-if="!modelValue.idProfesion" class="requerimiento__hint">
          Las características se filtran por profesión. Seleccioná una para poder agregar
          características.
        </p>

        <VaSelect
          v-else
          v-model="caracteristicaAAgregar"
          :options="caracteristicasDisponibles"
          value-by="idCaracteristica"
          :text-by="etiquetaCaracteristica"
          label="Agregar característica"
          placeholder="Elegí una característica"
          :loading="cargandoCaracteristicas"
          no-options-text="Todas las características ya fueron agregadas"
          clearable
          @update:model-value="agregarCaracteristica"
        />
      </div>

      <div
        v-for="(carac, i) in modelValue.caracteristicas"
        :key="carac.idCaracteristica"
        class="requerimiento__caracteristica"
      >
        <div class="requerimiento__caracteristica-cabecera">
          <span class="requerimiento__caracteristica-nombre">
            {{ etiquetaCaracteristica(catalogoDe(carac.idCaracteristica)) }}
          </span>
          <VaButton
            preset="secondary"
            size="small"
            color="danger"
            icon="mso-close"
            title="Quitar característica"
            @click="quitarCaracteristica(i)"
          />
        </div>

        <p v-if="errorDeCaracteristica(i)" class="requerimiento__error">
          {{ errorDeCaracteristica(i) }}
        </p>

        <div v-if="esNumerico(carac)" class="requerimiento__rango">
          <VaInput
            v-model="carac.valorMin"
            type="number"
            label="Valor mínimo"
            placeholder="Mín."
            :rules="[reglas.numerico, reglas.noNegativo]"
          />
          <VaInput
            v-model="carac.valorMax"
            type="number"
            label="Valor máximo"
            placeholder="Máx."
            :rules="[reglas.numerico, reglas.noNegativo]"
          />
        </div>

        <template v-else-if="esEnumerado(carac)">
          <p
            v-if="!(catalogoDe(carac.idCaracteristica)?.valores || []).length"
            class="requerimiento__hint"
          >
            Esta característica no tiene valores de catálogo cargados.
          </p>
          <VaOptionList
            v-else
            v-model="carac.valores"
            type="checkbox"
            :options="catalogoDe(carac.idCaracteristica).valores"
            value-by="idValor"
            :text-by="textoValor"
            class="requerimiento__valores"
          />
        </template>

        <p v-else class="requerimiento__hint">Sin configuración adicional.</p>
      </div>
    </div>

    <MultiSelectHabilidades
      v-model="modelValue.habilidades"
      :options="habilidades"
      :loading="cargandoHabilidades"
      :ayuda="ayudaHabilidades"
      :error="!!errores.habilidades"
      :error-message="errores.habilidades"
    />

    <VaInput
      v-model="modelValue.descripcion"
      label="Descripción"
      placeholder="Descripción de la vacante..."
      :max-length="200"
      counter
      :rules="[reglas.max200]"
    />
  </div>
</template>

<script>
import perfilService from "../../services/perfilService.js";
import { reglasProyecto } from "../../utils/reglas.js";
import { esNumerico as esTipoNumerico, esEnumerado as esTipoEnumerado } from "../../utils/proyectoConstants.js";
import { ETIQUETAS_CARACTERISTICAS, normCodigo } from "../../utils/perfilConstants.js";
import MultiSelectHabilidades from "./MultiSelectHabilidades.vue";

export default {
  name: "RequerimientoForm",
  components: { MultiSelectHabilidades },
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
    errores: {
      type: Object,
      default: () => ({}),
    },
  },
  emits: ["update:modelValue", "eliminar", "catalogo-cargado"],
  data() {
    return {
      reglas: reglasProyecto,
      ayudaHabilidades: "Destrezas que valorás en los postulantes",
      caracteristicasCatalogo: [],
      cargandoCaracteristicas: false,
      caracteristicaAAgregar: null,
    };
  },
  computed: {
    caracteristicasDisponibles() {
      const agregadas = new Set(
        (this.modelValue.caracteristicas || []).map((c) => c.idCaracteristica)
      );
      return this.caracteristicasCatalogo.filter((c) => !agregadas.has(c.idCaracteristica));
    },
  },
  watch: {
    "modelValue.idProfesion": {
      immediate: true,
      handler(idProfesion, anterior) {
        if (!this.modelValue) return;
        if (anterior != null && idProfesion !== anterior) {
          this.modelValue.caracteristicas = [];
          this.caracteristicaAAgregar = null;
        }
        this.cargarCaracteristicas(idProfesion);
      },
    },
  },
  methods: {
    async cargarCaracteristicas(idProfesion) {
      this.caracteristicasCatalogo = [];
      this.caracteristicaAAgregar = null;
      if (!idProfesion) return;

      this.cargandoCaracteristicas = true;
      try {
        const response = await perfilService.caracteristicasPorProfesion(idProfesion);
        if (this.modelValue.idProfesion !== idProfesion) return;
        const datos = response?.data;
        this.caracteristicasCatalogo = Array.isArray(datos) ? datos : datos?.caracteristicas || [];
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
      this.caracteristicaAAgregar = null;
    },
    quitarCaracteristica(indice) {
      this.modelValue.caracteristicas.splice(indice, 1);
    },
    catalogoDe(idCaracteristica) {
      return (
        this.caracteristicasCatalogo.find((c) => c.idCaracteristica === idCaracteristica) || null
      );
    },
    esNumerico(carac) {
      const catalogo = this.catalogoDe(carac.idCaracteristica);
      return catalogo ? esTipoNumerico(catalogo.tipoDato) : false;
    },
    esEnumerado(carac) {
      const catalogo = this.catalogoDe(carac.idCaracteristica);
      return catalogo ? esTipoEnumerado(catalogo.tipoDato) : false;
    },
    etiquetaCaracteristica(carac) {
      if (!carac) return "";
      const etiqueta = ETIQUETAS_CARACTERISTICAS[normCodigo(carac.codigo)];
      return etiqueta || this.capitalizar(carac.codigo);
    },
    textoValor(valor) {
      return this.capitalizar(valor?.codigo);
    },
    errorDeCaracteristica(indice) {
      return this.errores[`caracteristicas.${indice}`];
    },
    capitalizar(texto) {
      if (!texto) return "";
      return String(texto)
        .toLowerCase()
        .split(/[_\-.]+/)
        .filter(Boolean)
        .map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1))
        .join(" ");
    },
  },
};
</script>

<style scoped>
.requerimiento {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.25rem;
  border: 1px solid var(--va-background-border);
  border-radius: 8px;
  background: var(--va-background-element);
}

.requerimiento__encabezado {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.requerimiento__titulo {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--va-text-primary);
}

.requerimiento__fila {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.requerimiento__seccion {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.requerimiento__seccion-titulo {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--va-text-primary);
}

.requerimiento__seccion-ayuda {
  margin: 0.15rem 0 0;
  font-size: 0.8rem;
  font-weight: 400;
  color: var(--va-secondary);
}

.requerimiento__bloque {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid var(--va-background-border);
  border-radius: 8px;
  background: var(--va-background-element);
}

.requerimiento__hint {
  margin: 0;
  font-size: 0.8rem;
  color: var(--va-secondary);
}

.requerimiento__error {
  margin: 0;
  font-size: 0.8rem;
  color: var(--va-danger);
}

.requerimiento__caracteristica {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 0.9rem;
  border: 1px solid var(--va-background-border);
  border-radius: 8px;
  background: var(--color-background, #fff);
}

.requerimiento__caracteristica-cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.requerimiento__caracteristica-nombre {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--va-text-primary);
}

.requerimiento__rango {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.requerimiento__valores {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1.25rem;
}
</style>
