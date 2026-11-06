<template>
  <div class="mis-postulaciones">
    <header class="mis-postulaciones__cabecera">
      <h1 class="mis-postulaciones__titulo">Mis postulaciones</h1>
    </header>

    <div class="mis-postulaciones__filtros" role="group" aria-label="Filtrar por estado">
      <button
        v-for="opcion in opcionesEstado"
        :key="opcion.value || 'todas'"
        type="button"
        class="mis-postulaciones__chip"
        :class="{ 'mis-postulaciones__chip--activo': filtros.estado === opcion.value }"
        :aria-pressed="filtros.estado === opcion.value"
        @click="cambiarEstado(opcion.value)"
      >
        {{ opcion.text }}
      </button>
    </div>

    <BaseAlert v-if="mensajeError" :message="mensajeError" type="error" />

    <div v-if="puedeReintentar && !cargando" class="mis-postulaciones__reintento">
      <VaButton preset="primary" icon="mso-refresh" @click="cargar">
        Reintentar
      </VaButton>
    </div>

    <div v-if="cargando" class="mis-postulaciones__estado">
      <span class="material-symbols-outlined mis-postulaciones__estado-icono">
        hourglass_empty
      </span>
      Cargando postulaciones...
    </div>

    <template v-else-if="!mensajeError">
      <div v-if="postulaciones.length" class="mis-postulaciones__lista">
        <article
          v-for="postulacion in postulaciones"
          :key="`${postulacion.tipo}:${postulacion.idPostulacion}`"
          class="mi-postulacion"
        >
          <div class="mi-postulacion__cabecera">
            <div class="mi-postulacion__titulo-grupo">
              <h2 class="mi-postulacion__proyecto">
                {{ postulacion.nombreProyecto }}
              </h2>
              <span class="mi-postulacion__tipo">
                {{ etiquetaOrigenPostulacion(postulacion.tipo) }}
              </span>
            </div>
            <EstadoPostulacionBadge :estado="postulacion.estado" />
          </div>

          <p class="mi-postulacion__requerimiento">
            Requerimiento:
            <strong>{{ textoRequerimiento(postulacion) }}</strong>
            <template v-if="postulacion.nombreActividad">
              · Actividad: {{ postulacion.nombreActividad }}
            </template>
          </p>

          <div class="mi-postulacion__pie">
            <span class="mi-postulacion__fecha">
              Postulada el {{ formatearFechaCorta(postulacion.fechaPostulacion) }}
            </span>
            <VaButton
              v-if="postulacion.puedeDarseDeBaja"
              preset="secondary"
              color="danger"
              size="small"
              @click="abrirBaja(postulacion)"
            >
              {{ textos.DAR_DE_BAJA }}
            </VaButton>
          </div>
        </article>
      </div>

      <p v-else class="mis-postulaciones__vacio">
        {{ filtros.estado ? textos.VACIO_PROYECTO_ESTADO : textos.VACIO_MIS_POSTULACIONES }}
      </p>

      <div
        v-if="paginacion.totalPaginas > 1"
        class="mis-postulaciones__paginacion"
      >
        <VaButton
          preset="secondary"
          size="small"
          icon="mso-chevron_left"
          :disabled="paginacion.primera"
          @click="irAPagina(-1)"
        >
          Anterior
        </VaButton>
        <span class="mis-postulaciones__pagina">
          Página {{ paginacion.paginaActual + 1 }} de
          {{ paginacion.totalPaginas }}
        </span>
        <VaButton
          preset="secondary"
          size="small"
          icon="mso-chevron_right"
          :disabled="paginacion.ultima"
          @click="irAPagina(1)"
        >
          Siguiente
        </VaButton>
      </div>
    </template>

    <ModalDarDeBajaPostulacion
      :model-value="modalBaja.visible"
      :proyecto="modalBaja.postulacion?.nombreProyecto || ''"
      :requerimiento="textoDeBaja"
      :actividad="modalBaja.postulacion?.nombreActividad || ''"
      :eliminando="eliminando"
      :error="errorBaja"
      @update:model-value="cerrarBaja"
      @confirmar="confirmarBaja"
    />
  </div>
</template>

<script>
import postulacionService from "../../services/postulacionService.js";
import { refrescarSesion } from "../../services/authState";
import { useToast } from "vuestic-ui";
import BaseAlert from "../../components/AlertaBase.vue";
import EstadoPostulacionBadge from "../../components/proyecto/EstadoPostulacionBadge.vue";
import ModalDarDeBajaPostulacion from "../../components/proyecto/ModalDarDeBajaPostulacion.vue";
import { mensajeErrorApi } from "../../utils/apiError";
import { formatearFechaCorta } from "../../utils/fechas.js";
import {
  ESTADOS_POSTULACION,
  TEXTOS_POSTULACIONES,
  etiquetaOrigenPostulacion,
  textoRequerimiento,
} from "../../utils/postulacionConstants.js";
import {
  TAMANO_POR_DEFECTO,
  construirParamsMisPostulaciones,
} from "../../utils/parametrosPostulaciones.js";

const OPCIONES_ESTADO = [
  { value: "", text: "Todas" },
  { value: ESTADOS_POSTULACION.PENDIENTE, text: "Pendiente" },
  { value: ESTADOS_POSTULACION.ACEPTADA, text: "Aceptada" },
  { value: ESTADOS_POSTULACION.RECHAZADA, text: "Rechazada" },
];

/*
 * Pantalla global de UC-27: postulaciones del perfil activo en todos los
 * proyectos, con filtro por estado, baja de las PENDIENTE y paginación.
 */
export default {
  name: "MisPostulacionesView",
  components: {
    BaseAlert,
    EstadoPostulacionBadge,
    ModalDarDeBajaPostulacion,
  },
  setup() {
    return { toast: useToast() };
  },
  data() {
    return {
      textos: TEXTOS_POSTULACIONES,
      opcionesEstado: OPCIONES_ESTADO,
      filtros: { estado: "" },
      postulaciones: [],
      paginacion: {
        paginaActual: 0,
        totalPaginas: 1,
        primera: true,
        ultima: true,
      },
      cargando: true,
      mensajeError: "",
      puedeReintentar: false,
      modalBaja: { visible: false, postulacion: null },
      eliminando: false,
      errorBaja: "",
      idCarga: 0,
    };
  },
  computed: {
    textoDeBaja() {
      const postulacion = this.modalBaja.postulacion;
      return postulacion ? textoRequerimiento(postulacion) : "";
    },
  },
  created() {
    this.controlador = null;
    this.controladorBaja = null;
  },
  mounted() {
    this.cargar(0);
  },
  beforeUnmount() {
    if (this.controlador) this.controlador.abort();
    if (this.controladorBaja) this.controladorBaja.abort();
  },
  methods: {
    etiquetaOrigenPostulacion,
    textoRequerimiento,
    formatearFechaCorta,
    cambiarEstado(estado) {
      if (this.filtros.estado === estado) return;
      this.filtros = { ...this.filtros, estado };
      this.cargar(0);
    },
    async cargar(pagina = 0) {
      const corrida = ++this.idCarga;
      if (this.controlador) this.controlador.abort();
      this.controlador = new AbortController();

      this.cargando = true;
      this.mensajeError = "";
      this.puedeReintentar = false;

      const params = construirParamsMisPostulaciones({
        estado: this.filtros.estado,
        pagina,
        tamano: TAMANO_POR_DEFECTO,
      });

      try {
        const response = await postulacionService.mias(
          params,
          this.controlador.signal
        );
        if (corrida !== this.idCarga) return;

        const data = response?.data || {};
        this.postulaciones = Array.isArray(data.contenido)
          ? data.contenido
          : [];
        this.paginacion = {
          paginaActual: Number(data.paginaActual) || 0,
          totalPaginas: Number(data.totalPaginas) || 1,
          primera: data.primera !== false,
          ultima: data.ultima !== false,
        };
      } catch (error) {
        if (this.esCancelacion(error) || corrida !== this.idCarga) return;
        await this.manejarError(error);
      } finally {
        if (corrida === this.idCarga) this.cargando = false;
      }
    },
    esCancelacion(error) {
      return (
        error?.code === "ERR_CANCELED" ||
        error?.name === "CanceledError" ||
        error?.name === "AbortError"
      );
    },
    async manejarError(error) {
      const status = error?.response?.status;
      const mensaje = error?.response?.data?.message || "";

      if (status === 401) {
        this.mensajeError = mensajeErrorApi(
          error,
          "Tu cuenta no se encuentra activa."
        );
        return;
      }

      if (status === 404) {
        if (/perfil/i.test(mensaje)) {
          await refrescarSesion();
          this.$router.push({ name: "dashboard-usuario" });
          return;
        }
        this.mensajeError = mensajeErrorApi(
          error,
          "No se encontraron tus postulaciones."
        );
        return;
      }

      if (!status || status >= 500) {
        this.puedeReintentar = true;
        this.mensajeError =
          "Ocurrió un error al cargar tus postulaciones. Inténtalo nuevamente.";
        return;
      }

      this.mensajeError = mensajeErrorApi(
        error,
        "No se pudieron cargar tus postulaciones."
      );
    },
    irAPagina(delta) {
      const destino = this.paginacion.paginaActual + delta;
      if (destino < 0 || destino >= this.paginacion.totalPaginas) return;
      this.cargar(destino);
    },
    abrirBaja(postulacion) {
      this.errorBaja = "";
      this.modalBaja = { visible: true, postulacion };
    },
    cerrarBaja(valor) {
      if (this.eliminando) return;
      if (!valor) this.modalBaja = { visible: false, postulacion: null };
      this.errorBaja = "";
    },
    async confirmarBaja() {
      if (this.eliminando) return;
      const postulacion = this.modalBaja.postulacion;
      if (!postulacion) return;

      this.eliminando = true;
      this.errorBaja = "";
      if (this.controladorBaja) this.controladorBaja.abort();
      this.controladorBaja = new AbortController();

      try {
        await postulacionService.darDeBaja(
          postulacion,
          this.controladorBaja.signal
        );

        this.modalBaja = { visible: false, postulacion: null };
        this.toast.init({
          title: "Postulación retirada",
          message: "La postulación se dio de baja correctamente.",
          color: "success",
          position: "top-right",
          duration: 5000,
        });
        await this.cargar(this.paginacion.paginaActual);
      } catch (error) {
        if (this.esCancelacion(error)) return;
        await this.manejarErrorBaja(error);
      } finally {
        this.eliminando = false;
      }
    },
    async manejarErrorBaja(error) {
      const status = error?.response?.status;
      const mensaje = error?.response?.data?.message || "";

      if (status === 409) {
        this.modalBaja = { visible: false, postulacion: null };
        this.toast.init({
          title: "No se pudo retirar",
          message:
            mensaje ||
            "La postulación ya fue gestionada. Actualizá el listado e intentá nuevamente.",
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        await this.cargar(this.paginacion.paginaActual);
        return;
      }

      if (status === 404) {
        this.modalBaja = { visible: false, postulacion: null };
        this.toast.init({
          title: "No se pudo retirar",
          message: mensaje || "La postulación ya no está disponible.",
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        await this.cargar(this.paginacion.paginaActual);
        return;
      }

      if (status === 401) {
        this.modalBaja = { visible: false, postulacion: null };
        this.toast.init({
          title: "No se pudo retirar",
          message: mensajeErrorApi(error, "Tu cuenta no se encuentra activa."),
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        return;
      }

      if (!status || status >= 500) {
        this.errorBaja =
          "Ocurrió un error al retirar la postulación. Inténtalo nuevamente.";
        return;
      }

      this.errorBaja = mensajeErrorApi(
        error,
        "No se pudo retirar la postulación."
      );
    },
  },
};
</script>

<style scoped>
.mis-postulaciones {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.mis-postulaciones__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1.5rem;
  font-weight: 700;
}

.mis-postulaciones__filtros {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.mis-postulaciones__chip {
  padding: 0.4rem 0.95rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-primary);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.mis-postulaciones__chip--activo {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: #fff;
}

.mis-postulaciones__lista {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.mi-postulacion {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding: 1.1rem 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
}

.mi-postulacion__cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.mi-postulacion__titulo-grupo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.mi-postulacion__proyecto {
  margin: 0;
  color: var(--color-text);
  font-size: 1.1rem;
  font-weight: 700;
}

.mi-postulacion__tipo {
  display: inline-block;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  background: var(--color-info-soft);
  color: var(--color-info-text);
  font-size: 0.75rem;
  font-weight: 600;
}

.mi-postulacion__requerimiento {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.88rem;
  line-height: 1.45;
}

.mi-postulacion__requerimiento strong {
  color: var(--color-text);
}

.mi-postulacion__pie {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 0.15rem;
}

.mi-postulacion__fecha {
  color: var(--color-text-muted);
  font-size: 0.82rem;
}

.mis-postulaciones__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2.25rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-size: 0.88rem;
  text-align: center;
}

.mis-postulaciones__estado-icono {
  font-size: 1.6rem;
}

.mis-postulaciones__vacio {
  margin: 0;
  padding: 2.25rem 1rem;
  border: 1px dashed var(--color-border-strong);
  border-radius: 12px;
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-size: 0.9rem;
  text-align: center;
}

.mis-postulaciones__reintento {
  display: flex;
  justify-content: center;
}

.mis-postulaciones__paginacion {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.mis-postulaciones__pagina {
  color: var(--color-text-muted);
  font-size: 0.82rem;
}

@media (max-width: 560px) {
  .mi-postulacion__cabecera {
    flex-direction: column;
    align-items: flex-start;
  }

  .mi-postulacion__pie {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
