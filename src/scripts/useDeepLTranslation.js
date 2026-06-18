import { useEffect, useRef, useState } from "react";

// DeepL key is read from an env var so it is not hard-coded in the bundle.
// Set REACT_APP_DEEPL_KEY in the Amplify environment variables.
const API_KEY = process.env.REACT_APP_DEEPL_KEY;
const ENDPOINT = "https://api-free.deepl.com/v2/translate";

// Module-level cache shared across components/renders so toggling languages
// back and forth never re-hits the DeepL API for the same string.
const cache = {}; // { "EN::texto original": "translated text" }

/**
 * Translates a dictionary of strings on the fly using DeepL.
 *
 * Designed for the public landing pages, whose content is created dynamically
 * by users (title, description, location, ticket titles, ...). Spanish is the
 * source language, so when targetLang is "ES" the original texts are returned
 * untouched and no request is made.
 *
 * @param {Object<string,string>} texts  key -> spanish text
 * @param {string} targetLang            "ES" | "EN" (case-insensitive)
 * @returns {Object<string,string>}      same keys, translated values
 */
export function useDeepLTranslation(texts = {}, targetLang = "ES") {
  const [translated, setTranslated] = useState(texts);
  const reqIdRef = useRef(0);

  useEffect(() => {
    const lang = (targetLang || "ES").toUpperCase();
    const entries = Object.entries(texts);

    // Builds the output dictionary from whatever is currently cached,
    // falling back to the original text when no translation exists (yet).
    const buildResult = () =>
      Object.fromEntries(
        entries.map(([key, value]) => {
          if (typeof value !== "string" || value.trim().length === 0) {
            return [key, value];
          }
          const hit = cache[`${lang}::${value}`];
          return [key, hit !== undefined ? hit : value];
        })
      );

    // Spanish is the source language: nothing to translate.
    if (lang === "ES") {
      setTranslated(texts);
      return;
    }

    // Show cached/original values immediately to avoid a flash of empty UI.
    setTranslated(buildResult());

    // Without an API key we cannot translate; keep the original (Spanish) text.
    if (!API_KEY) {
      console.warn(
        "DeepL: REACT_APP_DEEPL_KEY is not set; landing pages will not be translated."
      );
      return;
    }

    // Only request the strings we have not translated before.
    const pending = entries.filter(
      ([, value]) =>
        typeof value === "string" &&
        value.trim().length > 0 &&
        cache[`${lang}::${value}`] === undefined
    );
    if (pending.length === 0) return;

    const reqId = ++reqIdRef.current;

    (async () => {
      try {
        const body = new URLSearchParams();
        // DeepL accepts multiple `text` params and preserves their order,
        // so we translate everything in a single request.
        pending.forEach(([, value]) => body.append("text", value));
        body.append("source_lang", "ES");
        body.append("target_lang", lang);

        const res = await fetch(ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `DeepL-Auth-Key ${API_KEY}`,
          },
          body,
        });
        const json = await res.json();
        const results = json?.translations || [];
        pending.forEach(([, value], i) => {
          if (results[i]?.text) {
            cache[`${lang}::${value}`] = results[i].text;
          }
        });
      } catch (e) {
        console.error("DeepL translation error:", e);
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
