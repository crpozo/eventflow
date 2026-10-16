// Render en el build (Node) de una landing estática. Lo usa
// scripts/landing/prerender.mjs con el bundle que genera build.mjs.
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { seedTranslations } from "scripts/translationCache";
import LandingShell from "./LandingShell";

// Utilidades que el prerender comparte con la app (mismos textos/campos que
// traduce y pide la landing en el navegador).
export { preprocessForTranslation, applyOverride } from "scripts/translateOverrides";
export { DEFAULT_CONSENT_HTML } from "scripts/consentDefault";
export { withCertFields } from "scripts/certFields";
export { EVENT_FIELDS, LANDING_FIELDS, FORM_FIELDS } from "views/landing/landingData";

/**
 * @param {string} url   ruta pública (/landing/<id> o /landing/<id>/en)
 * @param {object} data  { eventId, event, landing, form, images, translations }
 * @returns {string} HTML del contenido de #root
 */
export function renderLanding(url, data) {
  Object.entries(data?.translations || {}).forEach(([lang, map]) => seedTranslations(lang, map));
  return renderToString(
    <StaticRouter location={url}>
      <LandingShell initialData={data} hydrated />
    </StaticRouter>
  );
}
