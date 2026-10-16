#!/usr/bin/env node
/* Genera src/aws-exports.js y src/amplifyconfiguration.json en el build de
 * Amplify Hosting a partir de la variable AMPLIFY_CONFIG_JSON (rev 2026-10-16).
 *
 * Antes los generaba `amplifyPush --simple`, que corría en CADA push y tardaba
 * ~4 min redesplegando CloudFormation sin cambios. Con AMPLIFY_DIFF_BACKEND el
 * backend solo se construye cuando cambia amplify/, y este script cubre la
 * configuración del frontend el resto de veces. La config NO se versiona (el
 * repo es público); vive como variable de entorno de la app en Amplify.
 */
const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "..", "src");
const exportsPath = path.join(src, "aws-exports.js");
const jsonPath = path.join(src, "amplifyconfiguration.json");
const raw = process.env.AMPLIFY_CONFIG_JSON;

if (!raw) {
  if (fs.existsSync(exportsPath) && fs.existsSync(jsonPath)) {
    console.log("write-amplify-config: AMPLIFY_CONFIG_JSON no definida; se usan los archivos existentes.");
    process.exit(0);
  }
  console.error("write-amplify-config: falta AMPLIFY_CONFIG_JSON y no existe src/aws-exports.js");
  process.exit(1);
}

let cfg;
try {
  cfg = JSON.parse(raw);
} catch (e) {
  console.error("write-amplify-config: AMPLIFY_CONFIG_JSON no es JSON válido:", e.message);
  process.exit(1);
}
if (!cfg.aws_project_region) {
  console.error("write-amplify-config: la configuración no trae aws_project_region");
  process.exit(1);
}

const body = JSON.stringify(cfg, null, 4);
fs.writeFileSync(exportsPath, `/* eslint-disable */\n// Generado en el build por scripts/write-amplify-config.js — no editar.\nconst awsmobile = ${body};\n\nexport default awsmobile;\n`);
fs.writeFileSync(jsonPath, `${body}\n`);
console.log(`write-amplify-config: configuración escrita (${Object.keys(cfg).length} claves, región ${cfg.aws_project_region}).`);
