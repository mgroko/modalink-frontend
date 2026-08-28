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

    <VaForm ref="form" @submit.prevent="paso === 1 ? irPaso2() : guardar()" class="crear-perfil__form">
      <template v-if="paso === 1">
        <div class="crear-perfil__campos">
          <VaInput
            v-model="form.nombreArtistico"
            :rules="[reglas.requerido, reglas.min2]"
            label="Nombre artístico"
            type="text"
            placeholder="Ej: Lía Stylist"
          />

          <VaSelect
            v-model="form.idProfesion"
            :options="profesiones"
            value-by="idProfesion"
            text-by="nombre"
            :rules="[reglas.requerido]"
            label="Profesión"
            placeholder="Seleccioná una profesión"
            :loading="cargandoProfesiones"
          />
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
            <div class="crear-perfil__campo-caracteristica" v-for="carac in caracteristicas" :key="carac.idCaracteristica">
              <VaInput
                v-model="form.caracteristicas[carac.idCaracteristica]"
                :rules="[reglas.requerido]"
                :label="carac.codigo + (carac.unidad ? ` (${carac.unidad})` : '')"
                type="text"
                :placeholder="`Valor de ${carac.codigo}`"
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

    <BaseAlert :message="mensajeExito" type="success" />
    <BaseAlert :message="mensajeError" type="error" />
  </div>
</template>

<script>
import perfilService from "../../services/perfilService";
import BaseAlert from "../../components/AlertaBase.vue";

export default {
  name: "CrearPerfilView",
  components: {
    BaseAlert,
  },
  data() {
    return {
      paso: 1,
      profesiones: [],
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
      reglas: {
        requerido: (v) => !!v || "Este campo es requerido",
        min2: (v) => !v || v.length >= 2 || "Debe tener al menos 2 caracteres",
        max500: (v) => !v || v.length <= 500 || "La biografía no puede superar los 500 caracteres",
      },
    };
  },
  async mounted() {
    await this.cargarProfesiones();
  },
  methods: {
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
      this.cargandoCaracteristicas = true;

      try {
        const response = await perfilService.caracteristicasPorProfesion(this.form.idProfesion);
        const datos = response?.data;
        this.caracteristicas = Array.isArray(datos) ? datos : datos?.caracteristicas || [];

        this.caracteristicas.forEach((carac) => {
          if (!(carac.idCaracteristica in this.form.caracteristicas)) {
            this.form.caracteristicas[carac.idCaracteristica] = "";
          }
        });

        this.paso = 2;
      } catch {
        this.mensajeError = "No se pudieron cargar las características de la profesión.";
      } finally {
        this.cargandoCaracteristicas = false;
      }
    },

    async guardar() {
      const isValid = this.$refs.form.validate();
      if (!isValid) return;

      this.mensajeExito = "";
      this.mensajeError = "";
      this.cargando = true;

      const request = {
        nombreArtistico: this.form.nombreArtistico.trim(),
        idProfesion: this.form.idProfesion,
        biografia: this.form.biografia.trim(),
        caracteristicas: this.caracteristicas
          .filter((carac) => this.form.caracteristicas[carac.idCaracteristica] !== "")
          .map((carac) => ({
            idCaracteristica: carac.idCaracteristica,
            valor: this.form.caracteristicas[carac.idCaracteristica],
          })),
      };

      try {
        await perfilService.crear(request);
        this.mensajeExito = "Perfil creado correctamente.";
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
  max-width: 640px;
}

.crear-perfil__titulo {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
}

.crear-perfil__subtitulo {
  font-size: 0.85rem;
  color: #6b7280;
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
  color: #9ca3af;
}

.crear-perfil__paso-numero {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e5e7eb;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.78rem;
  flex-shrink: 0;
}

.crear-perfil__paso--activo {
  color: #b865a4;
  font-weight: 600;
}

.crear-perfil__paso--activo .crear-perfil__paso-numero {
  background: #b865a4;
  color: #fff;
}

.crear-perfil__paso--completo {
  color: #374151;
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
  background: #b865a4;
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

.crear-perfil__campo-caracteristica :deep(.va-input-wrapper__field) {
  min-height: 40px;
}

.crear-perfil__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem 1rem;
  color: #9ca3af;
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
</style>
