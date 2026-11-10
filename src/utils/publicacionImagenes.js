import { PUBLICACION_IMAGENES } from "./publicacionConstants.js";

/*
 * Validación y manejo de imágenes de publicaciones (UC-19).
 * Espejo cliente de los límites de entrada del backend: formato, 10 MB,
 * 10 imágenes, 8000 px por lado y 24 MP.
 */

let siguienteIdImagen = 0;

function extensionDe(nombre) {
  const punto = String(nombre || "").lastIndexOf(".");
  return punto >= 0 ? String(nombre).slice(punto + 1).toLowerCase() : "";
}

function claveArchivo(archivo) {
  return `${archivo?.name}|${archivo?.size}|${archivo?.lastModified}`;
}

function esFormatoAdmitido(archivo) {
  const mime = String(archivo.type || "").toLowerCase();
  const extension = extensionDe(archivo.name);

  if (mime) {
    return (
      PUBLICACION_IMAGENES.FORMATOS.includes(mime) ||
      (mime === "application/octet-stream" &&
        PUBLICACION_IMAGENES.EXTENSIONES.includes(extension))
    );
  }

  return PUBLICACION_IMAGENES.EXTENSIONES.includes(extension);
}

/**
 * Valida formato, peso y que no esté vacío. Síncrono.
 * @param {File} archivo
 * @returns {string|null}
 */
export function validarArchivoPublicacion(archivo) {
  if (!archivo) return "Archivo inválido.";
  if (!archivo.size) return `El archivo "${archivo.name}" está vacío.`;
  if (archivo.size > PUBLICACION_IMAGENES.MAX_BYTES) {
    return `La imagen "${archivo.name}" supera los 10 MB.`;
  }
  if (!esFormatoAdmitido(archivo)) {
    return `Formato no admitido en "${archivo.name}". Elegí JPG, PNG o WEBP.`;
  }
  return null;
}

/**
 * Valida dimensiones: lado ≤ 8000 px y ≤ 24 MP.
 * @param {File} archivo
 * @returns {Promise<string|null>}
 */
export function validarDimensionesPublicacion(archivo) {
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
        ancho > PUBLICACION_IMAGENES.MAX_LADO_PX ||
        alto > PUBLICACION_IMAGENES.MAX_LADO_PX
      ) {
        terminar(
          `La imagen "${archivo.name}" supera los ${PUBLICACION_IMAGENES.MAX_LADO_PX} px por lado.`
        );
        return;
      }
      if (
        ancho * alto >
        PUBLICACION_IMAGENES.MAX_MEGAPIXELES * 1000000
      ) {
        terminar(
          `La imagen "${archivo.name}" supera los ${PUBLICACION_IMAGENES.MAX_MEGAPIXELES} megapíxeles.`
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
 * Valida un lote contra las imágenes ya retenidas.
 * @param {File[]} existentes
 * @param {File[]} nuevas
 * @returns {Promise<{validas: File[], rechazadas: {archivo: File, motivo: string}[]}>}
 */
export async function agregarImagenesPublicacion(existentes = [], nuevas = []) {
  const validas = [];
  const rechazadas = [];
  const claves = new Set(existentes.filter(Boolean).map(claveArchivo));
  let ocupadas = existentes.length;

  for (const archivo of nuevas || []) {
    const motivoFormato = validarArchivoPublicacion(archivo);
    if (motivoFormato) {
      rechazadas.push({ archivo, motivo: motivoFormato });
      continue;
    }

    const clave = claveArchivo(archivo);
    if (claves.has(clave)) {
      rechazadas.push({
        archivo,
        motivo: `La imagen "${archivo.name}" ya está en la publicación.`,
      });
      continue;
    }

    if (ocupadas >= PUBLICACION_IMAGENES.MAX_IMAGENES) {
      rechazadas.push({
        archivo,
        motivo: `Se alcanzó el máximo de ${PUBLICACION_IMAGENES.MAX_IMAGENES} imágenes.`,
      });
      continue;
    }

    const motivoDimensiones = await validarDimensionesPublicacion(archivo);
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
 * @param {File} archivo
 * @returns {{id:number, nombre:string, archivo:File, preview:string}}
 */
export function crearItemImagenPublicacion(archivo) {
  siguienteIdImagen += 1;
  return {
    id: siguienteIdImagen,
    nombre: archivo.name,
    archivo,
    preview: URL.createObjectURL(archivo),
  };
}

/**
 * @param {{preview?:string}[]} items
 */
export function revocarPreviewsPublicacion(items = []) {
  for (const item of items) {
    if (item?.preview) URL.revokeObjectURL(item.preview);
  }
}
