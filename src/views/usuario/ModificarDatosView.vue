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

        <VaInput
          v-model="datos.ubicacion"
          label="Ubicación"
          type="text"
        />
      </div>

      <div class="modificar-datos__acciones">
        <VaButton preset="secondary" @click="volver">
          Cancelar
        </VaButton>
        <VaButton type="submit" :loading="cargando">
          Guardar cambios
        </VaButton>
      </div>
    </VaForm>

    <BaseAlert :message="mensajeExito" type="success" />
    <BaseAlert :message="mensajeError" type="error" />
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
        ubicacion: "",
      },
      opcionesGenero: [
        { text: "Mujer", value: "mujer" },
        { text: "Hombre", value: "hombre" },
        { text: "No binario", value: "no_binario" },
        { text: "Prefiero no decirlo", value: "no_decirlo" },
      ],
      cargando: false,
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
  },
  methods: {
    cargarDatos() {
      const u = state.usuario || {};

      console.log("usuario crudo:", u);
      console.log("fechaNacimiento cruda:", u.fechaNacimiento, typeof u.fechaNacimiento);

      this.datos.nombre = u.nombre || "";
      this.datos.apellido = u.apellido || "";
      this.datos.genero = u.genero || "";
      this.datos.fechaNacimiento = this.normalizarFecha(u.fechaNacimiento);
      this.datos.ubicacion = u.ubicacion || "";
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

      this.mensajeExito = "";
      this.mensajeError = "";
      this.cargando = true;

      try {
        const response = await usuarioService.actualizarDatosPersonales(this.datos);
        const usuarioActualizado = response?.data;
        if (usuarioActualizado) {
          setUsuario({ ...state.usuario, ...usuarioActualizado });
        }
        this.mensajeExito = "Datos actualizados correctamente.";
      } catch (error) {
        this.mensajeError =
          error?.response?.data?.message || "No se pudieron guardar los cambios. Intentá nuevamente.";
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

.modificar-datos__acciones {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding-top: 0.5rem;
}

:deep(.va-input-wrapper__field) {
  min-height: 40px;
}
</style>
