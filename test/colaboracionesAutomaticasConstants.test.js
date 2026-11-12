import test from "node:test";
import assert from "node:assert/strict";

import {
  ESTADOS_COLABORACION_AUTOMATICA,
  contenidoColaboracionesAutomaticas,
  descripcionEstadoColaboracionAutomatica,
  normalizarColaboracionAutomatica,
  normalizarPaginaColaboracionesAutomaticas,
} from "../src/utils/colaboracionesAutomaticasConstants.js";
import {
  TIPOS_NOTIFICACION,
  destinoNotificacion,
} from "../src/utils/notificacionConstants.js";

test("normaliza estados y publicaciones eliminadas", () => {
  const colaboracion = normalizarColaboracionAutomatica({
    idColaboracionAutomatica: 1,
    estado: "pendiente",
    miEstado: "CONFIRMADA",
    estadoContraparte: "PENDIENTE",
    publicacionPropia: {
      idPublicacion: 10,
      titulo: "Editorial",
      portadaUrl: "/a.webp",
      estado: "ACTIVA",
      eliminada: false,
    },
    publicacionContraparte: {
      idPublicacion: 20,
      titulo: "Campaña",
      portadaUrl: "/b.webp",
      estado: "ELIMINADA",
      eliminada: true,
    },
    puedeConfirmar: true,
    puedeRechazar: false,
  });

  assert.equal(colaboracion.estado, "PENDIENTE");
  assert.equal(colaboracion.miEstado, "CONFIRMADA");
  assert.equal(colaboracion.publicacionContraparte.eliminada, true);
  assert.equal(colaboracion.publicacionContraparte.idPublicacion, null);
  assert.equal(colaboracion.publicacionContraparte.titulo, null);
  assert.equal(colaboracion.puedeConfirmar, true);
  assert.equal(colaboracion.puedeRechazar, false);
});

test("explica el estado según quién confirmó", () => {
  const faltaContraparte = {
    estado: "PENDIENTE",
    miEstado: "CONFIRMADA",
    estadoContraparte: "PENDIENTE",
  };
  assert.equal(
    descripcionEstadoColaboracionAutomatica(faltaContraparte, "Sol"),
    "Ya confirmaste. Falta que Sol confirme."
  );

  const faltaYo = {
    estado: "PENDIENTE",
    miEstado: "PENDIENTE",
    estadoContraparte: "CONFIRMADA",
  };
  assert.equal(
    descripcionEstadoColaboracionAutomatica(faltaYo, "Sol"),
    "Sol ya confirmó. Falta tu confirmación."
  );

  assert.equal(
    descripcionEstadoColaboracionAutomatica(
      { estado: ESTADOS_COLABORACION_AUTOMATICA.CONFIRMADA },
      "Sol"
    ),
    "La colaboración está activa en ambas publicaciones."
  );
});

test("normaliza páginas y tolera arrays", () => {
  const pagina = normalizarPaginaColaboracionesAutomaticas({
    contenido: [{ idColaboracionAutomatica: 1 }],
    paginaActual: 0,
    tamanoPagina: 20,
    totalElementos: 1,
    totalPaginas: 1,
    primera: true,
    ultima: true,
  });

  assert.equal(pagina.totalElementos, 1);
  assert.equal(pagina.totalPaginas, 1);
  assert.equal(
    contenidoColaboracionesAutomaticas([{ idColaboracionAutomatica: 2 }])
      .length,
    1
  );

  const array = normalizarPaginaColaboracionesAutomaticas([{}, {}]);
  assert.equal(array.totalElementos, 2);
  assert.equal(array.totalPaginas, 1);
  assert.equal(array.ultima, true);
});

test("las notificaciones automáticas navegan al detalle por entidad", () => {
  const destino = destinoNotificacion({
    tipo: TIPOS_NOTIFICACION.COLABORACION_AUTOMATICA_DETECTADA,
    entidadTipo: "COLABORACION_AUTOMATICA",
    entidadId: 44,
    idPerfilContexto: 8,
  });

  assert.deepEqual(destino, {
    etiqueta: "Ver propuesta",
    ruta: {
      name: "colaboracion-automatica-detalle",
      params: { id: 44 },
    },
  });
});
