<template>
  <div class="filtro-ubicacion">
    <VaSelect
      :model-value="modelValue?.provinciaId || null"
      class="filtro-ubicacion__campo"
      :options="provincias"
      value-by="id"
      text-by="nombre"
      placeholder="Provincia"
      clearable
      :loading="cargandoProvincias"
      @update:modelValue="cambiarProvincia"
    />
    <VaSelect
      :model-value="modelValue?.localidadId || null"
      class="filtro-ubicacion__campo"
      :options="localidades"
      value-by="id"
      text-by="nombre"
      placeholder="Localidad"
      clearable
      :disabled="!modelValue?.provinciaId"
      :loading="cargandoLocalidades"
      @update:modelValue="cambiarLocalidad"
    />
  </div>
</template>

<script>
import usuarioService from "../../services/usuarioService";

/*
 * Filtro por ubicación basado en el catálogo Georef.
 *
 * La localidad se carga recién al elegir una provincia: el endpoint
 * /ubicaciones/localidades devuelve ~1.000 registros si se consulta sin
 * filtros. El valor emitido conserva los ids externos del catálogo, que es
 * lo que esperan los endpoints de proyectos y oportunidades.
 */
export default {
  name: "FiltroUbicacion",
  props: {
    modelValue: {
      type: Object,
      default: () => ({ provinciaId: null, localidadId: null }),
    },
  },
  emits: ["update:modelValue"],
  data() {
    return {
      provincias: [],
      localidades: [],
      cargandoProvincias: false,
      cargandoLocalidades: false,
    };
  },
  computed: {
    provinciaId() {
      return this.modelValue?.provinciaId || null;
    },
  },
  watch: {
    provinciaId(nuevo, anterior) {
      if (nuevo === anterior) return;
      this.localidades = [];
      if (nuevo) this.cargarLocalidades(nuevo);
    },
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
    emitir(provinciaId, localidadId) {
      this.$emit("update:modelValue", {
        provinciaId: provinciaId || null,
        localidadId: localidadId || null,
      });
    },
    cambiarProvincia(valor) {
      this.emitir(valor, null);
    },
    cambiarLocalidad(valor) {
      this.emitir(this.provinciaId, valor);
    },
  },
};
</script>

<style scoped>
.filtro-ubicacion {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  min-width: 0;
}

.filtro-ubicacion__campo {
  min-width: 170px;
}
</style>
