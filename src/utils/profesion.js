import { normTexto } from "./perfilConstants.js";

/**
 * Devuelve true cuando el código de género corresponde a una mujer.
 * @param {string|null|undefined} genero
 */
export function esGeneroFemenino(genero) {
  return String(genero || "").trim().toUpperCase() === "MUJER";
}

/**
 * Nombre de la profesión según el género de la persona.
 * Para HOMBRE, NO_BINARIO, NO_DECIRLO o sin género se usa el nombre canónico.
 *
 * @param {{nombre?: string, nombreFemenino?: string|null}|string|null|undefined} profesion
 * @param {string|null|undefined} genero
 * @returns {string}
 */
export function nombreProfesionSegunGenero(profesion, genero) {
  if (typeof profesion === "string") return profesion;
  if (!profesion) return "";

  if (esGeneroFemenino(genero) && profesion.nombreFemenino) {
    return profesion.nombreFemenino;
  }
  return profesion.nombre || "";
}

/**
 * Igual que {@link nombreProfesionSegunGenero}, con la primera letra en
 * mayúscula para mostrarla en la interfaz.
 *
 * @param {{nombre?: string, nombreFemenino?: string|null}|string|null|undefined} profesion
 * @param {string|null|undefined} genero
 * @returns {string}
 */
export function etiquetaProfesion(profesion, genero) {
  const texto = nombreProfesionSegunGenero(profesion, genero).trim();
  if (!texto) return "";
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/**
 * Compara el nombre visible de una profesión contra la forma canónica o la
 * femenina del catálogo. Sirve para resolver el id cuando la API devuelve
 * "Fotógrafa" pero el catálogo tiene "Fotógrafo".
 *
 * @param {{nombre?: string, nombreFemenino?: string|null}|null|undefined} profesion
 * @param {string|null|undefined} nombre
 * @returns {boolean}
 */
export function coincideProfesion(profesion, nombre) {
  if (!profesion || !nombre) return false;
  const objetivo = normTexto(nombre);
  return [profesion.nombre, profesion.nombreFemenino]
    .filter(Boolean)
    .some((candidato) => normTexto(candidato) === objetivo);
}
