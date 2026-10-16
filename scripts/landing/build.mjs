#!/usr/bin/env node
/* Build de la landing pública liviana (corre después de `react-scripts build`).
 *
 * El panel (CRA) carga en /landing/* todo su bundle: App.jsx, Authenticator de
 * Amplify UI, DataStore, Bootstrap completo desde un CDN y ~410 KB de CSS. Este
 * build genera, con las MISMAS vistas de src/views/landing, un bundle propio:
 *
 *  1. CSS: subset de Bootstrap 4.4.1 (solo reglas cuyas clases aparecen en la
 *     landing o en formRender, en el mismo orden) + index.css procesado con
 *     Tailwind acotado a los archivos de la landing + las reglas globales de
 *     Amplify UI que afectan a la página. Mismo orden de cascada que main.css.
 *  2. JS (esbuild, ESM con code-splitting): React + la landing; el registro,
 *     jQuery/formBuilder, Amplify Storage/Auth/Predictions quedan en chunks
 *     que se cargan bajo demanda (shims de src/landing-app/shims).
 *  3. Bundle de render en servidor (Node) para scripts/landing/prerender.mjs.
 *
 * Salida: build/landing-assets/** y node_modules/.cache/landing/{server.mjs,manifest.json}.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import esbuild from "esbuild";
import postcss from "postcss";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SRC = path.join(ROOT, "src");
const OUT = path.join(ROOT, "build", "landing-assets");
const CACHE = path.join(ROOT, "node_modules", ".cache", "landing");
const PUBLIC_PATH = "/landing-assets/";
const rel = (p) => path.relative(ROOT, p);
const kb = (n) => `${(n / 1024).toFixed(1)} KB`;

// Archivos que pinta la landing (mismos que el content de Tailwind) más el
// motor de formRender, que inyecta clases de Bootstrap en el formulario.
const LANDING_FILES = [
  "src/views/landing/index.jsx",
  "src/views/landing/components/LandingExtras.jsx",
  "src/views/landing/registro/index.jsx",
  "src/layouts/landing/LandingFrame.jsx",
  "src/components/adminUi/index.jsx",
  "src/landing-app/LandingShell.jsx",
  "src/scripts/utils.js",
  "src/scripts/certFields.js",
].map((f) => path.join(ROOT, f));
const FORM_ENGINE = require.resolve("formBuilder/dist/form-render.min.js");

// Módulos que en la landing liviana se sustituyen por un shim (ver shims/).
const SHIMS = {
  "aws-amplify/api": "src/landing-app/shims/api.js",
  "aws-amplify/storage": "src/landing-app/shims/storage.js",
  "aws-amplify/auth": "src/landing-app/shims/auth.js",
  "@aws-amplify/predictions": "src/landing-app/shims/predictions.js",
};

function shimPlugin() {
  const escaped = Object.keys(SHIMS).map((s) => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&"));
  const filter = new RegExp(`^(${escaped.join("|")})$`);
  const shimDir = path.join(SRC, "landing-app", "shims") + path.sep;
  return {
    name: "landing-shims",
    setup(build) {
      build.onResolve({ filter }, (args) =>
        args.importer.startsWith(shimDir) ? undefined : { path: path.join(ROOT, SHIMS[args.path]) }
      );
      // Como CRA: JSX también en .js, pero solo en el código de la app.
      build.onLoad({ filter: /[\\/]src[\\/].*\.js$/ }, (args) => ({
        contents: fs.readFileSync(args.path, "utf8"),
        loader: "jsx",
      }));
    },
  };
}

const hash = (text) => crypto.createHash("sha256").update(text).digest("hex").slice(0, 10);

// ── 1. CSS ──────────────────────────────────────────────────────────────

// Tokens con forma de clase en los archivos de la landing (como el escaneo de
// Tailwind): una regla de Bootstrap se queda si TODAS las clases de alguno de
// sus selectores aparecen. Incluir de más es inocuo (la regla solo aplica a
// elementos con esa clase); de menos cambiaría el aspecto.
function classTokens() {
  const tokens = new Set();
  for (const file of [...LANDING_FILES, FORM_ENGINE]) {
    const text = fs.readFileSync(file, "utf8");
    for (const m of text.matchAll(/[A-Za-z0-9_-]+/g)) tokens.add(m[0]);
  }
  return tokens;
}

function bootstrapSubset(tokens) {
  // Mismo archivo que cargaba el panel desde el CDN (SRI verificado).
  const file = require.resolve("bootstrap/dist/css/bootstrap.min.css");
  const ast = postcss.parse(fs.readFileSync(file, "utf8"));
  const used = (selector) => {
    const classes = [...selector.matchAll(/\.((?:\\.|[A-Za-z0-9_-])+)/g)].map((m) => m[1].replace(/\\/g, ""));
    return classes.every((c) => tokens.has(c));
  };
  ast.walkAtRules("media", (at) => {
    if (/\bprint\b/.test(at.params)) at.remove();
  });
  ast.walkRules((rule) => {
    if (rule.parent?.type === "atrule" && /keyframes/.test(rule.parent.name)) return;
    const kept = rule.selectors.filter(used);
    if (kept.length === 0) rule.remove();
    else rule.selectors = kept;
  });
  ast.walkAtRules((at) => {
    if ((at.name === "media" || at.name === "supports") && (!at.nodes || at.nodes.length === 0)) at.remove();
  });
  ast.walkComments((c) => c.remove());
  return ast.toString();
}

async function buildCss() {
  const tokens = classTokens();
  const bootstrap = bootstrapSubset(tokens);
  const indexCss = fs.readFileSync(path.join(SRC, "index.css"), "utf8");
  const app = await postcss([
    tailwindcss(path.join(SRC, "landing-app", "tailwind.landing.config.js")),
    autoprefixer(),
  ]).process(indexCss, { from: path.join(SRC, "index.css") });
  const globals = fs.readFileSync(path.join(SRC, "landing-app", "amplify-ui-globals.css"), "utf8");
  // Orden de cascada idéntico al panel: Bootstrap (CDN) → main.css (index.css
  // + Amplify UI).
  const { code } = await esbuild.transform([bootstrap, app.css, globals].join("\n"), {
    loader: "css",
    minify: true,
    legalComments: "none",
  });
  const name = `landing.${hash(code)}.css`;
  fs.writeFileSync(path.join(OUT, name), code);
  console.log(`landing/build: CSS ${kb(code.length)} (Bootstrap subset ${kb(bootstrap.length)})`);
  return { cssFile: PUBLIC_PATH + name, cssText: code };
}

// ── 2. JS cliente y 3. bundle de servidor ────────────────────────────────

const common = {
  bundle: true,
  jsx: "automatic",
  nodePaths: [SRC], // imports absolutos como CRA (baseUrl: src)
  loader: { ".png": "file", ".jpg": "file", ".jpeg": "file", ".webp": "file", ".svg": "file", ".gif": "file" },
  assetNames: "m/[name].[hash]",
  publicPath: PUBLIC_PATH,
  define: { "process.env.NODE_ENV": '"production"' },
  legalComments: "none",
  logLevel: "warning",
  plugins: [shimPlugin()],
};

async function buildClient() {
  const result = await esbuild.build({
    ...common,
    entryPoints: { client: path.join(SRC, "landing-app", "client.jsx") },
    outdir: OUT,
    format: "esm",
    splitting: true,
    minify: true,
    target: ["es2019", "chrome80", "safari13", "firefox78"],
    entryNames: "[name].[hash]",
    chunkNames: "c/[name].[hash]",
    define: { ...common.define, global: "globalThis" },
    metafile: true,
  });
  const outputs = result.metafile.outputs;
  const entry = Object.keys(outputs).find((k) => outputs[k].entryPoint && /client\.jsx$/.test(outputs[k].entryPoint));
  const toUrl = (k) => PUBLIC_PATH + path.relative(OUT, path.join(ROOT, k)).split(path.sep).join("/");
  // Chunks que el entry importa de forma estática: se precargan (modulepreload).
  const staticImports = outputs[entry].imports.filter((i) => i.kind === "import-statement").map((i) => i.path);
  const sizeOf = (k) => fs.statSync(path.join(ROOT, k)).size;
  const initial = [entry, ...staticImports];
  const initialBytes = initial.reduce((n, k) => n + sizeOf(k), 0);
  console.log(`landing/build: JS inicial ${kb(initialBytes)} en ${initial.length} archivo(s); total ${Object.keys(outputs).filter((k) => k.endsWith(".js")).length} chunks`);
  fs.writeFileSync(path.join(CACHE, "client-meta.json"), JSON.stringify(result.metafile));
  return { clientJs: toUrl(entry), preload: staticImports.map(toUrl) };
}

async function buildServer() {
  await esbuild.build({
    ...common,
    entryPoints: [path.join(SRC, "landing-app", "server.jsx")],
    outfile: path.join(CACHE, "server.mjs"),
    platform: "node",
    format: "esm",
    target: "node18",
    // react-router-dom/server es CommonJS y hace require("react"): en un bundle
    // ESM hay que proveer `require` (resuelve desde node_modules).
    banner: { js: 'import { createRequire as __ssrRequire } from "node:module"; const require = __ssrRequire(import.meta.url);' },
    // Solo se renderiza la página (sin efectos): lo que corre en el navegador
    // al interactuar no se empaqueta.
    external: [
      "react", "react-dom", "react-dom/*",
      "jquery", "jquery-ui-sortable", "formBuilder", "formBuilder/*", "html2pdf.js",
      "react-qr-code", "aws-amplify", "aws-amplify/*", "@aws-amplify/*",
    ],
  });
}

async function main() {
  const started = Date.now();
  if (!fs.existsSync(path.join(SRC, "amplifyconfiguration.json"))) {
    throw new Error("falta src/amplifyconfiguration.json (scripts/write-amplify-config.js)");
  }
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(CACHE, { recursive: true });
  const [css, client] = await Promise.all([buildCss(), buildClient(), buildServer()]);
  const manifest = { ...css, ...client, builtAt: new Date().toISOString() };
  fs.writeFileSync(path.join(CACHE, "manifest.json"), JSON.stringify(manifest));
  console.log(`landing/build: listo en ${((Date.now() - started) / 1000).toFixed(1)} s → ${rel(OUT)}`);
}

main().catch((e) => {
  console.error("landing/build: ERROR", e);
  process.exit(1);
});
