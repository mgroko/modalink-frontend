
Editarperfilview · VUE
<template>
  <div class="editar-perfil">
    <header class="editar-perfil__header">
      <h1 class="editar-perfil__titulo">Editar perfil</h1>
      <p class="editar-perfil__subtitulo">Actualizá la información de tu perfil profesional.</p>
    </header>

    <section v-if="cargandoInicial" class="editar-perfil__panel editar-perfil__estado">
      <span class="material-symbols-outlined editar-perfil__estado-icono">hourglass_empty</span>
      Cargando perfil...
    </section>

    <section v-else-if="noEncontrado" class="editar-perfil__panel editar-perfil__estado">
      <span class="material-symbols-outlined editar-perfil__estado-icono">error</span>
      No se encontró el perfil solicitado.
      <VaButton preset="secondary" @click="volver">{{ textoVolver }}</VaButton>
    </section>

    <section v-else-if="sinPermiso" class="editar-perfil__panel editar-perfil__estado">
      <span class="material-symbols-outlined editar-perfil__estado-icono">lock</span>
      No tenés permiso para editar este perfil.
      <VaButton preset="secondary" @click="volver">{{ textoVolver }}</VaButton>
    </section>

    <template v-else>
      <div class="editar-perfil__panel">
        <div class="editar-perfil__foto">
          <img
            v-if="fotoVisible"
            :src="fotoVisible"
            :alt="perfil.nombreArtistico || 'Foto de perfil'"
            class="editar-perfil__foto-img"
          />
          <div v-else class="editar-perfil__foto-img editar-perfil__foto-img--placeholder">
            <span class="material-symbols-outlined">person</span>
          </div>
          <div class="editar-perfil__foto-info">
            <span class="editar-perfil__nombre-artistico">{{ perfil.nombreArtistico || "Sin nombre" }}</span>
            <span v-if="fotoPreview" class="editar-perfil__foto-aviso">Nueva foto lista: se sube al guardar los cambios.</span>
            <span v-else-if="!perfil.fotoUrl" class="editar-perfil__foto-aviso">Todavía no tenés una foto de perfil.</span>
            <div class="editar-perfil__foto-acciones">
              <input
                ref="inputFoto"
                type="file"
                accept="image/*"
                class="editar-perfil__foto-input"
                @change="seleccionarFoto"
              />
              <button
                type="button"
                class="editar-perfil__foto-accion"
                @click="$refs.inputFoto.click()"
              >
                <span class="material-symbols-outlined" aria-hidden="true">photo_camera</span>
                {{ fotoPreview ? "Cambiar foto" : "Elegir foto" }}
              </button>
              <button
                v-if="fotoPreview"
                type="button"
                class="editar-perfil__foto-accion editar-perfil__foto-accion--peligro"
                @click="limpiarFoto"
              >
                Quitar selección
              </button>
              <button
                v-else-if="perfil.fotoUrl"
                type="button"
                class="editar-perfil__foto-accion editar-perfil__foto-accion--peligro"
                @click="modalEliminarFoto = true"
              >
                Eliminar foto
              </button>
            </div>
          </div>
        </div>

        <VaForm ref="form" :immediate="false" @submit.prevent="guardar" class="editar-perfil__form">
          <div class="editar-perfil__campos">
            <VaInput
              v-model="form.nombreArtistico"
              :rules="[reglas.requerido, reglas.min2, reglas.max50]"
              label="Nombre artístico"
              type="text"
              placeholder="Ej: Lía Stylist"
            />

            <VaSelect
              :model-value="form.idProfesion"
              :options="profesiones"
              value-by="idProfesion"
              :text-by="(option) => capitalizarEtiqueta(option.nombre)"
              label="Profesión"
              disabled
            />
          </div>

          <div v-if="cargandoCaracteristicas" class="editar-perfil__estado">
            <span class="material-symbols-outlined editar-perfil__estado-icono">hourglass_empty</span>
            Cargando características...
          </div>

          <div v-else-if="caracteristicas.length === 0" class="editar-perfil__estado">
            <span class="material-symbols-outlined editar-perfil__estado-icono">info</span>
            No se encontraron características para esta profesión.
          </div>

          <template v-else>
            <div class="editar-perfil__campos">
              <div v-if="caracteristicaAltura" class="editar-perfil__campo-caracteristica">
                <VaInput
                  v-if="!esEnumerado(caracteristicaAltura)"
                  v-model="form.caracteristicas[caracteristicaAltura.idCaracteristica].valor"
                  :rules="reglasCampo(caracteristicaAltura)"
                  :label="etiquetaCaracteristica(caracteristicaAltura)"
                  :type="esNumerico(caracteristicaAltura) ? 'number' : 'text'"
                  :placeholder="`${labelCaracteristica(caracteristicaAltura.codigo)} ...`"
                />
                <VaSelect
                  v-else
                  v-model="form.caracteristicas[caracteristicaAltura.idCaracteristica].idValor"
                  :options="caracteristicaAltura.valores || []"
                  value-by="idValor"
                  :text-by="(option) => labelValor(option.codigo)"
                  :rules="[reglas.requerido]"
                  :label="etiquetaCaracteristica(caracteristicaAltura)"
                  placeholder="Seleccioná un valor"
                >
                  <template #content="{ value }">
                    <span v-if="getValorById(caracteristicaAltura, value)" class="editar-perfil__opcion">
                      <span v-if="getValorById(caracteristicaAltura, value).colorHex" class="editar-perfil__swatch" :style="{ background: getValorById(caracteristicaAltura, value).colorHex }"></span>
                      {{ labelValor(getValorById(caracteristicaAltura, value).codigo) }}
                    </span>
                  </template>
                  <template #option-content="{ option }">
                    <span class="editar-perfil__opcion">
                      <span v-if="option.colorHex" class="editar-perfil__swatch" :style="{ background: option.colorHex }"></span>
                      {{ labelValor(option.codigo) }}
                    </span>
                  </template>
                </VaSelect>
              </div>

              <div v-if="caracteristicasMedidas.length" class="editar-perfil__medidas-linea">
                <div class="editar-perfil__fila-medidas">
                  <div
                    v-for="carac in caracteristicasMedidas"
                    :key="carac.idCaracteristica"
                    class="editar-perfil__campo-caracteristica"
                  >
                    <VaSelect
                      v-if="esEnumerado(carac)"
                      v-model="form.caracteristicas[carac.idCaracteristica].idValor"
                      :options="carac.valores || []"
                      value-by="idValor"
                      :text-by="(option) => labelValor(option.codigo)"
                      :rules="[reglas.requerido]"
                      :label="etiquetaCaracteristica(carac)"
                      placeholder="Seleccioná un valor"
                    >
                      <template #content="{ value }">
                        <span v-if="getValorById(carac, value)" class="editar-perfil__opcion">
                          <span v-if="getValorById(carac, value).colorHex" class="editar-perfil__swatch" :style="{ background: getValorById(carac, value).colorHex }"></span>
                          {{ labelValor(getValorById(carac, value).codigo) }}
                        </span>
                      </template>
                      <template #option-content="{ option }">
                        <span class="editar-perfil__opcion">
                          <span v-if="option.colorHex" class="editar-perfil__swatch" :style="{ background: option.colorHex }"></span>
                          {{ labelValor(option.codigo) }}
                        </span>
                      </template>
                    </VaSelect>
                    <VaInput
                      v-else
                      v-model="form.caracteristicas[carac.idCaracteristica].valor"
                      :rules="reglasCampo(carac)"
                      :label="etiquetaCaracteristica(carac)"
                      :type="esNumerico(carac) ? 'number' : 'text'"
                      :placeholder="`${labelCaracteristica(carac.codigo)} ...`"
                    />
                  </div>
                </div>
              </div>

              <div
                v-for="carac in caracteristicasColores"
                :key="carac.idCaracteristica"
                class="editar-perfil__campo-caracteristica"
              >
                <VaSelect
                  v-if="esEnumerado(carac)"
                  v-model="form.caracteristicas[carac.idCaracteristica].idValor"
                  :options="carac.valores || []"
                  value-by="idValor"
                  :text-by="(option) => labelValor(option.codigo)"
                  :rules="[reglas.requerido]"
                  :label="etiquetaCaracteristica(carac)"
                  placeholder="Seleccioná un valor"
                >
                  <template #content="{ value }">
                    <span v-if="getValorById(carac, value)" class="editar-perfil__opcion">
                      <span v-if="getValorById(carac, value).colorHex" class="editar-perfil__swatch" :style="{ background: getValorById(carac, value).colorHex }"></span>
                      {{ labelValor(getValorById(carac, value).codigo) }}
                    </span>
                  </template>
                  <template #option-content="{ option }">
                    <span class="editar-perfil__opcion">
                      <span v-if="option.colorHex" class="editar-perfil__swatch" :style="{ background: option.colorHex }"></span>
                      {{ labelValor(option.codigo) }}
                    </span>
                  </template>
                </VaSelect>
                <VaInput
                  v-else
                  v-model="form.caracteristicas[carac.idCaracteristica].valor"
                  :rules="reglasCampo(carac)"
                  :label="etiquetaCaracteristica(carac)"
                  :type="esNumerico(carac) ? 'number' : 'text'"
                  :placeholder="`${labelCaracteristica(carac.codigo)} ...`"
                />
              </div>

              <div
                v-for="carac in caracteristicasRestantes"
                :key="carac.idCaracteristica"
                class="editar-perfil__campo-caracteristica"
              >
                <VaSelect
                  v-if="esEnumerado(carac)"
                  v-model="form.caracteristicas[carac.idCaracteristica].idValor"
                  :options="carac.valores || []"
                  value-by="idValor"
                  :text-by="(option) => labelValor(option.codigo)"
                  :rules="[reglas.requerido]"
                  :label="etiquetaCaracteristica(carac)"
                  placeholder="Seleccioná un valor"
                >
                  <template #content="{ value }">
                    <span v-if="getValorById(carac, value)" class="editar-perfil__opcion">
                      <span v-if="getValorById(carac, value).colorHex" class="editar-perfil__swatch" :style="{ background: getValorById(carac, value).colorHex }"></span>
                      {{ labelValor(getValorById(carac, value).codigo) }}
                    </span>
                  </template>
                  <template #option-content="{ option }">
                    <span class="editar-perfil__opcion">
                      <span v-if="option.colorHex" class="editar-perfil__swatch" :style="{ background: option.colorHex }"></span>
                      {{ labelValor(option.codigo) }}
                    </span>
                  </template>
                </VaSelect>
                <VaInput
                  v-else
                  v-model="form.caracteristicas[carac.idCaracteristica].valor"
                  :rules="reglasCampo(carac)"
                  :label="etiquetaCaracteristica(carac)"
                  :type="esNumerico(carac) ? 'number' : 'text'"
                  :placeholder="`${labelCaracteristica(carac.codigo)} ...`"
                />
              </div>
            </div>
          </template>

          <div class="editar-perfil__campos">
            <VaInput
              v-model="form.biografia"
              :rules="[reglas.requerido, reglas.max200]"
              type="textarea"
              label="Biografía"
              placeholder="Contá sobre tu trayectoria profesional..."
              maxlength="200"
            />
            <p class="editar-perfil__contador">{{ form.biografia.length }} / 200</p>
          </div>

          <section class="editar-perfil__habilidades">
            <header class="editar-perfil__habilidades-cabecera">
              <h2 class="editar-perfil__habilidades-titulo">Habilidades</h2>
              <p class="editar-perfil__habilidades-ayuda">
                Las habilidades son globales y se guardan al instante.
              </p>
            </header>

            <BaseAlert v-if="errorHabilidades" :message="errorHabilidades" type="error" />
            <BaseAlert v-if="exitoHabilidades" :message="exitoHabilidades" type="success" />

            <div v-if="cargandoHabilidades" class="editar-perfil__estado">
              <span class="material-symbols-outlined editar-perfil__estado-icono">hourglass_empty</span>
              Cargando habilidades...
            </div>

            <template v-else>
              <div
                v-if="habilidadesActuales.length"
                class="editar-perfil__habilidades-chips"
              >
                <span
                  v-for="habilidad in habilidadesActuales"
                  :key="habilidad.idHabilidad"
                  class="editar-perfil__habilidad-chip"
                >
                  {{ habilidad.nombre }}
                  <button
                    type="button"
                    class="editar-perfil__habilidad-quitar"
                    :disabled="guardandoHabilidad"
                    :aria-label="`Quitar ${habilidad.nombre}`"
                    title="Quitar habilidad"
                    @click="quitarHabilidad(habilidad)"
                  >
                    <span class="material-symbols-outlined">close</span>
                  </button>
                </span>
              </div>

              <p v-else class="editar-perfil__habilidades-vacio">
                Todavía no cargaste habilidades en tu perfil.
              </p>

              <div
                class="editar-perfil__habilidad-agregar"
                @keydown.enter.prevent
              >
                <VaSelect
                  v-model="habilidadSeleccionada"
                  :options="habilidadesDisponibles"
                  value-by="idHabilidad"
                  text-by="nombre"
                  placeholder="Seleccionar habilidad"
                  allow-search
                  clearable
                  :disabled="guardandoHabilidad || habilidadesDisponibles.length === 0"
                />
                <VaButton
                  type="button"
                  preset="primary"
                  :loading="guardandoHabilidad"
                  :disabled="
                    guardandoHabilidad ||
                    habilidadSeleccionada == null ||
                    habilidadesDisponibles.length === 0
                  "
                  @click="agregarHabilidad"
                >
                  Agregar
                </VaButton>
              </div>

              <p
                v-if="habilidadesCatalogo.length === 0"
                class="editar-perfil__habilidades-vacio"
              >
                No hay habilidades disponibles en el catálogo.
              </p>
            </template>
          </section>

          <div
            class="editar-perfil__alertas-wrapper"
            :class="{ 'editar-perfil__alertas-wrapper--visible': mensajeExito || mensajeError }"
          >
            <div class="editar-perfil__alertas">
              <BaseAlert v-if="mensajeExito" :message="mensajeExito" type="success" />
              <BaseAlert v-if="mensajeError" :message="mensajeError" type="error" />
            </div>
          </div>

          <div class="editar-perfil__acciones">
            <button
              type="button"
              class="editar-perfil__cancelar"
              :disabled="cargando || !!mensajeExito"
              @click="volver"
            >
              Cancelar
            </button>
            <VaButton type="submit" :loading="cargando" :disabled="!!mensajeExito">
              Guardar cambios
            </VaButton>
          </div>
        </VaForm>
      </div>

      <VaModal
        v-model="modalEliminarFoto"
        size="small"
        close-button
        hide-default-actions
      >
        <template #header>
          <h3 class="va-h5">Eliminar foto de perfil</h3>
        </template>
        <p>¿Querés eliminar la foto de tu perfil? Podés subir una nueva en cualquier momento.</p>
        <template #footer>
          <div class="editar-perfil__modal-acciones">
            <VaButton preset="secondary" @click="modalEliminarFoto = false">Cancelar</VaButton>
            <VaButton color="danger" :loading="eliminandoFoto" @click="eliminarFoto">Eliminar foto</VaButton>
          </div>
        </template>
      </VaModal>
    </template>
 
    
  </div>
</template>
 
<script>
import perfilService from "../../services/perfilService.js";
import habilidadService from "../../services/habilidadService.js";
import BaseAlert from "../../components/AlertaBase.vue";
import {
  ETIQUETAS_CARACTERISTICAS,
  ETIQUETAS_VALORES,
  ORDEN_PRIORIDAD,
  normCodigo,
  normTexto,
  simboloUnidad,
  esUnidadColor,
  tipoDatoUnidad,
} from "../../utils/perfilConstants.js";
import { reglasPerfil } from "../../utils/reglas.js";
import { resolverFotoUrl } from "../../utils/fotos.js";
 
export default {
  name: "EditarPerfilView",
  components: {
    BaseAlert,
  },
  props: {
    desdeInicio: {
      type: Boolean,
      default: false,
    },
    desdeAjustes: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    rutaVolver() {
      if (this.desdeAjustes) return "ajustes-perfil-inicio";
      if (this.desdeInicio) return "inicioperfil";
      return "dashboard-usuario";
    },
    textoVolver() {
      if (this.desdeAjustes) return "Volver a ajustes";
      if (this.desdeInicio) return "Volver a mi perfil";
      return "Volver al dashboard";
    },
    fotoVisible() {
      return this.fotoPreview || resolverFotoUrl(this.perfil?.fotoUrl);
    },
    caracteristicaAltura() {
      return this.caracteristicas.find((c) => normCodigo(c.codigo) === "altura") || null;
    },
    caracteristicasMedidas() {
      const medidas = this.caracteristicas.filter((c) => {
        const n = normCodigo(c.codigo);
        return ["medida_pecho", "pecho", "busto", "medida_cintura", "cintura", "medida_cadera", "cadera"].includes(n);
      });
      return medidas.sort((a, b) => (ORDEN_PRIORIDAD[normCodigo(a.codigo)] || 99) - (ORDEN_PRIORIDAD[normCodigo(b.codigo)] || 99));
    },
    caracteristicasColores() {
      const colores = this.caracteristicas.filter((c) => {
        const n = normCodigo(c.codigo);
        return ["color_piel", "piel", "color_cabello", "cabello", "pelo", "color_ojos", "ojos"].includes(n);
      });
      return colores.sort((a, b) => (ORDEN_PRIORIDAD[normCodigo(a.codigo)] || 99) - (ORDEN_PRIORIDAD[normCodigo(b.codigo)] || 99));
    },
    caracteristicasRestantes() {
      const excluidos = new Set();
      if (this.caracteristicaAltura) excluidos.add(this.caracteristicaAltura.idCaracteristica);
      this.caracteristicasMedidas.forEach((c) => excluidos.add(c.idCaracteristica));
      this.caracteristicasColores.forEach((c) => excluidos.add(c.idCaracteristica));
      const resto = this.caracteristicas.filter((c) => !excluidos.has(c.idCaracteristica));
      return resto.sort((a, b) => (ORDEN_PRIORIDAD[normCodigo(a.codigo)] || 99) - (ORDEN_PRIORIDAD[normCodigo(b.codigo)] || 99));
    },
    habilidadesDisponibles() {
      const actuales = new Set(
        this.habilidadesActuales.map((habilidad) => String(habilidad.idHabilidad))
      );
      return this.habilidadesCatalogo.filter(
        (habilidad) => !actuales.has(String(habilidad.idHabilidad))
      );
    },
  },
  data() {
    return {
      idPerfil: null,
      perfil: null,
      profesiones: [],
      caracteristicas: [],
      cargandoInicial: true,
      cargandoCaracteristicas: false,
      noEncontrado: false,
      sinPermiso: false,
      form: {
        nombreArtistico: "",
        idProfesion: null,
        biografia: "",
        caracteristicas: {},
      },
      cargando: false,
      mensajeExito: "",
      mensajeError: "",
      fotoArchivo: null,
      fotoPreview: null,
      modalEliminarFoto: false,
      eliminandoFoto: false,
      habilidadesCatalogo: [],
      habilidadesActuales: [],
      habilidadSeleccionada: null,
      cargandoHabilidades: false,
      guardandoHabilidad: false,
      errorHabilidades: "",
      exitoHabilidades: "",
      reglas: reglasPerfil,
    };
  },
  async mounted() {
    this.idPerfil = this.$route.params.id;
    await this.cargarPerfil();
  },
  beforeUnmount() {
    this.liberarPreview();
  },
  methods: {
    async cargarPerfil() {
      this.cargandoInicial = true;
      this.noEncontrado = false;
      this.sinPermiso = false;
      try {
        const response = await perfilService.obtener(this.idPerfil);
        this.perfil = response?.data;
        if (!this.perfil) {
          this.noEncontrado = true;
          return;
        }
        // El endpoint de detalle es público para perfiles activos de terceros:
        // solo el dueño puede editar. Se corta antes de cargar habilidades o
        // características para no mostrar ni precargar datos ajenos.
        if (this.perfil.esPropietario !== true) {
          this.perfil = null;
          this.sinPermiso = true;
          return;
        }
        this.form.nombreArtistico = this.perfil.nombreArtistico || "";
        this.form.biografia = this.perfil.biografia || "";

        this.cargandoHabilidades = true;
        try {
          await Promise.all([
            this.cargarHabilidadesCatalogo(),
            this.cargarHabilidadesPerfil(),
          ]);
        } finally {
          this.cargandoHabilidades = false;
        }

        const profesiones = await this.cargarProfesiones();
        this.form.idProfesion = this.resolverIdProfesion(this.perfil.profesion, profesiones);
        if (this.form.idProfesion != null) {
          await this.cargarCaracteristicas(this.form.idProfesion);
        }
      } catch (error) {
        if (error?.response?.status === 404) {
          this.noEncontrado = true;
        } else {
          this.mensajeError =
            error?.response?.data?.message || "No se pudo cargar el perfil. Intentá nuevamente.";
        }
      } finally {
        this.cargandoInicial = false;
      }
    },
    resolverIdProfesion(nombreProfesion, profesiones) {
      const nombreNorm = normTexto(nombreProfesion);
      const encontrada = profesiones.find((p) => normTexto(p.nombre) === nombreNorm);
      return encontrada ? encontrada.idProfesion : null;
    },
    async cargarProfesiones() {
      try {
        const response = await perfilService.listarProfesiones();
        const datos = response?.data;
        this.profesiones = Array.isArray(datos) ? datos : datos?.profesiones || [];
      } catch {
        this.profesiones = [];
      }
      return this.profesiones;
    },
    async cargarHabilidadesCatalogo() {
      try {
        const response = await habilidadService.listar();
        const datos = response?.data;
        this.habilidadesCatalogo = Array.isArray(datos) ? datos : [];
      } catch {
        this.habilidadesCatalogo = [];
        this.errorHabilidades =
          "No se pudo cargar el catálogo de habilidades.";
      }
    },
    async cargarHabilidadesPerfil() {
      try {
        const response = await perfilService.listarHabilidades(this.idPerfil);
        const datos = response?.data;
        this.habilidadesActuales = Array.isArray(datos) ? datos : [];
        this.sincronizarNombresHabilidades();
      } catch (error) {
        this.habilidadesActuales = [];
        this.errorHabilidades =
          error?.response?.data?.message ||
          "No se pudieron cargar tus habilidades.";
      }
    },
    sincronizarNombresHabilidades() {
      if (!this.perfil) return;
      this.perfil.habilidades = this.habilidadesActuales
        .map((habilidad) => habilidad?.nombre)
        .filter(Boolean);
    },
    async agregarHabilidad() {
      if (this.guardandoHabilidad || this.habilidadSeleccionada == null) return;

      const idHabilidad = this.habilidadSeleccionada;
      this.guardandoHabilidad = true;
      this.errorHabilidades = "";
      this.exitoHabilidades = "";

      try {
        const response = await perfilService.agregarHabilidad(
          this.idPerfil,
          idHabilidad
        );
        const habilidad = response?.data;
        if (
          habilidad?.idHabilidad != null &&
          !this.habilidadesActuales.some(
            (item) => String(item.idHabilidad) === String(habilidad.idHabilidad)
          )
        ) {
          this.habilidadesActuales = [...this.habilidadesActuales, habilidad];
        }
        this.sincronizarNombresHabilidades();
        this.habilidadSeleccionada = null;
        this.exitoHabilidades = "Habilidad agregada correctamente.";
      } catch (error) {
        const status = error?.response?.status;
        const mensaje = error?.response?.data?.message || "";

        if (status === 409) {
          this.errorHabilidades =
            mensaje || "La habilidad ya está asociada a este perfil.";
          this.habilidadSeleccionada = null;
          await this.cargarHabilidadesPerfil();
        } else if (status === 404) {
          this.errorHabilidades =
            mensaje || "La habilidad ya no está disponible.";
          this.habilidadSeleccionada = null;
          await Promise.all([
            this.cargarHabilidadesCatalogo(),
            this.cargarHabilidadesPerfil(),
          ]);
        } else if (status === 403) {
          this.errorHabilidades =
            mensaje || "No tenés permiso para modificar este perfil.";
        } else {
          this.errorHabilidades =
            mensaje || "No se pudo agregar la habilidad. Intentá nuevamente.";
        }
      } finally {
        this.guardandoHabilidad = false;
      }
    },
    async quitarHabilidad(habilidad) {
      if (this.guardandoHabilidad || habilidad?.idHabilidad == null) return;

      this.guardandoHabilidad = true;
      this.errorHabilidades = "";
      this.exitoHabilidades = "";

      try {
        await perfilService.quitarHabilidad(
          this.idPerfil,
          habilidad.idHabilidad
        );
        this.habilidadesActuales = this.habilidadesActuales.filter(
          (item) =>
            String(item.idHabilidad) !== String(habilidad.idHabilidad)
        );
        this.sincronizarNombresHabilidades();
        this.exitoHabilidades = "Habilidad quitada correctamente.";
      } catch (error) {
        const status = error?.response?.status;
        const mensaje = error?.response?.data?.message || "";

        if (status === 409) {
          this.errorHabilidades =
            mensaje || "La habilidad ya no está asociada a este perfil.";
          await this.cargarHabilidadesPerfil();
        } else if (status === 404) {
          this.errorHabilidades =
            mensaje || "La habilidad o el perfil ya no existen.";
          await Promise.all([
            this.cargarHabilidadesCatalogo(),
            this.cargarHabilidadesPerfil(),
          ]);
        } else if (status === 403) {
          this.errorHabilidades =
            mensaje || "No tenés permiso para modificar este perfil.";
        } else {
          this.errorHabilidades =
            mensaje || "No se pudo quitar la habilidad. Intentá nuevamente.";
        }
      } finally {
        this.guardandoHabilidad = false;
      }
    },
    async cargarCaracteristicas(idProfesion) {
      this.cargandoCaracteristicas = true;
      try {
        const response = await perfilService.caracteristicasPorProfesion(idProfesion);
        const datos = response?.data;
        this.caracteristicas = Array.isArray(datos) ? datos : datos?.caracteristicas || [];
 
        const valoresActuales = {};
        (this.perfil?.caracteristicas || []).forEach((c) => {
          valoresActuales[c.idCaracteristica] = {
            valor: c.valor != null ? String(c.valor) : "",
            idValor: c.idValor != null ? c.idValor : null,
          };
        });
 
        this.form.caracteristicas = {};
        this.caracteristicas.forEach((carac) => {
          this.form.caracteristicas[carac.idCaracteristica] = {
            valor: valoresActuales[carac.idCaracteristica]?.valor || "",
            idValor: valoresActuales[carac.idCaracteristica]?.idValor ?? null,
          };
        });
 
        this.$nextTick(() => {
          this.$refs.form?.resetValidation?.();
        });
      } catch (error) {
        this.mensajeError =
          error?.response?.data?.message ||
          "No se pudieron cargar las características de la profesión.";
      } finally {
        this.cargandoCaracteristicas = false;
      }
    },
    esEnumerado(carac) {
      return carac.tipoDato === "ENUMERADO";
    },
    esNumerico(carac) {
      return carac.tipoDato === "NUMERICO";
    },

    reglasCampo(carac) {
      const lista = [this.reglas.requerido];
      const permitido = tipoDatoUnidad(carac?.unidad);
      if (this.esNumerico(carac) && (permitido === "" || permitido === "NUMERICO")) {
        lista.push(this.reglas.numerico);
      }
      return lista;
    },
    labelCaracteristica(codigo) {
      if (!codigo) return codigo;
      const n = normCodigo(codigo);
      if (ETIQUETAS_CARACTERISTICAS[n]) return ETIQUETAS_CARACTERISTICAS[n];
      return this.capitalizarEtiqueta(codigo);
    },
    labelValor(codigo) {
      if (!codigo) return codigo;
      const n = normCodigo(codigo);
      if (ETIQUETAS_VALORES[n]) return ETIQUETAS_VALORES[n];
      return this.capitalizarEtiqueta(codigo);
    },
    capitalizarEtiqueta(texto) {
      const palabras = String(texto).toLowerCase().split(/[_\-]+/).filter(Boolean);
      const capitalizadas = palabras.map((p) => p.charAt(0).toUpperCase() + p.slice(1));
      return capitalizadas.join(" ");
    },
    etiquetaCaracteristica(carac) {
      const base = this.labelCaracteristica(carac.codigo);
      const unidad = carac?.unidad;
      if (!unidad) return base;
      if (esUnidadColor(unidad)) return base;
      const simbolo = simboloUnidad(unidad);
      if (!simbolo) return base;
      return `${base} (${simbolo})`;
    },
    getValorById(carac, idValor) {
      if (idValor == null || !carac || !Array.isArray(carac.valores)) return null;
      return carac.valores.find((v) => v.idValor === idValor) || null;
    },
    seleccionarFoto(event) {
      const archivo = event.target.files?.[0];
      if (!archivo) return;
      this.mensajeError = "";
      if (!archivo.type.startsWith("image/")) {
        this.mensajeError = "La foto debe ser una imagen (JPG, PNG, WEBP...).";
        event.target.value = "";
        return;
      }
      if (archivo.size > 10 * 1024 * 1024) {
        this.mensajeError = "La imagen no puede superar los 10 MB.";
        event.target.value = "";
        return;
      }
      this.liberarPreview();
      this.fotoArchivo = archivo;
      this.fotoPreview = URL.createObjectURL(archivo);
    },

    limpiarFoto() {
      this.fotoArchivo = null;
      this.liberarPreview();
      if (this.$refs.inputFoto) this.$refs.inputFoto.value = "";
    },

    liberarPreview() {
      if (this.fotoPreview) {
        URL.revokeObjectURL(this.fotoPreview);
        this.fotoPreview = null;
      }
    },

    async eliminarFoto() {
      this.eliminandoFoto = true;
      try {
        await perfilService.eliminarFoto(this.idPerfil);
        this.perfil.fotoUrl = null;
        this.modalEliminarFoto = false;
        this.mensajeExito = "Foto eliminada correctamente.";
      } catch (error) {
        this.mensajeError =
          error?.response?.data?.message || "No se pudo eliminar la foto.";
      } finally {
        this.eliminandoFoto = false;
      }
    },

    async guardar() {
      const isValid = this.$refs.form.validate();
      if (!isValid) return;
 
      this.mensajeExito = "";
      this.mensajeError = "";
      this.cargando = true;
 
      const caracteristicas = this.caracteristicas
        .map((carac) => {
          const entrada = this.form.caracteristicas[carac.idCaracteristica] || {};
          if (this.esEnumerado(carac)) {
            return {
              idCaracteristica: carac.idCaracteristica,
              idValor: entrada.idValor,
            };
          }
          return {
            idCaracteristica: carac.idCaracteristica,
            valor: entrada.valor,
          };
        })
        .filter((item) => item.idValor != null || (item.valor != null && item.valor !== ""));
 
      const request = {
        nombreArtistico: this.form.nombreArtistico.trim(),
        biografia: this.form.biografia.trim(),
        caracteristicas,
      };
 
      try {
        await perfilService.editar(this.idPerfil, request);

        if (this.fotoArchivo) {
          try {
            await perfilService.subirFoto(this.idPerfil, this.fotoArchivo);
            this.mensajeExito = "Perfil y foto actualizados correctamente.";
            const res = await perfilService.obtener(this.idPerfil).catch(() => null);
            if (res?.data) this.perfil = res.data;
          } catch {
            this.mensajeExito = "Perfil actualizado, pero no se pudo subir la foto. Intentá nuevamente.";
          }
          this.limpiarFoto();
        } else {
          this.mensajeExito = "Perfil actualizado correctamente.";
        }

        setTimeout(() => {
          this.$router.push({ name: this.rutaVolver });
        }, 1200);
      } catch (error) {
        const errores = error?.response?.data?.errores;
        this.mensajeError =
          error?.response?.data?.message || "No se pudo actualizar el perfil. Intentá nuevamente.";
        if (errores) {
          this.mensajeError = `${this.mensajeError} ${JSON.stringify(errores)}`;
        }
      } finally {
        this.cargando = false;
      }
    },
    volver() {
      this.$router.push({ name: this.rutaVolver });
    },
  },
};
</script>
 
<style scoped>
.editar-perfil {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
}

.editar-perfil__header {
  padding: 1.5rem 1.75rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.editar-perfil__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: clamp(1.5rem, 2vw, 1.85rem);
  font-weight: 700;
  line-height: 1.2;
}

.editar-perfil__subtitulo {
  margin: 0.35rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  line-height: 1.45;
}

.editar-perfil__panel {
  padding: 1.5rem 1.75rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.editar-perfil__foto {
  display: flex;
  align-items: center;
  gap: 1.1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--color-border-soft);
}

.editar-perfil__foto-img {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.editar-perfil__foto-img--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  background: var(--color-surface-muted);
}

.editar-perfil__foto-img--placeholder .material-symbols-outlined {
  font-size: 1.7rem;
}

.editar-perfil__foto-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.editar-perfil__nombre-artistico {
  color: var(--color-text);
  font-size: 1.05rem;
  font-weight: 600;
}

.editar-perfil__foto-aviso {
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.editar-perfil__foto-acciones {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  margin-top: 0.35rem;
}

.editar-perfil__foto-accion {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0;
  color: var(--color-primary);
  background: transparent;
  border: 0;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.editar-perfil__foto-accion:hover {
  text-decoration: underline;
}

.editar-perfil__foto-accion .material-symbols-outlined {
  font-size: 1rem;
}

.editar-perfil__foto-accion--peligro {
  color: var(--color-danger-text);
}

.editar-perfil__foto-input {
  display: none;
}

.editar-perfil__form :deep(.va-input-label) {
  color: var(--color-text-muted);
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.editar-perfil__modal-acciones {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.editar-perfil__form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.editar-perfil__campos {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.editar-perfil__contador {
  margin: 0.35rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.72rem;
  text-align: right;
}

.editar-perfil__campo-caracteristica :deep(.va-input-wrapper__field) {
  min-height: 40px;
}

.editar-perfil__medidas-linea {
  display: block;
}

.editar-perfil__fila-medidas {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.85rem;
}

.editar-perfil__opcion {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.editar-perfil__swatch {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
  vertical-align: middle;
}

@media (max-width: 900px) {
  .editar-perfil__fila-medidas {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .editar-perfil__header,
  .editar-perfil__panel {
    padding: 1.25rem;
  }

  .editar-perfil__foto {
    align-items: flex-start;
  }

  .editar-perfil__acciones {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .editar-perfil__cancelar {
    padding: 0.5rem 0.25rem;
    text-align: center;
  }
}

.editar-perfil__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem 1rem;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.editar-perfil__estado-icono {
  font-size: 2rem;
}

.editar-perfil__acciones {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1.25rem;
  padding-top: 0.5rem;
}

.editar-perfil__cancelar {
  padding: 0.35rem 0.25rem;
  color: var(--color-primary);
  background: transparent;
  border: 0;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.editar-perfil__cancelar:hover:not(:disabled) {
  text-decoration: underline;
}

.editar-perfil__cancelar:disabled {
  color: var(--color-text-subtle);
  cursor: not-allowed;
  opacity: 0.7;
}

.editar-perfil__habilidades {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem 1.1rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface-soft);
}

.editar-perfil__habilidades-cabecera {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.editar-perfil__habilidades-titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1rem;
}

.editar-perfil__habilidades-ayuda {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.editar-perfil__habilidades-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.editar-perfil__habilidad-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.35rem 0.2rem 0.65rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 0.78rem;
}

.editar-perfil__habilidad-quitar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.05rem;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
}

.editar-perfil__habilidad-quitar:hover:not(:disabled) {
  background: var(--color-danger-soft);
  color: var(--color-danger-text);
}

.editar-perfil__habilidad-quitar:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.editar-perfil__habilidad-quitar .material-symbols-outlined {
  font-size: 0.95rem;
}

.editar-perfil__habilidad-agregar {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.editar-perfil__habilidad-agregar > :first-child {
  flex: 1 1 240px;
}

.editar-perfil__habilidades-vacio {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.editar-perfil__alertas-wrapper {
  display: grid;
  grid-template-rows: 0fr;
  min-height: 0;
  transition: grid-template-rows 0.25s ease;
}

.editar-perfil__alertas-wrapper--visible {
  grid-template-rows: 1fr;
}

.editar-perfil__alertas {
  overflow: hidden;
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.editar-perfil__alertas-wrapper--visible .editar-perfil__alertas {
  padding-top: 0.15rem;
}

.editar-perfil__alertas > * {
  width: 100% !important;
  box-sizing: border-box;
  text-align: left;
}
</style>
 
