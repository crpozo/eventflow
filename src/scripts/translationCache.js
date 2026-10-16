// Caché de traducciones compartida por la landing (useAwsTranslation) y el
// formulario de registro (translateFormData): `${lang}::${texto}` → traducción.
// Las landings estáticas traen sus traducciones ya calculadas en el build
// (window.__LANDING__.translations) y se siembran aquí: cambiar a EN no llama
// a Amazon Translate desde el navegador.
export const translationCache = {};

/**
 * Precarga traducciones conocidas.
 * @param {string} lang  código de Amazon Translate ("en")
 * @param {Object<string,string>} map  texto original (ES) → traducción
 */
export function seedTranslations(lang, map) {
  const code = String(lang || "").toLowerCase();
  if (!code || !map) return;
  Object.entries(map).forEach(([source, out]) => {
    if (typeof out === "string" && out.length > 0) {
      translationCache[`${code}::${source}`] = out;
    }
  });
}
