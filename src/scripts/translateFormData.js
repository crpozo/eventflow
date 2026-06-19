import { Predictions } from "@aws-amplify/predictions";

// Module-level cache shared across renders: `${lang}::${text}` -> translation.
const cache = {};

// Translates a single string from Spanish to the target language via Amazon
// Translate, caching the result. Returns the original text on error or when
// the target language is Spanish.
async function translateString(text, lang) {
  if (typeof text !== "string" || text.trim().length === 0 || lang === "es") {
    return text;
  }
  const key = `${lang}::${text}`;
  if (cache[key] !== undefined) return cache[key];
  try {
    const { text: out } = await Predictions.convert({
      translateText: {
        source: { text, language: "es" },
        targetLanguage: lang,
      },
    });
    cache[key] = out || text;
  } catch (e) {
    console.error("Amazon Translate (form) error for:", text, e);
    cache[key] = text; // fall back to original so the form still renders
  }
  return cache[key];
}

// User-visible string fields inside a FormBuilder question definition.
const TEXT_FIELDS = ["label", "placeholder", "description"];

/**
 * Translates the user-visible text of a FormBuilder form definition (labels,
 * placeholders, descriptions and option labels) from Spanish to the target
 * language. Never touches `name`/`value`, so submitted answers stay stable.
 *
 * @param {Array<Object>} questions  FormBuilder form definition (ES source)
 * @param {string} targetLang        "ES" | "EN" (case-insensitive)
 * @returns {Promise<Array<Object>>} translated copy (or original for ES)
 */
export async function translateFormData(questions, targetLang) {
  const lang = (targetLang || "es").toLowerCase();
  if (lang === "es" || !Array.isArray(questions)) return questions;

  return Promise.all(
    questions.map(async (q) => {
      const out = { ...q };
      await Promise.all(
        TEXT_FIELDS.map(async (field) => {
          if (typeof q[field] === "string") {
            out[field] = await translateString(q[field], lang);
          }
        })
      );
      if (Array.isArray(q.values)) {
        out.values = await Promise.all(
          q.values.map(async (v) =>
            v && typeof v.label === "string"
              ? { ...v, label: await translateString(v.label, lang) }
              : v
          )
        );
      }
      return out;
    })
  );
}

/**
 * Restores the original Spanish labels/placeholders/option labels onto the
 * data captured from a (possibly translated) rendered form, matching by the
 * stable `name`/`value`. User answers are preserved untouched, so stored
 * submissions are always in Spanish regardless of the display language.
 *
 * @param {Array<Object>} captured   userData returned by formRender("userData")
 * @param {Array<Object>} original   the original Spanish form definition
 * @returns {Array<Object>}
 */
export function restoreOriginalLabels(captured, original) {
  if (!Array.isArray(captured) || !Array.isArray(original)) return captured;

  const byName = {};
  original.forEach((q) => {
    if (q && q.name !== undefined) byName[q.name] = q;
  });

  return captured.map((item) => {
    const orig = byName[item.name];
    if (!orig) return item;

    const merged = { ...item };
    TEXT_FIELDS.forEach((field) => {
      if (typeof orig[field] === "string") merged[field] = orig[field];
    });

    if (Array.isArray(item.values) && Array.isArray(orig.values)) {
      const labelByValue = {};
      orig.values.forEach((v) => {
        if (v && v.value !== undefined) labelByValue[v.value] = v.label;
      });
      merged.values = item.values.map((v) =>
        v && labelByValue[v.value] !== undefined
          ? { ...v, label: labelByValue[v.value] }
          : v
      );
    }
    return merged;
  });
}
