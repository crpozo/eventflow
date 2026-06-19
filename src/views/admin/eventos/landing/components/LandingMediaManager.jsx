import React from "react";
import { uploadData, getUrl, remove } from "aws-amplify/storage";
import { DataStore } from "aws-amplify/datastore";
import { Landing } from "models";
import { MdDelete, MdUploadFile } from "react-icons/md";

// Resolve a list of S3 keys into preview URLs.
function usePreviews(keys) {
  const [urls, setUrls] = React.useState({});
  const sig = JSON.stringify(keys || []);
  React.useEffect(() => {
    let active = true;
    (async () => {
      const entries = await Promise.all(
        (keys || []).filter(Boolean).map(async (k) => {
          if (/^https?:\/\//i.test(k)) return [k, k];
          try {
            const r = await getUrl({ key: k });
            return [k, r.url.toString()];
          } catch (e) {
            return [k, null];
          }
        })
      );
      if (active) setUrls(Object.fromEntries(entries));
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);
  return urls;
}

/**
 * Admin manager for the extra landing content:
 *  - Gallery photos (multi-upload)
 *  - Partner logos (multi-upload)
 *  - Custom HTML block
 * Stores S3 keys / html on the Landing model. Kept separate from the generated
 * Amplify form so that form is not touched.
 */
export default function LandingMediaManager({ landing }) {
  const [galleryKeys, setGalleryKeys] = React.useState(
    () => (landing?.galleryPhotos || []).filter(Boolean)
  );
  const [logoKeys, setLogoKeys] = React.useState(
    () => (landing?.partnerLogos || []).filter(Boolean)
  );
  const [customHtml, setCustomHtml] = React.useState(landing?.customHtml || "");
  const [busy, setBusy] = React.useState(false);

  const galleryUrls = usePreviews(galleryKeys);
  const logoUrls = usePreviews(logoKeys);

  const uploadFiles = async (fileList, prefix, setKeys) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    setBusy(true);
    try {
      const newKeys = [];
      for (const file of files) {
        const safeName = file.name.replace(/\s+/g, "_");
        const key = `landing/${landing.id}/${prefix}/${Date.now()}_${safeName}`;
        await uploadData({
          key,
          data: file,
          options: { contentType: file.type },
        }).result;
        newKeys.push(key);
      }
      setKeys((prev) => [...prev, ...newKeys]);
    } catch (e) {
      console.error("upload error", e);
      alert("Error subiendo archivos. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  const removeKey = async (key, setKeys) => {
    setKeys((prev) => prev.filter((k) => k !== key));
    try {
      if (!/^https?:\/\//i.test(key)) await remove({ key });
    } catch (e) {
      /* file may already be gone; ignore */
    }
  };

  const save = async () => {
    setBusy(true);
    try {
      await DataStore.save(
        Landing.copyOf(landing, (u) => {
          u.galleryPhotos = galleryKeys;
          u.partnerLogos = logoKeys;
          u.customHtml = customHtml;
        })
      );
      alert("Contenido de la landing guardado con éxito");
    } catch (e) {
      console.error("save error", e);
      alert("Error guardando el contenido.");
    } finally {
      setBusy(false);
    }
  };

  const thumb = (key, url, setKeys, rounded) => (
    <div key={key} className="relative">
      {url ? (
        <img
          src={url}
          alt="preview"
          className={`h-24 w-full ${
            rounded ? "object-contain p-2 bg-gray-50" : "object-cover"
          } rounded-lg border border-gray-200`}
        />
      ) : (
        <div className="flex h-24 w-full items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-400">
          cargando…
        </div>
      )}
      <button
        type="button"
        onClick={() => removeKey(key, setKeys)}
        className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white shadow hover:bg-red-600"
        title="Eliminar"
      >
        <MdDelete className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div className="mt-6 rounded-3xl border border-gray-200 bg-white p-5 dark:!bg-navy-800 dark:text-white">
      <h3 className="mb-1 text-xl font-bold text-navy-700 dark:text-white">
        Contenido extra de la landing
      </h3>
      <p className="mb-5 text-sm text-gray-600 dark:text-gray-300">
        Fotos, bloque HTML y logos de aliados que se muestran debajo de los
        detalles del evento.
      </p>

      {/* Gallery */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <label className="font-semibold">Galería de fotos</label>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-black">
            <MdUploadFile className="h-5 w-5" /> Subir fotos
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={busy}
              onChange={(e) => uploadFiles(e.target.files, "gallery", setGalleryKeys)}
            />
          </label>
        </div>
        {galleryKeys.length > 0 ? (
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5">
            {galleryKeys.map((k) => thumb(k, galleryUrls[k], setGalleryKeys, false))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Aún no hay fotos.</p>
        )}
      </div>

      {/* Partner logos */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <label className="font-semibold">Logos de aliados (carrusel)</label>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-black">
            <MdUploadFile className="h-5 w-5" /> Subir logos
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={busy}
              onChange={(e) => uploadFiles(e.target.files, "logos", setLogoKeys)}
            />
          </label>
        </div>
        {logoKeys.length > 0 ? (
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
            {logoKeys.map((k) => thumb(k, logoUrls[k], setLogoKeys, true))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Aún no hay logos.</p>
        )}
      </div>

      {/* Custom HTML */}
      <div className="mb-6">
        <label className="mb-2 block font-semibold">
          Bloque HTML personalizado
        </label>
        <p className="mb-2 text-xs text-gray-500">
          Se renderiza tal cual en la landing. Ej: un botón para descargar un
          PDF. (Solo administradores; usa HTML de confianza.)
        </p>
        <textarea
          value={customHtml}
          onChange={(e) => setCustomHtml(e.target.value)}
          rows={6}
          placeholder='<a href="https://..." class="...">Descargar PDF</a>'
          className="w-full rounded-xl border border-gray-200 p-3 font-mono text-sm outline-none focus:border-brand-500 dark:!bg-navy-900"
        />
      </div>

      <button
        type="button"
        onClick={save}
        disabled={busy}
        className="rounded-xl bg-brand-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-black disabled:opacity-50"
      >
        {busy ? "Guardando…" : "Guardar contenido extra"}
      </button>
    </div>
  );
}
