import React from "react";

// Public assets resolve through CloudFront (same base the landing/gallery use),
// so a stored key -> viewable URL with no async getUrl() round-trip.
const CLOUDFRONT = "https://dnuc5lxyun5b.cloudfront.net/public/";

// Mirror of the Lambda's PRESET_POSITIONS (certificateSender/src/index.js) so the
// on-screen preview matches where the name is drawn on the real PDF. Keep in sync.
const PRESETS = {
  centro: { xPct: 50, yPct: 50 },
  "centro-arriba": { xPct: 50, yPct: 30 },
  "centro-abajo": { xPct: 50, yPct: 70 },
  "inferior-izquierda": { xPct: 28, yPct: 85 },
  "inferior-derecha": { xPct: 72, yPct: 85 },
};

// Live WYSIWYG preview of the certificate: the uploaded template image with a
// sample name overlaid at the chosen position/size/color. Approximates the
// Lambda's pdf-lib drawing (fontSize = imageWidth * fontPct/100, centered on the
// preset point). Updates in real time as the form props change.
export default function CertificatePreview({
  certificate,
  preset = "centro",
  fontPct = 6,
  color = "#1a1a1a",
  sampleName = "Nombre del Participante",
}) {
  const wrapRef = React.useRef(null);
  const [width, setWidth] = React.useState(0);

  // Track the rendered image width so the overlaid font scales proportionally,
  // matching the Lambda (which sizes the font as a % of the image width).
  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [certificate]);

  if (!certificate) return null;

  // PDF templates can't be shown via <img>; only image templates preview.
  if (/\.pdf$/i.test(certificate)) {
    return (
      <p style={{ fontSize: "0.8125rem", color: "#6b7280", marginTop: 4 }}>
        Vista previa disponible solo para plantillas de imagen (PNG/JPG).
      </p>
    );
  }

  const url = /^https?:\/\//i.test(certificate)
    ? certificate
    : `${CLOUDFRONT}${certificate}`;
  const pos = PRESETS[preset] || PRESETS.centro;
  const fontPx = (width * (Number(fontPct) || 6)) / 100;

  return (
    <div style={{ marginTop: 4 }}>
      <p style={{ fontSize: "1rem", color: "#304050", marginBottom: 6 }}>
        Vista previa
      </p>
      <div
        ref={wrapRef}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 540,
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          overflow: "hidden",
          lineHeight: 0,
          background: "#f9fafb",
        }}
      >
        <img
          src={url}
          alt="Plantilla del certificado"
          style={{ display: "block", width: "100%", height: "auto" }}
        />
        <span
          style={{
            position: "absolute",
            left: `${pos.xPct}%`,
            top: `${pos.yPct}%`,
            transform: "translate(-50%, -50%)",
            color: color || "#1a1a1a",
            fontFamily: "Helvetica, Arial, sans-serif",
            fontWeight: 700,
            fontSize: fontPx ? `${fontPx}px` : "16px",
            lineHeight: 1,
            whiteSpace: "nowrap",
            pointerEvents: "none",
            textAlign: "center",
          }}
        >
          {sampleName}
        </span>
      </div>
      <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: 4 }}>
        Aproximado — la posición y el tamaño finales pueden variar levemente.
      </p>
    </div>
  );
}
