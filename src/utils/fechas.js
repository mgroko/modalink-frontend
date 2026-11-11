const DIAS_CORTOS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DIAS_LARGOS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const MESES_LARGOS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

const MS_POR_DIA = 86400000;

export const DIAS_REACTIVACION = 30;

function pad(n) {
  return String(n).padStart(2, "0");
}

function aPartes(valor) {
  if (valor == null || valor === "") return null;
  if (valor instanceof Date) {
    if (Number.isNaN(valor.getTime())) return null;
    return {
      anio: valor.getFullYear(),
      mes: valor.getMonth() + 1,
      dia: valor.getDate(),
      hora: valor.getHours(),
      minuto: valor.getMinutes(),
    };
  }
  const [fecha, hora = ""] = String(valor).split("T");
  const [anio, mes, dia] = fecha.split("-").map(Number);
  if (!anio || !mes || !dia) return null;
  const [horaParte, minutoParte] = hora.split(":").map(Number);
  return { anio, mes, dia, hora: horaParte || 0, minuto: minutoParte || 0 };
}

function aFecha({ anio, mes, dia, hora = 0, minuto = 0 }) {
  return new Date(anio, mes - 1, dia, hora, minuto);
}

function soloFecha({ anio, mes, dia }) {
  return new Date(anio, mes - 1, dia);
}

export function formatearFecha(valor) {
  if (valor == null || valor === "") return "—";
  const p = aPartes(valor);
  if (!p) return String(valor);
  return `${pad(p.dia)}/${pad(p.mes)}/${p.anio} ${pad(p.hora)}:${pad(p.minuto)}`;
}

/**
 * Solo la hora en formato HH:mm. Acepta una hora (`08:00`) o un ISO-8601
 * (`2026-11-02T08:00:00`) y descarta la fecha.
 * @param {string|Date|null|undefined} valor
 * @returns {string}
 */
export function formatearHora(valor) {
  if (valor == null || valor === "") return "—";
  const p = aPartes(valor);
  if (!p) return String(valor);
  return `${pad(p.hora)}:${pad(p.minuto)}`;
}

/**
 * Hora visible en la burbuja de un mensaje. Mantiene el mismo formato que
 * `formatearHora` y evita que un mensaje sin fecha muestre un guion.
 * @param {string|Date|null|undefined} valor
 * @returns {string}
 */
export function formatearHoraMensaje(valor) {
  if (valor == null || valor === "") return "";
  return formatearHora(valor);
}

export function formatearFechaCorta(valor) {
  if (valor == null || valor === "") return "—";
  const p = aPartes(valor);
  if (!p) return String(valor);
  return `${pad(p.dia)}/${pad(p.mes)}/${pad(p.anio)}`;
}

const FECHA_ISO_EN_TEXTO =
  /\b(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?)?(Z|[+-]\d{2}:?\d{2})?/g;

/**
 * Reemplaza fechas ISO (`YYYY-MM-DD` o `YYYY-MM-DDTHH:mm...`) dentro de un
 * mensaje por el formato visible `DD/MM/AAAA`. Se usa para textos que llegan
 * redactados desde el backend.
 * @param {unknown} texto
 * @returns {string}
 */
export function formatearFechasEnTexto(texto) {
  if (texto == null) return "";
  return String(texto).replace(
    FECHA_ISO_EN_TEXTO,
    (_, anio, mes, dia, hora, minuto) => {
      const fecha = `${dia}/${mes}/${anio}`;
      return hora != null && minuto != null
        ? `${fecha} ${hora}:${minuto}`
        : fecha;
    }
  );
}

/**
 * Fecha con día de semana abreviado, como en el detalle de actividad:
 * "Sáb 14/11/2026".
 * @param {string|Date|null|undefined} valor
 * @returns {string}
 */
/**
 * Antigüedad relativa para publicaciones: "hace instantes", "hace 5 min",
 * "hace 2 h", "hace 3 d". A partir de 7 días usa fecha corta.
 * @param {string|Date|null|undefined} valor
 * @returns {string}
 */
export function formatearTiempoRelativo(valor) {
  if (valor == null || valor === "") return "";
  const partes = aPartes(valor);
  if (!partes) return String(valor);

  const fecha = aFecha(partes);
  const diferencia = Date.now() - fecha.getTime();
  if (!Number.isFinite(diferencia) || diferencia < 0) return "ahora";

  const minutos = Math.floor(diferencia / 60000);
  if (minutos < 1) return "hace instantes";
  if (minutos < 60) return `hace ${minutos} min`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;

  const dias = Math.floor(horas / 24);
  if (dias === 1) return "hace 1 día";
  if (dias < 7) return `hace ${dias} días`;

  const semanas = Math.floor(dias / 7);
  if (semanas === 1) return "hace 1 semana";
  if (semanas < 4) return `hace ${semanas} semanas`;

  const meses = Math.floor(dias / 30);
  if (meses === 1) return "hace 1 mes";
  if (meses < 12) return `hace ${meses} meses`;

  return formatearFechaCorta(valor);
}

export function formatearFechaConDia(valor) {
  if (valor == null || valor === "") return "—";
  const p = aPartes(valor);
  if (!p) return String(valor);
  const dia = DIAS_CORTOS[aFecha(p).getDay()];
  return `${dia} ${pad(p.dia)}/${pad(p.mes)}/${p.anio}`;
}

/**
 * Rango horario "10:00–14:00". Si falta el fin, usa el inicio.
 * @param {string|Date|null|undefined} inicio
 * @param {string|Date|null|undefined} fin
 * @returns {string} "—" si no hay inicio válido
 */
export function formatearRangoHoras(inicio, fin) {
  const pIni = aPartes(inicio);
  if (!pIni) return "—";
  const pFin = aPartes(fin) || pIni;
  return `${pad(pIni.hora)}:${pad(pIni.minuto)}–${pad(pFin.hora)}:${pad(pFin.minuto)}`;
}

/**
 * Formato compacto usado en notificaciones: `28 oct 2026, 17:48`.
 * No interpreta la fecha como UTC: se usan las partes tal como llegan.
 */
export function formatearFechaNotificacion(valor) {
  if (valor == null || valor === "") return "";
  const p = aPartes(valor);
  if (!p) return String(valor);
  return `${p.dia} ${MESES_CORTOS[p.mes - 1]} ${p.anio}, ${pad(p.hora)}:${pad(p.minuto)}`;
}

/**
 * Fecha de una reseña, sin hora: `12 oct 2026`.
 * @param {string|Date|null|undefined} valor
 * @returns {string}
 */
export function formatearFechaResena(valor) {
  if (valor == null || valor === "") return "—";
  const p = aPartes(valor);
  if (!p) return String(valor);
  return `${p.dia} ${MESES_CORTOS[p.mes - 1]} ${p.anio}`;
}

function diasDesdeHoy(p) {
  const hoy = aPartes(new Date());
  return Math.round((soloFecha(p) - soloFecha(hoy)) / MS_POR_DIA);
}

export function formatearRangoEvento(inicio, fin) {
  const pIni = aPartes(inicio);
  if (!pIni) return "";
  const pFin = aPartes(fin) || pIni;
  const horaIni = `${pad(pIni.hora)}:${pad(pIni.minuto)}`;
  const horaFin = `${pad(pFin.hora)}:${pad(pFin.minuto)}`;
  const mismoDia = pIni.anio === pFin.anio && pIni.mes === pFin.mes && pIni.dia === pFin.dia;
  const rango = mismoDia
    ? `${horaIni} – ${horaFin}`
    : `${horaIni} – ${pad(pFin.dia)}/${pad(pFin.mes)} ${horaFin}`;
  const dias = diasDesdeHoy(pIni);
  const diaSemana = DIAS_CORTOS[aFecha(pIni).getDay()];
  if (dias === 0) return `Hoy · ${rango}`;
  if (dias === 1) return `Mañana (${diaSemana}) · ${rango}`;
  return `${diaSemana} ${pad(pIni.dia)}/${pad(pIni.mes)} · ${rango}`;
}

export function fechaLarga(valor) {
  const p = aPartes(valor);
  if (!p) return "";
  const diaSemana = DIAS_LARGOS[aFecha(p).getDay()];
  return `${diaSemana} ${p.dia} de ${MESES_LARGOS[p.mes - 1]} de ${p.anio}`;
}

/**
 * Devuelve "mes año" en español (ej. "noviembre 2026") a partir de un
 * valor ISO-8601 o Date. Retorna "" si no hay fecha válida.
 * @param {string|Date|null|undefined} valor
 * @returns {string}
 */
export function formatearMesAnio(valor) {
  const p = aPartes(valor);
  if (!p) return "";
  return `${MESES_LARGOS[p.mes - 1]} ${p.anio}`;
}

export function rangoSemana(inicio, fin) {
  const pIni = aPartes(inicio);
  const pFin = aPartes(fin);
  if (!pIni || !pFin) return "";
  if (pIni.anio === pFin.anio && pIni.mes === pFin.mes) {
    return `${pIni.dia} – ${pFin.dia} ${MESES_CORTOS[pFin.mes - 1]} ${pFin.anio}`;
  }
  return `${pIni.dia} ${MESES_CORTOS[pIni.mes - 1]} – ${pFin.dia} ${MESES_CORTOS[pFin.mes - 1]} ${pFin.anio}`;
}

export function fechaExpiracionBaja(valor, dias = DIAS_REACTIVACION) {
  const p = aPartes(valor);
  if (!p) return null;
  return new Date(p.anio, p.mes - 1, p.dia + dias, p.hora, p.minuto);
}

export function diasRestantes(fecha) {
  const p = aPartes(fecha);
  if (!p) return null;
  const restante = aFecha(p).getTime() - Date.now();
  if (restante <= 0) return null;
  return Math.ceil(restante / MS_POR_DIA);
}

/**
 * Fecha y hora local en formato ISO sin zona (`YYYY-MM-DDTHH:mm:ss`).
 * Se usa para mensajes optimistas sin desplazar la hora por UTC.
 * @param {Date} [fecha]
 * @returns {string}
 */
export function fechaHoraLocalIso(fecha = new Date()) {
  const valor = fecha instanceof Date ? fecha : new Date(fecha);
  if (Number.isNaN(valor.getTime())) return "";
  return `${valor.getFullYear()}-${pad(valor.getMonth() + 1)}-${pad(
    valor.getDate()
  )}T${pad(valor.getHours())}:${pad(valor.getMinutes())}:${pad(
    valor.getSeconds()
  )}`;
}

/**
 * Día visible en el separador del chat: `Hoy`, `Ayer`, día corto de la semana
 * o fecha completa. No interpreta la fecha como UTC.
 * @param {string|Date|null|undefined} valor
 * @returns {string}
 */
export function formatearDiaMensaje(valor) {
  if (valor == null || valor === "") return "";
  const p = aPartes(valor);
  if (!p) return String(valor);

  const dias = diasDesdeHoy(p);
  if (dias === 0) return "Hoy";
  if (dias === -1) return "Ayer";
  if (dias < 0 && dias > -7) return DIAS_CORTOS[aFecha(p).getDay()];
  return `${pad(p.dia)}/${pad(p.mes)}/${p.anio}`;
}

/**
 * Fecha compacta para la lista de conversaciones:
 * hoy → HH:mm, ayer → Ayer, esta semana → día corto, anterior → dd/mm/aaaa.
 * @param {string|Date|null|undefined} valor
 * @returns {string}
 */
export function formatearFechaListaConversacion(valor) {
  if (valor == null || valor === "") return "";
  const p = aPartes(valor);
  if (!p) return String(valor);

  const dias = diasDesdeHoy(p);
  if (dias === 0) return `${pad(p.hora)}:${pad(p.minuto)}`;
  if (dias === -1) return "Ayer";
  if (dias < 0 && dias > -7) return DIAS_CORTOS[aFecha(p).getDay()];
  return `${pad(p.dia)}/${pad(p.mes)}/${p.anio}`;
}
