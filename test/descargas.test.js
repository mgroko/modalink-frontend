import test from "node:test";
import assert from "node:assert/strict";

import {
  mensajeErrorDescarga,
  nombreDesdeContentDisposition,
} from "../src/utils/descargas.js";

test("extrae el nombre de un Content-Disposition simple", () => {
  assert.equal(
    nombreDesdeContentDisposition('attachment; filename="contrato-5.pdf"'),
    "contrato-5.pdf"
  );
});

test("extrae y decodifica un filename UTF-8", () => {
  assert.equal(
    nombreDesdeContentDisposition(
      "attachment; filename*=UTF-8''contrato%20con%20espacios.pdf"
    ),
    "contrato con espacios.pdf"
  );
});

test("devuelve vacío si no hay Content-Disposition", () => {
  assert.equal(nombreDesdeContentDisposition(null), "");
  assert.equal(nombreDesdeContentDisposition(""), "");
});

test("lee el message del JSON cuando el error llega como Blob", async () => {
  const error = {
    response: {
      data: new Blob([JSON.stringify({ message: "Sin acceso al contrato." })], {
        type: "application/json",
      }),
    },
  };

  assert.equal(
    await mensajeErrorDescarga(error, "Fallback"),
    "Sin acceso al contrato."
  );
});

test("usa el fallback cuando el Blob no es JSON", async () => {
  const error = {
    response: {
      data: new Blob(["<html>error</html>"], { type: "text/html" }),
    },
  };

  assert.equal(await mensajeErrorDescarga(error, "Fallback"), "Fallback");
});
