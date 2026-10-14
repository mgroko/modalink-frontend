<template>
  <div class="calendario">
    <BaseAlert v-if="mensajeExito" :message="mensajeExito" type="success" />
    <BaseAlert v-if="mensajeError" :message="mensajeError" type="error" />

    <div class="calendario__toolbar">
      <div class="calendario__nav">
        <button class="calendario__nav-btn" @click="cambiarSemana(-1)" title="Semana anterior">
          <span class="material-symbols-outlined">chevron_left</span>
        </button>
        <h2 class="calendario__periodo">{{ periodo }}</h2>
        <button class="calendario__nav-btn" @click="cambiarSemana(1)" title="Semana siguiente">
          <span class="material-symbols-outlined">chevron_right</span>
        </button>
        <button class="calendario__hoy" @click="irAHoy">Hoy</button>
      </div>

      <div v-if="mostrarAcciones && !soloLectura" class="calendario__acciones">
        <VaButton preset="secondary" color="primary" @click="abrirJornada">
          <span class="material-symbols-outlined calendario__btn-icono">schedule</span>
          Configurar jornada
        </VaButton>
        <VaButton color="primary" @click="abrirBloqueo">
          <span class="material-symbols-outlined calendario__btn-icono">add</span>
          Agregar bloque
        </VaButton>
      </div>
    </div>

    <div v-if="cargando" class="calendario__estado">
      <span class="material-symbols-outlined calendario__estado-icono">hourglass_empty</span>
      Cargando calendario...
    </div>

    <template v-else-if="calendario">
      <div class="calendario__leyenda">
        <div class="calendario__leyenda-item">
          <span class="calendario__leyenda-cuadro calendario__leyenda-cuadro--actividad"></span>
          Actividad de proyecto
        </div>
        <div class="calendario__leyenda-item">
          <span class="calendario__leyenda-cuadro calendario__leyenda-cuadro--bloqueo"></span>
          Bloqueo manual
        </div>
        <div class="calendario__leyenda-item">
          <span class="calendario__leyenda-cuadro calendario__leyenda-cuadro--disponible"></span>
          Disponible
        </div>
        <div class="calendario__leyenda-item">
          <span class="calendario__leyenda-cuadro calendario__leyenda-cuadro--nolaborable"></span>
          No laborable
        </div>
      </div>

      <div class="calendario__grid-wrap">
        <div class="calendario__grid">
          <div class="calendario__grid-corner"></div>
          <div
            v-for="dia in diasSemana"
            :key="dia.fechaKey"
            class="calendario__grid-header"
            :class="{
              'calendario__grid-header--hoy': dia.esHoy,
              'calendario__grid-header--nolaborable': !dia.laborable,
            }"
            role="button"
            tabindex="0"
            @click="seleccionarDia(dia)"
            @keydown.enter="seleccionarDia(dia)"
          >
            <span class="calendario__grid-header-dia">{{ dia.nombre }}</span>
            <span class="calendario__grid-header-fecha">{{ dia.numero }}</span>
            <span v-if="dia.esHoy" class="calendario__grid-header-hoy">(Hoy)</span>
          </div>

          <template v-for="slot in slotsHorario" :key="slot.hora">
            <div class="calendario__hora">
              <span>{{ slot.etiqueta }}</span>
            </div>
            <div
              v-for="dia in diasSemana"
              :key="dia.fechaKey + '-' + slot.hora"
              class="calendario__celda"
              :class="celdaClase(dia, slot)"
              @click="clickEnCelda(dia, slot)"
            ></div>
          </template>
        </div>
      </div>

      <div class="calendario__detalle">
        <h3 class="calendario__detalle-titulo">Detalle del día: {{ tituloDetalle }}</h3>

        <div v-if="itemsDelDia.length === 0" class="calendario__detalle-vacio">
          Sin bloqueos ni actividades este día.
        </div>

        <div v-else class="calendario__detalle-grid">
          <div
            v-for="item in itemsDelDia"
            :key="item.id"
            class="calendario__evento"
            :class="`calendario__evento--${item.tipo}`"
          >
            <div class="calendario__evento-cabecera">
              <span class="calendario__evento-rango">{{ item.rango }}</span>
              <span v-if="item.proyecto" class="calendario__evento-badge">{{ item.proyecto }}</span>
              <button
                v-if="item.tipo === 'bloqueo' && !soloLectura"
                class="calendario__evento-eliminar"
                title="Eliminar bloqueo"
                @click="confirmarEliminar(item.original)"
              >
                <span class="material-symbols-outlined">delete</span>
              </button>
            </div>
            <span class="calendario__evento-desc">{{ item.descripcion }}</span>
          </div>
        </div>
      </div>
    </template>

    <ConfigurarJornada
      v-model="modalJornadaVisible"
      :jornada="calendario?.jornada || null"
      @guardada="onJornadaGuardada"
    />

    <CrearBloqueo
      v-model="modalBloqueoVisible"
      @creado="onBloqueoCreado"
    />

    <VaModal
      v-model="modalEliminarVisible"
      size="small"
      close-button
      hide-default-actions
    >
      <template #header>
        <h3 class="va-h5">Eliminar bloqueo</h3>
      </template>
      <p>¿Estás seguro que querés marcar como disponible este horario?
        No se puede eliminar si compromete una actividad de un proyecto activo.</p>
      <template #footer>
        <div class="calendario__modal-footer">
          <VaButton preset="secondary" @click="modalEliminarVisible = false">Cancelar</VaButton>
          <VaButton color="danger" :loading="eliminando" @click="ejecutarEliminar">Eliminar</VaButton>
        </div>
      </template>
    </VaModal>
  </div>
</template>

<script>
import calendarioService from "../../services/calendarioService";
import BaseAlert from "../../components/AlertaBase.vue";
import ConfigurarJornada from "./ConfigurarJornada.vue";
import CrearBloqueo from "./CrearBloqueo.vue";
import { rangoSemana } from "../../utils/fechas.js";
import { horaCorta, aMinutos, aHora } from "../../utils/horas";
import { mensajeErrorApi } from "../../utils/apiError";

const NOMBRES_DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const NOMBRES_DIAS_LARGOS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MESES_LARGOS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function pad(n) {
  return String(n).padStart(2, "0");
}

function toFechaKey(fecha) {
  return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}`;
}

function aDate(localDateTime) {
  return new Date(localDateTime);
}

function rangoHorario(inicio, fin) {
  const ini = aDate(inicio);
  const termino = aDate(fin);
  return `${pad(ini.getHours())}:${pad(ini.getMinutes())} – ${pad(termino.getHours())}:${pad(termino.getMinutes())}`;
}

export default {
  name: "CalendarioProfesional",
  components: {
    BaseAlert,
    ConfigurarJornada,
    CrearBloqueo,
  },
  props: {
    mostrarAcciones: {
      type: Boolean,
      default: false,
    },
    soloLectura: {
      type: Boolean,
      default: false,
    },
    idUsuario: {
      type: Number,
      default: null,
    },
  },
  emits: ["actualizado"],
  data() {
    return {
      cargando: true,
      calendario: null,
      semanaInicio: null,
      diaSeleccionado: null,
      modalJornadaVisible: false,
      modalBloqueoVisible: false,
      modalEliminarVisible: false,
      bloqueoAEliminar: null,
      eliminando: false,
      mensajeExito: "",
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
        lista.push({
          fecha: dia,
          fechaKey: toFechaKey(dia),
          nombre: NOMBRES_DIAS[i],
          numero: dia.getDate(),
          laborable: this.jornadaPorDia(diaSemana) != null,
          esHoy: toFechaKey(dia) === toFechaKey(new Date()),
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
    slotsHorario() {
      const { horaInicio, horaFin } = this.ventanaHoraria;
      return this.generarSlots(horaInicio, horaFin);
    },
    ventanaHoraria() {
      let min = "09:00";
      let max = "18:00";
      (this.calendario?.jornada?.dias || []).forEach((d) => {
        const inicio = d.horaInicioManana;
        const fin = d.horaFinTarde;
        if (inicio && inicio.slice(0, 5) < min) min = inicio.slice(0, 5);
        if (fin && fin.slice(0, 5) > max) max = fin.slice(0, 5);
      });
      (this.calendario?.actividades || []).forEach((a) => {
        if (!a.fechaHoraFin) return;
        const hora = a.fechaHoraFin.split("T")[1]?.slice(0, 5);
        if (hora && hora > max) max = hora;
      });
      return { horaInicio: min, horaFin: max };
    },
    tituloDetalle() {
      if (!this.diaSeleccionado) return "—";
      const fecha = this.diaSeleccionado;
      return `${NOMBRES_DIAS_LARGOS[fecha.getDay()]} ${fecha.getDate()} de ${MESES_LARGOS[fecha.getMonth()]}`;
    },
    itemsDelDia() {
      if (!this.diaSeleccionado || !this.calendario) return [];
      const key = toFechaKey(this.diaSeleccionado);
      const items = [];

      (this.calendario.bloqueosManuales || []).forEach((b) => {
        if (!this.entrecruzaConDia(b, key)) return;
        items.push({
          id: `bloqueo-${b.idBloqueo}`,
          tipo: "bloqueo",
          rango: rangoHorario(b.fechaHoraInicio, b.fechaHoraFin),
          descripcion: `Bloqueo manual: ${b.motivo || "Sin motivo"}`,
          proyecto: null,
          orden: aDate(b.fechaHoraInicio).getTime(),
          original: b,
        });
      });

      (this.calendario.actividades || []).forEach((a) => {
        if (!this.entrecruzaConDia(a, key)) return;
        items.push({
          id: `actividad-${a.idActividad}`,
          tipo: "actividad",
          rango: rangoHorario(a.fechaHoraInicio, a.fechaHoraFin),
          descripcion: a.nombre || "Actividad de proyecto",
          proyecto: a.proyectoNombre || (a.idProyecto ? `Proyecto #${a.idProyecto}` : null),
          orden: aDate(a.fechaHoraInicio).getTime(),
          original: a,
        });
      });

      return items.sort((a, b) => a.orden - b.orden);
    },
  },
  mounted() {
    this.semanaInicio = this.inicioDeSemana(new Date());
    this.cargarCalendario();
  },
  watch: {
    idUsuario() {
      this.cargarCalendario();
    },
  },
  methods: {
    async cargarCalendario() {
      this.cargando = true;
      this.mensajeError = "";
      try {
        const response = this.idUsuario
          ? await calendarioService.obtenerCalendarioPerfil(this.idUsuario)
          : await calendarioService.obtenerCalendario();
        this.calendario = response.data;
        this.diaSeleccionado = new Date();
      } catch (error) {
        this.calendario = null;
        if (this.idUsuario && error?.response?.status === 404) {
          this.mensajeError = "Este perfil no tiene una agenda configurada.";
        } else {
          this.mensajeError = mensajeErrorApi(error, "No se pudo cargar el calendario.");
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
      this.diaSeleccionado = new Date();
    },
    jornadaPorDia(diaSemana) {
      return (this.calendario?.jornada?.dias || []).find((d) => d.diaSemana === diaSemana) || null;
    },
    estaEnJornadaLaboral(diaSemana, slotInicio, slotFin) {
      const jornada = this.jornadaPorDia(diaSemana);
      if (!jornada) return false;

      const iniManiana = horaCorta(jornada.horaInicioManana);
      const finManiana = horaCorta(jornada.horaFinManana);
      const iniTarde = horaCorta(jornada.horaInicioTarde);
      const finTarde = horaCorta(jornada.horaFinTarde);

      if (!finManiana || !iniTarde) {
        return slotInicio >= iniManiana && slotFin <= finTarde;
      }

      const enManiana = slotInicio >= iniManiana && slotFin <= finManiana;
      const enTarde = slotInicio >= iniTarde && slotFin <= finTarde;
      return enManiana || enTarde;
    },
    generarSlots(horaInicio, horaFin) {
      const slots = [];
      const inicio = aMinutos(horaInicio);
      const fin = aMinutos(horaFin);
      for (let t = inicio; t < fin; t += 60) {
        const h = Math.floor(t / 60);
        const etiqueta = `${pad(h)}:00`;
        slots.push({ hora: t, etiqueta, inicio: aHora(t), fin: aHora(t + 60) });
      }
      return slots;
    },
    entrecruzaConDia(item, fechaKey) {
      const ini = aDate(item.fechaHoraInicio);
      const fin = aDate(item.fechaHoraFin);
      const itemIni = new Date(`${fechaKey}T00:00:00`);
      const itemFin = new Date(`${fechaKey}T23:59:59`);
      return ini < itemFin && fin > itemIni;
    },
    celdaClase(dia, slot) {
      const clases = [];
      const diaSemana = dia.fecha.getDay() === 0 ? 7 : dia.fecha.getDay();
      const laborableEnEsteSlot = dia.laborable && this.estaEnJornadaLaboral(diaSemana, slot.inicio, slot.fin);

      if (!laborableEnEsteSlot) {
        clases.push("calendario__celda--nolaborable");
        return clases;
      }
      const actividad = this.actividadEnSlot(dia, slot);
      const bloqueo = this.bloqueoEnSlot(dia, slot);
      if (actividad) clases.push("calendario__celda--actividad");
      else if (bloqueo) clases.push("calendario__celda--bloqueo");
      else clases.push("calendario__celda--disponible");
      return clases;
    },
    actividadEnSlot(dia, slot) {
      const fechaKey = dia.fechaKey;
      return (this.calendario?.actividades || []).some((a) => {
        const ini = aDate(a.fechaHoraInicio);
        const fin = aDate(a.fechaHoraFin);
        const inicioSlot = new Date(`${fechaKey}T${slot.inicio}:00`);
        const finSlot = new Date(`${fechaKey}T${slot.fin}:00`);
        return ini < finSlot && fin > inicioSlot;
      });
    },
    bloqueoEnSlot(dia, slot) {
      const fechaKey = dia.fechaKey;
      return (this.calendario?.bloqueosManuales || []).some((b) => {
        const ini = aDate(b.fechaHoraInicio);
        const fin = aDate(b.fechaHoraFin);
        const inicioSlot = new Date(`${fechaKey}T${slot.inicio}:00`);
        const finSlot = new Date(`${fechaKey}T${slot.fin}:00`);
        return ini < finSlot && fin > inicioSlot;
      });
    },
    clickEnCelda(dia, slot) {
      if (!dia.laborable) return;
      this.diaSeleccionado = dia.fecha;
    },
    seleccionarDia(dia) {
      this.diaSeleccionado = dia.fecha;
    },
    abrirJornada() {
      this.modalJornadaVisible = true;
    },
    abrirBloqueo() {
      this.modalBloqueoVisible = true;
    },
    async onJornadaGuardada() {
      this.modalJornadaVisible = false;
      this.mensajeExito = "Jornada laboral actualizada correctamente.";
      this.mensajeError = "";
      await this.cargarCalendario();
      this.$emit("actualizado");
    },
    async onBloqueoCreado() {
      this.modalBloqueoVisible = false;
      this.mensajeExito = "Bloqueo creado correctamente.";
      this.mensajeError = "";
      await this.cargarCalendario();
      this.$emit("actualizado");
    },
    confirmarEliminar(bloqueo) {
      this.bloqueoAEliminar = bloqueo;
      this.modalEliminarVisible = true;
    },
    async ejecutarEliminar() {
      if (!this.bloqueoAEliminar) return;
      this.eliminando = true;
      this.mensajeError = "";
      this.mensajeExito = "";
      try {
        await calendarioService.eliminarBloqueo(this.bloqueoAEliminar.idBloqueo);
        this.modalEliminarVisible = false;
        this.mensajeExito = "Bloqueo eliminado. Horario marcado como disponible.";
        await this.cargarCalendario();
        this.$emit("actualizado");
      } catch (error) {
        this.mensajeError = mensajeErrorApi(error, "No se pudo eliminar el bloqueo.");
        this.modalEliminarVisible = false;
      } finally {
        this.eliminando = false;
      }
    },
  },
};
</script>

<style scoped>
.calendario {
  width: 100%;
  --cal-actividad: #6fbf73;
  --cal-actividad-celda: #cdeccf;
  --cal-actividad-card: #edf8ee;
  --cal-actividad-borde: #bfe3c2;
  --cal-bloqueo-celda: #f8d4d4;
  --cal-bloqueo-card: #fdefef;
  --cal-bloqueo-borde: #f3c8c8;
  --cal-disponible: #edf3f9;
  --cal-disponible-hover: #e2ecf6;
  --cal-nolaborable: #f3f4f6;
}

.calendario__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.calendario__nav {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.calendario__nav-btn {
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
}

.calendario__nav-btn:hover {
  background: #f3f4f6;
  color: var(--color-text);
}

.calendario__nav-btn .material-symbols-outlined {
  font-size: 1.15rem;
}

.calendario__periodo {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
  min-width: 180px;
  text-align: center;
}

.calendario__hoy {
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

.calendario__hoy:hover {
  background: var(--color-primary);
  color: #fff;
}

.calendario__acciones {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.calendario__btn-icono {
  font-size: 1.05rem;
  margin-right: 0.25rem;
}

.calendario__leyenda {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 1.25rem;
  margin-bottom: 0.75rem;
  font-size: 0.78rem;
  color: var(--color-text-muted);
}

.calendario__leyenda-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.calendario__leyenda-cuadro {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  display: inline-block;
}

.calendario__leyenda-cuadro--actividad {
  background: var(--cal-actividad);
  border: 1px solid #5aa860;
}

.calendario__leyenda-cuadro--bloqueo {
  background: var(--cal-bloqueo-celda);
  border: 1px solid var(--cal-bloqueo-borde);
}

.calendario__leyenda-cuadro--disponible {
  background: #d9e6f2;
  border: 1px solid #c6d9ec;
}

.calendario__leyenda-cuadro--nolaborable {
  background: #e5e7eb;
  border: 1px solid #d1d5db;
}

.calendario__grid-wrap {
  overflow-x: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.calendario__grid {
  display: grid;
  grid-template-columns: 56px repeat(7, 1fr);
  gap: 1px;
  background: #e5e7eb;
  min-width: 720px;
}

.calendario__grid-corner {
  background: var(--color-surface);
}

.calendario__grid-header {
  background: var(--color-surface);
  padding: 0.5rem 0.25rem;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.3rem;
  border-bottom: 1px solid #e5e7eb;
  cursor: pointer;
}

.calendario__grid-header-dia {
  font-size: 0.72rem;
  color: var(--color-text-muted);
}

.calendario__grid-header-fecha {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-text);
}

.calendario__grid-header-hoy {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--color-primary);
}

.calendario__grid-header--hoy .calendario__grid-header-fecha {
  color: var(--color-primary);
}

.calendario__grid-header--nolaborable .calendario__grid-header-dia,
.calendario__grid-header--nolaborable .calendario__grid-header-fecha {
  color: #c4c6cf;
}

.calendario__hora {
  background: var(--color-surface);
  padding: 0.4rem 0.4rem 0.4rem 0.5rem;
  font-size: 0.7rem;
  color: var(--color-text-muted);
  text-align: right;
  line-height: 1.2;
}

.calendario__celda {
  min-height: 52px;
  background: var(--color-surface);
  cursor: pointer;
}

.calendario__celda--disponible {
  background: var(--cal-disponible);
}

.calendario__celda--disponible:hover {
  background: var(--cal-disponible-hover);
}

.calendario__celda--actividad {
  background: var(--cal-actividad-celda);
  cursor: default;
}

.calendario__celda--bloqueo {
  background: var(--cal-bloqueo-celda);
}

.calendario__celda--bloqueo:hover {
  background: #f3c3c3;
}

.calendario__celda--nolaborable {
  background: var(--cal-nolaborable);
  cursor: default;
}

.calendario__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.calendario__estado-icono {
  font-size: 2.5rem;
}

.calendario__detalle {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid #e5e7eb;
}

.calendario__detalle-titulo {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
}

.calendario__detalle-vacio {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  text-align: center;
}

.calendario__detalle-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.calendario__evento {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.85rem 1rem;
  border-radius: 8px;
  border: 1px solid transparent;
}

.calendario__evento--bloqueo {
  background: var(--cal-bloqueo-card);
  border-color: var(--cal-bloqueo-borde);
}

.calendario__evento--actividad {
  background: var(--cal-actividad-card);
  border-color: var(--cal-actividad-borde);
}

.calendario__evento-cabecera {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 24px;
}

.calendario__evento-rango {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-text);
}

.calendario__evento-badge {
  margin-left: auto;
  font-size: 0.7rem;
  font-weight: 600;
  color: #2f7d46;
  background: #d5efda;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
}

.calendario__evento-eliminar {
  margin-left: auto;
  background: none;
  border: none;
  cursor: pointer;
  color: #d14343;
  padding: 0.1rem;
  display: flex;
  align-items: center;
  border-radius: 4px;
}

.calendario__evento-eliminar:hover {
  background: #f8dcdc;
}

.calendario__evento-eliminar .material-symbols-outlined {
  font-size: 1.15rem;
}

.calendario__evento-desc {
  font-size: 0.85rem;
  color: var(--color-text);
  line-height: 1.4;
}

.calendario__modal-footer {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  width: 100%;
}

@media (max-width: 640px) {
  .calendario__toolbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .calendario__detalle-grid {
    grid-template-columns: 1fr;
  }
}
</style>
