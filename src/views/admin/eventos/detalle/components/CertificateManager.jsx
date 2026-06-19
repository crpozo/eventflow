import React from "react";
import { uploadData, getUrl } from "aws-amplify/storage";
import { DataStore } from "aws-amplify/datastore";
import { Event } from "models";
import { MdUploadFile } from "react-icons/md";

const DEFAULT_POS = {
  xPct: 50,
  yPct: 50,
  fontPct: 6,
  color: "#1a1a1a",
  align: "center",
};

/**
 * Admin configuration for attendee certificates:
 *  - Toggle automatic sending after the event ends
 *  - Upload a certificate template (image)
 *  - Place where the attendee's name goes (click on the preview) + font/color
 * Saved on the Event model (sendCertificates, certificate, certificatePosition).
 * The actual emailing is done server-side once the event ends (see runbook).
 */
export default function CertificateManager({ event }) {
  const [enabled, setEnabled] = React.useState(!!event?.sendCertificates);
  const [certKey, setCertKey] = React.useState(event?.certificate || "");
  const [templateUrl, setTemplateUrl] = React.useState("");
  const [pos, setPos] = React.useState(() => {
    try {
      return { ...DEFAULT_POS, ...JSON.parse(event?.certificatePosition || "{}") };
    } catch (e) {
      return DEFAULT_POS;
    }
  });
  const [sampleName, setSampleName] = React.useState("Nombre Apellido");
  const [busy, setBusy] = React.useState(false);
  const [boxWidth, setBoxWidth] = React.useState(0);
  const boxRef = React.useRef(null);

  // Resolve the stored template key into a preview URL.
  React.useEffect(() => {
    let active = true;
    if (!certKey) {
      setTemplateUrl("");
      return;
    }
    (async () => {
      try {
        if (/^https?:\/\//i.test(certKey)) {
          if (active) setTemplateUrl(certKey);
          return;
        }
        const r = await getUrl({ key: certKey });
        if (active) setTemplateUrl(r.url.toString());
      } catch (e) {
        console.error("cert template url error", e);
      }
    })();
    return () => {
      active = false;
    };
  }, [certKey]);

  // Measure the preview width so the name font scales with the image.
  React.useEffect(() => {
    const measure = () => setBoxWidth(boxRef.current?.clientWidth || 0);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [templateUrl]);

  const uploadTemplate = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const safeName = file.name.replace(/\s+/g, "_");
      const key = `certificates/${event.id}/template_${Date.now()}_${safeName}`;
      await uploadData({
        key,
        data: file,
        options: { contentType: file.type },
      }).result;
      setCertKey(key);
    } catch (e) {
      console.error("cert upload error", e);
      alert("Error subiendo la plantilla.");
    } finally {
      setBusy(false);
    }
  };

  const onPreviewClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    setPos((p) => ({
      ...p,
      xPct: Math.round(xPct * 10) / 10,
      yPct: Math.round(yPct * 10) / 10,
    }));
  };

  const save = async () => {
    if (enabled && !certKey) {
      alert("Sube una plantilla de certificado antes de activar el envío.");
      return;
    }
    setBusy(true);
    try {
      await DataStore.save(
        Event.copyOf(event, (u) => {
          u.sendCertificates = enabled;
          u.certificate = certKey || null;
          u.certificatePosition = JSON.stringify(pos);
        })
      );
      alert("Configuración de certificados guardada con éxito");
    } catch (e) {
      console.error("cert save error", e);
      alert("Error guardando la configuración.");
    } finally {
      setBusy(false);
    }
  };

  const fontPx = (boxWidth * pos.fontPct) / 100;

  return (
    <div className="mt-6 rounded-3xl border border-gray-200 bg-white p-5 dark:!bg-navy-800 dark:text-white">
      <h3 className="mb-1 text-xl font-bold text-navy-700 dark:text-white">
        Certificados para participantes
      </h3>
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
        Al finalizar el evento se envía automáticamente un certificado por correo
        a cada participante, con su nombre incrustado en la plantilla.
      </p>

      <label className="mb-4 flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="h-5 w-5 accent-brand-500"
        />
        <span className="font-medium">
          ¿Enviar certificados a los participantes al finalizar el evento?
        </span>
      </label>

      {enabled && (
        <>
          <div className="mb-4">
            <label className="flex w-fit cursor-pointer items-center gap-2 rounded-xl bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-black">
              <MdUploadFile className="h-5 w-5" />
              {certKey ? "Cambiar plantilla" : "Subir plantilla (imagen)"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={busy}
                onChange={(e) => uploadTemplate(e.target.files?.[0])}
              />
            </label>
            <p className="mt-1 text-xs text-gray-500">
              Usa una imagen (PNG/JPG) del certificado. Haz clic sobre la vista
              previa para colocar dónde va el nombre.
            </p>
          </div>

          {templateUrl && (
            <>
              <div
                ref={boxRef}
                onClick={onPreviewClick}
                className="relative mb-4 w-full max-w-[700px] cursor-crosshair select-none overflow-hidden rounded-lg border border-gray-200"
              >
                <img
                  src={templateUrl}
                  alt="Plantilla certificado"
                  className="block w-full"
                />
                <span
                  style={{
                    position: "absolute",
                    left: `${pos.xPct}%`,
                    top: `${pos.yPct}%`,
                    transform: `translate(${
                      pos.align === "center"
                        ? "-50%"
                        : pos.align === "right"
                        ? "-100%"
                        : "0"
                    }, -50%)`,
                    color: pos.color,
                    fontSize: `${fontPx || 16}px`,
                    whiteSpace: "nowrap",
                    fontWeight: 600,
                    lineHeight: 1,
                    pointerEvents: "none",
                  }}
                >
                  {sampleName || "Nombre Apellido"}
                </span>
              </div>

              <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold">
                    Nombre de prueba
                  </label>
                  <input
                    type="text"
                    value={sampleName}
                    onChange={(e) => setSampleName(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 p-2 text-sm outline-none dark:!bg-navy-900"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold">
                    Tamaño de letra ({pos.fontPct}%)
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="15"
                    step="0.5"
                    value={pos.fontPct}
                    onChange={(e) =>
                      setPos((p) => ({ ...p, fontPct: Number(e.target.value) }))
                    }
                    className="w-full accent-brand-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold">Color</label>
                  <input
                    type="color"
                    value={pos.color}
                    onChange={(e) =>
                      setPos((p) => ({ ...p, color: e.target.value }))
                    }
                    className="h-9 w-full rounded-lg border border-gray-200"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold">
                    Alineación
                  </label>
                  <select
                    value={pos.align}
                    onChange={(e) =>
                      setPos((p) => ({ ...p, align: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-200 p-2 text-sm outline-none dark:!bg-navy-900"
                  >
                    <option value="center">Centrado</option>
                    <option value="left">Izquierda</option>
                    <option value="right">Derecha</option>
                  </select>
                </div>
              </div>
            </>
          )}
        </>
      )}

      <button
        type="button"
        onClick={save}
        disabled={busy}
        className="rounded-xl bg-brand-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-black disabled:opacity-50"
      >
        {busy ? "Guardando…" : "Guardar configuración de certificados"}
      </button>
    </div>
  );
}
