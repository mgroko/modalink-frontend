<template>
  <section class="proximos-eventos">
    <h3 class="proximos-eventos__titulo">Próximos eventos</h3>

    <div v-if="cargando" class="proximos-eventos__estado">
      <span class="material-symbols-outlined">hourglass_empty</span>
      Cargando...
    </div>

    <div v-else-if="eventos.length === 0" class="proximos-eventos__vacio">
      No hay eventos próximos.
    </div>

    <div v-else class="proximos-eventos__lista">
      <article
        v-for="evento in eventos"
        :key="evento.clave"
        class="proximos-eventos__item"
        :class="{ 'proximos-eventos__item--bloqueo': evento.tipo === 'bloqueo' }"
      >
        <div class="proximos-eventos__fecha">
          <span class="proximos-eventos__dia">{{ diaDel(evento.fecha) }}</span>
          <span class="proximos-eventos__mes">{{ mesDel(evento.fecha) }}</span>
        </div>
        <div class="proximos-eventos__info">
          <span class="proximos-eventos__hora">{{ rangoHorario(evento) }}</span>
          <span class="proximos-eventos__nombre">{{ evento.nombre }}</span>
        </div>
      </article>
    </div>
  </section>
</template>

<script>
import calendarioService from "../../services/calendarioService";
import { formatearRangoEvento } from "../../utils/fechas.js";

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function pad(n) {
  return String(n).padStart(2, "0");
}

export default {
  name: "ProximosEventos",
  data() {
    return {
      cargando: true,
      eventos: [],
    };
  },
  async mounted() {
    await this.cargar();
  },
  methods: {
    async cargar() {
      this.cargando = true;
      try {
        const response = await calendarioService.obtenerCalendario();
        const data = response?.data || {};

        const ahora = new Date();
        const eventos = [];

        (data.actividades || []).forEach((a) => {
          eventos.push({
            clave: `actividad-${a.idActividad}`,
            tipo: "actividad",
            fecha: new Date(a.fechaHoraInicio),
            fechaFin: new Date(a.fechaHoraFin),
            nombre: a.nombre || "Actividad",
          });
        });

        (data.bloqueosManuales || []).forEach((b) => {
          eventos.push({
            clave: `bloqueo-${b.idBloqueo}`,
            tipo: "bloqueo",
            fecha: new Date(b.fechaHoraInicio),
            fechaFin: new Date(b.fechaHoraFin),
            nombre: b.motivo || "Bloqueo manual",
          });
        });

        this.eventos = eventos
          .filter((e) => e.fecha >= ahora)
          .sort((a, b) => a.fecha - b.fecha)
          .slice(0, 5);
      } catch {
        this.eventos = [];
      } finally {
        this.cargando = false;
      }
    },
    diaDel(fecha) {
      return pad(fecha.getDate());
    },
    mesDel(fecha) {
      return MESES[fecha.getMonth()];
    },
    rangoHorario(evento) {
      return formatearRangoEvento(evento.fecha, evento.fechaFin);
    },
  },
};
</script>

<style scoped>
.proximos-eventos {
  padding: 1.25rem;
  background: var(--color-surface);
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

.proximos-eventos__titulo {
  margin: 0 0 1rem;
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--color-text);
}

.proximos-eventos__estado,
.proximos-eventos__vacio {
  font-size: 0.82rem;
  color: var(--color-text-muted);
  padding: 0.5rem 0;
}

.proximos-eventos__estado .material-symbols-outlined {
  font-size: 1rem;
  vertical-align: middle;
  margin-right: 0.25rem;
}

.proximos-eventos__lista {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.proximos-eventos__item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.75rem;
  border: 1px solid #d9e4ea;
  border-radius: 8px;
  background: #eef7f7;
}

.proximos-eventos__item--bloqueo {
  background: #fdf1f2;
  border-color: #f3c8cd;
}

.proximos-eventos__fecha {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 38px;
}

.proximos-eventos__dia {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--color-text);
  line-height: 1;
}

.proximos-eventos__mes {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
}

.proximos-eventos__info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.proximos-eventos__hora {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

.proximos-eventos__nombre {
  font-size: 0.82rem;
  color: var(--color-text);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
