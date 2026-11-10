<template>
  <article
    class="conexion-card"
    :class="{ 'conexion-card--destacada': destacada }"
  >
    <div class="conexion-card__top">
      <AvatarPresencia
        :nombre="nombre"
        :foto-url="perfil?.fotoUrl"
        :en-linea="enLinea"
        :tamano="58"
      />

      <div class="conexion-card__info">
        <h3 class="conexion-card__nombre">{{ nombre }}</h3>
        <p class="conexion-card__profesion">{{ profesion }}</p>
        <IndicadorPresencia :en-linea="enLinea" />
      </div>
    </div>

    <div class="conexion-card__meta">
      <p v-if="ubicacion">{{ ubicacion }}</p>
      <p v-if="fechaInicio">Conectados desde {{ fechaInicio }}</p>
    </div>

    <div class="conexion-card__acciones">
      <VaButton
        preset="secondary"
        size="small"
        icon="mso-person"
        @click="$emit('ver-perfil', conexion)"
      >
        Ver perfil
      </VaButton>
      <VaButton
        preset="secondary"
        size="small"
        icon="mso-chat_bubble"
        @click="$emit('mensaje', conexion)"
      >
        Mensaje
      </VaButton>
      <VaButton
        preset="secondary"
        color="danger"
        size="small"
        icon="mso-person_remove"
        :loading="eliminando"
        :disabled="eliminando"
        @click="$emit('eliminar', conexion)"
      >
        Eliminar
      </VaButton>
    </div>
  </article>
</template>

<script>
import AvatarPresencia from "./AvatarPresencia.vue";
import IndicadorPresencia from "./IndicadorPresencia.vue";
import { formatUbicacion } from "../../utils/ubicacion.js";
import { formatearFechaCorta } from "../../utils/fechas.js";

export default {
  name: "ConexionCard",
  components: {
    AvatarPresencia,
    IndicadorPresencia,
  },
  props: {
    conexion: {
      type: Object,
      required: true,
    },
    enLinea: {
      type: Boolean,
      default: false,
    },
    eliminando: {
      type: Boolean,
      default: false,
    },
    destacada: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["ver-perfil", "mensaje", "eliminar"],
  computed: {
    perfil() {
      return this.conexion?.perfil || null;
    },
    nombre() {
      return this.perfil?.nombreArtistico || "Perfil";
    },
    profesion() {
      return this.perfil?.nombreProfesion || "Profesión";
    },
    ubicacion() {
      return formatUbicacion(this.perfil) || "";
    },
    fechaInicio() {
      return formatearFechaCorta(this.conexion?.fechaInicioConexion);
    },
  },
};
</script>

<style scoped>
.conexion-card {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding: 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
}

.conexion-card--destacada {
  border-color: var(--color-success-text);
  box-shadow: 0 0 0 2px var(--color-success-soft);
}

.conexion-card__top {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.conexion-card__info {
  min-width: 0;
}

.conexion-card__nombre {
  margin: 0;
  color: var(--color-text);
  font-size: 1rem;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conexion-card__profesion {
  margin: 0.15rem 0 0.3rem;
  color: var(--color-text-muted);
  font-size: 0.82rem;
}

.conexion-card__meta {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  line-height: 1.4;
}

.conexion-card__meta p {
  margin: 0;
}

.conexion-card__acciones {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start;
  gap: 0.45rem;
  margin-top: auto;
}
</style>
