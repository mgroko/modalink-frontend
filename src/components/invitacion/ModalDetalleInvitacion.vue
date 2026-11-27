<template>
  <VaModal
    :model-value="modelValue"
    hide-default-actions
    size="medium"
    blur
    class="detalle-invitacion"
    @update:model-value="onCambioVisibilidad"
  >
    <template #header>
      <h3 class="va-h5 detalle-invitacion__titulo">Detalle de invitación</h3>
    </template>

    <div v-if="invitacion" class="detalle-invitacion__contenido">
      <section class="detalle-invitacion__proyecto">
        <span class="detalle-invitacion__label">Proyecto</span>
        <div class="detalle-invitacion__proyecto-linea">
          <h4 class="detalle-invitacion__proyecto-nombre">
            {{ invitacion.nombreProyecto || "Proyecto" }}
          </h4>
          <EstadoInvitacionBadge :estado="invitacion.estado" />
        </div>
      </section>

      <section
        v-if="cargandoProyecto"
        class="detalle-invitacion__proyecto-info detalle-invitacion__proyecto-info--cargando"
      >
        <span class="material-symbols-outlined" aria-hidden="true">hourglass_empty</span>
        Cargando información del proyecto…
      </section>

      <section v-else-if="proyecto" class="detalle-invitacion__proyecto-info">
        <header class="detalle-invitacion__proyecto-info-cabecera">
          <span class="detalle-invitacion__label">Información general</span>
          <EstadoProyectoBadge :estado="proyecto.estado" />
        </header>

        <p
          v-if="proyecto.descripcion"
          class="detalle-invitacion__proyecto-descripcion"
          :title="proyecto.descripcion"
        >
          {{ proyecto.descripcion }}
        </p>

        <dl class="detalle-invitacion__proyecto-meta">
          <div>
            <dt>Privacidad</dt>
            <dd>{{ privacidadProyecto }}</dd>
          </div>
          <div>
            <dt>Inicio</dt>
            <dd>{{ formatearFechaCorta(proyecto.fechaInicio) }}</dd>
          </div>
          <div>
            <dt>Entrega estimada</dt>
            <dd>{{ formatearFechaCorta(proyecto.fechaEntregaEstipulada) }}</dd>
          </div>
          <div v-if="proyecto.fechaFinalizacion">
            <dt>Finalización</dt>
            <dd>{{ formatearFechaCorta(proyecto.fechaFinalizacion) }}</dd>
          </div>
          <div>
            <dt>Director</dt>
            <dd>{{ proyecto.nombreDirector || "—" }}</dd>
          </div>
          <div v-if="ubicacionProyecto">
            <dt>Ubicación</dt>
            <dd>{{ ubicacionProyecto }}</dd>
          </div>
        </dl>
      </section>

      <p v-else-if="errorProyecto" class="detalle-invitacion__proyecto-nota">
        {{ errorProyecto }}
      </p>

      <dl class="detalle-invitacion__meta">
        <div>
          <dt>Tipo</dt>
          <dd>{{ etiquetaTipoInvitacion(invitacion.tipo) }}</dd>
        </div>
        <div>
          <dt>Dirección</dt>
          <dd>{{ etiquetaDireccion }}</dd>
        </div>
        <div>
          <dt>Fecha de envío</dt>
          <dd>{{ fechaEnvio }}</dd>
        </div>
        <div v-if="esRechazada && fechaRechazo">
          <dt>Fecha de rechazo</dt>
          <dd>{{ fechaRechazo }}</dd>
        </div>
      </dl>

      <section
        v-if="esActividad && invitacion.nombreActividad"
        class="detalle-invitacion__bloque"
      >
        <span class="detalle-invitacion__label">Actividad</span>
        <p class="detalle-invitacion__texto">
          {{ invitacion.nombreActividad }}
        </p>
      </section>

      <section
        v-if="esActividad && invitacion.idRequerimientoActividad != null"
        class="detalle-invitacion__bloque"
      >
        <span class="detalle-invitacion__label">Requerimiento</span>
        <p class="detalle-invitacion__texto">
          #{{ invitacion.idRequerimientoActividad }}
        </p>
      </section>

      <section
        v-if="
          esRequerimientoGeneral && invitacion.idRequerimientoGral != null
        "
        class="detalle-invitacion__bloque"
      >
        <span class="detalle-invitacion__label">Requerimiento general</span>
        <p
          v-if="requerimientoGeneralProyecto"
          class="detalle-invitacion__texto"
        >
          {{ requerimientoGeneralProyecto.nombreProfesion || "Requerimiento" }}
          <template v-if="requerimientoGeneralProyecto.cantidad != null">
            · {{ requerimientoGeneralProyecto.cantidad }}
            {{
              requerimientoGeneralProyecto.cantidad === 1
                ? "persona"
                : "personas"
            }}
          </template>
          <template v-if="requerimientoGeneralProyecto.faltantes != null">
            · {{ requerimientoGeneralProyecto.faltantes }}
            {{
              requerimientoGeneralProyecto.faltantes === 1
                ? "vacante"
                : "vacantes"
            }}
          </template>
        </p>
        <p v-else class="detalle-invitacion__texto">
          #{{ invitacion.idRequerimientoGral }}
        </p>
      </section>

      <section class="detalle-invitacion__bloque">
        <span class="detalle-invitacion__label">Mensaje</span>
        <p
          class="detalle-invitacion__mensaje"
          :class="{ 'detalle-invitacion__mensaje--vacio': !invitacion.mensaje }"
        >
          {{ invitacion.mensaje || "Sin mensaje personalizado." }}
        </p>
      </section>

      <section class="detalle-invitacion__bloque">
        <span class="detalle-invitacion__label">Perfil emisor</span>
        <div class="detalle-invitacion__emisor">
          <button
            type="button"
            class="detalle-invitacion__avatar"
            :disabled="!puedeVerPerfilEmisor"
            :title="puedeVerPerfilEmisor ? `Ver perfil de ${nombreEmisor}` : undefined"
            :aria-label="
              puedeVerPerfilEmisor
                ? `Ver perfil de ${nombreEmisor}`
                : 'Perfil emisor'
            "
            @click="verPerfilEmisor"
          >
            <img
              v-if="fotoEmisor && !fotoRota"
              :src="fotoEmisor"
              :alt="nombreEmisor"
              @error="fotoRota = true"
            />
            <template v-else>{{ inicialEmisor }}</template>
          </button>

          <span class="detalle-invitacion__emisor-datos">
            <button
              type="button"
              class="detalle-invitacion__emisor-nombre"
              :disabled="!puedeVerPerfilEmisor"
              :title="
                puedeVerPerfilEmisor
                  ? `Ver perfil de ${nombreEmisor}`
                  : undefined
              "
              @click="verPerfilEmisor"
            >
              {{ nombreEmisor }}
            </button>
            <span class="detalle-invitacion__emisor-profesion">
              {{ invitacion.remitente?.nombreProfesion || "Sin profesión" }}
            </span>
            <span v-if="nombreCompletoEmisor" class="detalle-invitacion__emisor-real">
              {{ nombreCompletoEmisor }}
            </span>
          </span>

        </div>
      </section>
    </div>

    <template #footer>
      <div class="detalle-invitacion__acciones">
        <div class="detalle-invitacion__acciones-izquierda">
          <VaButton
            v-if="puedeGestionarInvitacion"
            preset="secondary"
            color="danger"
            @click="$emit('rechazar', invitacion)"
          >
            Rechazar invitación
          </VaButton>
          <VaButton
            v-else-if="puedeEliminarInvitacion"
            preset="secondary"
            color="danger"
            @click="$emit('eliminar', invitacion)"
          >
            Eliminar invitación
          </VaButton>
        </div>

        <div class="detalle-invitacion__acciones-principales">
          <VaButton
            v-if="puedeIrAlProyecto && !puedeVerProyecto"
            preset="secondary"
            icon="mso-open_in_new"
            @click="$emit('ver-proyecto', invitacion)"
          >
            Ver proyecto
          </VaButton>
          <VaButton preset="secondary" @click="cerrar">Cerrar</VaButton>
          <VaButton
            v-if="puedeGestionarInvitacion"
            preset="primary"
            @click="$emit('aceptar', invitacion)"
          >
            Aceptar invitación
          </VaButton>
          <VaButton
            v-else-if="puedeVerProyecto"
            preset="primary"
            @click="$emit('ver-proyecto', invitacion)"
          >
            Ver proyecto
          </VaButton>
        </div>
      </div>
    </template>
  </VaModal>
</template>

<script>
import EstadoInvitacionBadge from "./EstadoInvitacionBadge.vue";
import EstadoProyectoBadge from "../proyecto/EstadoProyectoBadge.vue";
import perfilService from "../../services/perfilService.js";
import proyectoService from "../../services/proyectoService.js";
import { resolverFotoUrl } from "../../utils/fotos.js";
import { formatearFechaCorta } from "../../utils/fechas.js";
import {
  DIRECCIONES_INVITACION,
  ESTADOS_INVITACION,
  ETIQUETAS_DIRECCION,
  etiquetaTipoInvitacion,
  nombreCompletoPerfil,
} from "../../utils/invitacionBusquedaConstants.js";
import { TIPOS_INVITACION } from "../../utils/invitacionConstants.js";

export default {
  name: "ModalDetalleInvitacion",
  components: { EstadoInvitacionBadge, EstadoProyectoBadge },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    invitacion: {
      type: Object,
      default: null,
    },
    eliminacionBloqueada: {
      type: Boolean,
      default: false,
    },
    gestionBloqueada: {
      type: Boolean,
      default: false,
    },
  },
  emits: [
    "update:modelValue",
    "ver-proyecto",
    "eliminar",
    "aceptar",
    "rechazar",
  ],
  data() {
    return {
      fotoUrl: null,
      fotoRota: false,
      idCarga: 0,
      proyecto: null,
      cargandoProyecto: false,
      errorProyecto: "",
      idCargaProyecto: 0,
    };
  },
  computed: {
    esActividad() {
      return this.invitacion?.tipo === TIPOS_INVITACION.ACTIVIDAD;
    },
    esRequerimientoGeneral() {
      return (
        this.invitacion?.tipo === TIPOS_INVITACION.REQUERIMIENTO_GENERAL
      );
    },
    requerimientoGeneralProyecto() {
      if (!this.esRequerimientoGeneral) return null;
      const id = this.invitacion?.idRequerimientoGral;
      if (id == null) return null;
      return (
        (this.proyecto?.requerimientosGral || []).find(
          (requerimiento) =>
            String(requerimiento?.idRequerimientoGral) === String(id)
        ) || null
      );
    },
    puedeVerProyecto() {
      return this.invitacion?.estado === ESTADOS_INVITACION.ACEPTADA;
    },
    idProyectoInvitacion() {
      return this.invitacion?.idProyecto ?? null;
    },
    /**
     * Se puede abrir el proyecto cuando la invitación ya fue aceptada o cuando
     * la información se pudo cargar (proyecto público / miembro del proyecto).
     */
    puedeIrAlProyecto() {
      return (
        this.idProyectoInvitacion != null &&
        (this.puedeVerProyecto || !!this.proyecto)
      );
    },
    privacidadProyecto() {
      const privacidad = this.proyecto?.privacidad;
      if (privacidad === "PUBLICO") return "Público";
      if (privacidad === "PRIVADO") return "Privado";
      return privacidad || "—";
    },
    ubicacionProyecto() {
      const ciudad = this.proyecto?.ubicacion?.ciudad?.nombre;
      const provincia = this.proyecto?.ubicacion?.ciudad?.provincia?.nombre;
      return [ciudad, provincia].filter(Boolean).join(", ");
    },
    puedeGestionarInvitacion() {
      return (
        !this.gestionBloqueada &&
        this.invitacion?.direccion === DIRECCIONES_INVITACION.RECIBIDA &&
        this.invitacion?.estado === ESTADOS_INVITACION.PENDIENTE
      );
    },
    puedeEliminarInvitacion() {
      return (
        !this.eliminacionBloqueada &&
        this.invitacion?.direccion === DIRECCIONES_INVITACION.ENVIADA &&
        this.invitacion?.estado === ESTADOS_INVITACION.PENDIENTE &&
        this.invitacion?.puedeEliminar === true
      );
    },
    etiquetaDireccion() {
      return ETIQUETAS_DIRECCION[this.invitacion?.direccion] || "";
    },
    fechaEnvio() {
      return formatearFechaCorta(this.invitacion?.fechaEnvio);
    },
    fechaRechazo() {
      return this.invitacion?.fechaRechazo
        ? formatearFechaCorta(this.invitacion.fechaRechazo)
        : "";
    },
    esRechazada() {
      return this.invitacion?.estado === ESTADOS_INVITACION.RECHAZADA;
    },
    idPerfilEmisor() {
      return this.invitacion?.remitente?.idPerfil ?? null;
    },
    puedeVerPerfilEmisor() {
      return this.idPerfilEmisor != null;
    },
    nombreEmisor() {
      return this.invitacion?.remitente?.nombreArtistico || "Perfil";
    },
    inicialEmisor() {
      return String(this.nombreEmisor).trim().charAt(0).toUpperCase() || "?";
    },
    nombreCompletoEmisor() {
      return nombreCompletoPerfil(this.invitacion?.remitente);
    },
    fotoEmisor() {
      return resolverFotoUrl(
        this.fotoUrl ||
          this.invitacion?.remitente?.fotoUrl ||
          this.invitacion?.remitente?.urlFoto ||
          this.invitacion?.remitente?.fotoPerfil
      );
    },
  },
  watch: {
    modelValue(valor) {
      if (valor) {
        this.cargarFoto();
        this.cargarProyecto();
      } else {
        this.idCarga += 1;
        this.idCargaProyecto += 1;
      }
    },
    "invitacion.idInvitacion"() {
      this.fotoUrl = null;
      this.fotoRota = false;
      this.proyecto = null;
      this.errorProyecto = "";
      if (this.modelValue) {
        this.cargarFoto();
        this.cargarProyecto();
      }
    },
  },
  mounted() {
    if (this.modelValue) {
      this.cargarFoto();
      this.cargarProyecto();
    }
  },
  beforeUnmount() {
    this.idCarga += 1;
    this.idCargaProyecto += 1;
  },
  methods: {
    formatearFechaCorta,
    etiquetaTipoInvitacion,
    onCambioVisibilidad(valor) {
      this.$emit("update:modelValue", valor);
    },
    cerrar() {
      this.$emit("update:modelValue", false);
    },
    verPerfilEmisor() {
      if (!this.puedeVerPerfilEmisor) return;
      this.$emit("update:modelValue", false);
      this.$router.push({
        name: "ver-perfil",
        params: { id: this.idPerfilEmisor },
      });
    },
    async cargarFoto() {
      const idPerfil = this.invitacion?.remitente?.idPerfil;
      if (idPerfil == null) {
        this.fotoUrl = null;
        return;
      }

      // Si la invitación ya trae la foto del remitente, no hace falta pedir
      // el perfil completo.
      if (this.invitacion?.remitente?.fotoUrl) {
        this.fotoUrl = null;
        this.fotoRota = false;
        return;
      }

      const corrida = ++this.idCarga;
      this.fotoRota = false;

      try {
        const response = await perfilService.obtener(idPerfil);
        if (corrida !== this.idCarga) return;

        const perfil = response?.data || null;
        this.fotoUrl =
          perfil?.fotoUrl || perfil?.urlFoto || perfil?.fotoPerfil || null;
      } catch {
        if (corrida === this.idCarga) this.fotoUrl = null;
      }
    },
    async cargarProyecto() {
      const idProyecto = this.idProyectoInvitacion;
      this.proyecto = null;
      this.errorProyecto = "";

      if (idProyecto == null) {
        this.cargandoProyecto = false;
        return;
      }

      const corrida = ++this.idCargaProyecto;
      this.cargandoProyecto = true;

      try {
        const response = await proyectoService.obtener(idProyecto);
        if (corrida !== this.idCargaProyecto) return;
        this.proyecto = response?.data || null;
      } catch (error) {
        if (corrida !== this.idCargaProyecto) return;
        this.proyecto = null;
        this.errorProyecto =
          error?.response?.status === 403
            ? "El proyecto es privado: vas a poder ver su información cuando aceptes la invitación."
            : "No se pudo cargar la información del proyecto.";
      } finally {
        if (corrida === this.idCargaProyecto) this.cargandoProyecto = false;
      }
    },
  },
};
</script>

<style scoped>
.detalle-invitacion__titulo {
  margin: 0;
}

.detalle-invitacion__contenido {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.detalle-invitacion__proyecto {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.85rem 0.95rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface-muted);
}

.detalle-invitacion__proyecto-linea {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.detalle-invitacion__proyecto-nombre {
  margin: 0;
  color: var(--color-text);
  font-size: 1rem;
  font-weight: 700;
}

/* Información general del proyecto */
.detalle-invitacion__proyecto-info {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding: 0.85rem 0.95rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface-soft);
}

.detalle-invitacion__proyecto-info--cargando {
  flex-direction: row;
  align-items: center;
  gap: 0.4rem;
  color: var(--color-text-muted);
  font-size: 0.82rem;
}

.detalle-invitacion__proyecto-info--cargando .material-symbols-outlined {
  font-size: 1.1rem;
}

.detalle-invitacion__proyecto-info-cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.detalle-invitacion__proyecto-descripcion {
  display: -webkit-box;
  overflow: hidden;
  margin: 0;
  color: var(--color-text);
  font-size: 0.85rem;
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.detalle-invitacion__proyecto-meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.6rem 0.9rem;
  margin: 0;
}

.detalle-invitacion__proyecto-meta div {
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
  min-width: 0;
}

.detalle-invitacion__proyecto-meta dt {
  color: var(--color-text-muted);
  font-size: 0.68rem;
  font-weight: 600;
}

.detalle-invitacion__proyecto-meta dd {
  overflow: hidden;
  margin: 0;
  color: var(--color-text);
  font-size: 0.8rem;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detalle-invitacion__proyecto-nota {
  margin: 0;
  padding: 0.65rem 0.8rem;
  border-radius: 8px;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.detalle-invitacion__label {
  color: var(--color-text-muted);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.detalle-invitacion__meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.85rem;
  margin: 0;
}

.detalle-invitacion__meta div {
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
}

.detalle-invitacion__meta dt {
  color: var(--color-text-muted);
  font-size: 0.7rem;
  font-weight: 600;
}

.detalle-invitacion__meta dd {
  margin: 0;
  color: var(--color-text);
  font-size: 0.82rem;
  font-weight: 600;
}

.detalle-invitacion__bloque {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.detalle-invitacion__texto,
.detalle-invitacion__mensaje {
  margin: 0;
  color: var(--color-text);
  font-size: 0.86rem;
  line-height: 1.5;
  white-space: pre-wrap;
}

.detalle-invitacion__mensaje {
  padding: 0.65rem 0.75rem;
  border-radius: 8px;
  background: var(--color-surface-muted);
}

.detalle-invitacion__mensaje--vacio {
  color: var(--color-text-muted);
  font-style: italic;
}

.detalle-invitacion__emisor {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.detalle-invitacion__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  overflow: hidden;
  border: 0;
  border-radius: 50%;
  background: var(--color-primary-fill);
  color: var(--color-on-primary, #fff);
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
}

.detalle-invitacion__avatar:hover:not(:disabled) {
  box-shadow: 0 0 0 2px var(--color-primary-light, var(--color-border-strong));
}

.detalle-invitacion__avatar:disabled {
  cursor: default;
}

.detalle-invitacion__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detalle-invitacion__emisor-datos {
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
}

.detalle-invitacion__emisor-nombre {
  align-self: flex-start;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-text);
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
}

.detalle-invitacion__emisor-nombre:hover:not(:disabled) {
  color: var(--color-primary);
  text-decoration: underline;
}

.detalle-invitacion__emisor-nombre:disabled {
  cursor: default;
}

.detalle-invitacion__emisor-profesion,
.detalle-invitacion__emisor-real {
  color: var(--color-text-muted);
  font-size: 0.78rem;
}

.detalle-invitacion__emisor-real {
  font-size: 0.74rem;
}

.detalle-invitacion__acciones {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
}

.detalle-invitacion__acciones-izquierda {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.detalle-invitacion__acciones-principales {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 1rem;
  margin-left: auto;
}

@media (max-width: 560px) {
  .detalle-invitacion__meta {
    grid-template-columns: 1fr;
  }

  .detalle-invitacion__proyecto-meta {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .detalle-invitacion__proyecto-linea {
    align-items: flex-start;
    flex-direction: column;
  }

  .detalle-invitacion__acciones {
    flex-direction: column-reverse;
    align-items: stretch;
  }

  .detalle-invitacion__acciones-izquierda,
  .detalle-invitacion__acciones-principales {
    flex-direction: column-reverse;
    margin-left: 0;
  }
}
</style>
