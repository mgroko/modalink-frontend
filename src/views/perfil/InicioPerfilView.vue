<template>
  <div class="inicio-perfil">
    <div v-if="mensajeExito" class="inicio-perfil__exito">
      <BaseAlert :message="mensajeExito" type="success" />
      <VaButton
        v-if="ultimaConexionId"
        preset="secondary"
        size="small"
        icon="mso-open_in_new"
        @click="irAConexionCreada"
      >
        Ver conexión
      </VaButton>
    </div>
    <div v-if="mensajeError" class="inicio-perfil__error">
      <BaseAlert :message="mensajeError" type="error" />
      <VaButton
        v-if="errorCarga"
        size="small"
        preset="secondary"
        icon="mso-refresh"
        @click="cargarDatos"
      >
        Reintentar
      </VaButton>
    </div>

    <SkeletonPerfil v-if="cargando" />

    <div v-else-if="noEncontrado" class="inicio-perfil__estado">
      <span class="material-symbols-outlined inicio-perfil__estado-icono">person_off</span>
      {{ mensajeNoEncontrado || "El perfil que buscas no está disponible o ha sido dado de baja." }}
      <VaButton preset="secondary" @click="$router.push({ name: 'buscar' })">
        Volver a la búsqueda
      </VaButton>
    </div>

    <div v-else-if="!perfil" class="inicio-perfil__estado">
      <span class="material-symbols-outlined inicio-perfil__estado-icono">person_off</span>
      No se encontró el perfil activo.
      <VaButton preset="secondary" @click="$router.push({ name: 'dashboard-usuario' })">
        Volver al dashboard
      </VaButton>
    </div>

    <template v-else>
      <VaAlert
        v-if="esPropio && perfil.estado === 'PendienteBaja'"
        color="warning"
        class="inicio-perfil__alerta-baja"
        icon="mso-warning"
      >
        <div class="inicio-perfil__alerta-baja-contenido">
          <span>{{ mensajeBaja }}</span>
          <VaButton
            size="small"
            color="success"
            :loading="reactivando"
            @click="reactivarPerfil"
          >
            Reactivar perfil
          </VaButton>
        </div>
      </VaAlert>

      <VaAlert
        v-if="esPropio && perfil.estado === 'Deshabilitado'"
        color="danger"
        class="inicio-perfil__alerta-baja"
        icon="mso-lock"
      >
        Tu perfil está deshabilitado. Podés verlo y editarlo, pero no será visible para la
        comunidad.
      </VaAlert>

      <div class="inicio-perfil__layout">
        <div class="inicio-perfil__contenido">
          <PerfilHero
            v-if="seccion !== 'calendario' && seccion !== 'resenas'"
            :perfil="perfil"
            :es-propio="esPropio"
            @editar="irAEditar"
          />

          <!-- Sección: Calendario -->
          <template v-if="seccion === 'calendario'">
            <PerfilHero :perfil="perfil" compacto />
            <section class="inicio-perfil__panel">
              <h2 class="inicio-perfil__panel-titulo">Calendario profesional</h2>
              <div v-if="esPropio" class="inicio-perfil__calendario-wrap">
                <CalendarioProfesional mostrar-acciones @actualizado="refrescarEventos" />
              </div>
              <div v-else class="inicio-perfil__calendario-wrap">
                <CalendarioProfesional
                  :id-usuario="perfil.idUsuario || perfil.idPerfil"
                  solo-lectura
                />
              </div>
            </section>
          </template>

          <!-- Sección: Reseñas -->
          <template v-else-if="seccion === 'resenas'">
            <ResenaDetallePanel
              v-if="idResena != null"
              :id-perfil="perfil.idPerfil"
              :id-calificacion="idResena"
              @volver-listado="volverAlListadoResenas"
              @ver-perfil-autor="irAlPerfilAutor"
            />
            <ResenasListaPanel
              v-else
              :id-perfil="perfil.idPerfil"
              :nombre-perfil="perfil.nombreArtistico"
              :es-propio="esPropio"
              @ver-resena="abrirResena"
              @ver-perfil-autor="irAlPerfilAutor"
              @volver-perfil="volverAlPerfil"
            />
          </template>

          <!-- Sección: Términos y condiciones -->
          <TerminosCondicionesPanel
            v-else-if="seccion === 'terminos'"
            :terminos="terminos"
            :cargando="cargandoTerminos"
            :error="errorTerminos"
            :es-propio="esPropio"
            :puede-configurar="puedeConfigurarTerminos"
            @reintentar="cargarTerminos"
            @configurar="irAConfigurarTerminos"
          />

          <!-- Sección: Publicaciones (default) -->
          <template v-else>
            <section class="inicio-perfil__panel">
              <div class="inicio-perfil__panel-header">
                <h2 class="inicio-perfil__panel-titulo">Publicaciones del perfil</h2>
                <VaButton
                  v-if="esPropio"
                  color="success"
                  size="small"
                  icon="mso-add"
                  @click="nuevaPublicacion"
                >
                  Nueva publicación
                </VaButton>
              </div>
              <p v-if="!publicaciones.length" class="inicio-perfil__vacio">
                Todavía no hay publicaciones.
              </p>
              <article
                v-for="publicacion in publicaciones"
                :key="publicacion.idPublicacion"
                class="inicio-perfil__publicacion"
              >
                <p>{{ publicacion.contenido || publicacion.texto }}</p>
              </article>
            </section>

            <section v-if="habilidades.length" class="inicio-perfil__panel">
              <h2 class="inicio-perfil__panel-titulo">Habilidades</h2>
              <div class="inicio-perfil__habilidades">
                <span
                  v-for="habilidad in habilidades"
                  :key="habilidad"
                  class="inicio-perfil__habilidad"
                >
                  {{ habilidad }}
                </span>
              </div>
            </section>

            <section v-if="caracteristicas.length" class="inicio-perfil__panel">
              <h2 class="inicio-perfil__panel-titulo">Características técnicas</h2>

              <div v-if="renAltura.length" class="inicio-perfil__carac-grid">
                <div class="inicio-perfil__campo" v-for="carac in renAltura" :key="carac.idCaracteristica">
                  <span class="inicio-perfil__label">{{ carac._etiqueta }}</span>
                  <span class="inicio-perfil__valor">
                    <span v-if="carac.colorHex" class="inicio-perfil__swatch" :style="{ background: carac.colorHex }"></span>
                    {{ valorCarac(carac) }}{{ unidadCarac(carac) }}
                  </span>
                </div>
              </div>

              <div v-if="renMedidas.length" class="inicio-perfil__carac-grid">
                <div class="inicio-perfil__campo" v-for="carac in renMedidas" :key="carac.idCaracteristica">
                  <span class="inicio-perfil__label">{{ carac._etiqueta }}</span>
                  <span class="inicio-perfil__valor">
                    <span v-if="carac.colorHex" class="inicio-perfil__swatch" :style="{ background: carac.colorHex }"></span>
                    {{ valorCarac(carac) }}{{ unidadCarac(carac) }}
                  </span>
                </div>
              </div>

              <div v-if="renPielOjos.length" class="inicio-perfil__carac-grid">
                <div class="inicio-perfil__campo" v-for="carac in renPielOjos" :key="carac.idCaracteristica">
                  <span class="inicio-perfil__label">{{ carac._etiqueta }}</span>
                  <span class="inicio-perfil__valor">
                    <span v-if="carac.colorHex" class="inicio-perfil__swatch" :style="{ background: carac.colorHex }"></span>
                    {{ valorCarac(carac) }}{{ unidadCarac(carac) }}
                  </span>
                </div>
              </div>

              <div v-if="renCabelloTipo.length" class="inicio-perfil__carac-grid">
                <div class="inicio-perfil__campo" v-for="carac in renCabelloTipo" :key="carac.idCaracteristica">
                  <span class="inicio-perfil__label">{{ carac._etiqueta }}</span>
                  <span class="inicio-perfil__valor">
                    <span v-if="carac.colorHex" class="inicio-perfil__swatch" :style="{ background: carac.colorHex }"></span>
                    {{ valorCarac(carac) }}{{ unidadCarac(carac) }}
                  </span>
                </div>
              </div>

              <div v-if="renOtras.length" class="inicio-perfil__carac-grid">
                <div class="inicio-perfil__campo" v-for="carac in renOtras" :key="carac.idCaracteristica">
                  <span class="inicio-perfil__label">{{ carac._etiqueta }}</span>
                  <span class="inicio-perfil__valor">
                    <span v-if="carac.colorHex" class="inicio-perfil__swatch" :style="{ background: carac.colorHex }"></span>
                    {{ valorCarac(carac) }}{{ unidadCarac(carac) }}
                  </span>
                </div>
              </div>
            </section>
          </template>
        </div>

        <aside class="inicio-perfil__sidebar">
          <template v-if="esPropio">
            <ProximosEventos ref="proximosEventos" />
            <PerfilSidebarNav
              es-propio
              :seccion-activa="seccion"
              @cambiar-seccion="cambiarSeccion"
              @navegar-ruta="navegarRuta"
              @funcionalidad-no-disponible="noDisponible($event)"
              @cerrar-sesion="cerrarSesion"
            />
          </template>
          <template v-else>
            <PerfilSidebarNav
              :es-propio="false"
              :puede-reportar="!esAdministrador"
              :seccion-activa="seccion"
              :estado-conexion="estadoConexion"
              :mostrar-conexion="mostrarConexion"
              :cargando-conexion="enviandoConexion"
              :mostrar-cancelar="mostrarCancelarConexion"
              :cancelando-conexion="cancelandoConexion"
              :procesando-conexion="procesandoConexion"
              :accion-procesando-conexion="accionProcesandoConexion"
              @cambiar-seccion="cambiarSeccion"
              @navegar-ruta="navegarRuta"
              @funcionalidad-no-disponible="noDisponible($event)"
              @conectar="abrirModalConexion"
              @cancelar="abrirModalCancelarConexion"
              @aceptar="abrirGestionConexion('aceptar')"
              @rechazar="abrirGestionConexion('rechazar')"
              @eliminar="abrirEliminarConexion"
              @mensaje="noDisponible('Mensaje')"
              @reportar="modalReporte = true"
            />
            <ResenasCard
              :resumen="resenasResumen"
              :resenas="resenasDestacadas"
              :cargando="cargandoResenas"
              :error="errorResenas"
              @ver-todas="verTodasLasResenas"
              @ver-resena="abrirResena"
              @ver-perfil-autor="irAlPerfilAutor"
              @reintentar="cargarResenasDestacadas"
            />
          </template>
        </aside>
      </div>

      <ReportarPerfilModal
        v-model="modalReporte"
        :perfil="perfil"
        @reportado="alReportar"
      />

      <ModalEnviarSolicitudConexion
        :model-value="modalConexion"
        :perfil="perfil"
        :nombre-remitente="nombreRemitente"
        :enviando="enviandoConexion"
        :error="errorConexion"
        @update:model-value="alCambiarModalConexion"
        @confirmar="enviarSolicitudConexion"
      />

      <ModalCancelarSolicitudConexion
        :model-value="modalCancelarConexion"
        :perfil="perfil"
        :cancelando="cancelandoConexion"
        :error="errorCancelarConexion"
        @update:model-value="alCambiarModalCancelarConexion"
        @confirmar="cancelarSolicitudConexion"
      />

      <ModalGestionSolicitudConexion
        :model-value="modalGestionConexion"
        :perfil="perfil"
        :modo="modoGestionConexion"
        :procesando="procesandoConexion"
        :error="errorGestionConexion"
        @update:model-value="alCambiarModalGestionConexion"
        @confirmar="confirmarGestionConexion"
      />

      <ModalEliminarConexion
        :model-value="modalEliminarConexion"
        :perfil="perfil"
        :eliminando="eliminandoConexion"
        :error="errorEliminarConexion"
        @update:model-value="alCambiarModalEliminarConexion"
        @confirmar="confirmarEliminarConexion"
      />
    </template>
  </div>
</template>

<script>
import perfilService from "../../services/perfilService";
import homeService from "../../services/homeService";
import authService from "../../services/authService";
import calificacionPerfilService from "../../services/calificacionPerfilService";
import solicitudConexionService from "../../services/solicitudConexionService";
import conexionService from "../../services/conexionService";
import { cargarResumenPerfil } from "../../services/notificacionState";
import { cargarConteosSolicitudesConexion } from "../../services/solicitudConexionState";
import {
  esAdmin,
  idPerfilActivo,
  limpiarSesion,
  state as authState,
} from "../../services/authState";
import BaseAlert from "../../components/AlertaBase.vue";
import CalendarioProfesional from "../../components/calendario/CalendarioProfesional.vue";
import PerfilHero from "../../components/perfil/PerfilHero.vue";
import PerfilSidebarNav from "../../components/perfil/PerfilSidebarNav.vue";
import ProximosEventos from "../../components/perfil/ProximosEventos.vue";
import ResenaDetallePanel from "../../components/perfil/ResenaDetallePanel.vue";
import ResenasCard from "../../components/perfil/ResenasCard.vue";
import ResenasListaPanel from "../../components/perfil/ResenasListaPanel.vue";
import ReportarPerfilModal from "../../components/perfil/ReportarPerfilModal.vue";
import ModalEnviarSolicitudConexion from "../../components/perfil/ModalEnviarSolicitudConexion.vue";
import ModalCancelarSolicitudConexion from "../../components/perfil/ModalCancelarSolicitudConexion.vue";
import ModalGestionSolicitudConexion from "../../components/conexion/ModalGestionSolicitudConexion.vue";
import ModalEliminarConexion from "../../components/conexion/ModalEliminarConexion.vue";
import SkeletonPerfil from "../../components/perfil/SkeletonPerfil.vue";
import TerminosCondicionesPanel from "../../components/perfil/TerminosCondicionesPanel.vue";
import {
  ETIQUETAS_CARAC,
  ORDEN_CARAC,
  CODIGOS_ALTURA,
  CODIGOS_MEDIDAS,
  CODIGOS_PIEL_OJOS,
  CODIGOS_CABELLO_TIPO,
  TODOS_CODIGOS,
  UNIDADES_POR_CODIGO,
  normCodigo,
  inLista,
} from "../../utils/perfilConstants.js";
import { diasRestantes, fechaExpiracionBaja, formatearFecha } from "../../utils/fechas.js";
import { mensajeErrorApi } from "../../utils/apiError";
import {
  CODIGOS_ERROR_CONEXION,
  ESTADOS_CONEXION,
  mensajeErrorCancelacionConexion,
  mensajeErrorConexion,
  mensajeErrorGestionSolicitudConexion,
  normalizarEstadoConexion,
} from "../../utils/conexionConstants.js";
import {
  CODIGOS_ERROR_CONEXIONES,
  mensajeErrorEliminarConexion,
} from "../../utils/conexionesConstants.js";
import { normalizarResena, normalizarResumen } from "../../utils/resenasConstants";
import { normalizarTerminos } from "../../utils/terminosCondiciones.js";
import { mostrarNoDisponible } from "../../utils/noDisponible.js";
import { useToast } from "vuestic-ui";

const SECCIONES_NO_DISPONIBLES = {
  proyectos: "Proyectos",
  participaciones: "Participaciones",
};

export default {
  name: "InicioPerfilView",
  components: {
    BaseAlert,
    CalendarioProfesional,
    PerfilHero,
    PerfilSidebarNav,
    ProximosEventos,
    ReportarPerfilModal,
    ModalEnviarSolicitudConexion,
    ModalCancelarSolicitudConexion,
    ModalGestionSolicitudConexion,
    ModalEliminarConexion,
    ResenaDetallePanel,
    ResenasCard,
    ResenasListaPanel,
    SkeletonPerfil,
    TerminosCondicionesPanel,
  },
  setup() {
    return { toast: useToast() };
  },
  data() {
    return {
      perfil: null,
      publicaciones: [],
      resenasResumen: null,
      resenasDestacadas: [],
      cargandoResenas: false,
      errorResenas: "",
      controladorResenas: null,
      cargando: true,
      noEncontrado: false,
      mensajeNoEncontrado: "",
      errorCarga: false,
      mensajeExito: "",
      modalReporte: false,
      modalConexion: false,
      enviandoConexion: false,
      errorConexion: "",
      modalCancelarConexion: false,
      cancelandoConexion: false,
      errorCancelarConexion: "",
      modalGestionConexion: false,
      modoGestionConexion: "aceptar",
      procesandoConexion: false,
      accionProcesandoConexion: "",
      errorGestionConexion: "",
      modalEliminarConexion: false,
      eliminandoConexion: false,
      errorEliminarConexion: "",
      ultimaConexionId: null,
      reactivando: false,
      mensajeError: "",
      contadorBaja: { expiracion: null, restante: null },
      intervaloContador: null,
      terminos: null,
      terminosCargados: false,
      cargandoTerminos: false,
      errorTerminos: "",
    };
  },
  computed: {
    idResena() {
      const id = this.$route.params.idCalificacion;
      if (id == null || id === "") return null;
      const numero = Number(id);
      return Number.isFinite(numero) ? numero : null;
    },
    seccion() {
      if (this.idResena != null) return "resenas";

      const seccionRuta = this.$route.params.seccion;
      const validas = ["calendario", "resenas", "terminos"];
      return validas.includes(seccionRuta) ? seccionRuta : "publicaciones";
    },
    puedeConfigurarTerminos() {
      return (
        this.esPropio &&
        this.perfil?.idPerfil != null &&
        this.perfil.idPerfil === idPerfilActivo() &&
        this.perfil?.estado === "Activo"
      );
    },
    esPropio() {
      if (this.perfil?.esPropietario != null) return this.perfil.esPropietario === true;
      return this.perfil?.idPerfil != null && this.perfil.idPerfil === idPerfilActivo();
    },
    esAdministrador() {
      return esAdmin();
    },
    estadoConexion() {
      return normalizarEstadoConexion(this.perfil?.estadoConexion);
    },
    mostrarConexion() {
      return (
        !this.esPropio &&
        (this.estadoConexion !== ESTADOS_CONEXION.NINGUNA ||
          this.perfil?.estado === "Activo")
      );
    },
    mostrarCancelarConexion() {
      return (
        !this.esPropio &&
        this.estadoConexion === ESTADOS_CONEXION.SOLICITUD_ENVIADA &&
        this.perfil?.idSolicitudConexion != null
      );
    },
    nombreRemitente() {
      return authState.usuario?.nombreArtisticoActivo || "tu perfil activo";
    },
    mensajeBaja() {
      const { expiracion, restante } = this.contadorBaja;
      const base = "Este perfil tiene una solicitud de baja pendiente.";
      if (!expiracion) {
        return `${base} Podés reactivarlo mientras el plazo esté vigente.`;
      }
      const plazo =
        restante == null
          ? "El plazo venció: el perfil quedará en estado Baja."
          : restante === 1
            ? "Queda 1 día para reactivarlo."
            : `Quedan ${restante} días para reactivarlo.`;
      return `${base} El ${expiracion} pasará al estado Baja y quedará inaccesible para la comunidad. ${plazo}`;
    },
    habilidades() {
      const lista = Array.isArray(this.perfil?.habilidades) ? this.perfil.habilidades : [];
      return lista.filter(Boolean).slice().sort((a, b) => String(a).localeCompare(String(b), "es"));
    },
    caracteristicas() {
      return this.perfil?.caracteristicas || [];
    },
    renAltura() {
      return this._ordenarCarac(CODIGOS_ALTURA);
    },
    renMedidas() {
      return this._ordenarCarac(CODIGOS_MEDIDAS);
    },
    renPielOjos() {
      return this._ordenarCarac(CODIGOS_PIEL_OJOS);
    },
    renCabelloTipo() {
      return this._ordenarCarac(CODIGOS_CABELLO_TIPO);
    },
    renOtras() {
      return this.caracteristicas
        .filter((c) => !inLista(c.codigo, TODOS_CODIGOS))
        .map((c) => ({ ...c, _etiqueta: this.etiquetaCarac(c.codigo) }));
    },
  },
  async mounted() {
    this.avisarSeccionNoDisponible();
    await this.cargarDatos();
    this.intervaloContador = setInterval(() => this.actualizarContadorBaja(), 60 * 60 * 1000);
  },
  beforeUnmount() {
    if (this.intervaloContador) clearInterval(this.intervaloContador);
    this.abortarTerminos();
    this.abortarResenasDestacadas();
  },
  watch: {
    "$route.params.id"() {
      this.resetearTerminos();
      this.cargarDatos();
    },
    "$route.params.seccion"() {
      window.scrollTo({ top: 0, behavior: "smooth" });
      this.avisarSeccionNoDisponible();
      if (this.seccion === "terminos") this.cargarTerminos();
    },
    "$route.params.idCalificacion"() {
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
  },
  methods: {
    async cargarDatos() {
      this.cargando = true;
      this.mensajeError = "";
      this.mensajeExito = "";
      this.modalConexion = false;
      this.errorConexion = "";
      this.modalCancelarConexion = false;
      this.errorCancelarConexion = "";
      this.modalGestionConexion = false;
      this.errorGestionConexion = "";
      this.modalEliminarConexion = false;
      this.errorEliminarConexion = "";
      this.ultimaConexionId = null;
      this.noEncontrado = false;
      this.mensajeNoEncontrado = "";
      this.errorCarga = false;
      this.resetearTerminos();
      this.abortarResenasDestacadas();
      this.resenasResumen = null;
      this.resenasDestacadas = [];
      this.cargandoResenas = false;
      this.errorResenas = "";

      const idDeRuta = this.$route.params.id;
      const id = idDeRuta != null ? Number(idDeRuta) : idPerfilActivo();
      if (id == null || Number.isNaN(id)) {
        this.cargando = false;
        this.perfil = null;
        return;
      }

      try {
        // Paralelismo (UC-14 §7): el resumen del feed solo hace falta si el
        // perfil es propio. "¿Es mío?" se resuelve antes de lanzar las
        // peticiones con el perfil activo en sesión (mismo criterio del
        // computed esPropio) para no serializar los dos round-trips.
        const esMio = idDeRuta == null || id === idPerfilActivo();

        const perfilPromise = perfilService.obtener(id);
        const resumenPromise = esMio
          ? // best-effort: un fallo del resumen no debe romper la carga del perfil
            homeService.obtenerResumen().catch(() => null)
          : Promise.resolve(null);

        const [perfilRes, resumenInicial] = await Promise.all([
          perfilPromise,
          resumenPromise,
        ]);

        this.perfil = perfilRes?.data || null;
        if (!this.perfil) {
          this.noEncontrado = true;
          return;
        }
        this.actualizarContadorBaja();
        this.aplicarTerminosPerfil();

        // La tarjeta lateral de reseñas solo se muestra en perfiles ajenos.
        // Es best-effort: un fallo no debe romper la carga del perfil.
        if (!this.esPropio) {
          this.cargarResenasDestacadas();
        }

        // Contrato UC-23: GET /perfiles/{id} siempre incluye
        // terminosCondiciones. El endpoint dedicado queda como respaldo
        // defensivo si la propiedad no viniera en la respuesta.
        if (this.seccion === "terminos" && !this.terminosCargados) {
          await this.cargarTerminos();
        }

        // Caso raro: el sistema marca esPropietario pero el id no coincidía
        // con el perfil activo al disparar las peticiones → traer el resumen
        // en este punto (ya de forma secuencial).
        let resumenRes = resumenInicial;
        if (this.perfil.esPropietario === true && resumenRes == null) {
          resumenRes = await homeService.obtenerResumen().catch(() => null);
        }

        // Las publicaciones del feed propio solo se muestran cuando el perfil
        // consultado pertenece al usuario en sesión.
        const resumen = resumenRes?.data || null;
        this.publicaciones =
          this.perfil.esPropietario === true && Array.isArray(resumen?.publicacionesRecientes)
            ? resumen.publicacionesRecientes
            : [];
      } catch (error) {
        const status = error?.response?.status;
        if (status === 401) {
          // Spec UC-14 §6: sesión inválida o cuenta inactiva → volver al login
          // conservando la ruta de origen para regresar tras re-autenticarse.
          this.$router.push({ name: "login", query: { redirect: this.$route.fullPath } });
          return;
        }
        if (status === 404) {
          this.noEncontrado = true;
          this.mensajeNoEncontrado =
            error?.response?.data?.message ||
            "El perfil que buscas no está disponible o ha sido dado de baja.";
        } else {
          this.errorCarga = true;
          this.mensajeError = mensajeErrorApi(error, "No se pudo cargar el perfil. Intentá nuevamente.");
        }
      } finally {
        this.cargando = false;
      }
    },
    resetearTerminos() {
      this.abortarTerminos();
      this.terminos = null;
      this.terminosCargados = false;
      this.cargandoTerminos = false;
      this.errorTerminos = "";
    },
    abortarTerminos() {
      if (this.controladorTerminos) {
        this.controladorTerminos.abort();
        this.controladorTerminos = null;
      }
    },
    async cargarResenasDestacadas() {
      const idPerfil = this.perfil?.idPerfil;
      if (idPerfil == null) return;

      this.abortarResenasDestacadas();
      this.cargandoResenas = true;
      this.errorResenas = "";

      const controller = new AbortController();
      this.controladorResenas = controller;

      try {
        const response = await calificacionPerfilService.listar(idPerfil, {
          page: 0,
          size: 2,
          signal: controller.signal,
        });

        if (this.controladorResenas !== controller) return;

        const data = response?.data || {};
        this.resenasResumen = normalizarResumen(data.resumen);
        const contenido = Array.isArray(data.calificaciones?.contenido)
          ? data.calificaciones.contenido
          : [];
        this.resenasDestacadas = contenido.map(normalizarResena);
      } catch (error) {
        if (this.controladorResenas !== controller) return;
        if (
          error?.name === "CanceledError" ||
          error?.code === "ERR_CANCELED"
        ) {
          return;
        }
        this.errorResenas = mensajeErrorApi(
          error,
          "No se pudieron cargar las reseñas."
        );
      } finally {
        if (this.controladorResenas === controller) {
          this.cargandoResenas = false;
        }
      }
    },
    abortarResenasDestacadas() {
      if (this.controladorResenas) {
        this.controladorResenas.abort();
        this.controladorResenas = null;
      }
    },
    verTodasLasResenas() {
      const idDeRuta = this.$route.params.id;
      if (idDeRuta) {
        this.$router.push({
          name: "ver-perfil-seccion",
          params: { id: idDeRuta, seccion: "resenas" },
        });
        return;
      }
      this.$router.push({
        name: "inicioperfil-seccion",
        params: { seccion: "resenas" },
      });
    },
    abrirResena(idCalificacion) {
      if (idCalificacion == null) return;

      const idDeRuta = this.$route.params.id;
      if (idDeRuta) {
        this.$router.push({
          name: "ver-perfil-resena",
          params: { id: idDeRuta, idCalificacion },
        });
        return;
      }
      this.$router.push({
        name: "inicioperfil-resena",
        params: { idCalificacion },
      });
    },
    volverAlListadoResenas() {
      this.verTodasLasResenas();
    },
    volverAlPerfil() {
      const idDeRuta = this.$route.params.id;
      if (idDeRuta) {
        this.$router.push({ name: "ver-perfil", params: { id: idDeRuta } });
        return;
      }
      this.$router.push({ name: "inicioperfil" });
    },
    irAlPerfilAutor(idPerfil) {
      if (idPerfil == null) return;

      if (Number(idPerfil) === Number(idPerfilActivo())) {
        this.$router.push({ name: "inicioperfil" });
        return;
      }
      this.$router.push({ name: "ver-perfil", params: { id: idPerfil } });
    },
    aplicarTerminosPerfil() {
      if (!this.perfil || !this.perfil.terminosCondiciones) return;
      this.terminos = normalizarTerminos(this.perfil.terminosCondiciones);
      this.terminosCargados = true;
      this.errorTerminos = "";
    },
    async cargarTerminos() {
      if (this.cargandoTerminos || this.terminosCargados) return;

      const id = this.perfil?.idPerfil;
      if (id == null) return;

      this.abortarTerminos();
      this.controladorTerminos = new AbortController();
      this.cargandoTerminos = true;
      this.errorTerminos = "";

      try {
        const response = await perfilService.obtenerTerminos(
          id,
          this.controladorTerminos.signal
        );
        this.terminos = normalizarTerminos(response?.data);
        this.terminosCargados = true;
      } catch (error) {
        if (error?.name === "CanceledError" || error?.code === "ERR_CANCELED") {
          return;
        }
        const status = error?.response?.status;
        if (status === 401) {
          this.$router.push({
            name: "login",
            query: { redirect: this.$route.fullPath },
          });
          return;
        }
        this.errorTerminos = mensajeErrorApi(
          error,
          "No se pudieron cargar los términos y condiciones."
        );
      } finally {
        this.cargandoTerminos = false;
      }
    },
    irAConfigurarTerminos() {
      this.$router.push({ name: "configurar-terminos-perfil" });
    },
    actualizarContadorBaja() {
      // Prioriza la fecha exacta del sistema (fechaLimite) si el endpoint la
      // incluye. El contrato actual (UC-14 §2) solo envía fechaSolicitudBaja,
      // por lo que la expiración se calcula con DIAS_REACTIVACION (debe
      // coincidir con la configuración diasBaja del sistema).
      const fechaLimite = this.perfil?.fechaLimite;
      const iso = this.perfil?.fechaSolicitudBaja;
      const expira = fechaLimite || (iso ? fechaExpiracionBaja(iso) : null);
      this.contadorBaja = {
        expiracion: expira ? formatearFecha(expira) : null,
        restante: expira ? diasRestantes(expira) : null,
      };
    },
    async reactivarPerfil() {
      if (!this.perfil?.idPerfil) return;
      this.reactivando = true;
      this.mensajeError = "";
      try {
        await perfilService.reactivar(this.perfil.idPerfil);
        await this.cargarDatos();
      } catch (error) {
        const status = error?.response?.status;
        this.mensajeError =
          error?.response?.data?.message ||
          (status === 409
            ? "El plazo de reactivación venció: el perfil ya está en estado Baja."
            : "No se pudo reactivar el perfil.");
      } finally {
        this.reactivando = false;
      }
    },
    cambiarSeccion(seccion) {
      const noDisponible = SECCIONES_NO_DISPONIBLES[seccion];
      if (noDisponible) {
        this.noDisponible(noDisponible);
        return;
      }

      const idDeRuta = this.$route.params.id;
      if (idDeRuta) {
        this.$router.push({ name: "ver-perfil-seccion", params: { id: idDeRuta, seccion } });
      } else {
        this.$router.push({ name: "inicioperfil-seccion", params: { seccion } });
      }
    },
    navegarRuta(ruta) {
      if (ruta === "editar-perfil-inicio") {
        if (!this.perfil?.idPerfil) return;
        this.$router.push({
          name: ruta,
          params: { id: this.perfil.idPerfil },
        });
        return;
      }
      if (ruta) {
        this.$router.push({ name: ruta });
      }
    },
    avisarSeccionNoDisponible() {
      const seccion = this.$route.params.seccion;
      const nombre = SECCIONES_NO_DISPONIBLES[seccion];
      if (!nombre) return;

      this.noDisponible(nombre);
      const id = this.$route.params.id;
      this.$router.replace(
        id ? { name: "ver-perfil", params: { id } } : { name: "inicioperfil" }
      );
    },
    refrescarEventos() {
      this.$refs.proximosEventos?.cargar();
    },
    noDisponible(nombre) {
      mostrarNoDisponible(this.toast, nombre);
    },
    alReportar() {
      this.mensajeExito = "Reporte enviado. Gracias por ayudarnos a mantener la comunidad.";
    },
    abrirModalConexion() {
      if (
        this.esPropio ||
        !this.mostrarConexion ||
        this.estadoConexion !== ESTADOS_CONEXION.NINGUNA ||
        this.enviandoConexion
      ) {
        return;
      }
      this.errorConexion = "";
      this.modalConexion = true;
    },
    alCambiarModalConexion(valor) {
      if (this.enviandoConexion && !valor) return;
      this.modalConexion = valor;
      if (!valor) this.errorConexion = "";
    },
    async enviarSolicitudConexion() {
      if (this.enviandoConexion) return;
      const idPerfil = this.perfil?.idPerfil;
      if (idPerfil == null) return;

      this.enviandoConexion = true;
      this.errorConexion = "";
      try {
        const response = await solicitudConexionService.enviar(idPerfil);
        const data = response?.data || {};
        this.modalConexion = false;
        this.perfil = {
          ...this.perfil,
          estadoConexion: ESTADOS_CONEXION.SOLICITUD_ENVIADA,
          idSolicitudConexion:
            data.idSolicitudConexion ?? this.perfil.idSolicitudConexion ?? null,
          idConexion: null,
        };
        this.mensajeExito = `Solicitud de conexión enviada a ${
          this.perfil.nombreArtistico || "este perfil"
        }.`;
      } catch (error) {
        const codigo = error?.response?.data?.codigo;
        const esConflictoDeEstado =
          codigo === CODIGOS_ERROR_CONEXION.SOLICITUD_CONEXION_PENDIENTE ||
          codigo === CODIGOS_ERROR_CONEXION.CONEXION_YA_EXISTENTE;

        if (esConflictoDeEstado) {
          this.modalConexion = false;
          const actualizado = await this.refrescarPerfilConexion();
          if (actualizado) {
            this.toast.init({
              title: "Conexión",
              message:
                codigo === CODIGOS_ERROR_CONEXION.CONEXION_YA_EXISTENTE
                  ? "Ya tenés una conexión activa con este perfil."
                  : "Ya existe una solicitud de conexión pendiente con este perfil.",
              color: "info",
              position: "top-right",
              duration: 5000,
            });
          }
          return;
        }

        this.errorConexion = mensajeErrorConexion(error);
      } finally {
        this.enviandoConexion = false;
      }
    },
    abrirModalCancelarConexion() {
      if (!this.mostrarCancelarConexion || this.cancelandoConexion) return;
      this.errorCancelarConexion = "";
      this.modalCancelarConexion = true;
    },
    alCambiarModalCancelarConexion(valor) {
      if (this.cancelandoConexion && !valor) return;
      this.modalCancelarConexion = valor;
      if (!valor) this.errorCancelarConexion = "";
    },
    async cancelarSolicitudConexion() {
      if (this.cancelandoConexion) return;
      const idSolicitud = this.perfil?.idSolicitudConexion;
      if (idSolicitud == null) return;

      this.cancelandoConexion = true;
      this.errorCancelarConexion = "";
      try {
        await solicitudConexionService.cancelar(idSolicitud);
        this.modalCancelarConexion = false;
        this.perfil = {
          ...this.perfil,
          estadoConexion: ESTADOS_CONEXION.NINGUNA,
          idSolicitudConexion: null,
          idConexion: null,
        };
        this.mensajeExito = "Solicitud de conexión cancelada.";
        await this.refrescarPerfilConexion({ silencioso: true });
      } catch (error) {
        const status = error?.response?.status;
        const codigo = error?.response?.data?.codigo;
        const esConflicto =
          codigo === CODIGOS_ERROR_CONEXION.SOLICITUD_CONEXION_NO_PENDIENTE;
        const esNoPermitida =
          codigo === CODIGOS_ERROR_CONEXION.SOLICITUD_CONEXION_NO_PERMITIDA ||
          status === 403;
        const esNoEncontrada = status === 404;

        if (esConflicto || esNoPermitida || esNoEncontrada) {
          this.modalCancelarConexion = false;
          const actualizado = await this.refrescarPerfilConexion({
            silencioso: true,
          });

          if (!actualizado || esNoPermitida || esNoEncontrada) {
            this.perfil = {
              ...this.perfil,
              idSolicitudConexion: null,
            };
          }

          this.toast.init({
            title: esConflicto
              ? "Solicitud de conexión"
              : "No se pudo cancelar",
            message: esConflicto
              ? "La solicitud ya fue gestionada por el destinatario."
              : mensajeErrorCancelacionConexion(error),
            color: esConflicto ? "info" : "danger",
            position: "top-right",
            duration: 5000,
          });
          return;
        }

        this.errorCancelarConexion = mensajeErrorCancelacionConexion(error);
      } finally {
        this.cancelandoConexion = false;
      }
    },
    abrirGestionConexion(modo) {
      if (
        this.esPropio ||
        this.estadoConexion !== ESTADOS_CONEXION.SOLICITUD_RECIBIDA ||
        this.perfil?.idSolicitudConexion == null ||
        this.procesandoConexion
      ) {
        return;
      }
      this.modoGestionConexion = modo === "rechazar" ? "rechazar" : "aceptar";
      this.errorGestionConexion = "";
      this.modalGestionConexion = true;
    },
    alCambiarModalGestionConexion(valor) {
      if (this.procesandoConexion && !valor) return;
      this.modalGestionConexion = valor;
      if (!valor) this.errorGestionConexion = "";
    },
    async confirmarGestionConexion() {
      if (this.procesandoConexion) return;
      const idSolicitud = this.perfil?.idSolicitudConexion;
      if (idSolicitud == null) return;

      const modo = this.modoGestionConexion;
      this.procesandoConexion = true;
      this.accionProcesandoConexion = modo;
      this.errorGestionConexion = "";
      try {
        const response =
          modo === "aceptar"
            ? await solicitudConexionService.aceptar(idSolicitud)
            : await solicitudConexionService.rechazar(idSolicitud);
        const data = response?.data || {};

        this.modalGestionConexion = false;
        this.ultimaConexionId =
          modo === "aceptar" ? data.idConexion ?? null : null;
        this.mensajeExito =
          modo === "aceptar"
            ? "Solicitud aceptada. La conexión ya está activa."
            : "Solicitud rechazada.";
        this.perfil = {
          ...this.perfil,
          estadoConexion:
            modo === "aceptar"
              ? ESTADOS_CONEXION.CONECTADO
              : ESTADOS_CONEXION.NINGUNA,
          idConexion:
            modo === "aceptar" ? data.idConexion ?? null : null,
          idSolicitudConexion: null,
        };

        await this.refrescarPerfilConexion({ silencioso: true });
        await cargarConteosSolicitudesConexion("RECIBIDA");
        await cargarResumenPerfil(idPerfilActivo());
      } catch (error) {
        const status = error?.response?.status;
        const codigo = error?.response?.data?.codigo;
        const esConflicto =
          codigo ===
            CODIGOS_ERROR_CONEXION.SOLICITUD_CONEXION_NO_PENDIENTE ||
          codigo === CODIGOS_ERROR_CONEXION.CONEXION_YA_EXISTENTE;
        const esNoPermitida =
          codigo ===
            CODIGOS_ERROR_CONEXION.SOLICITUD_CONEXION_NO_PERMITIDA ||
          status === 403;
        const esNoEncontrada = status === 404;

        if (esConflicto || esNoPermitida || esNoEncontrada) {
          this.modalGestionConexion = false;
          await this.refrescarPerfilConexion({ silencioso: true });
          await cargarConteosSolicitudesConexion("RECIBIDA");
          this.toast.init({
            title: esConflicto
              ? "Solicitud de conexión"
              : "No se pudo gestionar",
            message: mensajeErrorGestionSolicitudConexion(error),
            color: esConflicto ? "info" : "danger",
            position: "top-right",
            duration: 5000,
          });
          return;
        }

        this.errorGestionConexion =
          mensajeErrorGestionSolicitudConexion(error);
      } finally {
        this.procesandoConexion = false;
        this.accionProcesandoConexion = "";
      }
    },
    abrirEliminarConexion() {
      if (
        this.esPropio ||
        this.estadoConexion !== ESTADOS_CONEXION.CONECTADO ||
        this.perfil?.idConexion == null ||
        this.eliminandoConexion
      ) {
        return;
      }
      this.errorEliminarConexion = "";
      this.modalEliminarConexion = true;
    },
    alCambiarModalEliminarConexion(valor) {
      if (this.eliminandoConexion && !valor) return;
      this.modalEliminarConexion = valor;
      if (!valor) this.errorEliminarConexion = "";
    },
    async confirmarEliminarConexion() {
      if (this.eliminandoConexion) return;
      const idConexion = this.perfil?.idConexion;
      if (idConexion == null) return;

      this.eliminandoConexion = true;
      this.procesandoConexion = true;
      this.accionProcesandoConexion = "eliminar";
      this.errorEliminarConexion = "";
      try {
        await conexionService.eliminar(idConexion);
        this.modalEliminarConexion = false;
        this.ultimaConexionId = null;
        this.mensajeExito = "Conexión eliminada.";
        this.perfil = {
          ...this.perfil,
          estadoConexion: ESTADOS_CONEXION.NINGUNA,
          idConexion: null,
          idSolicitudConexion: null,
        };
        await this.refrescarPerfilConexion({ silencioso: true });
        await cargarResumenPerfil(idPerfilActivo());
      } catch (error) {
        const status = error?.response?.status;
        const codigo = error?.response?.data?.codigo;
        const esNoActiva =
          codigo === CODIGOS_ERROR_CONEXIONES.CONEXION_NO_ACTIVA;
        const esNoEncontrada = status === 404;

        if (esNoActiva || esNoEncontrada) {
          this.modalEliminarConexion = false;
          await this.refrescarPerfilConexion({ silencioso: true });
          this.toast.init({
            title: "No se pudo eliminar",
            message: mensajeErrorEliminarConexion(error),
            color: "danger",
            position: "top-right",
            duration: 5000,
          });
          return;
        }

        this.errorEliminarConexion = mensajeErrorEliminarConexion(error);
      } finally {
        this.eliminandoConexion = false;
        this.procesandoConexion = false;
        this.accionProcesandoConexion = "";
      }
    },
    irAConexionCreada() {
      if (this.ultimaConexionId == null) return;
      this.$router.push({
        name: "mi-red",
        query: {
          tab: "conexiones",
          idConexion: this.ultimaConexionId,
        },
      });
    },
    async refrescarPerfilConexion({ silencioso = false } = {}) {
      const idPerfil = this.perfil?.idPerfil;
      if (idPerfil == null) return false;

      try {
        const response = await perfilService.obtener(idPerfil);
        if (response?.data) {
          this.perfil = response.data;
          return true;
        }
      } catch (error) {
        if (!silencioso) {
          this.toast.init({
            title: "No se pudo actualizar el perfil",
            message: mensajeErrorApi(
              error,
              "Recargá la página para ver el estado actualizado de la conexión."
            ),
            color: "danger",
            position: "top-right",
            duration: 5000,
          });
        }
      }
      return false;
    },
    nuevaPublicacion() {
      this.noDisponible("Nueva publicación");
    },
    irAEditar() {
      if (this.perfil?.idPerfil) {
        this.$router.push({
          name: "editar-perfil-inicio",
          params: { id: this.perfil.idPerfil },
        });
      }
    },
    async cerrarSesion() {
      try {
        await authService.cerrarSesion();
      } catch {
        // ignore
      } finally {
        limpiarSesion();
        this.$router.push({ name: "login" });
      }
    },
    _ordenarCarac(codigos) {
      return this.caracteristicas
        .filter((c) => inLista(c.codigo, codigos))
        .map((c) => ({ ...c, _etiqueta: this.etiquetaCarac(c.codigo) }))
        .sort((a, b) => {
          const na = normCodigo(a.codigo);
          const nb = normCodigo(b.codigo);
          const oa = ORDEN_CARAC[na] ?? codigos.indexOf(na);
          const ob = ORDEN_CARAC[nb] ?? codigos.indexOf(nb);
          return oa - ob;
        });
    },
    etiquetaCarac(codigo) {
      const n = normCodigo(codigo);
      if (ETIQUETAS_CARAC[n]) return ETIQUETAS_CARAC[n];
      return this.capitalizar(codigo) || "—";
    },
    valorCarac(carac) {
      // Spec UC-14 §2/§7.3: codigoValor ya es la etiqueta visible de BD y
      // valor es texto libre; se muestran tal cual, sin re-mapear.
      if (carac.codigoValor) return carac.codigoValor;
      if (carac.valor) return carac.valor;
      return "—";
    },
    unidadCarac(carac) {
      const unidad = UNIDADES_POR_CODIGO[normCodigo(carac.codigo)];
      return unidad ? ` ${unidad}` : "";
    },
    capitalizar(texto) {
      const palabras = String(texto || "")
        .toLowerCase()
        .split(/[_\-]+/)
        .filter(Boolean)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1));
      return palabras.join(" ");
    },
  },
};
</script>

<style scoped>
.inicio-perfil {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
}

.inicio-perfil__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 1.5rem;
  align-items: start;
}

.inicio-perfil__contenido {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
}

.inicio-perfil__sidebar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: sticky;
  top: 1rem;
}

.inicio-perfil__panel {
  padding: 1.25rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.inicio-perfil__panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.inicio-perfil__panel-titulo {
  margin: 0 0 1rem;
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
}

.inicio-perfil__panel-header .inicio-perfil__panel-titulo {
  margin: 0;
}

.inicio-perfil__vacio {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.inicio-perfil__publicacion {
  padding: 0.9rem 0;
  border-bottom: 1px solid var(--color-border);
}

.inicio-perfil__publicacion:last-child {
  border-bottom: 0;
}

.inicio-perfil__publicacion p {
  margin: 0;
  color: var(--color-text);
  font-size: 0.9rem;
}

.inicio-perfil__carac-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 0.75rem;
  padding: 1rem;
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  margin-bottom: 0.75rem;
}

.inicio-perfil__carac-grid:last-child {
  margin-bottom: 0;
}

.inicio-perfil__campo {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.85rem;
  color: var(--color-text);
}

.inicio-perfil__label {
  font-size: 0.72rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.inicio-perfil__valor {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.inicio-perfil__swatch {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.15);
}

.inicio-perfil__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.inicio-perfil__estado-icono {
  font-size: 2.5rem;
}

.inicio-perfil__habilidades {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.inicio-perfil__habilidad {
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  font-size: 0.8rem;
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
}

.inicio-perfil__exito {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-bottom: 0.75rem;
}

.inicio-perfil__error {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
}

.inicio-perfil__alerta-baja {
  margin-bottom: 1rem;
}

.inicio-perfil__alerta-baja-contenido {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
  flex-wrap: wrap;
}

.inicio-perfil__calendario-wrap {
  overflow-x: auto;
  max-width: 100%;
}

@media (max-width: 900px) {
  .inicio-perfil__layout {
    grid-template-columns: 1fr;
  }

  .inicio-perfil__sidebar {
    position: static;
    order: -1;
  }
}
</style>
