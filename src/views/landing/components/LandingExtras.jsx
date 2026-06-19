import React from "react";

// Public assets are served through CloudFront (same as the landing banner), so
// keys resolve to a URL synchronously — no slow per-image getUrl() round-trip.
const CLOUDFRONT = "https://dnuc5lxyun5b.cloudfront.net/public/";

function toUrls(keys) {
  return (keys || [])
    .filter(Boolean)
    .map((k) => (/^https?:\/\//i.test(k) ? k : `${CLOUDFRONT}${k}`));
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
  const customHtml = landing?.customHtml;
  const hasHtml = typeof customHtml === "string" && customHtml.trim().length > 0;
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
            {gallery.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`${ui.gallery} ${i + 1}`}
                loading="lazy"
                onClick={() => setLightbox(url)}
                className="h-40 w-full cursor-zoom-in rounded-xl object-cover transition duration-200 hover:opacity-90 md:h-48"
              />
            ))}
          </div>
        </div>
      )}

      {/* Custom HTML block (admin-controlled) */}
      {hasHtml && (
        <div
          className="landing-custom-html mb-[40px] md:mb-[45px]"
          // Content is authored by trusted admins from the event admin panel.
          dangerouslySetInnerHTML={{ __html: customHtml }}
        />
      )}

      {/* Partner logos carousel (continuous auto-scroll) */}
      {logos.length > 0 && (
        <div className="mb-[40px] md:mb-[45px]">
          <h2 className="mb-[25px] text-[28px] md:text-4xl font-bold">
            {ui.partners}
          </h2>
          <div className="group relative w-full overflow-hidden">
            <div className="flex w-max animate-[landing-marquee_30s_linear_infinite] items-center gap-12 pr-12 group-hover:[animation-play-state:paused]">
              {/* Duplicate the list so the loop is seamless */}
              {[...logos, ...logos].map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt="partner logo"
                  loading="lazy"
                  onClick={() => setLightbox(url)}
                  className="h-16 w-auto max-w-[160px] cursor-zoom-in object-contain md:h-20"
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox overlay: click anywhere or the X to close */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            aria-label="Cerrar"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-3xl leading-none text-white transition hover:bg-white/20"
          >
            ×
          </button>
          <img
            src={lightbox}
            alt=""
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
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
