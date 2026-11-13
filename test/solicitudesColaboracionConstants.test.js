import test from "node:test";
import assert from "node:assert/strict";

import { perfilesPropiosDisponibles } from "../src/utils/solicitudesColaboracionConstants.js";

test("filtra perfiles propios disponibles para autocolaborar", () => {
  const publicacion = {
    colaboradores: [{ idPerfil: 3 }],
  };
  const perfiles = [
    { idPerfil: 1, estado: "Activo" },
    { idPerfil: 2, estado: "PendienteBaja" },
    { idPerfil: 3, estado: "Activo" },
    { idPerfil: 4, estado: "Activo" },
  ];

  const resultado = perfilesPropiosDisponibles(publicacion, perfiles, 1);

  assert.deepEqual(
    resultado.map((perfil) => perfil.idPerfil),
    [4]
  );
});

test("tolera publicaciones sin colaboradores y perfiles sin estado", () => {
  const resultado = perfilesPropiosDisponibles(
    null,
    [{ idPerfil: 7 }],
    1
  );

  assert.deepEqual(
    resultado.map((perfil) => perfil.idPerfil),
    [7]
  );
});
