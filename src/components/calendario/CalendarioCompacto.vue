<template>
  <div class="cal-semana">
    <div v-if="cargando" class="cal-semana__estado">
      <span class="material-symbols-outlined">hourglass_empty</span>
      Cargando calendario...
    </div>

    <div v-else-if="mensajeError" class="cal-semana__estado">
      <span class="material-symbols-outlined">error</span>
      {{ mensajeError }}
    </div>

    <template v-else-if="calendario">
      <!-- Navegación de semana -->
      <div class="cal-semana__nav">
        <button class="cal-semana__nav-btn" @click="cambiarSemana(-1)" title="Semana anterior">
          <span class="material-symbols-outlined">chevron_left</span>
        </button>
        <span class="cal-semana__periodo">{{ periodo }}</span>
        <button class="cal-semana__nav-btn" @click="cambiarSemana(1)" title="Semana siguiente">
          <span class="material-symbols-outlined">chevron_right</span>
        </button>
        <button class="cal-semana__hoy" @click="irAHoy">Hoy</button>
      </div>

      <!-- Tira semanal -->
      <div class="cal-semana__tira">
        <button
          v-for="dia in diasSemana"
          :key="dia.fechaKey"
          class="cal-semana__dia"
          :class="{
            'cal-semana__dia--hoy': dia.esHoy,
            'cal-semana__dia--seleccionado': dia.fechaKey === diaSeleccionadoKey,
            'cal-semana__dia--descanso': !dia.laborable,
          }"
          @click="seleccionarDia(dia)"
        >
          <span class="cal-semana__dia-nombre">{{ dia.nombre }}</span>
          <span class="cal-semana__dia-numero">{{ dia.numero }}</span>
          <div class="cal-semana__barra" :aria-label="dia.resumenBarra">
            <span
              v-for="(seg, i) in dia.segmentos"
              :key="i"
              class="cal-semana__barra-seg"
              :class="`cal-semana__barra-seg--${seg.tipo}`"
              :style="{ width: seg.ancho + '%' }"
              :title="seg.titulo"
            ></span>
          </div>
        </button>
      </div>

      <!-- Leyenda -->
      <div class="cal-semana__leyenda">
        <div class="cal-semana__leyenda-item">
          <span class="cal-semana__leyenda-color cal-semana__leyenda-color--actividad"></span>
          Actividad de proyecto
        </div>
        <div class="cal-semana__leyenda-item">
          <span class="cal-semana__leyenda-color cal-semana__leyenda-color--bloqueo"></span>
          Bloqueo manual
        </div>
        <div class="cal-semana__leyenda-item">
          <span class="cal-semana__leyenda-color cal-semana__leyenda-color--disponible"></span>
          Disponible
        </div>
        <div class="cal-semana__leyenda-item">
          <span class="cal-semana__leyenda-color cal-semana__leyenda-color--nolaborable"></span>
          No laborable
        </div>
      </div>

      <!-- Detalle del día -->
      <div class="cal-semana__detalle">
        <h3 class="cal-semana__detalle-titulo">
          Detalle del día — {{ diaSeleccionadoNombre }}
        </h3>

        <div v-if="jornadaDelDia" class="cal-semana__jornada">
          <span class="material-symbols-outlined">schedule</span>
          Jornada laboral: {{ jornadaDelDia }}
        </div>

        <div v-if="bloquesDelDia.length === 0" class="cal-semana__detalle-vacio">
          Sin bloqueos ni actividades este día.
        </div>

        <div
          v-for="bloque in bloquesDelDia"
          :key="bloque.id"
          class="cal-semana__bloque"
          :class="`cal-semana__bloque--${bloque.tipo}`"
        >
          <div class="cal-semana__bloque-hora">
            <span class="material-symbols-outlined">schedule</span>
            {{ bloque.rango }}
          </div>
          <div class="cal-semana__bloque-info">
            <span class="cal-semana__bloque-desc">{{ bloque.descripcion }}</span>
            <span v-if="bloque.proyecto" class="cal-semana__bloque-badge">
              {{ bloque.proyecto }}
            </span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import calendarioService from "../../services/calendarioService";
import { fechaLarga, rangoSemana } from "../../utils/fechas.js";
import { horaCorta, aMinutos } from "../../utils/horas";
import { mensajeErrorApi } from "../../utils/apiError";

const NOMBRES_DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

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
  name: "CalendarioCompacto",
  emits: ["ver-completo"],
  data() {
    return {
      cargando: true,
      calendario: null,
      semanaInicio: null,
      diaSeleccionadoKey: null,
      mensajeError: "",
    };
  },
  computed: {
    diasSemana() {
      const lista = [];
      const inicio = new Date(this.semanaInicio);
      for (let i = 0; i < 7; i++) {
        const dia = new Date(inicio);
        dia.setDate(inicio.getDate() + i);
        const diaSemana = dia.getDay() === 0 ? 7 : dia.getDay();
        const jornada = this.jornadaPorDia(diaSemana);
        const bloquesDia = this.bloquesDeDia(dia);

        lista.push({
          fecha: dia,
          fechaKey: toFechaKey(dia),
          nombre: NOMBRES_DIAS[i],
          numero: dia.getDate(),
          laborable: jornada != null,
          esHoy: toFechaKey(dia) === toFechaKey(new Date()),
          segmentos: this.calcularSegmentos(jornada, bloquesDia),
          resumenBarra: this.resumenBarra(bloquesDia),
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
    diaSeleccionadoNombre() {
      if (!this.diaSeleccionadoKey) return "—";
      const [ano, mes, dia] = this.diaSeleccionadoKey.split("-").map(Number);
      const fecha = new Date(ano, mes - 1, dia);
      return fechaLarga(fecha);
    },
    jornadaDelDia() {
      if (!this.diaSeleccionadoKey || !this.calendario) return null;
      const [ano, mes, dia] = this.diaSeleccionadoKey.split("-").map(Number);
      const fecha = new Date(ano, mes - 1, dia);
      const diaSemana = fecha.getDay() === 0 ? 7 : fecha.getDay();
      const jornada = this.jornadaPorDia(diaSemana);
      if (!jornada) return null;

      const iniManiana = horaCorta(jornada.horaInicioManana);
      const finManiana = horaCorta(jornada.horaFinManana);
      const iniTarde = horaCorta(jornada.horaInicioTarde);
      const finTarde = horaCorta(jornada.horaFinTarde);

      if (finManiana && iniTarde) {
        return `${iniManiana} – ${finManiana} / ${iniTarde} – ${finTarde}`;
      }
      if (iniManiana && finTarde) {
        return `${iniManiana} – ${finTarde}`;
      }
      return null;
    },
    bloquesDelDia() {
      if (!this.diaSeleccionadoKey || !this.calendario) return [];
      const key = this.diaSeleccionadoKey;
      const resultado = [];

      (this.calendario.actividades || []).forEach((a) => {
        const ini = aDate(a.fechaHoraInicio);
        const fin = aDate(a.fechaHoraFin);
        const iniDia = new Date(`${key}T00:00:00`);
        const finDia = new Date(`${key}T23:59:59`);
        if (ini < finDia && fin > iniDia) {
          resultado.push({
            id: `act-${a.idActividad}`,
            tipo: "actividad",
            rango: `${pad(ini.getHours())}:${pad(ini.getMinutes())} – ${pad(fin.getHours())}:${pad(fin.getMinutes())}`,
            descripcion: a.nombre || "Actividad de proyecto",
            proyecto: a.proyectoNombre || (a.idProyecto ? `Proyecto #${a.idProyecto}` : null),
            orden: ini.getHours() * 60 + ini.getMinutes(),
          });
        }
      });

      (this.calendario.bloqueosManuales || []).forEach((b) => {
        const ini = aDate(b.fechaHoraInicio);
        const fin = aDate(b.fechaHoraFin);
        const iniDia = new Date(`${key}T00:00:00`);
        const finDia = new Date(`${key}T23:59:59`);
        if (ini < finDia && fin > iniDia) {
          resultado.push({
            id: `bloq-${b.idBloqueo}`,
            tipo: "bloqueo",
            rango: `${pad(ini.getHours())}:${pad(ini.getMinutes())} – ${pad(fin.getHours())}:${pad(fin.getMinutes())}`,
            descripcion: b.motivo || "Bloqueo manual",
            proyecto: null,
            orden: ini.getHours() * 60 + ini.getMinutes(),
          });
        }
      });

      return resultado.sort((a, b) => a.orden - b.orden);
    },
  },
  mounted() {
    this.semanaInicio = this.inicioDeSemana(new Date());
    this.diaSeleccionadoKey = toFechaKey(new Date());
    this.cargarCalendario();
  },
  methods: {
    async cargarCalendario() {
      this.cargando = true;
      this.mensajeError = "";
      try {
        const response = await calendarioService.obtenerCalendario();
        this.calendario = response.data;
      } catch (error) {
        this.calendario = null;
        this.mensajeError = mensajeErrorApi(error, "No se pudo cargar el calendario.");
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
      this.diaSeleccionadoKey = toFechaKey(new Date());
    },
    jornadaPorDia(diaSemana) {
      return (this.calendario?.jornada?.dias || []).find((d) => d.diaSemana === diaSemana) || null;
    },
    bloquesDeDia(fecha) {
      const key = toFechaKey(fecha);
      const iniDia = new Date(`${key}T00:00:00`);
      const finDia = new Date(`${key}T23:59:59`);
      const resultado = [];

      (this.calendario?.actividades || []).forEach((a) => {
        const ini = aDate(a.fechaHoraInicio);
        const fin = aDate(a.fechaHoraFin);
        if (ini < finDia && fin > iniDia) {
          resultado.push({ tipo: "actividad", ini, fin });
        }
      });

      (this.calendario?.bloqueosManuales || []).forEach((b) => {
        const ini = aDate(b.fechaHoraInicio);
        const fin = aDate(b.fechaHoraFin);
        if (ini < finDia && fin > iniDia) {
          resultado.push({ tipo: "bloqueo", ini, fin });
        }
      });

      return resultado;
    },
    calcularSegmentos(jornada, bloques) {
      if (!jornada) {
        return [{ tipo: "descanso", ancho: 100, titulo: "Día no laborable" }];
      }

      const iniManiana = horaCorta(jornada.horaInicioManana) || "09:00";
      const finTarde = horaCorta(jornada.horaFinTarde) || "18:00";
      const totalMinutos = aMinutos(finTarde) - aMinutos(iniManiana);

      if (totalMinutos <= 0) {
        return [{ tipo: "descanso", ancho: 100, titulo: "Sin jornada definida" }];
      }

      const segmentos = [];
      let cursorMinutos = aMinutos(iniManiana);

      const bloquesOrdenados = bloques
        .map((b) => ({
          tipo: b.tipo,
          inicio: Math.max(aMinutos(this.horaDeFecha(b.ini)), aMinutos(iniManiana)),
          fin: Math.min(aMinutos(this.horaDeFecha(b.fin)), aMinutos(finTarde)),
        }))
        .filter((b) => b.fin > b.inicio)
        .sort((a, b) => a.inicio - b.inicio);

      for (const bloque of bloquesOrdenados) {
        if (bloque.inicio > cursorMinutos) {
          const duracion = bloque.inicio - cursorMinutos;
          segmentos.push({
            tipo: "disponible",
            ancho: (duracion / totalMinutos) * 100,
            titulo: "Disponible",
          });
        }
        const duracion = bloque.fin - bloque.inicio;
        segmentos.push({
          tipo: bloque.tipo,
          ancho: (duracion / totalMinutos) * 100,
          titulo: bloque.tipo === "actividad" ? "Actividad de proyecto" : "Bloqueo manual",
        });
        cursorMinutos = bloque.fin;
      }

      if (cursorMinutos < aMinutos(finTarde)) {
        const duracion = aMinutos(finTarde) - cursorMinutos;
        segmentos.push({
          tipo: "disponible",
          ancho: (duracion / totalMinutos) * 100,
          titulo: "Disponible",
        });
      }

      if (segmentos.length === 0) {
        return [{ tipo: "disponible", ancho: 100, titulo: "Disponible" }];
      }

      const anchoTotal = segmentos.reduce((sum, s) => sum + s.ancho, 0);
      if (anchoTotal < 100) {
        segmentos.push({ tipo: "disponible", ancho: 100 - anchoTotal, titulo: "Disponible" });
      }

      return segmentos;
    },
    resumenBarra(bloques) {
      if (bloques.length === 0) return "Día completo disponible";
      const tipos = bloques.map((b) => (b.tipo === "actividad" ? "actividad" : "bloqueo"));
      return `${tipos.length} evento(s): ${tipos.join(", ")}`;
    },
    horaDeFecha(fecha) {
      return `${pad(fecha.getHours())}:${pad(fecha.getMinutes())}`;
    },
    seleccionarDia(dia) {
      this.diaSeleccionadoKey = dia.fechaKey;
    },
  },
};
</script>

<style scoped>
.cal-semana {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.cal-semana__estado {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem 1rem;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

/* Navegación */
.cal-semana__nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cal-semana__nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: var(--color-surface);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.cal-semana__nav-btn:hover {
  background: #f3f4f6;
  color: var(--color-text);
}

.cal-semana__nav-btn .material-symbols-outlined {
  font-size: 1.15rem;
}

.cal-semana__periodo {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-text);
  padding: 0 0.5rem;
}

.cal-semana__hoy {
  margin-left: auto;
  background: none;
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
  border-radius: 6px;
  padding: 0.35rem 0.85rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.cal-semana__hoy:hover {
  background: var(--color-primary);
  color: #fff;
}

/* Tira semanal */
.cal-semana__tira {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.4rem;
}

.cal-semana__dia {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  padding: 0.5rem 0.25rem 0.6rem;
  border-radius: 8px;
  border: 2px solid transparent;
  background: var(--color-surface);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.cal-semana__dia:hover {
  background: #f7f7fa;
}

.cal-semana__dia--hoy {
  background: #f0f0f6;
}

.cal-semana__dia--seleccionado {
  border-color: var(--color-secondary);
  background: #f5f4fc;
}

.cal-semana__dia--descanso {
  opacity: 0.5;
}

.cal-semana__dia-nombre {
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.cal-semana__dia-numero {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
}

/* Mini-timeline bar */
.cal-semana__barra {
  display: flex;
  width: 100%;
  height: 6px;
  border-radius: 3px;
  overflow: hidden;
  gap: 1px;
}

.cal-semana__barra-seg {
  display: block;
  min-width: 2px;
  height: 100%;
}

.cal-semana__barra-seg--actividad {
  background: var(--color-secondary);
}

.cal-semana__barra-seg--bloqueo {
  background: #fca5a5;
}

.cal-semana__barra-seg--disponible {
  background: var(--color-support);
}

.cal-semana__barra-seg--descanso {
  background: #e5e7eb;
}

/* Leyenda */
.cal-semana__leyenda {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.cal-semana__leyenda-item {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.cal-semana__leyenda-color {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.cal-semana__leyenda-color--actividad {
  background: var(--color-secondary);
}

.cal-semana__leyenda-color--bloqueo {
  background: #fca5a5;
}

.cal-semana__leyenda-color--disponible {
  background: var(--color-support);
}

.cal-semana__leyenda-color--nolaborable {
  background: #e5e7eb;
}

/* Detalle del día */
.cal-semana__detalle {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px solid #e5e7eb;
}

.cal-semana__detalle-titulo {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--color-text);
}

.cal-semana__jornada {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  padding: 0.5rem 0.75rem;
  background: #f9fafb;
  border-radius: 6px;
}

.cal-semana__jornada .material-symbols-outlined {
  font-size: 1rem;
}

.cal-semana__detalle-vacio {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  text-align: center;
}

/* Bloques del día */
.cal-semana__bloque {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.cal-semana__bloque--actividad {
  background: #f3f2fa;
  border-color: #d8d6ed;
}

.cal-semana__bloque--bloqueo {
  background: #fff5f5;
  border-color: #fecaca;
}

.cal-semana__bloque-hora {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  min-width: 110px;
}

.cal-semana__bloque-hora .material-symbols-outlined {
  font-size: 1rem;
  color: var(--color-text-muted);
}

.cal-semana__bloque-info {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 0;
}

.cal-semana__bloque-desc {
  font-size: 0.85rem;
  color: var(--color-text);
}

.cal-semana__bloque-badge {
  display: inline-flex;
  align-self: flex-start;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--color-secondary);
  background: #ececf5;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
}

/* Responsive: scroll horizontal en pantallas angostas */
@media (max-width: 640px) {
  .cal-semana__tira {
    display: flex;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scroll-snap-type: x mandatory;
    padding-bottom: 0.25rem;
  }

  .cal-semana__dia {
    min-width: 72px;
    flex-shrink: 0;
    scroll-snap-align: start;
  }
}
</style>
