<template>
  <div class="crear-perfil">
    <h1 class="crear-perfil__titulo">Crear nuevo perfil</h1>
    <p class="crear-perfil__subtitulo">Completá los datos generales y las características de tu perfil profesional.</p>

    <div class="crear-perfil__stepper">
      <div class="crear-perfil__paso" :class="{ 'crear-perfil__paso--activo': paso === 1, 'crear-perfil__paso--completo': paso > 1 }">
        <span class="crear-perfil__paso-numero">1</span>
        <span>Datos generales</span>
      </div>
      <div class="crear-perfil__paso-linea" :class="{ 'crear-perfil__paso-linea--activa': paso > 1 }"></div>
      <div class="crear-perfil__paso" :class="{ 'crear-perfil__paso--activo': paso === 2, 'crear-perfil__paso--completo': paso > 2 }">
        <span class="crear-perfil__paso-numero">2</span>
        <span>Características y biografía</span>
      </div>
    </div>

    <VaForm ref="form" :immediate="false" @submit.prevent="paso === 1 ? irPaso2() : guardar()" class="crear-perfil__form">
      <template v-if="paso === 1">
        <div class="crear-perfil__campos">
          <VaInput
            v-model="form.nombreArtistico"
            :rules="[reglas.requerido, reglas.min2, reglas.max50]"
            label="Nombre artístico"
            type="text"
            placeholder="Ej: Lía Stylist"
          />

          <VaSelect
            v-model="form.idProfesion"
            :options="profesionesDisponibles"
            value-by="idProfesion"
            :text-by="(option) => capitalizarEtiqueta(option.nombre)"
            :rules="[reglas.requerido]"
            label="Profesión"
            placeholder="Seleccioná una profesión"
            :loading="cargandoProfesiones"
          />
        </div>

        <div class="crear-perfil__foto">
          <img
            v-if="fotoPreview"
            :src="fotoPreview"
            alt="Vista previa de la foto de perfil"
            class="crear-perfil__foto-img"
          />
          <div v-else class="crear-perfil__foto-img crear-perfil__foto-img--placeholder">
            <span class="material-symbols-outlined">person</span>
          </div>
          <div class="crear-perfil__foto-info">
            <span class="crear-perfil__foto-titulo">Foto de perfil</span>
            <span class="crear-perfil__foto-aviso">Opcional. Podés subirla ahora o más tarde desde editar perfil.</span>
            <div class="crear-perfil__foto-acciones">
              <input
                ref="inputFoto"
                type="file"
                accept="image/*"
                class="crear-perfil__foto-input"
                @change="seleccionarFoto"
              />
              <VaButton preset="secondary" size="small" icon="mso-photo_camera" @click="$refs.inputFoto.click()">
                {{ fotoPreview ? "Cambiar foto" : "Elegir foto" }}
              </VaButton>
              <VaButton v-if="fotoPreview" preset="secondary" size="small" color="danger" @click="limpiarFoto">
                Quitar
              </VaButton>
            </div>
          </div>
        </div>
      </template>

      <template v-else>
        <div v-if="cargandoCaracteristicas" class="crear-perfil__estado">
          <span class="material-symbols-outlined crear-perfil__estado-icono">hourglass_empty</span>
          Cargando características...
        </div>

        <div v-else-if="caracteristicas.length === 0" class="crear-perfil__estado">
          <span class="material-symbols-outlined crear-perfil__estado-icono">info</span>
          No se encontraron características para esta profesión. Podés continuar con la biografía.
        </div>

        <template v-else>
          <div class="crear-perfil__campos">
            <!-- Altura primero, ocupa ancho completo -->
            <div v-if="caracteristicaAltura" class="crear-perfil__campo-caracteristica">
              <VaInput
                v-if="!esEnumerado(caracteristicaAltura)"
                v-model="form.caracteristicas[caracteristicaAltura.idCaracteristica].valor"
                :rules="[reglas.requerido]"
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
                  <span v-if="getValorById(caracteristicaAltura, value)" class="crear-perfil__opcion">
                    <span v-if="getValorById(caracteristicaAltura, value).colorHex" class="crear-perfil__swatch" :style="{ background: getValorById(caracteristicaAltura, value).colorHex }"></span>
                    {{ labelValor(getValorById(caracteristicaAltura, value).codigo) }}
                  </span>
                </template>
                <template #option-content="{ option }">
                  <span class="crear-perfil__opcion">
                    <span v-if="option.colorHex" class="crear-perfil__swatch" :style="{ background: option.colorHex }"></span>
                    {{ labelValor(option.codigo) }}
                  </span>
                </template>
              </VaSelect>
            </div>

            <!-- Medidas: pecho, cintura, cadera en un mismo renglón + acción alineada a Cadera -->
            <div v-if="caracteristicasMedidas.length" class="crear-perfil__medidas-linea">
              <div class="crear-perfil__fila-medidas">
                <div
                  v-for="carac in caracteristicasMedidas"
                  :key="carac.idCaracteristica"
                  class="crear-perfil__campo-caracteristica"
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
                      <span v-if="getValorById(carac, value)" class="crear-perfil__opcion">
                        <span v-if="getValorById(carac, value).colorHex" class="crear-perfil__swatch" :style="{ background: getValorById(carac, value).colorHex }"></span>
                        {{ labelValor(getValorById(carac, value).codigo) }}
                      </span>
                    </template>
                    <template #option-content="{ option }">
                      <span class="crear-perfil__opcion">
                        <span v-if="option.colorHex" class="crear-perfil__swatch" :style="{ background: option.colorHex }"></span>
                        {{ labelValor(option.codigo) }}
                      </span>
                    </template>
                  </VaSelect>
                  <VaInput
                    v-else
                    v-model="form.caracteristicas[carac.idCaracteristica].valor"
                    :rules="[reglas.requerido]"
                    :label="etiquetaCaracteristica(carac)"
                    :type="esNumerico(carac) ? 'number' : 'text'"
                    :placeholder="`V${labelCaracteristica(carac.codigo)} ...`"
                  />
                </div>
              </div>
            </div>

            <!-- Colores: piel, cabello, ojos -->
            <div
              v-for="carac in caracteristicasColores"
              :key="carac.idCaracteristica"
              class="crear-perfil__campo-caracteristica"
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
                  <span v-if="getValorById(carac, value)" class="crear-perfil__opcion">
                    <span v-if="getValorById(carac, value).colorHex" class="crear-perfil__swatch" :style="{ background: getValorById(carac, value).colorHex }"></span>
                    {{ labelValor(getValorById(carac, value).codigo) }}
                  </span>
                </template>
                <template #option-content="{ option }">
                  <span class="crear-perfil__opcion">
                    <span v-if="option.colorHex" class="crear-perfil__swatch" :style="{ background: option.colorHex }"></span>
                    {{ labelValor(option.codigo) }}
                  </span>
                </template>
              </VaSelect>
              <VaInput
                v-else
                v-model="form.caracteristicas[carac.idCaracteristica].valor"
                :rules="[reglas.requerido]"
                :label="etiquetaCaracteristica(carac)"
                :type="esNumerico(carac) ? 'number' : 'text'"
                :placeholder="`${labelCaracteristica(carac.codigo)} ...`"
              />
            </div>

            <!-- Resto de características no contempladas en el orden pedido -->
            <div
              v-for="carac in caracteristicasRestantes"
              :key="carac.idCaracteristica"
              class="crear-perfil__campo-caracteristica"
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
                  <span v-if="getValorById(carac, value)" class="crear-perfil__opcion">
                    <span v-if="getValorById(carac, value).colorHex" class="crear-perfil__swatch" :style="{ background: getValorById(carac, value).colorHex }"></span>
                    {{ labelValor(getValorById(carac, value).codigo) }}
                  </span>
                </template>
                <template #option-content="{ option }">
                  <span class="crear-perfil__opcion">
                    <span v-if="option.colorHex" class="crear-perfil__swatch" :style="{ background: option.colorHex }"></span>
                    {{ labelValor(option.codigo) }}
                  </span>
                </template>
              </VaSelect>
              <VaInput
                v-else
                v-model="form.caracteristicas[carac.idCaracteristica].valor"
                :rules="[reglas.requerido]"
                :label="etiquetaCaracteristica(carac)"
                :type="esNumerico(carac) ? 'number' : 'text'"
                :placeholder="`${labelCaracteristica(carac.codigo)} ...`"
              />
            </div>
          </div>
        </template>

        <div class="crear-perfil__campos">
          <VaInput
            v-model="form.biografia"
            :rules="[reglas.requerido, reglas.max500]"
            type="textarea"
            label="Biografía"
            placeholder="Contá sobre tu trayectoria profesional..."
          />
        </div>
      </template>
      
      <div
        class="crear-perfil__alertas-wrapper"
        :class="{ 'crear-perfil__alertas-wrapper--visible': mensajeExito || mensajeError }"
      >
        <div class="crear-perfil__alertas">
          <BaseAlert v-if="mensajeExito" :message="mensajeExito" type="success" />
          <BaseAlert v-if="mensajeError" :message="mensajeError" type="error" />
        </div>
      </div>

      <div class="crear-perfil__acciones">
        <template v-if="paso === 1">
          <VaButton preset="secondary" @click="volver">Cancelar</VaButton>
          <VaButton type="submit">Siguiente</VaButton>
        </template>
        <template v-else>
          <VaButton preset="secondary" @click="paso = 1">Atrás</VaButton>
          <VaButton type="submit" :loading="cargando">Crear perfil</VaButton>
        </template>
      </div>
    </VaForm>

  </div>
</template>

<script>
import perfilService from "../../services/perfilService.js";
import { refrescarSesion } from "../../services/authState.js";
import BaseAlert from "../../components/AlertaBase.vue";
import {
  ETIQUETAS_CARACTERISTICAS,
  ETIQUETAS_VALORES,
  ORDEN_PRIORIDAD,
  normCodigo,
  normTexto,
} from "../../utils/perfilConstants.js";
import { reglasPerfil } from "../../utils/reglas.js";

export default {
  name: "CrearPerfilView",
  components: {
    BaseAlert,
  },
  computed: {
    profesionesDisponibles() {
      return this.profesiones.map((p) => ({
        ...p,
        disabled: this.profesionesOcupadas.has(p.idProfesion),
      }));
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
  },
  data() {
    return {
      paso: 1,
      profesiones: [],
      profesionesOcupadas: new Set(),
      cargandoProfesiones: false,
      cargandoCaracteristicas: false,
      caracteristicas: [],
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
      reglas: reglasPerfil,
    };
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
          this.profesiones = Array.isArray(datos) ? datos : datos?.profesiones || [];
        } else {
          this.mensajeError = "No se pudieron cargar las profesiones. Intentá nuevamente.";
        }

        if (perfilesRes.status === "fulfilled") {
          const perfiles = Array.isArray(perfilesRes.value?.data)
            ? perfilesRes.value.data
            : [];
          this.profesionesOcupadas = new Set(
            perfiles
              .map((p) => {
                const nombreNorm = normTexto(p.profesion);
                const encontrada = this.profesiones.find(
                  (prof) => normTexto(prof.nombre) === nombreNorm
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

    async cargarProfesiones() {
      this.cargandoProfesiones = true;
      try {
        const response = await perfilService.listarProfesiones();
        const datos = response?.data;
        this.profesiones = Array.isArray(datos) ? datos : datos?.profesiones || [];
      } catch {
        this.mensajeError = "No se pudieron cargar las profesiones. Intentá nuevamente.";
      } finally {
        this.cargandoProfesiones = false;
      }
    },

    async irPaso2() {
      const isValid = this.$refs.form.validate();
      if (!isValid || !this.form.idProfesion) return;

      this.mensajeExito = "";
      this.mensajeError = "";

      if (await this.usuarioTienePerfilConProfesion(this.form.idProfesion)) {
        this.mensajeError = "Ya tenés un perfil con esta profesión. Podés modificar el perfil existente.";
        return;
      }

      this.cargandoCaracteristicas = true;

      try {
        const response = await perfilService.caracteristicasPorProfesion(this.form.idProfesion);
        const datos = response?.data;
        this.caracteristicas = Array.isArray(datos) ? datos : datos?.caracteristicas || [];

        this.form.caracteristicas = {};
        this.caracteristicas.forEach((carac) => {
          this.form.caracteristicas[carac.idCaracteristica] = {
            valor: "",
            idValor: null,
          };
        });

        this.paso = 2;
        this.$nextTick(() => {
          this.$refs.form?.resetValidation?.();
        });
      } catch {
        this.mensajeError = "No se pudieron cargar las características de la profesión.";
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

    async usuarioTienePerfilConProfesion(idProfesion) {
      return this.profesionesOcupadas.has(idProfesion);
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
      if (!carac.unidad) return base;
      const unidadNorm = normCodigo(carac.unidad);
      if (unidadNorm === "color" || unidadNorm === "colour") return base;
      return `${base} (${carac.unidad.toLowerCase()})`;
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

    async resolverIdNuevoPerfil(dataCruda, nombreArtistico) {
      if (typeof dataCruda === "number") return dataCruda;
      if (dataCruda?.idPerfil != null) return dataCruda.idPerfil;
      if (dataCruda?.id != null) return dataCruda.id;
      try {
        const response = await perfilService.listarMisPerfiles();
        const perfiles = Array.isArray(response?.data) ? response.data : [];
        return perfiles.find((p) => p.nombreArtistico === nombreArtistico)?.idPerfil ?? null;
      } catch {
        return null;
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
        idProfesion: this.form.idProfesion,
        biografia: this.form.biografia.trim(),
        caracteristicas,
      };

      try {
        const response = await perfilService.crear(request);
        // Flujo 1 (Caso A): si es el primer perfil, el backend lo asigna como activo.
        await refrescarSesion();

        let avisoFoto = "";
        if (this.fotoArchivo) {
          const idNuevo = await this.resolverIdNuevoPerfil(response?.data, request.nombreArtistico);
          if (idNuevo != null) {
            try {
              await perfilService.subirFoto(idNuevo, this.fotoArchivo);
            } catch {
              avisoFoto = " No se pudo subir la foto; podés reintentarlo desde editar perfil.";
            }
          } else {
            avisoFoto = " No se pudo asociar la foto; subila desde editar perfil.";
          }
          this.limpiarFoto();
        }

        this.mensajeExito = `Perfil creado correctamente.${avisoFoto}`;
        setTimeout(() => {
          this.$router.push({ name: "dashboard-usuario" });
        }, 1200);
      } catch (error) {
        this.mensajeError =
          error?.response?.data?.message || "No se pudo crear el perfil. Intentá nuevamente.";
      } finally {
        this.cargando = false;
      }
    },

    volver() {
      this.$router.push({ name: "dashboard-usuario" });
    },
  },
};
</script>

<style scoped>
.crear-perfil {
  max-width: 860px;
}

.crear-perfil__titulo {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 0.25rem 0;
}

.crear-perfil__subtitulo {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  margin: 0 0 1.5rem 0;
}

/* Stepper */
.crear-perfil__stepper {
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
}

.crear-perfil__paso {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.82rem;
  color: var(--color-text-muted);
}

.crear-perfil__paso-numero {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e5e7eb;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.78rem;
  flex-shrink: 0;
}

.crear-perfil__paso--activo {
  color: var(--color-primary);
  font-weight: 600;
}

.crear-perfil__paso--activo .crear-perfil__paso-numero {
  background: var(--color-primary);
  color: #fff;
}

.crear-perfil__paso--completo {
  color: var(--color-text);
}

.crear-perfil__paso--completo .crear-perfil__paso-numero {
  background: #f59e0b;
  color: #fff;
}

.crear-perfil__paso-linea {
  flex: 1;
  height: 2px;
  background: #e5e7eb;
  margin: 0 1rem;
}

.crear-perfil__paso-linea--activa {
  background: var(--color-primary);
}

/* Form */
.crear-perfil__form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.crear-perfil__campos {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.crear-perfil__foto {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.crear-perfil__foto-img {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.crear-perfil__foto-img--placeholder {
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
}

.crear-perfil__foto-img--placeholder .material-symbols-outlined {
  font-size: 2.2rem;
}

.crear-perfil__foto-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.crear-perfil__foto-titulo {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text);
}

.crear-perfil__foto-aviso {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.crear-perfil__foto-acciones {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.35rem;
  flex-wrap: wrap;
}

.crear-perfil__foto-input {
  display: none;
}

.crear-perfil__campo-caracteristica :deep(.va-input-wrapper__field) {
  min-height: 40px;
}

.crear-perfil__medidas-linea {
  display: block;
}

.crear-perfil__fila-medidas {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.85rem;
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
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
  vertical-align: middle;
}

@media (max-width: 900px) {
  .crear-perfil__fila-medidas {
    grid-template-columns: 1fr;
  }
}

.crear-perfil__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem 1rem;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.crear-perfil__estado-icono {
  font-size: 2rem;
}

.crear-perfil__acciones {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding-top: 0.5rem;
}

.crear-perfil__alertas-wrapper {
  display: grid;
  grid-template-rows: 0fr;
  min-height: 0;
  transition: grid-template-rows 0.25s ease;
}
 
.crear-perfil__alertas-wrapper--visible {
  grid-template-rows: 1fr;
}
 
.crear-perfil__alertas {
  overflow: hidden;
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
 
.crear-perfil__alertas-wrapper--visible .crear-perfil__alertas {
  padding-top: 0.15rem;
}
 
.crear-perfil__alertas > * {
  width: 100% !important;
  box-sizing: border-box;
  text-align: left;
}
 
:deep(.va-input-wrapper__field) {
  min-height: 40px;
}

</style>