<template>
  <div class="objetivos">
    <div v-if="mostrarEncabezado" class="objetivos__encabezado">
      <div>
        <p class="objetivos__titulo">Objetivos</p>
        <p class="objetivos__ayuda">Definí qué querés lograr con el proyecto (opcional).</p>
      </div>
      <VaButton preset="secondary" size="small" icon="mso-add" @click="agregar">
        Agregar objetivo
      </VaButton>
    </div>

    <p v-if="modelValue.length === 0" class="objetivos__vacio">
      <span class="material-symbols-outlined objetivos__vacio-icono">flag</span>
      Aún no agregaste objetivos.
    </p>

    <div v-for="(objetivo, i) in modelValue" :key="i" class="objetivos__fila">
      <div class="objetivos__fila-cabecera">
        <span class="objetivos__fila-numero">Objetivo {{ i + 1 }}</span>
        <VaButton
          preset="secondary"
          color="danger"
          size="small"
          icon="mso-delete"
          title="Quitar objetivo"
          @click="quitar(i)"
        />
      </div>

      <VaInput
        v-model="objetivo.nombre"
        label="Nombre*"
        placeholder="Nombre del objetivo"
        :max-length="100"
        counter
        :rules="[reglas.requerido, reglas.max100]"
        :error="errorDe(i, 'nombre') ? true : undefined"
        :error-messages="errorDe(i, 'nombre') || undefined"
      />

      <VaTextarea
        v-model="objetivo.descripcion"
        label="Descripción (opcional)"
        placeholder="Detalles del objetivo..."
        :max-length="300"
        counter
        :rows="2"
        :rules="[reglas.max300]"
        :error="errorDe(i, 'descripcion') ? true : undefined"
        :error-messages="errorDe(i, 'descripcion') || undefined"
      />
    </div>
  </div>
</template>

<script>
import { reglasProyecto } from "../../utils/reglas.js";

export default {
  name: "ListaDinamicaObjetivos",
  props: {
    modelValue: {
      type: Array,
      default: () => [],
    },
    errores: {
      type: Object,
      default: () => ({}),
    },
    mostrarEncabezado: {
      type: Boolean,
      default: true,
    },
  },
  emits: ["update:modelValue"],
  data() {
    return {
      reglas: reglasProyecto,
    };
  },
  methods: {
    agregar() {
      this.$emit("update:modelValue", [
        ...this.modelValue,
        { nombre: "", descripcion: "" },
      ]);
    },
    quitar(indice) {
      this.$emit(
        "update:modelValue",
        this.modelValue.filter((_, i) => i !== indice)
      );
    },
    errorDe(indice, campo) {
      return this.errores[`objetivos.${indice}.${campo}`];
    },
  },
};
</script>

<style scoped>
.objetivos__encabezado {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.objetivos__titulo {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--va-text-primary);
}

.objetivos__ayuda {
  margin: 0.2rem 0 0;
  font-size: 0.8rem;
  color: var(--va-secondary);
}

.objetivos__vacio {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0 0 0.75rem;
  padding: 0.75rem 1rem;
  border: 1px dashed var(--va-background-border);
  border-radius: 8px;
  font-size: 0.85rem;
  color: var(--va-secondary);
}

.objetivos__vacio-icono {
  font-size: 1rem;
}

.objetivos__fila {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  margin-bottom: 0.75rem;
  border: 1px solid var(--va-background-border);
  border-radius: 8px;
  background: var(--va-background-element);
}

.objetivos__fila-cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.objetivos__fila-numero {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text, #232134);
  letter-spacing: 0.01em;
}
</style>
