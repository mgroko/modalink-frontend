<template>
  <span v-show="mostrar" class="perfil-acciones-conexion">
    <VaButton
      class="perfil-acciones-conexion__boton"
      :color="esConectar ? '#5CA4A9' : undefined"
      :preset="esConectar ? 'primary' : 'secondary'"
      :icon="icono"
      :loading="esConectar && cargando"
      :disabled="!esConectar || cargando"
      @click="alConectar"
    >
      {{ etiqueta }}
    </VaButton>
  </span>
</template>

<script>
import {
  ESTADOS_CONEXION,
  etiquetaAccionConexion,
  normalizarEstadoConexion,
} from "../../utils/conexionConstants.js";

export default {
  name: "PerfilAccionesConexion",
  props: {
    estadoConexion: {
      type: String,
      default: ESTADOS_CONEXION.NINGUNA,
    },
    mostrar: {
      type: Boolean,
      default: true,
    },
    cargando: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["conectar"],
  computed: {
    estado() {
      return normalizarEstadoConexion(this.estadoConexion);
    },
    esConectar() {
      return this.estado === ESTADOS_CONEXION.NINGUNA;
    },
    etiqueta() {
      return etiquetaAccionConexion(this.estado);
    },
    icono() {
      switch (this.estado) {
        case ESTADOS_CONEXION.SOLICITUD_ENVIADA:
          return "mso-check";
        case ESTADOS_CONEXION.SOLICITUD_RECIBIDA:
          return "mso-mail";
        case ESTADOS_CONEXION.CONECTADO:
          return "mso-people";
        case ESTADOS_CONEXION.NINGUNA:
        default:
          return "mso-person_add";
      }
    },
  },
  methods: {
    alConectar() {
      if (!this.esConectar || this.cargando) return;
      this.$emit("conectar");
    },
  },
};
</script>

<style scoped>
.perfil-acciones-conexion {
  display: flex;
  min-width: 0;
}

.perfil-acciones-conexion__boton {
  width: 100%;
}
</style>
