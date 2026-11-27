import test from "node:test";
import assert from "node:assert/strict";

import { destinoInicial } from "../src/utils/navegacion.js";

test("sin sesión redirige al login", () => {
  assert.deepEqual(destinoInicial(null), { name: "login" });
  assert.deepEqual(destinoInicial(undefined), { name: "login" });
});

test("un administrador va al dashboard administrativo", () => {
  assert.deepEqual(
    destinoInicial({ rolGlobal: "Administrador", idPerfilActivo: null }),
    { name: "dashboard-admin" }
  );
});

test("un usuario con perfil activo va al home", () => {
  assert.deepEqual(
    destinoInicial({ rolGlobal: "Usuario", idPerfilActivo: 7 }),
    { name: "home" }
  );
});

test("un usuario sin perfil activo va al dashboard de usuario", () => {
  assert.deepEqual(
    destinoInicial({ rolGlobal: "Usuario", idPerfilActivo: null }),
    { name: "dashboard-usuario" }
  );
});
