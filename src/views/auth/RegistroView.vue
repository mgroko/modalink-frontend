<template>
  <VaForm ref="form" @submit.prevent="registrarUsuario" class="auth-page">
    <h1 class="font-semibold text-4xl mb-4">Registro</h1>
    <p class="text-base mb-4 leading-5">
      ¿Ya tienes una cuenta?
      <RouterLink :to="{ name: 'login' }" class="font-semibold text-primary">Inicia Sesión</RouterLink>
    </p>

    <VaInput
      v-model="datosUsuario.nombre"
      :rules="[reglas.requerido]"
      class="mb-4"
      label="Nombre"
      type="text"
    />

    <VaInput
      v-model="datosUsuario.apellido"
      :rules="[reglas.requerido]"
      class="mb-4"
      label="Apellido"
      type="text"
    />

    <VaInput
      v-model="datosUsuario.dni"
      :rules="[reglas.requerido]"
      class="mb-4"
      label="DNI"
      type="text"
    />

    <VaInput
      v-model="datosUsuario.fechaNacimiento"
      :rules="[reglas.requerido]"
      class="mb-4"
      label="Fecha de nacimiento"
      type="date"
    />

    <VaInput
      v-model="datosUsuario.correo"
      :rules="[reglas.requerido, reglas.email]"
      class="mb-4"
      label="Correo"
      type="email"
    />

    <VaValue v-slot="isPasswordVisible" :default-value="false">
      <VaInput
        v-model="datosUsuario.password"
        :rules="reglas.password"
        :type="isPasswordVisible.value ? 'text' : 'password'"
        class="mb-4"
        label="Contraseña"
        messages="La contraseña debe tener al menos 8 caracteres."
        @clickAppendInner.stop="isPasswordVisible.value = !isPasswordVisible.value"
      >
        <template #appendInner>
          <VaIcon
            :name="isPasswordVisible.value ? 'mso-visibility_off' : 'mso-visibility'"
            class="cursor-pointer"
            color="grey"
          />
        </template>
      </VaInput>
    </VaValue>

    <div class="flex justify-center mt-4">
      
      <VaButton class="w-full" type="submit">Registrarme</VaButton>
      
    </div>

<!-- alertas nuevas -->
    <BaseAlert :message="successMessage" type="success" />
    <BaseAlert :message="errorMessage" type="error" />
  </VaForm>

</template>

<script>

import authService from "../../services/authService";
import { setUsuario } from "../../services/authState";
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
        correo: "",
        password: "",
      },
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
        setUsuario(usuario);
        console.log("Usuario registrado/autenticado:", usuario);
        this.successMessage = "Registro exitoso.";
        // this.$router.push({ name: 'dashboard' })
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
  max-width: 400px;
  margin: 0 auto;
}
</style>