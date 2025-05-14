import { useEffect, useState } from "react";

const API_KEY = "REMOVED-DEEPL-KEY";

export function useDeepLTranslation(texts = {}, targetLang = "EN") {
  const [translated, setTranslated] = useState(texts);

  useEffect(() => {
    const translateTexts = async () => {
      const entries = Object.entries(texts);

      const translatedEntries = await Promise.all(
        entries.map(async ([key, value]) => {
          try {
            const res = await fetch("https://api-free.deepl.com/v2/translate", {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `DeepL-Auth-Key ${API_KEY}`,
              },
              body: new URLSearchParams({
                text: value,
                target_lang: targetLang.toUpperCase(),
              }),
            });
            const json = await res.json();
            return [key, json.translations[0].text];
          } catch (e) {
            console.error("Error translating:", key, e);
            return [key, value]; // fallback
          }
        })
      );

      setTranslated(Object.fromEntries(translatedEntries));
    };

    if (targetLang !== "ES") {
      translateTexts();
    } else {
      setTranslated(texts);
    }
  }, [texts, targetLang]);

  return translated;
}
