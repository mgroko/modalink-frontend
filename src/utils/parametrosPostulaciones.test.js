import test from "node:test";
import assert from "node:assert/strict";

import {
  OPCIONES_TAMANO,
  TAMANO_POR_DEFECTO,
  construirParamsPostulaciones,
  validarRangoFechas,
} from "./parametrosPostulaciones.js";

test("validarRangoFechas: sin fechas o rango válido", () => {
  assert.equal(validarRangoFechas("", ""), "");
  assert.equal(validarRangoFechas("2026-10-01", ""), "");
  assert.equal(validarRangoFechas("2026-10-01", "2026-10-01"), "");
  assert.equal(validarRangoFechas("2026-10-01", "2026-10-31"), "");
});

test("validarRangoFechas: desde posterior a hasta", () => {
  assert.equal(
    validarRangoFechas("2026-10-31", "2026-10-01"),
    "La fecha desde no puede ser posterior a la fecha hasta."
  );
});

test("construirParamsPostulaciones: filtros completos", () => {
  assert.deepEqual(
    construirParamsPostulaciones({
      estado: "PENDIENTE",
      tipo: "ACTIVIDAD",
      nombrePerfil: "  Luna  ",
      idProfesion: 2,
      fechaDesde: "2026-10-01",
      fechaHasta: "2026-10-31",
      pagina: 3,
      tamano: 50,
    }),
    {
      estado: "PENDIENTE",
      tipo: "ACTIVIDAD",
      nombrePerfil: "Luna",
      idProfesion: 2,
      fechaDesde: "2026-10-01",
      fechaHasta: "2026-10-31",
      page: 3,
      size: 50,
    }
  );
});

test("construirParamsPostulaciones: filtros vacíos usan defaults", () => {
  assert.deepEqual(construirParamsPostulaciones(), {
    page: 0,
    size: TAMANO_POR_DEFECTO,
  });
  assert.deepEqual(
    construirParamsPostulaciones({ estado: "", tipo: "", nombrePerfil: "   " }),
    { page: 0, size: TAMANO_POR_DEFECTO }
  );
});

test("construirParamsPostulaciones: 'Ver todas' usa todos=true", () => {
  assert.deepEqual(construirParamsPostulaciones({ tamano: 0 }), { todos: true });
  assert.deepEqual(
    construirParamsPostulaciones({ estado: "ACEPTADA", tamano: 0, pagina: 5 }),
    { estado: "ACEPTADA", todos: true }
  );
});

test("construirParamsPostulaciones: estado repetible", () => {
  assert.deepEqual(
    construirParamsPostulaciones({ estado: ["PENDIENTE", "ACEPTADA"] }),
    { estado: ["PENDIENTE", "ACEPTADA"], page: 0, size: TAMANO_POR_DEFECTO }
  );
});

test("construirParamsPostulaciones: idProfesion vacío se omite", () => {
  assert.deepEqual(construirParamsPostulaciones({ idProfesion: "" }), {
    page: 0,
    size: TAMANO_POR_DEFECTO,
  });
  assert.deepEqual(construirParamsPostulaciones({ idProfesion: null }), {
    page: 0,
    size: TAMANO_POR_DEFECTO,
  });
});

test("OPCIONES_TAMANO incluye 'Ver todas' con 0", () => {
  assert.equal(OPCIONES_TAMANO.length, 3);
  assert.equal(OPCIONES_TAMANO.at(-1).value, 0);
});
