<template>
  <section class="chat-grupal">
    <MiembrosChatGrupal
      :participantes="participantes"
      :id-perfil-activo="idActivo"
      :cargando="cargandoChat"
      :error="errorChat"
      @ver-perfil="verPerfil"
      @ir-miembros="$emit('ir-miembros')"
    />

    <div class="chat-grupal__chat">
      <header class="chat-grupal__cabecera">
        <span class="material-symbols-outlined chat-grupal__icono" aria-hidden="true">
          forum
        </span>

        <div class="chat-grupal__titulo">
          <strong>Chat del proyecto</strong>
          <span>
            {{ nombreProyectoMostrar }} · {{ participantes.length }} miembros
          </span>
        </div>

        <div v-if="avataresCabecera.length" class="chat-grupal__avatares">
          <span
            v-for="participante in avataresCabecera"
            :key="participante.perfil?.idPerfil"
            class="chat-grupal__avatar-item"
          >
            <AvatarPresencia
              :nombre="nombreParticipante(participante)"
              :foto-url="participante.perfil?.fotoUrl || ''"
              :tamano="28"
              :mostrar-punto="false"
            />
          </span>
          <span v-if="restantesCabecera" class="chat-grupal__restantes">
            +{{ restantesCabecera }}
          </span>
        </div>
      </header>

      <div v-if="cargandoChat && !chat" class="chat-grupal__estado">
        <span class="material-symbols-outlined" aria-hidden="true">
          hourglass_empty
        </span>
        Cargando chat...
      </div>

      <div
        v-else-if="!chat && errorChat"
        class="chat-grupal__estado chat-grupal__estado--error"
      >
        <p>{{ errorChat }}</p>
        <button type="button" class="chat-grupal__reintentar" @click="cargarTodo">
          Reintentar
        </button>
      </div>

      <template v-else-if="chat">
        <div ref="lista" class="chat-grupal__mensajes">
          <div v-if="cargandoMensajes" class="chat-grupal__estado" aria-live="polite">
            <span class="material-symbols-outlined" aria-hidden="true">
              hourglass_empty
            </span>
            Cargando mensajes...
          </div>

          <div
            v-else-if="errorMensajes && !mensajes.length"
            class="chat-grupal__estado chat-grupal__estado--error"
          >
            <p>{{ errorMensajes }}</p>
            <button
              type="button"
              class="chat-grupal__reintentar"
              @click="reintentarMensajes"
            >
              Reintentar
            </button>
          </div>

          <template v-else>
            <div v-if="errorMensajes" class="chat-grupal__error-inline" role="alert">
              {{ errorMensajes }}
            </div>

            <button
              v-if="!paginacion.ultima"
              type="button"
              class="chat-grupal__anteriores"
              :disabled="cargandoAnteriores"
              @click="cargarMensajesAnteriores"
            >
              {{
                cargandoAnteriores
                  ? "Cargando..."
                  : "Cargar mensajes anteriores"
              }}
            </button>

            <div v-if="!mensajes.length" class="chat-grupal__vacio">
              <span class="material-symbols-outlined" aria-hidden="true">
                forum
              </span>
              <p>
                Todavía no hay mensajes en este proyecto.<br />
                Escribí el primero para coordinar con el equipo.
              </p>
            </div>

            <template
              v-for="item in mensajesAgrupados"
              :key="item.mensaje.idMensajeProyecto"
            >
              <div v-if="item.mostrarSeparador" class="chat-grupal__dia">
                {{ item.dia }}
              </div>
              <MensajeGrupalItem
                :mensaje="item.mensaje"
                :primero="item.primero"
                :ultimo="item.ultimo"
                :id-perfil-activo="idActivo"
              />
            </template>
          </template>
        </div>

        <div v-if="errorEnvio" class="chat-grupal__error-envio" role="alert">
          {{ errorEnvio }}
        </div>

        <div v-if="chatPermiteEnviar" class="chat-grupal__compositor">
          <button
            type="button"
            class="chat-grupal__emoji"
            :class="{ 'chat-grupal__emoji--activo': emojiAbierto }"
            aria-label="Abrir selector de emojis"
            :aria-expanded="emojiAbierto ? 'true' : 'false'"
            @click="alternarEmoji"
          >
            🙂
          </button>

          <input
            ref="input"
            class="chat-grupal__input"
            :value="borrador"
            :maxlength="largoMaximo"
            type="text"
            placeholder="Escribí un mensaje al equipo…"
            aria-label="Mensaje para el equipo"
            @input="borrador = $event.target.value"
            @keydown.enter.prevent="enviarMensaje(borrador)"
          />

          <button
            type="button"
            class="chat-grupal__enviar"
            :disabled="!puedeEnviarTexto"
            @click="enviarMensaje(borrador)"
          >
            Enviar
          </button>

          <EmojiPicker
            v-if="emojiAbierto"
            ref="emojiPicker"
            @seleccionar="insertarEmoji"
            @cerrar="cerrarEmoji"
          />
        </div>

        <div v-else class="chat-grupal__solo-lectura">
          El proyecto ya no admite mensajes nuevos. Podés leer el historial.
        </div>
      </template>
    </div>
  </section>
</template>

<script>
import AvatarPresencia from "../conexion/AvatarPresencia.vue";
import MiembrosChatGrupal from "./MiembrosChatGrupal.vue";
import MensajeGrupalItem from "./MensajeGrupalItem.vue";
import EmojiPicker from "../mensajes/EmojiPicker.vue";
import chatGrupalService from "../../services/chatGrupalService";
import {
  state as mensajeState,
  refrescarResumenNotificaciones,
} from "../../services/mensajeState";
import {
  desuscribirPerfiles,
  reconciliarSuscripciones,
} from "../../services/presenciaState";
import { idPerfilActivo, state as authState } from "../../services/authState";
import {
  fechaHoraLocalIso,
  formatearDiaMensaje,
} from "../../utils/fechas.js";
import {
  LARGO_MAXIMO_MENSAJE,
  TAMANO_MENSAJES_GRUPALES,
  esErrorChatNoPermitido,
  esErrorSoloLectura,
  mensajeErrorChatGrupal,
} from "../../utils/chatGrupalConstants.js";
import { useToast } from "vuestic-ui";

const DEBOUNCE_LECTURA_MS = 250;

function paginacionInicial() {
  return {
    paginaActual: 0,
    tamanoPagina: TAMANO_MENSAJES_GRUPALES,
    totalElementos: 0,
    totalPaginas: 0,
    primera: true,
    ultima: true,
  };
}

function normalizarPagina(data) {
  return {
    paginaActual: data?.paginaActual ?? 0,
    tamanoPagina: data?.tamanoPagina ?? TAMANO_MENSAJES_GRUPALES,
    totalElementos: data?.totalElementos ?? 0,
    totalPaginas: data?.totalPaginas ?? 0,
    primera: data?.primera ?? true,
    ultima: data?.ultima ?? true,
  };
}

export default {
  name: "ChatGrupalProyecto",
  components: {
    AvatarPresencia,
    MiembrosChatGrupal,
    MensajeGrupalItem,
    EmojiPicker,
  },
  props: {
    idProyecto: {
      type: [Number, String],
      required: true,
    },
    nombreProyecto: {
      type: String,
      default: "",
    },
  },
  emits: ["ir-miembros"],
  setup() {
    return { toast: useToast() };
  },
  data() {
    return {
      chat: null,
      mensajes: [],
      paginacion: paginacionInicial(),
      cargandoChat: true,
      errorChat: "",
      cargandoMensajes: true,
      errorMensajes: "",
      cargandoAnteriores: false,
      enviando: false,
      errorEnvio: "",
      borrador: "",
      largoMaximo: LARGO_MAXIMO_MENSAJE,
      emojiAbierto: false,
      seleccionInicio: null,
      seleccionFin: null,
      idsPresencia: [],
      controladorChat: null,
      controladorMensajes: null,
      idCargaChat: 0,
      idCargaMensajes: 0,
      marcarLeidoTimer: null,
      refrescoNotificacionesTimer: null,
      yaCargado: false,
      huboDesconexion: false,
    };
  },
  computed: {
    idActivo() {
      return idPerfilActivo();
    },
    participantes() {
      return Array.isArray(this.chat?.participantes)
        ? this.chat.participantes
        : [];
    },
    nombreProyectoMostrar() {
      return this.nombreProyecto || this.chat?.nombreProyecto || "Proyecto";
    },
    chatPermiteEnviar() {
      return this.chat?.puedeEnviar !== false;
    },
    soloLectura() {
      return !!this.chat && this.chat.puedeEnviar === false;
    },
    puedeEnviarTexto() {
      const texto = String(this.borrador || "").trim();
      return (
        !this.enviando &&
        texto.length > 0 &&
        texto.length <= LARGO_MAXIMO_MENSAJE
      );
    },
    avataresCabecera() {
      return this.participantes.slice(0, 4);
    },
    restantesCabecera() {
      return Math.max(0, this.participantes.length - 4);
    },
    eventoSeqMensajeria() {
      return mensajeState.eventoSeq;
    },
    conectadoMensajeria() {
      return mensajeState.conectado;
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
  watch: {
    idProyecto() {
      this.reiniciar();
    },
    eventoSeqMensajeria() {
      this.procesarEvento();
    },
    conectadoMensajeria(nuevo) {
      if (!nuevo) {
        this.huboDesconexion = true;
        return;
      }
      if (this.huboDesconexion && this.yaCargado) {
        this.huboDesconexion = false;
        this.refrescarTrasReconexion();
      }
    },
    soloLectura(nuevo) {
      if (nuevo) this.emojiAbierto = false;
    },
  },
  mounted() {
    this.cargarTodo();
    this.huboDesconexion = !mensajeState.conectado;
    this.yaCargado = true;
    document.addEventListener("visibilitychange", this.alCambiarVisibilidad);
  },
  beforeUnmount() {
    this.abortarChat();
    this.abortarMensajes();
    clearTimeout(this.marcarLeidoTimer);
    clearTimeout(this.refrescoNotificacionesTimer);
    document.removeEventListener("visibilitychange", this.alCambiarVisibilidad);
    this.desuscribirPresencia();
  },
  methods: {
    nombreParticipante(participante) {
      const perfil = participante?.perfil || {};
      return (
        perfil.nombreArtistico ||
        [perfil.nombre, perfil.apellido].filter(Boolean).join(" ") ||
        "Perfil"
      );
    },
    verPerfil(participante) {
      const idPerfil = participante?.perfil?.idPerfil;
      if (idPerfil == null) return;

      if (String(idPerfil) === String(this.idActivo)) {
        this.$router.push({ name: "inicioperfil" });
        return;
      }

      this.$router.push({
        name: "ver-perfil",
        params: { id: idPerfil },
      });
    },
    abortarChat() {
      if (this.controladorChat) {
        this.controladorChat.abort();
        this.controladorChat = null;
      }
    },
    abortarMensajes() {
      if (this.controladorMensajes) {
        this.controladorMensajes.abort();
        this.controladorMensajes = null;
      }
    },
    reiniciar() {
      this.abortarChat();
      this.abortarMensajes();
      clearTimeout(this.marcarLeidoTimer);
      this.chat = null;
      this.mensajes = [];
      this.paginacion = paginacionInicial();
      this.errorChat = "";
      this.errorMensajes = "";
      this.errorEnvio = "";
      this.borrador = "";
      this.emojiAbierto = false;
      this.desuscribirPresencia();
      this.cargarTodo();
    },
    async cargarTodo() {
      const ok = await this.cargarChat();
      if (ok && this.chat) {
        this.cargarMensajes(0);
      } else {
        this.cargandoMensajes = false;
      }
    },
    async cargarChat() {
      if (this.idProyecto == null || this.idProyecto === "") return false;

      this.abortarChat();
      const controlador = new AbortController();
      this.controladorChat = controlador;
      const corrida = ++this.idCargaChat;
      this.cargandoChat = true;
      this.errorChat = "";

      try {
        const response = await chatGrupalService.obtenerChat(this.idProyecto, {
          signal: controlador.signal,
        });
        if (corrida !== this.idCargaChat) return false;

        this.chat = response?.data || null;
        this.actualizarSuscripcionPresencia();
        if (this.chat) this.programarMarcarLeido();
        return true;
      } catch (error) {
        if (
          corrida !== this.idCargaChat ||
          error?.name === "CanceledError" ||
          error?.code === "ERR_CANCELED"
        ) {
          return false;
        }

        this.chat = null;
        this.mensajes = [];
        this.desuscribirPresencia();

        if (error?._esSesionExpirada || error?.response?.status === 401) {
          return false;
        }

        this.errorChat = mensajeErrorChatGrupal(
          error,
          "No se pudo abrir el chat del proyecto."
        );
        return false;
      } finally {
        if (corrida === this.idCargaChat) {
          this.cargandoChat = false;
          this.controladorChat = null;
        }
      }
    },
    async cargarMensajes(pagina = 0) {
      if (this.idProyecto == null || this.idProyecto === "") return;

      this.abortarMensajes();
      const controlador = new AbortController();
      this.controladorMensajes = controlador;
      const corrida = ++this.idCargaMensajes;
      const previo = pagina > 0 ? this.capturarScroll() : null;

      if (pagina === 0) {
        this.cargandoMensajes = true;
        this.errorMensajes = "";
      } else {
        this.cargandoAnteriores = true;
      }

      try {
        const response = await chatGrupalService.listarMensajes(
          this.idProyecto,
          {
            page: pagina,
            size: TAMANO_MENSAJES_GRUPALES,
            signal: controlador.signal,
          }
        );
        if (corrida !== this.idCargaMensajes) return;

        const data = response?.data || {};
        const contenido = Array.isArray(data.contenido) ? data.contenido : [];
        const paginaCronologica = [...contenido]
          .reverse()
          .map((item) => this.normalizarMensaje(item));

        if (pagina === 0) {
          this.mensajes = paginaCronologica;
        } else {
          const existentes = new Set(
            this.mensajes.map((mensaje) =>
              String(mensaje.idMensajeProyecto)
            )
          );
          const nuevos = paginaCronologica.filter(
            (mensaje) =>
              !existentes.has(String(mensaje.idMensajeProyecto))
          );
          this.mensajes = [...nuevos, ...this.mensajes];
          this.ordenarMensajes();
        }

        this.paginacion = normalizarPagina(data);

        if (pagina === 0) {
          this.$nextTick(() => this.scrollAlFinal());
          this.programarMarcarLeido();
        } else {
          this.restaurarScroll(previo);
        }
      } catch (error) {
        if (
          corrida !== this.idCargaMensajes ||
          error?.name === "CanceledError" ||
          error?.code === "ERR_CANCELED"
        ) {
          return;
        }

        const mensaje = mensajeErrorChatGrupal(
          error,
          "No se pudo cargar el historial del chat."
        );
        if (pagina === 0) {
          this.errorMensajes = mensaje;
        } else {
          this.mostrarError(mensaje);
        }
      } finally {
        if (corrida === this.idCargaMensajes) {
          this.cargandoMensajes = false;
          this.cargandoAnteriores = false;
          this.controladorMensajes = null;
        }
      }
    },
    cargarMensajesAnteriores() {
      if (this.cargandoAnteriores || this.paginacion.ultima) return;
      this.cargarMensajes(this.paginacion.paginaActual + 1);
    },
    reintentarMensajes() {
      this.cargarMensajes(0);
    },
    normalizarMensaje(mensaje) {
      const esMio =
        mensaje?.esMio === true ||
        (mensaje?.esMio == null &&
          this.idActivo != null &&
          String(mensaje?.idPerfilEmisor) === String(this.idActivo));

      return {
        idMensajeProyecto: mensaje?.idMensajeProyecto,
        idProyecto: mensaje?.idProyecto ?? this.idProyecto,
        contenido: mensaje?.contenido || "",
        fechaEnvio: mensaje?.fechaEnvio || "",
        idPerfilEmisor: mensaje?.idPerfilEmisor,
        perfilEmisor: mensaje?.perfilEmisor || {},
        esMio,
        _temp: mensaje?._temp === true,
      };
    },
    ordenarMensajes() {
      this.mensajes.sort((a, b) => {
        const fechaA = String(a.fechaEnvio || "");
        const fechaB = String(b.fechaEnvio || "");
        if (fechaA !== fechaB) return fechaA.localeCompare(fechaB);
        const idA = Number(a.idMensajeProyecto);
        const idB = Number(b.idMensajeProyecto);
        if (Number.isFinite(idA) && Number.isFinite(idB)) return idA - idB;
        return 0;
      });
    },
    fusionarMensaje(mensaje) {
      if (mensaje?.idMensajeProyecto == null) return;

      const indice = this.mensajes.findIndex(
        (item) =>
          String(item.idMensajeProyecto) ===
          String(mensaje.idMensajeProyecto)
      );
      if (indice >= 0) {
        this.mensajes.splice(indice, 1, mensaje);
        this.ordenarMensajes();
        return;
      }

      const indiceTemporal = this.mensajes.findIndex(
        (item) =>
          item._temp &&
          item.esMio &&
          item.contenido === mensaje.contenido
      );
      if (indiceTemporal >= 0) {
        this.mensajes.splice(indiceTemporal, 1, mensaje);
      } else {
        this.mensajes.push(mensaje);
      }
      this.ordenarMensajes();
    },
    esMismoEmisor(a, b) {
      const aMio = a?.esMio === true;
      const bMio = b?.esMio === true;
      if (aMio !== bMio) return false;
      return String(a?.idPerfilEmisor) === String(b?.idPerfilEmisor);
    },
    actualizarSuscripcionPresencia() {
      const ids = this.participantes
        .map((participante) => participante.perfil?.idPerfil)
        .filter((id) => id != null);

      const nuevos = [
        ...new Set(
          ids.map((id) => Number(id)).filter((id) => Number.isFinite(id))
        ),
      ];

      reconciliarSuscripciones(this.idsPresencia, nuevos);
      this.idsPresencia = nuevos;
    },
    desuscribirPresencia() {
      if (this.idsPresencia.length) {
        desuscribirPerfiles(this.idsPresencia);
        this.idsPresencia = [];
      }
    },
    perfilActivoParaMensaje() {
      const participante = this.participantes.find(
        (item) =>
          String(item.perfil?.idPerfil) === String(this.idActivo)
      );
      if (participante?.perfil) return participante.perfil;

      return {
        idPerfil: this.idActivo,
        nombreArtistico:
          authState.usuario?.nombreArtisticoActivo || "Vos",
        nombre: "",
        apellido: "",
        idProfesion: null,
        nombreProfesion: "",
        fotoUrl: null,
      };
    },
    async enviarMensaje(contenido) {
      const texto = String(contenido || "").trim();
      const chat = this.chat;

      if (
        !texto ||
        texto.length > LARGO_MAXIMO_MENSAJE ||
        !chat ||
        chat.puedeEnviar === false ||
        this.enviando
      ) {
        return;
      }

      this.errorEnvio = "";
      this.enviando = true;
      this.borrador = "";

      const temporal = {
        idMensajeProyecto: `temp-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`,
        idProyecto: this.idProyecto,
        contenido: texto,
        fechaEnvio: fechaHoraLocalIso(),
        idPerfilEmisor: this.idActivo,
        perfilEmisor: this.perfilActivoParaMensaje(),
        esMio: true,
        _temp: true,
      };

      this.mensajes.push(temporal);
      this.ordenarMensajes();
      this.$nextTick(() => this.scrollAlFinal());

      try {
        const response = await chatGrupalService.enviarMensaje(
          this.idProyecto,
          texto
        );
        const data = response?.data;
        if (!data?.idMensajeProyecto) {
          throw new Error("Respuesta de mensaje inválida");
        }

        const real = this.normalizarMensaje(data);
        this.mensajes = this.mensajes.filter(
          (mensaje) =>
            mensaje.idMensajeProyecto !== temporal.idMensajeProyecto
        );
        this.fusionarMensaje(real);
      } catch (error) {
        this.mensajes = this.mensajes.filter(
          (mensaje) =>
            mensaje.idMensajeProyecto !== temporal.idMensajeProyecto
        );
        this.borrador = texto;
        this.errorEnvio = mensajeErrorChatGrupal(
          error,
          "No se pudo enviar el mensaje."
        );

        if (esErrorSoloLectura(error)) {
          chat.puedeEnviar = false;
        }
        if (esErrorChatNoPermitido(error)) {
          this.emojiAbierto = false;
        }
      } finally {
        this.enviando = false;
      }
    },
    programarMarcarLeido() {
      clearTimeout(this.marcarLeidoTimer);
      this.marcarLeidoTimer = setTimeout(() => {
        this.marcarLeidoTimer = null;
        this.marcarLeido();
      }, DEBOUNCE_LECTURA_MS);
    },
    async marcarLeido() {
      if (this.idProyecto == null || !this.chat) return;

      try {
        await chatGrupalService.marcarLeido(this.idProyecto);
        refrescarResumenNotificaciones();
        clearTimeout(this.refrescoNotificacionesTimer);
        this.refrescoNotificacionesTimer = setTimeout(() => {
          refrescarResumenNotificaciones();
        }, 800);
      } catch {
        // Best-effort: la próxima apertura o mensaje lo reintenta.
      }
    },
    procesarEvento() {
      const evento = mensajeState.ultimoEvento;
      if (!evento || evento.tipo !== "mensaje_grupal") return;

      const data = evento.data;
      const idEvento = data?.idProyecto ?? data?.mensaje?.idProyecto;
      if (String(idEvento) !== String(this.idProyecto)) return;

      const mensaje = this.normalizarMensaje(data?.mensaje || {});
      if (mensaje.idMensajeProyecto == null) return;

      const cerca = this.estaCercaDelFinal();
      const visible =
        typeof document === "undefined" ||
        document.visibilityState === "visible";

      this.fusionarMensaje(mensaje);

      if (!mensaje.esMio && visible) {
        this.programarMarcarLeido();
      }

      if (mensaje.esMio || cerca) {
        this.$nextTick(() => this.scrollAlFinal());
      }
    },
    alCambiarVisibilidad() {
      if (typeof document === "undefined") return;
      if (document.visibilityState !== "visible") return;
      if (!this.chat) return;
      this.programarMarcarLeido();
    },
    refrescarTrasReconexion() {
      if (!mensajeState.conectado) return;
      this.cargarTodo();
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
    alternarEmoji() {
      if (this.emojiAbierto) {
        this.cerrarEmoji();
        return;
      }

      const input = this.$refs.input;
      const largo = String(this.borrador || "").length;
      this.seleccionInicio = input?.selectionStart ?? largo;
      this.seleccionFin = input?.selectionEnd ?? this.seleccionInicio;
      this.emojiAbierto = true;
      this.$nextTick(() => this.$refs.emojiPicker?.enfocarBusqueda());
    },
    cerrarEmoji() {
      this.emojiAbierto = false;
      this.$nextTick(() => {
        const input = this.$refs.input;
        if (!input) return;
        const posicion = this.seleccionInicio ?? input.value.length;
        input.focus();
        input.setSelectionRange(posicion, posicion);
      });
    },
    insertarEmoji(emoji) {
      if (!emoji) return;

      const valor = String(this.borrador || "");
      const inicio = this.seleccionInicio ?? valor.length;
      const fin = this.seleccionFin ?? inicio;
      const nuevo = `${valor.slice(0, inicio)}${emoji}${valor.slice(fin)}`;
      const posicion = inicio + emoji.length;

      this.seleccionInicio = posicion;
      this.seleccionFin = posicion;
      this.borrador = nuevo;

      this.$nextTick(() => {
        const input = this.$refs.input;
        if (!input) return;
        input.focus();
        input.setSelectionRange(posicion, posicion);
      });
    },
    mostrarError(mensaje) {
      this.toast.init({
        title: "Chat del proyecto",
        message: mensaje,
        color: "danger",
        position: "top-right",
        duration: 5000,
      });
    },
  },
};
</script>

<style scoped>
.chat-grupal {
  display: grid;
  grid-template-columns: 340px minmax(0, 1fr);
  gap: 1rem;
  align-items: start;
}

.chat-grupal__chat {
  display: flex;
  min-width: 0;
  height: 720px;
  flex-direction: column;
  overflow: hidden;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.chat-grupal__cabecera {
  display: flex;
  flex: none;
  align-items: center;
  gap: 0.65rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--color-border-soft);
}

.chat-grupal__icono {
  color: var(--color-primary);
  font-size: 1.3rem;
}

.chat-grupal__titulo {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 0.1rem;
}

.chat-grupal__titulo strong {
  font-size: 1rem;
}

.chat-grupal__titulo span {
  overflow: hidden;
  color: var(--color-text-muted);
  font-size: 0.74rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-grupal__avatares {
  display: flex;
  align-items: center;
  margin-left: auto;
  padding-left: 0.5rem;
}

.chat-grupal__avatar-item {
  display: inline-flex;
  margin-left: -8px;
  border: 2px solid var(--color-surface);
  border-radius: 50%;
}

.chat-grupal__avatar-item:first-child {
  margin-left: 0;
}

.chat-grupal__restantes {
  margin-left: 0.25rem;
  color: var(--color-text-muted);
  font-size: 0.7rem;
  font-weight: 700;
}

.chat-grupal__mensajes {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
  padding: 1.1rem 1.25rem;
  background: var(--color-surface-soft);
}

.chat-grupal__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 160px;
  padding: 1rem;
  color: var(--color-text-muted);
  font-size: 0.82rem;
  text-align: center;
}

.chat-grupal__estado--error {
  color: var(--color-danger-text);
}

.chat-grupal__reintentar,
.chat-grupal__anteriores {
  padding: 0.4rem 0.8rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 0.75rem;
  cursor: pointer;
}

.chat-grupal__anteriores {
  align-self: center;
  margin-bottom: 0.5rem;
  border-radius: 999px;
  color: var(--color-text-muted);
}

.chat-grupal__anteriores:disabled {
  cursor: wait;
  opacity: 0.6;
}

.chat-grupal__error-inline {
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

.chat-grupal__dia {
  align-self: center;
  margin: 0.6rem 0 0.35rem;
  padding: 0.2rem 0.75rem;
  border: 1px solid var(--color-border-soft);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-size: 0.7rem;
  font-weight: 700;
}

.chat-grupal__vacio {
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

.chat-grupal__vacio .material-symbols-outlined {
  font-size: 2rem;
}

.chat-grupal__error-envio {
  margin: 0 1.25rem 0.5rem;
  padding: 0.6rem 0.8rem;
  border-radius: 8px;
  background: var(--color-danger-soft);
  color: var(--color-danger-text);
  font-size: 0.78rem;
  font-weight: 600;
}

.chat-grupal__compositor {
  position: relative;
  display: flex;
  flex: none;
  align-items: center;
  gap: 0.6rem;
  padding: 0.85rem 1rem;
  border-top: 1px solid var(--color-border-soft);
}

.chat-grupal__emoji {
  display: inline-flex;
  width: 38px;
  height: 38px;
  flex: none;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  background: transparent;
  font-size: 1.3rem;
  cursor: pointer;
}

.chat-grupal__emoji:hover,
.chat-grupal__emoji--activo {
  background: var(--color-surface-muted);
}

.chat-grupal__input {
  flex: 1;
  min-width: 0;
  height: 42px;
  padding: 0 0.9rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  font-size: 0.86rem;
  outline: 0;
}

.chat-grupal__input:focus {
  border-color: var(--color-primary);
}

.chat-grupal__enviar {
  flex: none;
  height: 42px;
  padding: 0 1rem;
  border: 0;
  border-radius: 10px;
  background: var(--color-primary-fill);
  color: var(--color-on-primary);
  font-weight: 700;
  cursor: pointer;
}

.chat-grupal__enviar:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.chat-grupal__solo-lectura {
  flex: none;
  padding: 0.85rem 1rem;
  border-top: 1px solid var(--color-border-soft);
  background: var(--color-warning-soft);
  color: var(--color-warning-text);
  font-size: 0.8rem;
  font-weight: 600;
  text-align: center;
}

@media (max-width: 1000px) {
  .chat-grupal {
    grid-template-columns: 1fr;
  }

  .chat-grupal__chat {
    height: 600px;
  }
}

@media (max-width: 900px) {
  .chat-grupal__cabecera {
    padding: 0.85rem;
  }

  .chat-grupal__mensajes {
    padding: 0.9rem 0.75rem;
  }

  .chat-grupal__compositor {
    padding: 0.7rem 0.75rem;
  }
}
</style>
