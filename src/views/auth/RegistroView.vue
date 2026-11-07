<template>
  <VaForm ref="form" @submit.prevent="registrarUsuario" class="auth-page auth-page--wide">
    <h1 class="auth-title">Creá tu cuenta</h1>
    <p class="auth-subtitle">Sumate a ModaLink en menos de un minuto.</p>

    <button type="button" class="auth-google" @click="registrarmeConGoogle">
      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039L37.802 9.89C34.153 6.242 29.335 4 24 4 12.953 4 4 12.953 4 24s8.953 20 20 20 20-8.953 20-20c0-1.341-.138-2.65-.389-3.917z"/>
        <path fill="#FF3D00" d="M6.306 14.691l6.571 2.024C14.427 12.087 18.868 9 24 9c3.059 0 5.842 1.154 7.961 3.039l5.841-4.148C34.153 6.242 29.335 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 2.016C9.451 39.139 16.227 44 24 44z"/>
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
      </svg>
      Registrarme con Google
    </button>

    <div class="auth-divider"><span>o con tu correo</span></div>

    <div class="auth-fields">
      <VaInput v-model="datosUsuario.nombre" :rules="[reglas.requerido]" label="Nombre" type="text" />
      <VaInput v-model="datosUsuario.apellido" :rules="[reglas.requerido]" label="Apellido" type="text" />

      <VaInput v-model="datosUsuario.dni" :rules="[reglas.requerido]" label="DNI" type="text" />
      <VaInput
        v-model="datosUsuario.fechaNacimiento"
        :rules="[reglas.requerido]"
        label="Fecha de nacimiento"
        type="date"
      />

      <VaSelect
        v-model="datosUsuario.genero"
        :options="opcionesGenero"
        value-by="value"
        text-by="text"
        :rules="[reglas.requerido]"
        class="auth-fields__full"
        label="Género con el que te identificás"
      />

      <VaInput
        v-model="datosUsuario.correo"
        :rules="[reglas.requerido, reglas.email]"
        class="auth-fields__full"
        label="Correo"
        type="email"
      />

      <VaValue v-slot="isPasswordVisible" :default-value="false">
        <VaInput
          v-model="datosUsuario.password"
          :rules="reglas.password"
          :type="isPasswordVisible.value ? 'text' : 'password'"
          class="auth-fields__full"
          label="Contraseña"
          @clickAppendInner.stop="isPasswordVisible.value = !isPasswordVisible.value"
        >
          <template #appendInner>
            <VaIcon :name="isPasswordVisible.value ? 'mso-visibility_off' : 'mso-visibility'" class="cursor-pointer" color="grey" />
          </template>
        </VaInput>
      </VaValue>
      <p class="auth-hint">Al menos 8 caracteres.</p>
    </div>

    <VaButton type="submit" size="large" block class="auth-submit">Registrarme</VaButton>

    <p class="auth-footer">
      ¿Ya tenés una cuenta?
      <RouterLink :to="{ name: 'login' }">Iniciá sesión</RouterLink>
    </p>

    <BaseAlert :message="successMessage" type="success" />
    <BaseAlert :message="errorMessage" type="error" />
  </VaForm>
</template>

<script>
import "../../styles/auth.css";
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
        { text: "Mujer", value: "MUJER" },
        { text: "Hombre", value: "HOMBRE" },
        { text: "No binario", value: "NO_BINARIO" },
        { text: "Prefiero no decirlo", value: "NO_DECIRLO" }
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
    registrarmeConGoogle() {
      this.errorMessage = "";
      authService.iniciarSesionGoogle();
    },
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
        this.successMessage = "Registro exitoso.";

        if (usuario?.rolGlobal === "Administrador") {
          this.$router.push({ name: "dashboard-admin" });
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
