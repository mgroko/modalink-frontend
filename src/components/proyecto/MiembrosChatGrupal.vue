<template>
  <section class="chat-miembros">
    <header class="chat-miembros__cabecera">
      <h2 class="chat-miembros__titulo">
        Miembros
        <span v-if="!cargando && !error" class="chat-miembros__contador">
          · {{ participantes.length }}
        </span>
      </h2>
    </header>

    <BaseAlert v-if="error" :message="error" type="error" />

    <p v-if="cargando && !participantes.length" class="chat-miembros__nota">
      Cargando miembros...
    </p>

    <p
      v-else-if="!error && !participantes.length"
      class="chat-miembros__vacio"
    >
      Este proyecto todavía no tiene miembros activos.
    </p>

    <ul
      v-else-if="!error"
      class="chat-miembros__lista"
      aria-label="Miembros del proyecto"
    >
      <li
        v-for="participante in participantes"
        :key="participante.perfil?.idPerfil"
      >
        <button
          type="button"
          class="chat-miembros__fila"
          :aria-label="`Ver perfil de ${nombre(participante)}`"
          @click="$emit('ver-perfil', participante)"
        >
          <span
            class="chat-miembros__avatar"
            :style="{ background: colorAvatar(participante) }"
            aria-hidden="true"
          >
            <img
              v-if="foto(participante) && !fotoRota(participante)"
              :src="foto(participante)"
              alt=""
              @error="marcarFotoRota(participante)"
            />
            <template v-else>{{ iniciales(participante) }}</template>
            <span
              class="chat-miembros__punto"
              :class="{ 'chat-miembros__punto--online': enLinea(participante) }"
            ></span>
          </span>

          <span class="chat-miembros__datos">
            <span class="chat-miembros__nombre">
              {{ nombre(participante) }}
              <span v-if="esVos(participante)" class="chat-miembros__vos">
                Vos
              </span>
            </span>
            <span class="chat-miembros__profesion">
              {{ profesion(participante) }}
            </span>
          </span>

          <span class="chat-miembros__rol">{{ rol(participante) }}</span>
        </button>
      </li>
    </ul>

    <button
      v-if="!cargando"
      type="button"
      class="chat-miembros__ver"
      @click="$emit('ir-miembros')"
    >
      Ver miembros del proyecto
    </button>
  </section>
</template>

<script>
import BaseAlert from "../AlertaBase.vue";
import { enLineaDe } from "../../services/presenciaState";
import { resolverFotoUrl } from "../../utils/fotos.js";
import {
  colorAvatarMiembro,
  inicialesMiembro,
  textoRolMiembro,
} from "../../utils/integranteConstants.js";

export default {
  name: "MiembrosChatGrupal",
  components: { BaseAlert },
  props: {
    participantes: {
      type: Array,
      default: () => [],
    },
    idPerfilActivo: {
      type: [Number, String],
      default: null,
    },
    cargando: {
      type: Boolean,
      default: false,
    },
    error: {
      type: String,
      default: "",
    },
  },
  emits: ["ver-perfil", "ir-miembros"],
  data() {
    return {
      fotosRotas: {},
    };
  },
  methods: {
    perfil(participante) {
      return participante?.perfil || {};
    },
    nombre(participante) {
      const perfil = this.perfil(participante);
      return (
        perfil.nombreArtistico ||
        [perfil.nombre, perfil.apellido].filter(Boolean).join(" ") ||
        "Perfil"
      );
    },
    profesion(participante) {
      return this.perfil(participante).nombreProfesion || "Profesión";
    },
    rol(participante) {
      return textoRolMiembro({ rol: participante?.rol });
    },
    esVos(participante) {
      const id = this.perfil(participante).idPerfil;
      return (
        id != null &&
        this.idPerfilActivo != null &&
        String(id) === String(this.idPerfilActivo)
      );
    },
    enLinea(participante) {
      return enLineaDe(this.perfil(participante).idPerfil);
    },
    foto(participante) {
      return resolverFotoUrl(this.perfil(participante).fotoUrl);
    },
    fotoRota(participante) {
      const id = this.perfil(participante).idPerfil;
      return id != null && this.fotosRotas[id] === true;
    },
    marcarFotoRota(participante) {
      const id = this.perfil(participante).idPerfil;
      if (id == null) return;
      this.fotosRotas = { ...this.fotosRotas, [id]: true };
    },
    iniciales(participante) {
      return inicialesMiembro(this.perfil(participante));
    },
    colorAvatar(participante) {
      return colorAvatarMiembro(this.perfil(participante).idPerfil);
    },
  },
};
</script>

<style scoped>
.chat-miembros {
  display: flex;
  min-height: 0;
  max-height: 720px;
  flex-direction: column;
  overflow: hidden;
  padding: 1.1rem 1.15rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.chat-miembros__cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.6rem;
}

.chat-miembros__titulo {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
}

.chat-miembros__contador {
  color: var(--color-text-muted);
  font-size: 0.82rem;
  font-weight: 500;
}

.chat-miembros__nota,
.chat-miembros__vacio {
  margin: 0.5rem 0;
  color: var(--color-text-muted);
  font-size: 0.8rem;
  line-height: 1.5;
}

.chat-miembros__lista {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
}

.chat-miembros__fila {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 0.7rem;
  padding: 0.65rem 0.25rem;
  border: 0;
  border-top: 1px solid var(--color-border-soft);
  background: transparent;
  color: var(--color-text);
  text-align: left;
  cursor: pointer;
}

.chat-miembros__lista li:first-child .chat-miembros__fila {
  border-top: 0;
}

.chat-miembros__fila:hover {
  background: var(--color-surface-muted);
}

.chat-miembros__avatar {
  position: relative;
  display: inline-flex;
  width: 38px;
  height: 38px;
  flex: none;
  align-items: center;
  justify-content: center;
  overflow: visible;
  border-radius: 50%;
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
}

.chat-miembros__avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.chat-miembros__punto {
  position: absolute;
  right: -1px;
  bottom: -1px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-text-subtle);
  border: 2px solid var(--color-surface);
}

.chat-miembros__punto--online {
  background: #22c55e;
}

.chat-miembros__datos {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 0.08rem;
}

.chat-miembros__nombre {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.35rem;
  overflow: hidden;
  font-size: 0.84rem;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-miembros__vos {
  padding: 0.05rem 0.35rem;
  border-radius: 999px;
  background: var(--color-chip);
  color: var(--color-primary);
  font-size: 0.62rem;
  font-weight: 700;
}

.chat-miembros__profesion {
  overflow: hidden;
  color: var(--color-text-muted);
  font-size: 0.72rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-miembros__rol {
  flex: none;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  background: var(--color-chip);
  color: var(--color-primary);
  font-size: 0.64rem;
  font-weight: 700;
}

.chat-miembros__ver {
  margin-top: 0.75rem;
  padding: 0.55rem 0.75rem;
  border: 1.5px solid var(--color-primary);
  border-radius: 8px;
  background: transparent;
  color: var(--color-primary);
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
}

.chat-miembros__ver:hover {
  background: var(--color-chip);
}

@media (max-width: 1000px) {
  .chat-miembros__lista {
    max-height: 260px;
    overflow-y: auto;
  }
}
</style>
