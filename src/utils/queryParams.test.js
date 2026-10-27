import test from "node:test";
import assert from "node:assert/strict";

import { serializarParams } from "./queryParams.js";

test("serializarParams: omite undefined, null y vacíos", () => {
  assert.equal(
    serializarParams({ a: undefined, b: null, c: "", d: 0, e: false }),
    "d=0&e=false"
  );
});

test("serializarParams: claves repetidas para arrays", () => {
  assert.equal(
    serializarParams({ estado: ["PENDIENTE", "ACEPTADA"], page: 0 }),
    "estado=PENDIENTE&estado=ACEPTADA&page=0"
  );
});

test("serializarParams: arrays con huecos", () => {
  assert.equal(
    serializarParams({ estado: ["PENDIENTE", null, "", undefined] }),
    "estado=PENDIENTE"
  );
});

test("serializarParams: escapa caracteres especiales", () => {
  assert.equal(
    serializarParams({ nombrePerfil: "Luna María" }),
    "nombrePerfil=Luna+Mar%C3%ADa"
  );
});
