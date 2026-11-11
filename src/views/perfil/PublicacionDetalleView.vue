<template>
  <div class="publicacion-detalle">
    <VaButton
      preset="secondary"
      icon="mso-arrow_back"
      class="publicacion-detalle__volver"
      @click="volver"
    >
      Volver
    </VaButton>

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
      <VaButton preset="secondary" icon="mso-refresh" @click="cargar">
        Reintentar
      </VaButton>
    </div>

    <PublicacionCard
      v-else-if="publicacion"
      :publicacion="publicacion"
      mostrar-acciones-baja
      @abrir-galeria="abrirGaleria"
      @ver-proyecto="irAProyecto"
      @editar="abrirEdicion"
      @invitar="abrirInvitarColaborador"
      @eliminar="abrirEliminarPublicacion"
    />

    <GaleriaPublicacionModal
      v-model="modalGaleriaVisible"
      :imagenes="imagenesGaleria"
      :titulo="tituloGaleria"
    />

    <ModalNuevaPublicacion
      v-model="modalEditarVisible"
      modo="editar"
      :publicacion="publicacion"
      @actualizada="alActualizar"
    />

    <ModalInvitarColaborador
      v-model="modalInvitarVisible"
      :publicacion="publicacion"
      @enviada="alEnviarInvitacion"
    />

    <ModalEliminarPublicacion
      v-model="modalEliminarVisible"
      :publicacion="publicacion"
      :modo="modoEliminarPublicacion"
      :eliminando="eliminandoPublicacion"
      :error="errorEliminarPublicacion"
      @confirmar="confirmarEliminarPublicacion"
    />
  </div>
</template>

<script>
import publicacionService from "../../services/publicacionService";
import BaseAlert from "../../components/AlertaBase.vue";
import PublicacionCard from "../../components/perfil/PublicacionCard.vue";
import GaleriaPublicacionModal from "../../components/perfil/GaleriaPublicacionModal.vue";
import ModalNuevaPublicacion from "../../components/perfil/ModalNuevaPublicacion.vue";
import ModalInvitarColaborador from "../../components/perfil/ModalInvitarColaborador.vue";
import ModalEliminarPublicacion from "../../components/perfil/ModalEliminarPublicacion.vue";
import { idPerfilActivo } from "../../services/authState";
import {
  accionBajaPublicacion,
  normalizarPublicacion,
} from "../../utils/publicacionConstants.js";
import { mensajeErrorApi } from "../../utils/apiError";
import { useToast } from "vuestic-ui";

export default {
  name: "PublicacionDetalleView",
  components: {
    BaseAlert,
    GaleriaPublicacionModal,
    ModalEliminarPublicacion,
    ModalInvitarColaborador,
    ModalNuevaPublicacion,
    PublicacionCard,
  },
  setup() {
    return { toast: useToast() };
  },
  data() {
    return {
      publicacion: null,
      cargando: true,
      error: "",
      controlador: null,
      modalGaleriaVisible: false,
      imagenesGaleria: [],
      tituloGaleria: "",
      modalEditarVisible: false,
      modalInvitarVisible: false,
      modalEliminarVisible: false,
      modoEliminarPublicacion: "",
      eliminandoPublicacion: false,
      errorEliminarPublicacion: "",
    };
  },
  watch: {
    "$route.params.idPublicacion"() {
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
      const id = this.$route.params.idPublicacion;
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

      try {
        const response = await publicacionService.obtenerDetalle(
          id,
          controller.signal
        );
        if (this.controlador !== controller) return;

        this.publicacion = normalizarPublicacion(response?.data);
        if (!this.publicacion) {
          this.error = "La publicación no está disponible.";
        }
      } catch (error) {
        if (
          this.controlador !== controller ||
          error?.code === "ERR_CANCELED" ||
          error?.name === "CanceledError"
        ) {
          return;
        }
        this.publicacion = null;
        this.error = mensajeErrorApi(
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
    abrirGaleria(publicacion) {
      const imagenes = publicacion?.imagenes;
      if (!Array.isArray(imagenes) || !imagenes.length) return;
      this.imagenesGaleria = imagenes;
      this.tituloGaleria = publicacion.titulo;
      this.modalGaleriaVisible = true;
    },
    irAProyecto(proyecto) {
      if (proyecto?.idProyecto == null) return;
      this.$router.push({
        name: "dashboard-proyecto",
        params: { id: proyecto.idProyecto },
      });
    },
    abrirEdicion(publicacion) {
      if (!publicacion?.idPublicacion) return;
      this.publicacion = publicacion;
      this.modalEditarVisible = true;
    },
    abrirInvitarColaborador(publicacion) {
      if (!publicacion?.idPublicacion) return;
      this.publicacion = publicacion;
      this.modalInvitarVisible = true;
    },
    alActualizar(publicacion) {
      this.modalEditarVisible = false;
      this.toast.init({
        title: "Publicación actualizada",
        message: "Los cambios se guardaron correctamente.",
        color: "success",
        position: "top-right",
        duration: 5000,
      });
      if (publicacion) this.publicacion = normalizarPublicacion(publicacion);
      this.cargar();
    },
    alEnviarInvitacion(invitacion) {
      this.modalInvitarVisible = false;
      this.toast.init({
        title: "Solicitud enviada",
        message: `Se invitó a ${
          invitacion?.nombre || "el contacto"
        } a colaborar.`,
        color: "success",
        position: "top-right",
        duration: 5000,
      });
    },
    abrirEliminarPublicacion(publicacion) {
      if (!publicacion?.idPublicacion) return;
      const modo = accionBajaPublicacion(publicacion, idPerfilActivo());
      if (!modo) return;

      this.modoEliminarPublicacion = modo;
      this.errorEliminarPublicacion = "";
      this.modalEliminarVisible = true;
    },
    async confirmarEliminarPublicacion() {
      if (!this.publicacion?.idPublicacion || this.eliminandoPublicacion) {
        return;
      }

      this.eliminandoPublicacion = true;
      this.errorEliminarPublicacion = "";

      try {
        await publicacionService.eliminar(this.publicacion.idPublicacion);
        this.modalEliminarVisible = false;

        const esDueno = this.modoEliminarPublicacion === "dueno";
        this.toast.init({
          title: esDueno
            ? "Publicación eliminada"
            : "Publicación quitada de tu perfil",
          message: esDueno
            ? "La publicación se eliminó definitivamente."
            : "La publicación sigue disponible para el dueño y los demás colaboradores.",
          color: "success",
          position: "top-right",
          duration: 5000,
        });

        if (esDueno) {
          this.volver();
          return;
        }
        await this.cargar();
      } catch (error) {
        const status = error?.response?.status;
        if (status === 404) {
          this.modalEliminarVisible = false;
          this.volver();
          return;
        }
        this.errorEliminarPublicacion = mensajeErrorApi(
          error,
          "No se pudo eliminar la publicación."
        );
      } finally {
        this.eliminandoPublicacion = false;
      }
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
  max-width: 900px;
  margin: 0 auto;
}

.publicacion-detalle__volver {
  align-self: flex-start;
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
</style>
