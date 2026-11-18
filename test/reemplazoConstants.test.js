import test from "node:test";
import assert from "node:assert/strict";

import {
  ordenarCandidatosPorConcordanciaReemplazo,
  puntajeNumericoReemplazo,
} from "../src/utils/reemplazoConstants.js";

const candidato = (id, puntaje, faltantes = []) => ({
  idCandidato: id,
  puntaje,
  faltantes,
});

test("ordena candidatos por concordancia descendente", () => {
  const ordenados = ordenarCandidatosPorConcordanciaReemplazo([
    candidato(1, 0),
    candidato(2, 66.7),
    candidato(3, 100),
  ]);

  assert.deepEqual(
    ordenados.map((c) => c.idCandidato),
    [3, 2, 1]
  );
});

test("deja al final los candidatos sin puntaje", () => {
  const ordenados = ordenarCandidatosPorConcordanciaReemplazo([
    candidato(1, null),
    candidato(2, 40),
    candidato(3, ""),
    candidato(4, 100),
  ]);

  assert.deepEqual(
    ordenados.map((c) => c.idCandidato),
    [4, 2, 1, 3]
  );
});

test("en empate prioriza al que tiene menos faltantes", () => {
  const ordenados = ordenarCandidatosPorConcordanciaReemplazo([
    candidato(1, 80, ["Habilidad faltante: Maquillaje"]),
    candidato(2, 80),
    candidato(3, 100),
  ]);

  assert.deepEqual(
    ordenados.map((c) => c.idCandidato),
    [3, 2, 1]
  );
});

test("no muta la lista original", () => {
  const original = [candidato(1, 10), candidato(2, 90)];
  ordenarCandidatosPorConcordanciaReemplazo(original);

  assert.deepEqual(
    original.map((c) => c.idCandidato),
    [1, 2]
  );
});

test("normaliza el puntaje al rango 0..100", () => {
  assert.equal(puntajeNumericoReemplazo({ puntaje: 150 }), 100);
  assert.equal(puntajeNumericoReemplazo({ puntaje: -10 }), 0);
  assert.equal(puntajeNumericoReemplazo({ puntaje: "abc" }), null);
});
