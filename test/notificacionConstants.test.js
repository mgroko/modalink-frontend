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
});
