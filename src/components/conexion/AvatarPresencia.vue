<template>
  <span
    class="avatar-presencia"
    :style="{
      '--avatar-size': `${tamano}px`,
      '--avatar-border': borde,
    }"
  >
    <img v-if="foto" :src="foto" :alt="nombre" />
    <span v-else class="avatar-presencia__iniciales">{{ iniciales }}</span>
    <span
      v-if="mostrarPunto"
      class="avatar-presencia__punto"
      :class="{ 'avatar-presencia__punto--online': enLinea }"
      aria-hidden="true"
    ></span>
  </span>
</template>

<script>
import { resolverFotoUrl } from "../../utils/fotos.js";

export default {
  name: "AvatarPresencia",
  props: {
    nombre: {
      type: String,
      default: "Perfil",
    },
    fotoUrl: {
      type: String,
      default: "",
    },
    enLinea: {
      type: Boolean,
      default: false,
    },
    mostrarPunto: {
      type: Boolean,
      default: true,
    },
    tamano: {
      type: Number,
      default: 48,
    },
    borde: {
      type: String,
      default: "var(--color-surface)",
    },
  },
  computed: {
    foto() {
      return resolverFotoUrl(this.fotoUrl);
    },
    iniciales() {
      return String(this.nombre || "?")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((parte) => parte.charAt(0).toUpperCase())
        .join("");
    },
  },
};
</script>

<style scoped>
.avatar-presencia {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--avatar-size);
  height: var(--avatar-size);
  border-radius: 50%;
  flex: none;
  background: var(--color-secondary);
  color: var(--color-on-primary);
  font-size: calc(var(--avatar-size) * 0.34);
  font-weight: 700;
  overflow: visible;
}

.avatar-presencia img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-presencia__iniciales {
  overflow: hidden;
  white-space: nowrap;
}

.avatar-presencia__punto {
  position: absolute;
  right: -1px;
  bottom: -1px;
  width: calc(var(--avatar-size) * 0.2);
  height: calc(var(--avatar-size) * 0.2);
  min-width: 9px;
  min-height: 9px;
  border-radius: 50%;
  background: #9ca3af;
  border: 2px solid var(--avatar-border);
}

.avatar-presencia__punto--online {
  background: #22c55e;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.16);
}
</style>
