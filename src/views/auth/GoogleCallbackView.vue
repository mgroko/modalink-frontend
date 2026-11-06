<template>
  <div class="google-callback">
    <h1>Conectando con Google</h1>
    <p v-if="!errorMessage">Estamos terminando de iniciar tu sesión...</p>
    <p v-else class="google-callback__error">{{ errorMessage }}</p>
    <VaProgressCircle v-if="!errorMessage" indeterminate class="mt-4" />
  </div>
</template>

<script>
import { refrescarSesion } from "../../services/authState";

export default {
  name: "GoogleCallbackView",
  data() {
    return {
      errorMessage: "",
    };
  },
  async mounted() {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");

    if (status !== "success") {
      this.irAlLogin("google_auth_failed");
      return;
    }

    const usuario = await refrescarSesion();
    if (!usuario) {
      this.irAlLogin("google_auth_failed");
      return;
    }

    if (params.get("reactivada") === "1") {
      try {
        localStorage.setItem("modalink.googleReactivada", "1");
      } catch {
        // Si el navegador bloquea localStorage, no es crítico.
      }
    }

    this.entrarSegun(usuario);
  },
  methods: {
    irAlLogin(codigo) {
      this.$router.replace({ name: "login", query: { googleError: codigo } });
    },
    entrarSegun(usuario) {
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
  },
};
</script>

<style scoped>
.google-callback {
  max-width: 420px;
  margin: 0 auto;
  text-align: center;
}

.google-callback h1 {
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 1rem;
}

.google-callback__error {
  color: var(--va-danger);
}
</style>
