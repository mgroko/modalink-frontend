import test from "node:test";
import assert from "node:assert/strict";

import {
  buscarCoincidenciasError,
  crearPlantillaError,
  normalizarError,
  prepararError,
} from "../src/utils/errorMatching.js";

const catalogo = [
  { id: "1", mensaje: "El perfil no se encuentra activo." },
  {
    id: "2",
    mensaje: "La actividad 'X' no tiene integrantes activos asignados.",
  },
  { id: "3", mensaje: "El DNI debe contener únicamente dígitos numéricos." },
].map(prepararError);

test("normaliza acentos, mayúsculas y puntuación", () => {
  assert.equal(
    normalizarError("  El PERFIL no se encuentra activo.  "),
    "el perfil no se encuentra activo"
  );
});

test("encuentra una coincidencia exacta", () => {
  const resultados = buscarCoincidenciasError(
    catalogo,
    "El perfil no se encuentra activo."
  );

  assert.equal(resultados.length, 1);
  assert.equal(resultados[0].id, "1");
  assert.equal(resultados[0]._puntaje, 100);
});

test("tolera mayúsculas y acentos al comparar", () => {
  const resultados = buscarCoincidenciasError(
    catalogo,
    "EL PERFIL NO SE ENCUENTRA ACTIVO"
  );

  assert.equal(resultados[0].id, "1");
});

test("resuelve mensajes con valores dinámicos entre comillas", () => {
  const resultados = buscarCoincidenciasError(
    catalogo,
    "La actividad 'Bocetos' no tiene integrantes activos asignados."
  );

  assert.equal(resultados[0].id, "2");
  assert.equal(resultados[0]._puntaje, 85);
});

test("encuentra el mensaje dentro de una validación compuesta", () => {
  const resultados = buscarCoincidenciasError(
    catalogo,
    "Validación fallida: DNI: El DNI debe contener únicamente dígitos numéricos."
  );

  assert.equal(resultados[0].id, "3");
  assert.equal(resultados[0]._puntaje, 85);
});

test("no inventa coincidencias para mensajes desconocidos o muy cortos", () => {
  assert.deepEqual(buscarCoincidenciasError(catalogo, "error"), []);
  assert.deepEqual(
    buscarCoincidenciasError(catalogo, "Mensaje inexistente 123"),
    []
  );
});

test("no genera plantilla para mensajes demasiado genéricos", () => {
  assert.equal(crearPlantillaError("Error"), null);
});
