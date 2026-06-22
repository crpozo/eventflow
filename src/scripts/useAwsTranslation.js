import { useEffect, useRef, useState } from "react";
import { applyOverride, preprocessForTranslation } from "./translateOverrides";

// Module-level cache shared across components/renders so toggling languages
// back and forth never re-calls Amazon Translate for the same string.
const cache = {}; // { "en::texto original": "translated text" }

// App language codes ("ES"/"EN") -> Amazon Translate language codes.
const toTranslateCode = (lang) => (lang || "es").toLowerCase();

/**
 * Translates a dictionary of strings on the fly using Amazon Translate
 * (through Amplify Predictions).
 *
 * Designed for the public landing pages, whose content is created dynamically
 * by users (title, description, location, ticket titles, ...). Spanish is the
 * source language, so when targetLang is "ES" the original texts are returned
 * untouched and no request is made.
 *
 * Requires the Amplify `predictions` category (Convert → Translate text) to be
 * provisioned. If it is not configured, calls fail gracefully and the original
 * Spanish text is shown.
 *
 * @param {Object<string,string>} texts  key -> spanish text
 * @param {string} targetLang            "ES" | "EN" (case-insensitive)
 * @returns {Object<string,string>}      same keys, translated values
 */
export function useAwsTranslation(texts = {}, targetLang = "ES") {
  const [translated, setTranslated] = useState(texts);
  const reqIdRef = useRef(0);

  useEffect(() => {
    const lang = toTranslateCode(targetLang);
    const entries = Object.entries(texts);

    // Builds the output dictionary from whatever is currently cached,
    // falling back to the original text when no translation exists (yet).
    const buildResult = () =>
      Object.fromEntries(
        entries.map(([key, value]) => {
          if (typeof value !== "string" || value.trim().length === 0) {
            return [key, value];
          }
          const override = applyOverride(value, lang);
          if (override) return [key, override];
          const hit = cache[`${lang}::${value}`];
          return [key, hit !== undefined ? hit : value];
        })
      );

    // Spanish is the source language: nothing to translate.
    if (lang === "es") {
      setTranslated(texts);
      return;
    }

    // Show cached/original values immediately to avoid a flash of empty UI.
    setTranslated(buildResult());

    // Only translate the strings we have not translated before.
    const pending = entries.filter(
      ([, value]) =>
        typeof value === "string" &&
        value.trim().length > 0 &&
        !applyOverride(value, lang) &&
        cache[`${lang}::${value}`] === undefined
    );
    if (pending.length === 0) return;

    const reqId = ++reqIdRef.current;

    (async () => {
      try {
        // Lazy-load the Predictions SDK only when a translation is actually
        // needed (the default ES path early-returns above), so the ~98KB-gz SDK
        // stays out of the public landing's critical chunk.
        const { Predictions } = await import("@aws-amplify/predictions");
        // Amazon Translate handles one text per request; run them in parallel.
        await Promise.all(
          pending.map(async ([, value]) => {
            try {
              const { text } = await Predictions.convert({
                translateText: {
                  source: {
                    text: preprocessForTranslation(value, lang),
                    language: "es",
                  },
                  targetLanguage: lang,
                },
              });
              if (text) cache[`${lang}::${value}`] = text;
            } catch (e) {
              console.error("Amazon Translate error for:", value, e);
            }
          })
        );
      } finally {
        // Ignore stale responses (lang/texts changed while awaiting).
        if (reqId === reqIdRef.current) {
          setTranslated(buildResult());
        }
      }
    })();
  }, [texts, targetLang]);

  return translated;
}
