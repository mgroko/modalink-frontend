<template>
  <div class="detalle-contrato">
    <p class="detalle-contrato__migas">
      <router-link :to="{ name: 'proyectos-inicio' }" class="detalle-contrato__miga">
        Proyectos
      </router-link>
      <span aria-hidden="true">›</span>
      <router-link :to="rutaVolver" class="detalle-contrato__miga">
        Contratos
      </router-link>
      <span aria-hidden="true">›</span>
      <span>Detalle</span>
    </p>

    <div v-if="cargando" class="detalle-contrato__estado">
      <span class="material-symbols-outlined detalle-contrato__estado-icono">
        hourglass_empty
      </span>
      Cargando contrato...
    </div>

    <section v-else-if="error || sinAcceso" class="detalle-contrato__estado">
      <span class="material-symbols-outlined detalle-contrato__estado-icono">
        {{ estadoNoEncontrado ? "description" : "lock" }}
      </span>
      <h1 class="detalle-contrato__estado-titulo">{{ tituloError }}</h1>
      <p class="detalle-contrato__estado-texto">{{ error }}</p>
      <div class="detalle-contrato__estado-acciones">
        <VaButton
          v-if="puedeReintentar"
          preset="secondary"
          @click="cargar"
        >
          Reintentar
        </VaButton>
        <VaButton preset="primary" @click="volverAContratos">
          Volver a Contratos
        </VaButton>
      </div>
    </section>

    <template v-else-if="contrato">
      <header class="detalle-contrato__cabecera">
        <div class="detalle-contrato__cabecera-texto">
          <h1 class="detalle-contrato__titulo">
            {{ contrato.nombre || `Contrato #${contrato.idContrato}` }}
          </h1>
          <div class="detalle-contrato__estado-fila">
            <EstadoContratoBadge :estado="contrato.estado" />
          </div>
          <p class="detalle-contrato__subtitulo">
            {{ contrato.nombreProyecto || `Proyecto #${contrato.idProyecto}` }}
            <template v-if="contrato.nombreTipoAcuerdo">
              · {{ contrato.nombreTipoAcuerdo }}
            </template>
          </p>
        </div>

        <div class="detalle-contrato__acciones">
          <VaButton
            preset="secondary"
            :disabled="!puedeModificar"
            @click="irAModificar"
          >
            Modificar
          </VaButton>

          <VaButton
            v-if="puedeEliminar"
            preset="secondary"
            color="danger"
            @click="abrirEliminar"
          >
            Eliminar
          </VaButton>

          <VaButton preset="secondary" @click="volverAContratos">
            Volver
          </VaButton>
        </div>
      </header>

      <BaseAlert
        v-if="estaEliminado"
        class="detalle-contrato__alerta-estado"
        :message="mensajeEliminado"
        type="warning"
      />
      <BaseAlert
        v-else-if="proyectoFinalizado"
        class="detalle-contrato__alerta-estado"
        message="El proyecto está finalizado o cancelado: el contrato se conserva como registro histórico y no admite acciones."
        type="warning"
      />
      <BaseAlert
        v-else-if="estaActivo"
        class="detalle-contrato__alerta-estado"
        message="El contrato está activo: todas las partes completaron su firma."
        type="success"
      />
      <BaseAlert
        v-else-if="estaRechazado"
        class="detalle-contrato__alerta-estado"
        message="El contrato fue rechazado por las partes."
        type="warning"
      />
      <BaseAlert
        v-else-if="miFirmaRegistrada"
        class="detalle-contrato__alerta-estado"
        message="Tu firma está registrada. El contrato sigue pendiente de las demás partes."
        type="success"
      />

      <section class="detalle-contrato__panel">
        <h2 class="detalle-contrato__seccion-titulo">Datos del contrato</h2>

        <dl class="detalle-contrato__grilla">
          <div>
            <dt>Tipo</dt>
            <dd>{{ contrato.nombreTipoAcuerdo || "—" }}</dd>
          </div>
          <div>
            <dt>Emisor</dt>
            <dd>{{ nombreEmisor }}</dd>
          </div>
          <div>
            <dt>Versión</dt>
            <dd>{{ contrato.versionActual ?? "—" }}</dd>
          </div>
          <div>
            <dt>Emisión</dt>
            <dd>{{ formatearFecha(contrato.fechaEmision) || "—" }}</dd>
          </div>
          <div v-if="contrato.fechaBaja">
            <dt>Baja</dt>
            <dd>{{ formatearFecha(contrato.fechaBaja) }}</dd>
          </div>
        </dl>

        <ProgresoFirmasContrato
          class="detalle-contrato__progreso"
          :firmados="contrato.firmados"
          :total-partes="contrato.totalPartes"
        />
      </section>

      <section class="detalle-contrato__panel">
        <div class="detalle-contrato__seccion-cabecera">
          <h2 class="detalle-contrato__seccion-titulo">Texto del contrato</h2>
          <span v-if="contrato.texto" class="detalle-contrato__chip-lectura">
            Lectura completa
          </span>
        </div>
        <div class="detalle-contrato__texto">{{ contrato.texto || "Sin texto." }}</div>
      </section>

      <section class="detalle-contrato__panel">
        <h2 class="detalle-contrato__seccion-titulo">Partes y firmas</h2>
        <PartesContrato :partes="partesVisibles" compacta />

        <button
          v-if="hayMasPartes"
          type="button"
          class="detalle-contrato__ver-partes"
          @click="mostrarTodasPartes = !mostrarTodasPartes"
        >
          {{
            mostrarTodasPartes
              ? "Ver menos"
              : `Ver las ${contrato.partes.length} partes`
          }}
        </button>
      </section>

      <section
        v-if="mostrarTuFirma"
        class="detalle-contrato__tu-firma"
        aria-labelledby="detalle-contrato-tu-firma"
      >
        <h2 id="detalle-contrato-tu-firma" class="detalle-contrato__seccion-titulo">
          Tu firma
        </h2>
        <p class="detalle-contrato__firma-intro">
          Al firmar aceptás el texto de la versión
          {{ contrato.versionActual ?? 1 }} de este contrato. La firma queda
          registrada con fecha y hora.
        </p>

        <label class="detalle-contrato__aceptacion">
          <VaCheckbox
            v-model="aceptaContrato"
            :disabled="firmando || rechazando"
          />
          <span>Leí el contrato completo y estoy de acuerdo con su contenido.</span>
        </label>

        <BaseAlert
          v-if="errorFirma"
          :message="errorFirma"
          type="error"
          class="detalle-contrato__firma-error"
        />

        <div class="detalle-contrato__firma-acciones">
          <VaButton
            v-if="puedeRechazar"
            preset="secondary"
            color="danger"
            :disabled="firmando || rechazando"
            @click="abrirRechazar"
          >
            Rechazar contrato
          </VaButton>
          <VaButton
            v-if="puedeFirmar"
            preset="primary"
            :loading="firmando"
            :disabled="!aceptaContrato || firmando || rechazando"
            :aria-busy="firmando ? 'true' : 'false'"
            @click="confirmarFirma"
          >
            Firmar contrato
          </VaButton>
        </div>

        <p v-if="puedeModificar" class="detalle-contrato__firma-nota">
          ¿Necesitás cambios antes de firmar? Usá “Modificar”, arriba, para
          ajustar el texto.
        </p>
      </section>

      <section
        v-if="contrato.motivoRechazo || contrato.fechaRechazo"
        class="detalle-contrato__panel"
      >
        <h2 class="detalle-contrato__seccion-titulo">Rechazo</h2>
        <dl class="detalle-contrato__grilla">
          <div v-if="contrato.fechaRechazo">
            <dt>Fecha de rechazo</dt>
            <dd>{{ formatearFecha(contrato.fechaRechazo) }}</dd>
          </div>
          <div v-if="contrato.motivoRechazo">
            <dt>Motivo</dt>
            <dd>{{ contrato.motivoRechazo }}</dd>
          </div>
        </dl>
      </section>
    </template>

    <ModalRechazarContrato
      v-model="modalRechazarVisible"
      :contrato="contrato"
      :rechazando="rechazando"
      :error="errorRechazo"
      :error-campo="errorMotivoRechazo"
      @confirmar="confirmarRechazo"
      @limpiar-error="limpiarErrorRechazo"
    />

    <ModalEliminarContrato
      v-model="modalEliminarVisible"
      :contrato="contrato"
      :eliminando="eliminando"
      :error="errorEliminar"
      @confirmar="confirmarEliminar"
    />
  </div>
</template>

<script>
import BaseAlert from "../../components/AlertaBase.vue";
import EstadoContratoBadge from "../../components/contrato/EstadoContratoBadge.vue";
import PartesContrato from "../../components/contrato/PartesContrato.vue";
import ProgresoFirmasContrato from "../../components/contrato/ProgresoFirmasContrato.vue";
import ModalRechazarContrato from "../../components/contrato/ModalRechazarContrato.vue";
import ModalEliminarContrato from "../../components/contrato/ModalEliminarContrato.vue";
import contratoService from "../../services/contratoService.js";
import perfilService from "../../services/perfilService.js";
import { refrescarSesion } from "../../services/authState";
import { useToast } from "vuestic-ui";
import { mensajeErrorApi } from "../../utils/apiError";
import { formatearFecha } from "../../utils/fechas.js";
import {
  CODIGOS_CONTRATO,
  ESTADOS_CONTRATO,
  clasificarErrorContrato,
  esErrorEstadoFirmaObsoleto,
  esPerfilEnBaja,
  mensajeErrorContrato,
  nombreEmisorContrato,
  normalizarDetalleContrato,
  puedeModificarContrato,
} from "../../utils/contratoConstants.js";
import {
  conVolver,
  leerVolver,
  resolverVolver,
} from "../../utils/navegacionContratos.js";

let controladorDetalle = null;

/*
 * Detalle común de UC-53/UC-55/UC-68. Muestra el texto legal, las partes y
 * los flags del backend. Las acciones de firma y rechazo se muestran sólo si
 * `puedeFirmar` / `puedeRechazar` son true.
 */
export default {
  name: "DetalleContratoView",
  components: {
    BaseAlert,
    EstadoContratoBadge,
    PartesContrato,
    ProgresoFirmasContrato,
    ModalRechazarContrato,
    ModalEliminarContrato,
  },
  setup() {
    return { toast: useToast() };
  },
  data() {
    return {
      contrato: null,
      cargando: true,
      error: "",
      sinAcceso: false,
      estadoNoEncontrado: false,
      puedeReintentar: false,
      idCarga: 0,
      modalRechazarVisible: false,
      modalEliminarVisible: false,
      eliminando: false,
      errorEliminar: "",
      firmando: false,
      rechazando: false,
      aceptaContrato: false,
      mostrarTodasPartes: false,
      errorFirma: "",
      errorRechazo: "",
      errorMotivoRechazo: "",
      nombresArtisticos: {},
    };
  },
  computed: {
    idProyecto() {
      return this.$route.params.idProyecto;
    },
    idContrato() {
      return this.$route.params.idContrato;
    },
    rutaContratos() {
      return {
        name: "buscar-contratos",
        query: this.idProyecto ? { idProyecto: this.idProyecto } : {},
      };
    },
    rutaVolver() {
      return resolverVolver({
        route: this.$route,
        router: this.$router,
        idProyecto: this.idProyecto,
        fallback: this.rutaContratos,
      });
    },
    estaActivo() {
      return this.contrato?.estado === ESTADOS_CONTRATO.ACTIVO;
    },
    estaRechazado() {
      return this.contrato?.estado === ESTADOS_CONTRATO.RECHAZADO_POR_PARTES;
    },
    estaEliminado() {
      return this.contrato?.estado === ESTADOS_CONTRATO.ELIMINADO;
    },
    proyectoFinalizado() {
      const estado = String(this.contrato?.estadoProyecto || "").toUpperCase();
      return estado === "FINALIZADO" || estado === "CANCELADO";
    },
    mensajeEliminado() {
      const fecha = this.contrato?.fechaBaja
        ? ` el ${formatearFecha(this.contrato.fechaBaja)}`
        : "";
      return `Este contrato fue eliminado${fecha}. Se conserva como registro histórico.`;
    },
    miFirmaRegistrada() {
      return this.contrato?.miEstadoFirma === "FIRMADO";
    },
    puedeFirmar() {
      return this.contrato?.puedeFirmar === true;
    },
    puedeRechazar() {
      return this.contrato?.puedeRechazar === true;
    },
    mostrarTuFirma() {
      return this.puedeFirmar || this.puedeRechazar;
    },
    partesVisibles() {
      const partes = Array.isArray(this.contrato?.partes)
        ? this.contrato.partes
        : [];
      const conNombreArtistico = partes.map((parte) => ({
        ...parte,
        nombreArtistico:
          parte.nombreArtistico ||
          this.nombresArtisticos[String(parte.idPerfil)] ||
          "",
      }));
      return this.mostrarTodasPartes
        ? conNombreArtistico
        : conNombreArtistico.slice(0, 3);
    },
    hayMasPartes() {
      return (this.contrato?.partes?.length || 0) > 3;
    },
    puedeModificar() {
      return puedeModificarContrato(this.contrato);
    },
    puedeEliminar() {
      return this.contrato?.puedeEliminar === true;
    },
    nombreEmisor() {
      return nombreEmisorContrato(this.contrato?.emisor);
    },
    tituloError() {
      if (this.estadoNoEncontrado) return "Contrato no disponible";
      if (this.sinAcceso) return "No se puede ver el contrato";
      return "No se pudo cargar el contrato";
    },
  },
  watch: {
    idContrato(nuevo, anterior) {
      if (nuevo === anterior) return;
      this.cargar();
    },
  },
  mounted() {
    this.cargar();
  },
  beforeUnmount() {
    if (controladorDetalle) controladorDetalle.abort();
    if (this.controladorNombres) this.controladorNombres.abort();
  },
  methods: {
    formatearFecha,
    async cargar() {
      const corrida = ++this.idCarga;
      if (controladorDetalle) controladorDetalle.abort();
      controladorDetalle = new AbortController();

      this.cargando = true;
      this.error = "";
      this.sinAcceso = false;
      this.estadoNoEncontrado = false;
      this.puedeReintentar = false;
      this.aceptaContrato = false;
      this.mostrarTodasPartes = false;
      this.errorFirma = "";
      this.nombresArtisticos = {};

      try {
        const response = await contratoService.obtenerDetalle(
          this.idProyecto,
          this.idContrato,
          controladorDetalle.signal
        );
        if (corrida !== this.idCarga) return;

        this.contrato = normalizarDetalleContrato(response?.data);
        if (!this.contrato.idContrato) {
          this.estadoNoEncontrado = true;
          this.error = "El contrato ya no existe o no está disponible.";
        } else {
          // Best-effort: el detalle puede no traer el nombre artístico de cada
          // parte. Se completa desde el perfil sin bloquear el render.
          void this.cargarNombresArtisticos(this.contrato, corrida);
        }
      } catch (error) {
        if (this.esCancelacion(error) || corrida !== this.idCarga) return;
        await this.manejarErrorCarga(error);
      } finally {
        if (corrida === this.idCarga) this.cargando = false;
      }
    },
    async manejarErrorCarga(error) {
      const status = error?.response?.status;
      const clasificacion = clasificarErrorContrato(error);

      if (error?._esSesionExpirada) {
        await refrescarSesion();
        this.$router.push({ name: "login" });
        return;
      }

      if (
        status === 404 &&
        (clasificacion.codigo === CODIGOS_CONTRATO.PERFIL_ACTIVO_NO_SELECCIONADO ||
          clasificacion.codigo === CODIGOS_CONTRATO.PERFIL_NO_ENCONTRADO)
      ) {
        await refrescarSesion();
        this.$router.push({ name: "dashboard-usuario" });
        return;
      }

      if (status === 403) {
        this.sinAcceso = true;
        this.error =
          clasificacion.mensaje ||
          "No tenés permiso para ver este contrato.";
        return;
      }

      if (status === 404) {
        this.estadoNoEncontrado = true;
        this.error =
          clasificacion.mensaje ||
          "El contrato no existe o pertenece a otro proyecto.";
        return;
      }

      if (status === 409) {
        if (esPerfilEnBaja(clasificacion.codigo)) {
          await refrescarSesion();
          this.$router.push({ name: "dashboard-usuario" });
          return;
        }
        this.sinAcceso = true;
        this.error =
          clasificacion.mensaje || "El perfil no se encuentra activo.";
        return;
      }

      this.error = mensajeErrorApi(
        error,
        "Ocurrió un error al cargar el contrato. Inténtalo nuevamente."
      );
      this.puedeReintentar = !status || status >= 500;
    },
    async cargarNombresArtisticos(contrato, corrida) {
      const partes = Array.isArray(contrato?.partes) ? contrato.partes : [];
      const mapa = {};
      const faltantes = [];

      partes.forEach((parte) => {
        const id = Number(parte?.idPerfil);
        if (!Number.isFinite(id) || id <= 0) return;
        if (parte?.nombreArtistico) {
          mapa[String(id)] = parte.nombreArtistico;
          return;
        }
        if (!mapa[String(id)] && !faltantes.includes(id)) faltantes.push(id);
      });

      this.nombresArtisticos = mapa;
      if (!faltantes.length) return;

      if (this.controladorNombres) this.controladorNombres.abort();
      this.controladorNombres = new AbortController();
      const signal = this.controladorNombres.signal;

      const resultados = await Promise.allSettled(
        faltantes.map((id) => perfilService.obtener(id, signal))
      );
      if (corrida !== this.idCarga || signal.aborted) return;

      const nombres = { ...mapa };
      resultados.forEach((resultado, indice) => {
        if (resultado.status !== "fulfilled") return;
        const nombreArtistico = resultado.value?.data?.nombreArtistico;
        if (nombreArtistico) {
          nombres[String(faltantes[indice])] = nombreArtistico;
        }
      });
      this.nombresArtisticos = nombres;
    },
    irAModificar() {
      if (!this.puedeModificar || this.contrato?.idContrato == null) return;
      this.$router.push(
        conVolver(
          {
            name: "modificar-contrato",
            params: {
              idProyecto: this.idProyecto,
              idContrato: this.contrato.idContrato,
            },
          },
          leerVolver(this.$route)
        )
      );
    },
    volverAContratos() {
      this.$router.push(this.rutaVolver);
    },
    abrirRechazar() {
      this.errorRechazo = "";
      this.errorMotivoRechazo = "";
      this.modalRechazarVisible = true;
    },
    limpiarErrorRechazo() {
      this.errorRechazo = "";
      this.errorMotivoRechazo = "";
    },
    volverAlOrigen() {
      this.$router.push(this.rutaVolver);
    },
    async confirmarFirma() {
      if (
        this.firmando ||
        !this.puedeFirmar ||
        !this.aceptaContrato
      ) {
        return;
      }
      this.firmando = true;
      this.errorFirma = "";

      try {
        const response = await contratoService.firmar(
          this.idProyecto,
          this.idContrato
        );
        const detalle = normalizarDetalleContrato(response?.data);
        if (detalle.idContrato) {
          this.contrato = detalle;
        } else {
          await this.cargar();
        }
        this.toast.init({
          title: "Contrato firmado",
          message: this.estaActivo
            ? "Tu firma quedó registrada y el contrato pasó a Activo."
            : "Tu firma quedó registrada.",
          color: "success",
          position: "top-right",
          duration: 5000,
        });
        this.volverAlOrigen();
      } catch (error) {
        if (this.esCancelacion(error)) return;
        this.errorFirma = await this.manejarErrorAccion(error, true);
      } finally {
        this.firmando = false;
      }
    },
    async confirmarRechazo(motivo) {
      if (this.rechazando) return;
      this.rechazando = true;
      this.errorRechazo = "";
      this.errorMotivoRechazo = "";

      try {
        const response = await contratoService.rechazar(
          this.idProyecto,
          this.idContrato,
          motivo
        );
        const detalle = normalizarDetalleContrato(response?.data);
        if (detalle.idContrato) {
          this.contrato = detalle;
        } else {
          await this.cargar();
        }
        this.modalRechazarVisible = false;
        this.toast.init({
          title: "Contrato rechazado",
          message: "El rechazo quedó registrado y el contrato fue notificado.",
          color: "success",
          position: "top-right",
          duration: 5000,
        });
        this.volverAlOrigen();
      } catch (error) {
        if (this.esCancelacion(error)) return;
        this.errorRechazo = await this.manejarErrorAccion(error, false);
      } finally {
        this.rechazando = false;
      }
    },
    async manejarErrorAccion(error, esFirma) {
      const status = error?.response?.status;
      const clasificacion = clasificarErrorContrato(error);
      const mensaje = mensajeErrorContrato(
        error,
        esFirma
          ? "No se pudo firmar el contrato."
          : "No se pudo rechazar el contrato."
      );

      if (error?._esSesionExpirada) {
        await refrescarSesion();
        this.$router.push({ name: "login" });
        return "";
      }

      if (esPerfilEnBaja(clasificacion.codigo)) {
        this.modalRechazarVisible = false;
        await refrescarSesion();
        this.$router.push({ name: "dashboard-usuario" });
        return "";
      }

      if (status === 403) {
        this.modalRechazarVisible = false;
        this.toast.init({
          title: "Sin acceso",
          message:
            clasificacion.mensaje ||
            "Ya no tenés acceso a este contrato.",
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        this.volverAlOrigen();
        return "";
      }

      if (status === 404) {
        this.modalRechazarVisible = false;
        this.toast.init({
          title: "Contrato no disponible",
          message: mensaje,
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        this.volverAlOrigen();
        return "";
      }

      if (esErrorEstadoFirmaObsoleto(clasificacion.codigo)) {
        this.modalRechazarVisible = false;
        this.toast.init({
          title: "El contrato cambió",
          message: mensaje,
          color: "warning",
          position: "top-right",
          duration: 6000,
        });
        this.volverAlOrigen();
        return "";
      }

      if (
        !esFirma &&
        (status === 400 ||
          clasificacion.codigo === CODIGOS_CONTRATO.MOTIVO_RECHAZO_OBLIGATORIO)
      ) {
        this.errorMotivoRechazo = mensaje;
        return "";
      }

      return mensaje;
    },
    abrirEliminar() {
      if (!this.puedeEliminar || this.eliminando) return;
      this.errorEliminar = "";
      this.modalEliminarVisible = true;
    },
    async confirmarEliminar() {
      if (!this.puedeEliminar || this.eliminando) return;
      this.eliminando = true;
      this.errorEliminar = "";

      try {
        await contratoService.eliminar(this.idProyecto, this.idContrato);
        this.modalEliminarVisible = false;
        this.toast.init({
          title: "Contrato eliminado",
          message: "El contrato quedó en estado Eliminado.",
          color: "success",
          position: "top-right",
          duration: 5000,
        });
        this.$router.push(this.rutaVolver);
      } catch (error) {
        if (this.esCancelacion(error)) return;
        await this.manejarErrorEliminar(error);
      } finally {
        this.eliminando = false;
      }
    },
    async manejarErrorEliminar(error) {
      const status = error?.response?.status;
      const clasificacion = clasificarErrorContrato(error);
      const mensaje =
        clasificacion.mensaje ||
        mensajeErrorApi(
          error,
          "No se pudo eliminar el contrato. Inténtalo nuevamente."
        );

      if (error?._esSesionExpirada) {
        await refrescarSesion();
        this.$router.push({ name: "login" });
        return;
      }

      if (esPerfilEnBaja(clasificacion.codigo)) {
        this.modalEliminarVisible = false;
        await refrescarSesion();
        this.$router.push({ name: "dashboard-usuario" });
        return;
      }

      if (
        clasificacion.codigo === CODIGOS_CONTRATO.CONTRATO_YA_ELIMINADO
      ) {
        this.modalEliminarVisible = false;
        this.toast.init({
          title: "Contrato eliminado",
          message: "El contrato ya estaba eliminado.",
          color: "success",
          position: "top-right",
          duration: 5000,
        });
        this.$router.push(this.rutaVolver);
        return;
      }

      if (
        status === 403 ||
        status === 404 ||
        clasificacion.codigo ===
          CODIGOS_CONTRATO.PROYECTO_NO_APTO_PARA_ELIMINACION
      ) {
        this.modalEliminarVisible = false;
        this.toast.init({
          title: "No se pudo eliminar",
          message: mensaje,
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        if (
          clasificacion.codigo ===
          CODIGOS_CONTRATO.PROYECTO_NO_APTO_PARA_ELIMINACION
        ) {
          await this.cargar();
        } else {
          this.$router.push(this.rutaVolver);
        }
        return;
      }

      this.errorEliminar = mensaje;
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
.detalle-contrato {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  margin: 0 auto;
}

.detalle-contrato__alerta-estado {
  margin: 0 !important;
}

.detalle-contrato__migas {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.82rem;
}

.detalle-contrato__miga {
  color: var(--color-primary);
  text-decoration: none;
}

.detalle-contrato__miga:hover {
  text-decoration: underline;
}

.detalle-contrato__cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.4rem 1.5rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  flex-wrap: wrap;
}

.detalle-contrato__cabecera-texto {
  flex: 1;
  min-width: 260px;
}

.detalle-contrato__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: clamp(1.45rem, 2.2vw, 1.75rem);
  font-weight: 700;
  line-height: 1.25;
}

.detalle-contrato__estado-fila {
  display: flex;
  align-items: center;
  margin-top: 0.55rem;
}

.detalle-contrato__subtitulo {
  margin: 0.55rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.84rem;
  line-height: 1.5;
}

.detalle-contrato__acciones {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.detalle-contrato__panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.3rem 1.5rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
}

.detalle-contrato__seccion-titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1rem;
  font-weight: 700;
}

.detalle-contrato__seccion-cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.detalle-contrato__chip-lectura {
  display: inline-flex;
  align-items: center;
  padding: 0.16rem 0.55rem;
  border: 1px solid var(--color-success-border);
  border-radius: 999px;
  background: var(--color-success-soft);
  color: var(--color-success-text);
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
}

.detalle-contrato__grilla {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  margin: 0;
}

.detalle-contrato__grilla dt {
  color: var(--color-text-muted);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.detalle-contrato__grilla dd {
  margin: 0.2rem 0 0;
  color: var(--color-text);
  font-size: 0.86rem;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.detalle-contrato__progreso {
  padding-top: 0.25rem;
}

.detalle-contrato__texto {
  padding: 1.4rem 1.6rem;
  border: 1px solid var(--color-border-soft);
  border-radius: 10px;
  background: var(--color-surface-soft);
  color: var(--color-text);
  font-size: 0.86rem;
  line-height: 1.7;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.detalle-contrato__ver-partes {
  align-self: flex-start;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-primary);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  text-align: left;
}

.detalle-contrato__ver-partes:hover,
.detalle-contrato__ver-partes:focus-visible {
  text-decoration: underline;
}

.detalle-contrato__tu-firma {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding: 1.3rem 1.5rem;
  border: 1px solid var(--color-primary);
  border-radius: 12px;
  background: var(--color-surface);
}

.detalle-contrato__firma-intro {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.84rem;
  line-height: 1.5;
}

.detalle-contrato__aceptacion {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  padding: 0.75rem 0.9rem;
  border: 1px solid var(--color-border-soft);
  border-radius: 8px;
  background: var(--color-surface-muted);
  color: var(--color-text);
  font-size: 0.84rem;
  line-height: 1.45;
  cursor: pointer;
}

.detalle-contrato__aceptacion :deep(.va-checkbox) {
  flex-shrink: 0;
}

.detalle-contrato__firma-error {
  margin: 0 !important;
}

.detalle-contrato__firma-acciones {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.detalle-contrato__firma-nota {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.78rem;
  line-height: 1.45;
}

.detalle-contrato__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  padding: 2.5rem 1.25rem;
  border: 1px dashed var(--color-border-strong);
  border-radius: 12px;
  background: var(--color-surface-soft);
  color: var(--color-text-muted);
  text-align: center;
}

.detalle-contrato__estado-icono {
  font-size: 2rem;
  color: var(--color-text-subtle);
}

.detalle-contrato__estado-titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1.05rem;
}

.detalle-contrato__estado-texto {
  margin: 0;
  max-width: 34rem;
  font-size: 0.86rem;
  line-height: 1.5;
}

.detalle-contrato__estado-acciones {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.6rem;
}

@media (max-width: 900px) {
  .detalle-contrato__grilla {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .detalle-contrato__acciones {
    width: 100%;
  }

  .detalle-contrato__acciones > * {
    flex: 1 1 100%;
  }

  .detalle-contrato__grilla {
    grid-template-columns: 1fr;
  }

  .detalle-contrato__seccion-cabecera {
    align-items: flex-start;
    flex-direction: column;
  }

  .detalle-contrato__texto {
    padding: 1rem;
  }

  .detalle-contrato__firma-acciones {
    flex-direction: column-reverse;
    align-items: stretch;
  }

  .detalle-contrato__firma-acciones :deep(.va-button) {
    width: 100%;
  }
}
</style>
