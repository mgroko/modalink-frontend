<template>
  <div class="crear-perfil">
    <header class="crear-perfil__header">
      <h1 class="crear-perfil__titulo">{{ tituloPantalla }}</h1>
      <p class="crear-perfil__subtitulo">{{ subtituloPantalla }}</p>
    </header>

    <div class="crear-perfil__stepper" aria-label="Progreso del formulario">
      <div
        class="crear-perfil__paso"
        :class="clasesPaso(1)"
        :aria-current="paso === 1 ? 'step' : undefined"
      >
        <span class="crear-perfil__paso-numero" :class="clasesNumero(1)">
          <span
            v-if="paso > 1"
            class="material-symbols-outlined"
            aria-hidden="true"
          >
            check
          </span>
          <template v-else>1</template>
        </span>
        <span>Datos generales</span>
      </div>

      <div
        class="crear-perfil__paso-linea"
        :class="{ 'crear-perfil__paso-linea--activa': paso > 1 }"
      ></div>

      <div
        class="crear-perfil__paso"
        :class="clasesPaso(2)"
        :aria-current="paso === 2 ? 'step' : undefined"
      >
        <span class="crear-perfil__paso-numero" :class="clasesNumero(2)">2</span>
        <span>Características y habilidades</span>
      </div>
    </div>

    <VaForm
      ref="form"
      :immediate="false"
      class="crear-perfil__form"
      @submit.prevent="paso === 1 ? irPaso2() : guardar()"
    >
      <template v-if="paso === 1">
        <section class="crear-perfil__card crear-perfil__datos">
          <div class="crear-perfil__avatar-columna">
            <div class="crear-perfil__avatar-wrapper">
              <img
                v-if="fotoPreview"
                :src="fotoPreview"
                alt="Vista previa de la foto de perfil"
                class="crear-perfil__avatar-img"
              />
              <span v-else class="crear-perfil__avatar-iniciales" aria-hidden="true">
                {{ inicialesPerfil }}
              </span>

              <input
                ref="inputFoto"
                type="file"
                accept="image/*"
                class="crear-perfil__foto-input"
                @change="seleccionarFoto"
              />
              <button
                type="button"
                class="crear-perfil__avatar-camara"
                :aria-label="fotoPreview ? 'Cambiar foto' : 'Subir foto'"
                title="Subir foto"
                @click="$refs.inputFoto.click()"
              >
                <span class="material-symbols-outlined" aria-hidden="true">
                  photo_camera
                </span>
              </button>
            </div>

            <span class="crear-perfil__avatar-opcional">Opcional</span>
            <button
              v-if="fotoPreview"
              type="button"
              class="crear-perfil__avatar-quitar"
              @click="limpiarFoto"
            >
              Quitar
            </button>
          </div>

          <div class="crear-perfil__datos-campo">
            <VaInput
              v-model="form.nombreArtistico"
              :rules="[reglas.requerido, reglas.min2, reglas.max50]"
              label="Nombre artístico"
              type="text"
              placeholder="Ej: Serena Lopez"
            />
            <p class="crear-perfil__ayuda">
              Así te van a ver en búsquedas y proyectos. Podés cambiarlo después.
            </p>
          </div>
        </section>

        <section class="crear-perfil__card">
          <header class="crear-perfil__card-header">
            <h2 class="crear-perfil__card-titulo">
              ¿Con qué profesión querés crear este perfil?
            </h2>
            <p class="crear-perfil__card-sub">
              Define qué características y habilidades te pedimos en el siguiente paso.
            </p>
          </header>

          <div v-if="cargandoProfesiones" class="crear-perfil__estado">
            <span class="material-symbols-outlined crear-perfil__estado-icono">
              hourglass_empty
            </span>
            Cargando profesiones...
          </div>

          <div
            v-else-if="profesionesDisponibles.length"
            class="crear-perfil__profesiones"
            role="radiogroup"
            aria-label="Profesión del perfil"
          >
            <button
              v-for="profesion in profesionesDisponibles"
              :key="profesion.idProfesion"
              type="button"
              role="radio"
              class="crear-perfil__profesion"
              :class="{
                'crear-perfil__profesion--activa':
                  form.idProfesion === profesion.idProfesion,
                'crear-perfil__profesion--ocupada': profesion.disabled,
              }"
              :aria-checked="
                form.idProfesion === profesion.idProfesion ? 'true' : 'false'
              "
              :disabled="profesion.disabled"
              :title="
                profesion.disabled
                  ? 'Ya tenés un perfil con esta profesión'
                  : undefined
              "
              @click="seleccionarProfesion(profesion)"
            >
              <span class="material-symbols-outlined" aria-hidden="true">
                {{ iconoProfesion(profesion.nombre) }}
              </span>
              <span>{{ nombreProfesion(profesion.nombre) }}</span>
            </button>
          </div>

          <p v-else class="crear-perfil__skills-vacio">
            No hay profesiones disponibles para crear un perfil.
          </p>

          <p v-if="errorProfesion" class="crear-perfil__error">
            {{ errorProfesion }}
          </p>
        </section>
      </template>

      <template v-else>
        <section
          v-if="cargandoCaracteristicas"
          class="crear-perfil__card crear-perfil__estado"
        >
          <span class="material-symbols-outlined crear-perfil__estado-icono">
            hourglass_empty
          </span>
          Cargando características...
        </section>

        <template v-else>
          <section
            v-if="caracteristicasMedidasCard.length"
            class="crear-perfil__card"
          >
            <header class="crear-perfil__card-header">
              <h2 class="crear-perfil__card-titulo">Medidas</h2>
              <p class="crear-perfil__card-sub">En centímetros.</p>
            </header>

            <div class="crear-perfil__grid crear-perfil__grid--4">
              <div
                v-for="carac in caracteristicasMedidasCard"
                :key="carac.idCaracteristica"
              >
                <VaSelect
                  v-if="esEnumerado(carac)"
                  v-model="form.caracteristicas[carac.idCaracteristica].idValor"
                  :options="carac.valores || []"
                  value-by="idValor"
                  :text-by="(option) => labelValor(option.codigo)"
                  :rules="[reglas.requerido]"
                  :label="etiquetaCaracteristica(carac)"
                  placeholder="Seleccioná"
                />
                <VaInput
                  v-else
                  v-model="form.caracteristicas[carac.idCaracteristica].valor"
                  :rules="reglasCampo(carac)"
                  :label="etiquetaCaracteristica(carac)"
                  :type="esNumerico(carac) ? 'number' : 'text'"
                  placeholder="Ingresá un valor"
                >
                  <template v-if="unidadCampo(carac)" #appendInner>
                    <span class="crear-perfil__unidad">{{ unidadCampo(carac) }}</span>
                  </template>
                </VaInput>
              </div>
            </div>
          </section>

          <section
            v-if="caracteristicasApariencia.length"
            class="crear-perfil__card"
          >
            <header class="crear-perfil__card-header">
              <h2 class="crear-perfil__card-titulo">Apariencia</h2>
              <p class="crear-perfil__card-sub">
                Ayuda a que te encuentren en las búsquedas.
              </p>
            </header>

            <div class="crear-perfil__grid crear-perfil__grid--2">
              <div
                v-for="carac in caracteristicasApariencia"
                :key="carac.idCaracteristica"
              >
                <VaSelect
                  v-if="esEnumerado(carac)"
                  v-model="form.caracteristicas[carac.idCaracteristica].idValor"
                  :options="carac.valores || []"
                  value-by="idValor"
                  :text-by="(option) => labelValor(option.codigo)"
                  :rules="[reglas.requerido]"
                  :label="etiquetaCaracteristica(carac)"
                  placeholder="Seleccioná"
                >
                  <template #content="{ value }">
                    <span
                      v-if="getValorById(carac, value)"
                      class="crear-perfil__opcion"
                    >
                      <span
                        v-if="getValorById(carac, value).colorHex"
                        class="crear-perfil__swatch"
                        :style="{ background: getValorById(carac, value).colorHex }"
                      ></span>
                      {{ labelValor(getValorById(carac, value).codigo) }}
                    </span>
                  </template>
                  <template #option-content="{ option }">
                    <span class="crear-perfil__opcion">
                      <span
                        v-if="option.colorHex"
                        class="crear-perfil__swatch"
                        :style="{ background: option.colorHex }"
                      ></span>
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
                  placeholder="Ingresá un valor"
                >
                  <template v-if="unidadCampo(carac)" #appendInner>
                    <span class="crear-perfil__unidad">{{ unidadCampo(carac) }}</span>
                  </template>
                </VaInput>
              </div>
            </div>
          </section>

          <section
            v-if="caracteristicasRestantes.length"
            class="crear-perfil__card"
          >
            <header class="crear-perfil__card-header">
              <h2 class="crear-perfil__card-titulo">Otros datos</h2>
              <p class="crear-perfil__card-sub">
                Completá el resto de tus características.
              </p>
            </header>

            <div class="crear-perfil__grid crear-perfil__grid--2">
              <div
                v-for="carac in caracteristicasRestantes"
                :key="carac.idCaracteristica"
              >
                <VaSelect
                  v-if="esEnumerado(carac)"
                  v-model="form.caracteristicas[carac.idCaracteristica].idValor"
                  :options="carac.valores || []"
                  value-by="idValor"
                  :text-by="(option) => labelValor(option.codigo)"
                  :rules="[reglas.requerido]"
                  :label="etiquetaCaracteristica(carac)"
                  placeholder="Seleccioná"
                >
                  <template #content="{ value }">
                    <span
                      v-if="getValorById(carac, value)"
                      class="crear-perfil__opcion"
                    >
                      <span
                        v-if="getValorById(carac, value).colorHex"
                        class="crear-perfil__swatch"
                        :style="{ background: getValorById(carac, value).colorHex }"
                      ></span>
                      {{ labelValor(getValorById(carac, value).codigo) }}
                    </span>
                  </template>
                  <template #option-content="{ option }">
                    <span class="crear-perfil__opcion">
                      <span
                        v-if="option.colorHex"
                        class="crear-perfil__swatch"
                        :style="{ background: option.colorHex }"
                      ></span>
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
                  placeholder="Ingresá un valor"
                >
                  <template v-if="unidadCampo(carac)" #appendInner>
                    <span class="crear-perfil__unidad">{{ unidadCampo(carac) }}</span>
                  </template>
                </VaInput>
              </div>
            </div>
          </section>

          <section
            v-if="!caracteristicas.length"
            class="crear-perfil__card crear-perfil__estado"
          >
            <span class="material-symbols-outlined crear-perfil__estado-icono">
              info
            </span>
            No se encontraron características para esta profesión. Podés
            continuar con tu biografía y habilidades.
          </section>
        </template>

        <section class="crear-perfil__card">
          <header class="crear-perfil__card-header">
            <h2 class="crear-perfil__card-titulo">Sobre vos</h2>
            <p class="crear-perfil__card-sub">Tu trayectoria en pocas líneas.</p>
          </header>

          <VaInput
            class="crear-perfil__biografia"
            :model-value="form.biografia"
            :rules="[reglas.requerido, reglas.max200]"
            type="textarea"
            label="Biografía"
            placeholder="Contá tu experiencia, tipo de trabajos y disponibilidad..."
            maxlength="200"
            @update:model-value="actualizarBiografia"
          />
          <p class="crear-perfil__contador">{{ form.biografia.length }} / 200</p>
        </section>

        <section class="crear-perfil__card">
          <header class="crear-perfil__skills-header">
            <div>
              <h2 class="crear-perfil__card-titulo">Habilidades</h2>
              <p class="crear-perfil__card-sub">Elegí las que apliquen.</p>
            </div>
            <span class="crear-perfil__skills-contador">
              {{ habilidadesSeleccionadas.length }} de {{ MAX_HABILIDADES }}
            </span>
          </header>

          <div v-if="cargandoHabilidades" class="crear-perfil__estado">
            <span class="material-symbols-outlined crear-perfil__estado-icono">
              hourglass_empty
            </span>
            Cargando habilidades...
          </div>

          <template v-else>
            <BaseAlert
              v-if="errorHabilidades"
              :message="errorHabilidades"
              type="error"
            />
            <VaButton
              v-if="errorHabilidades"
              class="crear-perfil__skills-reintentar"
              preset="secondary"
              size="small"
              type="button"
              icon="mso-refresh"
              @click="cargarHabilidades"
            >
              Reintentar
            </VaButton>

            <div class="crear-perfil__skills-grupo">
              <span class="crear-perfil__skills-label">Seleccionadas</span>
              <div class="crear-perfil__skills-seleccionadas">
                <button
                  v-for="habilidad in habilidadesSeleccionadas"
                  :key="habilidad.idHabilidad"
                  type="button"
                  class="crear-perfil__chip crear-perfil__chip--seleccionada"
                  :aria-label="`Quitar ${habilidad.nombre}`"
                  @click="quitarHabilidad(habilidad)"
                >
                  {{ habilidad.nombre }}
                  <span class="material-symbols-outlined" aria-hidden="true">
                    close
                  </span>
                </button>
                <span
                  v-if="!habilidadesSeleccionadas.length"
                  class="crear-perfil__skills-vacio"
                >
                  Todavía no elegiste ninguna
                </span>
              </div>
            </div>

            <div class="crear-perfil__skills-grupo">
              <span class="crear-perfil__skills-label">Disponibles</span>
              <div
                v-if="habilidadesDisponibles.length"
                class="crear-perfil__chips"
              >
                <button
                  v-for="habilidad in habilidadesDisponibles"
                  :key="habilidad.idHabilidad"
                  type="button"
                  class="crear-perfil__chip"
                  :disabled="!puedeSeleccionarMas"
                  :aria-label="`Agregar ${habilidad.nombre}`"
                  @click="agregarHabilidad(habilidad)"
                >
                  {{ habilidad.nombre }}
                </button>
              </div>
              <p
                v-else-if="habilidadesCatalogo.length"
                class="crear-perfil__skills-vacio"
              >
                Ya seleccionaste todas las habilidades disponibles.
              </p>
              <p v-else class="crear-perfil__skills-vacio">
                No hay habilidades disponibles en el catálogo.
              </p>
            </div>

            <p v-if="!puedeSeleccionarMas" class="crear-perfil__ayuda">
              Máximo {{ MAX_HABILIDADES }} habilidades.
            </p>
          </template>
        </section>
      </template>

      <div v-if="mensajeExito || mensajeError" class="crear-perfil__alertas">
        <BaseAlert v-if="mensajeExito" :message="mensajeExito" type="success" />
        <BaseAlert v-if="mensajeError" :message="mensajeError" type="error" />
      </div>

      <div class="crear-perfil__acciones">
        <template v-if="paso === 1">
          <button
            type="button"
            class="crear-perfil__cancelar"
            @click="volver"
          >
            Cancelar
          </button>
          <VaButton type="submit" icon-right="mso-arrow_forward">
            Siguiente
          </VaButton>
        </template>
        <template v-else>
          <VaButton
            preset="secondary"
            type="button"
            icon="mso-arrow_back"
            @click="volverPaso1"
          >
            Atrás
          </VaButton>
          <VaButton type="submit" :loading="cargando">Crear perfil</VaButton>
        </template>
      </div>
    </VaForm>
  </div>
</template>

<script>
import perfilService from "../../services/perfilService.js";
import habilidadService from "../../services/habilidadService.js";
import { refrescarSesion } from "../../services/authState.js";
import BaseAlert from "../../components/AlertaBase.vue";
import {
  ETIQUETAS_CARACTERISTICAS,
  ETIQUETAS_VALORES,
  ORDEN_PRIORIDAD,
  UNIDADES_POR_CODIGO,
  normCodigo,
  normTexto,
  simboloUnidad,
  esUnidadColor,
  tipoDatoUnidad,
} from "../../utils/perfilConstants.js";
import { reglasPerfil } from "../../utils/reglas.js";

const MAX_HABILIDADES = 10;

const CODIGOS_APARIENCIA = new Set([
  "color_piel",
  "piel",
  "color_ojos",
  "ojos",
  "color_cabello",
  "cabello",
  "pelo",
  "tipo_cabello",
  "tipo_de_cabello",
  "tipo_cabello_2",
]);

const ORDEN_APARIENCIA = {
  color_piel: 10,
  piel: 10,
  color_ojos: 20,
  ojos: 20,
  color_cabello: 30,
  cabello: 30,
  pelo: 30,
  tipo_cabello: 40,
  tipo_de_cabello: 40,
  tipo_cabello_2: 40,
};

export default {
  name: "CrearPerfilView",
  components: {
    BaseAlert,
  },
  data() {
    return {
      paso: 1,
      profesiones: [],
      profesionesOcupadas: new Set(),
      cargandoProfesiones: false,
      cargandoCaracteristicas: false,
      caracteristicas: [],
      habilidadesCatalogo: [],
      habilidadesSeleccionadas: [],
      cargandoHabilidades: false,
      errorHabilidades: "",
      form: {
        nombreArtistico: "",
        idProfesion: null,
        biografia: "",
        caracteristicas: {},
      },
      cargando: false,
      mensajeExito: "",
      mensajeError: "",
      errorProfesion: "",
      fotoArchivo: null,
      fotoPreview: null,
      reglas: reglasPerfil,
      MAX_HABILIDADES,
    };
  },
  computed: {
    profesionSeleccionada() {
      return (
        this.profesiones.find(
          (profesion) => profesion.idProfesion === this.form.idProfesion
        ) || null
      );
    },
    tituloPantalla() {
      if (this.paso === 1) return "Crear nuevo perfil";
      if (!this.profesionSeleccionada) return "Crear nuevo perfil";
      return `Crear perfil de ${this.capitalizarEtiqueta(
        this.profesionSeleccionada.nombre
      ).toLowerCase()}`;
    },
    subtituloPantalla() {
      return this.paso === 1
        ? "Empecemos por lo básico. Después vas a completar tus características."
        : "Completá tus características y contanos qué sabés hacer.";
    },
    inicialesPerfil() {
      const palabras = String(this.form.nombreArtistico || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);
      if (!palabras.length) return "?";
      return palabras
        .slice(0, 2)
        .map((palabra) => palabra.charAt(0).toUpperCase())
        .join("");
    },
    profesionesDisponibles() {
      return this.profesiones.map((profesion) => ({
        ...profesion,
        disabled: this.profesionesOcupadas.has(profesion.idProfesion),
      }));
    },
    caracteristicaAltura() {
      return (
        this.caracteristicas.find(
          (caracteristica) => normCodigo(caracteristica.codigo) === "altura"
        ) || null
      );
    },
    caracteristicasMedidas() {
      const medidas = this.caracteristicas.filter((caracteristica) => {
        const codigo = normCodigo(caracteristica.codigo);
        return [
          "medida_pecho",
          "pecho",
          "busto",
          "medida_cintura",
          "cintura",
          "medida_cadera",
          "cadera",
        ].includes(codigo);
      });

      return medidas.sort(
        (a, b) =>
          (ORDEN_PRIORIDAD[normCodigo(a.codigo)] || 99) -
          (ORDEN_PRIORIDAD[normCodigo(b.codigo)] || 99)
      );
    },
    caracteristicasMedidasCard() {
      const lista = [];
      if (this.caracteristicaAltura) lista.push(this.caracteristicaAltura);
      return [...lista, ...this.caracteristicasMedidas];
    },
    caracteristicasApariencia() {
      return this.caracteristicas
        .filter((caracteristica) =>
          CODIGOS_APARIENCIA.has(normCodigo(caracteristica.codigo))
        )
        .sort(
          (a, b) =>
            (ORDEN_APARIENCIA[normCodigo(a.codigo)] || 99) -
            (ORDEN_APARIENCIA[normCodigo(b.codigo)] || 99)
        );
    },
    caracteristicasRestantes() {
      const excluidos = new Set();
      this.caracteristicasMedidasCard.forEach((caracteristica) =>
        excluidos.add(caracteristica.idCaracteristica)
      );
      this.caracteristicasApariencia.forEach((caracteristica) =>
        excluidos.add(caracteristica.idCaracteristica)
      );

      return this.caracteristicas
        .filter(
          (caracteristica) =>
            !excluidos.has(caracteristica.idCaracteristica)
        )
        .sort(
          (a, b) =>
            (ORDEN_PRIORIDAD[normCodigo(a.codigo)] || 99) -
            (ORDEN_PRIORIDAD[normCodigo(b.codigo)] || 99)
        );
    },
    habilidadesDisponibles() {
      const seleccionadas = new Set(
        this.habilidadesSeleccionadas.map(
          (habilidad) => habilidad.idHabilidad
        )
      );
      return this.habilidadesCatalogo.filter(
        (habilidad) => !seleccionadas.has(habilidad.idHabilidad)
      );
    },
    puedeSeleccionarMas() {
      return this.habilidadesSeleccionadas.length < MAX_HABILIDADES;
    },
  },
  async mounted() {
    await this.cargarDatosIniciales();
  },
  beforeUnmount() {
    this.liberarPreview();
  },
  methods: {
    async cargarDatosIniciales() {
      this.cargandoProfesiones = true;
      try {
        const [profesionesRes, perfilesRes] = await Promise.allSettled([
          perfilService.listarProfesiones(),
          perfilService.listarMisPerfiles(),
        ]);

        if (profesionesRes.status === "fulfilled") {
          const datos = profesionesRes.value?.data;
          this.profesiones = Array.isArray(datos)
            ? datos
            : datos?.profesiones || [];
        } else {
          this.mensajeError =
            "No se pudieron cargar las profesiones. Intentá nuevamente.";
        }

        if (perfilesRes.status === "fulfilled") {
          const perfiles = Array.isArray(perfilesRes.value?.data)
            ? perfilesRes.value.data
            : [];
          this.profesionesOcupadas = new Set(
            perfiles
              .map((perfil) => {
                const nombreNorm = normTexto(perfil.profesion);
                const encontrada = this.profesiones.find(
                  (profesion) =>
                    normTexto(profesion.nombre) === nombreNorm
                );
                return encontrada?.idProfesion;
              })
              .filter((id) => id != null)
          );
        }
      } catch {
        this.mensajeError = "No se pudieron cargar los datos iniciales.";
      } finally {
        this.cargandoProfesiones = false;
      }
    },

    async cargarHabilidades() {
      this.cargandoHabilidades = true;
      this.errorHabilidades = "";

      try {
        const response = await habilidadService.listar();
        const datos = response?.data;
        this.habilidadesCatalogo = Array.isArray(datos)
          ? datos
          : datos?.habilidades || [];
      } catch {
        this.habilidadesCatalogo = [];
        this.errorHabilidades =
          "No se pudo cargar el catálogo de habilidades.";
      } finally {
        this.cargandoHabilidades = false;
      }
    },

    seleccionarProfesion(profesion) {
      if (!profesion || profesion.disabled) return;
      this.form.idProfesion = profesion.idProfesion;
      this.errorProfesion = "";
    },

    iconoProfesion(nombre) {
      const normalizado = normTexto(nombre);
      if (normalizado.includes("productor")) return "assignment";
      if (normalizado.includes("disen")) return "content_cut";
      if (normalizado.includes("model")) return "checkroom";
      if (normalizado.includes("foto")) return "photo_camera";
      if (normalizado.includes("maquill")) return "brush";
      if (normalizado.includes("estil")) return "checkroom";
      if (normalizado.includes("pein")) return "content_cut";
      if (normalizado.includes("moda")) return "content_cut";
      return "person";
    },

    async irPaso2() {
      const esValido = this.$refs.form.validate();
      if (!esValido) return;

      if (!this.form.idProfesion) {
        this.errorProfesion = "Seleccioná una profesión para continuar.";
        return;
      }

      this.mensajeExito = "";
      this.mensajeError = "";
      this.errorHabilidades = "";

      if (await this.usuarioTienePerfilConProfesion(this.form.idProfesion)) {
        this.mensajeError =
          "Ya tenés un perfil con esta profesión. Podés modificar el perfil existente.";
        return;
      }

      this.cargandoCaracteristicas = true;
      this.cargandoHabilidades = true;

      try {
        const [caracteristicasRes, habilidadesRes] = await Promise.allSettled([
          perfilService.caracteristicasPorProfesion(this.form.idProfesion),
          habilidadService.listar(),
        ]);

        if (caracteristicasRes.status !== "fulfilled") {
          const error = caracteristicasRes.reason;
          this.mensajeError =
            error?.response?.data?.message ||
            "No se pudieron cargar las características de la profesión.";
          return;
        }

        const datos = caracteristicasRes.value?.data;
        this.caracteristicas = Array.isArray(datos)
          ? datos
          : datos?.caracteristicas || [];

        this.form.caracteristicas = {};
        this.caracteristicas.forEach((caracteristica) => {
          this.form.caracteristicas[caracteristica.idCaracteristica] = {
            valor: "",
            idValor: null,
          };
        });

        if (habilidadesRes.status === "fulfilled") {
          const datosHabilidades = habilidadesRes.value?.data;
          this.habilidadesCatalogo = Array.isArray(datosHabilidades)
            ? datosHabilidades
            : datosHabilidades?.habilidades || [];
        } else {
          this.habilidadesCatalogo = [];
          this.errorHabilidades =
            "No se pudo cargar el catálogo de habilidades.";
        }

        this.paso = 2;
        this.$nextTick(() => {
          this.$refs.form?.resetValidation?.();
        });
      } finally {
        this.cargandoCaracteristicas = false;
        this.cargandoHabilidades = false;
      }
    },

    volverPaso1() {
      this.paso = 1;
      this.mensajeError = "";
      this.mensajeExito = "";
      this.errorProfesion = "";
    },

    esEnumerado(caracteristica) {
      return caracteristica.tipoDato === "ENUMERADO";
    },

    esNumerico(caracteristica) {
      return caracteristica.tipoDato === "NUMERICO";
    },

    reglasCampo(caracteristica) {
      const lista = [this.reglas.requerido];
      const permitido = tipoDatoUnidad(caracteristica?.unidad);
      if (
        this.esNumerico(caracteristica) &&
        (permitido === "" || permitido === "NUMERICO")
      ) {
        lista.push(this.reglas.numerico);
      }
      return lista;
    },

    async usuarioTienePerfilConProfesion(idProfesion) {
      return this.profesionesOcupadas.has(idProfesion);
    },

    labelCaracteristica(codigo) {
      if (!codigo) return codigo;
      const normalizado = normCodigo(codigo);
      if (ETIQUETAS_CARACTERISTICAS[normalizado]) {
        return ETIQUETAS_CARACTERISTICAS[normalizado];
      }
      return this.capitalizarEtiqueta(codigo);
    },

    labelValor(codigo) {
      if (!codigo) return codigo;
      const normalizado = normCodigo(codigo);
      if (ETIQUETAS_VALORES[normalizado]) {
        return ETIQUETAS_VALORES[normalizado];
      }
      return this.capitalizarEtiqueta(codigo);
    },

    capitalizarEtiqueta(texto) {
      const palabras = String(texto)
        .toLowerCase()
        .split(/[_\-]+/)
        .filter(Boolean);
      const capitalizadas = palabras.map(
        (palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1)
      );
      return capitalizadas.join(" ");
    },

    nombreProfesion(nombre) {
      const texto = String(nombre || "").trim();
      if (!texto) return "";
      return texto.charAt(0).toUpperCase() + texto.slice(1);
    },

    etiquetaCaracteristica(caracteristica) {
      return this.labelCaracteristica(caracteristica.codigo);
    },

    unidadCampo(caracteristica) {
      if (!caracteristica) return "";
      if (esUnidadColor(caracteristica.unidad)) return "";

      const simbolo = simboloUnidad(caracteristica.unidad);
      if (simbolo) return simbolo;

      return (
        UNIDADES_POR_CODIGO[normCodigo(caracteristica.codigo)] || ""
      );
    },

    getValorById(caracteristica, idValor) {
      if (
        idValor == null ||
        !caracteristica ||
        !Array.isArray(caracteristica.valores)
      ) {
        return null;
      }
      return (
        caracteristica.valores.find((valor) => valor.idValor === idValor) ||
        null
      );
    },

    actualizarBiografia(valor) {
      this.form.biografia = String(valor || "").slice(0, 200);
    },

    quitarHabilidad(habilidad) {
      this.habilidadesSeleccionadas = this.habilidadesSeleccionadas.filter(
        (seleccionada) =>
          seleccionada.idHabilidad !== habilidad.idHabilidad
      );
    },

    agregarHabilidad(habilidad) {
      if (!habilidad || !this.puedeSeleccionarMas) return;
      if (
        this.habilidadesSeleccionadas.some(
          (seleccionada) =>
            seleccionada.idHabilidad === habilidad.idHabilidad
        )
      ) {
        return;
      }
      this.habilidadesSeleccionadas.push(habilidad);
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

    async resolverIdNuevoPerfil(dataCruda, nombreArtistico) {
      if (typeof dataCruda === "number") return dataCruda;
      if (dataCruda?.idPerfil != null) return dataCruda.idPerfil;
      if (dataCruda?.id != null) return dataCruda.id;
      try {
        const response = await perfilService.listarMisPerfiles();
        const perfiles = Array.isArray(response?.data) ? response.data : [];
        return (
          perfiles.find(
            (perfil) => perfil.nombreArtistico === nombreArtistico
          )?.idPerfil ?? null
        );
      } catch {
        return null;
      }
    },

    async asociarHabilidades(idPerfil) {
      if (!this.habilidadesSeleccionadas.length) return 0;
      const resultados = await Promise.allSettled(
        this.habilidadesSeleccionadas.map((habilidad) =>
          perfilService.agregarHabilidad(idPerfil, habilidad.idHabilidad)
        )
      );
      return resultados.filter(
        (resultado) => resultado.status === "rejected"
      ).length;
    },

    async guardar() {
      const esValido = this.$refs.form.validate();
      if (!esValido) return;

      this.mensajeExito = "";
      this.mensajeError = "";
      this.cargando = true;

      const caracteristicas = this.caracteristicas
        .map((caracteristica) => {
          const entrada =
            this.form.caracteristicas[caracteristica.idCaracteristica] || {};
          if (this.esEnumerado(caracteristica)) {
            return {
              idCaracteristica: caracteristica.idCaracteristica,
              idValor: entrada.idValor,
            };
          }
          return {
            idCaracteristica: caracteristica.idCaracteristica,
            valor: entrada.valor,
          };
        })
        .filter(
          (item) =>
            item.idValor != null ||
            (item.valor != null && item.valor !== "")
        );

      const request = {
        nombreArtistico: this.form.nombreArtistico.trim(),
        idProfesion: this.form.idProfesion,
        biografia: this.form.biografia.trim(),
        caracteristicas,
      };

      try {
        const response = await perfilService.crear(request);
        await refrescarSesion();

        let avisoFoto = "";
        let avisoHabilidades = "";
        const idNuevo = await this.resolverIdNuevoPerfil(
          response?.data,
          request.nombreArtistico
        );

        if (idNuevo != null) {
          const tareas = [];

          if (this.fotoArchivo) {
            tareas.push(
              perfilService
                .subirFoto(idNuevo, this.fotoArchivo)
                .catch(() => {
                  avisoFoto =
                    " No se pudo subir la foto; podés reintentarlo desde editar perfil.";
                })
            );
          }

          if (this.habilidadesSeleccionadas.length) {
            tareas.push(
              this.asociarHabilidades(idNuevo).then((fallos) => {
                if (fallos > 0) {
                  avisoHabilidades = ` No se pudieron asociar ${fallos} ${
                    fallos === 1 ? "habilidad" : "habilidades"
                  }; podés reintentarlo desde editar perfil.`;
                }
              })
            );
          }

          await Promise.all(tareas);
          this.limpiarFoto();
        } else if (
          this.fotoArchivo ||
          this.habilidadesSeleccionadas.length
        ) {
          if (this.fotoArchivo) {
            avisoFoto =
              " No se pudo asociar la foto; subila desde editar perfil.";
          }
          if (this.habilidadesSeleccionadas.length) {
            avisoHabilidades =
              " No se pudieron asociar las habilidades; agregalas desde editar perfil.";
          }
        }

        this.mensajeExito = `Perfil creado correctamente.${avisoFoto}${avisoHabilidades}`;
        setTimeout(() => {
          this.$router.push({ name: "dashboard-usuario" });
        }, 1200);
      } catch (error) {
        this.mensajeError =
          error?.response?.data?.message ||
          "No se pudo crear el perfil. Intentá nuevamente.";
      } finally {
        this.cargando = false;
      }
    },

    volver() {
      this.$router.push({ name: "dashboard-usuario" });
    },

    clasesPaso(numero) {
      return {
        "crear-perfil__paso--activo": this.paso === numero,
        "crear-perfil__paso--completo": this.paso > numero,
      };
    },

    clasesNumero(numero) {
      return {
        "crear-perfil__paso-numero--activo": this.paso === numero,
        "crear-perfil__paso-numero--completo": this.paso > numero,
      };
    },
  },
};
</script>

<style scoped>
.crear-perfil {
  width: 100%;
  max-width: 980px;
  margin: 0 auto;
  padding: 1.5rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: 0 1px 3px var(--color-shadow);
}

.crear-perfil__header {
  margin-bottom: 1.25rem;
}

.crear-perfil__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1.5rem;
  font-weight: 700;
}

.crear-perfil__subtitulo {
  margin: 0.25rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.crear-perfil__stepper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.crear-perfil__paso {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text-muted);
  font-size: 0.82rem;
  white-space: nowrap;
}

.crear-perfil__paso--activo {
  color: var(--color-text);
  font-weight: 600;
}

.crear-perfil__paso--completo {
  color: var(--color-text-muted);
}

.crear-perfil__paso-numero {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--color-border-strong);
  border-radius: 50%;
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-size: 0.78rem;
  font-weight: 700;
}

.crear-perfil__paso-numero--activo {
  border-color: transparent;
  background: var(--color-primary-fill);
  color: var(--color-on-primary);
}

.crear-perfil__paso-numero--completo {
  border-color: transparent;
  background: var(--color-success-soft);
  color: var(--color-success-text);
}

.crear-perfil__paso-numero .material-symbols-outlined {
  font-size: 1rem;
}

.crear-perfil__paso-linea {
  flex: 1;
  min-width: 1.5rem;
  height: 2px;
  border-radius: 1px;
  background: var(--color-border);
}

.crear-perfil__paso-linea--activa {
  background: var(--color-primary);
}

.crear-perfil__form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.crear-perfil__card {
  padding: 1.25rem;
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.crear-perfil__card-header {
  margin-bottom: 1rem;
}

.crear-perfil__card-titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 0.95rem;
  font-weight: 600;
}

.crear-perfil__card-sub {
  margin: 0.2rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.crear-perfil__grid {
  display: grid;
  gap: 0.85rem;
}

.crear-perfil__grid--4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.crear-perfil__grid--2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.crear-perfil__ayuda {
  margin: 0.75rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.75rem;
}

.crear-perfil__datos {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  align-items: center;
  gap: 1.5rem;
}

.crear-perfil__avatar-columna {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
}

.crear-perfil__avatar-wrapper {
  position: relative;
  width: 96px;
  height: 96px;
}

.crear-perfil__avatar-iniciales,
.crear-perfil__avatar-img {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 96px;
  height: 96px;
  border-radius: 50%;
}

.crear-perfil__avatar-iniciales {
  background: var(--color-chip);
  color: var(--color-secondary);
  font-size: 1.75rem;
  font-weight: 500;
}

.crear-perfil__avatar-img {
  object-fit: cover;
}

.crear-perfil__avatar-camara {
  position: absolute;
  right: -2px;
  bottom: -2px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 2px solid var(--color-surface-soft);
  border-radius: 50%;
  background: var(--color-primary-fill);
  color: var(--color-on-primary);
  cursor: pointer;
  transition: background 0.15s;
}

.crear-perfil__avatar-camara:hover {
  background: var(--color-primary);
}

.crear-perfil__avatar-camara:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.crear-perfil__avatar-camara .material-symbols-outlined {
  font-size: 1rem;
}

.crear-perfil__avatar-opcional {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}

.crear-perfil__avatar-quitar {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-danger-text);
  font-size: 0.72rem;
  cursor: pointer;
}

.crear-perfil__avatar-quitar:hover {
  text-decoration: underline;
}

.crear-perfil__avatar-quitar:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.crear-perfil__datos-campo {
  min-width: 0;
}

.crear-perfil__foto-input {
  display: none;
}

.crear-perfil__profesiones {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 0.5rem;
}

.crear-perfil__profesion {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.7rem;
  border: 1px solid var(--color-border-strong);
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 0.85rem;
  text-align: left;
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s,
    color 0.15s;
}

.crear-perfil__profesion:hover:not(:disabled) {
  background: var(--color-surface-muted);
}

.crear-perfil__profesion:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.crear-perfil__profesion--activa {
  padding: calc(0.7rem - 0.5px);
  border: 1.5px solid var(--color-primary);
  background: var(--color-chip);
  color: var(--color-secondary);
}

.crear-perfil__profesion--activa .material-symbols-outlined {
  color: var(--color-secondary);
}

.crear-perfil__profesion:disabled,
.crear-perfil__profesion--ocupada {
  opacity: 0.5;
  cursor: not-allowed;
}

.crear-perfil__profesion .material-symbols-outlined {
  flex: none;
  color: var(--color-text-muted);
  font-size: 1.25rem;
}

.crear-perfil__error {
  margin: 0.6rem 0 0;
  color: var(--color-danger-text);
  font-size: 0.78rem;
}

.crear-perfil__cancelar {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  cursor: pointer;
}

.crear-perfil__cancelar:hover {
  color: var(--color-text);
  text-decoration: underline;
}

.crear-perfil__cancelar:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: 4px;
}

.crear-perfil__unidad {
  color: var(--color-text-muted);
  font-size: 0.78rem;
}

.crear-perfil__opcion {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.crear-perfil__swatch {
  display: inline-block;
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 50%;
  vertical-align: middle;
}

.crear-perfil__biografia {
  display: block;
  width: 100%;
}

.crear-perfil__biografia :deep(textarea) {
  width: 100%;
  min-height: 140px;
  resize: vertical;
}

.crear-perfil__contador {
  margin: 0.35rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.72rem;
  text-align: right;
}

.crear-perfil__skills-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.crear-perfil__skills-contador {
  flex: none;
  color: var(--color-text-muted);
  font-size: 0.75rem;
}

.crear-perfil__skills-grupo + .crear-perfil__skills-grupo {
  margin-top: 1rem;
}

.crear-perfil__skills-label {
  display: block;
  margin-bottom: 0.4rem;
  color: var(--color-text-muted);
  font-size: 0.78rem;
}

.crear-perfil__skills-seleccionadas {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  min-height: 44px;
  padding: 0.5rem;
  background: var(--color-surface);
  border: 1px dashed var(--color-border-strong);
  border-radius: 8px;
}

.crear-perfil__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.crear-perfil__chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.3rem 0.65rem;
  border: 1px solid var(--color-border-strong);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 0.78rem;
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s,
    color 0.15s;
}

.crear-perfil__chip:hover:not(:disabled) {
  background: var(--color-surface-muted);
}

.crear-perfil__chip:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.crear-perfil__chip:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.crear-perfil__chip--seleccionada {
  background: var(--color-chip);
  border-color: transparent;
  color: var(--color-secondary);
}

.crear-perfil__chip--seleccionada:hover {
  background: var(--color-chip);
}

.crear-perfil__chip .material-symbols-outlined {
  font-size: 0.9rem;
}

.crear-perfil__skills-vacio {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.78rem;
}

.crear-perfil__skills-reintentar {
  margin-top: 0.5rem;
}

.crear-perfil__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem 1rem;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  text-align: center;
}

.crear-perfil__estado-icono {
  font-size: 2rem;
}

.crear-perfil__alertas {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.crear-perfil__acciones {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding-top: 0.5rem;
}

.crear-perfil__card :deep(.va-input-wrapper__field),
.crear-perfil__form :deep(.va-input-wrapper__field) {
  min-height: 40px;
}

@media (max-width: 900px) {
  .crear-perfil__grid--4 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .crear-perfil {
    padding: 1rem;
  }

  .crear-perfil__titulo {
    font-size: 1.3rem;
  }

  .crear-perfil__stepper {
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .crear-perfil__paso {
    font-size: 0.78rem;
  }

  .crear-perfil__grid--2,
  .crear-perfil__grid--4 {
    grid-template-columns: 1fr;
  }

  .crear-perfil__datos {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .crear-perfil__datos-campo {
    width: 100%;
  }

  .crear-perfil__acciones {
    flex-direction: column-reverse;
  }

  .crear-perfil__acciones > * {
    width: 100%;
  }
}
</style>
