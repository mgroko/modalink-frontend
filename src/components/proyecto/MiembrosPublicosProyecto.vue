<template>
  <section class="miembros-publicos">
    <header class="miembros-publicos__cabecera">
      <h2 class="miembros-publicos__titulo">Miembros del proyecto</h2>
      <p class="miembros-publicos__ayuda">
        Integrantes activos y los términos y condiciones que aceptaron al
        incorporarse.
      </p>
    </header>

    <TyCMiembrosLista
      :miembros="miembros"
      :cargando="cargando"
      :error="error"
      :puede-reintentar="puedeReintentar"
      @reintentar="cargar"
    />
  </section>
</template>

<script>
import TyCMiembrosLista from "./TyCMiembrosLista.vue";
import proyectoService from "../../services/proyectoService.js";
import { refrescarSesion } from "../../services/authState";
import { mensajeErrorApi } from "../../utils/apiError";

/*
 * Vista pública de miembros del proyecto con su T&C aceptado.
 * No requiere membresía: el backend aplica la visibilidad del proyecto.
 */
export default {
  name: "MiembrosPublicosProyecto",
  components: { TyCMiembrosLista },
  props: {
    idProyecto: {
      type: [Number, String],
      required: true,
    },
  },
  data() {
    return {
      miembros: [],
      cargando: false,
      error: "",
      puedeReintentar: false,
      idCarga: 0,
    };
  },
  watch: {
    idProyecto() {
      this.cargar();
    },
  },
  created() {
    this.controlador = null;
  },
  mounted() {
    this.cargar();
  },
  beforeUnmount() {
    this.abortar();
  },
  methods: {
    abortar() {
      if (this.controlador) {
        this.controlador.abort();
        this.controlador = null;
      }
    },
    esCancelacion(error) {
      return (
        error?.code === "ERR_CANCELED" ||
        error?.name === "CanceledError" ||
        error?.name === "AbortError"
      );
    },
    async cargar() {
      if (this.idProyecto == null || this.idProyecto === "") return;

      const corrida = ++this.idCarga;
      this.abortar();
      this.controlador = new AbortController();

      this.cargando = true;
      this.error = "";
      this.puedeReintentar = false;

      try {
        const response = await proyectoService.listarMiembrosPublicos(
          this.idProyecto,
          this.controlador.signal
        );
        if (corrida !== this.idCarga) return;

        const data = response?.data;
        this.miembros = Array.isArray(data) ? data : [];
      } catch (error) {
        if (this.esCancelacion(error) || corrida !== this.idCarga) return;
        await this.manejarError(error);
      } finally {
        if (corrida === this.idCarga) this.cargando = false;
      }
    },
    async manejarError(error) {
      const status = error?.response?.status;
      const mensaje = error?.response?.data?.message || "";
      this.miembros = [];
      this.error = "";
      this.puedeReintentar = false;

      if (error?._esSesionExpirada || status === 401) {
        return;
      }

      if (status === 403) {
        this.error =
          mensaje || "No tenés acceso a los miembros de este proyecto.";
        return;
      }

      if (status === 404) {
        if (/perfil/i.test(mensaje)) {
          await refrescarSesion();
          this.$router.push({ name: "dashboard-usuario" });
          return;
        }
        this.error =
          mensaje || "El proyecto ya no está disponible o no tenés acceso.";
        return;
      }

      if (!status || status >= 500) {
        this.puedeReintentar = true;
        this.error =
          "Ocurrió un error al cargar los miembros del proyecto. Inténtalo nuevamente.";
        return;
      }

      this.error = mensajeErrorApi(
        error,
        "No se pudieron cargar los miembros del proyecto."
      );
    },
  },
};
</script>

<style scoped>
.miembros-publicos {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.15rem 1.5rem 1.5rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.miembros-publicos__cabecera {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding-bottom: 0.9rem;
  border-bottom: 1px solid var(--color-border-soft);
}

.miembros-publicos__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1.05rem;
  font-weight: 700;
}

.miembros-publicos__ayuda {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.84rem;
  line-height: 1.45;
}

@media (max-width: 720px) {
  .miembros-publicos {
    padding-inline: 1rem;
  }
}
</style>
