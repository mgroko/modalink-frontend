import test from "node:test";
import assert from "node:assert/strict";
import {
  coincideProfesion,
  etiquetaProfesion,
  nombreProfesionSegunGenero,
} from "../src/utils/profesion.js";

const fotografo = {
  idProfesion: 1,
  codigo: "FOTOGRAFO",
  nombre: "Fotógrafo",
  nombreFemenino: "Fotógrafa",
};

const modelo = {
  idProfesion: 2,
  codigo: "MODELO",
  nombre: "Modelo",
  nombreFemenino: "Modelo",
};

test("usa la forma femenina para MUJER", () => {
  assert.equal(nombreProfesionSegunGenero(fotografo, "MUJER"), "Fotógrafa");
  assert.equal(etiquetaProfesion(fotografo, "MUJER"), "Fotógrafa");
});

test("usa la forma canónica para HOMBRE, NO_BINARIO y NO_DECIRLO", () => {
  for (const genero of ["HOMBRE", "NO_BINARIO", "NO_DECIRLO", null, ""]) {
    assert.equal(
      nombreProfesionSegunGenero(fotografo, genero),
      "Fotógrafo",
      `género ${genero}`
    );
  }
});

test("respeta profesiones invariables", () => {
  assert.equal(nombreProfesionSegunGenero(modelo, "MUJER"), "Modelo");
});

test("coincide con el nombre canónico o femenino del catálogo", () => {
  assert.equal(coincideProfesion(fotografo, "Fotógrafo"), true);
  assert.equal(coincideProfesion(fotografo, "Fotógrafa"), true);
  assert.equal(coincideProfesion(fotografo, "fotografa"), true);
  assert.equal(coincideProfesion(fotografo, "Modelo"), false);
});
