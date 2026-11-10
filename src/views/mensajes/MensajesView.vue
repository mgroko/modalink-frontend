<template>
  <div class="mensajes">
    <h1 class="mensajes__titulo">Mensajes</h1>

    <section
      class="mensajes__card"
      :class="{ 'mensajes__card--chat': chatAbiertoMobile }"
    >
      <aside class="mensajes__lista">
        <div class="mensajes__tabs" role="tablist" aria-label="Mensajes">
          <button
            type="button"
            class="mensajes__tab"
            :class="{ 'mensajes__tab--activa': tab === 'recientes' }"
            role="tab"
            :aria-selected="tab === 'recientes'"
            @click="cambiarTab('recientes')"
          >
            Chats recientes
          </button>
          <button
            type="button"
            class="mensajes__tab"
            :class="{ 'mensajes__tab--activa': tab === 'contactos' }"
            role="tab"
            :aria-selected="tab === 'contactos'"
            @click="cambiarTab('contactos')"
          >
            Contactos
          </button>
        </div>

        <div class="mensajes__buscador">
          <span class="material-symbols-outlined" aria-hidden="true">search</span>
          <input
            v-if="tab === 'recientes'"
            v-model="busqueda"
            type="search"
            placeholder="Buscar por nombre, profesión o mensaje"
            aria-label="Buscar conversaciones"
          />
          <input
            v-else
            v-model="busquedaContactos"
            type="search"
            placeholder="Buscar por nombre o profesión"
            aria-label="Buscar contactos"
          />
        </div>

        <div v-if="tab === 'recientes'" class="mensajes__filtros">
          <button
            v-for="opcion in filtrosConversaciones"
            :key="opcion.value"
            type="button"
            class="mensajes__filtro"
            :class="{ 'mensajes__filtro--activo': filtro === opcion.value }"
            @click="filtro = opcion.value"
          >
            {{ opcion.label }}
          </button>
        </div>

        <div v-else class="mensajes__filtros">
          <button
            type="button"
            class="mensajes__filtro"
            :class="{ 'mensajes__filtro--activo': filtroContactos === 'todos' }"
            @click="filtroContactos = 'todos'"
          >
            Todos
          </button>
          <button
            type="button"
            class="mensajes__filtro"
            :class="{ 'mensajes__filtro--activo': filtroContactos === 'en-linea' }"
            @click="filtroContactos = 'en-linea'"
          >
            En línea
          </button>
        </div>

        <div class="mensajes__scroll">
          <template v-if="tab === 'recientes'">
            <div v-if="cargandoConversaciones" class="mensajes__estado">
              <span class="material-symbols-outlined" aria-hidden="true">
                hourglass_empty
              </span>
              Cargando conversaciones...
            </div>

            <div v-else-if="errorConversaciones" class="mensajes__estado">
              <BaseAlert :message="errorConversaciones" type="error" />
              <button
                type="button"
                class="mensajes__reintentar"
                @click="cargarConversaciones(0)"
              >
                Reintentar
              </button>
            </div>

            <div
              v-else-if="!conversacionesFiltradas.length"
              class="mensajes__vacio"
            >
              <span class="material-symbols-outlined" aria-hidden="true">
                forum
              </span>
              <p v-if="busqueda || filtro !== 'todos'">
                No hay conversaciones que coincidan con la búsqueda.
              </p>
              <p v-else>
                Todavía no tenés conversaciones. Iniciá una desde la pestaña
                Contactos.
              </p>
            </div>

            <template v-else>
              <ConversacionItem
                v-for="conversacion in conversacionesFiltradas"
                :key="conversacion.idConversacion"
                :conversacion="conversacion"
                :activa="
                  conversacionActiva &&
                  String(conversacionActiva.idConversacion) ===
                    String(conversacion.idConversacion)
                "
                :en-linea="estaEnLinea(conversacion)"
                :escribiendo="estaEscribiendo(conversacion)"
                @seleccionar="seleccionarConversacion"
              />

              <button
                v-if="!paginacionConversaciones.ultima"
                type="button"
                class="mensajes__mas"
                :disabled="cargandoConversaciones"
                @click="cargarMasConversaciones"
              >
                Cargar más conversaciones
              </button>
            </template>
          </template>

          <template v-else>
            <div v-if="cargandoContactos" class="mensajes__estado">
              <span class="material-symbols-outlined" aria-hidden="true">
                hourglass_empty
              </span>
              Cargando contactos...
            </div>

            <div v-else-if="errorContactos" class="mensajes__estado">
              <BaseAlert :message="errorContactos" type="error" />
              <button
                type="button"
                class="mensajes__reintentar"
                @click="cargarContactos(0)"
              >
                Reintentar
              </button>
            </div>

            <div v-else-if="!contactosAgrupados.length" class="mensajes__vacio">
              <span class="material-symbols-outlined" aria-hidden="true">
                group_off
              </span>
              <p v-if="busquedaContactos || filtroContactos !== 'todos'">
                No hay contactos que coincidan con la búsqueda.
              </p>
              <p v-else>
                Todavía no tenés contactos. Agregá conexiones desde Mi red.
              </p>
            </div>

            <template v-else>
              <div
                v-for="grupo in contactosAgrupados"
                :key="grupo.profesion"
                class="mensajes__grupo"
              >
                <div class="mensajes__grupo-titulo">
                  {{ grupo.profesion }} · {{ grupo.contactos.length }}
                </div>

                <button
                  v-for="contacto in grupo.contactos"
                  :key="contacto.idConexion || contacto.perfil?.idPerfil"
                  type="button"
                  class="mensajes__contacto"
                  @click="seleccionarContacto(contacto)"
                >
                  <AvatarPresencia
                    :nombre="nombreDePerfil(contacto.perfil)"
                    :foto-url="contacto.perfil?.fotoUrl || ''"
                    :en-linea="estaEnLinea(contacto)"
                    :tamano="42"
                  />
                  <span class="mensajes__contacto-info">
                    <strong>{{ nombreDePerfil(contacto.perfil) }}</strong>
                    <span>{{ contacto.perfil?.nombreProfesion || "Profesión" }}</span>
                  </span>
                </button>
              </div>

              <button
                v-if="!paginacionContactos.ultima"
                type="button"
                class="mensajes__mas"
                :disabled="cargandoContactos"
                @click="cargarMasContactos"
              >
                Cargar más contactos
              </button>
            </template>
          </template>
        </div>
      </aside>

      <ChatConversacion
        ref="chat"
        class="mensajes__chat"
        :conversacion="conversacionActiva"
        :mensajes="mensajes"
        :cargando="cargandoMensajes"
        :error="errorMensajes"
        :cargando-anteriores="cargandoAnteriores"
        :paginacion="paginacionMensajes"
        :enviando="enviando"
        :error-envio="errorEnvio"
        :id-perfil-activo="idActivo"
        :en-linea="conversacionActiva ? estaEnLinea(conversacionActiva) : false"
        :borrador="borrador"
        :escribiendo="escribiendoActiva"
        @volver="volverALista"
        @update:borrador="alCambiarBorrador"
        @enviar="enviarMensaje"
        @cargar-anteriores="cargarMensajesAnteriores"
        @reintentar="reintentarMensajes"
      />
    </section>
  </div>
</template>

<script>
import BaseAlert from "../../components/AlertaBase.vue";
import AvatarPresencia from "../../components/conexion/AvatarPresencia.vue";
import ConversacionItem from "../../components/mensajes/ConversacionItem.vue";
import ChatConversacion from "../../components/mensajes/ChatConversacion.vue";
import mensajeService from "../../services/mensajeService";
import conexionService from "../../services/conexionService";
import perfilService from "../../services/perfilService";
import {
  state as mensajeState,
  cargarResumen,
  refrescarResumenNotificaciones,
} from "../../services/mensajeState";
import {
  enLineaDe,
  desuscribirPerfiles,
  reconciliarSuscripciones,
} from "../../services/presenciaState";
import { idPerfilActivo } from "../../services/authState";
import { construirParamsConexiones } from "../../utils/parametrosConexiones.js";
import { fechaHoraLocalIso } from "../../utils/fechas.js";
import {
  FILTROS_CONVERSACIONES,
  ESCRIBIENDO_IDLE_MS,
  ESCRIBIENDO_REPETIR_MS,
  ESCRIBIENDO_TTL_MS,
  LARGO_MAXIMO_MENSAJE,
  TAMANO_CONVERSACIONES,
  TAMANO_CONTACTOS,
  TAMANO_MENSAJES,
  esErrorConexionNoPermitida,
  esErrorConversacionNoEncontrada,
  esErrorMensajeNoPermitido,
  mensajeErrorMensajeria,
} from "../../utils/mensajeConstants.js";
import { useToast } from "vuestic-ui";

const DEBOUNCE_BUSQUEDA_MS = 350;
const DEBOUNCE_LECTURA_MS = 250;

function paginacionInicial(tamano) {
  return {
    paginaActual: 0,
    tamanoPagina: tamano,
    totalElementos: 0,
    totalPaginas: 0,
    primera: true,
    ultima: true,
  };
}

function normalizarPagina(data, tamano) {
  return {
    paginaActual: data?.paginaActual ?? 0,
    tamanoPagina: data?.tamanoPagina ?? tamano,
    totalElementos: data?.totalElementos ?? 0,
    totalPaginas: data?.totalPaginas ?? 0,
    primera: data?.primera ?? true,
    ultima: data?.ultima ?? true,
  };
}

export default {
  name: "MensajesView",
  components: {
    BaseAlert,
    AvatarPresencia,
    ConversacionItem,
    ChatConversacion,
  },
  setup() {
    return { toast: useToast() };
  },
  data() {
    return {
      tab: "recientes",
      busqueda: "",
      filtro: "todos",
      filtrosConversaciones: FILTROS_CONVERSACIONES,
      conversaciones: [],
      paginacionConversaciones: paginacionInicial(TAMANO_CONVERSACIONES),
      cargandoConversaciones: true,
      errorConversaciones: "",
      contactos: [],
      paginacionContactos: paginacionInicial(TAMANO_CONTACTOS),
      cargandoContactos: false,
      errorContactos: "",
      busquedaContactos: "",
      filtroContactos: "todos",
      conversacionActiva: null,
      mensajes: [],
      paginacionMensajes: paginacionInicial(TAMANO_MENSAJES),
      cargandoMensajes: false,
      errorMensajes: "",
      cargandoAnteriores: false,
      enviando: false,
      errorEnvio: "",
      borrador: "",
      chatAbiertoMobile: false,
      idsPresencia: [],
      controladorConversaciones: null,
      controladorContactos: null,
      controladorMensajes: null,
      idCargaConversaciones: 0,
      idCargaContactos: 0,
      idCargaMensajes: 0,
      debounceBusquedaContactos: null,
      marcarLeidoTimer: null,
      refrescoResumenTimer: null,
      ultimoHastaLeido: null,
      creandoConversacion: false,
      yaCargado: false,
      huboDesconexion: false,
      cargandoConversacionPorId: false,
      escribiendoPorConversacion: {},
      timersEscribiendo: {},
      escribiendoEnviado: null,
      ultimoEnvioEscribiendo: 0,
      timerDetenerEscribiendo: null,
    };
  },
  computed: {
    idActivo() {
      return idPerfilActivo();
    },
    eventoSeqMensajeria() {
      return mensajeState.eventoSeq;
    },
    conectadoMensajeria() {
      return mensajeState.conectado;
    },
    conversacionesFiltradas() {
      const texto = this.busqueda.trim().toLowerCase();

      return this.conversaciones.filter((conversacion) => {
        if (
          this.filtro === "no-leidos" &&
          conversacion.tieneNoLeidos !== true
        ) {
          return false;
        }
        if (this.filtro === "en-linea" && !this.estaEnLinea(conversacion)) {
          return false;
        }
        if (!texto) return true;

        const perfil = conversacion.perfil || {};
        const contenido = [
          perfil.nombreArtistico,
          perfil.nombre,
          perfil.apellido,
          perfil.nombreProfesion,
          conversacion.ultimoMensaje,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return contenido.includes(texto);
      });
    },
    escribiendoActiva() {
      const id = this.conversacionActiva?.idConversacion;
      if (id == null) return false;
      return this.escribiendoPorConversacion[String(id)] === true;
    },
    contactosAgrupados() {
      const grupos = {};

      this.contactos.forEach((contacto) => {
        const profesion =
          contacto.perfil?.nombreProfesion || "Sin profesión";
        if (!grupos[profesion]) grupos[profesion] = [];
        grupos[profesion].push(contacto);
      });

      return Object.keys(grupos)
        .sort((a, b) => a.localeCompare(b, "es"))
        .map((profesion) => ({
          profesion,
          contactos: grupos[profesion],
        }));
    },
  },
  watch: {
    "$route.query.perfil"(nuevo) {
      const id = Number(nuevo);
      if (Number.isFinite(id) && id > 0) this.abrirConversacionConPerfil(id);
    },
    "$route.query.conversacion"(nuevo) {
      if (nuevo == null || nuevo === "") return;
      this.abrirConversacionPorId(nuevo);
    },
    busquedaContactos() {
      clearTimeout(this.debounceBusquedaContactos);
      this.debounceBusquedaContactos = setTimeout(() => {
        this.cargarContactos(0);
      }, DEBOUNCE_BUSQUEDA_MS);
    },
    filtroContactos() {
      this.cargarContactos(0);
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
  },
  mounted() {
    this.cargarConversaciones(0);

    const idConversacion = Number(this.$route.query.conversacion);
    const idPerfil = Number(this.$route.query.perfil);

    if (Number.isFinite(idConversacion) && idConversacion > 0) {
      this.abrirConversacionPorId(idConversacion);
    } else if (Number.isFinite(idPerfil) && idPerfil > 0) {
      this.abrirConversacionConPerfil(idPerfil);
    }

    this.huboDesconexion = !mensajeState.conectado;
    this.yaCargado = true;
    document.addEventListener("visibilitychange", this.alCambiarVisibilidad);
  },
  beforeUnmount() {
    this.abortarConversaciones();
    this.abortarContactos();
    this.abortarMensajes();
    clearTimeout(this.debounceBusquedaContactos);
    clearTimeout(this.marcarLeidoTimer);
    clearTimeout(this.refrescoResumenTimer);
    this.detenerEscribiendo();
    this.limpiarTimersEscribiendo();
    document.removeEventListener("visibilitychange", this.alCambiarVisibilidad);
    this.desuscribirPresencia();
  },
  methods: {
    nombreDePerfil(perfil) {
      return (
        perfil?.nombreArtistico ||
        [perfil?.nombre, perfil?.apellido].filter(Boolean).join(" ") ||
        "Perfil"
      );
    },
    estaEnLinea(conversacion) {
      const perfil = conversacion?.perfil || conversacion || {};
      return enLineaDe(
        perfil.idPerfil,
        conversacion?.enLinea === true || perfil.enLinea === true
      );
    },
    cambiarTab(tab) {
      if (tab === this.tab) return;
      this.tab = tab;
      if (tab === "contactos" && !this.contactos.length && !this.cargandoContactos) {
        this.cargarContactos(0);
      }
    },
    abortarConversaciones() {
      if (this.controladorConversaciones) {
        this.controladorConversaciones.abort();
        this.controladorConversaciones = null;
      }
    },
    abortarContactos() {
      if (this.controladorContactos) {
        this.controladorContactos.abort();
        this.controladorContactos = null;
      }
    },
    abortarMensajes() {
      if (this.controladorMensajes) {
        this.controladorMensajes.abort();
        this.controladorMensajes = null;
      }
    },
    normalizarConversacion(conversacion) {
      return {
        idConversacion: conversacion?.idConversacion,
        perfil: conversacion?.perfil || {},
        fechaCreacion: conversacion?.fechaCreacion || null,
        fechaUltimoMensaje: conversacion?.fechaUltimoMensaje || null,
        ultimoMensaje: conversacion?.ultimoMensaje || "",
        tieneNoLeidos: conversacion?.tieneNoLeidos === true,
        puedeEnviar: conversacion?.puedeEnviar !== false,
      };
    },
    normalizarMensaje(mensaje) {
      const idActivo = this.idActivo;
      const esMio =
        mensaje?.esMio === true ||
        (mensaje?.esMio == null &&
          idActivo != null &&
          String(mensaje?.idPerfilEmisor) === String(idActivo));

      return {
        idMensaje: mensaje?.idMensaje,
        idConversacion: mensaje?.idConversacion,
        contenido: mensaje?.contenido || "",
        fechaEnvio: mensaje?.fechaEnvio || "",
        idPerfilEmisor: mensaje?.idPerfilEmisor,
        perfilEmisor: mensaje?.perfilEmisor || {},
        esMio,
        leido: mensaje?.leido === true,
        fechaLectura: mensaje?.fechaLectura || null,
      };
    },
    fusionarConversaciones(previas, nuevas) {
      const mapa = new Map();
      [...previas, ...nuevas].forEach((conversacion) => {
        if (conversacion?.idConversacion == null) return;
        mapa.set(String(conversacion.idConversacion), conversacion);
      });
      return [...mapa.values()];
    },
    async cargarConversaciones(pagina = 0) {
      this.abortarConversaciones();

      const controlador = new AbortController();
      this.controladorConversaciones = controlador;
      const corrida = ++this.idCargaConversaciones;
      this.cargandoConversaciones = true;
      this.errorConversaciones = "";

      try {
        const response = await mensajeService.listarConversaciones({
          page: pagina,
          size: TAMANO_CONVERSACIONES,
          signal: controlador.signal,
        });

        if (corrida !== this.idCargaConversaciones) return;

        const data = response?.data || {};
        const contenido = Array.isArray(data.contenido)
          ? data.contenido.map((item) => this.normalizarConversacion(item))
          : [];

        this.conversaciones =
          pagina === 0
            ? contenido
            : this.fusionarConversaciones(this.conversaciones, contenido);

        this.asegurarConversacionActivaEnLista();
        this.paginacionConversaciones = normalizarPagina(
          data,
          TAMANO_CONVERSACIONES
        );
        this.sincronizarConversacionActiva();
        this.actualizarSuscripcionPresencia();
      } catch (error) {
        if (
          corrida !== this.idCargaConversaciones ||
          error?.name === "CanceledError" ||
          error?.code === "ERR_CANCELED"
        ) {
          return;
        }
        if (pagina === 0) this.conversaciones = [];
        const mensaje = mensajeErrorMensajeria(
          error,
          "No se pudieron cargar las conversaciones."
        );
        if (pagina === 0) {
          this.errorConversaciones = mensaje;
        } else {
          this.mostrarError(mensaje);
        }
      } finally {
        if (corrida === this.idCargaConversaciones) {
          this.cargandoConversaciones = false;
          this.controladorConversaciones = null;
        }
      }
    },
    cargarMasConversaciones() {
      if (this.cargandoConversaciones || this.paginacionConversaciones.ultima) {
        return;
      }
      this.cargarConversaciones(
        this.paginacionConversaciones.paginaActual + 1
      );
    },
    async cargarContactos(pagina = 0) {
      this.abortarContactos();

      const controlador = new AbortController();
      this.controladorContactos = controlador;
      const corrida = ++this.idCargaContactos;
      this.cargandoContactos = true;
      this.errorContactos = "";

      try {
        const params = construirParamsConexiones({
          texto: this.busquedaContactos,
          estadoPresencia:
            this.filtroContactos === "en-linea" ? "EN_LINEA" : "",
          pagina,
          tamano: TAMANO_CONTACTOS,
        });

        const response = await conexionService.listar(
          params,
          controlador.signal
        );

        if (corrida !== this.idCargaContactos) return;

        const data = response?.data || {};
        const contenido = Array.isArray(data.contenido) ? data.contenido : [];

        if (pagina === 0) {
          this.contactos = contenido;
        } else {
          const existentes = new Set(
            this.contactos.map((item) => String(item.idConexion))
          );
          this.contactos = [
            ...this.contactos,
            ...contenido.filter(
              (item) => !existentes.has(String(item.idConexion))
            ),
          ];
        }

        this.paginacionContactos = normalizarPagina(data, TAMANO_CONTACTOS);
        this.actualizarSuscripcionPresencia();
      } catch (error) {
        if (
          corrida !== this.idCargaContactos ||
          error?.name === "CanceledError" ||
          error?.code === "ERR_CANCELED"
        ) {
          return;
        }
        if (pagina === 0) this.contactos = [];
        const mensaje = mensajeErrorMensajeria(
          error,
          "No se pudieron cargar los contactos."
        );
        if (pagina === 0) {
          this.errorContactos = mensaje;
        } else {
          this.mostrarError(mensaje);
        }
      } finally {
        if (corrida === this.idCargaContactos) {
          this.cargandoContactos = false;
          this.controladorContactos = null;
        }
      }
    },
    cargarMasContactos() {
      if (this.cargandoContactos || this.paginacionContactos.ultima) return;
      this.cargarContactos(this.paginacionContactos.paginaActual + 1);
    },
    actualizarSuscripcionPresencia() {
      const ids = [
        ...this.conversaciones.map((item) => item.perfil?.idPerfil),
        ...this.contactos.map((item) => item.perfil?.idPerfil),
        this.conversacionActiva?.perfil?.idPerfil,
      ].filter((id) => id != null);

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
    sincronizarConversacionActiva() {
      if (!this.conversacionActiva) return;
      const actual = this.conversaciones.find(
        (conversacion) =>
          String(conversacion.idConversacion) ===
          String(this.conversacionActiva.idConversacion)
      );
      if (actual) this.conversacionActiva = actual;
    },
    asegurarConversacionActivaEnLista() {
      const activa = this.conversacionActiva;
      if (!activa?.idConversacion) return;
      const esta = this.conversaciones.some(
        (conversacion) =>
          String(conversacion.idConversacion) ===
          String(activa.idConversacion)
      );
      if (!esta) this.conversaciones.unshift(activa);
    },
    seleccionarConversacion(conversacion) {
      if (!conversacion) return;

      this.detenerEscribiendo();

      this.conversacionActiva = conversacion;
      this.chatAbiertoMobile = true;
      this.borrador = "";
      this.errorEnvio = "";
      this.errorMensajes = "";
      this.mensajes = [];
      this.paginacionMensajes = paginacionInicial(TAMANO_MENSAJES);
      this.ultimoHastaLeido = null;
      clearTimeout(this.marcarLeidoTimer);

      this.actualizarSuscripcionPresencia();
      this.cargarMensajes(0);
      this.sincronizarQueryConversacion(conversacion);
      this.$nextTick(() => this.$refs.chat?.enfocarInput());
    },
    volverALista() {
      this.detenerEscribiendo();
      this.chatAbiertoMobile = false;
      this.limpiarQueryConversacion();
    },
    sincronizarQueryConversacion(conversacion = this.conversacionActiva) {
      const id = conversacion?.idConversacion;
      if (id == null || !this.$route || !this.$router) return;

      const queryActual = this.$route.query || {};
      if (
        String(queryActual.conversacion) === String(id) &&
        queryActual.perfil == null
      ) {
        return;
      }

      const query = { ...queryActual, conversacion: String(id) };
      delete query.perfil;
      this.$router.replace({ name: "mensajes", query }).catch(() => {});
    },
    limpiarQueryConversacion() {
      if (!this.$route || !this.$router) return;

      const query = { ...(this.$route.query || {}) };
      if (query.conversacion == null && query.perfil == null) return;
      delete query.conversacion;
      delete query.perfil;
      this.$router.replace({ name: "mensajes", query }).catch(() => {});
    },
    async abrirConversacionPorId(idConversacion) {
      const id = Number(idConversacion);
      if (!Number.isFinite(id) || id <= 0) return;
      if (
        String(this.conversacionActiva?.idConversacion) === String(id)
      ) {
        return;
      }

      const existente = this.conversaciones.find(
        (conversacion) =>
          String(conversacion.idConversacion) === String(id)
      );
      if (existente) {
        this.tab = "recientes";
        this.seleccionarConversacion(existente);
        return;
      }

      if (this.cargandoConversacionPorId) return;
      this.cargandoConversacionPorId = true;

      try {
        const response = await mensajeService.obtenerConversacion(id);
        const conversacion = this.normalizarConversacion(response?.data || {});
        if (!conversacion.idConversacion) {
          throw new Error("Conversación inválida");
        }

        const yaEsta = this.conversaciones.some(
          (item) =>
            String(item.idConversacion) ===
            String(conversacion.idConversacion)
        );
        if (!yaEsta) this.conversaciones.unshift(conversacion);

        this.tab = "recientes";
        this.seleccionarConversacion(conversacion);
      } catch (error) {
        this.mostrarError(
          mensajeErrorMensajeria(
            error,
            "No se pudo abrir la conversación."
          )
        );
        this.limpiarQueryConversacion();
      } finally {
        this.cargandoConversacionPorId = false;
      }
    },
    estaEscribiendo(conversacion) {
      const id = conversacion?.idConversacion;
      if (id == null) return false;
      return this.escribiendoPorConversacion[String(id)] === true;
    },
    async cargarMensajes(pagina = 0) {
      const conversacion = this.conversacionActiva;
      if (!conversacion?.idConversacion) return;

      this.abortarMensajes();

      const controlador = new AbortController();
      this.controladorMensajes = controlador;
      const corrida = ++this.idCargaMensajes;
      const previo =
        pagina > 0 ? this.$refs.chat?.capturarScroll() || null : null;

      if (pagina === 0) {
        this.cargandoMensajes = true;
        this.errorMensajes = "";
      } else {
        this.cargandoAnteriores = true;
      }

      try {
        const response = await mensajeService.listarMensajes(
          conversacion.idConversacion,
          {
            page: pagina,
            size: TAMANO_MENSAJES,
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
            this.mensajes.map((mensaje) => String(mensaje.idMensaje))
          );
          const nuevos = paginaCronologica.filter(
            (mensaje) => !existentes.has(String(mensaje.idMensaje))
          );
          this.mensajes = [...nuevos, ...this.mensajes];
          this.ordenarMensajes();
        }

        this.paginacionMensajes = normalizarPagina(data, TAMANO_MENSAJES);

        if (pagina === 0) {
          this.$nextTick(() => this.$refs.chat?.scrollAlFinal());
          if (this.debeMarcarLeido()) {
            this.programarMarcarLeido(this.hastaIdMensajeVisible());
          }
        } else {
          this.$refs.chat?.restaurarScroll(previo);
        }
      } catch (error) {
        if (
          corrida !== this.idCargaMensajes ||
          error?.name === "CanceledError" ||
          error?.code === "ERR_CANCELED"
        ) {
          return;
        }
        this.errorMensajes = mensajeErrorMensajeria(
          error,
          "No se pudo cargar el historial."
        );
        if (pagina > 0) {
          this.errorMensajes = "";
          this.mostrarError(
            mensajeErrorMensajeria(
              error,
              "No se pudieron cargar los mensajes anteriores."
            )
          );
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
      if (
        this.cargandoAnteriores ||
        this.paginacionMensajes.ultima ||
        !this.conversacionActiva
      ) {
        return;
      }
      this.cargarMensajes(this.paginacionMensajes.paginaActual + 1);
    },
    reintentarMensajes() {
      if (this.conversacionActiva) this.cargarMensajes(0);
    },
    ordenarMensajes() {
      this.mensajes.sort((a, b) => {
        const fechaA = String(a.fechaEnvio || "");
        const fechaB = String(b.fechaEnvio || "");
        if (fechaA !== fechaB) return fechaA.localeCompare(fechaB);
        const idA = Number(a.idMensaje);
        const idB = Number(b.idMensaje);
        if (Number.isFinite(idA) && Number.isFinite(idB)) return idA - idB;
        return 0;
      });
    },
    fusionarMensaje(mensaje) {
      if (mensaje?.idMensaje == null) return;

      const indice = this.mensajes.findIndex(
        (item) => String(item.idMensaje) === String(mensaje.idMensaje)
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
    hastaIdMensajeVisible() {
      const ids = this.mensajes
        .map((mensaje) => Number(mensaje.idMensaje))
        .filter((id) => Number.isFinite(id));
      return ids.length ? Math.max(...ids) : null;
    },
    debeMarcarLeido() {
      if (this.conversacionActiva?.tieneNoLeidos === true) return true;
      return this.mensajes.some(
        (mensaje) => !mensaje.esMio && mensaje.leido !== true
      );
    },
    programarMarcarLeido(hastaIdMensaje) {
      if (hastaIdMensaje == null || hastaIdMensaje === "") return;
      const hasta = Number(hastaIdMensaje);
      if (!Number.isFinite(hasta)) return;

      this.ultimoHastaLeido = Math.max(this.ultimoHastaLeido || 0, hasta);
      clearTimeout(this.marcarLeidoTimer);
      this.marcarLeidoTimer = setTimeout(() => {
        const valor = this.ultimoHastaLeido;
        this.ultimoHastaLeido = null;
        this.marcarLeido(valor);
      }, DEBOUNCE_LECTURA_MS);
    },
    async marcarLeido(hastaIdMensaje) {
      const conversacion = this.conversacionActiva;
      if (!conversacion?.idConversacion || hastaIdMensaje == null) return;

      try {
        await mensajeService.marcarLeido(
          conversacion.idConversacion,
          hastaIdMensaje
        );

        const sigueActiva =
          this.conversacionActiva &&
          String(this.conversacionActiva.idConversacion) ===
            String(conversacion.idConversacion);

        const quedanNoLeidos =
          sigueActiva &&
          this.mensajes.some(
            (mensaje) =>
              !mensaje.esMio &&
              mensaje.leido !== true &&
              Number(mensaje.idMensaje) > Number(hastaIdMensaje)
          );

        if (sigueActiva) {
          if (!quedanNoLeidos) conversacion.tieneNoLeidos = false;
          this.mensajes.forEach((mensaje) => {
            if (
              !mensaje.esMio &&
              Number(mensaje.idMensaje) <= Number(hastaIdMensaje)
            ) {
              mensaje.leido = true;
            }
          });
        }

        const enLista = this.conversaciones.find(
          (item) =>
            String(item.idConversacion) ===
            String(conversacion.idConversacion)
        );
        if (enLista && sigueActiva && !quedanNoLeidos) {
          enLista.tieneNoLeidos = false;
        }

        cargarResumen();
        refrescarResumenNotificaciones();
        clearTimeout(this.refrescoResumenTimer);
        this.refrescoResumenTimer = setTimeout(() => {
          cargarResumen();
          refrescarResumenNotificaciones();
        }, 800);
      } catch {
        // Best-effort: el próximo mensaje o la próxima apertura lo reintenta.
      }
    },
    alCambiarBorrador(valor) {
      this.borrador = valor;

      const conversacion = this.conversacionActiva;
      if (!conversacion?.idConversacion || conversacion.puedeEnviar === false) {
        this.detenerEscribiendo();
        return;
      }

      if (!String(valor || "").trim()) {
        this.detenerEscribiendo();
        return;
      }

      const id = conversacion.idConversacion;
      const ahora = Date.now();

      if (
        String(this.escribiendoEnviado) !== String(id) ||
        ahora - this.ultimoEnvioEscribiendo >= ESCRIBIENDO_REPETIR_MS
      ) {
        this.emitirEscribiendo(id, true);
        this.escribiendoEnviado = String(id);
        this.ultimoEnvioEscribiendo = ahora;
      }

      clearTimeout(this.timerDetenerEscribiendo);
      this.timerDetenerEscribiendo = setTimeout(() => {
        this.timerDetenerEscribiendo = null;
        this.detenerEscribiendo();
      }, ESCRIBIENDO_IDLE_MS);
    },
    emitirEscribiendo(idConversacion, escribiendo) {
      mensajeService
        .notificarEscribiendo(idConversacion, escribiendo)
        .catch(() => {
          // Efímero: si falla, el TTL del receptor limpia el indicador.
        });
    },
    detenerEscribiendo() {
      clearTimeout(this.timerDetenerEscribiendo);
      this.timerDetenerEscribiendo = null;

      if (this.escribiendoEnviado == null) return;

      const id = this.escribiendoEnviado;
      this.escribiendoEnviado = null;
      this.ultimoEnvioEscribiendo = 0;
      this.emitirEscribiendo(id, false);
    },
    limpiarTimersEscribiendo() {
      Object.values(this.timersEscribiendo).forEach((timer) =>
        clearTimeout(timer)
      );
      this.timersEscribiendo = {};
      this.escribiendoPorConversacion = {};
    },
    async abrirConversacionConPerfil(idPerfil) {
      const id = Number(idPerfil);
      if (!Number.isFinite(id) || id <= 0) return;

      if (String(id) === String(this.idActivo)) {
        this.mostrarError("No podés iniciar una conversación con tu propio perfil.");
        return;
      }

      if (this.creandoConversacion) return;
      this.creandoConversacion = true;

      try {
        const response = await mensajeService.crearOIniciar(id);
        const data = response?.data || {};
        let conversacion = this.normalizarConversacion(data);

        if (!conversacion.idConversacion) {
          await this.cargarConversaciones(0);
          conversacion = this.conversaciones.find(
            (item) => String(item.perfil?.idPerfil) === String(id)
          );
        } else {
          if (conversacion.perfil?.idPerfil == null) {
            const perfil = await this.obtenerPerfilFallback(id);
            conversacion.perfil = perfil || { idPerfil: id };
          }

          const existente = this.conversaciones.find(
            (item) =>
              String(item.idConversacion) ===
              String(conversacion.idConversacion)
          );
          if (existente) {
            conversacion = existente;
          } else {
            this.conversaciones.unshift(conversacion);
          }
        }

        if (!conversacion) {
          this.mostrarError("No se pudo abrir la conversación.");
          return;
        }

        this.tab = "recientes";
        this.seleccionarConversacion(conversacion);
      } catch (error) {
        this.mostrarError(
          mensajeErrorMensajeria(
            error,
            "No se pudo iniciar la conversación."
          )
        );
        if (esErrorConexionNoPermitida(error)) {
          this.limpiarQueryConversacion();
        }
      } finally {
        this.creandoConversacion = false;
      }
    },
    async obtenerPerfilFallback(idPerfil) {
      const contacto = this.contactos.find(
        (item) => String(item.perfil?.idPerfil) === String(idPerfil)
      );
      if (contacto?.perfil) return { ...contacto.perfil };

      try {
        const response = await perfilService.obtener(idPerfil);
        const perfil = response?.data || {};
        return {
          idPerfil: perfil.idPerfil ?? idPerfil,
          nombreArtistico: perfil.nombreArtistico || "",
          nombre: perfil.nombreUsuario || "",
          apellido: perfil.apellidoUsuario || "",
          idProfesion: perfil.idProfesion ?? null,
          nombreProfesion: perfil.profesion || null,
          fotoUrl: perfil.fotoUrl || null,
        };
      } catch {
        return null;
      }
    },
    seleccionarContacto(contacto) {
      const idPerfil = contacto?.perfil?.idPerfil;
      if (idPerfil == null) return;
      this.abrirConversacionConPerfil(idPerfil);
    },
    procesarEvento() {
      const evento = mensajeState.ultimoEvento;
      if (!evento) return;

      if (evento.tipo === "mensaje") {
        this.procesarMensajeEvento(evento.data);
      } else if (evento.tipo === "conversacion_leida") {
        this.procesarLecturaEvento(evento.data);
      } else if (evento.tipo === "escribiendo") {
        this.procesarEscribiendoEvento(evento.data);
      }
    },
    alCambiarVisibilidad() {
      if (typeof document === "undefined") return;
      if (document.visibilityState !== "visible") return;
      if (!this.conversacionActiva) return;
      if (!this.debeMarcarLeido()) return;
      this.programarMarcarLeido(this.hastaIdMensajeVisible());
    },
    procesarMensajeEvento(data) {
      const mensaje = this.normalizarMensaje(data?.mensaje || {});
      if (mensaje.idMensaje == null) return;

      const idConversacion = data?.idConversacion ?? mensaje.idConversacion;
      if (!mensaje.esMio) this.limpiarEscribiendo(idConversacion);
      const esActiva =
        this.conversacionActiva &&
        String(this.conversacionActiva.idConversacion) ===
          String(idConversacion);

      if (esActiva) {
        const cerca = this.$refs.chat?.estaCercaDelFinal() ?? true;
        const visible =
          typeof document === "undefined" ||
          document.visibilityState === "visible";

        this.fusionarMensaje(mensaje);
        this.actualizarPreviewConversacion(
          idConversacion,
          mensaje,
          !mensaje.esMio
        );

        if (!mensaje.esMio && visible) {
          this.programarMarcarLeido(mensaje.idMensaje);
        }

        if (mensaje.esMio || cerca) {
          this.$nextTick(() => this.$refs.chat?.scrollAlFinal());
        }
        return;
      }

      const actualizada = this.actualizarPreviewConversacion(
        idConversacion,
        mensaje,
        !mensaje.esMio
      );
      if (!actualizada) this.cargarConversaciones(0);
    },
    actualizarPreviewConversacion(idConversacion, mensaje, marcarNoLeido) {
      const conversacion = this.conversaciones.find(
        (item) =>
          String(item.idConversacion) === String(idConversacion)
      );
      if (!conversacion) return false;

      const fechaActual = String(
        conversacion.fechaUltimoMensaje || conversacion.fechaCreacion || ""
      );
      const fechaNueva = String(mensaje.fechaEnvio || "");
      const esMasNueva =
        !fechaActual || !fechaNueva || fechaNueva >= fechaActual;

      if (esMasNueva) {
        conversacion.ultimoMensaje = mensaje.contenido;
        conversacion.fechaUltimoMensaje = mensaje.fechaEnvio;
      }
      if (marcarNoLeido) conversacion.tieneNoLeidos = true;

      this.moverConversacionAlFrente(conversacion);
      return true;
    },
    moverConversacionAlFrente(conversacion) {
      const indice = this.conversaciones.findIndex(
        (item) =>
          String(item.idConversacion) === String(conversacion.idConversacion)
      );
      if (indice > 0) {
        this.conversaciones.splice(indice, 1);
        this.conversaciones.unshift(conversacion);
      }
    },
    procesarLecturaEvento(data) {
      if (!this.conversacionActiva) return;
      if (
        String(data?.idConversacion) !==
        String(this.conversacionActiva.idConversacion)
      ) {
        return;
      }
      if (String(data?.idPerfilOtro) !== String(this.idActivo)) return;

      const hasta = Number(data?.idUltimoMensajeLeido);
      if (!Number.isFinite(hasta)) return;

      this.mensajes.forEach((mensaje) => {
        if (mensaje.esMio && Number(mensaje.idMensaje) <= hasta) {
          mensaje.leido = true;
          mensaje.fechaLectura = data.fechaLectura || null;
        }
      });
    },
    procesarEscribiendoEvento(data) {
      const id = data?.idConversacion;
      if (id == null) return;
      if (String(data?.idPerfilEmisor) === String(this.idActivo)) return;

      const clave = String(id);
      clearTimeout(this.timersEscribiendo[clave]);

      if (data?.escribiendo === false) {
        delete this.timersEscribiendo[clave];
        delete this.escribiendoPorConversacion[clave];
        return;
      }

      this.escribiendoPorConversacion[clave] = true;
      this.timersEscribiendo[clave] = setTimeout(() => {
        delete this.timersEscribiendo[clave];
        delete this.escribiendoPorConversacion[clave];
      }, ESCRIBIENDO_TTL_MS);
    },
    limpiarEscribiendo(idConversacion) {
      const clave = String(idConversacion);
      clearTimeout(this.timersEscribiendo[clave]);
      delete this.timersEscribiendo[clave];
      delete this.escribiendoPorConversacion[clave];
    },
    refrescarTrasReconexion() {
      if (!mensajeState.conectado) return;
      this.cargarConversaciones(0);
      if (this.conversacionActiva) this.cargarMensajes(0);
    },
    async enviarMensaje(contenido) {
      const texto = String(contenido || "").trim();
      const conversacion = this.conversacionActiva;

      if (
        !texto ||
        texto.length > LARGO_MAXIMO_MENSAJE ||
        !conversacion ||
        conversacion.puedeEnviar === false ||
        this.enviando
      ) {
        return;
      }

      this.errorEnvio = "";
      this.enviando = true;
      this.borrador = "";
      this.detenerEscribiendo();

      const temporal = {
        idMensaje: `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        idConversacion: conversacion.idConversacion,
        contenido: texto,
        fechaEnvio: fechaHoraLocalIso(),
        idPerfilEmisor: this.idActivo,
        perfilEmisor: {},
        esMio: true,
        leido: false,
        fechaLectura: null,
        _temp: true,
      };

      this.mensajes.push(temporal);
      this.ordenarMensajes();
      this.$nextTick(() => this.$refs.chat?.scrollAlFinal());

      try {
        const response = await mensajeService.enviarMensaje(
          conversacion.idConversacion,
          texto
        );
        const data = response?.data;
        if (!data?.idMensaje) {
          throw new Error("Respuesta de mensaje inválida");
        }

        const real = this.normalizarMensaje(data);
        this.mensajes = this.mensajes.filter(
          (mensaje) => mensaje.idMensaje !== temporal.idMensaje
        );
        this.fusionarMensaje(real);
        this.actualizarPreviewConversacion(
          conversacion.idConversacion,
          real,
          false
        );
      } catch (error) {
        this.mensajes = this.mensajes.filter(
          (mensaje) => mensaje.idMensaje !== temporal.idMensaje
        );
        this.borrador = texto;
        this.errorEnvio = mensajeErrorMensajeria(
          error,
          "No se pudo enviar el mensaje."
        );

        if (esErrorMensajeNoPermitido(error)) {
          conversacion.puedeEnviar = false;
          const enLista = this.conversaciones.find(
            (item) =>
              String(item.idConversacion) ===
              String(conversacion.idConversacion)
          );
          if (enLista) enLista.puedeEnviar = false;
        }

        if (esErrorConversacionNoEncontrada(error)) {
          this.conversacionActiva = null;
          this.mensajes = [];
          this.cargarConversaciones(0);
        }
      } finally {
        this.enviando = false;
      }
    },
    mostrarError(mensaje) {
      this.toast.init({
        title: "Mensajes",
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
.mensajes {
  display: flex;
  min-height: 0;
  flex-direction: column;
  gap: 0.9rem;
}

.mensajes__titulo {
  margin: 0;
  font-size: 1.9rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.mensajes__card {
  display: flex;
  min-height: 560px;
  height: calc(100vh - 180px);
  overflow: hidden;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
}

.mensajes__lista {
  display: flex;
  width: 360px;
  min-height: 0;
  flex: none;
  flex-direction: column;
  border-right: 1px solid var(--color-border);
}

.mensajes__tabs {
  display: flex;
  flex: none;
  border-bottom: 1px solid var(--color-border);
}

.mensajes__tab {
  flex: 1;
  padding: 0.8rem;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--color-text-muted);
  font-weight: 600;
  cursor: pointer;
}

.mensajes__tab--activa {
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.mensajes__buscador {
  display: flex;
  flex: none;
  align-items: center;
  gap: 0.4rem;
  margin: 0.75rem 0.85rem 0.35rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
}

.mensajes__buscador .material-symbols-outlined {
  font-size: 1.1rem;
}

.mensajes__buscador input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--color-text);
  font: inherit;
  font-size: 0.8rem;
}

.mensajes__filtros {
  display: flex;
  flex: none;
  flex-wrap: wrap;
  gap: 0.35rem;
  padding: 0.25rem 0.85rem 0.6rem;
}

.mensajes__filtro {
  padding: 0.25rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
}

.mensajes__filtro--activo {
  background: var(--color-chip);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.mensajes__scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.mensajes__estado,
.mensajes__vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem 1.25rem;
  color: var(--color-text-muted);
  font-size: 0.82rem;
  text-align: center;
  line-height: 1.5;
}

.mensajes__estado .material-symbols-outlined,
.mensajes__vacio .material-symbols-outlined {
  font-size: 1.8rem;
}

.mensajes__reintentar,
.mensajes__mas {
  padding: 0.4rem 0.8rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
}

.mensajes__mas {
  display: block;
  margin: 0.5rem auto 0.75rem;
  color: var(--color-text-muted);
  font-size: 0.72rem;
  font-weight: 600;
}

.mensajes__grupo-titulo {
  padding: 0.65rem 0.9rem 0.25rem;
  color: var(--color-text-muted);
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.mensajes__contacto {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  width: 100%;
  padding: 0.55rem 0.9rem;
  border: 0;
  background: transparent;
  color: var(--color-text);
  text-align: left;
  cursor: pointer;
}

.mensajes__contacto:hover {
  background: var(--color-surface-muted);
}

.mensajes__contacto-info {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 0.05rem;
}

.mensajes__contacto-info strong {
  min-width: 0;
  overflow: hidden;
  font-size: 0.86rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mensajes__contacto-info span {
  min-width: 0;
  overflow: hidden;
  color: var(--color-text-muted);
  font-size: 0.72rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mensajes__chat {
  display: flex;
}

@media (max-width: 900px) {
  .mensajes__card {
    height: calc(100dvh - 160px);
    min-height: 480px;
  }

  .mensajes__lista {
    width: 100%;
    border-right: 0;
  }

  .mensajes__chat {
    display: none;
  }

  .mensajes__card--chat .mensajes__lista {
    display: none;
  }

  .mensajes__card--chat .mensajes__chat {
    display: flex;
  }
}
</style>
