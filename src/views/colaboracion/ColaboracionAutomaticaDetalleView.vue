<template>
  <div class="detalle-colaboracion">
    <button
      type="button"
      class="detalle-colaboracion__volver"
      @click="volver"
    >
      <span class="material-symbols-outlined" aria-hidden="true">
        arrow_back
      </span>
      Volver a colaboraciones automáticas
    </button>

    <div v-if="cargando" class="detalle-colaboracion__estado" role="status">
      <span class="material-symbols-outlined" aria-hidden="true">
        hourglass_empty
      </span>
      Cargando propuesta...
    </div>

    <BaseAlert
      v-else-if="!colaboracion"
      :message="error || 'No se encontró la propuesta.'"
      type="error"
    />

    <template v-else>
      <header class="detalle-colaboracion__hero">
        <div>
          <p class="detalle-colaboracion__eyebrow">
            Colaboración automática
          </p>
          <h1 class="detalle-colaboracion__titulo">
            {{ tituloPropia }}
            <span aria-hidden="true">·</span>
            {{ tituloContraparte }}
          </h1>
          <p class="detalle-colaboracion__descripcion">
            {{ descripcionEstado }}
          </p>
        </div>
        <EstadoColaboracionAutomaticaBadge :estado="estado" />
      </header>

      <BaseAlert v-if="error" :message="error" type="error" />

      <section class="detalle-colaboracion__publicaciones">
        <article
          class="detalle-publicacion"
          :class="{ 'detalle-publicacion--eliminada': propiaEliminada }"
        >
          <div class="detalle-publicacion__portada">
            <img
              v-if="portadaPropia"
              :src="portadaPropia"
              :alt="tituloPropia"
            />
            <span v-else class="material-symbols-outlined" aria-hidden="true">
              image
            </span>
          </div>
          <div class="detalle-publicacion__info">
            <span class="detalle-publicacion__rol">Tu publicación</span>
            <h2>{{ tituloPropia }}</h2>
            <p v-if="propiaEliminada" class="detalle-publicacion__aviso">
              Publicación eliminada. Se conserva el registro de la propuesta,
              pero la publicación ya no está disponible.
            </p>
            <button
              v-else-if="puedeAbrirPropia"
              type="button"
              class="detalle-publicacion__link"
              @click="verPublicacion(propia)"
            >
              Ver publicación
            </button>
          </div>
        </article>

        <span
          class="detalle-colaboracion__conector material-symbols-outlined"
          aria-hidden="true"
        >
          sync_alt
        </span>

        <article
          class="detalle-publicacion"
          :class="{ 'detalle-publicacion--eliminada': contraparteEliminada }"
        >
          <div class="detalle-publicacion__portada">
            <img
              v-if="portadaContraparte"
              :src="portadaContraparte"
              :alt="tituloContraparte"
            />
            <span v-else class="material-symbols-outlined" aria-hidden="true">
              image
            </span>
          </div>
          <div class="detalle-publicacion__info">
            <span class="detalle-publicacion__rol">
              Publicación de {{ nombreContraparte }}
            </span>
            <h2>{{ tituloContraparte }}</h2>
            <p
              v-if="contraparteEliminada"
              class="detalle-publicacion__aviso"
            >
              Publicación eliminada. Se conserva el registro de la propuesta,
              pero la publicación ya no está disponible.
            </p>
            <button
              v-else-if="puedeAbrirContraparte"
              type="button"
              class="detalle-publicacion__link"
              @click="verPublicacion(contraparte)"
            >
              Ver publicación
            </button>
          </div>
        </article>
      </section>

      <div class="detalle-colaboracion__grid">
        <section class="detalle-colaboracion__panel">
          <h2 class="detalle-colaboracion__subtitulo">
            Perfil de la contraparte
          </h2>
          <div class="detalle-colaboracion__perfil">
            <span class="detalle-colaboracion__avatar">
              <img
                v-if="fotoContraparte"
                :src="fotoContraparte"
                :alt="nombreContraparte"
              />
              <template v-else>{{ inicialContraparte }}</template>
            </span>
            <div class="detalle-colaboracion__perfil-info">
              <strong>{{ nombreContraparte }}</strong>
              <span>{{ profesionContraparte || "Perfil" }}</span>
            </div>
            <VaButton
              v-if="perfil?.idPerfil != null"
              preset="secondary"
              size="small"
              @click="verPerfil(perfil)"
            >
              Ver perfil
            </VaButton>
          </div>
        </section>

        <section class="detalle-colaboracion__panel">
          <h2 class="detalle-colaboracion__subtitulo">Imagen en común</h2>
          <div
            v-if="urlImagen"
            class="detalle-colaboracion__evidencia"
          >
            <img :src="urlImagen" alt="Imagen compartida" />
            <p>
              Esta imagen fue la evidencia usada para detectar la
              colaboración automática.
            </p>
          </div>
          <p v-else class="detalle-colaboracion__texto-muted">
            La imagen de evidencia ya no está disponible.
          </p>
        </section>
      </div>

      <section class="detalle-colaboracion__panel">
        <h2 class="detalle-colaboracion__subtitulo">
          Estado de la propuesta
        </h2>
        <dl class="detalle-colaboracion__estados">
          <div>
            <dt>Estado general</dt>
            <dd>
              <EstadoColaboracionAutomaticaBadge :estado="estado" />
            </dd>
          </div>
          <div>
            <dt>Tu estado</dt>
            <dd>{{ etiquetaMiEstado }}</dd>
          </div>
          <div>
            <dt>Estado de {{ nombreContraparte }}</dt>
            <dd>{{ etiquetaEstadoContraparte }}</dd>
          </div>
        </dl>
        <p class="detalle-colaboracion__explicacion">
          {{ descripcionEstado }}
        </p>
      </section>

      <section class="detalle-colaboracion__panel">
        <h2 class="detalle-colaboracion__subtitulo">Fechas</h2>
        <ul class="detalle-colaboracion__fechas">
          <li v-if="fechaDeteccion">
            <span>Detección</span>
            <strong>{{ fechaDeteccion }}</strong>
          </li>
          <li v-if="fechaConfirmacion">
            <span>Confirmación</span>
            <strong>{{ fechaConfirmacion }}</strong>
          </li>
          <li v-if="fechaDisolucion">
            <span>Disolución</span>
            <strong>{{ fechaDisolucion }}</strong>
          </li>
          <li v-if="!fechaDeteccion && !fechaConfirmacion && !fechaDisolucion">
            <span>Sin fechas registradas</span>
          </li>
        </ul>
      </section>

      <section
        v-if="puedeConfirmar || puedeRechazar"
        class="detalle-colaboracion__acciones"
      >
        <VaButton
          v-if="puedeConfirmar"
          color="primary"
          :loading="procesando && accionProcesando === 'confirmar'"
          :disabled="procesando"
          @click="abrirGestion(ACCIONES.CONFIRMAR)"
        >
          Confirmar colaboración
        </VaButton>
        <VaButton
          v-if="puedeRechazar"
          preset="secondary"
          color="danger"
          :loading="procesando && accionProcesando === 'rechazar'"
          :disabled="procesando"
          @click="abrirGestion(ACCIONES.RECHAZAR)"
        >
          Rechazar propuesta
        </VaButton>
      </section>
      <p v-else class="detalle-colaboracion__sin-acciones">
        No hay acciones disponibles para esta propuesta.
      </p>
    </template>

    <ModalGestionColaboracionAutomatica
      v-model="modal.visible"
      :colaboracion="colaboracion"
      :accion="modal.accion"
      :gestionando="procesando"
      :error="errorModal"
      @confirmar="gestionar"
    />
  </div>
</template>

<script>
import { useToast } from "vuestic-ui";
import BaseAlert from "../../components/AlertaBase.vue";
import EstadoColaboracionAutomaticaBadge from "../../components/colaboracion/EstadoColaboracionAutomaticaBadge.vue";
import ModalGestionColaboracionAutomatica from "../../components/colaboracion/ModalGestionColaboracionAutomatica.vue";
import colaboracionAutomaticaService from "../../services/colaboracionAutomaticaService";
import { cargarResumenColaboracionesAutomaticas } from "../../services/colaboracionAutomaticaState";
import { cargarResumenPerfil } from "../../services/notificacionState";
import { idPerfilActivo } from "../../services/authState";
import { resolverFotoUrl } from "../../utils/fotos.js";
import { formatearFechaCorta } from "../../utils/fechas.js";
import {
  ACCIONES_COLABORACION_AUTOMATICA,
  ESTADOS_COLABORACION_AUTOMATICA,
  ETIQUETAS_ESTADO_COLABORACION_AUTOMATICA,
  descripcionEstadoColaboracionAutomatica,
  mensajeErrorColaboracionAutomatica,
  normalizarColaboracionAutomatica,
  normalizarEstadoColaboracionAutomatica,
} from "../../utils/colaboracionesAutomaticasConstants.js";

export default {
  name: "ColaboracionAutomaticaDetalleView",
  components: {
    BaseAlert,
    EstadoColaboracionAutomaticaBadge,
    ModalGestionColaboracionAutomatica,
  },
  setup() {
    return {
      toast: useToast(),
      ACCIONES: ACCIONES_COLABORACION_AUTOMATICA,
    };
  },
  data() {
    return {
      colaboracion: null,
      cargando: true,
      error: "",
      errorModal: "",
      controlador: null,
      procesando: false,
      accionProcesando: "",
      modal: {
        visible: false,
        accion: ACCIONES_COLABORACION_AUTOMATICA.CONFIRMAR,
      },
    };
  },
  computed: {
    id() {
      const id = Number(this.$route.params.id);
      return Number.isInteger(id) && id > 0 ? id : null;
    },
    propia() {
      return this.colaboracion?.publicacionPropia || null;
    },
    contraparte() {
      return this.colaboracion?.publicacionContraparte || null;
    },
    perfil() {
      return this.colaboracion?.perfilContraparte || null;
    },
    imagen() {
      return this.colaboracion?.imagen || null;
    },
    nombreContraparte() {
      return this.perfil?.nombreArtistico || "la contraparte";
    },
    profesionContraparte() {
      return this.perfil?.profesion || "";
    },
    fotoContraparte() {
      return resolverFotoUrl(this.perfil?.fotoUrl);
    },
    inicialContraparte() {
      return (
        String(this.perfil?.nombreArtistico || "?")
          .trim()
          .charAt(0)
          .toUpperCase() || "?"
      );
    },
    portadaPropia() {
      return resolverFotoUrl(this.propia?.portadaUrl);
    },
    portadaContraparte() {
      return resolverFotoUrl(this.contraparte?.portadaUrl);
    },
    urlImagen() {
      return resolverFotoUrl(this.imagen?.url);
    },
    propiaEliminada() {
      return this.propia?.eliminada === true;
    },
    contraparteEliminada() {
      return this.contraparte?.eliminada === true;
    },
    puedeAbrirPropia() {
      return !this.propiaEliminada && this.propia?.idPublicacion != null;
    },
    puedeAbrirContraparte() {
      return (
        !this.contraparteEliminada &&
        this.contraparte?.idPublicacion != null
      );
    },
    tituloPropia() {
      return this.propiaEliminada
        ? "Publicación eliminada"
        : this.propia?.titulo || "Tu publicación";
    },
    tituloContraparte() {
      return this.contraparteEliminada
        ? "Publicación eliminada"
        : this.contraparte?.titulo || "Publicación";
    },
    estado() {
      return (
        normalizarEstadoColaboracionAutomatica(
          this.colaboracion?.estado
        ) ||
        this.colaboracion?.estado ||
        ""
      );
    },
    miEstado() {
      return (
        normalizarEstadoColaboracionAutomatica(
          this.colaboracion?.miEstado
        ) ||
        this.colaboracion?.miEstado ||
        ""
      );
    },
    estadoContraparte() {
      return (
        normalizarEstadoColaboracionAutomatica(
          this.colaboracion?.estadoContraparte
        ) ||
        this.colaboracion?.estadoContraparte ||
        ""
      );
    },
    etiquetaMiEstado() {
      return (
        ETIQUETAS_ESTADO_COLABORACION_AUTOMATICA[this.miEstado] ||
        this.miEstado ||
        "—"
      );
    },
    etiquetaEstadoContraparte() {
      return (
        ETIQUETAS_ESTADO_COLABORACION_AUTOMATICA[this.estadoContraparte] ||
        this.estadoContraparte ||
        "—"
      );
    },
    descripcionEstado() {
      return descripcionEstadoColaboracionAutomatica(
        this.colaboracion,
        this.nombreContraparte
      );
    },
    fechaDeteccion() {
      return this.colaboracion?.fechaDeteccion
        ? formatearFechaCorta(this.colaboracion.fechaDeteccion)
        : "";
    },
    fechaConfirmacion() {
      return this.colaboracion?.fechaConfirmacion
        ? formatearFechaCorta(this.colaboracion.fechaConfirmacion)
        : "";
    },
    fechaDisolucion() {
      return this.colaboracion?.fechaDisolucion
        ? formatearFechaCorta(this.colaboracion.fechaDisolucion)
        : "";
    },
    puedeConfirmar() {
      return this.colaboracion?.puedeConfirmar === true;
    },
    puedeRechazar() {
      return this.colaboracion?.puedeRechazar === true;
    },
  },
  watch: {
    "$route.params.id"() {
      this.cargar();
    },
  },
  mounted() {
    this.cargar();
  },
  beforeUnmount() {
    this.abortar();
  },
  methods: {
    abortar() {
      if (this.controlador) {
        this.controlador.abort();
        this.controlador = null;
      }
    },
    async cargar() {
      if (this.id == null) {
        this.cargando = false;
        this.colaboracion = null;
        this.error = "La propuesta indicada no es válida.";
        return;
      }

      this.abortar();
      const controller = new AbortController();
      this.controlador = controller;
      this.cargando = true;
      this.error = "";

      try {
        const response = await colaboracionAutomaticaService.obtener(
          this.id,
          controller.signal
        );
        if (this.controlador !== controller) return;

        this.colaboracion = normalizarColaboracionAutomatica(
          response?.data
        );
        if (!this.colaboracion) {
          this.error = "No se encontró la propuesta.";
        }
      } catch (error) {
        if (
          this.controlador !== controller ||
          error?.code === "ERR_CANCELED" ||
          error?.name === "CanceledError"
        ) {
          return;
        }
        this.colaboracion = null;
        this.error = mensajeErrorColaboracionAutomatica(
          error,
          "No se pudo cargar la propuesta."
        );
      } finally {
        if (this.controlador === controller) {
          this.cargando = false;
          this.controlador = null;
        }
      }
    },
    abrirGestion(accion) {
      if (this.procesando || !this.colaboracion) return;
      this.errorModal = "";
      this.modal = { visible: true, accion };
    },
    async gestionar() {
      if (this.procesando || !this.colaboracion) return;

      const accion = this.modal.accion;
      const esConfirmar =
        accion === ACCIONES_COLABORACION_AUTOMATICA.CONFIRMAR;
      const id = this.colaboracion.idColaboracionAutomatica;

      this.procesando = true;
      this.accionProcesando = accion;
      this.error = "";
      this.errorModal = "";

      try {
        const response = esConfirmar
          ? await colaboracionAutomaticaService.confirmar(id)
          : await colaboracionAutomaticaService.rechazar(id);

        const estadoRespuesta =
          normalizarColaboracionAutomatica(response?.data)?.estado || null;

        this.modal.visible = false;
        this.toast.init({
          title: esConfirmar
            ? estadoRespuesta ===
              ESTADOS_COLABORACION_AUTOMATICA.CONFIRMADA
              ? "Colaboración confirmada"
              : "Confirmación registrada"
            : "Propuesta rechazada",
          message: esConfirmar
            ? estadoRespuesta ===
              ESTADOS_COLABORACION_AUTOMATICA.CONFIRMADA
              ? "Ambos perfiles ya aparecen como colaboradores en la publicación del otro."
              : "Tu confirmación fue registrada. La colaboración se activará cuando la contraparte también confirme."
            : "La propuesta quedó rechazada y no se agregaron colaboradores.",
          color: esConfirmar ? "success" : "warning",
          position: "top-right",
          duration: 5000,
        });

        await this.refrescar();
      } catch (error) {
        const status = error?.response?.status;
        const mensaje = mensajeErrorColaboracionAutomatica(
          error,
          "No se pudo gestionar la propuesta."
        );

        if (status === 403 || status === 404 || status === 409) {
          this.modal.visible = false;
          await this.cargar();
          this.error = mensaje;
        } else {
          this.errorModal = mensaje;
        }
      } finally {
        this.procesando = false;
        this.accionProcesando = "";
      }
    },
    async refrescar() {
      await this.cargar();
      await Promise.allSettled([
        cargarResumenColaboracionesAutomaticas(),
        cargarResumenPerfil(idPerfilActivo()),
      ]);
    },
    volver() {
      this.$router.push({ name: "colaboraciones-automaticas" });
    },
    verPublicacion(publicacion) {
      if (publicacion?.idPublicacion == null) return;
      this.$router.push({
        name: "publicacion-detalle",
        params: { idPublicacion: publicacion.idPublicacion },
      });
    },
    verPerfil(perfil) {
      if (perfil?.idPerfil == null) return;
      this.$router.push({
        name: "ver-perfil",
        params: { id: perfil.idPerfil },
      });
    },
  },
};
</script>

<style scoped>
.detalle-colaboracion {
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding: 1.25rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: 14px;
}

.detalle-colaboracion__volver {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin-bottom: 1rem;
  padding: 0;
  color: var(--color-primary);
  background: none;
  border: 0;
  font: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.detalle-colaboracion__volver:hover {
  text-decoration: underline;
}

.detalle-colaboracion__volver .material-symbols-outlined {
  font-size: 1rem;
}

.detalle-colaboracion__estado {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem 1rem;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.detalle-colaboracion__hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border-soft);
}

.detalle-colaboracion__eyebrow {
  margin: 0;
  color: var(--color-primary);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.detalle-colaboracion__titulo {
  margin: 0.24rem 0 0;
  color: var(--color-text);
  font-size: 1.45rem;
  font-weight: 800;
  line-height: 1.3;
}

.detalle-colaboracion__descripcion {
  margin: 0.35rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  line-height: 1.5;
}

.detalle-colaboracion__publicaciones {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 0.75rem;
  margin-top: 1rem;
}

.detalle-publicacion {
  display: flex;
  gap: 0.8rem;
  min-width: 0;
  padding: 0.75rem;
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border-soft);
  border-radius: 12px;
}

.detalle-publicacion--eliminada {
  opacity: 0.8;
}

.detalle-publicacion__portada {
  display: grid;
  width: 96px;
  height: 84px;
  flex: 0 0 96px;
  place-items: center;
  overflow: hidden;
  color: var(--color-text-subtle);
  background: var(--color-chip);
  border-radius: 9px;
}

.detalle-publicacion__portada img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detalle-publicacion__info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.detalle-publicacion__rol {
  color: var(--color-text-muted);
  font-size: 0.64rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.detalle-publicacion__info h2 {
  margin: 0;
  overflow: hidden;
  color: var(--color-text);
  font-size: 0.92rem;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detalle-publicacion__aviso {
  margin: 0.15rem 0 0;
  color: var(--color-warning-text);
  font-size: 0.72rem;
  line-height: 1.4;
}

.detalle-publicacion__link {
  align-self: flex-start;
  margin-top: 0.25rem;
  padding: 0;
  color: var(--color-primary);
  background: none;
  border: 0;
  font: inherit;
  font-size: 0.74rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
}

.detalle-colaboracion__conector {
  color: var(--color-text-subtle);
  font-size: 1.2rem;
}

.detalle-colaboracion__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;
  margin-top: 0.8rem;
}

.detalle-colaboracion__panel {
  margin-top: 0.8rem;
  padding: 0.9rem 1rem;
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border-soft);
  border-radius: 12px;
}

.detalle-colaboracion__grid .detalle-colaboracion__panel {
  margin-top: 0;
}

.detalle-colaboracion__subtitulo {
  margin: 0 0 0.6rem;
  color: var(--color-text);
  font-size: 0.85rem;
  font-weight: 700;
}

.detalle-colaboracion__perfil {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.detalle-colaboracion__avatar {
  display: inline-grid;
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  place-items: center;
  overflow: hidden;
  color: var(--color-on-primary);
  background: var(--color-primary);
  border-radius: 50%;
  font-size: 0.85rem;
  font-weight: 700;
}

.detalle-colaboracion__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detalle-colaboracion__perfil-info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
  margin-right: auto;
}

.detalle-colaboracion__perfil-info strong {
  color: var(--color-text);
  font-size: 0.86rem;
}

.detalle-colaboracion__perfil-info span {
  color: var(--color-text-muted);
  font-size: 0.74rem;
}

.detalle-colaboracion__evidencia {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.detalle-colaboracion__evidencia img {
  width: 84px;
  height: 70px;
  flex: 0 0 84px;
  object-fit: cover;
  border-radius: 8px;
}

.detalle-colaboracion__evidencia p,
.detalle-colaboracion__texto-muted {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.76rem;
  line-height: 1.45;
}

.detalle-colaboracion__estados {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.7rem;
  margin: 0;
}

.detalle-colaboracion__estados div {
  display: flex;
  flex-direction: column;
  gap: 0.22rem;
}

.detalle-colaboracion__estados dt {
  color: var(--color-text-muted);
  font-size: 0.7rem;
  font-weight: 600;
}

.detalle-colaboracion__estados dd {
  margin: 0;
  color: var(--color-text);
  font-size: 0.82rem;
  font-weight: 600;
}

.detalle-colaboracion__explicacion {
  margin: 0.7rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.78rem;
  line-height: 1.45;
}

.detalle-colaboracion__fechas {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem 1.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.detalle-colaboracion__fechas li {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.detalle-colaboracion__fechas span {
  color: var(--color-text-muted);
  font-size: 0.7rem;
}

.detalle-colaboracion__fechas strong {
  color: var(--color-text);
  font-size: 0.8rem;
}

.detalle-colaboracion__acciones {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 1rem;
}

.detalle-colaboracion__sin-acciones {
  margin: 1rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

@media (max-width: 760px) {
  .detalle-colaboracion__hero {
    flex-direction: column;
  }

  .detalle-colaboracion__publicaciones,
  .detalle-colaboracion__grid {
    grid-template-columns: 1fr;
  }

  .detalle-colaboracion__conector {
    justify-self: center;
    transform: rotate(90deg);
  }

  .detalle-colaboracion__estados {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 520px) {
  .detalle-publicacion {
    flex-direction: column;
  }

  .detalle-publicacion__portada {
    width: 100%;
    height: 150px;
    flex-basis: auto;
  }

  .detalle-colaboracion__evidencia {
    align-items: flex-start;
  }
}
</style>
