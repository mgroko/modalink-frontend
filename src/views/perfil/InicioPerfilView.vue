<template>
  <div class="inicio-perfil">
    <BaseAlert v-if="mensajeExito" :message="mensajeExito" type="success" />
    <div v-if="mensajeError" class="inicio-perfil__error">
      <BaseAlert :message="mensajeError" type="error" />
      <VaButton
        v-if="errorCarga"
        size="small"
        preset="secondary"
        icon="mso-refresh"
        @click="cargarDatos"
      >
        Reintentar
      </VaButton>
    </div>

    <SkeletonPerfil v-if="cargando" />

    <div v-else-if="noEncontrado" class="inicio-perfil__estado">
      <span class="material-symbols-outlined inicio-perfil__estado-icono">person_off</span>
      {{ mensajeNoEncontrado || "El perfil que buscas no está disponible o ha sido dado de baja." }}
      <VaButton preset="secondary" @click="$router.push({ name: 'buscar-perfiles' })">
        Volver a la búsqueda
      </VaButton>
    </div>

    <div v-else-if="!perfil" class="inicio-perfil__estado">
      <span class="material-symbols-outlined inicio-perfil__estado-icono">person_off</span>
      No se encontró el perfil activo.
      <VaButton preset="secondary" @click="$router.push({ name: 'dashboard-usuario' })">
        Volver al dashboard
      </VaButton>
    </div>

    <template v-else>
      <VaAlert
        v-if="esPropio && perfil.estado === 'PendienteBaja'"
        color="warning"
        class="inicio-perfil__alerta-baja"
        icon="mso-warning"
      >
        <div class="inicio-perfil__alerta-baja-contenido">
          <span>{{ mensajeBaja }}</span>
          <VaButton
            size="small"
            color="success"
            :loading="reactivando"
            @click="reactivarPerfil"
          >
            Reactivar perfil
          </VaButton>
        </div>
      </VaAlert>

      <VaAlert
        v-if="esPropio && perfil.estado === 'Deshabilitado'"
        color="danger"
        class="inicio-perfil__alerta-baja"
        icon="mso-lock"
      >
        Tu perfil está deshabilitado. Podés verlo y editarlo, pero no será visible para la
        comunidad.
      </VaAlert>

      <div class="inicio-perfil__layout">
        <div class="inicio-perfil__contenido">
          <PerfilHero
            v-if="seccion !== 'calendario'"
            :perfil="perfil"
            :es-propio="esPropio"
            @editar="irAEditar"
          />

          <!-- Sección: Calendario -->
          <template v-if="seccion === 'calendario'">
            <PerfilHero :perfil="perfil" compacto />
            <section class="inicio-perfil__panel">
              <h2 class="inicio-perfil__panel-titulo">Calendario profesional</h2>
              <div v-if="esPropio" class="inicio-perfil__calendario-wrap">
                <CalendarioCompacto />
              </div>
              <div v-else class="inicio-perfil__calendario-wrap">
                <DisponibilidadAjena :id-usuario="perfil.idUsuario || perfil.idPerfil" />
              </div>
            </section>
          </template>

          <!-- Sección: Reseñas -->
          <section v-else-if="seccion === 'resenas'" class="inicio-perfil__panel">
            <h2 class="inicio-perfil__panel-titulo">Reseñas</h2>
            <p class="inicio-perfil__vacio">Aún no hay reseñas para mostrar.</p>
          </section>

          <!-- Sección: Publicaciones (default) -->
          <template v-else>
            <section class="inicio-perfil__panel">
              <div class="inicio-perfil__panel-header">
                <h2 class="inicio-perfil__panel-titulo">Publicaciones del perfil</h2>
                <VaButton
                  v-if="esPropio"
                  color="success"
                  size="small"
                  icon="mso-add"
                  @click="nuevaPublicacion"
                >
                  Nueva publicación
                </VaButton>
              </div>
              <p v-if="!publicaciones.length" class="inicio-perfil__vacio">
                Todavía no hay publicaciones.
              </p>
              <article
                v-for="publicacion in publicaciones"
                :key="publicacion.idPublicacion"
                class="inicio-perfil__publicacion"
              >
                <p>{{ publicacion.contenido || publicacion.texto }}</p>
              </article>
            </section>

            <section v-if="habilidades.length" class="inicio-perfil__panel">
              <h2 class="inicio-perfil__panel-titulo">Habilidades</h2>
              <div class="inicio-perfil__habilidades">
                <span
                  v-for="habilidad in habilidades"
                  :key="habilidad"
                  class="inicio-perfil__habilidad"
                >
                  {{ habilidad }}
                </span>
              </div>
            </section>

            <section v-if="caracteristicas.length" class="inicio-perfil__panel">
              <h2 class="inicio-perfil__panel-titulo">Características técnicas</h2>

              <div v-if="renAltura.length" class="inicio-perfil__carac-grid">
                <div class="inicio-perfil__campo" v-for="carac in renAltura" :key="carac.idCaracteristica">
                  <span class="inicio-perfil__label">{{ carac._etiqueta }}</span>
                  <span class="inicio-perfil__valor">
                    <span v-if="carac.colorHex" class="inicio-perfil__swatch" :style="{ background: carac.colorHex }"></span>
                    {{ valorCarac(carac) }}{{ unidadCarac(carac) }}
                  </span>
                </div>
              </div>

              <div v-if="renMedidas.length" class="inicio-perfil__carac-grid">
                <div class="inicio-perfil__campo" v-for="carac in renMedidas" :key="carac.idCaracteristica">
                  <span class="inicio-perfil__label">{{ carac._etiqueta }}</span>
                  <span class="inicio-perfil__valor">
                    <span v-if="carac.colorHex" class="inicio-perfil__swatch" :style="{ background: carac.colorHex }"></span>
                    {{ valorCarac(carac) }}{{ unidadCarac(carac) }}
                  </span>
                </div>
              </div>

              <div v-if="renPielOjos.length" class="inicio-perfil__carac-grid">
                <div class="inicio-perfil__campo" v-for="carac in renPielOjos" :key="carac.idCaracteristica">
                  <span class="inicio-perfil__label">{{ carac._etiqueta }}</span>
                  <span class="inicio-perfil__valor">
                    <span v-if="carac.colorHex" class="inicio-perfil__swatch" :style="{ background: carac.colorHex }"></span>
                    {{ valorCarac(carac) }}{{ unidadCarac(carac) }}
                  </span>
                </div>
              </div>

              <div v-if="renCabelloTipo.length" class="inicio-perfil__carac-grid">
                <div class="inicio-perfil__campo" v-for="carac in renCabelloTipo" :key="carac.idCaracteristica">
                  <span class="inicio-perfil__label">{{ carac._etiqueta }}</span>
                  <span class="inicio-perfil__valor">
                    <span v-if="carac.colorHex" class="inicio-perfil__swatch" :style="{ background: carac.colorHex }"></span>
                    {{ valorCarac(carac) }}{{ unidadCarac(carac) }}
                  </span>
                </div>
              </div>

              <div v-if="renOtras.length" class="inicio-perfil__carac-grid">
                <div class="inicio-perfil__campo" v-for="carac in renOtras" :key="carac.idCaracteristica">
                  <span class="inicio-perfil__label">{{ carac._etiqueta }}</span>
                  <span class="inicio-perfil__valor">
                    <span v-if="carac.colorHex" class="inicio-perfil__swatch" :style="{ background: carac.colorHex }"></span>
                    {{ valorCarac(carac) }}{{ unidadCarac(carac) }}
                  </span>
                </div>
              </div>
            </section>
          </template>
        </div>

        <aside class="inicio-perfil__sidebar">
          <template v-if="esPropio">
            <ProximosEventos />
            <PerfilSidebarNav
              es-propio
              :seccion-activa="seccion"
              @cambiar-seccion="cambiarSeccion"
              @navegar-ruta="navegarRuta"
              @cerrar-sesion="cerrarSesion"
            />
          </template>
          <template v-else>
            <PerfilSidebarNav
              :es-propio="false"
              :seccion-activa="seccion"
              @cambiar-seccion="cambiarSeccion"
              @navegar-ruta="navegarRuta"
              @contactar="proximamente"
              @reportar="modalReporte = true"
            />
            <ResenasCard :resenas="resenas" />
          </template>
        </aside>
      </div>

      <ReportarPerfilModal
        v-model="modalReporte"
        :perfil="perfil"
        @reportado="alReportar"
      />
    </template>
  </div>
</template>

<script>
import perfilService from "../../services/perfilService";
import homeService from "../../services/homeService";
import authService from "../../services/authService";
import { idPerfilActivo, limpiarSesion } from "../../services/authState";
import BaseAlert from "../../components/AlertaBase.vue";
import CalendarioCompacto from "../../components/calendario/CalendarioCompacto.vue";
import DisponibilidadAjena from "../../components/calendario/DisponibilidadAjena.vue";
import PerfilHero from "../../components/perfil/PerfilHero.vue";
import PerfilSidebarNav from "../../components/perfil/PerfilSidebarNav.vue";
import ProximosEventos from "../../components/perfil/ProximosEventos.vue";
import ResenasCard from "../../components/perfil/ResenasCard.vue";
import ReportarPerfilModal from "../../components/perfil/ReportarPerfilModal.vue";
import SkeletonPerfil from "../../components/perfil/SkeletonPerfil.vue";
import {
  ETIQUETAS_CARAC,
  ORDEN_CARAC,
  CODIGOS_ALTURA,
  CODIGOS_MEDIDAS,
  CODIGOS_PIEL_OJOS,
  CODIGOS_CABELLO_TIPO,
  TODOS_CODIGOS,
  UNIDADES_POR_CODIGO,
  normCodigo,
  inLista,
} from "../../utils/perfilConstants.js";
import { diasRestantes, fechaExpiracionBaja, formatearFecha } from "../../utils/fechas.js";
import { mensajeErrorApi } from "../../utils/apiError";

export default {
  name: "InicioPerfilView",
  components: {
    BaseAlert,
    CalendarioCompacto,
    DisponibilidadAjena,
    PerfilHero,
    PerfilSidebarNav,
    ProximosEventos,
    ReportarPerfilModal,
    ResenasCard,
    SkeletonPerfil,
  },
  data() {
    return {
      perfil: null,
      publicaciones: [],
      resenas: [],
      cargando: true,
      noEncontrado: false,
      mensajeNoEncontrado: "",
      errorCarga: false,
      mensajeExito: "",
      modalReporte: false,
      reactivando: false,
      mensajeError: "",
      contadorBaja: { expiracion: null, restante: null },
      intervaloContador: null,
    };
  },
  computed: {
    seccion() {
      const seccionRuta = this.$route.params.seccion;
      const validas = ["calendario", "resenas"];
      return validas.includes(seccionRuta) ? seccionRuta : "publicaciones";
    },
    esPropio() {
      if (this.perfil?.esPropietario != null) return this.perfil.esPropietario === true;
      return this.perfil?.idPerfil != null && this.perfil.idPerfil === idPerfilActivo();
    },
    mensajeBaja() {
      const { expiracion, restante } = this.contadorBaja;
      const base = "Este perfil tiene una solicitud de baja pendiente.";
      if (!expiracion) {
        return `${base} Podés reactivarlo mientras el plazo esté vigente.`;
      }
      const plazo =
        restante == null
          ? "El plazo venció: el perfil quedará en estado Baja."
          : restante === 1
            ? "Queda 1 día para reactivarlo."
            : `Quedan ${restante} días para reactivarlo.`;
      return `${base} El ${expiracion} pasará al estado Baja y quedará inaccesible para la comunidad. ${plazo}`;
    },
    habilidades() {
      const lista = Array.isArray(this.perfil?.habilidades) ? this.perfil.habilidades : [];
      return lista.filter(Boolean).slice().sort((a, b) => String(a).localeCompare(String(b), "es"));
    },
    caracteristicas() {
      return this.perfil?.caracteristicas || [];
    },
    renAltura() {
      return this._ordenarCarac(CODIGOS_ALTURA);
    },
    renMedidas() {
      return this._ordenarCarac(CODIGOS_MEDIDAS);
    },
    renPielOjos() {
      return this._ordenarCarac(CODIGOS_PIEL_OJOS);
    },
    renCabelloTipo() {
      return this._ordenarCarac(CODIGOS_CABELLO_TIPO);
    },
    renOtras() {
      return this.caracteristicas
        .filter((c) => !inLista(c.codigo, TODOS_CODIGOS))
        .map((c) => ({ ...c, _etiqueta: this.etiquetaCarac(c.codigo) }));
    },
  },
  async mounted() {
    await this.cargarDatos();
    this.intervaloContador = setInterval(() => this.actualizarContadorBaja(), 60 * 60 * 1000);
  },
  beforeUnmount() {
    if (this.intervaloContador) clearInterval(this.intervaloContador);
  },
  watch: {
    "$route.params.id"() {
      this.cargarDatos();
    },
    "$route.params.seccion"() {
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
  },
  methods: {
    async cargarDatos() {
      this.cargando = true;
      this.mensajeError = "";
      this.mensajeExito = "";
      this.noEncontrado = false;
      this.mensajeNoEncontrado = "";
      this.errorCarga = false;

      const idDeRuta = this.$route.params.id;
      const id = idDeRuta != null ? Number(idDeRuta) : idPerfilActivo();
      if (id == null || Number.isNaN(id)) {
        this.cargando = false;
        this.perfil = null;
        return;
      }

      try {
        // Paralelismo (UC-14 §7): el resumen del feed solo hace falta si el
        // perfil es propio. "¿Es mío?" se resuelve antes de lanzar las
        // peticiones con el perfil activo en sesión (mismo criterio del
        // computed esPropio) para no serializar los dos round-trips.
        const esMio = idDeRuta == null || id === idPerfilActivo();

        const perfilPromise = perfilService.obtener(id);
        const resumenPromise = esMio
          ? // best-effort: un fallo del resumen no debe romper la carga del perfil
            homeService.obtenerResumen().catch(() => null)
          : Promise.resolve(null);

        const [perfilRes, resumenInicial] = await Promise.all([
          perfilPromise,
          resumenPromise,
        ]);

        this.perfil = perfilRes?.data || null;
        if (!this.perfil) {
          this.noEncontrado = true;
          return;
        }
        this.actualizarContadorBaja();

        // Caso raro: el backend marca esPropietario pero el id no coincidía
        // con el perfil activo al disparar las peticiones → traer el resumen
        // en este punto (ya de forma secuencial).
        let resumenRes = resumenInicial;
        if (this.perfil.esPropietario === true && resumenRes == null) {
          resumenRes = await homeService.obtenerResumen().catch(() => null);
        }

        // Las publicaciones del feed propio solo se muestran cuando el perfil
        // consultado pertenece al usuario en sesión.
        const resumen = resumenRes?.data || null;
        this.publicaciones =
          this.perfil.esPropietario === true && Array.isArray(resumen?.publicacionesRecientes)
            ? resumen.publicacionesRecientes
            : [];
      } catch (error) {
        const status = error?.response?.status;
        if (status === 401) {
          // Spec UC-14 §6: sesión inválida o cuenta inactiva → volver al login
          // conservando la ruta de origen para regresar tras re-autenticarse.
          this.$router.push({ name: "login", query: { redirect: this.$route.fullPath } });
          return;
        }
        if (status === 404) {
          this.noEncontrado = true;
          this.mensajeNoEncontrado =
            error?.response?.data?.message ||
            "El perfil que buscas no está disponible o ha sido dado de baja.";
        } else {
          this.errorCarga = true;
          this.mensajeError = mensajeErrorApi(error, "No se pudo cargar el perfil. Intentá nuevamente.");
        }
      } finally {
        this.cargando = false;
      }
    },
    actualizarContadorBaja() {
      // Prioriza la fecha exacta del backend (fechaLimite) si el endpoint la
      // incluye. El contrato actual (UC-14 §2) solo envía fechaSolicitudBaja,
      // por lo que la expiración se calcula con DIAS_REACTIVACION (debe
      // coincidir con la configuración diasBaja del backend).
      const fechaLimite = this.perfil?.fechaLimite;
      const iso = this.perfil?.fechaSolicitudBaja;
      const expira = fechaLimite || (iso ? fechaExpiracionBaja(iso) : null);
      this.contadorBaja = {
        expiracion: expira ? formatearFecha(expira) : null,
        restante: expira ? diasRestantes(expira) : null,
      };
    },
    async reactivarPerfil() {
      if (!this.perfil?.idPerfil) return;
      this.reactivando = true;
      this.mensajeError = "";
      try {
        await perfilService.reactivar(this.perfil.idPerfil);
        await this.cargarDatos();
      } catch (error) {
        const status = error?.response?.status;
        this.mensajeError =
          error?.response?.data?.message ||
          (status === 409
            ? "El plazo de reactivación venció: el perfil ya está en estado Baja."
            : "No se pudo reactivar el perfil.");
      } finally {
        this.reactivando = false;
      }
    },
    cambiarSeccion(seccion) {
      const idDeRuta = this.$route.params.id;
      if (idDeRuta) {
        this.$router.push({ name: "ver-perfil-seccion", params: { id: idDeRuta, seccion } });
      } else {
        this.$router.push({ name: "inicioperfil-seccion", params: { seccion } });
      }
    },
    navegarRuta(ruta) {
      if (ruta) {
        this.$router.push({ name: ruta });
      } else {
        this.proximamente();
      }
    },
    proximamente() {
      alert("Funcionalidad próximamente disponible.");
    },
    alReportar() {
      this.mensajeExito = "Reporte enviado. Gracias por ayudarnos a mantener la comunidad.";
    },
    nuevaPublicacion() {
      this.proximamente();
    },
    irAEditar() {
      if (this.perfil?.idPerfil) {
        this.$router.push({
          name: "editar-perfil-inicio",
          params: { id: this.perfil.idPerfil },
        });
      }
    },
    async cerrarSesion() {
      try {
        await authService.cerrarSesion();
      } catch {
        // ignore
      } finally {
        limpiarSesion();
        this.$router.push({ name: "login" });
      }
    },
    _ordenarCarac(codigos) {
      return this.caracteristicas
        .filter((c) => inLista(c.codigo, codigos))
        .map((c) => ({ ...c, _etiqueta: this.etiquetaCarac(c.codigo) }))
        .sort((a, b) => {
          const na = normCodigo(a.codigo);
          const nb = normCodigo(b.codigo);
          const oa = ORDEN_CARAC[na] ?? codigos.indexOf(na);
          const ob = ORDEN_CARAC[nb] ?? codigos.indexOf(nb);
          return oa - ob;
        });
    },
    etiquetaCarac(codigo) {
      const n = normCodigo(codigo);
      if (ETIQUETAS_CARAC[n]) return ETIQUETAS_CARAC[n];
      return this.capitalizar(codigo) || "—";
    },
    valorCarac(carac) {
      // Spec UC-14 §2/§7.3: codigoValor ya es la etiqueta visible de BD y
      // valor es texto libre; se muestran tal cual, sin re-mapear.
      if (carac.codigoValor) return carac.codigoValor;
      if (carac.valor) return carac.valor;
      return "—";
    },
    unidadCarac(carac) {
      const unidad = UNIDADES_POR_CODIGO[normCodigo(carac.codigo)];
      return unidad ? ` ${unidad}` : "";
    },
    capitalizar(texto) {
      const palabras = String(texto || "")
        .toLowerCase()
        .split(/[_\-]+/)
        .filter(Boolean)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1));
      return palabras.join(" ");
    },
  },
};
</script>

<style scoped>
.inicio-perfil {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
}

.inicio-perfil__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 1.5rem;
  align-items: start;
}

.inicio-perfil__contenido {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
}

.inicio-perfil__sidebar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: sticky;
  top: 1rem;
}

.inicio-perfil__panel {
  padding: 1.25rem;
  background: var(--color-surface);
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

.inicio-perfil__panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.inicio-perfil__panel-titulo {
  margin: 0 0 1rem;
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
}

.inicio-perfil__panel-header .inicio-perfil__panel-titulo {
  margin: 0;
}

.inicio-perfil__vacio {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.inicio-perfil__publicacion {
  padding: 0.9rem 0;
  border-bottom: 1px solid #e5e7eb;
}

.inicio-perfil__publicacion:last-child {
  border-bottom: 0;
}

.inicio-perfil__publicacion p {
  margin: 0;
  color: var(--color-text);
  font-size: 0.9rem;
}

.inicio-perfil__carac-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 0.75rem;
  padding: 1rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 0.75rem;
}

.inicio-perfil__carac-grid:last-child {
  margin-bottom: 0;
}

.inicio-perfil__campo {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.85rem;
  color: var(--color-text);
}

.inicio-perfil__label {
  font-size: 0.72rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.inicio-perfil__valor {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.inicio-perfil__swatch {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.15);
}

.inicio-perfil__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.inicio-perfil__estado-icono {
  font-size: 2.5rem;
}

.inicio-perfil__habilidades {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.inicio-perfil__habilidad {
  background: #f0f0f6;
  border: 1px solid #e5e7eb;
  color: var(--color-text);
  font-size: 0.8rem;
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
}

.inicio-perfil__error {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
}

.inicio-perfil__alerta-baja {
  margin-bottom: 1rem;
}

.inicio-perfil__alerta-baja-contenido {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
  flex-wrap: wrap;
}

.inicio-perfil__calendario-wrap {
  overflow-x: auto;
  max-width: 100%;
}

@media (max-width: 900px) {
  .inicio-perfil__layout {
    grid-template-columns: 1fr;
  }

  .inicio-perfil__sidebar {
    position: static;
    order: -1;
  }
}
</style>
