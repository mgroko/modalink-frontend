const HORAS_RE = /^(\d{2}):(\d{2})(?::(\d{2}))?$/;

export function horaCorta(hora) {
  if (!hora) return "";
  const match = HORAS_RE.exec(String(hora));
  if (!match) return String(hora).slice(0, 5);
  return `${match[1]}:${match[2]}`;
}

export function normalizarHoraEnvio(hora) {
  if (!hora) return null;
  const match = HORAS_RE.exec(String(hora));
  if (!match) return hora;
  return `${match[1]}:${match[2]}:${match[3] || "00"}`;
}

export function aMinutos(hora) {
  const corta = horaCorta(hora);
  if (!corta) return 0;
  const [h, m] = corta.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

export function aHora(minutos) {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
