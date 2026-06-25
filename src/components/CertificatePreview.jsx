import React from "react";

// Public assets resolve through CloudFront (same base the landing/gallery use),
// so a stored key -> viewable URL with no async getUrl() round-trip.
const CLOUDFRONT = "https://dnuc5lxyun5b.cloudfront.net/public/";
// pdf.js worker (matches the installed pdfjs-dist version), loaded from a CDN to
// avoid CRA worker bundling. Only fetched when a PDF template is previewed.
const PDF_WORKER =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

// Live WYSIWYG preview of the certificate: the uploaded template (image OR the
// first page of a PDF, rendered via pdf.js) with a sample name overlaid at the
// chosen position/size/color. The name can be dragged (or click anywhere) to
// position it; onPositionChange reports the new x/y as percentages of the image.
export default function CertificatePreview({
  certificate,
  xPct = 50,
  yPct = 50,
  fontPct = 6,
  color = "#1a1a1a",
  sampleName = "Nombre del Participante",
  onPositionChange,
  onPositionCommit,
}) {
  const wrapRef = React.useRef(null);
  const draggingRef = React.useRef(false);
  const [width, setWidth] = React.useState(0);
  const [pdfUrl, setPdfUrl] = React.useState(null); // rendered PDF page (data URL)
  const [pdfState, setPdfState] = React.useState("idle"); // idle|loading|error|done

  const isPdf = certificate ? /\.pdf$/i.test(certificate) : false;
  const url = certificate
    ? /^https?:\/\//i.test(certificate)
      ? certificate
      : `${CLOUDFRONT}${certificate}`
    : "";

  // Render the first page of a PDF template to an image for the preview.
  React.useEffect(() => {
    let cancelled = false;
    if (!certificate || !isPdf) {
      setPdfUrl(null);
      setPdfState("idle");
      return;
    }
    setPdfState("loading");
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER;
        const pdf = await pdfjs.getDocument(url).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({
          canvasContext: canvas.getContext("2d"),
          viewport,
        }).promise;
        if (cancelled) return;
        setPdfUrl(canvas.toDataURL("image/png"));
        setPdfState("done");
      } catch (e) {
        console.error("PDF preview failed:", e);
        if (!cancelled) setPdfState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [certificate, isPdf, url]);

  // Track rendered image width so the overlaid font scales like the Lambda.
  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [certificate, pdfUrl]);

  const reportFromEvent = React.useCallback(
    (e) => {
      const el = wrapRef.current;
      if (!el || !onPositionChange) return;
      const rect = el.getBoundingClientRect();
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const cy = e.touches ? e.touches[0].clientY : e.clientY;
      let x = ((cx - rect.left) / rect.width) * 100;
      let y = ((cy - rect.top) / rect.height) * 100;
      x = Math.max(0, Math.min(100, x));
      y = Math.max(0, Math.min(100, y));
      onPositionChange(Math.round(x * 10) / 10, Math.round(y * 10) / 10);
    },
    [onPositionChange]
  );

  React.useEffect(() => {
    if (!onPositionChange) return;
    const onMove = (e) => {
      if (!draggingRef.current) return;
      e.preventDefault();
      reportFromEvent(e);
    };
    const onUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      if (onPositionCommit) onPositionCommit();
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [onPositionChange, onPositionCommit, reportFromEvent]);

  const onDown = (e) => {
    if (!onPositionChange) return;
    draggingRef.current = true;
    reportFromEvent(e);
  };

  if (!certificate) return null;

  const bgUrl = isPdf ? pdfUrl : url;
  const px = Number.isFinite(Number(xPct)) ? Number(xPct) : 50;
  const py = Number.isFinite(Number(yPct)) ? Number(yPct) : 50;
  const fontPx = (width * (Number(fontPct) || 6)) / 100;

  return (
    <div style={{ marginTop: 4 }}>
      <p style={{ fontSize: "1rem", color: "#304050", marginBottom: 6 }}>
        Vista previa{" "}
        {onPositionChange && bgUrl && (
          <span style={{ fontSize: "0.8125rem", color: "#6b7280" }}>
            — arrastra el nombre para posicionarlo
          </span>
        )}
      </p>

      {isPdf && pdfState === "loading" && (
        <p style={{ fontSize: "0.8125rem", color: "#6b7280" }}>
          Cargando vista previa del PDF…
        </p>
      )}
      {isPdf && pdfState === "error" && (
        <p style={{ fontSize: "0.8125rem", color: "#b45309" }}>
          No se pudo cargar la vista previa del PDF (la posición/tamaño igual se
          aplican al enviar). Tip: sube la plantilla como imagen (PNG/JPG) para
          editar visualmente.
        </p>
      )}

      {bgUrl && (
        <>
          <div
            ref={wrapRef}
            onMouseDown={onDown}
            onTouchStart={onDown}
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 540,
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              overflow: "hidden",
              lineHeight: 0,
              background: "#f9fafb",
              cursor: onPositionChange ? "crosshair" : "default",
              userSelect: "none",
              touchAction: onPositionChange ? "none" : "auto",
            }}
          >
            <img
              src={bgUrl}
              alt="Plantilla del certificado"
              draggable={false}
              style={{ display: "block", width: "100%", height: "auto" }}
            />
            <span
              style={{
                position: "absolute",
                left: `${px}%`,
                top: `${py}%`,
                transform: "translate(-50%, -50%)",
                color: color || "#1a1a1a",
                fontFamily: "Helvetica, Arial, sans-serif",
                fontWeight: 700,
                fontSize: fontPx ? `${fontPx}px` : "16px",
                lineHeight: 1,
                whiteSpace: "nowrap",
                pointerEvents: "none",
                textAlign: "center",
                ...(onPositionChange
                  ? { outline: "1px dashed rgba(37,99,235,0.5)", padding: 1 }
                  : {}),
              }}
            >
              {sampleName}
            </span>
          </div>
          <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: 4 }}>
            Aproximado — la posición y el tamaño finales pueden variar levemente.
          </p>
        </>
      )}
    </div>
  );
}
