import test from "node:test";
import assert from "node:assert/strict";

import {
  ESTADOS_POSTULACION,
  TIPOS_POSTULACION,
  clavePostulacion,
  esCupoCompleto,
  esErrorCupoCompleto,
  esErrorDisponibilidad,
  esErrorPostulacionDuplicada,
  hayCupo,
  mensajeExitoPostulacion,
  puedePostularActividad,
  puedePostularGeneral,
  proyectoAdmitePostulacionesActividad,
  textoCupo,
} from "./postulacionConstants.js";

const proyecto = (overrides = {}) => ({
  estado: "Publicado",
  esMiembro: false,
  rolUsuario: null,
  elegibleParaPostularse: true,
  ...overrides,
});

const actividad = (overrides = {}) => ({
  estado: "PENDIENTE",
  ...overrides,
});

const requerimiento = (overrides = {}) => ({
  cantidad: 2,
  cubiertos: 0,
  faltantes: 2,
  satisfecho: false,
  ...overrides,
});

const error409 = (message) => ({ response: { status: 409, data: { message } } });

test("hayCupo: sin requerimiento no hay cupo", () => {
  assert.equal(hayCupo(null), false);
  assert.equal(hayCupo(undefined), false);
});

test("hayCupo: satisfecho gana sobre faltantes", () => {
  assert.equal(hayCupo({ satisfecho: true, faltantes: 3 }), false);
});

test("hayCupo: faltantes 0 no tiene cupo", () => {
  assert.equal(hayCupo({ satisfecho: false, faltantes: 0 }), false);
});

test("hayCupo: cupo parcial sigue disponible", () => {
  assert.equal(hayCupo(requerimiento({ cubiertos: 1, faltantes: 1 })), true);
});

test("hayCupo: faltantes como string numérico", () => {
  assert.equal(hayCupo({ faltantes: "1" }), true);
  assert.equal(hayCupo({ faltantes: "0" }), false);
});

test("hayCupo: sin cubiertos/faltantes (actividades hoy) no bloquea", () => {
  assert.equal(hayCupo({ cantidad: 2 }), true);
  assert.equal(hayCupo({ faltantes: null }), true);
});

test("esCupoCompleto refleja hayCupo", () => {
  assert.equal(esCupoCompleto(null), false);
  assert.equal(esCupoCompleto({ satisfecho: true }), true);
  assert.equal(esCupoCompleto(requerimiento()), false);
});

test("puedePostularGeneral: elegible + cupo", () => {
  assert.equal(puedePostularGeneral(proyecto(), requerimiento()), true);
});

test("puedePostularGeneral: cupo completo", () => {
  assert.equal(
    puedePostularGeneral(proyecto(), requerimiento({ cubiertos: 2, faltantes: 0, satisfecho: true })),
    false
  );
});

test("puedePostularGeneral: no elegible", () => {
  assert.equal(
    puedePostularGeneral(proyecto({ elegibleParaPostularse: false }), requerimiento()),
    false
  );
});

test("puedePostularGeneral: Confirmado depende de elegibleParaPostularse", () => {
  assert.equal(
    puedePostularGeneral(proyecto({ estado: "Confirmado", elegibleParaPostularse: true }), requerimiento()),
    true
  );
});

test("proyectoAdmitePostulacionesActividad: Publicado/Confirmado", () => {
  assert.equal(proyectoAdmitePostulacionesActividad(proyecto()), true);
  assert.equal(
    proyectoAdmitePostulacionesActividad(proyecto({ estado: "Confirmado" })),
    true
  );
});

test("proyectoAdmitePostulacionesActividad: estados cerrados", () => {
  for (const estado of ["Borrador", "Finalizado", "Cancelado"]) {
    assert.equal(proyectoAdmitePostulacionesActividad(proyecto({ estado })), false);
  }
});

test("proyectoAdmitePostulacionesActividad: miembro y director", () => {
  assert.equal(
    proyectoAdmitePostulacionesActividad(
      proyecto({ esMiembro: true, rolUsuario: "MIEMBRO" })
    ),
    true
  );
  assert.equal(
    proyectoAdmitePostulacionesActividad(
      proyecto({ esMiembro: true, rolUsuario: "DIRECTOR" })
    ),
    false
  );
});

test("puedePostularActividad: matriz completa", () => {
  assert.equal(puedePostularActividad(proyecto(), actividad(), requerimiento()), true);
  assert.equal(
    puedePostularActividad(proyecto(), actividad({ estado: "EN_CURSO" }), requerimiento()),
    false
  );
  assert.equal(
    puedePostularActividad(
      proyecto(),
      actividad(),
      requerimiento({ cubiertos: 2, faltantes: 0, satisfecho: true })
    ),
    false
  );
  assert.equal(
    puedePostularActividad(
      proyecto({ esMiembro: true, rolUsuario: "DIRECTOR" }),
      actividad(),
      requerimiento()
    ),
    false
  );
});

test("puedePostularActividad: sin campos de cupo no bloquea", () => {
  assert.equal(
    puedePostularActividad(proyecto(), actividad(), { cantidad: 1 }),
    true
  );
});

test("clavePostulacion: estable y vacía sin datos", () => {
  assert.equal(clavePostulacion(TIPOS_POSTULACION.GENERAL, 30), "GENERAL:30");
  assert.equal(clavePostulacion(TIPOS_POSTULACION.ACTIVIDAD, 20), "ACTIVIDAD:20");
  assert.equal(clavePostulacion(TIPOS_POSTULACION.GENERAL, null), "");
});

test("esErrorCupoCompleto: sólo el 409 de satisfecho", () => {
  assert.equal(
    esErrorCupoCompleto(error409("El requerimiento general ya está satisfecho.")),
    true
  );
  assert.equal(
    esErrorCupoCompleto(error409("El requerimiento de actividad ya está satisfecho.")),
    true
  );
  assert.equal(
    esErrorCupoCompleto(error409("Ya existe una postulación de este perfil a este requerimiento.")),
    false
  );
  assert.equal(
    esErrorCupoCompleto(error409("No tenés disponibilidad suficiente dentro del rango factible de la actividad.")),
    false
  );
  assert.equal(esErrorCupoCompleto({ response: { status: 400, data: {} } }), false);
});

test("los otros clasificadores de error no se pisan", () => {
  const duplicada = error409("Ya existe una postulación de este perfil a este requerimiento.");
  assert.equal(esErrorPostulacionDuplicada(duplicada), true);
  assert.equal(esErrorCupoCompleto(duplicada), false);

  const disponibilidad = error409(
    "No tenés disponibilidad suficiente dentro del rango factible de la actividad."
  );
  assert.equal(esErrorDisponibilidad(disponibilidad), true);
  assert.equal(esErrorCupoCompleto(disponibilidad), false);
});

test("mensajeExitoPostulacion usa 'postulación'", () => {
  assert.match(
    mensajeExitoPostulacion(TIPOS_POSTULACION.GENERAL),
    /postulación/i
  );
  assert.equal(
    mensajeExitoPostulacion(TIPOS_POSTULACION.ACTIVIDAD, "Prueba de vestuario"),
    "Postulación enviada para la actividad 'Prueba de vestuario'."
  );
});

test("textoCupo: sólo con cantidad > 1 y cubiertos presentes", () => {
  assert.equal(textoCupo(requerimiento({ cubiertos: 1, cantidad: 2 })), "1 / 2 cubiertos");
  assert.equal(textoCupo(requerimiento({ cubiertos: 1, cantidad: 1 })), "");
  assert.equal(textoCupo({ cantidad: 2 }), "");
  assert.equal(textoCupo(null), "");
});

test("estados de postulación exportados", () => {
  assert.deepEqual(Object.values(ESTADOS_POSTULACION), [
    "PENDIENTE",
    "ACEPTADA",
    "RECHAZADA",
  ]);
});
