import test from "node:test";
import assert from "node:assert/strict";

import {
  ETIQUETAS_MODULO_AUDITORIA,
  construirParamsAuditoria,
  construirParamsExportacion,
  textoFiltrosAplicados,
  validarFiltrosAuditoria,
} from "../src/utils/auditoriaConstants.js";

const RANGO_VALIDO = {
  fechaDesde: "2026-11-01",
  fechaHasta: "2026-11-07",
};

test("arma params con operador y texto recortados", () => {
  const params = construirParamsAuditoria(
    {
      ...RANGO_VALIDO,
      tipos: ["USUARIO_ALTA"],
      operador: "  Luna  ",
      texto: "  tonto  ",
    },
    { pagina: 2, tamano: 50 }
  );

  assert.deepEqual(params, {
    fechaDesde: "2026-11-01",
    fechaHasta: "2026-11-07",
    tipos: "USUARIO_ALTA",
    operador: "Luna",
    texto: "tonto",
    page: 2,
    size: 50,
  });
});

test("omite operador y texto vacíos", () => {
  const params = construirParamsAuditoria({
    ...RANGO_VALIDO,
    operador: "   ",
    texto: "",
  });

  assert.deepEqual(params, {
    fechaDesde: "2026-11-01",
    fechaHasta: "2026-11-07",
  });
});

test("la exportación conserva operador y texto", () => {
  const params = construirParamsExportacion("csv", {
    ...RANGO_VALIDO,
    operador: "Luna",
    texto: "tonto",
  });

  assert.equal(params.formato, "CSV");
  assert.equal(params.operador, "Luna");
  assert.equal(params.texto, "tonto");
});

test("valida el mínimo de operador y texto", () => {
  assert.deepEqual(
    validarFiltrosAuditoria({ ...RANGO_VALIDO, operador: "a" }),
    {
      codigo: "OPERADOR_INVALIDO",
      mensaje: "El operador debe tener al menos 2 caracteres.",
    }
  );

  assert.deepEqual(
    validarFiltrosAuditoria({ ...RANGO_VALIDO, texto: "x" }),
    {
      codigo: "TEXTO_INVALIDO",
      mensaje: "El texto de búsqueda debe tener al menos 2 caracteres.",
    }
  );

  assert.equal(validarFiltrosAuditoria({ ...RANGO_VALIDO, operador: "Lu", texto: "to" }), null);
});

test("describe los filtros aplicados", () => {
  assert.equal(
    textoFiltrosAplicados({ operador: "Luna", texto: "tonto" }),
    'Operador: "Luna" · Texto: "tonto"'
  );
  assert.equal(textoFiltrosAplicados({}), "");
});

test("incluye el módulo de mensajería en el catálogo de auditoría", () => {
  assert.equal(ETIQUETAS_MODULO_AUDITORIA.MENSAJERIA, "Mensajería");
});
