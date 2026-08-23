<template>
  <VaForm ref="form" @submit.prevent="registrarUsuario" class="auth-page">
  <h1 class="text-5xl mb-8 text-center tracking-wide" style="font-weight: 300;">Registro</h1>   


    <div class="flex flex-col sm:flex-row gap-4 mb-4">
      <VaInput
        v-model="datosUsuario.nombre"
        :rules="[reglas.requerido]"
        class="flex-1"
        label="Nombre"
        type="text"
      />
      <VaInput
        v-model="datosUsuario.apellido"
        :rules="[reglas.requerido]"
        class="flex-1"
        label="Apellido"
        type="text"
      />
    </div>

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

    <VaSelect
      v-model="datosUsuario.genero"
      :options="opcionesGenero"
      value-by="value"
      text-by="text"
      :rules="[reglas.requerido]"
      class="mb-4 w-full"
      label="Género con el que te identificas"
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

    <div class="flex justify-center mb-6">
      <VaButton class="w-2/3" type="submit" size="large">Registrarme</VaButton>
    </div>

<p class="text-base mb-4 leading-5">
      ¿Ya tienes una cuenta?
      <RouterLink :to="{ name: 'login' }" class="font-semibold text-primary">Inicia Sesión</RouterLink>
    </p>

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