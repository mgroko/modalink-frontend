<template>
  <div class="calendario">
    <div class="calendario__tabs">
      <button
        class="calendario__tab"
        @click="$router.push({ name: 'dashboard-usuario' })"
      >
        Perfiles
      </button>
      <button
        class="calendario__tab calendario__tab--active"
      >
        Calendario
      </button>
    </div>

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

      <div class="calendario__acciones">
        <VaButton preset="secondary" color="primary" @click="abrirJornada">
          <span class="material-symbols-outlined calendario__btn-icono">schedule</span>
          Configurar jornada
        </VaButton>
        <VaButton color="primary" @click="abrirBloqueo">
          <span class="material-symbols-outlined calendario__btn-icono">add</span>
          Agregar bloqueo
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

      <div class="calendario__grid" :class="{ 'calendario__grid--dia': vista === 'dia' }">
        <div class="calendario__grid-corner"></div>
        <div
          v-for="dia in diasSemana"
          :key="dia.fechaKey"
          class="calendario__grid-header"
          :class="{ 'calendario__grid-header--hoy': dia.esHoy, 'calendario__grid-header--nolaborable': !dia.laborable }"
        >
          <span class="calendario__grid-header-dia">{{ dia.nombre }}</span>
          <span class="calendario__grid-header-fecha">{{ dia.numero }}</span>
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

      <div class="calendario__capacitacion-gap"></div>

      <div class="calendario__detalle">
        <h3 class="calendario__detalle-titulo">
          Detalle: {{ fechaDetalle }}
        </h3>

        <div class="calendario__detalle-grupo">
          <span class="calendario__detalle-subtitulo">Bloqueos manuales</span>
          <div v-if="bloqueosDelDia.length === 0" class="calendario__detalle-vacio">
            Sin bloqueos manuales este día.
          </div>
          <div
            v-for="bloqueo in bloqueosDelDia"
            :key="bloqueo.idBloqueo"
            class="calendario__detalle-item calendario__detalle-item--bloqueo"
          >
            <div class="calendario__detalle-item-info">
              <span class="calendario__detalle-item-rango">{{ rango(bloqueo) }}</span>
              <span class="calendario__detalle-item-motivo">{{ bloqueo.motivo || 'Sin motivo' }}</span>
            </div>
            <button class="calendario__detalle-item-eliminar" title="Eliminar bloqueo" @click="confirmarEliminar(bloqueo)">
              <span class="material-symbols-outlined">delete</span>
            </button>
          </div>
        </div>

        <div class="calendario__detalle-grupo">
          <span class="calendario__detalle-subtitulo">Actividades de proyecto</span>
          <div v-if="actividadesDelDia.length === 0" class="calendario__detalle-vacio">
            Sin actividades este día.
          </div>
          <div
            v-for="actividad in actividadesDelDia"
            :key="actividad.idActividad"
            class="calendario__detalle-item calendario__detalle-item--actividad"
          >
            <div class="calendario__detalle-item-info">
              <span class="calendario__detalle-item-rango">{{ rango(actividad) }}</span>
              <span class="calendario__detalle-item-motivo">{{ actividad.nombre }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Modal: configurar jornada -->
    <ConfigurarJornada
      v-model="modalJornadaVisible"
      :jornada="calendario?.jornada || null"
      @guardada="onJornadaGuardada"
    />

    <!-- Modal: crear bloqueo -->
    <CrearBloqueo
      v-model="modalBloqueoVisible"
      @creado="onBloqueoCreado"
    />

    <!-- Modal: confirmar eliminación de bloqueo -->
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
import ConfigurarJornada from "../../components/calendario/ConfigurarJornada.vue";
import CrearBloqueo from "../../components/calendario/CrearBloqueo.vue";

const NOMBRES_DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const DIAS_ENTERO = [1, 2, 3, 4, 5, 6, 7];

function pad(n) {
  return String(n).padStart(2, "0");
}

function toFechaKey(fecha) {
  return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}`;
}

function aDate(localDateTime) {
  const fecha = new Date(localDateTime);
  return fecha;
}

export default {
  name: "CalendarioView",
  components: {
    BaseAlert,
    ConfigurarJornada,
    CrearBloqueo,
  },
  data() {
    return {
      cargando: true,
      calendario: null,
      semanaInicio: null,
      vista: "semana",
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
      const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
      if (this.semanaInicio.getMonth() === fin.getMonth()) {
        return `${this.semanaInicio.getDate()} – ${fin.getDate()} ${meses[fin.getMonth()]} ${fin.getFullYear()}`;
      }
      return `${this.semanaInicio.getDate()} ${meses[this.semanaInicio.getMonth()]} – ${fin.getDate()} ${meses[fin.getMonth()]} ${fin.getFullYear()}`;
    },
    slotsHorario() {
      const { horaInicio, horaFin } = this.ventanaHoraria;
      return this.generarSlots(horaInicio, horaFin);
    },
    ventanaHoraria() {
      let min = "09:00";
      let max = "18:00";
      (this.calendario?.jornada?.dias || []).forEach((d) => {
        if (d.horaInicio && d.horaInicio < min) min = d.horaInicio;
        if (d.horaFin && d.horaFin > max) max = d.horaFin;
      });
      (this.calendario?.actividades || []).forEach((a) => {
        if (!a.fechaHoraFin) return;
        const hora = a.fechaHoraFin.split("T")[1]?.slice(0, 5);
        if (hora && hora > max) max = hora;
      });
      return { horaInicio: min, horaFin: max };
    },
    fechaDetalle() {
      if (!this.diaSeleccionado) return "—";
      const d = this.diaSeleccionado;
      const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
      const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
      return `${dias[d.getDay()]} ${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
    },
    bloqueosDelDia() {
      if (!this.diaSeleccionado || !this.calendario) return [];
      const key = toFechaKey(this.diaSeleccionado);
      return (this.calendario.bloqueosManuales || []).filter((b) =>
        this.entrecruzaConDia(b, key)
      );
    },
    actividadesDelDia() {
      if (!this.diaSeleccionado || !this.calendario) return [];
      const key = toFechaKey(this.diaSeleccionado);
      return (this.calendario.actividades || []).filter((a) =>
        this.entrecruzaConDia(a, key)
      );
    },
  },
  mounted() {
    this.semanaInicio = this.inicioDeSemana(new Date());
    this.cargarCalendario();
  },
  methods: {
    async cargarCalendario() {
      this.cargando = true;
      this.mensajeError = "";
      try {
        const response = await calendarioService.obtenerCalendario();
        this.calendario = response.data;
        this.diaSeleccionado = new Date();
      } catch (error) {
        this.mensajeError =
          error?.response?.data?.message || "No se pudo cargar el calendario.";
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
      this.vista = "semana";
    },
    irAHoy() {
      this.semanaInicio = this.inicioDeSemana(new Date());
      this.diaSeleccionado = new Date();
      this.vista = "semana";
    },
    jornadaPorDia(diaSemana) {
      return (this.calendario?.jornada?.dias || []).find((d) => d.diaSemana === diaSemana) || null;
    },
    horaAMinutos(hora) {
      const h = hora.split(":")[0];
      const m = hora.split(":")[1];
      return parseInt(h, 10) * 60 + parseInt(m, 10);
    },
    minutosAHora(minutos) {
      const h = Math.floor(minutos / 60);
      const m = minutos % 60;
      return `${pad(h)}:${pad(m)}`;
    },
    generarSlots(horaInicio, horaFin) {
      const slots = [];
      const inicio = this.horaAMinutos(horaInicio);
      const fin = this.horaAMinutos(horaFin);
      for (let t = inicio; t < fin; t += 60) {
        const h = Math.floor(t / 60);
        const etiqueta = `${pad(h)}:00`;
        slots.push({ hora: t, etiqueta, inicio: this.minutosAHora(t), fin: this.minutosAHora(t + 60) });
      }
      return slots;
    },
    entrecruzaConDia(item, fechaKey) {
      const ini = aDate(item.fechaHoraInicio);
      const fin = aDate(item.fechaHoraFin);
      const finDia = new Date(ini.toISOString().slice(0, 10) + "T23:59:59");
      const iniDia = new Date(`${fechaKey}T00:00:00`);
      const itemIni = new Date(`${fechaKey}T00:00:00`);
      const itemFin = new Date(`${fechaKey}T23:59:59`);
      return ini < itemFin && fin > itemIni;
    },
    celdaClase(dia, slot) {
      const clases = [];
      if (!dia.laborable) {
        clases.push("calendario__celda--nolaborable");
        return clases;
      }
      const actividad = this.actividadEnSlot(dia, slot);
      const bloqueo = this.bloqueoEnSlot(dia, slot);
      if (actividad) clases.push("calendario__celda--actividad");
      else if (bloqueo) clases.push("calendario__celda--bloqueo");
      else clases.push("calendario__celda--disponible");
      if (dia.esHoy) clases.push("calendario__celda--hoy");
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
    rango(item) {
      return `${this.fechaCorta(item.fechaHoraInicio)} – ${this.horaCorta(item.fechaHoraFin)}`;
    },
    fechaCorta(dt) {
      const f = new Date(dt);
      return `${pad(f.getDate())}/${pad(f.getMonth() + 1)} ${pad(f.getHours())}:${pad(f.getMinutes())}`;
    },
    horaCorta(dt) {
      const f = new Date(dt);
      return `${pad(f.getHours())}:${pad(f.getMinutes())}`;
    },
    abrirJornada() {
      this.modalJornadaVisible = true;
    },
    abrirBloqueo() {
      this.modalBloqueoVisible = true;
    },
    onJornadaGuardada() {
      this.modalJornadaVisible = false;
      this.mensajeExito = "Jornada laboral actualizada correctamente.";
      this.mensajeError = "";
      this.cargarCalendario();
    },
    onBloqueoCreado() {
      this.modalBloqueoVisible = false;
      this.mensajeExito = "Bloqueo creado correctamente.";
      this.mensajeError = "";
      this.cargarCalendario();
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
      } catch (error) {
        this.mensajeError =
          error?.response?.data?.message || "No se pudo eliminar el bloqueo.";
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
}

/* Tabs */
.calendario__tabs {
  display: flex;
  gap: 1.5rem;
  border-bottom: 2px solid #e5e7eb;
  margin-bottom: 1.25rem;
}

.calendario__tab {
  background: none;
  border: none;
  padding: 0.6rem 0;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-muted);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: color 0.2s, border-color 0.2s;
}

.calendario__tab:hover {
  color: var(--color-text);
}

.calendario__tab--active {
  color: var(--color-text);
  font-weight: 600;
  border-bottom-color: var(--color-primary);
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
  background: var(--color-secondary);
  border: 1px solid var(--color-secondary-dark);
}

.calendario__leyenda-cuadro--bloqueo {
  background: #fee2e2;
  border: 1px solid var(--va-danger, #E11D48);
}

.calendario__leyenda-cuadro--disponible {
  background: var(--color-support);
  border: 1px solid var(--color-primary-light);
}

.calendario__leyenda-cuadro--nolaborable {
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
}

.calendario__grid {
  display: grid;
  grid-template-columns: 56px repeat(7, 1fr);
  gap: 1px;
  background: #e5e7eb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  overflow-x: auto;
  min-width: 720px;
}

.calendario__grid--dia {
  grid-template-columns: 56px 1fr;
}

.calendario__grid-corner {
  background: var(--color-surface);
}

.calendario__grid-header {
  background: var(--color-surface);
  padding: 0.5rem 0.25rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-bottom: 1px solid #e5e7eb;
}

.calendario__grid-header--hoy .calendario__grid-header-fecha {
  background: var(--color-primary);
  color: #fff;
  border-radius: 50%;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.calendario__grid-header-dia {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
}

.calendario__grid-header-fecha {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-text);
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
  background: #eaf4f4;
}

.calendario__celda--disponible:hover {
  background: #d8ebeb;
}

.calendario__celda--actividad {
  background: var(--color-secondary);
  cursor: default;
}

.calendario__celda--bloqueo {
  background: #fee2e2;
  border: 1px solid var(--va-danger, #E11D48);
}

.calendario__celda--bloqueo:hover {
  background: #fdc9c9;
}

.calendario__celda--nolaborable {
  background: #f3f4f6;
  cursor: default;
}

.calendario__celda--hoy {
  box-shadow: inset 0 0 0 2px var(--color-primary-light);
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

.calendario__capacitacion-gap {
  height: 1.5rem;
}

.calendario__detalle {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.calendario__detalle-titulo {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.calendario__detalle-grupo {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.calendario__detalle-subtitulo {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.calendario__detalle-vacio {
  font-size: 0.82rem;
  color: var(--color-text-muted);
  padding: 0.5rem;
  background: #f9fafb;
  border-radius: 6px;
}

.calendario__detalle-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.6rem 0.75rem;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.calendario__detalle-item--bloqueo {
  background: #fff5f5;
  border-color: #fecaca;
}

.calendario__detalle-item--actividad {
  background: #f3f2fa;
  border-color: var(--color-secondary);
}

.calendario__detalle-item-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.calendario__detalle-item-rango {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text);
}

.calendario__detalle-item-motivo {
  font-size: 0.78rem;
  color: var(--color-text-muted);
}

.calendario__detalle-item-eliminar {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--va-danger, #E11D48);
  padding: 0.2rem;
  display: flex;
  align-items: center;
}

.calendario__detalle-item-eliminar:hover {
  background: #fee2e2;
  border-radius: 4px;
}

.calendario__detalle-item-eliminar .material-symbols-outlined {
  font-size: 1.15rem;
}

.calendario__modal-footer {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  width: 100%;
}
</style>
