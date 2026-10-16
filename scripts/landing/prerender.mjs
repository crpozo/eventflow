#!/usr/bin/env node
/* Landings estáticas (corre después de scripts/landing/build.mjs).
 *
 * Por cada landing activa escribe build/landing/<eventId>/index.html (y
 * /en/index.html) con la página YA renderizada (React en Node), sus datos en
 * window.__LANDING__, el CSS en línea y el banner en AVIF/WebP a varios
 * anchos. Amplify Hosting la sirve como archivo estático desde el CDN: se ve
 * sin esperar a React ni a AppSync; luego React la hidrata y refresca datos.
 *
 * Además escribe build/landing.html: la misma app sin datos, para landings
 * que aún no tienen HTML estático (p. ej. creadas después del último build).
 *
 * Nunca rompe el build: si algo falla, esa landing queda en modo SPA (como
 * antes). Cachea imágenes y traducciones entre builds en .landing-cache/.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const BUILD = path.join(ROOT, "build");
const BUILD_CACHE = path.join(ROOT, "node_modules", ".cache", "landing");
const PERSIST = path.join(ROOT, ".landing-cache"); // cache de Amplify entre builds
const IMG_OUT = path.join(BUILD, "landing-img");
const SITE = "https://www.eventflow.ec";
const CLOUDFRONT_PUBLIC = "https://dnuc5lxyun5b.cloudfront.net/public/";
const WIDTHS = [480, 800, 1200, 1600];
const CONCURRENCY = 6;

const log = (...a) => console.log("landing/prerender:", ...a);
const sha = (t) => crypto.createHash("sha256").update(t).digest("hex");

function loadConfig() {
  const raw = process.env.AMPLIFY_CONFIG_JSON || fs.readFileSync(path.join(ROOT, "src", "amplifyconfiguration.json"), "utf8");
  return JSON.parse(raw);
}

// ── HTML ────────────────────────────────────────────────────────────────

const escHtml = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
// JSON dentro de <script>: sin "</script>", "<!--" ni separadores de línea JS.
const safeJson = (v) =>
  JSON.stringify(v).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
const plainText = (html, max = 200) => {
  const t = String(html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
};

// Bloque de fuentes de public/index.html (preload + @font-face): una sola fuente
// de verdad para el panel y las landings.
function fontsBlock() {
  const html = fs.readFileSync(path.join(ROOT, "public", "index.html"), "utf8");
  const preloads = html.match(/<link rel="preload"[^>]*as="font"[^>]*>/g) || [];
  const style = (html.match(/<style id="ef-fonts">[\s\S]*?<\/style>/) || [""])[0];
  return [...preloads, style.replace(/\n\s*/g, " ")].join("\n");
}

// Loader inicial idéntico al de public/index.html (solo para landing.html).
function initialLoaderBlock() {
  const html = fs.readFileSync(path.join(ROOT, "public", "index.html"), "utf8");
  const style = (html.match(/<style>\s*#initial-loader[\s\S]*?<\/style>/) || [""])[0];
  const markup = (html.match(/<div id="initial-loader">[\s\S]*?<\/div>\s*<\/div>/) || [""])[0];
  return { style, markup };
}

// Modo SPA (landing.html): lanza la consulta de datos de la landing desde el
// HTML, en paralelo con la descarga del JS (landingData.takePrefetch la
// reutiliza). La API key es la misma pública que ya viaja en el bundle.
function prefetchScript(cfg, query) {
  const js = `(function(){var m=location.pathname.match(/^\\/landing\\/([0-9a-fA-F-]{36})(?:\\/|$)/);if(!m)return;var id=m[1];` +
    `window.__LANDING_PREFETCH__={eventId:id,promise:fetch(${JSON.stringify(cfg.aws_appsync_graphqlEndpoint)},{method:"POST",` +
    `headers:{"content-type":"application/json","x-api-key":${JSON.stringify(cfg.aws_appsync_apiKey)}},` +
    `body:JSON.stringify({query:${JSON.stringify(query)},variables:{eventId:id,lf:{landingEventId:{eq:id}},ff:{formEventId:{eq:id}},limit:1000}})` +
    `}).then(function(r){return r.json()}).catch(function(){return null})};})();`;
  return `<script>${js}</script>`;
}

// CloudWatch RUM (Core Web Vitals de visitantes reales). Solo si la app de
// Amplify define LANDING_RUM (salida de infra/landing-rum). El cliente se pide
// cuando la página ya cargó: no compite con el banner ni con la hidratación.
function rumScript() {
  let rum = null;
  try { rum = process.env.LANDING_RUM ? JSON.parse(process.env.LANDING_RUM) : null; } catch { rum = null; }
  if (!rum?.appMonitorId) return "";
  const config = {
    sessionSampleRate: rum.sampleRate ?? 1,
    identityPoolId: rum.identityPoolId,
    guestRoleArn: rum.guestRoleArn,
    endpoint: `https://dataplane.rum.${rum.region}.amazonaws.com`,
    telemetries: ["performance", "errors"],
    allowCookies: false,
    enableXRay: false,
  };
  const src = `https://client.rum.us-east-1.amazonaws.com/1.x/cwr.js`;
  return `<script>(function(n,i,v,r,s){var x=window;x.AwsRumClient={q:[],n:n,i:i,v:v,r:r,c:${JSON.stringify(config)}};` +
    `x[n]=function(c,p){x.AwsRumClient.q.push({c:c,p:p})};addEventListener("load",function(){setTimeout(function(){` +
    `var e=document.createElement("script");e.async=true;e.src=s;document.head.appendChild(e)},0)})})` +
    `("cwr",${JSON.stringify(rum.appMonitorId)},"1.0.0",${JSON.stringify(rum.region)},${JSON.stringify(src)});</script>`;
}

// El banner es el LCP: se precarga desde el <head>, ANTES que las fuentes y el
// JS, para que no compita por el ancho de banda en redes lentas. Solo la
// variante AVIF (type: los navegadores sin AVIF la ignoran y usan <picture>).
function bannerPreload(data) {
  const key = data?.landing?.mainBanner;
  const set = key ? data?.images?.[key] : null;
  if (!set?.avif) return "";
  return `<link rel="preload" as="image" type="image/avif" imagesrcset="${escHtml(set.avif)}" imagesizes="100vw" fetchpriority="high"/>`;
}

function htmlPage({ manifest, fonts, cfg, lang, head, root, data, loaderStyle = "", extraHead = "" }) {
  const appsync = new URL(cfg.aws_appsync_graphqlEndpoint).origin;
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<meta name="theme-color" content="#000000"/>
${head}
${bannerPreload(data)}
<link rel="icon" href="/favicon.ico"/>
<link rel="apple-touch-icon" href="/logo192.png"/>
<link rel="preconnect" href="${appsync}" crossorigin/>
${fonts}
<style>${manifest.cssText}</style>
${loaderStyle}
${extraHead}
${rumScript()}
<link rel="modulepreload" href="${manifest.clientJs}" fetchpriority="low"/>
${manifest.preload.map((p) => `<link rel="modulepreload" href="${p}" fetchpriority="low"/>`).join("\n")}
</head>
<body>
<div id="root">${root}</div>
<script>window.__LANDING__=${safeJson(data)}</script>
<script type="module" src="${manifest.clientJs}" fetchpriority="low"></script>
</body>
</html>
`;
}

function landingHead({ landing, eventId, lang }) {
  const url = `${SITE}/landing/${eventId}${lang === "en" ? "/en" : ""}`;
  const image = landing.mainBanner ? `${CLOUDFRONT_PUBLIC}${encodeURI(landing.mainBanner)}` : `${SITE}/logo512.png`;
  const title = escHtml(landing.title);
  const desc = escHtml(plainText(landing.description || landing.extraInfo));
  return [
    `<title>${title}</title>`,
    `<meta name="description" content="${desc}"/>`,
    `<link rel="canonical" href="${url}"/>`,
    `<link rel="alternate" hreflang="es" href="${SITE}/landing/${eventId}"/>`,
    `<link rel="alternate" hreflang="en" href="${SITE}/landing/${eventId}/en"/>`,
    `<meta property="og:type" content="website"/>`,
    `<meta property="og:site_name" content="Eventos USFQ"/>`,
    `<meta property="og:title" content="${title}"/>`,
    `<meta property="og:description" content="${desc}"/>`,
    `<meta property="og:url" content="${url}"/>`,
    `<meta property="og:image" content="${escHtml(image)}"/>`,
    `<meta name="twitter:card" content="summary_large_image"/>`,
  ].join("\n");
}

// ── Datos ───────────────────────────────────────────────────────────────

function graphqlClient(cfg) {
  return async (query, variables = {}) => {
    const res = await fetch(cfg.aws_appsync_graphqlEndpoint, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": cfg.aws_appsync_apiKey },
      body: JSON.stringify({ query, variables }),
    });
    const json = await res.json();
    if (!res.ok || json.errors?.length) throw new Error(`AppSync: ${JSON.stringify(json.errors || res.status).slice(0, 300)}`);
    return json.data;
  };
}

async function listAll(gql, root, type, fields) {
  const items = [];
  let nextToken = null;
  do {
    const data = await gql(
      `query All($limit: Int, $nextToken: String) { ${root}(limit: $limit, nextToken: $nextToken) { items { ${fields} } nextToken } }`,
      { limit: 1000, nextToken }
    );
    items.push(...data[root].items.filter((i) => i && !i._deleted));
    nextToken = data[root].nextToken;
  } while (nextToken);
  return items;
}

// ── Traducciones (Amazon Translate con la identidad de invitado de Cognito,
//    la misma que usa el navegador del visitante) ─────────────────────────

function translator(cfg, ssr) {
  const file = path.join(PERSIST, "translations.json");
  let store = {};
  try { store = JSON.parse(fs.readFileSync(file, "utf8")); } catch { /* primera vez */ }
  let clientPromise = null;
  let disabled = false;
  let misses = 0;

  const client = () => {
    clientPromise ||= (async () => {
      const region = cfg.aws_cognito_region || cfg.aws_project_region;
      const call = async (target, body) => {
        const r = await fetch(`https://cognito-identity.${region}.amazonaws.com/`, {
          method: "POST",
          headers: { "content-type": "application/x-amz-json-1.1", "x-amz-target": `AWSCognitoIdentityService.${target}` },
          body: JSON.stringify(body),
        });
        if (!r.ok) throw new Error(`Cognito ${target}: ${r.status}`);
        return r.json();
      };
      const { IdentityId } = await call("GetId", { IdentityPoolId: cfg.aws_cognito_identity_pool_id });
      const { Credentials: c } = await call("GetCredentialsForIdentity", { IdentityId });
      const { TranslateClient, TranslateTextCommand } = await import("@aws-sdk/client-translate");
      const tc = new TranslateClient({
        region: cfg.predictions?.convert?.translateText?.region || "us-east-1",
        credentials: { accessKeyId: c.AccessKeyId, secretAccessKey: c.SecretKey, sessionToken: c.SessionToken },
      });
      return (text) => tc.send(new TranslateTextCommand({ Text: text, SourceLanguageCode: "es", TargetLanguageCode: "en" }));
    })();
    return clientPromise;
  };

  // Mismo flujo que useAwsTranslation/translateFormData: overrides primero,
  // preprocesado y la clave de caché es el texto ORIGINAL.
  async function translate(text) {
    if (typeof text !== "string" || text.trim().length === 0) return null;
    if (ssr.applyOverride(text, "en")) return null; // el navegador aplica el override
    const key = `en::${text}`;
    if (store[key] !== undefined) return store[key];
    if (disabled) return null;
    try {
      const send = await client();
      const out = await send(ssr.preprocessForTranslation(text, "en"));
      misses += 1;
      if (out?.TranslatedText) store[key] = out.TranslatedText;
      return store[key] ?? null;
    } catch (e) {
      disabled = true; // sin permisos/red: el navegador traducirá como antes
      log(`traducción desactivada para este build (${e.message})`);
      return null;
    }
  }

  return {
    async translateAll(texts) {
      const out = {};
      for (const t of new Set(texts)) {
        const tr = await translate(t);
        if (tr) out[t] = tr;
      }
      return out;
    },
    save() {
      fs.mkdirSync(PERSIST, { recursive: true });
      fs.writeFileSync(file, JSON.stringify(store));
      return misses;
    },
  };
}

// Textos que la landing traduce en el navegador (baseTexts de la vista, el
// formulario con sus campos de certificado y el consentimiento).
function translatableTexts(ssr, landing, event, form) {
  const texts = [landing.title, landing.description, landing.location, landing.extraInfo, landing.customHtml, ...(landing.ticketTitle || [])];
  let questions = form?.questions;
  if (typeof questions === "string") {
    try { questions = JSON.parse(questions); } catch { questions = []; }
  }
  const full = ssr.withCertFields(Array.isArray(questions) ? questions : [], event.sendCertificates === true);
  for (const q of Array.isArray(full) ? full : []) {
    for (const f of ["label", "placeholder", "description"]) if (typeof q?.[f] === "string") texts.push(q[f]);
    for (const v of q?.values || []) if (typeof v?.label === "string") texts.push(v.label);
  }
  texts.push(landing.userConsentCheck || ssr.DEFAULT_CONSENT_HTML);
  return texts.filter((t) => typeof t === "string" && t.trim().length > 0);
}

// ── Banners: AVIF + WebP a varios anchos, cacheados por key ──────────────

async function imageMaker() {
  let sharp = null;
  try {
    sharp = (await import("sharp")).default;
  } catch (e) {
    log(`sharp no disponible (${e.message}): banners sin variantes`);
  }
  const dir = path.join(PERSIST, "img");
  fs.mkdirSync(dir, { recursive: true });
  fs.mkdirSync(IMG_OUT, { recursive: true });
  let generated = 0;

  return {
    async variants(key, { avif }) {
      if (!sharp || !key) return null;
      const id = sha(key).slice(0, 16);
      const metaFile = path.join(dir, `${id}.json`);
      let meta = null;
      try { meta = JSON.parse(fs.readFileSync(metaFile, "utf8")); } catch { /* no cacheado */ }
      const want = avif ? ["avif", "webp"] : ["webp"];
      const complete = meta && want.every((f) => meta.formats.includes(f)) &&
        meta.files.every((f) => fs.existsSync(path.join(dir, f)));
      if (!complete) {
        const res = await fetch(`${CLOUDFRONT_PUBLIC}${encodeURI(key)}`);
        if (!res.ok) throw new Error(`banner ${res.status}`);
        const input = Buffer.from(await res.arrayBuffer());
        const base = sharp(input, { failOn: "none" }).rotate();
        const { width = 0 } = await base.metadata();
        const widths = WIDTHS.filter((w) => w < width);
        if (width > 0 && (widths.length === 0 || width < WIDTHS[WIDTHS.length - 1])) widths.push(Math.min(width, WIDTHS[WIDTHS.length - 1]));
        const files = [];
        for (const w of [...new Set(widths)]) {
          for (const fmt of want) {
            const name = `${id}-${w}.${fmt}`;
            const pipeline = base.clone().resize({ width: w, withoutEnlargement: true });
            const buf = fmt === "avif"
              ? await pipeline.avif({ quality: 50, effort: 3 }).toBuffer()
              : await pipeline.webp({ quality: 78 }).toBuffer();
            fs.writeFileSync(path.join(dir, name), buf);
            files.push(name);
            generated += 1;
          }
        }
        meta = { key, widths: [...new Set(widths)], formats: want, files };
        fs.writeFileSync(metaFile, JSON.stringify(meta));
      }
      const set = {};
      for (const fmt of want) {
        set[fmt] = meta.widths.map((w) => {
          const name = `${id}-${w}.${fmt}`;
          fs.copyFileSync(path.join(dir, name), path.join(IMG_OUT, name));
          return `/landing-img/${name} ${w}w`;
        }).join(", ");
      }
      return set;
    },
    get generated() { return generated; },
  };
}

// ── Pool simple de concurrencia ──────────────────────────────────────────

async function pool(items, n, fn) {
  const queue = [...items];
  await Promise.all(Array.from({ length: n }, async () => {
    while (queue.length) await fn(queue.shift());
  }));
}

// ── Main ────────────────────────────────────────────────────────────────

async function main() {
  const started = Date.now();
  const startedIso = new Date(started).toISOString(); // los datos se leen después de este instante
  const manifest = JSON.parse(fs.readFileSync(path.join(BUILD_CACHE, "manifest.json"), "utf8"));
  const ssr = await import(pathToFileURL(path.join(BUILD_CACHE, "server.mjs")).href);
  const cfg = loadConfig();
  const fonts = fontsBlock();

  // Shell sin datos (modo SPA de la landing liviana).
  const loader = initialLoaderBlock();
  fs.writeFileSync(path.join(BUILD, "landing.html"), htmlPage({
    manifest, fonts, cfg, lang: "es", head: "<title>Eventos USFQ</title>",
    root: loader.markup, data: null, loaderStyle: loader.style,
    extraHead: prefetchScript(cfg, ssr.LANDING_BUNDLE),
  }));

  let landings, events, forms;
  try {
    const gql = graphqlClient(cfg);
    [landings, events, forms] = await Promise.all([
      listAll(gql, "listLandings", "Landing", ssr.LANDING_FIELDS),
      listAll(gql, "listEvents", "Event", ssr.EVENT_FIELDS),
      listAll(gql, "listForms", "Form", ssr.FORM_FIELDS),
    ]);
  } catch (e) {
    log(`AVISO: no se pudieron leer los datos (${e.message}); sin landings estáticas en este build`);
    return;
  }
  const eventById = new Map(events.map((e) => [e.id, e]));
  const formByEvent = new Map();
  for (const f of forms) if (f.formEventId && !formByEvent.has(f.formEventId)) formByEvent.set(f.formEventId, f);

  const tr = translator(cfg, ssr);
  const images = await imageMaker();
  const recentCutoff = Date.now() - 30 * 24 * 3600 * 1000;
  const built = [];
  const skipped = { inactive: 0, noEvent: 0, error: 0 };

  await pool(landings, CONCURRENCY, async (landing) => {
    const eventId = landing.landingEventId;
    const event = eventId && eventById.get(eventId);
    if (landing.active === false) { skipped.inactive += 1; return; }
    if (!event) { skipped.noEvent += 1; return; }
    try {
      const form = formByEvent.get(eventId) || null;
      const when = Date.parse(event.endDate || event.startDate || event.date || "") || 0;
      const imagesMap = {};
      if (landing.mainBanner) {
        try {
          const set = await images.variants(landing.mainBanner, { avif: when >= recentCutoff });
          if (set) imagesMap[landing.mainBanner] = set;
        } catch (e) {
          log(`banner sin variantes (${eventId}): ${e.message}`);
        }
      }
      const en = await tr.translateAll(translatableTexts(ssr, landing, event, form));
      const data = { eventId, event, landing, form, images: imagesMap, translations: { en }, builtAt: new Date().toISOString() };

      for (const lang of ["es", "en"]) {
        const url = lang === "en" ? `/landing/${eventId}/en` : `/landing/${eventId}`;
        const html = htmlPage({
          manifest, fonts, cfg, lang,
          head: landingHead({ landing, eventId, lang }),
          root: ssr.renderLanding(url, data),
          data,
        });
        const dir = path.join(BUILD, "landing", eventId, ...(lang === "en" ? ["en"] : []));
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, "index.html"), html);
      }
      built.push(eventId);
    } catch (e) {
      skipped.error += 1;
      log(`ERROR en ${eventId} (queda en modo SPA): ${e.stack || e.message}`);
    }
  });

  const misses = tr.save();
  // Índice público (fuera de /landing/ para no chocar con la regla
  // /landing/<id> de Amplify): lo lee el disparador de rebuilds para saber de
  // cuándo son los datos de este build.
  fs.writeFileSync(path.join(BUILD, "landing-index.json"), JSON.stringify({ builtAt: startedIso, landings: built.sort() }));
  log(`${built.length} landings estáticas (ES+EN) · omitidas ${JSON.stringify(skipped)} · ` +
    `${images.generated} imágenes nuevas · ${misses} traducciones nuevas · ${((Date.now() - started) / 1000).toFixed(1)} s`);
}

main().catch((e) => {
  // Nunca rompe el despliegue: sin landings estáticas todo sigue en modo SPA.
  console.error("landing/prerender: ERROR (se continúa sin landings estáticas)", e);
});
