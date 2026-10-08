
Modificardatosview · VUE
<template>
  <div class="modificar-datos">
    <h1 class="modificar-datos__titulo">Modificar datos personales</h1>
    <p class="modificar-datos__subtitulo">Actualizá tu información personal.</p>
 
    <VaForm ref="form" @submit.prevent="guardarDatos" class="modificar-datos__form">
      <div class="modificar-datos__campos">
        <div class="flex flex-col sm:flex-row gap-3">
          <VaInput
            v-model="datos.nombre"
            :rules="[reglas.requerido]"
            class="flex-1"
            label="Nombre"
            type="text"
          />
          <VaInput
            v-model="datos.apellido"
            :rules="[reglas.requerido]"
            class="flex-1"
            label="Apellido"
            type="text"
          />
        </div>
 
        <VaSelect
          v-model="datos.genero"
          :options="opcionesGenero"
          value-by="value"
          text-by="text"
          :rules="[reglas.requerido]"
          label="Género"
        />
 
        <VaInput
          v-model="datos.fechaNacimiento"
          :rules="[reglas.requerido, reglas.fecha18Anios]"
          label="Fecha de nacimiento"
          type="date"
        />
 
        <div class="modificar-datos__bloque-ubicacion">
          <div class="modificar-datos__bloque-titulo-fila">
            <p class="modificar-datos__bloque-titulo">Ubicación</p>
            <button
              v-if="ubicacionGuardada"
              type="button"
              class="modificar-datos__quitar-ubicacion"
              :disabled="cargando"
              @click="modalEliminarUbicacionVisible = true"
            >
              <span class="material-symbols-outlined">location_off</span>
              Quitar ubicación
            </button>
          </div>
          <div class="modificar-datos__campos">
            <VaInput
              :model-value="pais"
              label="País"
              type="text"
              disabled
            />
            <VaSelect
              v-model="provinciaSeleccionada"
              :options="provincias"
              value-by="id"
              text-by="nombre"
              label="Provincia"
              placeholder="Seleccioná una provincia"
              :loading="cargandoProvincias"
              @update:model-value="onProvinciaCambio"
            />
            <VaSelect
              v-model="localidadSeleccionada"
              :options="localidades"
              value-by="id"
              text-by="nombre"
              label="Localidad"
              placeholder="Seleccioná una localidad"
              :loading="cargandoLocalidades"
              :disabled="!provinciaSeleccionada"
              allow-search
              search-placeholder="Buscá una localidad..."
              no-options-text="No hay localidades para esta provincia"
            />
          </div>
        </div>
      </div>
 
      <div
        class="modificar-datos__alertas-wrapper"
        :class="{ 'modificar-datos__alertas-wrapper--visible': mensajeExito || mensajeError }"
      >
        <div class="modificar-datos__alertas">
          <BaseAlert v-if="mensajeExito" :message="mensajeExito" type="success" />
          <BaseAlert v-if="mensajeError" :message="mensajeError" type="error" />
        </div>
      </div>
 
      <div class="modificar-datos__acciones">
        <VaButton preset="secondary" @click="volver" :disabled="cargando">
          Cancelar
        </VaButton>
        <VaButton type="submit" :loading="cargando">
          Guardar cambios
        </VaButton>
      </div>
    </VaForm>

    <VaModal v-model="modalSinUbicacionVisible" hide-default-actions blur>
      <h3 class="va-h5">Vas a guardar sin ubicación. ¿Continuar?</h3>
      <template #footer>
        <div style="display: flex; gap: 1rem; justify-content: flex-end; width: 100%; margin-top: 1rem;">
          <VaButton preset="secondary" @click="modalSinUbicacionVisible = false">
            Cancelar
          </VaButton>
          <VaButton @click="confirmarGuardarSinUbicacion">
            Guardar
          </VaButton>
        </div>
      </template>
    </VaModal>

    <VaModal v-model="modalEliminarUbicacionVisible" hide-default-actions blur>
      <h3 class="va-h5">¿Quitar tu ubicación?</h3>
      <p>Tu cuenta va a quedar sin ubicación asociada.</p>
      <template #footer>
        <div style="display: flex; gap: 1rem; justify-content: flex-end; width: 100%; margin-top: 1rem;">
          <VaButton preset="secondary" @click="modalEliminarUbicacionVisible = false">
            Cancelar
          </VaButton>
          <VaButton color="danger" @click="eliminarUbicacion">
            Quitar
          </VaButton>
        </div>
      </template>
    </VaModal>
  </div>
</template>
 
<script>
import usuarioService from "../../services/usuarioService";
import { state, setUsuario, restaurarSesion } from "../../services/authState";
import BaseAlert from "../../components/AlertaBase.vue";
 
export default {
  name: "ModificarDatosView",
  components: {
    BaseAlert,
  },
  data() {
    return {
      datos: {
        nombre: "",
        apellido: "",
        genero: "",
        fechaNacimiento: "",
      },
      ubicacionGuardada: null,
      provincias: [],
      localidades: [],
      provinciaSeleccionada: null,
      localidadSeleccionada: null,
      cargandoProvincias: false,
      cargandoLocalidades: false,
      opcionesGenero: [
        { text: "Mujer", value: "MUJER" },
        { text: "Hombre", value: "HOMBRE" },
        { text: "No binario", value: "NO_BINARIO" },
        { text: "Prefiero no decirlo", value: "NO_DECIRLO" },
      ],
      cargando: false,
      modalSinUbicacionVisible: false,
      modalEliminarUbicacionVisible: false,
      mensajeExito: "",
      mensajeError: "",
      reglas: {
        requerido: (v) => !!v || "Este campo es requerido",
        fecha18Anios: (v) => {
          if (!v) return true;
          const partes = v.split("-");
          if (partes.length !== 3) return "Fecha inválida";
          const [anio, mes, dia] = partes.map(Number);
          const hoy = new Date();
          let edad = hoy.getFullYear() - anio;
          const mesActual = hoy.getMonth() + 1;
          const diaActual = hoy.getDate();
          if (mesActual < mes || (mesActual === mes && diaActual < dia)) {
            edad--;
          }
          return edad >= 18 || "Debés tener al menos 18 años";
        },
      },
    };
  },
  async mounted() {
    await restaurarSesion();
    this.cargarDatos();
    await this.cargarProvincias();
    await this.precargarUbicacion();
  },
  computed: {
    pais() {
      return this.ubicacionGuardada?.ciudad?.provincia?.pais?.nombre || "Argentina";
    },
  },
  methods: {
    cargarDatos() {
      const u = state.usuario || {};
 
      this.datos.nombre = u.nombre || "";
      this.datos.apellido = u.apellido || "";
      this.datos.genero = u.genero || "";
      this.datos.fechaNacimiento = this.normalizarFecha(u.fechaNacimiento);
    },
    async cargarProvincias() {
      this.cargandoProvincias = true;
      try {
        const response = await usuarioService.listarProvincias();
        this.provincias = Array.isArray(response?.data) ? response.data : [];
      } catch (error) {
        this.mensajeError =
          error?.response?.data?.message || "No se pudieron cargar las provincias.";
      } finally {
        this.cargandoProvincias = false;
      }
    },
    async precargarUbicacion() {
      try {
        const response = await usuarioService.obtenerUbicacion();
        // 200 con cuerpo vacío = sin ubicación (estado válido, no es error)
        const ubicacion = response?.data || null;
        const localidadId = ubicacion?.ciudad?.idExterno || null;
        if (!localidadId) {
          this.ubicacionGuardada = null;
          return;
        }

        this.ubicacionGuardada = ubicacion;
        const provinciaId = ubicacion?.ciudad?.provincia?.idExterno || null;
        const provincia = this.provincias.find((p) => p.id === provinciaId);
        if (!provincia) return;
        this.provinciaSeleccionada = provincia.id;

        await this.cargarLocalidades(provincia.id);
        this.localidadSeleccionada = localidadId;
      } catch (error) {
        // Error de lectura: se deja sin selección.
        this.mensajeError =
          error?.response?.data?.message || "No se pudo obtener tu ubicación.";
      }
    },
    async onProvinciaCambio(provinciaId) {
      this.localidadSeleccionada = null;
      if (!provinciaId) {
        this.localidades = [];
        return;
      }
      await this.cargarLocalidades(provinciaId);
    },
    async cargarLocalidades(provinciaId) {
      this.cargandoLocalidades = true;
      try {
        const response = await usuarioService.listarLocalidades({ provinciaId });
        this.localidades = Array.isArray(response?.data) ? response.data : [];
      } catch (error) {
        this.localidades = [];
        this.mensajeError =
          error?.response?.data?.message || "No se pudieron cargar las localidades.";
      } finally {
        this.cargandoLocalidades = false;
      }
    },
    normalizarFecha(valor) {
      if (!valor) return "";
 
      if (Array.isArray(valor) && valor.length >= 3) {
        const [anio, mes, dia] = valor;
        return `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
      }
 
      if (typeof valor === "string") {
        const partes = valor.split("T")[0].split("-");
        if (partes.length === 3) {
          return `${partes[0]}-${partes[1]}-${partes[2]}`;
        }
      }
 
      if (typeof valor === "number") {
        const fecha = new Date(valor);
        if (!isNaN(fecha.getTime())) {
          const anio = fecha.getFullYear();
          const mes = String(fecha.getMonth() + 1).padStart(2, "0");
          const dia = String(fecha.getDate()).padStart(2, "0");
          return `${anio}-${mes}-${dia}`;
        }
      }
 
      return "";
    },
    async guardarDatos() {
      const isValid = this.$refs.form.validate();
      if (!isValid) return;

      if (!this.localidadSeleccionada) {
        this.modalSinUbicacionVisible = true;
        return;
      }

      await this.enviarDatos();
    },
    async confirmarGuardarSinUbicacion() {
      this.modalSinUbicacionVisible = false;
      await this.enviarDatos();
    },
    async enviarDatos() {
      this.mensajeExito = "";
      this.mensajeError = "";
      this.cargando = true;
 
      try {
        const payload = {
          nombre: this.datos.nombre,
          apellido: this.datos.apellido,
          fechaNacimiento: this.datos.fechaNacimiento,
          genero: this.datos.genero,
          localidadId:
            this.localidadSeleccionada != null ? String(this.localidadSeleccionada) : null,
        };
        const response = await usuarioService.actualizarDatosPersonales(payload);
        const usuarioActualizado = response?.data;
        if (usuarioActualizado) {
          setUsuario({ ...state.usuario, ...usuarioActualizado });
          this.ubicacionGuardada = usuarioActualizado.ubicacion || null;
        }
        this.mensajeExito = "Datos actualizados correctamente.";
      } catch (error) {
        this.mensajeError =
          error?.response?.data?.message || "No se pudieron guardar los cambios. Intentá nuevamente.";
      } finally {
        this.cargando = false;
      }
    },
    async eliminarUbicacion() {
      this.modalEliminarUbicacionVisible = false;
      this.mensajeExito = "";
      this.mensajeError = "";
      this.cargando = true;

      try {
        await usuarioService.eliminarUbicacion();
        this.ubicacionGuardada = null;
        this.provinciaSeleccionada = null;
        this.localidadSeleccionada = null;
        this.localidades = [];
        this.mensajeExito = "Ubicación eliminada.";
      } catch (error) {
        this.mensajeError =
          error?.response?.data?.message || "No se pudo quitar la ubicación. Intentá nuevamente.";
      } finally {
        this.cargando = false;
      }
    },
    volver() {
      this.$router.push({ name: "dashboard-usuario" });
    },
  },
};
</script>
 
<style scoped>
.modificar-datos {
  max-width: 600px;
}
 
.modificar-datos__titulo {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 0.25rem 0;
}
 
.modificar-datos__subtitulo {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  margin: 0 0 1.5rem 0;
}
 
.modificar-datos__form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
 
.modificar-datos__campos {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}
 
.modificar-datos__bloque-ubicacion {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
 
.modificar-datos__bloque-titulo-fila {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}
 
.modificar-datos__quitar-ubicacion {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  background: none;
  border: 0;
  padding: 0;
  font-size: 0.78rem;
  color: #b91c1c;
  cursor: pointer;
}
 
.modificar-datos__quitar-ubicacion:hover:not(:disabled) {
  text-decoration: underline;
}
 
.modificar-datos__quitar-ubicacion:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
 
.modificar-datos__quitar-ubicacion .material-symbols-outlined {
  font-size: 1rem;
}
 
.modificar-datos__bloque-titulo {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}
 
.modificar-datos__acciones {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding-top: 0.5rem;
}
 
.modificar-datos__alertas-wrapper {
  display: grid;
  grid-template-rows: 0fr;
  min-height: 0;
  transition: grid-template-rows 0.25s ease;
}
 
.modificar-datos__alertas-wrapper--visible {
  grid-template-rows: 1fr;
}
 
.modificar-datos__alertas {
  overflow: hidden;
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
 
.modificar-datos__alertas-wrapper--visible .modificar-datos__alertas {
  padding-top: 0.15rem;
}
 
.modificar-datos__alertas > * {
  width: 100% !important;
  box-sizing: border-box;
  text-align: left;
}
 
:deep(.va-input-wrapper__field) {
  min-height: 40px;
}
</style>
 
