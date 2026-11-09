<template>
  <div class="invitar-proyecto">
    <p class="invitar-proyecto__migas">
      <router-link
        :to="{ name: 'proyectos-inicio' }"
        class="invitar-proyecto__miga"
      >
        Proyectos
      </router-link>
      <span aria-hidden="true">›</span>
      <span>Invitar a proyecto</span>
    </p>

    <header class="invitar-proyecto__cabecera">
      <h1 class="invitar-proyecto__titulo">Invitar a proyecto</h1>
    </header>

    <div v-if="cargando" class="invitar-proyecto__estado">
      <span class="material-symbols-outlined invitar-proyecto__estado-icono">
        hourglass_empty
      </span>
      Cargando proyecto...
    </div>

    <section v-else-if="errorCarga || sinAcceso" class="invitar-proyecto__estado">
      <span class="material-symbols-outlined invitar-proyecto__estado-icono">
        lock
      </span>
      <p class="invitar-proyecto__estado-titulo">{{ tituloErrorCarga }}</p>
      <p class="invitar-proyecto__estado-texto">{{ errorCarga }}</p>
      <div class="invitar-proyecto__estado-acciones">
        <VaButton
          v-if="mostrarReintento"
          preset="secondary"
          @click="cargar"
        >
          Reintentar
        </VaButton>
        <VaButton
          preset="primary"
          @click="
            estadoNoEncontrado ? volverAProyectos() : volverAlProyecto()
          "
        >
          {{ estadoNoEncontrado ? "Volver a Proyectos" : "Volver a Miembros" }}
        </VaButton>
      </div>
    </section>

    <template v-else>
      <div class="invitar-proyecto__stepper" aria-label="Pasos de la invitación">
        <template v-for="(item, indice) in pasos" :key="item.numero">
          <span
            class="invitar-proyecto__paso"
            :class="{
              'invitar-proyecto__paso--completado': item.completado,
              'invitar-proyecto__paso--actual': item.actual,
            }"
          >
            <span class="invitar-proyecto__paso-circulo">
              <span
                v-if="item.completado"
                class="material-symbols-outlined"
                aria-hidden="true"
              >
                check
              </span>
              <template v-else>{{ item.numero }}</template>
            </span>
            <span class="invitar-proyecto__paso-etiqueta">
              {{ item.etiqueta }}
            </span>
          </span>

          <span
            v-if="indice < pasos.length - 1"
            class="invitar-proyecto__linea"
            :class="{
              'invitar-proyecto__linea--completada': indice + 1 < paso,
            }"
            aria-hidden="true"
          ></span>
        </template>
      </div>

      <div class="invitar-proyecto__layout">
        <div class="invitar-proyecto__contenido">
          <BaseAlert
            v-if="errorEnvio"
            :message="errorEnvio"
            type="error"
            class="invitar-proyecto__alerta"
          />

          <template v-if="paso === 1">
            <section class="invitar-proyecto__panel">
              <h2 class="invitar-proyecto__seccion-titulo">
                1. Elegí el proyecto
              </h2>
              <p class="invitar-proyecto__seccion-ayuda">
                La invitación se envía al proyecto desde el que ingresaste.
              </p>

              <div class="invitar-proyecto__proyecto-card">
                <span
                  class="invitar-proyecto__radio invitar-proyecto__radio--activo"
                  aria-hidden="true"
                >
                  <span class="invitar-proyecto__radio-punto"></span>
                </span>

                <div class="invitar-proyecto__proyecto-info">
                  <span class="invitar-proyecto__proyecto-nombre">
                    {{ nombreProyecto }}
                  </span>
                  <span class="invitar-proyecto__proyecto-meta">
                    Entrega: {{ fechaEntrega }} · Director:
                    {{ nombreDirector }}
                  </span>
                </div>

                <EstadoProyectoBadge :estado="proyecto.estado" />
              </div>
            </section>

            <section class="invitar-proyecto__panel">
              <h2 class="invitar-proyecto__seccion-titulo">
                2. Tipo de invitación
              </h2>

              <div class="invitar-proyecto__opciones">
                <button
                  v-for="opcion in opcionesTipo"
                  :key="opcion.value"
                  type="button"
                  class="invitar-proyecto__opcion"
                  :class="{
                    'invitar-proyecto__opcion--seleccionada':
                      tipoInvitacion === opcion.value,
                  }"
                  :aria-pressed="
                    tipoInvitacion === opcion.value ? 'true' : 'false'
                  "
                  @click="seleccionarTipo(opcion.value)"
                >
                  <span
                    class="invitar-proyecto__radio"
                    :class="{
                      'invitar-proyecto__radio--activo':
                        tipoInvitacion === opcion.value,
                    }"
                    aria-hidden="true"
                  >
                    <span
                      v-if="tipoInvitacion === opcion.value"
                      class="invitar-proyecto__radio-punto"
                    ></span>
                  </span>

                  <span class="invitar-proyecto__opcion-texto">
                    <span class="invitar-proyecto__opcion-titulo">
                      {{ opcion.titulo }}
                    </span>
                    <span class="invitar-proyecto__opcion-descripcion">
                      {{ opcion.descripcion }}
                    </span>
                  </span>
                </button>
              </div>

              <div
                v-if="tipoInvitacion === TIPOS_INVITACION.ACTIVIDAD"
                class="invitar-proyecto__requerimiento"
              >
                <p class="invitar-proyecto__campo-label">
                  Requerimiento de actividad
                </p>

                <BuscadorRequerimientoActividad
                  :id-proyecto="idProyecto"
                  :model-value="requerimiento?.idRequerimiento ?? null"
                  :token-refresco="tokenRefrescoRequerimientos"
                  :deshabilitado="enviando"
                  @seleccionado="onRequerimientoSeleccionado"
                />
              </div>
            </section>
          </template>

          <template v-else-if="paso === 2">
            <section class="invitar-proyecto__panel">
              <h2 class="invitar-proyecto__seccion-titulo">
                Elegí los perfiles destinatarios
              </h2>

              <BuscadorPerfilInvitacion
                v-model="perfilesSeleccionados"
                :id-profesion="
                  tipoInvitacion === TIPOS_INVITACION.ACTIVIDAD
                    ? requerimiento?.idProfesion ?? null
                    : null
                "
                :nombre-profesion="requerimiento?.nombreProfesion || ''"
                :id-usuario-actual="idUsuarioActual"
                :id-perfiles-excluidos="perfilesExcluidos"
                :token-refresco="tokenRefrescoPerfiles"
                :deshabilitado="enviando"
              />

              <div
                v-if="perfilesSeleccionados.length"
                class="invitar-proyecto__seleccion"
              >
                <p class="invitar-proyecto__seleccion-titulo">
                  {{ cantidadPerfilesSeleccionados }}
                  {{
                    cantidadPerfilesSeleccionados === 1
                      ? "perfil seleccionado"
                      : "perfiles seleccionados"
                  }}
                </p>

                <ul class="invitar-proyecto__seleccion-lista">
                  <li
                    v-for="perfil in perfilesSeleccionados"
                    :key="perfil.idPerfil"
                    class="invitar-proyecto__seleccion-chip"
                  >
                    <span>{{ perfil.nombreArtistico || "Perfil" }}</span>
                    <button
                      type="button"
                      class="invitar-proyecto__seleccion-quitar"
                      :aria-label="`Quitar a ${perfil.nombreArtistico || 'este perfil'}`"
                      @click="quitarPerfilSeleccionado(perfil)"
                    >
                      <span class="material-symbols-outlined" aria-hidden="true">
                        close
                      </span>
                    </button>
                  </li>
                </ul>
              </div>
            </section>
          </template>

          <template v-else>
            <section class="invitar-proyecto__panel">
              <h2 class="invitar-proyecto__seccion-titulo">
                Revisá y envía
              </h2>

              <div class="invitar-proyecto__perfiles-resumen">
                <div
                  v-for="perfil in perfilesSeleccionados"
                  :key="perfil.idPerfil"
                  class="invitar-proyecto__perfil-card"
                >
                  <span class="invitar-proyecto__avatar" aria-hidden="true">
                    {{ inicialDePerfil(perfil) }}
                  </span>

                  <span class="invitar-proyecto__perfil-datos">
                    <span class="invitar-proyecto__perfil-nombre">
                      {{ perfil.nombreArtistico || "Perfil sin nombre" }}
                    </span>
                    <span class="invitar-proyecto__perfil-meta">
                      {{ perfil.profesion || "Sin profesión" }}
                      <template v-if="ubicacionDePerfil(perfil)">
                        · {{ ubicacionDePerfil(perfil) }}
                      </template>
                    </span>
                  </span>
                </div>
              </div>

              <p class="invitar-proyecto__nota">
                Se enviará la misma invitación a
                <strong>{{ cantidadPerfilesSeleccionados }}</strong>
                {{
                  cantidadPerfilesSeleccionados === 1 ? "perfil" : "perfiles"
                }}.
              </p>

              <div class="invitar-proyecto__mensaje">
                <label
                  for="mensaje-invitacion"
                  class="invitar-proyecto__campo-label"
                >
                  Mensaje personalizado
                  <span class="invitar-proyecto__opcional">(opcional)</span>
                </label>
                <VaTextarea
                  id="mensaje-invitacion"
                  :model-value="mensaje"
                  placeholder="Contale por qué lo invitas..."
                  :max-length="LIMITE_MENSAJE_INVITACION"
                  counter
                  :rows="5"
                  :error="!!errorMensaje"
                  :error-messages="errorMensaje || undefined"
                  :disabled="enviando"
                  @update:model-value="onMensaje"
                />
              </div>

              <div class="invitar-proyecto__terminos">
                <h3 class="invitar-proyecto__terminos-titulo">
                  Términos y condiciones
                </h3>
                <p class="invitar-proyecto__terminos-ayuda">
                  Si el perfil tiene condiciones vigentes, revisalas y aceptalas
                  antes de enviar la invitación.
                </p>

                <div class="invitar-proyecto__terminos-lista">
                  <AceptacionTerminosPerfil
                    v-for="perfil in perfilesSeleccionados"
                    :key="`tyc-${perfil.idPerfil}`"
                    :id-perfil="perfil.idPerfil"
                    :nombre-perfil="perfil.nombreArtistico || 'Perfil'"
                    :model-value="aceptacionesTerminos[perfil.idPerfil] || null"
                    :terminos-vigentes="terminosVigentes[perfil.idPerfil] || null"
                    :token-refresco="tokenRefrescoTerminos"
                    :deshabilitado="enviando"
                    @update:model-value="onAceptacionTerminos(perfil, $event)"
                    @estado="onEstadoTerminos(perfil, $event)"
                  />
                </div>
              </div>

              <p class="invitar-proyecto__nota">
                Al enviar, cada perfil seleccionado recibe una notificación con
                la invitación.
              </p>
            </section>
          </template>

          <div class="invitar-proyecto__acciones">
            <VaButton
              preset="secondary"
              :disabled="enviando"
              @click="accionIzquierda"
            >
              {{ textoAccionIzquierda }}
            </VaButton>

            <VaButton
              v-if="paso < 3"
              preset="primary"
              :disabled="!puedeContinuar"
              @click="continuar"
            >
              Continuar
            </VaButton>
            <VaButton
              v-else
              preset="primary"
              :loading="enviando"
              :disabled="!puedeEnviar"
              @click="enviarInvitacion"
            >
              Enviar invitación
            </VaButton>
          </div>
        </div>

        <aside class="invitar-proyecto__resumen">
          <h2 class="invitar-proyecto__resumen-titulo">Tu invitación</h2>

          <dl class="invitar-proyecto__resumen-lista">
            <div>
              <dt>Proyecto</dt>
              <dd>{{ nombreProyecto }}</dd>
            </div>
            <div>
              <dt>Tipo</dt>
              <dd>{{ resumenTipo }}</dd>
            </div>
            <div>
              <dt>Requerimiento</dt>
              <dd>{{ resumenRequerimiento }}</dd>
            </div>
            <div>
              <dt>Destinatario</dt>
              <dd>{{ resumenDestinatario }}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </template>

    <ModalResultadoInvitaciones
      :model-value="resultadoBatch.visible"
      :creadas="resultadoBatch.creadas"
      :errores="resultadoBatch.errores"
      :perfiles="perfilesSeleccionados"
      @update:model-value="onCambioVisibilidadResultadoBatch"
    />
  </div>
</template>

<script>
import proyectoService from "../../services/proyectoService.js";
import invitacionService from "../../services/invitacionService.js";
import {
  idPerfilActivo,
  idUsuarioActivo,
  refrescarSesion,
} from "../../services/authState";
import { cargarResumenInvitaciones } from "../../services/invitacionState.js";
import { useToast } from "vuestic-ui";
import BaseAlert from "../../components/AlertaBase.vue";
import EstadoProyectoBadge from "../../components/proyecto/EstadoProyectoBadge.vue";
import BuscadorPerfilInvitacion from "../../components/proyecto/BuscadorPerfilInvitacion.vue";
import BuscadorRequerimientoActividad from "../../components/proyecto/BuscadorRequerimientoActividad.vue";
import ModalResultadoInvitaciones from "../../components/invitacion/ModalResultadoInvitaciones.vue";
import AceptacionTerminosPerfil from "../../components/perfil/AceptacionTerminosPerfil.vue";
import { mensajeErrorApi } from "../../utils/apiError";
import { formatearFechaCorta } from "../../utils/fechas.js";
import { formatUbicacion } from "../../utils/ubicacion.js";
import {
  datosErrorTerminos,
  esErrorTerminos,
} from "../../utils/terminosCondiciones.js";
import {
  ETIQUETAS_TIPO_INVITACION,
  LIMITE_MENSAJE_INVITACION,
  TIPOS_ERROR_INVITACION,
  TIPOS_INVITACION,
  clasificarErrorInvitacion,
  motivoNoInvitable,
  puedeInvitarProyecto,
} from "../../utils/invitacionConstants.js";

let controladorProyecto = null;
let controladorMiembros = null;
let controladorEnvio = null;

const OPCIONES_TIPO = [
  {
    value: TIPOS_INVITACION.GENERAL,
    titulo: "Invitación general",
    descripcion: "Invitás a los perfiles a sumarse al proyecto, sin un rol puntual.",
  },
  {
    value: TIPOS_INVITACION.ACTIVIDAD,
    titulo: "Invitación por actividad",
    descripcion:
      "Invitás a los perfiles para cubrir un requerimiento de una actividad.",
  },
];

/*
 * UC-31: pantalla de invitación a proyecto.
 *
 * El proyecto se fija desde la pestaña Miembros. La pantalla sólo orquesta:
 * el backend valida permisos, estado, membresía, duplicados y profesión.
 */
export default {
  name: "InvitarProyectoView",
  components: {
    BaseAlert,
    EstadoProyectoBadge,
    BuscadorPerfilInvitacion,
    BuscadorRequerimientoActividad,
    ModalResultadoInvitaciones,
    AceptacionTerminosPerfil,
  },
  setup() {
    return { toast: useToast() };
  },
  data() {
    return {
      proyecto: null,
      cargando: true,
      errorCarga: "",
      sinAcceso: false,
      estadoNoEncontrado: false,
      paso: 1,
      tipoInvitacion: null,
      requerimiento: null,
      perfilesSeleccionados: [],
      mensaje: "",
      enviando: false,
      errorEnvio: "",
      campoErrorEnvio: "",
      erroresEnvio: {},
      resultadoBatch: {
        visible: false,
        creadas: [],
        errores: [],
      },
      miembrosActivos: [],
      tokenRefrescoPerfiles: 0,
      tokenRefrescoRequerimientos: 0,
      tokenRefrescoTerminos: 0,
      aceptacionesTerminos: {},
      estadosTerminos: {},
      terminosVigentes: {},
      idCarga: 0,
      TIPOS_INVITACION,
      LIMITE_MENSAJE_INVITACION,
    };
  },
  computed: {
    idProyecto() {
      return this.$route.params.id;
    },
    idUsuarioActual() {
      return idUsuarioActivo();
    },
    nombreProyecto() {
      return this.proyecto?.nombre || "Proyecto";
    },
    nombreDirector() {
      return this.proyecto?.nombreDirector || "—";
    },
    fechaEntrega() {
      return formatearFechaCorta(this.proyecto?.fechaEntregaEstipulada);
    },
    puedeInvitar() {
      return puedeInvitarProyecto(this.proyecto);
    },
    tituloErrorCarga() {
      if (this.estadoNoEncontrado) return "Proyecto no disponible";
      if (this.sinAcceso) return "Sin acceso";
      return "No se pudo cargar el proyecto";
    },
    mostrarReintento() {
      return !this.sinAcceso && !this.estadoNoEncontrado;
    },
    opcionesTipo() {
      return OPCIONES_TIPO;
    },
    pasos() {
      return [
        { numero: 1, etiqueta: "Proyecto y tipo" },
        { numero: 2, etiqueta: "Destinatario" },
        { numero: 3, etiqueta: "Mensaje y confirmación" },
      ].map((item) => ({
        ...item,
        completado: item.numero < this.paso,
        actual: item.numero === this.paso,
      }));
    },
    puedeContinuarPaso1() {
      if (!this.tipoInvitacion) return false;
      if (this.tipoInvitacion === TIPOS_INVITACION.GENERAL) return true;
      return this.requerimiento?.idRequerimiento != null;
    },
    puedeContinuarPaso2() {
      return this.perfilesSeleccionados.length > 0;
    },
    cantidadPerfilesSeleccionados() {
      return this.perfilesSeleccionados.length;
    },
    puedeContinuar() {
      if (this.paso === 1) return this.puedeContinuarPaso1;
      if (this.paso === 2) return this.puedeContinuarPaso2;
      return false;
    },
    terminosListos() {
      if (!this.perfilesSeleccionados.length) return false;
      return this.perfilesSeleccionados.every(
        (perfil) =>
          this.estadosTerminos[String(perfil.idPerfil)]?.listo === true
      );
    },
    puedeEnviar() {
      return (
        !this.enviando &&
        this.puedeContinuarPaso1 &&
        this.puedeContinuarPaso2 &&
        this.terminosListos
      );
    },
    textoAccionIzquierda() {
      return this.paso === 1 ? "Cancelar" : "Volver";
    },
    resumenTipo() {
      return this.tipoInvitacion
        ? ETIQUETAS_TIPO_INVITACION[this.tipoInvitacion] || "—"
        : "—";
    },
    resumenRequerimiento() {
      if (
        this.tipoInvitacion !== TIPOS_INVITACION.ACTIVIDAD ||
        !this.requerimiento
      ) {
        return "—";
      }
      return (
        this.requerimiento.nombreActividad ||
        this.requerimiento.nombreProfesion ||
        "Requerimiento"
      );
    },
    resumenDestinatario() {
      const perfiles = this.perfilesSeleccionados;
      if (!perfiles.length) return "—";
      if (perfiles.length === 1) {
        return perfiles[0]?.nombreArtistico || "1 perfil";
      }
      const primero = perfiles[0]?.nombreArtistico || "Perfil";
      return `${primero} + ${perfiles.length - 1} más`;
    },
    perfilesExcluidos() {
      return (this.miembrosActivos || [])
        .map((miembro) => miembro?.idPerfil)
        .filter((id) => id != null && id !== "");
    },
    errorMensaje() {
      if (this.erroresEnvio?.mensaje) return this.erroresEnvio.mensaje;
      if (this.campoErrorEnvio === "mensaje") return this.errorEnvio;
      return "";
    },
  },
  watch: {
    idProyecto(nuevo, anterior) {
      if (nuevo === anterior) return;
      this.reiniciar();
      this.cargar();
    },
    perfilesSeleccionados(nuevos) {
      const vigentes = new Set(
        (nuevos || []).map((perfil) => String(perfil.idPerfil))
      );
      this.aceptacionesTerminos = this.filtrarPorClaves(
        this.aceptacionesTerminos,
        vigentes
      );
      this.estadosTerminos = this.filtrarPorClaves(
        this.estadosTerminos,
        vigentes
      );
      this.terminosVigentes = this.filtrarPorClaves(
        this.terminosVigentes,
        vigentes
      );
    },
  },
  mounted() {
    this.cargar();
  },
  beforeUnmount() {
    if (controladorProyecto) controladorProyecto.abort();
    if (controladorMiembros) controladorMiembros.abort();
    if (controladorEnvio) controladorEnvio.abort();
  },
  methods: {
    reiniciar() {
      this.proyecto = null;
      this.cargando = true;
      this.errorCarga = "";
      this.sinAcceso = false;
      this.estadoNoEncontrado = false;
      this.paso = 1;
      this.tipoInvitacion = null;
      this.requerimiento = null;
      this.perfilesSeleccionados = [];
      this.mensaje = "";
      this.enviando = false;
      this.errorEnvio = "";
      this.campoErrorEnvio = "";
      this.erroresEnvio = {};
      this.resultadoBatch = { visible: false, creadas: [], errores: [] };
      this.miembrosActivos = [];
      this.aceptacionesTerminos = {};
      this.estadosTerminos = {};
      this.terminosVigentes = {};
      this.tokenRefrescoTerminos = 0;
    },
    filtrarPorClaves(mapa, claves) {
      return Object.fromEntries(
        Object.entries(mapa || {}).filter(([clave]) => claves.has(clave))
      );
    },
    onAceptacionTerminos(perfil, valor) {
      if (!perfil?.idPerfil) return;
      this.aceptacionesTerminos = {
        ...this.aceptacionesTerminos,
        [String(perfil.idPerfil)]: valor,
      };
    },
    onEstadoTerminos(perfil, estado) {
      if (!perfil?.idPerfil) return;
      this.estadosTerminos = {
        ...this.estadosTerminos,
        [String(perfil.idPerfil)]: estado,
      };
    },
    construirAceptacionesTerminos() {
      return this.perfilesSeleccionados.map((perfil) => {
        const aceptacion =
          this.aceptacionesTerminos[String(perfil.idPerfil)] || null;
        const idTyc = Number(aceptacion?.idTyc);
        const tieneVersion = Number.isFinite(idTyc) && idTyc > 0;
        return {
          idPerfil: Number(perfil.idPerfil),
          idTyc: tieneVersion ? idTyc : null,
          aceptaTerminos: tieneVersion && aceptacion?.aceptaTerminos === true,
        };
      });
    },
    manejarTerminosDesactualizados(error) {
      const datos = datosErrorTerminos(error);
      this.errorEnvio =
        datos.mensaje ||
        "Los términos y condiciones del perfil cambiaron. Revisá la versión vigente antes de continuar.";

      const clave =
        datos.idPerfil != null ? String(datos.idPerfil) : null;

      if (
        clave &&
        (datos.idTycVigente != null || datos.esPlantilla) &&
        (datos.descripcionVigente || datos.esPlantilla)
      ) {
        this.aceptacionesTerminos = {
          ...this.aceptacionesTerminos,
          [clave]: null,
        };
        this.estadosTerminos = {
          ...this.estadosTerminos,
          [clave]: { ...this.estadosTerminos[clave], listo: false },
        };
        this.terminosVigentes = {
          ...this.terminosVigentes,
          [clave]: {
            idPerfil: datos.idPerfil,
            idTyc: datos.idTycVigente,
            descripcion: datos.descripcionVigente,
            esPlantilla: datos.esPlantilla,
            fechaInicio: null,
            fechaFin: null,
          },
        };
        return;
      }

      // Si el 409 no trae la versión (p. ej. TERMINOS_NO_ACEPTADOS) o no
      // identifica un perfil, se recargan todas las tarjetas.
      this.aceptacionesTerminos = {};
      this.estadosTerminos = {};
      this.terminosVigentes = {};
      this.tokenRefrescoTerminos += 1;
    },
    async cargar() {
      const corrida = ++this.idCarga;
      if (controladorProyecto) controladorProyecto.abort();
      controladorProyecto = new AbortController();

      this.cargando = true;
      this.errorCarga = "";
      this.sinAcceso = false;
      this.estadoNoEncontrado = false;

      try {
        const response = await proyectoService.obtener(
          this.idProyecto,
          controladorProyecto.signal
        );
        if (corrida !== this.idCarga) return;

        this.proyecto = response?.data || null;
        if (!this.proyecto) {
          this.estadoNoEncontrado = true;
          this.errorCarga = "El proyecto ya no existe o no está disponible.";
          return;
        }

        if (!puedeInvitarProyecto(this.proyecto)) {
          this.sinAcceso = true;
          this.errorCarga = motivoNoInvitable(this.proyecto);
          return;
        }

        await this.cargarMiembrosActivos();
      } catch (error) {
        if (this.esCancelacion(error) || corrida !== this.idCarga) return;
        await this.manejarErrorCarga(error);
      } finally {
        if (corrida === this.idCarga) this.cargando = false;
      }
    },
    async cargarMiembrosActivos() {
      if (controladorMiembros) controladorMiembros.abort();
      controladorMiembros = new AbortController();

      try {
        const response = await proyectoService.listarMiembros(
          this.idProyecto,
          { todos: true },
          controladorMiembros.signal
        );
        const contenido = response?.data?.contenido;
        this.miembrosActivos = Array.isArray(contenido) ? contenido : [];
      } catch (error) {
        if (!this.esCancelacion(error)) this.miembrosActivos = [];
      }
    },
    async manejarErrorCarga(error) {
      const status = error?.response?.status;
      const mensaje = error?.response?.data?.message || "";

      if (status === 401 || error?._esSesionExpirada) {
        await refrescarSesion();
        this.errorCarga = mensajeErrorApi(error);
        this.$router.push({ name: "login" });
        return;
      }

      if (status === 403) {
        this.sinAcceso = true;
        this.errorCarga =
          mensaje || "No tenés acceso a la invitación de este proyecto.";
        return;
      }

      if (status === 404) {
        if (/perfil\s*activo|no hay un perfil activo/i.test(mensaje)) {
          await refrescarSesion();
          this.$router.push({ name: "dashboard-usuario" });
          return;
        }
        this.estadoNoEncontrado = true;
        this.errorCarga = mensaje || "El proyecto ya no existe.";
        return;
      }

      if (status === 409 || /perfil.*(inactiv|baja)/i.test(mensaje)) {
        await refrescarSesion();
        this.$router.push({ name: "dashboard-usuario" });
        return;
      }

      this.errorCarga =
        mensaje ||
        "Ocurrió un error al cargar el proyecto. Inténtalo nuevamente.";
    },
    seleccionarTipo(tipo) {
      if (this.enviando || this.tipoInvitacion === tipo) return;

      this.tipoInvitacion = tipo;
      this.errorEnvio = "";
      this.campoErrorEnvio = "";
      this.erroresEnvio = {};
      this.perfilesSeleccionados = [];
      this.requerimiento = null;
    },
    onRequerimientoSeleccionado(requerimiento) {
      const anterior = this.requerimiento?.idRequerimiento;
      const siguiente = requerimiento?.idRequerimiento ?? null;
      if (String(anterior) !== String(siguiente)) {
        this.perfilesSeleccionados = [];
      }
      this.requerimiento = requerimiento || null;
      this.limpiarErrorEnvio();
    },
    quitarPerfilSeleccionado(perfil) {
      if (this.enviando) return;
      this.perfilesSeleccionados = this.perfilesSeleccionados.filter(
        (item) => String(item.idPerfil) !== String(perfil?.idPerfil)
      );
      this.limpiarErrorEnvio();
    },
    inicialDePerfil(perfil) {
      return (
        String(perfil?.nombreArtistico || "?").trim().charAt(0).toUpperCase() ||
        "?"
      );
    },
    ubicacionDePerfil(perfil) {
      return formatUbicacion(perfil);
    },
    onMensaje(valor) {
      this.mensaje = String(valor || "").slice(0, LIMITE_MENSAJE_INVITACION);
      if (this.campoErrorEnvio === "mensaje") this.limpiarErrorEnvio();
    },
    limpiarErrorEnvio() {
      this.errorEnvio = "";
      this.campoErrorEnvio = "";
      this.erroresEnvio = {};
    },
    continuar() {
      if (!this.puedeContinuar || this.enviando) return;
      this.limpiarErrorEnvio();
      if (this.paso === 1) {
        this.paso = 2;
        return;
      }
      if (this.paso === 2) {
        this.paso = 3;
      }
    },
    accionIzquierda() {
      if (this.enviando) return;
      this.limpiarErrorEnvio();
      if (this.paso === 1) {
        this.volverAlProyecto();
        return;
      }
      this.paso -= 1;
    },
    volverAlProyecto() {
      this.$router.push({
        name: "dashboard-proyecto",
        params: { id: this.idProyecto },
        query: { tab: "integrantes" },
      });
    },
    volverAProyectos() {
      this.$router.push({ name: "proyectos-inicio" });
    },
    async enviarInvitacion() {
      if (!this.puedeEnviar) return;

      const idsPerfilDestinatario = this.perfilesSeleccionados
        .map((perfil) => perfil?.idPerfil)
        .filter((id) => id != null && id !== "");

      if (!idsPerfilDestinatario.length) {
        this.errorEnvio = "Seleccioná al menos un perfil destinatario.";
        this.paso = 2;
        return;
      }

      const esActividad = this.tipoInvitacion === TIPOS_INVITACION.ACTIVIDAD;
      const idRequerimientoActividad = this.requerimiento?.idRequerimiento;
      if (esActividad && idRequerimientoActividad == null) {
        this.errorEnvio = "Seleccioná un requerimiento de actividad.";
        this.paso = 1;
        return;
      }

      this.enviando = true;
      this.limpiarErrorEnvio();
      if (controladorEnvio) controladorEnvio.abort();
      controladorEnvio = new AbortController();

      try {
        const mensaje = this.mensaje.trim().slice(0, LIMITE_MENSAJE_INVITACION);
        const aceptacionesTerminos = this.construirAceptacionesTerminos();
        const response = esActividad
          ? await invitacionService.invitarActividadBatch(
              this.idProyecto,
              {
                idRequerimientoActividad,
                idsPerfilDestinatario,
                mensaje,
                aceptacionesTerminos,
              },
              controladorEnvio.signal
            )
          : await invitacionService.invitarGeneralBatch(
              this.idProyecto,
              { idsPerfilDestinatario, mensaje, aceptacionesTerminos },
              controladorEnvio.signal
            );

        const data = response?.data || {};
        this.resultadoBatch = {
          visible: true,
          creadas: Array.isArray(data.creadas) ? data.creadas : [],
          errores: Array.isArray(data.errores) ? data.errores : [],
        };
        await cargarResumenInvitaciones(idPerfilActivo());
      } catch (error) {
        if (this.esCancelacion(error)) return;
        await this.manejarErrorEnvio(error);
      } finally {
        this.enviando = false;
      }
    },
    onCambioVisibilidadResultadoBatch(valor) {
      if (valor) {
        this.resultadoBatch.visible = true;
        return;
      }
      this.cerrarResultadoBatch();
    },
    cerrarResultadoBatch() {
      this.resultadoBatch = { visible: false, creadas: [], errores: [] };
      this.volverAlProyecto();
    },
    async manejarErrorEnvio(error) {
      if (esErrorTerminos(error)) {
        this.manejarTerminosDesactualizados(error);
        return;
      }

      const clasificacion = clasificarErrorInvitacion(error);
      const { tipo, mensaje, campo, errores } = clasificacion;

      this.erroresEnvio = errores || {};
      this.campoErrorEnvio = campo || "";
      this.errorEnvio = mensaje;

      if (tipo === TIPOS_ERROR_INVITACION.SESION) {
        await refrescarSesion();
        this.$router.push({ name: "login" });
        return;
      }

      if (tipo === TIPOS_ERROR_INVITACION.CUENTA) {
        this.toast.init({
          title: "No se pudo invitar",
          message: mensaje,
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        return;
      }

      if (tipo === TIPOS_ERROR_INVITACION.PERMISO) {
        this.toast.init({
          title: "Sin permiso",
          message: mensaje,
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        this.volverAlProyecto();
        return;
      }

      if (tipo === TIPOS_ERROR_INVITACION.PERFIL_ACTIVO) {
        await refrescarSesion();
        this.$router.push({ name: "dashboard-usuario" });
        return;
      }

      if (tipo === TIPOS_ERROR_INVITACION.PROYECTO_NO_ENCONTRADO) {
        this.toast.init({
          title: "No se pudo invitar",
          message: mensaje,
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        this.volverAProyectos();
        return;
      }

      if (tipo === TIPOS_ERROR_INVITACION.PROYECTO_ESTADO) {
        await this.cargar();
        if (!this.puedeInvitar) {
          this.toast.init({
            title: "Proyecto no disponible",
            message: mensaje,
            color: "danger",
            position: "top-right",
            duration: 6000,
          });
          this.volverAlProyecto();
        }
        return;
      }

      if (
        tipo === TIPOS_ERROR_INVITACION.REQUERIMIENTO_NO_ENCONTRADO ||
        tipo === TIPOS_ERROR_INVITACION.ACTIVIDAD_INVALIDA
      ) {
        this.paso = 1;
        this.requerimiento = null;
        this.perfilesSeleccionados = [];
        this.tokenRefrescoRequerimientos += 1;
        return;
      }

      if (
        tipo === TIPOS_ERROR_INVITACION.DUPLICADA ||
        tipo === TIPOS_ERROR_INVITACION.YA_ES_MIEMBRO ||
        tipo === TIPOS_ERROR_INVITACION.AUTOINVITACION ||
        tipo === TIPOS_ERROR_INVITACION.PERFIL_INACTIVO ||
        tipo === TIPOS_ERROR_INVITACION.PERFIL_NO_ENCONTRADO ||
        tipo === TIPOS_ERROR_INVITACION.PROFESION_INCOMPATIBLE
      ) {
        this.paso = 2;
        this.perfilesSeleccionados = [];
        this.tokenRefrescoPerfiles += 1;
        return;
      }

      if (tipo === TIPOS_ERROR_INVITACION.VALIDACION) {
        if (campo === "mensaje") return;
        if (campo === "idPerfilDestinatario") {
          this.paso = 2;
          this.perfilesSeleccionados = [];
          this.tokenRefrescoPerfiles += 1;
          return;
        }
        if (campo === "idRequerimientoActividad") {
          this.paso = 1;
          this.requerimiento = null;
          this.perfilesSeleccionados = [];
          this.tokenRefrescoRequerimientos += 1;
        }
        return;
      }

      // CONFLICTO / DESCONOCIDO: queda en el paso actual con el mensaje.
    },
    esCancelacion(error) {
      return (
        error?.code === "ERR_CANCELED" ||
        error?.name === "CanceledError" ||
        error?.name === "AbortError"
      );
    },
  },
};
</script>

<style scoped>
.invitar-proyecto {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 1180px;
  margin: 0 auto;
}

.invitar-proyecto__migas {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.82rem;
}

.invitar-proyecto__miga {
  color: var(--color-primary);
  text-decoration: none;
}

.invitar-proyecto__miga:hover {
  text-decoration: underline;
}

.invitar-proyecto__cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.invitar-proyecto__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1.55rem;
  font-weight: 700;
  line-height: 1.2;
}

.invitar-proyecto__stepper {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0.25rem 0 0.55rem;
}

.invitar-proyecto__paso {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  flex: 0 0 auto;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  font-weight: 500;
}

.invitar-proyecto__paso-circulo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 2px solid var(--color-border-strong);
  border-radius: 50%;
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-size: 0.78rem;
  font-weight: 700;
}

.invitar-proyecto__paso--completado .invitar-proyecto__paso-circulo {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: #fff;
}

.invitar-proyecto__paso--completado
  .invitar-proyecto__paso-circulo
  .material-symbols-outlined {
  font-size: 16px;
}

.invitar-proyecto__paso--actual .invitar-proyecto__paso-circulo {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.invitar-proyecto__paso--actual .invitar-proyecto__paso-etiqueta {
  color: var(--color-text);
  font-weight: 700;
}

.invitar-proyecto__linea {
  flex: 1 1 80px;
  height: 2px;
  min-width: 32px;
  margin: 0 0.75rem;
  background: var(--color-border-strong);
}

.invitar-proyecto__linea--completada {
  background: var(--color-primary);
}

.invitar-proyecto__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 1.25rem;
  align-items: start;
}

.invitar-proyecto__contenido {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
}

.invitar-proyecto__alerta {
  margin: 0 !important;
}

.invitar-proyecto__panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.25rem 1.35rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
}

.invitar-proyecto__seccion-titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1.05rem;
  font-weight: 700;
}

.invitar-proyecto__seccion-ayuda {
  margin: -0.6rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.82rem;
  line-height: 1.45;
}

.invitar-proyecto__proyecto-card {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 1rem 1.1rem;
  border: 1.5px solid var(--color-primary);
  border-radius: 10px;
  background: var(--color-info-soft);
}

.invitar-proyecto__proyecto-info {
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
  min-width: 0;
  flex: 1;
}

.invitar-proyecto__proyecto-nombre {
  color: var(--color-text);
  font-size: 0.95rem;
  font-weight: 700;
}

.invitar-proyecto__proyecto-meta {
  color: var(--color-text-muted);
  font-size: 0.78rem;
  line-height: 1.4;
}

.invitar-proyecto__radio {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-border-strong);
  border-radius: 50%;
  background: var(--color-surface);
}

.invitar-proyecto__radio--activo {
  border-color: var(--color-primary);
}

.invitar-proyecto__radio-punto {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--color-primary);
}

.invitar-proyecto__opciones {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.invitar-proyecto__opcion {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  width: 100%;
  padding: 0.9rem 1rem;
  border: 1px solid var(--color-border-strong);
  border-radius: 10px;
  background: var(--color-surface);
  color: var(--color-text);
  text-align: left;
  cursor: pointer;
}

.invitar-proyecto__opcion:hover {
  border-color: var(--color-primary);
}

.invitar-proyecto__opcion--seleccionada {
  border-color: var(--color-primary);
  background: var(--color-info-soft);
}

.invitar-proyecto__opcion .invitar-proyecto__radio {
  margin-top: 0.1rem;
}

.invitar-proyecto__opcion-texto {
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
}

.invitar-proyecto__opcion-titulo {
  font-size: 0.9rem;
  font-weight: 700;
}

.invitar-proyecto__opcion-descripcion {
  color: var(--color-text-muted);
  font-size: 0.8rem;
  line-height: 1.45;
}

.invitar-proyecto__requerimiento {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding-top: 0.25rem;
}

.invitar-proyecto__campo-label {
  margin: 0;
  color: var(--color-text);
  font-size: 0.82rem;
  font-weight: 700;
}

.invitar-proyecto__opcional {
  color: var(--color-text-muted);
  font-weight: 500;
}

.invitar-proyecto__seleccion {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding: 0.75rem 0.85rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface-soft);
}

.invitar-proyecto__seleccion-titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 0.8rem;
  font-weight: 700;
}

.invitar-proyecto__seleccion-lista {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.invitar-proyecto__seleccion-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.18rem 0.35rem 0.18rem 0.55rem;
  border: 1px solid var(--color-info-border);
  border-radius: 999px;
  background: var(--color-info-soft);
  color: var(--color-info-text);
  font-size: 0.74rem;
  font-weight: 600;
}

.invitar-proyecto__seleccion-quitar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.invitar-proyecto__seleccion-quitar:hover {
  background: color-mix(in srgb, currentColor 15%, transparent);
}

.invitar-proyecto__seleccion-quitar .material-symbols-outlined {
  font-size: 0.9rem;
}

.invitar-proyecto__perfiles-resumen {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  max-height: 320px;
  overflow-y: auto;
  padding-right: 0.2rem;
}

.invitar-proyecto__perfil-card {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.75rem 0.9rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface-muted);
}

.invitar-proyecto__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  overflow: hidden;
  border-radius: 50%;
  background: var(--color-primary-soft, var(--color-info-soft));
  color: var(--color-primary);
  font-size: 0.9rem;
  font-weight: 700;
}

.invitar-proyecto__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.invitar-proyecto__perfil-datos {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.invitar-proyecto__perfil-nombre {
  color: var(--color-text);
  font-size: 0.94rem;
  font-weight: 700;
}

.invitar-proyecto__perfil-meta {
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.invitar-proyecto__mensaje {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.invitar-proyecto__nota {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.8rem;
  line-height: 1.45;
}

.invitar-proyecto__terminos {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  margin-top: 0.25rem;
}

.invitar-proyecto__terminos-titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 0.88rem;
  font-weight: 700;
}

.invitar-proyecto__terminos-ayuda {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.8rem;
  line-height: 1.45;
}

.invitar-proyecto__terminos-lista {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.invitar-proyecto__acciones {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-top: 0.25rem;
}

.invitar-proyecto__resumen {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.25rem 1.35rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  position: sticky;
  top: 1rem;
}

.invitar-proyecto__resumen-titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1rem;
  font-weight: 700;
}

.invitar-proyecto__resumen-lista {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  margin: 0;
}

.invitar-proyecto__resumen-lista div {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.invitar-proyecto__resumen-lista dt {
  color: var(--color-text-muted);
  font-size: 0.72rem;
  font-weight: 600;
}

.invitar-proyecto__resumen-lista dd {
  margin: 0;
  color: var(--color-text);
  font-size: 0.86rem;
  font-weight: 700;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.invitar-proyecto__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 3rem 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  color: var(--color-text-muted);
  text-align: center;
}

.invitar-proyecto__estado-icono {
  font-size: 2rem;
}

.invitar-proyecto__estado-titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1rem;
  font-weight: 700;
}

.invitar-proyecto__estado-texto {
  margin: 0;
  max-width: 34rem;
  font-size: 0.86rem;
  line-height: 1.5;
}

.invitar-proyecto__estado-acciones {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 0.35rem;
}

@media (max-width: 900px) {
  .invitar-proyecto__layout {
    grid-template-columns: 1fr;
  }

  .invitar-proyecto__resumen {
    position: static;
  }
}

@media (max-width: 640px) {
  .invitar-proyecto__stepper {
    flex-wrap: wrap;
    row-gap: 0.65rem;
  }

  .invitar-proyecto__linea {
    flex-basis: 24px;
    min-width: 20px;
  }

  .invitar-proyecto__proyecto-card {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .invitar-proyecto__acciones {
    flex-direction: column-reverse;
    align-items: stretch;
  }
}
</style>
