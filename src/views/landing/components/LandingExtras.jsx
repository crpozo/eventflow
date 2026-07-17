import React from "react";

// Public assets are served through CloudFront (same as the landing banner), so
// keys resolve to a URL synchronously — no slow per-image getUrl() round-trip.
const CLOUDFRONT = "https://dnuc5lxyun5b.cloudfront.net/public/";

function toUrls(keys) {
  // De-duplicate keys (the admin uploader dedupes by key, so the landing must
  // too) and resolve each to a URL.
  return [...new Set((keys || []).filter(Boolean))].map((k) =>
    /^https?:\/\//i.test(k) ? k : `${CLOUDFRONT}${k}`
  );
}

/**
 * Extra landing sections rendered below "Event details":
 *  - Photo gallery
 *  - Custom HTML block (e.g. a download-PDF button)
 *  - Partner logos carousel (continuous auto-scroll)
 *
 * All driven by the Landing model (galleryPhotos, customHtml, partnerLogos).
 */
export default function LandingExtras({ landing, ui }) {
  const gallery = toUrls(landing?.galleryPhotos);
  const logos = toUrls(landing?.partnerLogos);
  // NOTE: customHtml now renders under the event description (landing/index.jsx),
  // not here, so the agenda/PDF link shows next to the event details.
  // Lightbox: the URL of the image currently shown enlarged (null = closed).
  const [lightbox, setLightbox] = React.useState(null);

  // Close the lightbox with the Escape key.
  React.useEffect(() => {
    if (!lightbox) return;
    const onKey = (e) => e.key === "Escape" && setLightbox(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  return (
    <>
      {/* Photo gallery */}
      {gallery.length > 0 && (
        <div className="mb-[40px] md:mb-[45px]">
          <h2 className="mb-[25px] text-[28px] md:text-4xl font-bold">
            {ui.gallery}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
            {/* Botones reales (no <img role="button">): las keys son las URLs,
                únicas tras el dedupe de toUrls. */}
            {gallery.map((url, i) => (
              <button
                key={url}
                type="button"
                onClick={() => setLightbox(url)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setLightbox(url);
                  }
                }}
                className="h-40 w-full cursor-zoom-in rounded-xl transition duration-200 hover:opacity-90 md:h-48"
              >
                <img
                  src={url}
                  alt={`${ui.gallery} ${i + 1}`}
                  loading="lazy"
                  className="h-full w-full rounded-xl object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Partner logos carousel (continuous auto-scroll) */}
      {logos.length > 0 && (
        <div className="mb-[40px] md:mb-[45px]">
          <h2 className="mb-[25px] text-[28px] md:text-4xl font-bold">
            {ui.partners}
          </h2>
          <div className="group relative w-full overflow-hidden">
            <div className="flex w-max animate-[landing-marquee_30s_linear_infinite] items-center gap-12 pr-12 group-hover:[animation-play-state:paused]">
              {/* Duplicate the list so the loop is seamless. La copia ("bis")
                  discrimina la key porque cada URL aparece dos veces. */}
              {["original", "bis"].flatMap((copia) =>
                logos.map((url) => (
                  <button
                    key={`${copia}-${url}`}
                    type="button"
                    onClick={() => setLightbox(url)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setLightbox(url);
                      }
                    }}
                    className="cursor-zoom-in"
                  >
                    <img
                      src={url}
                      alt="partner logo"
                      loading="lazy"
                      className="h-16 w-auto max-w-[160px] object-contain md:h-20"
                    />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox overlay: click anywhere or the X to close */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
        >
          {/* Fondo clickeable: cierra al hacer click en cualquier zona oscura.
              Fuera del orden de tabulación; con teclado se cierra con Escape
              (listener global) o con el botón X. */}
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setLightbox(null)}
            aria-label="Cerrar imagen ampliada"
            className="absolute inset-0 h-full w-full cursor-default"
          />
          <button
            type="button"
            onClick={() => setLightbox(null)}
            aria-label="Cerrar"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-3xl leading-none text-white transition hover:bg-white/20"
          >
            ×
          </button>
          {/* relative: pinta la imagen SOBRE el fondo clickeable, así el click
              en la imagen ampliada no cierra (antes lo hacía stopPropagation). */}
          <img
            src={lightbox}
            alt=""
            className="relative max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
          />
        </div>
      )}

      {/* Keyframes for the marquee (scoped, injected once) */}
      <style>{`
        @keyframes landing-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </>
  );
}
