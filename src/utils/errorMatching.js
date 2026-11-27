const MAX_COINCIDENCIAS = 3;
const UMBRAL = 60;
const SENTINEL = "qqwildcardqq";

export function normalizarError(valor) {
  if (!valor) return "";
  return String(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escaparRegex(texto) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function crearPlantillaError(mensaje) {
  let trabajo = String(mensaje || "");
  trabajo = trabajo.replace(/['"“”«»][^'"“”«»]*['"“”«»]/g, ` ${SENTINEL} `);
  trabajo = trabajo.replace(/\b[XxNn]\b/g, ` ${SENTINEL} `);
  trabajo = trabajo.replace(/(?:…|\.\.\.)/g, ` ${SENTINEL} `);

  const normalizado = normalizarError(trabajo);
  const estatico = normalizado
    .replaceAll(SENTINEL, "")
    .replace(/\s+/g, " ")
    .trim();

  if (estatico.length < 12) return null;

  const escapado = escaparRegex(normalizado).replaceAll(SENTINEL, ".*");
  return new RegExp(escapado, "i");
}

export function prepararError(entrada) {
  return {
    ...entrada,
    _normalizado: normalizarError(entrada.mensaje),
    _plantilla: crearPlantillaError(entrada.mensaje),
  };
}

export function buscarCoincidenciasError(
  catalogo,
  mensaje,
  { max = MAX_COINCIDENCIAS, umbral = UMBRAL } = {}
) {
  const consulta = normalizarError(mensaje);
  if (consulta.length < 10) return [];

  const candidatos = [];

  for (const entrada of catalogo || []) {
    let puntaje = 0;

    if (consulta === entrada._normalizado) {
      puntaje = 100;
    } else if (entrada._plantilla && entrada._plantilla.test(consulta)) {
      puntaje = 85;
    } else if (
      consulta.length >= 15 &&
      (consulta.includes(entrada._normalizado) ||
        entrada._normalizado.includes(consulta))
    ) {
      puntaje = 65;
    }

    if (puntaje > 0) {
      candidatos.push({ ...entrada, _puntaje: puntaje });
    }
  }

  return candidatos
    .sort((a, b) => {
      if (b._puntaje !== a._puntaje) return b._puntaje - a._puntaje;
      return b._normalizado.length - a._normalizado.length;
    })
    .slice(0, max)
    .filter((candidato) => candidato._puntaje >= umbral);
}
