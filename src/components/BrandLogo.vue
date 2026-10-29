<template>
  <span
    class="brand-logo"
    :class="`brand-logo--${variante}`"
    :style="{ height: `${alto}px`, '--brand-logo-url': `url(${logoUrl})` }"
    role="img"
    aria-label="ModaLink"
  ></span>
</template>

<script>
import logoUrl from "../../docs/pantallas/logo/MODALINK.svg";

export default {
  name: "BrandLogo",
  props: {
    alto: {
      type: Number,
      default: 32,
    },
    variante: {
      type: String,
      default: "primary",
      validator: (valor) => ["primary", "light", "gradient"].includes(valor),
    },
  },
  data() {
    return { logoUrl };
  },
};
</script>

<style scoped>
.brand-logo {
  display: inline-block;
  width: auto;
  flex-shrink: 0;
  aspect-ratio: 429 / 153;
  background: var(--color-primary);
  -webkit-mask-image: var(--brand-logo-url);
  mask-image: var(--brand-logo-url);
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
  -webkit-mask-size: contain;
  mask-size: contain;
}

.brand-logo--light {
  background: #ffffff;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.45));
}

.brand-logo--gradient {
  background: linear-gradient(
    135deg,
    var(--color-accent) 0%,
    var(--color-secondary) 50%,
    var(--color-primary) 100%
  );
}
</style>
