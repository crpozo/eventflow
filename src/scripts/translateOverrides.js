// Manual term overrides for Amazon Translate — domain-specific terms it renders
// wrong out of context. Keyed by lowercased Spanish source -> { <lang>: text }.
//
// Examples:
//  - "Dirección" is ambiguous (address / direction); in a form it's the address.
//  - "Ponencia(s)" literally translates to "presentation/paper", but in this
//    event context the intended English label is "Speakers".
export const TRANSLATE_OVERRIDES = {
  "dirección": { en: "Address" },
  "direccion": { en: "Address" },
  "ponencia": { en: "Speakers" },
  "ponencias": { en: "Speakers" },
  "ponente": { en: "Speaker" },
  "ponentes": { en: "Speakers" },
};

// Returns the preferred translation for `text` in `lang`, or null if none.
export function applyOverride(text, lang) {
  if (typeof text !== "string") return null;
  const o = TRANSLATE_OVERRIDES[text.trim().toLowerCase()];
  return o && o[lang] ? o[lang] : null;
}
