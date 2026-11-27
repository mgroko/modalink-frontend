<template>
  <div class="tyc-miembros-lista">
    <BaseAlert v-if="error" :message="error" type="error" />

    <div
      v-if="error && puedeReintentar"
      class="tyc-miembros-lista__reintento"
    >
      <VaButton preset="primary" size="small" @click="$emit('reintentar')">
        Reintentar
      </VaButton>
    </div>

    <p v-if="cargando && !miembros.length" class="tyc-miembros-lista__nota">
      Cargando TyC de miembros...
    </p>

    <p
      v-else-if="!error && !miembros.length"
      class="tyc-miembros-lista__vacio"
    >
      Este proyecto todavía no tiene TyC aceptados registrados.
    </p>

    <ul
      v-else-if="!error"
      class="tyc-miembros-lista__items"
      aria-label="TyC aceptados por los miembros del proyecto"
    >
      <li
        v-for="miembro in miembros"
        :key="`tyc-${miembro.idMiembro ?? miembro.idPerfil ?? miembro.nombreArtistico}`"
        class="miembro-tyc"
      >
        <header class="miembro-tyc__cabecera">
          <div class="miembro-tyc__identidad">
            <span class="miembro-tyc__nombre">
              {{ miembro.nombreArtistico || "Perfil" }}
            </span>
            <span
              v-if="miembro.nombreProfesion"
              class="miembro-tyc__profesion"
            >
              {{ miembro.nombreProfesion }}
            </span>
            <span v-if="mostrarRol && miembro.rol" class="miembro-tyc__rol">
              {{ etiquetaRol(miembro.rol) }}
            </span>
          </div>

          <span
            class="miembro-tyc__version"
            :class="{
              'miembro-tyc__version--vacia': miembro.idTycAceptado == null,
            }"
          >
            {{
              miembro.idTycAceptado != null
                ? `Versión ${miembro.numeroVersionAceptado ?? miembro.idTycAceptado}`
                : "Sin TyC aceptado"
            }}
          </span>
        </header>

        <p
          v-if="miembro.fechaInicio || miembro.fechaFin"
          class="miembro-tyc__fechas"
        >
          <template v-if="miembro.fechaInicio">
            Aceptado el {{ formatearFechaCorta(miembro.fechaInicio) }}
          </template>
          <template v-if="miembro.fechaFin">
            · Versión cerrada el {{ formatearFechaCorta(miembro.fechaFin) }}
          </template>
        </p>

        <div v-if="miembro.descripcion" class="miembro-tyc__texto">
          {{ miembro.descripcion }}
        </div>
        <p v-else class="miembro-tyc__vacio">
          No hay una versión de TyC registrada para este miembro.
        </p>
      </li>
    </ul>
  </div>
</template>

<script>
import BaseAlert from "../AlertaBase.vue";
import { formatearFechaCorta } from "../../utils/fechas.js";
import { etiquetaRolProyecto } from "../../utils/proyectoConstants.js";

/*
 * Lista reutilizable de TyC aceptados por miembros del proyecto.
 * La usan la pestaña interna "TyC de miembros" y la vista pública.
 */
export default {
  name: "TyCMiembrosLista",
  components: { BaseAlert },
  props: {
    miembros: {
      type: Array,
      default: () => [],
    },
    cargando: {
      type: Boolean,
      default: false,
    },
    error: {
      type: String,
      default: "",
    },
    puedeReintentar: {
      type: Boolean,
      default: false,
    },
    mostrarRol: {
      type: Boolean,
      default: true,
    },
  },
  emits: ["reintentar"],
  methods: {
    formatearFechaCorta,
    etiquetaRol(rol) {
      return etiquetaRolProyecto(rol);
    },
  },
};
</script>

<style scoped>
.tyc-miembros-lista {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.tyc-miembros-lista__reintento {
  display: flex;
  justify-content: flex-start;
}

.tyc-miembros-lista__nota,
.tyc-miembros-lista__vacio {
  margin: 0;
  padding-bottom: 1.1rem;
  color: var(--color-text-muted);
  font-size: 0.86rem;
}

.tyc-miembros-lista__items {
  display: flex;
  flex-direction: column;
  margin: 0 -1.5rem;
  padding: 0 0 0.35rem;
  list-style: none;
}

.miembro-tyc {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.9rem 1.5rem;
  border-top: 1px solid var(--color-border-soft);
}

.miembro-tyc__cabecera {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.miembro-tyc__identidad {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.45rem;
  min-width: 0;
}

.miembro-tyc__nombre {
  color: var(--color-text);
  font-size: 0.94rem;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.miembro-tyc__profesion,
.miembro-tyc__rol {
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.miembro-tyc__rol {
  padding: 0.08rem 0.45rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface-muted);
  font-size: 0.7rem;
  font-weight: 600;
}

.miembro-tyc__version {
  flex: 0 0 auto;
  padding: 0.12rem 0.55rem;
  border: 1px solid var(--color-info-border);
  border-radius: 999px;
  background: var(--color-info-soft);
  color: var(--color-info-text);
  font-size: 0.7rem;
  font-weight: 600;
}

.miembro-tyc__version--vacia {
  border-color: var(--color-border);
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
}

.miembro-tyc__fechas {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.76rem;
  line-height: 1.4;
}

.miembro-tyc__texto {
  max-height: 22rem;
  overflow-y: auto;
  padding: 0.75rem 0.85rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface-muted);
  color: var(--color-text);
  font-size: 0.82rem;
  line-height: 1.55;
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.miembro-tyc__vacio {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.82rem;
  line-height: 1.45;
}

@media (max-width: 720px) {
  .miembro-tyc {
    padding-inline: 1rem;
  }

  .tyc-miembros-lista__items {
    margin-inline: -1rem;
  }
}
</style>
