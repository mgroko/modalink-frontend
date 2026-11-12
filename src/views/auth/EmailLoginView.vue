<template>
  <div class="email-login">
    <h1>Ingresando a ModaLink</h1>
    <p v-if="correo" class="email-login__cuenta">
      Cuenta: <strong>{{ correo }}</strong>
    </p>
    <p v-if="!errorMessage">Estamos validando tu enlace de acceso...</p>
    <p v-else class="email-login__error">{{ errorMessage }}</p>
    <VaProgressCircle v-if="!errorMessage" indeterminate class="mt-4" />
  </div>
</template>

<script>
import authService from "../../services/authService";
import {
  marcarSesionRestaurada,
  refrescarSesion,
} from "../../services/authState";
import { destinoSeguro } from "../../utils/redirect";

export default {
  name: "EmailLoginView",
  data() {
    return {
      correo: "",
      errorMessage: "",
    };
  },
  async mounted() {
    const params = new URLSearchParams(
      window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash
    );
    const token = params.get("token");
    const redirect = params.get("redirect");

    // El token no debe quedar en el historial ni en la barra de direcciones.
    try {
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search
      );
    } catch {
      // Si el navegador lo bloquea, el token se consume igual.
    }

    if (!token) {
      this.irAlLogin("TOKEN_REQUERIDO", redirect);
      return;
    }

    try {
      const response = await authService.validarTokenEmail(token);
      const usuario = response?.data?.usuario || null;

      if (!usuario) {
        this.irAlLogin("TOKEN_INVALIDO", redirect);
        return;
      }

      this.correo = usuario.correo || "";
      marcarSesionRestaurada(usuario);
      const refrescado = await refrescarSesion();

      this.entrarSegun({ ...usuario, ...refrescado }, redirect);
    } catch (error) {
      const codigo = error?.response?.data?.codigo || "TOKEN_INVALIDO";
      this.irAlLogin(codigo, redirect);
    }
  },
  methods: {
    entrarSegun(usuario, redirect) {
      const destino = destinoSeguro(redirect);
      if (destino) {
        this.$router.replace(destino);
        return;
      }

      if (usuario?.rolGlobal === "Administrador") {
        this.$router.replace({ name: "dashboard-admin" });
        return;
      }
      if (usuario?.idPerfilActivo != null) {
        this.$router.replace({ name: "home" });
        return;
      }
      this.$router.replace({ name: "dashboard-usuario" });
    },
    irAlLogin(codigo, redirect) {
      const destino = destinoSeguro(redirect);
      this.errorMessage = "No pudimos validar el enlace. Volvemos al inicio de sesión...";
      this.$router.replace({
        name: "login",
        query: {
          emailError: codigo,
          ...(destino ? { redirect: destino } : {}),
        },
      });
    },
  },
};
</script>

<style scoped>
.email-login {
  max-width: 420px;
  margin: 0 auto;
  text-align: center;
}

.email-login h1 {
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 1rem;
}

.email-login__cuenta {
  margin-bottom: 1rem;
  color: var(--va-secondary);
  font-size: 0.95rem;
}

.email-login__error {
  color: var(--va-danger);
}
</style>
