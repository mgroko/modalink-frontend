<template>
  <div class="publicacion-detalle">
    <div
      v-if="cargando"
      class="publicacion-detalle__estado"
      role="status"
      aria-live="polite"
    >
      <span class="material-symbols-outlined" aria-hidden="true">
        hourglass_empty
      </span>
      Cargando publicación...
    </div>

    <div v-else-if="error" class="publicacion-detalle__estado">
      <BaseAlert :message="error" type="error" />
      <div class="publicacion-detalle__acciones">
        <VaButton preset="secondary" icon="mso-arrow_back" @click="volver">
          Volver
        </VaButton>
        <VaButton preset="secondary" icon="mso-refresh" @click="cargar">
          Reintentar
        </VaButton>
      </div>
    </div>

    <PublicacionDetalleModal
      v-else-if="publicacion"
      v-model="modalVisible"
      :publicacion="publicacion"
      :id-publicacion="idPublicacion"
      :enfocar-comentarios="enfocarComentarios"
      @ver-proyecto="irAProyecto"
      @no-disponible="alNoDisponible"
      @sin-perfil="alSinPerfil"
      @perfil-inactivo="alPerfilInactivo"
      @cerrar="volver"
    />
  </div>
</template>

<script>
import publicacionService from "../../services/publicacionService";
import BaseAlert from "../../components/AlertaBase.vue";
import PublicacionDetalleModal from "../../components/perfil/PublicacionDetalleModal.vue";
import { idPerfilActivo, refrescarSesion } from "../../services/authState";
import { sincronizarPublicacion } from "../../services/publicacionInteraccionState.js";
import { normalizarPublicacion } from "../../utils/publicacionConstants.js";
import {
  clasificarErrorPublicacion,
  mensajeErrorApi,
} from "../../utils/apiError";

export default {
  name: "PublicacionDetalleView",
  components: {
    BaseAlert,
    PublicacionDetalleModal,
  },
  data() {
    return {
      publicacion: null,
      cargando: true,
      error: "",
      controlador: null,
      modalVisible: false,
    };
  },
  computed: {
    idPublicacion() {
      return this.$route.params.idPublicacion;
    },
    enfocarComentarios() {
      return this.$route.hash === "#comentarios";
    },
    idPerfilActivoActual() {
      return idPerfilActivo();
    },
  },
  watch: {
    "$route.params.idPublicacion"() {
      this.cargar();
    },
    idPerfilActivoActual() {
      this.cargar();
    },
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
    async cargar() {
      const id = this.idPublicacion;
      if (id == null || id === "") {
        this.publicacion = null;
        this.error = "No se encontró la publicación.";
        this.cargando = false;
        return;
      }

      this.abortar();
      const controller = new AbortController();
      this.controlador = controller;
      this.cargando = true;
      this.error = "";
      this.modalVisible = false;

      try {
        const response = await publicacionService.obtenerDetalle(
          id,
          controller.signal
        );
        if (this.controlador !== controller) return;

        this.publicacion = normalizarPublicacion(response?.data);
        if (!this.publicacion) {
          this.error = "La publicación no está disponible.";
          return;
        }

        sincronizarPublicacion(this.publicacion, true);
        this.modalVisible = true;
      } catch (error) {
        if (
          this.controlador !== controller ||
          error?.code === "ERR_CANCELED" ||
          error?.name === "CanceledError"
        ) {
          return;
        }

        const tipo = clasificarErrorPublicacion(error);
        if (tipo === "SIN_PERFIL") {
          this.alSinPerfil();
          return;
        }
        if (tipo === "PERFIL_INACTIVO") {
          await this.alPerfilInactivo();
          return;
        }

        this.publicacion = null;
        this.error =
          tipo === "PUBLICACION_NO_DISPONIBLE"
            ? error?.response?.data?.message ||
              "La publicación no existe o no está disponible."
            : mensajeErrorApi(
                error,
                "La publicación no existe o no está disponible."
              );
      } finally {
        if (this.controlador === controller) {
          this.cargando = false;
          this.controlador = null;
        }
      }
    },
    volver() {
      if (window.history.length > 1) this.$router.back();
      else this.$router.push({ name: "home" });
    },
    irAProyecto(proyecto) {
      if (proyecto?.idProyecto == null) return;
      this.$router.push({
        name: "dashboard-proyecto",
        params: { id: proyecto.idProyecto },
      });
    },
    alNoDisponible() {
      this.publicacion = null;
      this.modalVisible = false;
      this.error =
        "La publicación no está disponible o ya no podés interactuar con ella.";
    },
    alSinPerfil() {
      this.modalVisible = false;
      this.publicacion = null;
      this.$router.replace({ name: "dashboard-usuario" });
    },
    async alPerfilInactivo() {
      this.modalVisible = false;
      this.publicacion = null;
      await refrescarSesion();
      this.$router.replace({ name: "dashboard-usuario" });
    },
  },
};
</script>

<style scoped>
.publicacion-detalle {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  min-height: 70vh;
  margin: 0 auto;
}

.publicacion-detalle__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  text-align: center;
}

.publicacion-detalle__acciones {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.6rem;
}
</style>
