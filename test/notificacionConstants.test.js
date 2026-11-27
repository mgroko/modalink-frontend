import test from "node:test";
import assert from "node:assert/strict";

import {
  TIPOS_NOTIFICACION,
  destinoNotificacion,
  etiquetaTipoNotificacion,
  iconoNotificacion,
} from "../src/utils/notificacionConstants.js";

test("las notificaciones de característica técnica navegan a editar perfil con el campo resaltado", () => {
  for (const tipo of [
    TIPOS_NOTIFICACION.CARACTERISTICA_TECNICA_CREADA,
    TIPOS_NOTIFICACION.CARACTERISTICA_TECNICA_MODIFICADA,
  ]) {
    const destino = destinoNotificacion({
      tipo,
      idPerfilContexto: 20,
      entidadTipo: "CARACTERISTICA_TECNICA",
      entidadId: 55,
    });

    assert.equal(destino.etiqueta, "Completar perfil");
    assert.equal(destino.ruta.name, "editar-perfil");
    assert.deepEqual(destino.ruta.params, { id: 20 });
    assert.deepEqual(destino.ruta.query, {
      resaltarCaracteristicas: "55",
    });
  }
});

test("sin perfil de contexto no se ofrece navegación", () => {
  const destino = destinoNotificacion({
    tipo: TIPOS_NOTIFICACION.CARACTERISTICA_TECNICA_CREADA,
    entidadTipo: "CARACTERISTICA_TECNICA",
    entidadId: 55,
  });

  assert.equal(destino, null);
});

test("sin id de característica navega al perfil sin resaltado", () => {
  const destino = destinoNotificacion({
    tipo: TIPOS_NOTIFICACION.CARACTERISTICA_TECNICA_MODIFICADA,
    idPerfilContexto: 20,
    entidadTipo: "OTRA_ENTIDAD",
  });

  assert.equal(destino.ruta.name, "editar-perfil");
  assert.deepEqual(destino.ruta.query, {});
});

test("las notificaciones de requerimiento general navegan al proyecto", () => {
  for (const tipo of [
    TIPOS_NOTIFICACION.REQUERIMIENTO_ASIGNADO,
    TIPOS_NOTIFICACION.REQUERIMIENTO_DESASIGNADO,
    TIPOS_NOTIFICACION.REQUERIMIENTO_REASIGNADO,
  ]) {
    const destino = destinoNotificacion({
      tipo,
      idPerfilContexto: 20,
      idProyecto: 7,
      entidadTipo: "PROYECTO",
      entidadId: 7,
    });

    assert.equal(destino.etiqueta, "Ver proyecto");
    assert.equal(destino.ruta.name, "dashboard-proyecto");
    assert.deepEqual(destino.ruta.params, { id: 7 });
  }
});

test("las notificaciones de requerimiento general usan entidadId si falta idProyecto", () => {
  const destino = destinoNotificacion({
    tipo: TIPOS_NOTIFICACION.REQUERIMIENTO_ASIGNADO,
    idPerfilContexto: 20,
    entidadTipo: "PROYECTO",
    entidadId: 9,
  });

  assert.deepEqual(destino.ruta.params, { id: 9 });
});

test("las etiquetas e iconos de las nuevas notificaciones están definidos", () => {
  assert.equal(
    etiquetaTipoNotificacion(
      TIPOS_NOTIFICACION.CARACTERISTICA_TECNICA_CREADA
    ),
    "Nueva característica técnica"
  );
  assert.equal(
    etiquetaTipoNotificacion(
      TIPOS_NOTIFICACION.CARACTERISTICA_TECNICA_MODIFICADA
    ),
    "Característica técnica modificada"
  );
  assert.equal(
    iconoNotificacion(TIPOS_NOTIFICACION.CARACTERISTICA_TECNICA_CREADA),
    "playlist_add"
  );

  assert.equal(
    etiquetaTipoNotificacion(TIPOS_NOTIFICACION.REQUERIMIENTO_ASIGNADO),
    "Requerimiento general asignado"
  );
  assert.equal(
    etiquetaTipoNotificacion(TIPOS_NOTIFICACION.REQUERIMIENTO_DESASIGNADO),
    "Requerimiento general desasignado"
  );
  assert.equal(
    etiquetaTipoNotificacion(TIPOS_NOTIFICACION.REQUERIMIENTO_REASIGNADO),
    "Requerimiento general reasignado"
  );
  assert.equal(
    iconoNotificacion(TIPOS_NOTIFICACION.REQUERIMIENTO_ASIGNADO),
    "assignment_ind"
  );
});
