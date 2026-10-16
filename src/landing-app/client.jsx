// Entrada del bundle liviano de la landing pública (scripts/landing/build.mjs).
//
// En una landing estática el HTML ya trae la página pintada y sus datos en
// window.__LANDING__: React solo la "hidrata" (engancha eventos) sin volver a
// pedir nada para el primer render. Sin datos (landing nueva que aún no tiene
// HTML estático) se renderiza de cero y los datos se piden a AppSync.
import { hydrateRoot, createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { seedTranslations } from "scripts/translationCache";
import LandingShell from "./LandingShell";

const data = window.__LANDING__ || null;
if (data?.translations) {
  Object.entries(data.translations).forEach(([lang, map]) => seedTranslations(lang, map));
}

const rootEl = document.getElementById("root");
// ?EventAttendee= (vuelta de un pago / ticket) cambia el primer render: en ese
// caso no se hidrata, se pinta de cero.
const willHydrate =
  Boolean(data) &&
  rootEl.hasChildNodes() &&
  !new URLSearchParams(window.location.search).has("EventAttendee");

const app = (
  <BrowserRouter>
    <LandingShell initialData={data} hydrated={willHydrate} />
  </BrowserRouter>
);

if (willHydrate) {
  hydrateRoot(rootEl, app);
} else {
  createRoot(rootEl).render(app);
}
