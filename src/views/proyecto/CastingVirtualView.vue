<template>
  <div class="casting-virtual">
    <div v-if="cargando" class="casting-virtual__estado">
      <span class="material-symbols-outlined casting-virtual__estado-icono">
        hourglass_empty
      </span>
      Cargando casting virtual...
    </div>

    <section v-else-if="faltanParametros" class="casting-virtual__estado">
      <span class="material-symbols-outlined casting-virtual__estado-icono">
        folder_open
      </span>
      <p class="casting-virtual__estado-titulo">Casting no disponible</p>
      <p class="casting-virtual__estado-texto">
        Falta indicar el requerimiento que querés comparar.
      </p>
      <VaButton preset="secondary" @click="volver">
        Volver a postulaciones
      </VaButton>
    </section>

    <section v-else-if="sinAccesoModelo" class="casting-virtual__estado">
      <span class="material-symbols-outlined casting-virtual__estado-icono">
        photo_camera
      </span>
      <p class="casting-virtual__estado-titulo">
        Casting virtual disponible solo para modelos
      </p>
      <p class="casting-virtual__estado-texto">
        Este requerimiento no corresponde a la profesión Modelo.
      </p>
      <VaButton preset="secondary" @click="volver">
        Volver a postulaciones
      </VaButton>
    </section>

    <section v-else-if="sinAcceso" class="casting-virtual__estado">
      <span class="material-symbols-outlined casting-virtual__estado-icono">
        lock
      </span>
      <p class="casting-virtual__estado-titulo">Sin acceso</p>
      <p class="casting-virtual__estado-texto">
        {{ error || "No tenés permiso para gestionar este casting." }}
      </p>
      <VaButton preset="secondary" @click="volver">
        Volver a postulaciones
      </VaButton>
    </section>

    <section v-else-if="noEncontrado" class="casting-virtual__estado">
      <span class="material-symbols-outlined casting-virtual__estado-icono">
        search_off
      </span>
      <p class="casting-virtual__estado-titulo">Requerimiento no encontrado</p>
      <p class="casting-virtual__estado-texto">
        {{ error || "No encontramos el requerimiento que estás buscando." }}
      </p>
      <VaButton preset="secondary" @click="volver">
        Volver a postulaciones
      </VaButton>
    </section>

    <section v-else-if="error && !requerimiento" class="casting-virtual__estado">
      <span class="material-symbols-outlined casting-virtual__estado-icono">
        error
      </span>
      <p class="casting-virtual__estado-titulo">No pudimos cargar el casting</p>
      <p class="casting-virtual__estado-texto">{{ error }}</p>
      <div class="casting-virtual__estado-acciones">
        <VaButton v-if="puedeReintentar" preset="primary" @click="reintentar">
          Reintentar
        </VaButton>
        <VaButton preset="secondary" @click="volver">
          Volver a postulaciones
        </VaButton>
      </div>
    </section>

    <template v-else-if="requerimiento">
      <p class="casting-virtual__migas">
        <router-link
          :to="{
            name: 'dashboard-proyecto',
            params: { id: idProyecto },
            query: { tab: 'postulaciones' },
          }"
          class="casting-virtual__miga"
        >
          {{ proyecto?.nombre || "Proyecto" }}
        </router-link>
        <span aria-hidden="true">›</span>
        <span>Postulaciones</span>
        <span aria-hidden="true">›</span>
        <span>Casting virtual</span>
      </p>

      <header class="casting-virtual__cabecera">
        <div>
          <h1 class="casting-virtual__titulo">Casting virtual</h1>
          <p class="casting-virtual__subtitulo">
            Comparar candidatos para
            <strong>{{ requerimiento.nombreProfesion || "Modelo" }}</strong>
            <template v-if="nombreRequerimiento">
              – {{ nombreRequerimiento }}
            </template>
          </p>
        </div>

        <VaButton preset="secondary" size="small" @click="volver">
          Volver a postulaciones
        </VaButton>
      </header>

      <CastingRequisitosBar :requerimiento="requerimiento" />

      <section v-if="cerrado" class="casting-virtual__cerrado" role="status">
        <span class="material-symbols-outlined" aria-hidden="true">lock</span>
        <div class="casting-virtual__cerrado-texto">
          <strong>Casting cerrado</strong>
          <p>
            El requerimiento ya está cubierto
            ({{ requerimiento.cubiertos }} de {{ requerimiento.cantidad }}).
            No se pueden aceptar más postulaciones.
          </p>
        </div>
        <VaButton
          v-if="filtros.estado !== estadosCasting.ACEPTADA"
          preset="secondary"
          size="small"
          @click="verAceptadas"
        >
          Ver aceptadas
        </VaButton>
      </section>

      <div class="casting-virtual__toolbar">
        <div
          class="casting-virtual__chips"
          role="group"
          aria-label="Filtrar candidatos por estado"
        >
          <button
            v-for="opcion in opcionesEstado"
            :key="opcion.value || 'todas'"
            type="button"
            class="casting-virtual__chip"
            :class="{
              'casting-virtual__chip--activo': filtros.estado === opcion.value,
            }"
            :aria-pressed="filtros.estado === opcion.value"
            @click="cambiarEstado(opcion.value)"
          >
            {{ opcion.text }}
            <span v-if="opcion.total !== null" class="casting-virtual__chip-numero">
              · {{ opcion.total }}
            </span>
          </button>
        </div>

        <VaSelect
          class="casting-virtual__orden"
          label="Ordenar por"
          :model-value="filtros.orden"
          :options="opcionesOrden"
          value-by="value"
          text-by="text"
          @update:modelValue="cambiarOrden"
        />
      </div>

      <BaseAlert v-if="error" :message="error" type="error" />

      <div
        v-if="error && puedeReintentar"
        class="casting-virtual__reintento"
      >
        <VaButton preset="primary" icon="mso-refresh" @click="reintentar">
          Reintentar
        </VaButton>
      </div>

      <template v-if="!error">
        <div v-if="contenido.length" class="casting-virtual__grilla">
          <CastingCandidatoCard
            v-for="candidato in contenido"
            :key="`${candidato.tipo}:${candidato.idPostulacion}`"
            :candidato="candidato"
            :requerimiento="requerimiento"
            :accion-en-curso="enviando"
            :destacada="esDestacada(candidato)"
            @aceptar="abrirModal(candidato, accionesGestion.ACEPTAR)"
            @rechazar="abrirModal(candidato, accionesGestion.RECHAZAR)"
          />
        </div>

        <div v-else class="casting-virtual__vacio">
          <span class="material-symbols-outlined" aria-hidden="true">groups</span>
          <p>
            {{
              cerrado
                ? "El requerimiento ya está cubierto. No quedan postulaciones pendientes."
                : "No hay postulaciones para el estado seleccionado."
            }}
          </p>
          <VaButton
            v-if="cerrado && filtros.estado !== estadosCasting.ACEPTADA"
            preset="secondary"
            size="small"
            @click="verAceptadas"
          >
            Ver aceptadas
          </VaButton>
        </div>

        <PaginacionResultados
          v-if="paginacion.totalPaginas > 1"
          :paginacion="paginacion"
          @cambiar="cambiarPagina"
        />
      </template>
    </template>

    <ModalGestionPostulacion
      :model-value="modal.visible"
      :id-proyecto="idProyecto"
      :token-disponibilidad="modal.tokenDisponibilidad"
      :accion="modal.accion"
      :postulacion="postulacionParaModal"
      :nombre-proyecto="proyecto?.nombre || ''"
      :actividad="actividadParaModal"
      :sin-fecha-entrega="false"
      :cargando-actividad="false"
      :error-actividad="''"
      :enviando="enviando"
      :error="errorGestion"
      :terminos-vigentes="modal.terminosVigentes"
      :token-refresco-terminos="modal.tokenRefrescoTerminos"
      @update:model-value="onModalVisibility"
      @confirmar="confirmarGestion"
    />
  </div>
</template>

<script>
import { useToast } from "vuestic-ui";
import BaseAlert from "../../components/AlertaBase.vue";
import CastingRequisitosBar from "../../components/proyecto/CastingRequisitosBar.vue";
import CastingCandidatoCard from "../../components/proyecto/CastingCandidatoCard.vue";
import ModalGestionPostulacion from "../../components/proyecto/ModalGestionPostulacion.vue";
import PaginacionResultados from "../../components/busqueda/PaginacionResultados.vue";
import castingService from "../../services/castingService.js";
import postulacionService from "../../services/postulacionService.js";
import { mensajeErrorApi } from "../../utils/apiError.js";
import {
  ACCIONES_GESTION,
  TIPOS_POSTULACION,
  esErrorCupoCompleto,
  esErrorDisponibilidad,
} from "../../utils/postulacionConstants.js";
import {
  ESTADOS_CASTING,
  OPCIONES_ORDEN_CASTING,
  esCastingCerrado,
  esRequerimientoModelo,
  opcionesEstadoCasting,
} from "../../utils/castingConstants.js";
import {
  datosErrorTerminos,
  esErrorTerminos,
} from "../../utils/terminosCondiciones.js";
import {
  MENSAJE_USUARIO_YA_ASIGNADO,
  esConflictoAsignacionUnica,
} from "../../utils/asignacionUnicaConstants.js";

export default {
  name: "CastingVirtualView",
  components: {
    BaseAlert,
    CastingRequisitosBar,
    CastingCandidatoCard,
    ModalGestionPostulacion,
    PaginacionResultados,
  },
  setup() {
    return { toast: useToast() };
  },
  data() {
    return {
      estadosCasting: ESTADOS_CASTING,
      accionesGestion: ACCIONES_GESTION,
      proyecto: null,
      requerimiento: null,
      contenido: [],
      conteos: {},
      paginacion: {
        paginaActual: 0,
        tamanoPagina: 6,
        totalElementos: 0,
        totalPaginas: 0,
        primera: true,
        ultima: true,
      },
      filtros: {
        estado: ESTADOS_CASTING.PENDIENTE,
        orden: "CUMPLIMIENTO",
      },
      cargando: true,
      error: "",
      errorGestion: "",
      puedeReintentar: false,
      sinAcceso: false,
      sinAccesoModelo: false,
      noEncontrado: false,
      enviando: false,
      modal: {
        visible: false,
        accion: ACCIONES_GESTION.ACEPTAR,
        candidato: null,
        terminosVigentes: null,
        tokenRefrescoTerminos: 0,
        tokenDisponibilidad: 0,
      },
      destacadaPendiente: null,
      destacadaVisual: null,
      idCarga: 0,
      controladorListado: null,
      controladorGestion: null,
    };
  },
  computed: {
    idProyecto() {
      return this.$route.params.id;
    },
    tipo() {
      return String(this.$route.query.tipo || "").toUpperCase();
    },
    idRequerimiento() {
      return this.$route.query.idRequerimiento || null;
    },
    faltanParametros() {
      return !this.tipo || !this.idRequerimiento;
    },
    opcionesEstado() {
      return opcionesEstadoCasting(this.conteos);
    },
    opcionesOrden() {
      return OPCIONES_ORDEN_CASTING;
    },
    cerrado() {
      return esCastingCerrado(this.requerimiento);
    },
    nombreRequerimiento() {
      if (!this.requerimiento) return "";
      return (
        this.requerimiento.nombreActividad ||
        this.requerimiento.descripcion ||
        ""
      );
    },
    actividadParaModal() {
      if (
        !this.requerimiento ||
        this.requerimiento.tipo !== TIPOS_POSTULACION.ACTIVIDAD
      ) {
        return null;
      }
      return {
        idActividad: this.requerimiento.idActividad,
        nombre: this.requerimiento.nombreActividad,
        fechaHoraInicio: this.requerimiento.fechaHoraInicio,
        fechaHoraFin: this.requerimiento.fechaHoraFin,
        duracionMinutos: this.requerimiento.duracionMinutos,
        profesionalesAsignados: [],
      };
    },
    postulacionParaModal() {
      const candidato = this.modal.candidato;
      const requerimiento = this.requerimiento;
      if (!candidato || !requerimiento) return null;
      return {
        ...candidato,
        cantidadRequerida: requerimiento.cantidad,
        cubiertos: requerimiento.cubiertos,
        faltantes: requerimiento.faltantes,
        satisfecho: requerimiento.satisfecho,
        descripcionRequerimiento: requerimiento.descripcion,
        idRequerimiento: requerimiento.idRequerimiento,
        idActividad: requerimiento.idActividad,
        nombreActividad: requerimiento.nombreActividad,
        postulacionesPendientes: requerimiento.postulacionesPendientes,
      };
    },
  },
  created() {
    this.controladorListado = null;
    this.controladorGestion = null;
  },
  mounted() {
    const query = this.$route.query;
    this.filtros.estado = query.estado || ESTADOS_CASTING.PENDIENTE;
    this.filtros.orden = query.orden || "CUMPLIMIENTO";
    this.destacadaPendiente = query.idPostulacionDestacada || null;
    this.destacadaVisual = this.destacadaPendiente;

    if (this.faltanParametros) {
      this.cargando = false;
      return;
    }

    this.buscar(Number(query.page) || 0);
  },
  beforeUnmount() {
    this.abortarListado();
    if (this.controladorGestion) this.controladorGestion.abort();
  },
  methods: {
    esCancelacion(error) {
      return (
        error?.code === "ERR_CANCELED" ||
        error?.name === "CanceledError" ||
        error?.name === "AbortError"
      );
    },
    abortarListado() {
      if (this.controladorListado) {
        this.controladorListado.abort();
        this.controladorListado = null;
      }
    },
    async buscar(pagina = 0) {
      if (this.faltanParametros || this.sinAccesoModelo) return;

      const corrida = ++this.idCarga;
      this.abortarListado();
      this.controladorListado = new AbortController();

      this.cargando = true;
      this.error = "";
      this.puedeReintentar = false;
      this.sinAcceso = false;
      this.noEncontrado = false;

      try {
        const response = await castingService.obtenerTablero(
          this.idProyecto,
          {
            tipo: this.tipo,
            idRequerimiento: this.idRequerimiento,
            estado: this.filtros.estado || undefined,
            orden: this.filtros.orden,
            page: pagina,
            idPostulacionDestacada: this.destacadaPendiente || undefined,
          },
          this.controladorListado.signal
        );

        if (corrida !== this.idCarga) return;

        const data = response?.data || {};
        const requerimiento = data.requerimiento || null;

        if (requerimiento && !esRequerimientoModelo(requerimiento)) {
          this.sinAccesoModelo = true;
          this.requerimiento = requerimiento;
          this.proyecto = data.proyecto || null;
          this.destacadaPendiente = null;
          return;
        }

        this.proyecto = data.proyecto || null;
        this.requerimiento = requerimiento;
        this.contenido = Array.isArray(data.contenido) ? data.contenido : [];
        this.conteos = data.conteosPorEstado || {};
        this.paginacion = {
          paginaActual: Number(data.paginaActual) || 0,
          tamanoPagina: Number(data.tamanoPagina) || 6,
          totalElementos: Number(data.totalElementos) || 0,
          totalPaginas: Number(data.totalPaginas) || 0,
          primera: data.primera !== false,
          ultima: data.ultima !== false,
        };

        this.destacadaPendiente = null;
        this.sincronizarQuery();
      } catch (error) {
        if (this.esCancelacion(error) || corrida !== this.idCarga) return;
        this.manejarErrorListado(error);
      } finally {
        if (corrida === this.idCarga) this.cargando = false;
      }
    },
    manejarErrorListado(error) {
      const status = error?.response?.status;
      const mensaje = error?.response?.data?.message || "";
      this.error = "";
      this.puedeReintentar = false;

      if (status === 400) {
        this.error = mensaje || "Revisá los filtros e intentá nuevamente.";
        return;
      }

      if (status === 401) {
        this.error = mensajeErrorApi(error, "Tu cuenta no se encuentra activa.");
        return;
      }

      if (status === 403) {
        this.sinAcceso = true;
        this.error =
          mensaje ||
          "No tenés permiso para gestionar las postulaciones de este proyecto.";
        return;
      }

      if (status === 404) {
        this.noEncontrado = true;
        this.error = mensaje || "No encontramos el requerimiento indicado.";
        return;
      }

      if (!status || status >= 500) {
        this.puedeReintentar = true;
        this.error =
          "Ocurrió un error al cargar el casting. Intentalo nuevamente.";
        return;
      }

      this.error = mensajeErrorApi(
        error,
        "No se pudo cargar el casting virtual."
      );
    },
    sincronizarQuery() {
      const query = {
        ...this.$route.query,
        tipo: this.tipo,
        idRequerimiento: this.idRequerimiento,
        estado: this.filtros.estado || undefined,
        orden: this.filtros.orden,
        page: this.paginacion.paginaActual,
      };
      delete query.idPostulacionDestacada;

      this.$router.replace({ query }).catch(() => {});
    },
    cambiarEstado(estado) {
      if (this.filtros.estado === estado) return;
      this.filtros.estado = estado;
      this.destacadaVisual = null;
      this.buscar(0);
    },
    cambiarOrden(orden) {
      this.filtros.orden = orden || "CUMPLIMIENTO";
      this.destacadaVisual = null;
      this.buscar(0);
    },
    cambiarPagina(delta) {
      const destino = this.paginacion.paginaActual + delta;
      if (destino < 0 || destino >= this.paginacion.totalPaginas) return;
      this.destacadaVisual = null;
      this.buscar(destino);
    },
    reintentar() {
      this.buscar(this.paginacion.paginaActual);
    },
    verAceptadas() {
      this.filtros.estado = ESTADOS_CASTING.ACEPTADA;
      this.destacadaVisual = null;
      this.buscar(0);
    },
    volver() {
      this.$router.push({
        name: "dashboard-proyecto",
        params: { id: this.idProyecto },
        query: { tab: "postulaciones" },
      });
    },
    esDestacada(candidato) {
      return (
        this.destacadaVisual != null &&
        String(candidato?.idPostulacion) === String(this.destacadaVisual)
      );
    },
    abrirModal(candidato, accion) {
      if (!candidato || this.enviando) return;
      if (accion === ACCIONES_GESTION.ACEPTAR && !candidato.puedeAceptar) {
        return;
      }
      if (accion === ACCIONES_GESTION.RECHAZAR && !candidato.puedeRechazar) {
        return;
      }

      this.modal = {
        visible: true,
        accion,
        candidato,
        terminosVigentes: null,
        tokenRefrescoTerminos: 0,
        tokenDisponibilidad: 0,
      };
      this.errorGestion = "";
    },
    onModalVisibility(valor) {
      if (!valor) this.cerrarModal();
    },
    cerrarModal() {
      if (this.enviando) return;
      this.modal.visible = false;
      this.errorGestion = "";
    },
    async confirmarGestion({ aceptacionTerminos = null } = {}) {
      if (this.enviando) return;

      const { accion, candidato } = this.modal;
      if (!candidato) return;

      this.enviando = true;
      this.errorGestion = "";

      if (this.controladorGestion) this.controladorGestion.abort();
      this.controladorGestion = new AbortController();
      const signal = this.controladorGestion.signal;
      const esAceptar = accion === ACCIONES_GESTION.ACEPTAR;
      const esActividad = candidato.tipo === TIPOS_POSTULACION.ACTIVIDAD;

      try {
        let respuesta = null;

        if (esActividad) {
          if (esAceptar) {
            respuesta = await postulacionService.aceptarActividad(
              this.idProyecto,
              candidato.idPostulacion,
              { aceptacionTerminos, requerimientoExacto: true },
              signal
            );
          } else {
            await postulacionService.rechazarActividad(
              this.idProyecto,
              candidato.idPostulacion,
              signal
            );
          }
        } else if (esAceptar) {
          respuesta = await postulacionService.aceptarGeneral(
            this.idProyecto,
            candidato.idPostulacion,
            { aceptacionTerminos, requerimientoExacto: true },
            signal
          );
        } else {
          await postulacionService.rechazarGeneral(
            this.idProyecto,
            candidato.idPostulacion,
            signal
          );
        }

        this.modal.visible = false;
        this.errorGestion = "";
        this.mostrarToastGestion(respuesta?.data || null, accion, candidato);

        if (!esAceptar) {
          this.contenido = this.contenido.filter(
            (item) =>
              !(
                item.tipo === candidato.tipo &&
                item.idPostulacion === candidato.idPostulacion
              )
          );
        }

        await this.buscar(this.paginacion.paginaActual);
      } catch (error) {
        if (this.esCancelacion(error)) return;
        this.manejarErrorGestion(error, candidato, esAceptar);
      } finally {
        this.enviando = false;
      }
    },
    mostrarToastGestion(data, accion, candidato) {
      if (accion === ACCIONES_GESTION.RECHAZAR) {
        this.toast.init({
          title: "Postulación rechazada",
          message: "La postulación quedó rechazada.",
          color: "success",
          position: "top-right",
          duration: 5000,
        });
        return;
      }

      const cupo = data?.cupo;
      if (cupo?.satisfecho) {
        this.toast.init({
          title: "Requerimiento cubierto",
          message:
            "El casting se cerró y se rechazaron automáticamente las demás postulaciones pendientes.",
          color: "success",
          position: "top-right",
          duration: 7000,
        });
        return;
      }

      const faltantes = Number(cupo?.faltantes);
      const mensaje = Number.isFinite(faltantes)
        ? faltantes === 1
          ? "Postulación aceptada. Queda 1 lugar disponible."
          : `Postulación aceptada. Quedan ${faltantes} lugares disponibles.`
        : `Postulación de ${candidato.nombreArtistico || "el candidato"} aceptada.`;

      this.toast.init({
        title: "Postulación aceptada",
        message: mensaje,
        color: "success",
        position: "top-right",
        duration: 6000,
      });
    },
    async manejarErrorGestion(error, candidato, esAceptar) {
      const status = error?.response?.status;
      const mensaje = error?.response?.data?.message || "";

      if (status === 400) {
        this.errorGestion =
          mensaje || "No se pudo gestionar la postulación. Revisá los datos.";
        return;
      }

      if (status === 401) {
        this.modal.visible = false;
        this.toast.init({
          title: "No se pudo gestionar",
          message: mensajeErrorApi(error, "Tu cuenta no se encuentra activa."),
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        return;
      }

      if (status === 403) {
        this.modal.visible = false;
        this.error =
          mensaje ||
          "No tenés permiso para gestionar las postulaciones de este proyecto.";
        return;
      }

      if (status === 404) {
        this.modal.visible = false;
        this.toast.init({
          title: "No se pudo gestionar",
          message: mensaje || "La postulación ya no está disponible.",
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        await this.buscar(this.paginacion.paginaActual);
        return;
      }

      if (status === 409) {
        if (esAceptar && esErrorTerminos(error)) {
          const datos = datosErrorTerminos(error);
          this.errorGestion =
            datos.mensaje ||
            "Los términos y condiciones del postulante cambiaron. Revisá la versión vigente y volvé a aceptar.";

          if (
            datos.idTycVigente != null ||
            datos.esPlantilla ||
            datos.descripcionVigente
          ) {
            this.modal = {
              ...this.modal,
              terminosVigentes: {
                idPerfil: datos.idPerfil,
                idTyc: datos.idTycVigente,
                descripcion: datos.descripcionVigente,
                esPlantilla: datos.esPlantilla,
                fechaInicio: null,
                fechaFin: null,
              },
            };
          } else {
            this.modal = {
              ...this.modal,
              terminosVigentes: null,
              tokenRefrescoTerminos:
                (this.modal.tokenRefrescoTerminos || 0) + 1,
            };
          }
          return;
        }

        if (esConflictoAsignacionUnica(error)) {
          this.modal.visible = false;
          this.toast.init({
            title: "Usuario ya asignado",
            message: mensaje || MENSAJE_USUARIO_YA_ASIGNADO,
            color: "danger",
            position: "top-right",
            duration: 6000,
          });
          await this.buscar(this.paginacion.paginaActual);
          return;
        }

        if (esErrorDisponibilidad(error)) {
          this.errorGestion =
            mensaje ||
            "El postulante no tiene disponibilidad suficiente para la actividad.";
          this.modal.tokenDisponibilidad =
            (this.modal.tokenDisponibilidad || 0) + 1;
          return;
        }

        if (esErrorCupoCompleto(error)) {
          this.modal.visible = false;
          this.toast.init({
            title: "Requerimiento cubierto",
            message:
              mensaje ||
              "El requerimiento ya está cubierto. El casting se cerró.",
            color: "warning",
            position: "top-right",
            duration: 7000,
          });
          await this.buscar(this.paginacion.paginaActual);
          return;
        }

        this.modal.visible = false;
        this.toast.init({
          title: "No se pudo gestionar",
          message: mensaje || "La postulación ya no se puede gestionar.",
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        await this.buscar(this.paginacion.paginaActual);
        return;
      }

      if (!status || status >= 500) {
        this.errorGestion =
          "Ocurrió un error al gestionar la postulación. Intentalo nuevamente.";
        return;
      }

      this.errorGestion = mensajeErrorApi(
        error,
        "No se pudo gestionar la postulación."
      );
    },
  },
};
</script>

<style scoped>
.casting-virtual {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.casting-virtual__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2.5rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: var(--color-surface);
  color: var(--color-text-muted);
  text-align: center;
}

.casting-virtual__estado-icono {
  font-size: 2rem;
}

.casting-virtual__estado-titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1rem;
  font-weight: 700;
}

.casting-virtual__estado-texto {
  margin: 0;
  max-width: 34rem;
  font-size: 0.86rem;
  line-height: 1.5;
}

.casting-virtual__estado-acciones {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
}

.casting-virtual__migas {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.78rem;
}

.casting-virtual__miga {
  color: var(--color-primary);
  text-decoration: none;
}

.casting-virtual__cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.casting-virtual__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1.65rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.casting-virtual__subtitulo {
  margin: 0.2rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.86rem;
}

.casting-virtual__cerrado {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.8rem 1rem;
  border: 1px solid var(--color-warning-border);
  border-radius: 12px;
  background: var(--color-warning-soft);
  color: var(--color-warning-text);
}

.casting-virtual__cerrado > .material-symbols-outlined {
  font-size: 1.4rem;
}

.casting-virtual__cerrado-texto {
  flex: 1;
  min-width: 0;
}

.casting-virtual__cerrado-texto p {
  margin: 0.15rem 0 0;
  font-size: 0.8rem;
  line-height: 1.45;
}

.casting-virtual__toolbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.casting-virtual__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.casting-virtual__chip {
  padding: 0.35rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
}

.casting-virtual__chip:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.casting-virtual__chip--activo {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: #fff;
}

.casting-virtual__chip-numero {
  opacity: 0.85;
}

.casting-virtual__orden {
  width: 15rem;
  max-width: 100%;
}

.casting-virtual__grilla {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  align-items: stretch;
}

.casting-virtual__vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2.5rem 1rem;
  border: 1px dashed var(--color-border);
  border-radius: 14px;
  background: var(--color-surface);
  color: var(--color-text-muted);
  text-align: center;
}

.casting-virtual__vacio .material-symbols-outlined {
  font-size: 1.8rem;
}

.casting-virtual__vacio p {
  margin: 0;
  color: var(--color-text);
  font-size: 0.9rem;
}

.casting-virtual__reintento {
  display: flex;
  justify-content: center;
}

@media (max-width: 1100px) {
  .casting-virtual__grilla {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 680px) {
  .casting-virtual__grilla {
    grid-template-columns: minmax(0, 1fr);
  }

  .casting-virtual__cabecera {
    align-items: stretch;
  }
}
</style>
