// Tailwind de la landing liviana: mismo tema que el panel (tailwind.config.js)
// pero escaneando solo los archivos que pinta la landing pública, así su CSS
// trae únicamente las utilidades que usa.
const base = require("../../tailwind.config.js");

module.exports = {
  ...base,
  content: [
    "./src/views/landing/index.jsx",
    "./src/views/landing/components/*.jsx",
    "./src/views/landing/registro/index.jsx",
    "./src/layouts/landing/LandingFrame.jsx",
    "./src/components/adminUi/index.jsx",
    "./src/landing-app/**/*.{js,jsx}",
    "./src/scripts/utils.js",
    "./src/scripts/certFields.js",
  ],
};
