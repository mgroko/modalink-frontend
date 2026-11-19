import test from "node:test";
import assert from "node:assert/strict";

import {
  OPCIONES_ESTADO_REPORTE_PUBLICACION,
  OPCIONES_MOTIVO_FILTRO_REPORTE_PUBLICACION,
  VALOR_FILTRO_TODOS as TODOS_PUBLICACION,
  construirParamsReportesPublicacion,
} from "../src/utils/reportePublicacionConstants.js";
import {
  OPCIONES_ESTADO_REPORTE_PERFIL,
  OPCIONES_MOTIVO_FILTRO_REPORTE_PERFIL,
  VALOR_FILTRO_TODOS as TODOS_PERFIL,
  construirParamsReportesPerfil,
} from "../src/utils/reportePerfilConstants.js";

test("las opciones Todos usan un valor no vacío para que el select muestre la etiqueta", () => {
  assert.equal(OPCIONES_ESTADO_REPORTE_PUBLICACION[0].value, TODOS_PUBLICACION);
  assert.equal(OPCIONES_MOTIVO_FILTRO_REPORTE_PUBLICACION[0].value, TODOS_PUBLICACION);
  assert.equal(OPCIONES_ESTADO_REPORTE_PERFIL[0].value, TODOS_PERFIL);
  assert.equal(OPCIONES_MOTIVO_FILTRO_REPORTE_PERFIL[0].value, TODOS_PERFIL);
  assert.ok(TODOS_PUBLICACION);
  assert.ok(TODOS_PERFIL);
});

test("los builders ignoran el filtro Todos", () => {
  const publicacion = construirParamsReportesPublicacion({
    estado: TODOS_PUBLICACION,
    motivo: TODOS_PUBLICACION,
  });
  assert.equal("estado" in publicacion, false);
  assert.equal("motivo" in publicacion, false);

  const perfil = construirParamsReportesPerfil({
    estado: TODOS_PERFIL,
    motivo: TODOS_PERFIL,
  });
  assert.equal("estado" in perfil, false);
  assert.equal("motivo" in perfil, false);
});

test("los builders siguen enviando los filtros reales", () => {
  const publicacion = construirParamsReportesPublicacion({
    estado: "PENDIENTE",
    motivo: "SPAM",
  });
  assert.equal(publicacion.estado, "PENDIENTE");
  assert.equal(publicacion.motivo, "SPAM");

  const perfil = construirParamsReportesPerfil({
    estado: "RESUELTO",
    motivo: "OTRO",
  });
  assert.equal(perfil.estado, "RESUELTO");
  assert.equal(perfil.motivo, "OTRO");
});
