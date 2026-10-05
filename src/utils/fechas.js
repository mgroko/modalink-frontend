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

export function formatearFechaCorta(valor) {
  if (valor == null || valor === "") return "—";
  const p = aPartes(valor);
  if (!p) return String(valor);
  return `${pad(p.dia)}/${pad(p.mes)}/${p.anio}`;
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

export function diasRestantesBaja(valor, dias = DIAS_REACTIVACION) {
  const expira = fechaExpiracionBaja(valor, dias);
  if (!expira) return null;
  const restante = expira.getTime() - Date.now();
  if (restante <= 0) return null;
  return Math.ceil(restante / MS_POR_DIA);
}
