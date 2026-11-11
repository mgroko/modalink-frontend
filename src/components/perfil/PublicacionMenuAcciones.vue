<template>
  <div v-if="tieneAcciones" class="publicacion-menu-acciones">
    <VaDropdown
      placement="bottom-end"
      :offset="[0, 6]"
      class="publicacion-menu"
    >
      <template #anchor>
        <button
          type="button"
          class="publicacion-menu__trigger"
          aria-label="Acciones de la publicación"
          aria-haspopup="menu"
          title="Acciones de la publicación"
          @click.stop
        >
          <span class="material-symbols-outlined" aria-hidden="true">
            more_vert
          </span>
        </button>
      </template>

      <VaDropdownContent class="publicacion-menu__contenido">
        <VaMenuList>
          <VaMenuItem
            v-if="esPropia"
            class="publicacion-menu__item"
            @click="editar"
          >
            <span class="material-symbols-outlined" aria-hidden="true">
              edit
            </span>
            Modificar
          </VaMenuItem>

          <VaMenuItem
            v-if="esPropia"
            class="publicacion-menu__item"
            @click="invitar"
          >
            <span class="material-symbols-outlined" aria-hidden="true">
              person_add
            </span>
            Invitar a colaborar
          </VaMenuItem>

          <VaMenuItem
            v-if="mostrarBaja"
            class="publicacion-menu__item publicacion-menu__item--peligro"
            @click="eliminar"
          >
            <span class="material-symbols-outlined" aria-hidden="true">
              {{ accionBaja === "dueno" ? "delete" : "link_off" }}
            </span>
            {{ etiquetaBaja }}
          </VaMenuItem>

          <VaMenuItem
            v-if="puedeReportar"
            class="publicacion-menu__item"
            @click="abrirReporte"
          >
            <span class="material-symbols-outlined" aria-hidden="true">
              flag
            </span>
            Reportar publicación
          </VaMenuItem>
        </VaMenuList>
      </VaDropdownContent>
    </VaDropdown>

    <ReportarPublicacionModal
      v-if="puedeReportar"
      v-model="modalReporteVisible"
      :publicacion="publicacion"
      @reportado="alReportar"
      @no-disponible="$emit('no-disponible', publicacion)"
    />
  </div>
</template>

<script>
import { useToast } from "vuestic-ui";
import { esAdmin, idPerfilActivo } from "../../services/authState";
import ReportarPublicacionModal from "./ReportarPublicacionModal.vue";
import {
  ACCIONES_BAJA_PUBLICACION,
  accionBajaPublicacion,
  etiquetaAccionBaja,
} from "../../utils/publicacionConstants.js";

export default {
  name: "PublicacionMenuAcciones",
  components: { ReportarPublicacionModal },
  props: {
    publicacion: {
      type: Object,
      default: null,
    },
    mostrarAccionesBaja: {
      type: Boolean,
      default: false,
    },
    permitirBajaColaborador: {
      type: Boolean,
      default: true,
    },
  },
  emits: ["editar", "invitar", "eliminar", "reportado", "no-disponible"],
  setup() {
    return { toast: useToast() };
  },
  data() {
    return {
      modalReporteVisible: false,
    };
  },
  computed: {
    esPropia() {
      const idActivo = idPerfilActivo();
      const idAutor = this.publicacion?.autor?.idPerfil ?? null;
      return (
        idActivo != null &&
        idAutor != null &&
        String(idActivo) === String(idAutor)
      );
    },
    accionBaja() {
      return accionBajaPublicacion(this.publicacion, idPerfilActivo());
    },
    mostrarBaja() {
      if (!this.mostrarAccionesBaja || !this.accionBaja) return false;
      if (
        this.accionBaja === ACCIONES_BAJA_PUBLICACION.COLABORADOR &&
        !this.permitirBajaColaborador
      ) {
        return false;
      }
      return true;
    },
    etiquetaBaja() {
      return etiquetaAccionBaja(this.accionBaja);
    },
    puedeReportar() {
      if (esAdmin()) return false;
      const idActivo = idPerfilActivo();
      const idAutor = this.publicacion?.autor?.idPerfil ?? null;
      const estado = String(this.publicacion?.estado || "").toUpperCase();
      return (
        idActivo != null &&
        idAutor != null &&
        String(idActivo) !== String(idAutor) &&
        estado === "ACTIVA"
      );
    },
    tieneAcciones() {
      return this.esPropia || this.mostrarBaja || this.puedeReportar;
    },
  },
  methods: {
    editar() {
      this.$emit("editar", this.publicacion);
    },
    invitar() {
      this.$emit("invitar", this.publicacion);
    },
    eliminar() {
      this.$emit("eliminar", this.publicacion);
    },
    abrirReporte() {
      this.modalReporteVisible = true;
    },
    alReportar() {
      this.toast.init({
        title: "Reporte enviado",
        message: "Será revisado por un administrador.",
        color: "success",
        position: "top-right",
        duration: 5000,
      });
      this.$emit("reportado", this.publicacion);
    },
  },
};
</script>

<style scoped>
.publicacion-menu-acciones {
  display: flex;
  align-items: center;
  margin-left: auto;
}

.publicacion-menu {
  display: flex;
}

.publicacion-menu__trigger {
  display: grid;
  width: 2rem;
  height: 2rem;
  padding: 0;
  place-items: center;
  color: var(--color-text-muted);
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border-soft);
  border-radius: 50%;
  cursor: pointer;
}

.publicacion-menu__trigger:hover,
.publicacion-menu__trigger:focus-visible {
  color: var(--color-primary);
  border-color: var(--color-primary-light);
  outline: none;
}

.publicacion-menu__trigger .material-symbols-outlined {
  font-size: 1.1rem;
}

.publicacion-menu__contenido {
  min-width: 190px;
}

.publicacion-menu__item {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.publicacion-menu__item .material-symbols-outlined {
  font-size: 1.05rem;
}

.publicacion-menu__item--peligro {
  color: var(--color-danger-text);
}
</style>
