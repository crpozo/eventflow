import React from "react";

// Aviso de despliegue: cuando Amplify publica una versión nueva del admin,
// las pestañas abiertas quedan corriendo el código viejo — y guardar desde
// ellas puede pisar datos buenos con datos stale (bug de certificados, julio
// 2026). Cada build escribe /version.json con un id único
// (scripts/write-build-version.js); aquí se consulta al cargar, cada minuto y
// al volver a la pestaña. Si el id cambió respecto al que cargó esta pestaña,
// banner fijo: no guardar nada y recargar.
const POLL_MS = 60000;

// Baseline a nivel de MÓDULO, no del componente: el layout puede desmontar y
// remontar sin recarga real (sign-out/in, flip de rol) y un ref del componente
// adoptaría como baseline el buildId nuevo — el banner desaparecería justo en
// la pestaña stale que debía avisar. Esta variable solo se resetea con una
// recarga de verdad, que es la semántica correcta.
let loadedBuildId = null;

export default function UpdateBanner() {
  const [stale, setStale] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        // El rewrite SPA de Amplify puede responder index.html con 200 para
        // rutas no excluidas: sin este guard, res.json() lanzaría y el catch
        // dejaría la feature muerta en silencio.
        if (!res.headers.get("content-type")?.includes("json")) return;
        const { buildId } = await res.json();
        if (!buildId || cancelled) return;
        if (loadedBuildId == null) {
          // Versión con la que cargó esta pestaña.
          loadedBuildId = buildId;
        } else if (buildId !== loadedBuildId) {
          setStale(true);
        }
      } catch (e) {
        /* dev/offline: sin señal, sin banner */
      }
    };
    check();
    const iv = setInterval(check, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearInterval(iv);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  if (!stale) return null;
  return (
    <div className="fixed inset-x-0 top-0 z-[100] flex flex-wrap items-center justify-center gap-3 bg-brand-500 px-4 py-2.5 text-center shadow-lg">
      <p className="text-sm font-semibold text-white">
        ⚠️ Se publicó una actualización de EventFlow. No guardes cambios en esta
        pestaña — espera y recarga para continuar con la versión nueva.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="rounded-lg bg-white px-4 py-1.5 text-sm font-semibold text-brand-500 transition hover:opacity-90"
      >
        Recargar ahora
      </button>
    </div>
  );
}
