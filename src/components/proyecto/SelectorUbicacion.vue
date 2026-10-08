<template>
  <div class="selector-ubicacion">
    <VaSelect
      :model-value="provinciaId"
      :options="provincias"
      value-by="id"
      text-by="nombre"
      label="Provincia"
      placeholder="Seleccioná una provincia"
      :loading="cargandoProvincias"
      :disabled="disabled"
      @update:model-value="onProvincia"
    />

    <VaSelect
      :model-value="localidadId"
      :options="localidades"
      value-by="id"
      text-by="nombre"
      label="Localidad"
      placeholder="Seleccioná una localidad"
      :loading="cargandoLocalidades"
      :disabled="disabled || !provinciaId"
      allow-search
      search-placeholder="Buscá una localidad..."
      no-options-text="No hay localidades para esta provincia"
      @update:model-value="onLocalidad"
    />
  </div>
</template>

<script>
import usuarioService from "../../services/usuarioService.js";

export default {
  name: "SelectorUbicacion",
  props: {
    modelValue: {
      type: Object,
      default: null,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["update:modelValue"],
  data() {
    return {
      provincias: [],
      localidades: [],
      provinciaId: this.modelValue?.provinciaId || null,
      localidadId: this.modelValue?.localidadId || null,
      cargandoProvincias: false,
      cargandoLocalidades: false,
    };
  },
  async mounted() {
    await this.cargarProvincias();
    if (this.provinciaId) {
      await this.cargarLocalidades(this.provinciaId);
    }
  },
  methods: {
    async cargarProvincias() {
      this.cargandoProvincias = true;
      try {
        const response = await usuarioService.listarProvincias();
        this.provincias = Array.isArray(response?.data) ? response.data : [];
      } catch {
        this.provincias = [];
      } finally {
        this.cargandoProvincias = false;
      }
    },
    async cargarLocalidades(provinciaId) {
      this.cargandoLocalidades = true;
      try {
        const response = await usuarioService.listarLocalidades({ provinciaId });
        this.localidades = Array.isArray(response?.data) ? response.data : [];
      } catch {
        this.localidades = [];
      } finally {
        this.cargandoLocalidades = false;
      }
    },
    async onProvincia(provinciaId) {
      this.provinciaId = provinciaId || null;
      this.localidadId = null;
      this.localidades = [];
      if (this.provinciaId) {
        await this.cargarLocalidades(this.provinciaId);
      }
      this.emitir();
    },
    onLocalidad(localidadId) {
      this.localidadId = localidadId || null;
      this.emitir();
    },
    emitir() {
      if (!this.provinciaId) {
        this.$emit("update:modelValue", null);
        return;
      }
      this.$emit("update:modelValue", {
        provinciaId: this.provinciaId,
        localidadId: this.localidadId,
      });
    },
  },
};
</script>

<style scoped>
.selector-ubicacion {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
