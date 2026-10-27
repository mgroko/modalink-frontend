<template>
  <div class="cronograma-actividades">
    <div class="cronograma-actividades__cabecera">
      <div class="cronograma-actividades__leyenda">
        <span class="cronograma-actividades__leyenda-item">
          <span class="cronograma-actividades__leyenda-cuadro"></span>
          Actividad
        </span>
      </div>
      <p class="cronograma-actividades__nota">
        Las fechas proyectadas son orientativas hasta confirmar el proyecto.
      </p>
    </div>

    <p v-if="!items.length" class="cronograma-actividades__vacio">
      No hay actividades con fechas para graficar.
    </p>

    <div v-else class="cronograma-actividades__scroll">
      <div class="cronograma-actividades__eje">
        <span class="cronograma-actividades__eje-label"></span>
        <div class="cronograma-actividades__eje-marcas">
          <span
            v-for="tick in ticks"
            :key="tick.posicion"
            class="cronograma-actividades__eje-marca"
            :style="{ left: `${tick.posicion * 100}%` }"
          >
            {{ tick.etiqueta }}
          </span>
        </div>
      </div>

      <div
        v-for="item in items"
        :key="item.idActividad"
        class="cronograma-actividades__fila"
      >
        <span class="cronograma-actividades__nombre" :title="item.nombre">
          {{ item.indice }} · {{ item.nombre }}
        </span>
        <div
          class="cronograma-actividades__pista"
          :class="{
            'cronograma-actividades__pista--conflicto': item.conflicto,
          }"
        >
          <div
            class="cronograma-actividades__barra"
            :class="{
              'cronograma-actividades__barra--proyectada': item.proyectada,
              'cronograma-actividades__barra--critica': item.critica,
            }"
            :style="estiloBarra(item)"
            :title="tituloBarra(item)"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { parseFechaLocal } from "../../utils/actividadConstants.js";
import { formatearFecha } from "../../utils/fechas.js";

const FORMATO_TICK = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "short",
});

export default {
  name: "CronogramaActividades",
  props: {
    actividades: {
      type: Array,
      default: () => [],
    },
  },
  computed: {
    items() {
      return (this.actividades || [])
        .map((actividad, indice) => {
          const inicio = parseFechaLocal(
            actividad?.fechaHoraInicio || actividad?.inicioProyectado
          );
          const fin = parseFechaLocal(
            actividad?.fechaHoraFin || actividad?.finProyectado
          );
          if (!inicio || !fin) return null;

          const inicioMs = inicio.getTime();
          const finMs = Math.max(fin.getTime(), inicioMs + 60000);

          return {
            idActividad: actividad.idActividad,
            nombre: actividad.nombre,
            indice: indice + 1,
            inicio,
            fin,
            inicioMs,
            finMs,
            proyectada: !actividad?.fechaHoraInicio && !!actividad?.inicioProyectado,
            critica: actividad?.critica === true,
            conflicto: actividad?.conflicto === true,
          };
        })
        .filter(Boolean);
    },
    rango() {
      if (!this.items.length) return null;
      const inicioMs = Math.min(...this.items.map((item) => item.inicioMs));
      const finMs = Math.max(...this.items.map((item) => item.finMs));
      const totalMs = Math.max(finMs - inicioMs, 60000);
      return { inicioMs, finMs, totalMs };
    },
    ticks() {
      if (!this.rango) return [];
      return [0, 0.25, 0.5, 0.75, 1].map((posicion) => {
        const fecha = new Date(
          this.rango.inicioMs + this.rango.totalMs * posicion
        );
        return {
          posicion,
          etiqueta: FORMATO_TICK.format(fecha),
        };
      });
    },
  },
  methods: {
    estiloBarra(item) {
      const left = ((item.inicioMs - this.rango.inicioMs) / this.rango.totalMs) * 100;
      const width = ((item.finMs - item.inicioMs) / this.rango.totalMs) * 100;
      return {
        left: `${left}%`,
        width: `${Math.max(width, 0.4)}%`,
      };
    },
    tituloBarra(item) {
      const estado = item.conflicto
        ? "conflicto"
        : item.proyectada
          ? "proyectada"
          : "confirmada";
      return `${item.nombre} (${estado}): ${formatearFecha(item.inicio)} – ${formatearFecha(item.fin)}`;
    },
  },
};
</script>

<style scoped>
.cronograma-actividades__cabecera {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.cronograma-actividades__barra--proyectada {
  opacity: 0.55;
  background: var(--color-primary-light, var(--color-primary));
}

.cronograma-actividades__barra--critica {
  box-shadow: inset 0 -3px 0 var(--color-danger-text);
}

.cronograma-actividades__pista--conflicto {
  background: var(--color-danger-soft);
}

.cronograma-actividades__leyenda {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.cronograma-actividades__leyenda-item {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--color-text-muted);
  font-size: 0.76rem;
}

.cronograma-actividades__leyenda-cuadro {
  width: 14px;
  height: 10px;
  border-radius: 2px;
  background: var(--color-primary);
}

.cronograma-actividades__nota {
  margin: 0 0 0 auto;
  color: var(--color-text-muted);
  font-size: 0.76rem;
}

.cronograma-actividades__scroll {
  min-width: 620px;
  overflow-x: auto;
}

.cronograma-actividades__eje,
.cronograma-actividades__fila {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.cronograma-actividades__eje {
  height: 20px;
  margin-bottom: 0.35rem;
}

.cronograma-actividades__eje-label,
.cronograma-actividades__nombre {
  flex: 0 0 190px;
  width: 190px;
  overflow: hidden;
  font-size: 0.76rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cronograma-actividades__eje-marcas {
  position: relative;
  flex: 1;
  height: 100%;
}

.cronograma-actividades__eje-marca {
  position: absolute;
  top: 0;
  color: var(--color-text-muted);
  font-size: 0.7rem;
  transform: translateX(-50%);
}

.cronograma-actividades__eje-marca:first-child {
  transform: none;
}

.cronograma-actividades__eje-marca:last-child {
  transform: translateX(-100%);
}

.cronograma-actividades__fila {
  margin: 0.35rem 0;
}

.cronograma-actividades__nombre {
  color: var(--color-text);
}

.cronograma-actividades__pista {
  position: relative;
  flex: 1;
  height: 22px;
  border-radius: 4px;
  background: var(--color-surface-muted);
}

.cronograma-actividades__barra {
  position: absolute;
  top: 0;
  bottom: 0;
  min-width: 3px;
  border-radius: 4px;
  background: var(--color-primary);
}

.cronograma-actividades__vacio {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  font-style: italic;
}
</style>
