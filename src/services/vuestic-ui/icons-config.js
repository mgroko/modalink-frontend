import { createIconsConfig } from "vuestic-ui";

export default createIconsConfig({
  fonts: [
    {
      name: "mso-{content}",
      class: "material-symbols-outlined",
      resolve: ({ content }) => ({ content }),
    },
  ],
});