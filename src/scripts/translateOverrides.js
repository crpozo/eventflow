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
  // Registration form term fixes (client corrections).
  "cédula": { en: "ID" },
  "cedula": { en: "ID" },
  "apellido": { en: "Surname" },
  "apellidos": { en: "Surnames" },
  "sí": { en: "Yes" },
  // Unaccented "Si" is common in form data; without this Translate reads it as
  // the conjunction and outputs "If" instead of the Yes/No answer "Yes".
  "si": { en: "Yes" },
  // Translate renders the standalone "No" answer as the French "non"; pin it so
  // the Yes/No option stays "No" in English.
  "no": { en: "No" },
  // Common Yes/No certificate question wording. The label is authored several
  // ways (with/without the leading "¿…?", with/without "un"), so list each
  // variant explicitly — applyOverride matches on the trimmed, lowercased label.
  "¿le gustaría recibir un certificado de participación?": {
    en: "Would you like to receive a certificate of participation?",
  },
  "¿le gustaría recibir certificado de participación?": {
    en: "Would you like to receive a certificate of participation?",
  },
  "le gustaría recibir certificado de participación": {
    en: "Would you like to receive a certificate of participation?",
  },
  "¿desea recibir un certificado de participación?": {
    en: "Would you like to receive a certificate of participation?",
  },
  "¿desea recibir certificado de participación?": {
    en: "Would you like to receive a certificate of participation?",
  },
  "desea recibir certificado de participación": {
    en: "Would you like to receive a certificate of participation?",
  },
};

// Returns the preferred translation for `text` in `lang`, or null if none.
export function applyOverride(text, lang) {
  if (typeof text !== "string") return null;
  const o = TRANSLATE_OVERRIDES[text.trim().toLowerCase()];
  return o?.[lang] || null;
}

// Word-level swaps applied to the SOURCE before sending it to Amazon Translate
// for English, so the preferred term comes out even when the word is embedded
// in a longer phrase (the whole-string override above can't catch those).
// "ponencia(s)" -> "ponente(s)" makes Translate output "speaker(s)".
const WORD_SWAPS_EN = [
  [/\bponencias\b/gi, "ponentes"],
  [/\bponencia\b/gi, "ponente"],
];

// Preprocess the Spanish source text right before translating to `lang`.
export function preprocessForTranslation(text, lang) {
  if (lang !== "en" || typeof text !== "string") return text;
  return WORD_SWAPS_EN.reduce((acc, [re, repl]) => acc.replace(re, repl), text);
}
