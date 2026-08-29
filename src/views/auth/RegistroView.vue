<template>
  <VaForm ref="form" @submit.prevent="registrarUsuario" class="auth-page">
  <h1>Registro</h1>

  <div class="auth-page__fields">
    <div class="flex flex-col sm:flex-row gap-3">
      <VaInput v-model="datosUsuario.nombre" :rules="[reglas.requerido]" class="flex-1" label="Nombre" type="text" />
      <VaInput v-model="datosUsuario.apellido" :rules="[reglas.requerido]" class="flex-1" label="Apellido" type="text" />
    </div>

    <VaInput v-model="datosUsuario.dni" :rules="[reglas.requerido]" label="DNI" type="text" />
    <VaInput v-model="datosUsuario.fechaNacimiento" :rules="[reglas.requerido]" label="Fecha de nacimiento" type="date" />
    <VaSelect v-model="datosUsuario.genero" :options="opcionesGenero" value-by="value" text-by="text" :rules="[reglas.requerido]" class="w-full" label="Género con el que te identificas" />
    
    
    <VaInput v-model="datosUsuario.correo" :rules="[reglas.requerido, reglas.email]" label="Correo" type="email" />

    <VaValue v-slot="isPasswordVisible" :default-value="false">
      <VaInput
        v-model="datosUsuario.password"
        :rules="reglas.password"
        :type="isPasswordVisible.value ? 'text' : 'password'"
        label="Contraseña"
        messages="La contraseña debe tener al menos 8 caracteres."
        @clickAppendInner.stop="isPasswordVisible.value = !isPasswordVisible.value"
      >
        <template #appendInner>
          <VaIcon :name="isPasswordVisible.value ? 'mso-visibility_off' : 'mso-visibility'" class="cursor-pointer" color="grey" />
        </template>
      </VaInput>
    </VaValue>
  </div>

  <VaButton type="submit" size="medium" class="auth-button">Registrarme</VaButton>

  <p class="auth-page__footer" color="gray-700">
    ¿Ya tenés una cuenta?
    <RouterLink :to="{ name: 'login' }" class="font-semibold text-primary">Inicia Sesión</RouterLink>
  </p>

  <BaseAlert :message="successMessage" type="success" />
  <BaseAlert :message="errorMessage" type="error" />
</VaForm>

</template>

<script>

import authService from "../../services/authService";
import { marcarSesionRestaurada } from "../../services/authState";
import BaseAlert from "../../components/AlertaBase.vue";

export default {
  name: "RegistroView",
  components: {
    BaseAlert,
  },
  data() {
    return {
      datosUsuario: {
        nombre: "",
        apellido: "",
        dni: "",
        fechaNacimiento: "",
        genero: "",
        correo: "",
        password: "",
      },
      opcionesGenero: [
        { text: "Mujer", value: "mujer" },
        { text: "Hombre", value: "hombre" },
        { text: "No binario", value: "no_binario" },
        { text: "Prefiero no decirlo", value: "no_decirlo" }
      ],
      successMessage: "",
      errorMessage: "",
      reglas: {
        requerido: (v) => !!v || 'Este campo es requerido',
        email: (v) => /.+@.+\..+/.test(v) || 'El correo debe ser válido',
        password: [
          (v) => !!v || 'La contraseña es requerida',
          (v) => (v && v.length >= 8) || 'Debe tener al menos 8 caracteres'
        ]
      }
    };
  },
  methods: {
    async registrarUsuario() {
      // Disparamos las validaciones de Vuestic
      const isValid = this.$refs.form.validate();
      if (!isValid) return;

      this.successMessage = "";
      this.errorMessage = "";

      try {
        const response = await authService.registrar(this.datosUsuario);
        const usuario = response?.data?.usuario || null;
        marcarSesionRestaurada(usuario);
        console.log("Usuario registrado/autenticado:", usuario);
        this.successMessage = "Registro exitoso.";

        if (usuario?.rolGlobal === "Administrador") {
          this.$router.push({ name: "gestion-usuarios" });
        } else {
          this.$router.push({ name: "dashboard-usuario" });
        }
      } catch (error) {
        this.errorMessage =
          error?.response?.data?.message || "No se pudo completar el registro. Verificá los datos ingresados.";
      }
    },
  },
};
</script>

<style scoped>
.auth-page {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}

.auth-page h1 {
  font-size: 2.5rem;
  font-weight: 800;
  text-transform: uppercase;
  background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-secondary) 50%, var(--color-primary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 2px;
  margin: 0 0 1.25rem 0;
}
.auth-page__fields {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
  width: 60%;
}

.auth-page__footer {
  text-align: center;
  margin-top: 1rem;
}

:deep(.va-input-wrapper__field) {
  min-height: 40px;
}

.auth-button {
  width: 180px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto;
}


</style>