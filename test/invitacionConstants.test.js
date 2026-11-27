import test from "node:test";
import assert from "node:assert/strict";

import {
  ETIQUETAS_TIPO_INVITACION,
  TIPOS_ERROR_INVITACION,
  TIPOS_INVITACION,
  clasificarErrorInvitacion,
  normalizarRequerimientoGeneral,
  requerimientoGeneralDisponible,
} from "../src/utils/invitacionConstants.js";

test("el tipo de invitación a requerimiento general tiene etiqueta", () => {
  assert.equal(
    ETIQUETAS_TIPO_INVITACION[TIPOS_INVITACION.REQUERIMIENTO_GENERAL],
    "Requerimiento general"
  );
});

test("sólo los requerimientos generales con cupo disponible admiten invitación", () => {
  assert.equal(
    requerimientoGeneralDisponible({
      idRequerimientoGral: 1,
      satisfecho: false,
      faltantes: 1,
    }),
    true
  );
  assert.equal(
    requerimientoGeneralDisponible({
      idRequerimientoGral: 1,
      satisfecho: true,
      faltantes: 0,
    }),
    false
  );
  assert.equal(
    requerimientoGeneralDisponible({
      idRequerimientoGral: 1,
      satisfecho: false,
      faltantes: 0,
    }),
    false
  );
  assert.equal(requerimientoGeneralDisponible(null), false);
});

test("normaliza los campos del requerimiento general del proyecto", () => {
  const requerimiento = normalizarRequerimientoGeneral({
    idRequerimientoGral: 12,
    cantidad: "2",
    descripcion: "  Modelo principal  ",
    idProfesion: 4,
    nombreProfesion: "Modelo",
    cubiertos: "1",
    faltantes: "1",
    satisfecho: false,
    protegido: false,
  });

  assert.deepEqual(requerimiento, {
    idRequerimientoGral: 12,
    cantidad: 2,
    descripcion: "Modelo principal",
    idProfesion: 4,
    nombreProfesion: "Modelo",
    cubiertos: 1,
    faltantes: 1,
    satisfecho: false,
    protegido: false,
  });
});

test("los errores de requerimiento general se asocian a idRequerimientoGral", () => {
  const error = {
    response: {
      status: 400,
      data: {
        message: "El requerimiento general es obligatorio.",
      },
    },
  };

  const clasificacion = clasificarErrorInvitacion(error);
  assert.equal(clasificacion.tipo, TIPOS_ERROR_INVITACION.VALIDACION);
  assert.equal(clasificacion.campo, "idRequerimientoGral");
});

test("los errores de requerimiento de actividad se asocian a idRequerimientoActividad", () => {
  const error = {
    response: {
      status: 400,
      data: {
        message: "El requerimiento de actividad es obligatorio.",
      },
    },
  };

  const clasificacion = clasificarErrorInvitacion(error);
  assert.equal(clasificacion.tipo, TIPOS_ERROR_INVITACION.VALIDACION);
  assert.equal(clasificacion.campo, "idRequerimientoActividad");
});
