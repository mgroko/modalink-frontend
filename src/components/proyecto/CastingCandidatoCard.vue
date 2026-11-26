<template>
  <article
    class="casting-card"
    :class="{ 'casting-card--destacada': destacada }"
    :aria-label="`Candidato ${candidato.nombreArtistico}`"
  >
    <header class="casting-card__cabecera">
      <div class="casting-card__avatar">
        <img
          v-if="candidato.fotoUrl"
          :src="resolverFotoUrl(candidato.fotoUrl)"
          :alt="`Foto de ${candidato.nombreArtistico}`"
          class="casting-card__avatar-imagen"
          loading="lazy"
        />
        <span v-else class="casting-card__avatar-iniciales">
          {{ iniciales(candidato.nombreArtistico) }}
        </span>
      </div>

      <div class="casting-card__datos">
        <h3 class="casting-card__nombre">
          {{ candidato.nombreArtistico || "Perfil" }}
        </h3>
        <p v-if="ubicacion" class="casting-card__ubicacion">
          {{ ubicacion }}
        </p>
      </div>

      <span class="casting-card__cumplimiento">
        {{ resumenCumplimiento }}
      </span>
    </header>

    <div class="casting-card__estado">
      <EstadoPostulacionBadge :estado="candidato.estado" />
      <span
        v-if="esAceptadaConMiembroInactivo(candidato)"
        class="casting-card__aviso"
      >
        El miembro ya no está activo; el cupo puede estar libre.
      </span>
    </div>

    <div
      v-if="porcentaje !== null"
      class="casting-card__barra"
      role="progressbar"
      :aria-valuenow="porcentaje"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <span
        class="casting-card__barra-relleno"
        :style="{ width: `${porcentaje}%` }"
      ></span>
    </div>

    <section class="casting-card__seccion">
      <h4 class="casting-card__seccion-titulo">Polaroids</h4>
      <CastingPolaroids :polaroids="candidato.polaroids || []" />
    </section>

    <section class="casting-card__seccion">
      <h4 class="casting-card__seccion-titulo">Medidas</h4>

      <dl v-if="caracteristicas.length" class="casting-card__medidas">
        <div
          v-for="caracteristica in caracteristicas"
          :key="`${caracteristica.idCaracteristica}-${caracteristica.codigo}`"
          class="casting-card__medida"
        >
          <dt>{{ etiquetaCaracteristica(caracteristica) }}</dt>
          <dd>
            <span
              v-if="caracteristica.colorHex"
              class="casting-card__color"
              :style="{ background: caracteristica.colorHex }"
              aria-hidden="true"
            ></span>
            {{ formatearValorCaracteristica(caracteristica) }}
          </dd>
        </div>
      </dl>

      <p v-else class="casting-card__vacio">
        El perfil no tiene características técnicas cargadas.
      </p>
    </section>

    <section class="casting-card__seccion">
      <h4 class="casting-card__seccion-titulo">Requisitos</h4>

      <ul v-if="requisitos.length" class="casting-card__requisitos">
        <li
          v-for="requisito in requisitos"
          :key="requisito.clave"
          class="casting-card__requisito"
          :class="claseRequisito(requisito.cumple)"
        >
          <span class="material-symbols-outlined casting-card__requisito-icono">
            {{ iconoRequisito(requisito.cumple) }}
          </span>

          <div class="casting-card__requisito-texto">
            <span class="casting-card__requisito-nombre">
              {{ requisito.nombre }}
            </span>
            <span
              v-if="requisito.valorPedido"
              class="casting-card__requisito-pedido"
            >
              {{ requisito.valorPedido }}
            </span>
          </div>

          <span class="casting-card__requisito-valor">
            {{ requisito.valorPerfil || "—" }}
          </span>
        </li>
      </ul>

      <p v-else class="casting-card__vacio">
        El requerimiento no tiene requisitos adicionales para este candidato.
      </p>
    </section>

    <footer class="casting-card__acciones">
      <VaButton
        v-if="candidato.puedeRechazar"
        preset="secondary"
        color="danger"
        size="small"
        :disabled="accionEnCurso"
        :aria-label="`Rechazar a ${candidato.nombreArtistico}`"
        @click="$emit('rechazar')"
      >
        Rechazar
      </VaButton>

      <VaButton
        v-if="candidato.puedeAceptar"
        preset="primary"
        size="small"
        :disabled="accionEnCurso"
        :aria-label="`Aceptar a ${candidato.nombreArtistico}`"
        @click="$emit('aceptar')"
      >
        Aceptar
      </VaButton>

      <span
        v-if="!candidato.puedeAceptar && !candidato.puedeRechazar"
        class="casting-card__sin-accion"
      >
        Sin acciones disponibles
      </span>
    </footer>
  </article>
</template>

<script>
import EstadoPostulacionBadge from "./EstadoPostulacionBadge.vue";
import CastingPolaroids from "./CastingPolaroids.vue";
import { resolverFotoUrl } from "../../utils/fotos.js";
import { normCodigo } from "../../utils/perfilConstants.js";
import {
  CODIGOS_MEDIDAS_CASTING,
  claseRequisito,
  etiquetaAgenda,
  etiquetaCaracteristica,
  formatearValorCaracteristica,
  iconoRequisito,
  iniciales,
  porcentajeCumplimiento,
  textoCumplimiento,
  textoUbicacion,
} from "../../utils/castingConstants.js";
import { esAceptadaConMiembroInactivo } from "../../utils/postulacionConstants.js";

const ORDEN_MEDIDAS = new Map(
  CODIGOS_MEDIDAS_CASTING.map((codigo, indice) => [codigo, indice])
);

export default {
  name: "CastingCandidatoCard",
  components: {
    EstadoPostulacionBadge,
    CastingPolaroids,
  },
  props: {
    candidato: {
      type: Object,
      required: true,
    },
    requerimiento: {
      type: Object,
      default: null,
    },
    accionEnCurso: {
      type: Boolean,
      default: false,
    },
    destacada: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["aceptar", "rechazar"],
  computed: {
    ubicacion() {
      return textoUbicacion(this.candidato);
    },
    resumenCumplimiento() {
      return textoCumplimiento(this.candidato.cumplimiento);
    },
    porcentaje() {
      return porcentajeCumplimiento(this.candidato.cumplimiento);
    },
    caracteristicas() {
      return [...(this.candidato.caracteristicas || [])].sort((a, b) => {
        const ordenA = ORDEN_MEDIDAS.has(normCodigo(a?.codigo))
          ? ORDEN_MEDIDAS.get(normCodigo(a?.codigo))
          : 999;
        const ordenB = ORDEN_MEDIDAS.has(normCodigo(b?.codigo))
          ? ORDEN_MEDIDAS.get(normCodigo(b?.codigo))
          : 999;
        if (ordenA !== ordenB) return ordenA - ordenB;
        return String(a?.codigo || "").localeCompare(String(b?.codigo || ""));
      });
    },
    requisitos() {
      const cumplimiento = this.candidato.cumplimiento || {};
      const requeridas = (cumplimiento.caracteristicas || []).map(
        (caracteristica, indice) => ({
          clave: `car-${caracteristica.idCaracteristica || indice}`,
          nombre:
            caracteristica.nombre ||
            etiquetaCaracteristica(caracteristica) ||
            "Característica",
          valorPedido: caracteristica.valorPedido || "",
          valorPerfil: this.conUnidad(
            caracteristica.valorPerfil,
            caracteristica.unidad
          ),
          cumple: caracteristica.cumple,
        })
      );

      const habilidades = (cumplimiento.habilidades || []).map(
        (habilidad, indice) => ({
          clave: `hab-${habilidad.idHabilidad || indice}`,
          nombre: habilidad.nombre || "Habilidad",
          valorPedido: "",
          valorPerfil: habilidad.cumple === true ? "Sí" : "No",
          cumple: habilidad.cumple,
        })
      );

      const agenda = cumplimiento.agenda;
      const agendaRequisito = agenda
        ? [
            {
              clave: "agenda",
              nombre: "Agenda",
              valorPedido: "Disponible",
              valorPerfil: agenda.evaluada
                ? etiquetaAgenda(agenda)
                : "Sin evaluar",
              cumple: agenda.cumple,
            },
          ]
        : [];

      return [...requeridas, ...habilidades, ...agendaRequisito];
    },
  },
  methods: {
    resolverFotoUrl,
    iniciales,
    esAceptadaConMiembroInactivo,
    etiquetaCaracteristica,
    formatearValorCaracteristica,
    iconoRequisito,
    claseRequisito,
    conUnidad(valor, unidad) {
      if (!valor || !String(valor).trim()) return "";
      const texto = String(valor).trim();
      const simbolo = String(unidad || "").trim();
      if (!simbolo || texto.toLowerCase().includes(simbolo.toLowerCase())) {
        return texto;
      }
      return `${texto} ${simbolo}`;
    },
  },
};
</script>

<style scoped>
.casting-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-surface);
  min-width: 0;
}

.casting-card--destacada {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-soft, rgb(124 92 255 / 0.18));
}

.casting-card__cabecera {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.casting-card__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 2.6rem;
  height: 2.6rem;
  overflow: hidden;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  font-size: 0.8rem;
  font-weight: 700;
}

.casting-card__avatar-imagen {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.casting-card__datos {
  flex: 1;
  min-width: 0;
}

.casting-card__nombre {
  margin: 0;
  overflow: hidden;
  color: var(--color-text);
  font-size: 0.98rem;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.casting-card__ubicacion {
  margin: 0.1rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.74rem;
}

.casting-card__cumplimiento {
  flex: 0 0 auto;
  padding: 0.22rem 0.55rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface-muted);
  color: var(--color-text);
  font-size: 0.72rem;
  font-weight: 700;
  white-space: nowrap;
}

.casting-card__estado {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.casting-card__aviso {
  padding: 0.2rem 0.45rem;
  border-radius: 6px;
  background: var(--color-warning-soft);
  color: var(--color-warning-text);
  font-size: 0.7rem;
}

.casting-card__barra {
  height: 0.28rem;
  overflow: hidden;
  border-radius: 999px;
  background: var(--color-surface-muted);
}

.casting-card__barra-relleno {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--color-primary);
}

.casting-card__seccion {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.casting-card__seccion-titulo {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.casting-card__medidas {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.3rem 0.7rem;
  margin: 0;
}

.casting-card__medida {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.4rem;
  min-width: 0;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid var(--color-border-soft);
}

.casting-card__medida dt {
  overflow: hidden;
  color: var(--color-text-muted);
  font-size: 0.72rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.casting-card__medida dd {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin: 0;
  color: var(--color-text);
  font-size: 0.76rem;
  font-weight: 600;
  white-space: nowrap;
}

.casting-card__color {
  width: 0.7rem;
  height: 0.7rem;
  border: 1px solid var(--color-border);
  border-radius: 50%;
}

.casting-card__requisitos {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.casting-card__requisito {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.3rem 0.45rem;
  border-radius: 8px;
  background: var(--color-surface-muted);
}

.casting-card__requisito-icono {
  font-size: 1rem;
}

.casting-card__requisito-texto {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.casting-card__requisito-nombre {
  color: var(--color-text);
  font-size: 0.76rem;
  font-weight: 600;
}

.casting-card__requisito-pedido {
  color: var(--color-text-muted);
  font-size: 0.68rem;
}

.casting-card__requisito-valor {
  color: var(--color-text);
  font-size: 0.75rem;
  font-weight: 700;
  text-align: right;
}

.casting-requisito--cumple .casting-card__requisito-icono {
  color: var(--color-success-text);
}

.casting-requisito--no-cumple .casting-card__requisito-icono {
  color: var(--color-danger-text);
}

.casting-requisito--sin-evaluar .casting-card__requisito-icono {
  color: var(--color-text-muted);
}

.casting-card__vacio {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.76rem;
}

.casting-card__acciones {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.45rem;
  flex-wrap: wrap;
  margin-top: auto;
  padding-top: 0.25rem;
}

.casting-card__sin-accion {
  color: var(--color-text-muted);
  font-size: 0.74rem;
}
</style>
