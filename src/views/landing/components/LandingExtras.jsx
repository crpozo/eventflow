import React from "react";
import { getUrl } from "aws-amplify/storage";

// Resolves a list of S3 keys (or already-absolute URLs) into displayable URLs.
function useResolvedUrls(keys) {
  const [urls, setUrls] = React.useState([]);
  const keySig = JSON.stringify(keys || []);

  React.useEffect(() => {
    let active = true;
    const list = (keys || []).filter(Boolean);
    if (list.length === 0) {
      setUrls([]);
      return;
    }
    (async () => {
      const resolved = await Promise.all(
        list.map(async (k) => {
          if (/^https?:\/\//i.test(k)) return k; // already a URL
          try {
            const r = await getUrl({ key: k });
            return r.url.toString();
          } catch (e) {
            console.error("LandingExtras: could not resolve", k, e);
            return null;
          }
        })
      );
      if (active) setUrls(resolved.filter(Boolean));
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keySig]);

  return urls;
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
  const gallery = useResolvedUrls(landing?.galleryPhotos);
  const logos = useResolvedUrls(landing?.partnerLogos);
  const customHtml = landing?.customHtml;
  const hasHtml = typeof customHtml === "string" && customHtml.trim().length > 0;

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
                className="h-40 w-full rounded-xl object-cover md:h-48"
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
                  className="h-16 w-auto max-w-[160px] object-contain md:h-20"
                />
              ))}
            </div>
          </div>
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
