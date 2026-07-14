// Escribe build/version.json con un id único por build. El admin lo consulta
// (components/UpdateBanner) para detectar que se publicó una versión nueva y
// avisar a las pestañas abiertas que no guarden nada y recarguen — guardar
// desde una pestaña con código viejo puede pisar datos buenos con datos stale
// (bug de certificados, julio 2026). Corre como paso extra de `npm run build`
// tanto local como en Amplify CI (AWS_COMMIT_ID disponible ahí).
const fs = require("fs");
const path = require("path");

let commit = process.env.AWS_COMMIT_ID || "";
if (!commit) {
  try {
    commit = require("child_process")
      .execSync("git rev-parse --short HEAD", {
        stdio: ["ignore", "pipe", "ignore"],
      })
      .toString()
      .trim();
  } catch (e) {
    commit = "local";
  }
}

// El timestamp garantiza unicidad aunque el commit no cambie (rebuilds).
const version = { buildId: `${commit.slice(0, 12)}-${Date.now()}` };
const out = path.join(__dirname, "..", "build", "version.json");
fs.writeFileSync(out, JSON.stringify(version));
console.log("build/version.json →", version.buildId);
