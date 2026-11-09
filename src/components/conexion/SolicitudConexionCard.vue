<template>
  <article class="solicitud-conexion-card">
    <div class="solicitud-conexion-card__avatar" aria-hidden="true">
      <img v-if="foto" :src="foto" :alt="nombreArtistico" />
      <span v-else>{{ iniciales }}</span>
    </div>

    <div class="solicitud-conexion-card__contenido">
      <div class="solicitud-conexion-card__encabezado">
        <button
          type="button"
          class="solicitud-conexion-card__nombre"
          @click="$emit('ver-perfil', perfil)"
        >
          {{ nombreArtistico }}
        </button>
        <span class="solicitud-conexion-card__direccion">
          {{ direccion }}
        </span>
        <span
          class="solicitud-conexion-card__estado"
          :class="claseEstado"
        >
          {{ estado }}
        </span>
      </div>

      <p class="solicitud-conexion-card__profesion">{{ profesion }}</p>
      <p v-if="nombreReal" class="solicitud-conexion-card__nombre-real">
        {{ nombreReal }}
      </p>
      <p class="solicitud-conexion-card__fecha">
        <span class="material-symbols-outlined" aria-hidden="true">schedule</span>
        {{ fecha }}
      </p>
    </div>

    <div class="solicitud-conexion-card__acciones">
      <span
        v-if="solicitud?.puedeAceptar || solicitud?.puedeRechazar"
        class="solicitud-conexion-card__proximamente"
      >
        Próximamente
      </span>

      <VaButton
        v-if="solicitud?.puedeCancelar"
        preset="secondary"
        color="danger"
        size="small"
        icon="mso-close"
        :loading="cancelando"
        :disabled="cancelando"
        @click="$emit('cancelar', solicitud)"
      >
        Cancelar solicitud
      </VaButton>

      <VaButton
        v-if="solicitud?.puedeRechazar"
        preset="secondary"
        size="small"
        icon="mso-close"
        disabled
        title="Próximamente"
      >
        Rechazar
      </VaButton>

      <VaButton
        v-if="solicitud?.puedeAceptar"
        color="#5CA4A9"
        size="small"
        icon="mso-check"
        disabled
        title="Próximamente"
      >
        Aceptar
      </VaButton>
    </div>
  </article>
</template>

<script>
import {
  claseEstadoSolicitud,
  etiquetaDireccion,
  etiquetaEstado,
} from "../../utils/solicitudesConexionConstants.js";
import { resolverFotoUrl } from "../../utils/fotos.js";
import { formatearFecha } from "../../utils/fechas.js";

export default {
  name: "SolicitudConexionCard",
  props: {
    solicitud: {
      type: Object,
      required: true,
    },
    cancelando: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["cancelar", "ver-perfil"],
  computed: {
    perfil() {
      return this.solicitud?.perfil || null;
    },
    nombreArtistico() {
      return this.perfil?.nombreArtistico || "Perfil";
    },
    nombreReal() {
      const nombre = String(this.perfil?.nombre || "").trim();
      const apellido = String(this.perfil?.apellido || "").trim();
      return [nombre, apellido].filter(Boolean).join(" ");
    },
    profesion() {
      return this.perfil?.nombreProfesion || "Profesión";
    },
    foto() {
      return resolverFotoUrl(this.perfil?.fotoUrl);
    },
    iniciales() {
      const nombre = this.nombreArtistico;
      return nombre
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((parte) => parte.charAt(0).toUpperCase())
        .join("");
    },
    direccion() {
      return etiquetaDireccion(this.solicitud?.direccion);
    },
    estado() {
      return etiquetaEstado(this.solicitud?.estado);
    },
    claseEstado() {
      return claseEstadoSolicitud(this.solicitud?.estado);
    },
    fecha() {
      return formatearFecha(this.solicitud?.fechaEnvio);
    },
  },
};
</script>

<style scoped>
.solicitud-conexion-card {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
}

.solicitud-conexion-card__avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  overflow: hidden;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-secondary);
  color: var(--color-on-primary);
  font-size: 1.1rem;
  font-weight: 700;
}

.solicitud-conexion-card__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.solicitud-conexion-card__contenido {
  flex: 1 1 220px;
  min-width: 0;
}

.solicitud-conexion-card__encabezado {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.solicitud-conexion-card__nombre {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-text);
  font-size: 1rem;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
}

.solicitud-conexion-card__nombre:hover {
  color: var(--color-primary);
  text-decoration: underline;
}

.solicitud-conexion-card__direccion {
  color: var(--color-text-muted);
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.solicitud-conexion-card__estado {
  padding: 0.2rem 0.6rem;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 700;
}

.solicitud-badge--pendiente {
  background: var(--color-chip);
  color: var(--color-primary);
}

.solicitud-badge--aceptada {
  background: var(--color-success-soft);
  color: var(--color-success-text);
}

.solicitud-badge--rechazada {
  background: var(--color-danger-soft);
  color: var(--color-danger-text);
}

.solicitud-conexion-card__profesion,
.solicitud-conexion-card__nombre-real,
.solicitud-conexion-card__fecha {
  margin: 0.2rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.82rem;
  line-height: 1.4;
}

.solicitud-conexion-card__nombre-real {
  font-size: 0.78rem;
}

.solicitud-conexion-card__fecha {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.35rem;
  font-size: 0.75rem;
}

.solicitud-conexion-card__fecha .material-symbols-outlined {
  font-size: 0.95rem;
}

.solicitud-conexion-card__acciones {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-left: auto;
}

.solicitud-conexion-card__proximamente {
  color: var(--color-text-muted);
  font-size: 0.72rem;
  font-weight: 600;
}

@media (max-width: 640px) {
  .solicitud-conexion-card__acciones {
    width: 100%;
    justify-content: flex-start;
    margin-left: 0;
  }
}
</style>
