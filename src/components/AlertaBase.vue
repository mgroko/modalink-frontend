<template>
  <VaAlert
    v-if="message"
    :color="config.bgColor"
    class="mt-4"
    :style="{ color: config.textColor }"
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
          bgColor: "#dcfce7",
          textColor: "#15803d",
          icon: "mso-check_circle",
        };
      }
      // error
      return {
        bgColor: "#fee2e2",
        textColor: "#b91c1c",
        icon: "mso-error",
      };
    },
  },
};
</script>