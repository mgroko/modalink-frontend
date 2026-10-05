<template>
  <div class="disponibilidad">
    <div v-if="cargando" class="disponibilidad__estado">
      <span class="material-symbols-outlined">hourglass_empty</span>
      Cargando disponibilidad...
    </div>

    <div v-else-if="error" class="disponibilidad__estado">
      <span class="material-symbols-outlined">event_busy</span>
      {{ error }}
    </div>

    <template v-else-if="calendario">
      <div class="disponibilidad__header">
        <div class="disponibilidad__nav">
          <button class="disponibilidad__nav-btn" @click="cambiarSemana(-1)" title="Semana anterior">
            <span class="material-symbols-outlined">chevron_left</span>
          </button>
          <h3 class="disponibilidad__periodo">{{ periodo }}</h3>
          <button class="disponibilidad__nav-btn" @click="cambiarSemana(1)" title="Semana siguiente">
            <span class="material-symbols-outlined">chevron_right</span>
          </button>
          <button class="disponibilidad__hoy" @click="irAHoy">Hoy</button>
        </div>
      </div>

      <div class="disponibilidad__semana">
        <div
          v-for="dia in diasSemana"
          :key="dia.fechaKey"
          class="disponibilidad__dia"
          :class="{
            'disponibilidad__dia--hoy': dia.esHoy,
            'disponibilidad__dia--descanso': dia.estado === 'descanso',
          }"
        >
          <span class="disponibilidad__dia-nombre">{{ dia.nombre }}</span>
          <span class="disponibilidad__dia-numero">{{ dia.numero }}</span>
          <span
            class="disponibilidad__dia-indicador"
            :class="`disponibilidad__dia-indicador--${dia.estado}`"
          ></span>
          <span class="disponibilidad__dia-label">{{ dia.estadoLabel }}</span>
        </div>
      </div>

      <div class="disponibilidad__leyenda">
        <div class="disponibilidad__leyenda-item">
          <span class="disponibilidad__leyenda-cuadro disponibilidad__leyenda-cuadro--disponible"></span>
          Disponible
        </div>
        <div class="disponibilidad__leyenda-item">
          <span class="disponibilidad__leyenda-cuadro disponibilidad__leyenda-cuadro--actividad"></span>
          Comprometido
        </div>
        <div class="disponibilidad__leyenda-item">
          <span class="disponibilidad__leyenda-cuadro disponibilidad__leyenda-cuadro--bloqueo"></span>
          No disponible
        </div>
        <div class="disponibilidad__leyenda-item">
          <span class="disponibilidad__leyenda-cuadro disponibilidad__leyenda-cuadro--descanso"></span>
          No laborable
        </div>
      </div>

      <div class="disponibilidad__resumen">
        <div class="disponibilidad__stat">
          <span class="disponibilidad__stat-icono disponibilidad__stat-icono--disponible">
            <span class="material-symbols-outlined">check_circle</span>
          </span>
          <div class="disponibilidad__stat-info">
            <span class="disponibilidad__stat-numero">{{ disponibles }}</span>
            <span class="disponibilidad__stat-label">Disponibles</span>
          </div>
        </div>
        <div class="disponibilidad__stat">
          <span class="disponibilidad__stat-icono disponibilidad__stat-icono--bloqueo">
            <span class="material-symbols-outlined">block</span>
          </span>
          <div class="disponibilidad__stat-info">
            <span class="disponibilidad__stat-numero">{{ bloqueos }}</span>
            <span class="disponibilidad__stat-label">Bloqueos</span>
          </div>
        </div>
        <div class="disponibilidad__stat">
          <span class="disponibilidad__stat-icono disponibilidad__stat-icono--actividad">
            <span class="material-symbols-outlined">event</span>
          </span>
          <div class="disponibilidad__stat-info">
            <span class="disponibilidad__stat-numero">{{ actividades }}</span>
            <span class="disponibilidad__stat-label">Actividades</span>
          </div>
        </div>
      </div>

      <div v-if="tieneJornada" class="disponibilidad__jornada">
        <h4 class="disponibilidad__jornada-titulo">
          <span class="material-symbols-outlined">schedule</span>
          Jornada habitual
        </h4>
        <div class="disponibilidad__jornada-dias">
          <div
            v-for="jornada in resumenJornada"
            :key="jornada.etiqueta"
            class="disponibilidad__jornada-item"
          >
            <span class="disponibilidad__jornada-dias-label">{{ jornada.etiqueta }}</span>
            <span class="disponibilidad__jornada-horario">{{ jornada.horario }}</span>
          </div>
        </div>
        <p v-if="calendario.jornada.margenActividadMinutos" class="disponibilidad__jornada-margen">
          Margen entre actividades: {{ calendario.jornada.margenActividadMinutos }} min
        </p>
      </div>

      <div v-if="proximosEventos.length" class="disponibilidad__eventos">
        <h4 class="disponibilidad__eventos-titulo">
          <span class="material-symbols-outlined">upcoming</span>
          Próximos compromisos
        </h4>
        <div
          v-for="evento in proximosEventos"
          :key="evento.id"
          class="disponibilidad__evento"
          :class="`disponibilidad__evento--${evento.tipo}`"
        >
          <div class="disponibilidad__evento-fecha">
            <span class="disponibilidad__evento-dia">{{ evento.dia }}</span>
            <span class="disponibilidad__evento-mes">{{ evento.mes }}</span>
          </div>
          <div class="disponibilidad__evento-info">
            <span class="disponibilidad__evento-rango">{{ evento.rango }}</span>
            <span class="disponibilidad__evento-nombre">{{ evento.nombre }}</span>
          </div>
          <span
            class="disponibilidad__evento-badge"
            :class="`disponibilidad__evento-badge--${evento.tipo}`"
          >
            {{ evento.tipo === 'actividad' ? 'Actividad' : 'No disponible' }}
          </span>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import calendarioService from "../../services/calendarioService";
import { formatearRangoEvento, rangoSemana } from "../../utils/fechas.js";

const NOMBRES_DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function pad(n) {
  return String(n).padStart(2, "0");
}

function toFechaKey(fecha) {
  return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}`;
}

function aDate(localDateTime) {
  return new Date(localDateTime);
}

export default {
  name: "DisponibilidadAjena",
  props: {
    idUsuario: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {
      cargando: true,
      error: "",
      calendario: null,
      semanaInicio: null,
    };
  },
  computed: {
    tieneJornada() {
      return this.calendario?.jornada?.dias?.length > 0;
    },
    diasSemana() {
      const lista = [];
      const inicio = new Date(this.semanaInicio);
      for (let i = 0; i < 7; i++) {
        const dia = new Date(inicio);
        dia.setDate(inicio.getDate() + i);
        const diaSemana = dia.getDay() === 0 ? 7 : dia.getDay();
        const tieneActividad = this.tieneActividad(dia);
        const tieneBloqueo = this.tieneBloqueo(dia);
        const laborable = this.jornadaPorDia(diaSemana) != null;

        let estado = "descanso";
        let estadoLabel = "No laborable";
        if (laborable) {
          if (tieneActividad) {
            estado = "actividad";
            estadoLabel = "Comprometido";
          } else if (tieneBloqueo) {
            estado = "bloqueo";
            estadoLabel = "No disponible";
          } else {
            estado = "disponible";
            estadoLabel = "Disponible";
          }
        }

        lista.push({
          fecha: dia,
          fechaKey: toFechaKey(dia),
          nombre: NOMBRES_DIAS[i],
          numero: dia.getDate(),
          esHoy: toFechaKey(dia) === toFechaKey(new Date()),
          estado,
          estadoLabel,
        });
      }
      return lista;
    },
    periodo() {
      if (!this.semanaInicio) return "";
      const fin = new Date(this.semanaInicio);
      fin.setDate(this.semanaInicio.getDate() + 6);
      return rangoSemana(this.semanaInicio, fin);
    },
    disponibles() {
      return this.diasSemana.filter((d) => d.estado === "disponible").length;
    },
    bloqueos() {
      return this.diasSemana.filter((d) => d.estado === "bloqueo").length;
    },
    actividades() {
      return this.diasSemana.filter((d) => d.estado === "actividad").length;
    },
    resumenJornada() {
      if (!this.tieneJornada) return [];
      const jornadas = [];
      const diasConfig = this.calendario.jornada.dias;

      const agrupados = {};
      diasConfig.forEach((j) => {
        const horario = this.formatearHorario(j);
        const key = horario;
        if (!agrupados[key]) {
          agrupados[key] = { horario, dias: [] };
        }
        agrupados[key].dias.push(j.diaSemana);
      });

      Object.values(agrupados).forEach((grupo) => {
        const diasOrdenados = grupo.dias.sort((a, b) => a - b);
        const etiquetas = this.agruparDiasConsecutivos(diasOrdenados);
        jornadas.push({
          etiqueta: etiquetas.join(", "),
          horario: grupo.horario,
        });
      });

      return jornadas;
    },
    proximosEventos() {
      const eventos = [];
      const ahora = new Date();

      (this.calendario?.actividades || []).forEach((a) => {
        const fin = aDate(a.fechaHoraFin);
        if (fin >= ahora) {
          const inicio = aDate(a.fechaHoraInicio);
          eventos.push({
            id: `act-${a.idActividad}`,
            tipo: "actividad",
            fecha: inicio,
            dia: pad(inicio.getDate()),
            mes: MESES_CORTOS[inicio.getMonth()],
            rango: formatearRangoEvento(inicio, fin),
            nombre: a.nombre || "Actividad",
          });
        }
      });

      (this.calendario?.bloqueosManuales || []).forEach((b) => {
        const fin = aDate(b.fechaHoraFin);
        if (fin >= ahora) {
          const inicio = aDate(b.fechaHoraInicio);
          eventos.push({
            id: `bloq-${b.idBloqueo}`,
            tipo: "bloqueo",
            fecha: inicio,
            dia: pad(inicio.getDate()),
            mes: MESES_CORTOS[inicio.getMonth()],
            rango: formatearRangoEvento(inicio, fin),
            nombre: "No disponible",
          });
        }
      });

      return eventos
        .sort((a, b) => a.fecha - b.fecha)
        .slice(0, 5);
    },
  },
  mounted() {
    this.semanaInicio = this.inicioDeSemana(new Date());
    this.cargarCalendario();
  },
  methods: {
    async cargarCalendario() {
      this.cargando = true;
      this.error = "";
      try {
        const response = await calendarioService.obtenerCalendarioPerfil(this.idUsuario);
        this.calendario = response.data;
      } catch (err) {
        const status = err?.response?.status;
        if (status === 404) {
          this.error = "Este perfil no tiene una agenda configurada.";
        } else if (status === 401) {
          this.error = "Debes iniciar sesión para ver la disponibilidad.";
        } else {
          this.error = "No se pudo cargar la disponibilidad. Intentá nuevamente.";
        }
      } finally {
        this.cargando = false;
      }
    },
    inicioDeSemana(fecha) {
      const d = new Date(fecha);
      d.setHours(0, 0, 0, 0);
      let dia = d.getDay();
      if (dia === 0) dia = 7;
      d.setDate(d.getDate() - (dia - 1));
      return d;
    },
    cambiarSemana(dir) {
      const nueva = new Date(this.semanaInicio);
      nueva.setDate(nueva.getDate() + dir * 7);
      this.semanaInicio = nueva;
    },
    irAHoy() {
      this.semanaInicio = this.inicioDeSemana(new Date());
    },
    jornadaPorDia(diaSemana) {
      return (this.calendario?.jornada?.dias || []).find((d) => d.diaSemana === diaSemana) || null;
    },
    tieneActividad(fecha) {
      const key = toFechaKey(fecha);
      return (this.calendario?.actividades || []).some((a) => {
        const ini = aDate(a.fechaHoraInicio);
        const fin = aDate(a.fechaHoraFin);
        const iniDia = new Date(`${key}T00:00:00`);
        const finDia = new Date(`${key}T23:59:59`);
        return ini < finDia && fin > iniDia;
      });
    },
    tieneBloqueo(fecha) {
      const key = toFechaKey(fecha);
      return (this.calendario?.bloqueosManuales || []).some((b) => {
        const ini = aDate(b.fechaHoraInicio);
        const fin = aDate(b.fechaHoraFin);
        const iniDia = new Date(`${key}T00:00:00`);
        const finDia = new Date(`${key}T23:59:59`);
        return ini < finDia && fin > iniDia;
      });
    },
    formatearHorario(jornada) {
      const ini = (jornada.horarioInicioManiana || "").slice(0, 5);
      const finM = (jornada.horarioFinManiana || "").slice(0, 5);
      const iniT = (jornada.horarioInicioTarde || "").slice(0, 5);
      const fin = (jornada.horarioFinTarde || "").slice(0, 5);

      if (!finM && !iniT) {
        return `${ini} – ${fin}`;
      }
      return `${ini} – ${finM} / ${iniT} – ${fin}`;
    },
    agruparDiasConsecutivos(dias) {
      if (dias.length === 0) return [];
      const nombres = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
      const grupos = [];
      let inicio = dias[0];
      let fin = dias[0];

      for (let i = 1; i < dias.length; i++) {
        if (dias[i] === fin + 1) {
          fin = dias[i];
        } else {
          grupos.push(this.formatearRango(inicio, fin, nombres));
          inicio = dias[i];
          fin = dias[i];
        }
      }
      grupos.push(this.formatearRango(inicio, fin, nombres));
      return grupos;
    },
    formatearRango(inicio, fin, nombres) {
      if (inicio === fin) return nombres[inicio - 1];
      if (fin - inicio === 1) return `${nombres[inicio - 1]}, ${nombres[fin - 1]}`;
      return `${nombres[inicio - 1]} – ${nombres[fin - 1]}`;
    },
  },
};
</script>

<style scoped>
.disponibilidad {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.disponibilidad__estado {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem 1rem;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  background: var(--color-surface);
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

.disponibilidad__estado .material-symbols-outlined {
  font-size: 1.5rem;
}

/* Header & Navegación */
.disponibilidad__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.disponibilidad__nav {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.disponibilidad__nav-btn {
  background: none;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--color-text-muted);
  background: var(--color-surface);
  transition: background 0.15s, color 0.15s;
}

.disponibilidad__nav-btn:hover {
  background: #f3f4f6;
  color: var(--color-text);
}

.disponibilidad__nav-btn .material-symbols-outlined {
  font-size: 1.15rem;
}

.disponibilidad__periodo {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
  min-width: 180px;
  text-align: center;
}

.disponibilidad__hoy {
  margin-left: 0.5rem;
  background: none;
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
  border-radius: 6px;
  padding: 0.3rem 0.75rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.disponibilidad__hoy:hover {
  background: var(--color-primary);
  color: #fff;
}

/* Semana */
.disponibilidad__semana {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.5rem;
}

.disponibilidad__dia {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding: 0.75rem 0.5rem;
  border-radius: 10px;
  background: var(--color-surface);
  border: 1px solid #e5e7eb;
  transition: transform 0.15s, box-shadow 0.15s;
}

.disponibilidad__dia:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.disponibilidad__dia--hoy {
  border-color: var(--color-primary-light);
  background: #f0f0f6;
  box-shadow: 0 0 0 2px rgba(73, 71, 118, 0.15);
}

.disponibilidad__dia--descanso {
  opacity: 0.55;
}

.disponibilidad__dia-nombre {
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.disponibilidad__dia-numero {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--color-text);
}

.disponibilidad__dia-indicador {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.disponibilidad__dia-indicador--disponible {
  background: var(--color-support);
  border: 1.5px solid #4a9ea3;
}

.disponibilidad__dia-indicador--actividad {
  background: var(--color-secondary);
  border: 1.5px solid var(--color-secondary-dark);
}

.disponibilidad__dia-indicador--bloqueo {
  background: #fca5a5;
  border: 1.5px solid #ef4444;
}

.disponibilidad__dia-indicador--descanso {
  background: #d1d5db;
  border: 1.5px solid #9ca3af;
}

.disponibilidad__dia-label {
  font-size: 0.62rem;
  color: var(--color-text-muted);
  text-align: center;
  line-height: 1.2;
}

/* Leyenda */
.disponibilidad__leyenda {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 1.25rem;
  font-size: 0.78rem;
  color: var(--color-text-muted);
}

.disponibilidad__leyenda-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.disponibilidad__leyenda-cuadro {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.disponibilidad__leyenda-cuadro--disponible {
  background: var(--color-support);
}

.disponibilidad__leyenda-cuadro--actividad {
  background: var(--color-secondary);
}

.disponibilidad__leyenda-cuadro--bloqueo {
  background: #fca5a5;
}

.disponibilidad__leyenda-cuadro--descanso {
  background: #d1d5db;
}

/* Resumen */
.disponibilidad__resumen {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.disponibilidad__stat {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  background: var(--color-surface);
  border: 1px solid #e5e7eb;
  border-radius: 10px;
}

.disponibilidad__stat-icono {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.disponibilidad__stat-icono .material-symbols-outlined {
  font-size: 1.2rem;
}

.disponibilidad__stat-icono--disponible {
  background: #e0f5f5;
  color: var(--color-support);
}

.disponibilidad__stat-icono--bloqueo {
  background: #fee2e2;
  color: #ef4444;
}

.disponibilidad__stat-icono--actividad {
  background: #f0eefa;
  color: var(--color-secondary);
}

.disponibilidad__stat-info {
  display: flex;
  flex-direction: column;
}

.disponibilidad__stat-numero {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1;
}

.disponibilidad__stat-label {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

/* Jornada */
.disponibilidad__jornada {
  padding: 1rem 1.25rem;
  background: var(--color-surface);
  border: 1px solid #e5e7eb;
  border-radius: 10px;
}

.disponibilidad__jornada-titulo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.75rem;
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--color-text);
}

.disponibilidad__jornada-titulo .material-symbols-outlined {
  font-size: 1.1rem;
  color: var(--color-primary);
}

.disponibilidad__jornada-dias {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.disponibilidad__jornada-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background: #f9fafb;
  border-radius: 6px;
}

.disponibilidad__jornada-dias-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--color-text);
}

.disponibilidad__jornada-horario {
  font-size: 0.82rem;
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}

.disponibilidad__jornada-margen {
  margin: 0.6rem 0 0;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  font-style: italic;
}

/* Eventos */
.disponibilidad__eventos {
  padding: 1rem 1.25rem;
  background: var(--color-surface);
  border: 1px solid #e5e7eb;
  border-radius: 10px;
}

.disponibilidad__eventos-titulo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.75rem;
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--color-text);
}

.disponibilidad__eventos-titulo .material-symbols-outlined {
  font-size: 1.1rem;
  color: var(--color-primary);
}

.disponibilidad__evento {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.65rem 0.75rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  margin-bottom: 0.4rem;
  transition: background 0.12s;
}

.disponibilidad__evento:last-child {
  margin-bottom: 0;
}

.disponibilidad__evento--actividad {
  background: #f8f7fd;
  border-color: #e0ddf5;
}

.disponibilidad__evento--bloqueo {
  background: #fef7f7;
  border-color: #fde2e2;
}

.disponibilidad__evento-fecha {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 38px;
  padding: 0.3rem 0.5rem;
  background: var(--color-surface);
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.disponibilidad__evento-dia {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1;
}

.disponibilidad__evento-mes {
  font-size: 0.6rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
}

.disponibilidad__evento-info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  flex: 1;
  min-width: 0;
}

.disponibilidad__evento-rango {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-text);
}

.disponibilidad__evento-nombre {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.disponibilidad__evento-badge {
  font-size: 0.68rem;
  font-weight: 600;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  white-space: nowrap;
}

.disponibilidad__evento-badge--actividad {
  background: #f0eefa;
  color: var(--color-secondary);
}

.disponibilidad__evento-badge--bloqueo {
  background: #fee2e2;
  color: #dc2626;
}

/* Responsive */
@media (max-width: 640px) {
  .disponibilidad__semana {
    grid-template-columns: repeat(7, 1fr);
    gap: 0.3rem;
  }

  .disponibilidad__dia {
    padding: 0.5rem 0.25rem;
  }

  .disponibilidad__dia-numero {
    font-size: 1rem;
  }

  .disponibilidad__dia-label {
    display: none;
  }

  .disponibilidad__resumen {
    grid-template-columns: 1fr;
  }

  .disponibilidad__evento-badge {
    display: none;
  }
}
</style>
