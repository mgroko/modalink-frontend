<template>
  <span v-show="mostrar" class="perfil-acciones-conexion">
    <VaButton
      v-if="esConectar"
      class="perfil-acciones-conexion__boton"
      color="#5CA4A9"
      preset="primary"
      icon="mso-person_add"
      :loading="cargando"
      :disabled="cargando"
      @click="alConectar"
    >
      Conectar
    </VaButton>

    <div
      v-else-if="esSolicitudRecibida"
      class="perfil-acciones-conexion__grupo"
    >
      <VaButton
        class="perfil-acciones-conexion__mitad"
        preset="secondary"
        color="danger"
        size="small"
        icon="mso-close"
        :loading="procesando && accionProcesando === 'rechazar'"
        :disabled="procesando"
        @click="$emit('rechazar')"
      >
        Rechazar
      </VaButton>
      <VaButton
        class="perfil-acciones-conexion__mitad"
        color="#5CA4A9"
        size="small"
        icon="mso-check"
        :loading="procesando && accionProcesando === 'aceptar'"
        :disabled="procesando"
        @click="$emit('aceptar')"
      >
        Aceptar
      </VaButton>
    </div>

    <VaButton
      v-else-if="esConectado"
      class="perfil-acciones-conexion__boton"
      preset="secondary"
      color="danger"
      icon="mso-person_remove"
      :loading="procesando && accionProcesando === 'eliminar'"
      :disabled="procesando"
      @click="$emit('eliminar')"
    >
      Eliminar conexión
    </VaButton>

    <VaButton
      v-else
      class="perfil-acciones-conexion__boton"
      preset="secondary"
      icon="mso-check"
      disabled
    >
      Solicitud enviada
    </VaButton>
  </span>
</template>

<script>
import {
  ESTADOS_CONEXION,
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
    procesando: {
      type: Boolean,
      default: false,
    },
    accionProcesando: {
      type: String,
      default: "",
    },
  },
  emits: ["conectar", "aceptar", "rechazar", "eliminar"],
  computed: {
    estado() {
      return normalizarEstadoConexion(this.estadoConexion);
    },
    esConectar() {
      return this.estado === ESTADOS_CONEXION.NINGUNA;
    },
    esSolicitudRecibida() {
      return this.estado === ESTADOS_CONEXION.SOLICITUD_RECIBIDA;
    },
    esConectado() {
      return this.estado === ESTADOS_CONEXION.CONECTADO;
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

.perfil-acciones-conexion__grupo {
  display: flex;
  gap: 0.4rem;
  width: 100%;
}

.perfil-acciones-conexion__mitad {
  flex: 1;
  min-width: 0;
}
</style>
