import test from "node:test";
import assert from "node:assert/strict";

import {
  agruparEnPaginas,
  etiquetaPolaroid,
  formatearValorCaracteristica,
  formatearValorRequerido,
  textoCumplimiento,
  textoCupo,
  textoFaltantes,
} from "../src/utils/castingConstants.js";

test("formatea un cupo con los lugares faltantes", () => {
  assert.equal(
    textoCupo({ cantidad: 2, cubiertos: 1, faltantes: 1, satisfecho: false }),
    "1 de 2 cubiertos · falta 1 lugar"
  );
  assert.equal(
    textoFaltantes({ cantidad: 2, cubiertos: 2, faltantes: 0, satisfecho: true }),
    "Cupo completo"
  );
});

test("formatea valores numéricos con unidad y enumera valores pedidos", () => {
  assert.equal(
    formatearValorCaracteristica({ valor: "172", unidad: "cm" }),
    "172 cm"
  );
  assert.equal(
    formatearValorCaracteristica({ valor: null, etiqueta: "Castaño" }),
    "Castaño"
  );
  assert.equal(
    formatearValorRequerido({
      tipoDato: "NUMERICO",
      valorMin: 170,
      valorMax: 178,
      unidad: "cm",
    }),
    "170 – 178 cm"
  );
  assert.equal(
    formatearValorRequerido({
      tipoDato: "ENUMERADO",
      valores: [{ etiqueta: "Castaño" }, { etiqueta: "Negro" }],
    }),
    "Castaño o Negro"
  );
});

test("etiqueta las polaroids prioritarias por código", () => {
  assert.equal(
    etiquetaPolaroid({ tipo: { codigo: "PRIMER_PLANO_FRENTE" } }),
    "Frente"
  );
  assert.equal(
    etiquetaPolaroid({ tipo: { codigo: "PRIMER_PLANO_PERFIL" } }),
    "Perfil"
  );
  assert.equal(
    etiquetaPolaroid({ tipo: { codigo: "CUERPO_COMPLETO_ESPALDAS" } }),
    "Cuerpo entero"
  );
});

test("agrupa polaroids de tres en tres sin placeholders", () => {
  const paginas = agruparEnPaginas([1, 2, 3, 4], 3);
  assert.deepEqual(paginas, [[1, 2, 3], [4]]);
  assert.deepEqual(agruparEnPaginas([], 3), []);
});

test("resume el cumplimiento y tolera requerimientos vacíos", () => {
  assert.equal(
    textoCumplimiento({
      requisitosCumplidos: 2,
      requisitosEvaluados: 3,
    }),
    "2 de 3"
  );
  assert.equal(textoCumplimiento({ requisitosCumplidos: 0, requisitosEvaluados: 0 }), "Sin requisitos");
});
