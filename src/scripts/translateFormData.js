import { Predictions } from "@aws-amplify/predictions";
import { applyOverride } from "./translateOverrides";

// Module-level cache shared across renders: `${lang}::${text}` -> translation.
const cache = {};

// Translates a single string from Spanish to the target language via Amazon
// Translate, caching the result. Returns the original text on error or when
// the target language is Spanish. Exported so non-FormBuilder text (e.g. the
// landing consent block) can reuse the same cached translation path.
export async function translateString(text, lang) {
  if (typeof text !== "string" || text.trim().length === 0 || lang === "es") {
    return text;
  }

  // Honor manual overrides first (also avoids an unnecessary API call).
  const override = applyOverride(text, lang);
  if (override) return override;

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
    return cache[key];
  } catch (e) {
    console.error("Amazon Translate (form) error for:", text, e);
    // Do NOT cache failures, so it retries once the permission is granted.
    return text;
  }
}

// User-visible string fields inside a FormBuilder question definition.
const TEXT_FIELDS = ["label", "placeholder", "description"];

/**
 * Translates the user-visible text of a FormBuilder form definition (labels,
 * placeholders, descriptions and option labels) from Spanish to the target
 * language. Never touches `name`/`value`, so submitted answers stay stable.
 *
 * Accepts the definition either as an array or as a JSON string (Amplify
 * DataStore returns AWSJSON fields as strings) and returns the same type.
 *
 * @param {Array<Object>|string} questions  FormBuilder form definition (ES source)
 * @param {string} targetLang               "ES" | "EN" (case-insensitive)
 * @returns {Promise<Array<Object>|string>} translated copy (or original for ES)
 */
export async function translateFormData(questions, targetLang) {
  const lang = (targetLang || "es").toLowerCase();
  if (lang === "es") return questions;

  // AWSJSON fields arrive as a JSON string; arrays are also supported.
  let arr = questions;
  let wasString = false;
  if (typeof questions === "string") {
    try {
      arr = JSON.parse(questions);
      wasString = true;
    } catch (e) {
      return questions;
    }
  }
  if (!Array.isArray(arr)) return questions;

  const translated = await Promise.all(
    arr.map(async (q) => {
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

  return wasString ? JSON.stringify(translated) : translated;
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
  // The original definition may be a JSON string (AWSJSON) or an array.
  let orig = original;
  if (typeof original === "string") {
    try {
      orig = JSON.parse(original);
    } catch (e) {
      return captured;
    }
  }
  if (!Array.isArray(captured) || !Array.isArray(orig)) return captured;

  const byName = {};
  orig.forEach((q) => {
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
