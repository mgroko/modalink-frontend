<template>
  <div
    class="mensaje-grupal"
    :class="{
      'mensaje-grupal--propio': esMio,
      'mensaje-grupal--primero': primero,
      'mensaje-grupal--ultimo': ultimo,
    }"
  >
    <span v-if="primero" class="mensaje-grupal__avatar">
      <AvatarPresencia
        :nombre="nombreEmisor"
        :foto-url="fotoUrl"
        :tamano="30"
        :mostrar-punto="false"
      />
    </span>
    <span v-else class="mensaje-grupal__avatar mensaje-grupal__avatar--vacio"></span>

    <div class="mensaje-grupal__contenido">
      <div v-if="primero" class="mensaje-grupal__quien">
        {{ nombreEmisor }} · {{ hora }}
      </div>
      <div class="mensaje-grupal__burbuja">{{ mensaje.contenido }}</div>
    </div>
  </div>
</template>

<script>
import AvatarPresencia from "../conexion/AvatarPresencia.vue";
import { formatearHoraMensaje } from "../../utils/fechas.js";

export default {
  name: "MensajeGrupalItem",
  components: { AvatarPresencia },
  props: {
    mensaje: {
      type: Object,
      required: true,
    },
    primero: {
      type: Boolean,
      default: true,
    },
    ultimo: {
      type: Boolean,
      default: true,
    },
    idPerfilActivo: {
      type: [Number, String],
      default: null,
    },
  },
  computed: {
    esMio() {
      if (this.mensaje?.esMio === true) return true;
      if (this.mensaje?.esMio === false) return false;
      return (
        this.idPerfilActivo != null &&
        String(this.mensaje?.idPerfilEmisor) === String(this.idPerfilActivo)
      );
    },
    perfilEmisor() {
      return this.mensaje?.perfilEmisor || {};
    },
    nombreEmisor() {
      if (this.esMio) return "Vos";
      return (
        this.perfilEmisor.nombreArtistico ||
        [this.perfilEmisor.nombre, this.perfilEmisor.apellido]
          .filter(Boolean)
          .join(" ") ||
        "Perfil"
      );
    },
    fotoUrl() {
      return this.perfilEmisor.fotoUrl || "";
    },
    hora() {
      return formatearHoraMensaje(this.mensaje?.fechaEnvio);
    },
  },
};
</script>

<style scoped>
.mensaje-grupal {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  margin-top: 2px;
}

.mensaje-grupal--propio {
  flex-direction: row-reverse;
}

.mensaje-grupal--primero {
  margin-top: 10px;
}

.mensaje-grupal__avatar {
  width: 30px;
  flex: none;
  align-self: flex-end;
}

.mensaje-grupal__avatar--vacio {
  height: 1px;
}

.mensaje-grupal__contenido {
  display: flex;
  max-width: min(560px, 78%);
  flex-direction: column;
}

.mensaje-grupal--propio .mensaje-grupal__contenido {
  align-items: flex-end;
}

.mensaje-grupal__quien {
  margin: 0 4px 3px;
  color: var(--color-text-muted);
  font-size: 0.7rem;
  font-weight: 600;
}

.mensaje-grupal--propio .mensaje-grupal__quien {
  text-align: right;
}

.mensaje-grupal__burbuja {
  padding: 0.6rem 0.85rem;
  border-radius: 14px;
  background: var(--color-chip);
  color: var(--color-text);
  font-size: 0.86rem;
  line-height: 1.5;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.mensaje-grupal--propio .mensaje-grupal__burbuja {
  background: var(--color-primary-fill);
  color: var(--color-on-primary);
}
</style>
