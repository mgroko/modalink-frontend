<template>
  <div class="perfil-acciones-publico">
    <div class="perfil-acciones-publico__fila">
      <PerfilAccionesConexion
        class="perfil-acciones-publico__conexion"
        :estado-conexion="estadoConexion"
        :mostrar="mostrarConexion"
        :cargando="cargandoConexion"
        :procesando="procesandoConexion"
        :accion-procesando="accionProcesandoConexion"
        @conectar="$emit('conectar')"
        @aceptar="$emit('aceptar')"
        @rechazar="$emit('rechazar')"
        @eliminar="$emit('eliminar')"
      />

      <VaButton
        class="perfil-acciones-publico__mensaje"
        preset="secondary"
        color="primary"
        icon="mso-chat_bubble"
        @click="$emit('mensaje')"
      >
        Mensaje
      </VaButton>
    </div>

    <VaButton
      v-if="mostrarCancelar"
      preset="secondary"
      color="danger"
      size="small"
      block
      icon="mso-close"
      :loading="cancelandoConexion"
      :disabled="cancelandoConexion"
      :aria-busy="cancelandoConexion ? 'true' : 'false'"
      @click="$emit('cancelar')"
    >
      Cancelar solicitud
    </VaButton>
  </div>
</template>

<script>
import PerfilAccionesConexion from "./PerfilAccionesConexion.vue";

export default {
  name: "PerfilAccionesPublico",
  components: { PerfilAccionesConexion },
  props: {
    estadoConexion: {
      type: String,
      default: "NINGUNA",
    },
    mostrarConexion: {
      type: Boolean,
      default: true,
    },
    cargandoConexion: {
      type: Boolean,
      default: false,
    },
    procesandoConexion: {
      type: Boolean,
      default: false,
    },
    accionProcesandoConexion: {
      type: String,
      default: "",
    },
    mostrarCancelar: {
      type: Boolean,
      default: false,
    },
    cancelandoConexion: {
      type: Boolean,
      default: false,
    },
  },
  emits: [
    "conectar",
    "aceptar",
    "rechazar",
    "eliminar",
    "mensaje",
    "cancelar",
  ],
};
</script>

<style scoped>
.perfil-acciones-publico {
  display: grid;
  gap: 0.5rem;
}

.perfil-acciones-publico__fila {
  display: flex;
  gap: 0.5rem;
}

.perfil-acciones-publico__conexion,
.perfil-acciones-publico__mensaje {
  flex: 1;
  min-width: 0;
}
</style>
