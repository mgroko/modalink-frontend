<template>
  <div class="chat">
    <template v-if="conversacion">
      <header class="chat__header">
        <button
          type="button"
          class="chat__volver"
          aria-label="Volver a la lista de conversaciones"
          @click="$emit('volver')"
        >
          <span class="material-symbols-outlined">arrow_back</span>
        </button>

        <AvatarPresencia
          :nombre="nombre"
          :foto-url="fotoUrl"
          :en-linea="enLinea"
          :tamano="48"
        />

        <div class="chat__identidad">
          <strong>{{ nombre }}</strong>
          <span class="chat__profesion">{{ profesion }}</span>
          <IndicadorPresencia :en-linea="enLinea" />
        </div>

        <span v-if="soloLectura" class="chat__solo-badge">Solo lectura</span>
      </header>

      <div ref="lista" class="chat__mensajes">
        <div v-if="cargando" class="chat__estado" aria-live="polite">
          <span class="material-symbols-outlined" aria-hidden="true">
            hourglass_empty
          </span>
          Cargando mensajes...
        </div>

        <div v-else-if="error && !mensajes.length" class="chat__estado chat__estado--error">
          <p>{{ error }}</p>
          <button type="button" class="chat__reintentar" @click="$emit('reintentar')">
            Reintentar
          </button>
        </div>

        <template v-else>
          <div v-if="error" class="chat__error-inline" role="alert">
            {{ error }}
          </div>

          <button
            v-if="!paginacion.ultima"
            type="button"
            class="chat__anteriores"
            :disabled="cargandoAnteriores"
            @click="$emit('cargar-anteriores')"
          >
            {{ cargandoAnteriores ? "Cargando..." : "Cargar mensajes anteriores" }}
          </button>

          <div v-if="!mensajes.length" class="chat__vacio">
            <span class="material-symbols-outlined" aria-hidden="true">
              forum
            </span>
            <p>
              Todavía no hay mensajes con {{ nombre }}.<br />
              Presentate y proponé un horario para coordinar.
            </p>
          </div>

          <template v-for="item in mensajesAgrupados" :key="item.mensaje.idMensaje">
            <div v-if="item.mostrarSeparador" class="chat__dia">
              {{ item.dia }}
            </div>
            <MensajeItem
              :mensaje="item.mensaje"
              :primero="item.primero"
              :ultimo="item.ultimo"
              :id-perfil-activo="idPerfilActivo"
              :nombre="nombre"
              :foto-url="fotoUrl"
            />
          </template>
        </template>
      </div>

      <div v-if="errorEnvio" class="chat__error-envio" role="alert">
        {{ errorEnvio }}
      </div>

      <div
        v-if="!soloLectura"
        class="chat__escribiendo"
        role="status"
        aria-live="polite"
      >
        <template v-if="escribiendo">
          <span>Escribiendo</span>
          <span class="chat__puntos" aria-hidden="true">
            <i></i><i></i><i></i>
          </span>
        </template>
      </div>

      <div v-if="!soloLectura" class="chat__compositor">
        <button
          type="button"
          class="chat__emoji"
          aria-label="Insertar emoji"
          @click="insertarEmoji"
        >
          🙂
        </button>
        <input
          ref="input"
          class="chat__input"
          :value="borrador"
          :maxlength="largoMaximo"
          type="text"
          placeholder="Escribí un mensaje…"
          aria-label="Mensaje"
          @input="$emit('update:borrador', $event.target.value)"
          @keydown.enter.prevent="enviar"
        />
        <button
          type="button"
          class="chat__enviar"
          :disabled="!puedeEnviar"
          @click="enviar"
        >
          Enviar
        </button>
      </div>

      <div v-else class="chat__solo-lectura">
        La conexión ya no está activa. Podés leer el historial, pero no enviar
        mensajes.
      </div>
    </template>

    <div v-else class="chat__sin-seleccion">
      <span class="material-symbols-outlined" aria-hidden="true">chat_bubble</span>
      <h2>Elegí una conversación</h2>
      <p>Seleccioná un chat o un contacto para empezar a mensajear.</p>
    </div>
  </div>
</template>

<script>
import AvatarPresencia from "../conexion/AvatarPresencia.vue";
import IndicadorPresencia from "../conexion/IndicadorPresencia.vue";
import MensajeItem from "./MensajeItem.vue";
import {
  formatearDiaMensaje,
} from "../../utils/fechas.js";
import { LARGO_MAXIMO_MENSAJE } from "../../utils/mensajeConstants.js";

export default {
  name: "ChatConversacion",
  components: {
    AvatarPresencia,
    IndicadorPresencia,
    MensajeItem,
  },
  props: {
    conversacion: {
      type: Object,
      default: null,
    },
    mensajes: {
      type: Array,
      default: () => [],
    },
    cargando: {
      type: Boolean,
      default: false,
    },
    error: {
      type: String,
      default: "",
    },
    cargandoAnteriores: {
      type: Boolean,
      default: false,
    },
    paginacion: {
      type: Object,
      default: () => ({
        paginaActual: 0,
        tamanoPagina: 50,
        totalElementos: 0,
        totalPaginas: 0,
        primera: true,
        ultima: true,
      }),
    },
    enviando: {
      type: Boolean,
      default: false,
    },
    errorEnvio: {
      type: String,
      default: "",
    },
    idPerfilActivo: {
      type: [Number, String],
      default: null,
    },
    enLinea: {
      type: Boolean,
      default: false,
    },
    borrador: {
      type: String,
      default: "",
    },
    escribiendo: {
      type: Boolean,
      default: false,
    },
  },
  emits: [
    "volver",
    "enviar",
    "cargar-anteriores",
    "reintentar",
    "update:borrador",
  ],
  data() {
    return {
      largoMaximo: LARGO_MAXIMO_MENSAJE,
    };
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
    soloLectura() {
      return this.conversacion?.puedeEnviar === false;
    },
    puedeEnviar() {
      return (
        !this.enviando &&
        String(this.borrador || "").trim().length > 0 &&
        String(this.borrador || "").trim().length <= LARGO_MAXIMO_MENSAJE
      );
    },
    mensajesAgrupados() {
      return this.mensajes.map((mensaje, indice) => {
        const anterior = this.mensajes[indice - 1] || null;
        const siguiente = this.mensajes[indice + 1] || null;
        const dia = formatearDiaMensaje(mensaje.fechaEnvio);
        const diaAnterior = anterior
          ? formatearDiaMensaje(anterior.fechaEnvio)
          : null;
        const diaSiguiente = siguiente
          ? formatearDiaMensaje(siguiente.fechaEnvio)
          : null;
        const mismoEmisorAnterior =
          anterior && this.esMismoEmisor(anterior, mensaje);
        const mismoEmisorSiguiente =
          siguiente && this.esMismoEmisor(mensaje, siguiente);

        return {
          mensaje,
          dia,
          mostrarSeparador: !anterior || diaAnterior !== dia,
          primero: !anterior || diaAnterior !== dia || !mismoEmisorAnterior,
          ultimo: !siguiente || diaSiguiente !== dia || !mismoEmisorSiguiente,
        };
      });
    },
  },
  methods: {
    esMismoEmisor(a, b) {
      const aMio = a?.esMio === true;
      const bMio = b?.esMio === true;
      if (aMio !== bMio) return false;
      return String(a?.idPerfilEmisor) === String(b?.idPerfilEmisor);
    },
    enviar() {
      if (!this.puedeEnviar) return;
      this.$emit("enviar", String(this.borrador || "").trim());
    },
    insertarEmoji() {
      const valor = `${this.borrador || ""}🙂`;
      this.$emit("update:borrador", valor);
      this.$nextTick(() => {
        const input = this.$refs.input;
        if (!input) return;
        input.focus();
        input.setSelectionRange(valor.length, valor.length);
      });
    },
    scrollAlFinal() {
      const lista = this.$refs.lista;
      if (!lista) return;
      lista.scrollTop = lista.scrollHeight;
    },
    estaCercaDelFinal() {
      const lista = this.$refs.lista;
      if (!lista) return true;
      return lista.scrollHeight - lista.scrollTop - lista.clientHeight < 140;
    },
    capturarScroll() {
      const lista = this.$refs.lista;
      if (!lista) return null;
      return { altura: lista.scrollHeight, top: lista.scrollTop };
    },
    restaurarScroll(previo) {
      if (!previo) return;
      this.$nextTick(() => {
        const lista = this.$refs.lista;
        if (!lista) return;
        lista.scrollTop = lista.scrollHeight - previo.altura + previo.top;
      });
    },
    enfocarInput() {
      this.$nextTick(() => this.$refs.input?.focus());
    },
  },
};
</script>

<style scoped>
.chat {
  display: flex;
  flex: 1;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  background: var(--color-surface-soft);
}

.chat__header {
  display: flex;
  flex: none;
  min-height: 78px;
  align-items: center;
  gap: 0.85rem;
  padding: 0 1.25rem;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.chat__volver {
  display: none;
  padding: 0.25rem 0.5rem;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text);
  font-size: 1.35rem;
  cursor: pointer;
}

.chat__identidad {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 0.05rem;
}

.chat__identidad strong {
  overflow: hidden;
  font-size: 1.02rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat__profesion {
  color: var(--color-text-muted);
  font-size: 0.78rem;
}

.chat__solo-badge {
  margin-left: auto;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  background: var(--color-warning-soft);
  color: var(--color-warning-text);
  font-size: 0.7rem;
  font-weight: 700;
}

.chat__mensajes {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
  padding: 1.1rem 1.25rem;
}

.chat__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 160px;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  text-align: center;
}

.chat__estado--error {
  color: var(--color-danger-text);
}

.chat__error-inline {
  align-self: center;
  margin-bottom: 0.5rem;
  padding: 0.45rem 0.75rem;
  border-radius: 8px;
  background: var(--color-danger-soft);
  color: var(--color-danger-text);
  font-size: 0.74rem;
  font-weight: 600;
  text-align: center;
}

.chat__reintentar {
  padding: 0.4rem 0.8rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
}

.chat__anteriores {
  align-self: center;
  margin-bottom: 0.5rem;
  padding: 0.35rem 0.8rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
}

.chat__anteriores:disabled {
  cursor: wait;
  opacity: 0.6;
}

.chat__dia {
  align-self: center;
  margin: 0.6rem 0 0.35rem;
  padding: 0.2rem 0.75rem;
  border-radius: 999px;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  font-size: 0.7rem;
  font-weight: 700;
}

.chat__vacio {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem;
  color: var(--color-text-muted);
  text-align: center;
  line-height: 1.5;
}

.chat__vacio .material-symbols-outlined {
  font-size: 2rem;
}

.chat__error-envio {
  margin: 0 1.25rem 0.5rem;
  padding: 0.6rem 0.8rem;
  border-radius: 8px;
  background: var(--color-danger-soft);
  color: var(--color-danger-text);
  font-size: 0.78rem;
  font-weight: 600;
}

.chat__escribiendo {
  display: flex;
  flex: none;
  height: 20px;
  align-items: center;
  gap: 1px;
  padding: 0 1.25rem;
  color: var(--color-text-muted);
  font-size: 0.72rem;
  line-height: 1;
}

.chat__puntos {
  display: inline-flex;
  gap: 2px;
  margin-left: 2px;
}

.chat__puntos i {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: currentColor;
  animation: chat-punto 1.2s infinite ease-in-out;
}

.chat__puntos i:nth-child(2) {
  animation-delay: 0.15s;
}

.chat__puntos i:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes chat-punto {
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
  .chat__puntos i {
    animation: none;
    opacity: 0.7;
  }
}

.chat__compositor {
  display: flex;
  flex: none;
  align-items: center;
  gap: 0.6rem;
  padding: 0.85rem 1rem;
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
}

.chat__emoji {
  display: inline-flex;
  width: 38px;
  height: 38px;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  background: transparent;
  font-size: 1.3rem;
  cursor: pointer;
}

.chat__emoji:hover {
  background: var(--color-surface-muted);
}

.chat__input {
  flex: 1;
  min-width: 0;
  padding: 0.65rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface-muted);
  color: var(--color-text);
  font: inherit;
  outline: 0;
}

.chat__input:focus {
  border-color: var(--color-primary);
}

.chat__enviar {
  padding: 0.65rem 1.2rem;
  border: 0;
  border-radius: 999px;
  background: var(--color-support);
  color: var(--color-on-primary);
  font-weight: 700;
  cursor: pointer;
}

.chat__enviar:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.chat__solo-lectura {
  flex: none;
  padding: 0.85rem 1rem;
  border-top: 1px solid var(--color-border);
  background: var(--color-warning-soft);
  color: var(--color-warning-text);
  font-size: 0.8rem;
  font-weight: 600;
  text-align: center;
}

.chat__sin-seleccion {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 2rem;
  color: var(--color-text-muted);
  text-align: center;
}

.chat__sin-seleccion .material-symbols-outlined {
  font-size: 2.4rem;
}

.chat__sin-seleccion h2 {
  margin: 0.2rem 0 0;
  color: var(--color-text);
  font-size: 1.1rem;
}

.chat__sin-seleccion p {
  margin: 0;
  font-size: 0.85rem;
}

@media (max-width: 900px) {
  .chat__volver {
    display: inline-flex;
  }

  .chat__header {
    padding: 0 0.75rem;
  }

  .chat__mensajes {
    padding: 0.9rem 0.75rem;
  }

  .chat__compositor {
    padding: 0.7rem 0.75rem;
  }

  .chat__escribiendo {
    padding: 0 0.75rem;
  }
}
</style>
