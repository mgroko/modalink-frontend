import { MOODBOARD_IMAGENES } from "./proyectoConstants.js";

/*
 * Validación y manejo de las imágenes del moodboard (ficha UC-24 §7).
 * Espejo cliente de los límites del backend (formato, 10 MB, 10 imágenes,
 * dimensiones): los archivos se retienen en el wizard como previews locales
 * y sólo salen en Finalizar vía POST /proyectos/{id}/moodboard/imagenes.
 * Funciones puras salvo la lectura de dimensiones, que decodifica el archivo.
 */

let siguienteIdImagen = 0;

function extensionDe(nombre) {
  const punto = String(nombre || "").lastIndexOf(".");
  return punto >= 0 ? String(nombre).slice(punto + 1).toLowerCase() : "";
}

/** Clave de identidad de un archivo para detectar duplicados (name+size+lastModified). */
function claveArchivo(archivo) {
  return `${archivo?.name}|${archivo?.size}|${archivo?.lastModified}`;
}

function esFormatoAdmitido(archivo) {
  const mime = String(archivo.type || "").toLowerCase();
  const extension = extensionDe(archivo.name);
  if (mime) {
    return (
      MOODBOARD_IMAGENES.FORMATOS.includes(mime) ||
      (mime === "application/octet-stream" &&
        MOODBOARD_IMAGENES.EXTENSIONES.includes(extension))
    );
  }
  return MOODBOARD_IMAGENES.EXTENSIONES.includes(extension);
}

/**
 * Valida formato, peso y que no esté vacío (§7.2). Síncrono.
 * @param {File} archivo
 * @returns {string|null} motivo de rechazo o null si es válido
 */
export function validarArchivoImagen(archivo) {
  if (!archivo) return "Archivo inválido.";
  if (!archivo.size) return `El archivo "${archivo.name}" está vacío.`;
  if (archivo.size > MOODBOARD_IMAGENES.MAX_BYTES) {
    return `La imagen "${archivo.name}" supera los 10 MB.`;
  }
  if (!esFormatoAdmitido(archivo)) {
    return `Formato no admitido en "${archivo.name}". Elegí JPG, PNG o WEBP.`;
  }
  return null;
}

/**
 * Valida dimensiones decodificando el archivo (§7.4
 * DimensionesImagenExcedidasException): lado ≤ 8000 px y ≤ 24 megapíxeles.
 * @param {File} archivo
 * @returns {Promise<string|null>} motivo de rechazo o null si es válido
 */
export function validarDimensionesImagen(archivo) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(archivo);
    const imagen = new Image();

    const terminar = (motivo) => {
      URL.revokeObjectURL(url);
      resolve(motivo);
    };

    imagen.onload = () => {
      const ancho = imagen.naturalWidth;
      const alto = imagen.naturalHeight;
      if (!ancho || !alto) {
        terminar(`No se pudo leer la imagen "${archivo.name}".`);
        return;
      }
      if (
        ancho > MOODBOARD_IMAGENES.MAX_LADO_PX ||
        alto > MOODBOARD_IMAGENES.MAX_LADO_PX
      ) {
        terminar(
          `La imagen "${archivo.name}" supera los ${MOODBOARD_IMAGENES.MAX_LADO_PX} px por lado.`
        );
        return;
      }
      if (ancho * alto > MOODBOARD_IMAGENES.MAX_MEGAPIXELES * 1000000) {
        terminar(
          `La imagen "${archivo.name}" supera los ${MOODBOARD_IMAGENES.MAX_MEGAPIXELES} megapíxeles.`
        );
        return;
      }
      terminar(null);
    };

    imagen.onerror = () =>
      terminar(`No se pudo leer la imagen "${archivo.name}".`);
    imagen.src = url;
  });
}

/**
 * Valida un lote contra los archivos ya presentes: formato/peso, duplicados,
 * cupo de 10 y dimensiones (§7.5.2). El orden evita decodificar archivos que
 * igual se descartarían.
 * @param {File[]} existentes archivos ya en el moodboard
 * @param {File[]} nuevas archivos del dropzone
 * @returns {Promise<{validas: File[], rechazadas: {archivo: File, motivo: string}[]}>}
 */
export async function agregarImagenesMoodboard(existentes = [], nuevas = []) {
  const validas = [];
  const rechazadas = [];
  const claves = new Set(existentes.filter(Boolean).map(claveArchivo));
  let ocupadas = existentes.length;

  for (const archivo of nuevas || []) {
    const motivoFormato = validarArchivoImagen(archivo);
    if (motivoFormato) {
      rechazadas.push({ archivo, motivo: motivoFormato });
      continue;
    }
    const clave = claveArchivo(archivo);
    if (claves.has(clave)) {
      rechazadas.push({
        archivo,
        motivo: `La imagen "${archivo.name}" ya está en el moodboard.`,
      });
      continue;
    }
    if (ocupadas >= MOODBOARD_IMAGENES.MAX_IMAGENES) {
      rechazadas.push({
        archivo,
        motivo: `Se alcanzó el máximo de ${MOODBOARD_IMAGENES.MAX_IMAGENES} imágenes.`,
      });
      continue;
    }
    const motivoDimensiones = await validarDimensionesImagen(archivo);
    if (motivoDimensiones) {
      rechazadas.push({ archivo, motivo: motivoDimensiones });
      continue;
    }
    claves.add(clave);
    ocupadas += 1;
    validas.push(archivo);
  }

  return { validas, rechazadas };
}

/**
 * Crea el item de preview retenido en el wizard: el archivo no sale del
 * cliente hasta Finalizar (§7.5.1).
 * @param {File} archivo
 * @returns {{id: number, nombre: string, archivo: File, preview: string}}
 */
export function crearItemImagen(archivo) {
  siguienteIdImagen += 1;
  return {
    id: siguienteIdImagen,
    nombre: archivo.name,
    archivo,
    preview: URL.createObjectURL(archivo),
  };
}

/**
 * Libera los object URLs de las previews (al reiniciar el formulario o
 * desmontar la vista) para no filtrar memoria.
 * @param {{preview?: string}[]} items
 */
export function revocarPreviews(items = []) {
  for (const item of items) {
    if (item?.preview) URL.revokeObjectURL(item.preview);
  }
}
