<template>
  <div
    class="mensaje"
    :class="{
      'mensaje--propio': esMio,
      'mensaje--primero': primero,
      'mensaje--ultimo': ultimo,
    }"
  >
    <span v-if="!esMio" class="mensaje__avatar">
      <AvatarPresencia
        v-if="primero"
        :nombre="nombre"
        :foto-url="fotoUrl"
        :tamano="28"
        :mostrar-punto="false"
      />
    </span>

    <div class="mensaje__contenido">
      <div class="mensaje__burbuja">{{ mensaje.contenido }}</div>
      <div v-if="ultimo" class="mensaje__meta">
        <span>{{ hora }}</span>
        <span
          v-if="esMio"
          class="mensaje__estado"
          :title="leido ? 'Leído' : 'Enviado'"
        >
          <span class="material-symbols-outlined" aria-hidden="true">
            {{ leido ? "done_all" : "done" }}
          </span>
        </span>
      </div>
    </div>
  </div>
</template>

<script>
import AvatarPresencia from "../conexion/AvatarPresencia.vue";
import { formatearHoraMensaje } from "../../utils/fechas.js";

export default {
  name: "MensajeItem",
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
    nombre: {
      type: String,
      default: "Perfil",
    },
    fotoUrl: {
      type: String,
      default: "",
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
    leido() {
      return this.mensaje?.leido === true;
    },
    hora() {
      return formatearHoraMensaje(this.mensaje?.fechaEnvio);
    },
  },
};
</script>

<style scoped>
.mensaje {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  margin-top: 2px;
}

.mensaje--propio {
  justify-content: flex-end;
}

.mensaje--primero {
  margin-top: 10px;
}

.mensaje__avatar {
  width: 28px;
  flex: none;
  align-self: flex-end;
}

.mensaje__contenido {
  display: flex;
  flex-direction: column;
  max-width: min(520px, 78%);
}

.mensaje--propio .mensaje__contenido {
  align-items: flex-end;
}

.mensaje__burbuja {
  padding: 0.65rem 0.9rem;
  border-radius: 18px;
  line-height: 1.5;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.mensaje:not(.mensaje--propio) .mensaje__burbuja {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-bottom-left-radius: 6px;
}

.mensaje--propio .mensaje__burbuja {
  background: var(--color-primary-fill);
  color: var(--color-on-primary);
  border-bottom-right-radius: 6px;
}

.mensaje__meta {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  margin-top: 3px;
  padding: 0 4px;
  color: var(--color-text-muted);
  font-size: 0.72rem;
}

.mensaje__estado {
  display: inline-flex;
  align-items: center;
  color: var(--color-support);
}

.mensaje__estado .material-symbols-outlined {
  font-size: 1rem;
  font-weight: 700;
}
</style>
