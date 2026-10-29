<template>
  <div class="cronograma-actividades">
    <div class="cronograma-actividades__cabecera">
      <div class="cronograma-actividades__leyenda">
        <span class="cronograma-actividades__leyenda-item">
          <span class="cronograma-actividades__leyenda-cuadro"></span>
          Ejecución
        </span>
        <span class="cronograma-actividades__leyenda-item">
          <span
            class="cronograma-actividades__leyenda-cuadro cronograma-actividades__leyenda-cuadro--holgura"
          ></span>
          Holgura
        </span>
        <span class="cronograma-actividades__leyenda-item">
          <span
            class="cronograma-actividades__leyenda-cuadro cronograma-actividades__leyenda-cuadro--critica"
          ></span>
          Ruta crítica
        </span>
      </div>
      <p class="cronograma-actividades__nota">
        Las fechas proyectadas son orientativas hasta confirmar el proyecto.
      </p>
    </div>

    <p v-if="!items.length" class="cronograma-actividades__vacio">
      No hay actividades programables con fechas para graficar.
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
            'cronograma-actividades__pista--seleccionada': item.seleccionada,
          }"
          role="button"
          tabindex="0"
          :aria-label="`${item.nombre}. ${item.titulo}`"
          :title="item.titulo"
          @click="$emit('seleccionar', item.idActividad)"
          @keydown.enter.prevent="$emit('seleccionar', item.idActividad)"
          @keydown.space.prevent="$emit('seleccionar', item.idActividad)"
        >
          <div
            v-if="item.holguraAncho > 0"
            class="cronograma-actividades__holgura"
            :style="estiloHolgura(item)"
          ></div>
          <div
            class="cronograma-actividades__barra"
            :class="{
              'cronograma-actividades__barra--proyectada': item.proyectada,
              'cronograma-actividades__barra--critica': item.critica,
              'cronograma-actividades__barra--tentativa': item.tentativa,
              'cronograma-actividades__barra--fija': item.fijo,
              'cronograma-actividades__barra--seleccionada': item.seleccionada,
            }"
            :style="estiloBarra(item)"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { parseFechaLocal } from "../../utils/actividadConstants.js";
import {
  formatearHolgura,
  formatearRangoCpm,
  textoProyeccion,
} from "../../utils/cpmConstants.js";

const FORMATO_TICK = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "short",
});

export default {
  name: "CronogramaActividades",
  props: {
    /** Actividades de `GET /cronograma` con fechas absolutas. */
    actividades: {
      type: Array,
      default: () => [],
    },
    seleccionada: {
      type: [Number, String],
      default: null,
    },
  },
  emits: ["seleccionar"],
  computed: {
    items() {
      return (this.actividades || [])
        .map((actividad) => {
          const inicio = parseFechaLocal(actividad?.inicioProyectado);
          const fin = parseFechaLocal(actividad?.finProyectado);
          if (!inicio || !fin) return null;

          const inicioMs = inicio.getTime();
          const finMs = Math.max(fin.getTime(), inicioMs + 60000);
          const holguraFecha = parseFechaLocal(actividad?.finConHolgura);
          const holguraMs =
            holguraFecha && holguraFecha.getTime() > finMs
              ? holguraFecha.getTime()
              : finMs;

          const tieneHolgura = holguraMs > finMs;
          const proyectada =
            !actividad?.fechaHoraInicio && !!actividad?.inicioProyectado;
          const tentativa =
            actividad?.tentativo === true || actividad?.tentative === "true";

          return {
            idActividad: actividad.idActividad,
            nombre: actividad.nombre,
            indice: 0,
            inicioMs,
            finMs,
            holguraMs,
            holguraAncho: holguraMs - finMs,
            tieneHolgura,
            proyectada,
            tentativa,
            critica: actividad?.enRutaCritica === true,
            conflicto: actividad?.conflicto === true,
            fijo: actividad?.fijo === true,
            motivoConflicto: actividad?.motivoConflicto || "",
            holguraMakespan: actividad?.holguraMakespan,
            holguraEntrega: actividad?.holguraEntrega,
            rangoInicio: actividad?.rangoInicio,
            rangoEjecucion: actividad?.rangoEjecucion,
            seleccionada:
              this.seleccionada != null &&
              String(actividad.idActividad) === String(this.seleccionada),
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.inicioMs - b.inicioMs || a.idActividad - b.idActividad)
        .map((item, indice) => ({
          ...item,
          indice: indice + 1,
          titulo: this.tituloItem(item),
        }));
    },
    rango() {
      if (!this.items.length) return null;
      const inicioMs = Math.min(...this.items.map((item) => item.inicioMs));
      const finMs = Math.max(...this.items.map((item) => item.holguraMs));
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
    porcentaje(ms) {
      return ((ms - this.rango.inicioMs) / this.rango.totalMs) * 100;
    },
    estiloBarra(item) {
      return {
        left: `${this.porcentaje(item.inicioMs)}%`,
        width: `${Math.max(
          this.porcentaje(item.finMs) - this.porcentaje(item.inicioMs),
          0.4
        )}%`,
      };
    },
    estiloHolgura(item) {
      return {
        left: `${this.porcentaje(item.finMs)}%`,
        width: `${Math.max(
          this.porcentaje(item.holguraMs) - this.porcentaje(item.finMs),
          0.4
        )}%`,
      };
    },
    tituloItem(item) {
      const partes = [
        formatearRangoCpm(new Date(item.inicioMs), new Date(item.finMs)),
      ];

      if (item.proyectada) partes.push(textoProyeccion(item));
      if (item.tentativa && !item.proyectada) {
        partes.push("Proyección provisional hasta confirmar el proyecto.");
      }
      if (item.critica) partes.push("Ruta crítica.");
      if (item.fijo) partes.push("Actividad fija.");
      if (item.conflicto) {
        partes.push(
          item.motivoConflicto
            ? `Conflicto: ${item.motivoConflicto}`
            : "Conflicto CPM."
        );
      }

      const holgura = formatearHolgura(item.holguraMakespan);
      if (holgura) partes.push(`Holgura makespan: ${holgura}.`);

      const holguraEntrega = formatearHolgura(item.holguraEntrega);
      if (holguraEntrega) {
        partes.push(`Holgura entrega: ${holguraEntrega}.`);
      }

      if (item.rangoInicio) {
        partes.push(
          `Ventana de inicio: +${Math.round(item.rangoInicio.inicioMinutos)} a +${Math.round(item.rangoInicio.finMinutos)} min desde t0.`
        );
      }
      if (item.rangoEjecucion) {
        partes.push(
          `Ventana de ejecución: +${Math.round(item.rangoEjecucion.inicioMinutos)} a +${Math.round(item.rangoEjecucion.finMinutos)} min desde t0.`
        );
      }

      return partes.join(" ");
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

.cronograma-actividades__barra--tentativa {
  border: 1px dashed var(--color-warning-text);
}

.cronograma-actividades__barra--critica {
  box-shadow: inset 0 -3px 0 var(--color-danger-text);
}

.cronograma-actividades__barra--fija {
  border-right: 3px solid var(--color-text-muted);
}

.cronograma-actividades__barra--seleccionada,
.cronograma-actividades__pista--seleccionada {
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
}

.cronograma-actividades__pista--conflicto {
  background: var(--color-danger-soft);
}

.cronograma-actividades__holgura {
  position: absolute;
  top: 6px;
  bottom: 6px;
  border-radius: 3px;
  background: color-mix(in srgb, var(--color-primary) 22%, transparent);
  pointer-events: none;
}

.cronograma-actividades__leyenda {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
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

.cronograma-actividades__leyenda-cuadro--holgura {
  background: color-mix(in srgb, var(--color-primary) 22%, transparent);
  border: 1px solid var(--color-primary);
}

.cronograma-actividades__leyenda-cuadro--critica {
  background: var(--color-primary);
  box-shadow: inset 0 -3px 0 var(--color-danger-text);
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
  cursor: pointer;
}

.cronograma-actividades__pista:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.cronograma-actividades__barra {
  position: absolute;
  top: 0;
  bottom: 0;
  min-width: 3px;
  border-radius: 4px;
  background: var(--color-primary);
  pointer-events: none;
}

.cronograma-actividades__vacio {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  font-style: italic;
}
</style>
