import { esNumerico, esEnumerado } from "./proyectoConstants.js";

/*
 * Validaciones de cruce del formulario Crear Proyecto (UC-24).
 * Van más allá de las `:rules` por campo: comparan campos entre sí y
 * contra el catálogo de características de la profesión seleccionada.
 * Todas las funciones son puras: el caller (vista) aporta el estado.
 */

export const RAICES_FORM_PROYECTO = [
  "nombre",
  "descripcion",
  "privacidad",
  "fechaInicio",
  "fechaFinEstipulada",
  "aceptaPostulacionGral",
  "ubicacion",
  "objetivos",
  "requerimientosGral",
  "moodboard",
];

function presente(v) {
  return v !== null && v !== undefined && v !== "";
}

/**
 * fechaFinEstipulada ≥ fechaInicio (comparación directa: ambos "YYYY-MM-DD").
 * @returns {{fechaFinEstipulada?: string}} errores por campo (vacío si OK)
 */
export function validarFechasProyecto(fechaInicio, fechaFinEstipulada) {
  if (presente(fechaInicio) && presente(fechaFinEstipulada) && fechaFinEstipulada < fechaInicio) {
    return { fechaFinEstipulada: "La fecha de fin no puede ser anterior a la fecha de inicio." };
  }
  return {};
}

/**
 * Reglas de una característica dentro de un requerimiento, según su tipoDato
 * (matriz UC-24 §3):
 * - NUMERICO → valorMin/valorMax obligatorios, ≥ 0 y min ≤ max.
 * - No-NUMERICO → valorMin/valorMax deben ser null/vacíos.
 * - ENUMERADO → ≥ 1 valor existente y perteneciente a la característica.
 * - No-ENUMERADO → valores[] vacío.
 * @param {object} caracForm estado del formulario de la característica
 * @param {object} catalogo CaracteristicaTecnica del catálogo de la profesión
 *        (tipoDato, valores[]); null si no pertenece a la profesión
 * @returns {string|null} mensaje de error o null si es válida
 */
export function validarCaracteristicaRequerimiento(caracForm, catalogo) {
  if (!catalogo) {
    return "La característica no pertenece a la profesión seleccionada.";
  }

  const tipo = String(catalogo.tipoDato || "").toUpperCase();

  if (esNumerico(tipo)) {
    const msg = validarRangoNumerico(caracForm);
    if (msg) return msg;
  } else if (presente(caracForm.valorMin) || presente(caracForm.valorMax)) {
    return "El rango de valores sólo aplica a características numéricas.";
  }

  if (esEnumerado(tipo)) {
    const msg = validarValoresEnumerados(caracForm, catalogo);
    if (msg) return msg;
  } else if (Array.isArray(caracForm.valores) && caracForm.valores.length > 0) {
    return "Esta característica no admite valores de catálogo.";
  }

  return null;
}

function validarRangoNumerico(caracForm) {
  if (!presente(caracForm.valorMin) || !presente(caracForm.valorMax)) {
    return "Las características numéricas requieren informar el valor mínimo y el máximo.";
  }
  const min = Number(caracForm.valorMin);
  const max = Number(caracForm.valorMax);
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return "El rango debe ser numérico.";
  }
  if (min < 0 || max < 0) {
    return "El rango no puede contener valores negativos.";
  }
  if (min > max) {
    return "El valor mínimo no puede ser mayor que el máximo.";
  }
  return null;
}

function validarValoresEnumerados(caracForm, catalogo) {
  const valores = Array.isArray(caracForm.valores) ? caracForm.valores : [];
  if (valores.length === 0) {
    return "Seleccioná al menos un valor de la característica.";
  }
  const validos = new Set((catalogo.valores || []).map((v) => v.idValor));
  if (valores.some((id) => !validos.has(id))) {
    return "Uno de los valores seleccionados no pertenece a la característica.";
  }
  return null;
}

/**
 * Un requerimiento completo: cantidad > 0, profesión presente y
 * características sin duplicados y coherentes con su tipoDato.
 * @param {object} requerimiento estado del formulario
 * @param {object[]} caracteristicasDeProfesion catálogo de la profesión elegida
 *        (GET /profesiones/{id}/caracteristicas-tecnicas); el caller debe
 *        garantizar que está cargado antes de validar
 * @returns {{campos: Object<string,string>, seccion: string[]}}
 *          `campos` usa claves relativas p. ej. "caracteristicas.1.valorMin";
 *          `seccion` acumula mensajes para mostrarlos bajo la sección
 */
export function validarRequerimiento(requerimiento, caracteristicasDeProfesion) {
  const campos = {};
  const seccion = [];

  if (!presente(requerimiento.cantidad) || Number(requerimiento.cantidad) <= 0) {
    campos.cantidad = "La cantidad debe ser mayor a 0.";
    seccion.push("Cada requerimiento necesita una cantidad mayor a 0.");
  }
  if (!requerimiento.idProfesion) {
    campos.idProfesion = "Seleccioná una profesión.";
  }

  const catalogoPorId = new Map(
    (caracteristicasDeProfesion || []).map((c) => [c.idCaracteristica, c])
  );
  const vistas = new Set();

  (requerimiento.caracteristicas || []).forEach((carac, i) => {
    if (vistas.has(carac.idCaracteristica)) {
      campos[`caracteristicas.${i}`] = "No podés repetir la misma característica.";
      seccion.push("Una característica está repetida dentro del requerimiento.");
      return;
    }
    vistas.add(carac.idCaracteristica);

    const catalogo = catalogoPorId.get(carac.idCaracteristica);
    const msg = validarCaracteristicaRequerimiento(carac, catalogo);
    if (msg) {
      campos[`caracteristicas.${i}`] = msg;
      seccion.push(msg);
    }
  });

  return { campos, seccion };
}

/**
 * Validación de cruce completa antes del submit.
 * @param {object} form estado del formulario
 * @param {Object<number, object[]>} catalogosPorProfesion
 *        { [idProfesion]: CaracteristicaTecnica[] } cargado por la vista
 * @returns {{campos: Object<string,string>, secciones: Object<string,string[]>}}
 *          `campos` con claves planas ("fechaFinEstipulada",
 *          "requerimientosGral.0.caracteristicas.1") listas para resaltar;
 *          `secciones` agrupa mensajes por sección ("requerimientosGral")
 */
export function validarProyecto(form, catalogosPorProfesion = {}) {
  const campos = {};
  const secciones = {};

  Object.assign(campos, validarFechasProyecto(form.fechaInicio, form.fechaFinEstipulada));

  const mensajesRequerimiento = [];
  (form.requerimientosGral || []).forEach((req, i) => {
    const { campos: camposReq, seccion } = validarRequerimiento(
      req,
      catalogosPorProfesion[req.idProfesion]
    );
    for (const [clave, msg] of Object.entries(camposReq)) {
      campos[`requerimientosGral.${i}.${clave}`] = msg;
    }
    mensajesRequerimiento.push(...seccion);
  });
  if (mensajesRequerimiento.length > 0) {
    secciones.requerimientosGral = [...new Set(mensajesRequerimiento)];
  }

  return { campos, secciones };
}

/** Mensajes de error de una sección con prefijo dado ("requerimientosGral.0."). */
export function erroresConPrefijo(campos, prefijo) {
  return Object.entries(campos)
    .filter(([clave]) => clave.startsWith(prefijo))
    .map(([, msg]) => msg);
}

/**
 * Normaliza las claves del body `errores` de un 400
 * (MethodArgumentNotValidException): "requerimientosGral[0].cantidad" →
 * "requerimientosGral.0.cantidad".
 */
export function normalizarClaveCampo(clave) {
  return String(clave || "")
    .replace(/\[(\d+)\]/g, ".$1")
    .replace(/^\.+/, "");
}

/**
 * Mapea `data.errores` de un 400 a un objeto plano { claveNormalizada: msg }.
 * @param {object} errores body.errores del backend
 * @returns {Object<string,string>} vacío si no hay errores de campo
 */
export function mapearErroresBackend(errores) {
  if (!errores || typeof errores !== "object") return {};
  const mapeados = {};
  for (const [clave, mensaje] of Object.entries(errores)) {
    if (mensaje) mapeados[normalizarClaveCampo(clave)] = mensaje;
  }
  return mapeados;
}

/** true si la clave corresponde a un control del formulario (inline). */
export function raizConocida(clave) {
  const raiz = String(clave || "").split(".")[0];
  return RAICES_FORM_PROYECTO.includes(raiz);
}
