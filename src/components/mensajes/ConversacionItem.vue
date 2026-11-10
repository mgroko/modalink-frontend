<template>
  <button
    type="button"
    class="conv-item"
    :class="{ 'conv-item--activa': activa }"
    @click="$emit('seleccionar', conversacion)"
  >
    <AvatarPresencia
      :nombre="nombre"
      :foto-url="fotoUrl"
      :en-linea="enLinea"
      :tamano="46"
    />

    <span class="conv-item__info">
      <span class="conv-item__fila">
        <strong class="conv-item__nombre">{{ nombre }}</strong>
        <small class="conv-item__fecha">{{ fecha }}</small>
      </span>
      <span class="conv-item__profesion">{{ profesion }}</span>
      <span class="conv-item__fila conv-item__preview">
        <span class="conv-item__texto" :class="{ 'conv-item__texto--escribiendo': escribiendo }">
          {{ escribiendo ? "Escribiendo" : preview
          }}<span v-if="escribiendo" class="conv-item__puntos" aria-hidden="true"
            ><i></i><i></i><i></i
          ></span>
        </span>
        <span
          v-if="noLeidos"
          class="conv-item__punto"
          aria-label="Conversación no leída"
        ></span>
        <span v-if="soloLectura" class="conv-item__solo">Solo lectura</span>
      </span>
    </span>
  </button>
</template>

<script>
import AvatarPresencia from "../conexion/AvatarPresencia.vue";
import { formatearFechaListaConversacion } from "../../utils/fechas.js";

export default {
  name: "ConversacionItem",
  components: { AvatarPresencia },
  props: {
    conversacion: {
      type: Object,
      required: true,
    },
    activa: {
      type: Boolean,
      default: false,
    },
    enLinea: {
      type: Boolean,
      default: false,
    },
    escribiendo: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    perfil() {
      return this.conversacion?.perfil || {};
    },
    nombre() {
      return (
        this.perfil.nombreArtistico ||
        [this.perfil.nombre, this.perfil.apellido].filter(Boolean).join(" ") ||
        "Perfil"
      );
    },
    profesion() {
      return this.perfil.nombreProfesion || "Profesión";
    },
    fotoUrl() {
      return this.perfil.fotoUrl || "";
    },
    fecha() {
      return formatearFechaListaConversacion(
        this.conversacion?.fechaUltimoMensaje ||
          this.conversacion?.fechaCreacion
      );
    },
    preview() {
      return this.conversacion?.ultimoMensaje || "Sin mensajes todavía";
    },
    noLeidos() {
      return this.conversacion?.tieneNoLeidos === true;
    },
    soloLectura() {
      return this.conversacion?.puedeEnviar === false;
    },
  },
};
</script>

<style scoped>
.conv-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 0.9rem;
  border: 0;
  border-left: 3px solid transparent;
  background: transparent;
  color: var(--color-text);
  text-align: left;
  cursor: pointer;
}

.conv-item:hover {
  background: var(--color-surface-muted);
}

.conv-item--activa {
  background: var(--color-chip);
  border-left-color: var(--color-primary);
}

.conv-item__info {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 1px;
}

.conv-item__fila {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  min-width: 0;
}

.conv-item__nombre {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  font-size: 0.95rem;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conv-item__fecha {
  flex: none;
  color: var(--color-text-muted);
  font-size: 0.7rem;
}

.conv-item__profesion {
  overflow: hidden;
  color: var(--color-text-muted);
  font-size: 0.76rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conv-item__preview {
  margin-top: 2px;
  color: var(--color-text-muted);
  font-size: 0.78rem;
}

.conv-item__texto {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conv-item__texto--escribiendo {
  color: var(--color-primary);
  font-style: italic;
}

.conv-item__puntos {
  display: inline-flex;
  gap: 2px;
  margin-left: 2px;
  vertical-align: middle;
}

.conv-item__puntos i {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: currentColor;
  animation: conv-punto 1.2s infinite ease-in-out;
}

.conv-item__puntos i:nth-child(2) {
  animation-delay: 0.15s;
}

.conv-item__puntos i:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes conv-punto {
  0%,
  60%,
  100% {
    opacity: 0.35;
    transform: translateY(0);
  }

  30% {
    opacity: 1;
    transform: translateY(-2px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .conv-item__puntos i {
    animation: none;
    opacity: 0.7;
  }
}

.conv-item__solo {
  flex: none;
  color: var(--color-warning-text);
  font-size: 0.66rem;
  font-weight: 700;
}

.conv-item__punto {
  flex: none;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--color-danger-fill);
}
</style>
