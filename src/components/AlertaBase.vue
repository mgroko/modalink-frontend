<template>
  <VaAlert
    v-if="message"
    class="mt-4"
    :style="{ backgroundColor: config.bgColor, color: config.textColor }"
    :icon="config.icon"
  >
    <span class="font-semibold">{{ message }}</span>
  </VaAlert>
</template>

<script>
export default {
  name: "BaseAlert",
  props: {
    message: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      required: true,
      validator: (value) => ["success", "error"].includes(value),
    },
  },
  computed: {
    config() {
      // exito
      if (this.type === "success") {
        return {
          bgColor: "var(--color-success-soft)",
          textColor: "var(--color-success-text)",
          icon: "mso-check_circle",
        };
      }
      // error
      return {
        bgColor: "var(--color-danger-soft)",
        textColor: "var(--color-danger-text)",
        icon: "mso-error",
      };
    },
  },
};
</script>