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
import perfilService from "../../services/perfilService.js";
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
  components: { EstadoInvitacionBadge },
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
    };
  },
  computed: {
    esActividad() {
      return this.invitacion?.tipo === TIPOS_INVITACION.ACTIVIDAD;
    },
    puedeVerProyecto() {
      return this.invitacion?.estado === ESTADOS_INVITACION.ACEPTADA;
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
      return resolverFotoUrl(this.fotoUrl || this.invitacion?.remitente?.fotoUrl);
    },
  },
  watch: {
    modelValue(valor) {
      if (valor) {
        this.cargarFoto();
      } else {
        this.idCarga += 1;
      }
    },
    "invitacion.idInvitacion"() {
      this.fotoUrl = null;
      this.fotoRota = false;
      if (this.modelValue) this.cargarFoto();
    },
  },
  beforeUnmount() {
    this.idCarga += 1;
  },
  methods: {
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
  gap: 1rem;
  margin-left: auto;
}

@media (max-width: 560px) {
  .detalle-invitacion__meta {
    grid-template-columns: 1fr;
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
