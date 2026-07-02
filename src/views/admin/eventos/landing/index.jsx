import React from "react";
import { useNavigate } from "react-router-dom";
import { DataStore } from "aws-amplify/datastore";
import { Event, Landing } from "models";
import { StorageManager } from "@aws-amplify/ui-react-storage";
import { processFile } from "ui-components/utils";
import { ImageFileList } from "components/storage/ImageFileList";
import { EditableSection, useCanEditSection } from "components/sectionEdit";
import {
  PageHeader,
  Card,
  Field,
  TextInput,
  TextArea,
  Toggle,
  CopyField,
  PrimaryButton,
  SecondaryButton,
  Chip,
  SavedAgo,
} from "components/adminUi";
import { formatHour, tzLabel, readStoredEvent } from "scripts/utils";
import {
  MdOutlineOpenInNew,
  MdAdd,
  MdClose,
  MdDesktopWindows,
  MdSmartphone,
  MdAccessTime,
} from "react-icons/md";

// Redesigned admin Landing editor: hand-written (no generated form, safe from
// codegen) with a live preview column that mirrors the public landing hero as
// the admin types. Saving is explicit ("Guardar cambios") via DataStore.
const CLOUDFRONT = "https://dnuc5lxyun5b.cloudfront.net/public/";

const EMPTY = {
  active: false,
  title: "",
  description: "",
  mainBanner: null,
  location: "",
  cost: "",
  ticketTitle: [],
  ticketPrice: [],
  extraInfo: "",
  userConsentCheck: "",
  customHtml: "",
  metaScripts: "",
  galleryPhotos: [],
  partnerLogos: [],
};

const fromRecord = (l) =>
  l
    ? {
        active: !!l.active,
        title: l.title || "",
        description: l.description || "",
        mainBanner: l.mainBanner || null,
        location: l.location || "",
        cost: l.cost || "",
        ticketTitle: (l.ticketTitle || []).map((t) => t ?? ""),
        ticketPrice: (l.ticketPrice || []).map((p) => (p == null ? "" : String(p))),
        extraInfo: l.extraInfo || "",
        userConsentCheck: l.userConsentCheck || "",
        customHtml: l.customHtml || "",
        metaScripts: l.metaScripts || "",
        // Keys are content hashes: dedupe so re-uploads (and legacy data) never
        // accumulate the same photo twice.
        galleryPhotos: Array.from(new Set((l.galleryPhotos || []).filter(Boolean))),
        partnerLogos: Array.from(new Set((l.partnerLogos || []).filter(Boolean))),
      }
    : { ...EMPTY };

const Dashboard = () => {
  const navigate = useNavigate();
  const stored = readStoredEvent();
  const eventId = stored?.id;
  const canEdit = useCanEditSection("landing");

  const [event, setEvent] = React.useState(null);
  const [landing, setLanding] = React.useState(null);
  const [loaded, setLoaded] = React.useState(false);
  const [draft, setDraft] = React.useState({ ...EMPTY });
  const [snapshot, setSnapshot] = React.useState({ ...EMPTY });
  const [saving, setSaving] = React.useState(false);
  const [savedAt, setSavedAt] = React.useState(null);
  const [device, setDevice] = React.useState("desktop");

  const dirty = JSON.stringify(draft) !== JSON.stringify(snapshot);
  const dirtyRef = React.useRef(dirty);
  dirtyRef.current = dirty;

  const publicUrl = `${window.location.origin}/landing/${eventId}`;

  React.useEffect(() => {
    if (!eventId) {
      navigate("/admin/eventos");
      return;
    }
    DataStore.query(Event, (e) => e.id.eq(eventId)).then((r) => setEvent(r[0]));
    const sub = DataStore.observeQuery(Landing, (l) =>
      l.landingEventId.eq(eventId)
    ).subscribe(({ items, isSynced }) => {
      // On a cold local store the first emission is [] BEFORE sync — rendering
      // create-mode then would let a save duplicate the Landing or wipe fields.
      // Stay on the loader until the store is synced or a record shows up.
      if (!isSynced && items.length === 0) return;
      const rec = items[0] || null;
      setLanding(rec);
      // Hydrate the editor from the record unless the admin has unsaved edits.
      if (!dirtyRef.current) {
        const values = fromRecord(rec);
        setDraft(values);
        setSnapshot(values);
        if (rec?.updatedAt) setSavedAt(new Date(rec.updatedAt));
      }
      setLoaded(true);
    });
    return () => sub.unsubscribe();
  }, [eventId, navigate]);

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));

  async function save() {
    if (!canEdit || saving) return;
    if (!draft.title.trim() || !draft.description.trim() || !draft.location.trim()) {
      alert("Título, descripción y ubicación son obligatorios.");
      return;
    }
    // Tickets: drop fully-empty rows; a partial row (name without price or
    // vice versa) is a mistake — surface it instead of silently storing 0.
    const tickets = [];
    const rowCount = Math.max(draft.ticketTitle.length, draft.ticketPrice.length);
    for (let i = 0; i < rowCount; i++) {
      const name = (draft.ticketTitle[i] ?? "").trim();
      const priceRaw = String(draft.ticketPrice[i] ?? "").trim();
      if (!name && !priceRaw) continue;
      const price = parseFloat(priceRaw);
      if (!name || !Number.isFinite(price)) {
        alert(
          "Completa nombre y precio en todas las entradas (o elimina la fila incompleta)."
        );
        return;
      }
      tickets.push({ name, price });
    }
    setSaving(true);
    try {
      const fields = {
        active: draft.active,
        title: draft.title.trim(),
        description: draft.description,
        mainBanner: draft.mainBanner || null,
        location: draft.location.trim(),
        cost: draft.cost || null,
        ticketTitle: tickets.map((t) => t.name),
        ticketPrice: tickets.map((t) => t.price),
        extraInfo: draft.extraInfo || null,
        userConsentCheck: draft.userConsentCheck || null,
        customHtml: draft.customHtml || null,
        metaScripts: draft.metaScripts || null,
        galleryPhotos: draft.galleryPhotos,
        partnerLogos: draft.partnerLogos,
      };
      // Re-check for an existing record right before creating: on a cold store
      // the record may have synced in after this page loaded, and creating
      // blindly would leave the event with two Landing rows.
      const target =
        landing ||
        (await DataStore.query(Landing, (l) => l.landingEventId.eq(eventId)))[0];
      if (target) {
        await DataStore.save(
          Landing.copyOf(target, (u) => {
            Object.assign(u, fields);
          })
        );
      } else {
        await DataStore.save(new Landing({ landingEventId: eventId, ...fields }));
      }
      setSnapshot({ ...draft });
      setSavedAt(new Date());
    } catch (e) {
      console.error("save landing:", e);
      alert("No se pudo guardar. Revisa la consola e intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  /* Tickets: paired title/price rows */
  const ticketRows = Math.max(draft.ticketTitle.length, draft.ticketPrice.length);
  const setTicket = (i, key, value) => {
    const titles = [...draft.ticketTitle];
    const prices = [...draft.ticketPrice];
    while (titles.length <= i) titles.push("");
    while (prices.length <= i) prices.push("");
    if (key === "title") titles[i] = value;
    else prices[i] = value;
    set({ ticketTitle: titles, ticketPrice: prices });
  };
  const removeTicket = (i) =>
    set({
      ticketTitle: draft.ticketTitle.filter((_, j) => j !== i),
      ticketPrice: draft.ticketPrice.filter((_, j) => j !== i),
    });

  if (!loaded) {
    return (
      <div className="flex min-h-[60vh] w-full flex-col items-center justify-center">
        <span className="loader"></span>
        <h2 className="mt-2 text-xl text-black dark:text-white">Cargando…</h2>
      </div>
    );
  }

  const startIso = event?.startDate || event?.date;
  const previewHour = startIso ? formatHour(startIso, "ES", event?.timezone) : "";
  const previewDate = startIso
    ? new Date(startIso)
        .toLocaleDateString("es-EC", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          timeZone: event?.timezone || "America/Guayaquil",
        })
        .split("/")
        .join(" · ")
    : "";
  const bannerUrl = draft.mainBanner ? `${CLOUDFRONT}${draft.mainBanner}` : null;

  return (
    <div className="landing-page mt-3">
      <PageHeader
        crumbs={[
          { label: "Eventos", to: "/admin/eventos" },
          { label: event?.title || "Evento" },
          { label: "Landing page" },
        ]}
        title="Landing page"
        subtitle="Configura la página pública de tu evento."
        actions={
          <>
            <SavedAgo savedAt={savedAt} />
            <SecondaryButton onClick={() => window.open(publicUrl, "_blank")}>
              <MdOutlineOpenInNew className="h-4 w-4" /> Ver página
            </SecondaryButton>
            <PrimaryButton onClick={save} disabled={!dirty || saving || !canEdit}>
              {saving ? "Guardando…" : "Guardar cambios"}
            </PrimaryButton>
          </>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        {/* ── Editor column ── (wrapper div: EditableSection renders a fragment
            — banner + fieldset — which would otherwise become TWO grid cells
            in read-only mode and break the layout) */}
        <div className="min-w-0">
          <EditableSection section="landing">
          <div className="flex flex-col gap-5">
            <Card
              title="Publicar landing"
              headerRight={
                <Toggle
                  checked={draft.active}
                  onChange={(v) => set({ active: v })}
                  disabled={!canEdit}
                />
              }
            >
              <p className="-mt-3 mb-3 text-sm text-gray-500">
                {draft.active
                  ? "Tu página está visible para el público."
                  : "Tu página está oculta — actívala para recibir inscripciones."}
              </p>
              <CopyField value={publicUrl} />
            </Card>

            <Card
              title="Contenido del banner"
              subtitle="Título y descripción que aparecen sobre la imagen principal."
            >
              <Field
                label="Título principal"
                required
                counter={{ value: draft.title.length, max: 80 }}
              >
                <TextInput
                  value={draft.title}
                  onChange={(e) => set({ title: e.target.value })}
                  placeholder="Nombre del evento"
                />
              </Field>
              <Field
                label="Descripción corta"
                required
                counter={{ value: draft.description.length, max: 200 }}
                hint="Se muestra sobre la imagen del banner, debajo del título."
              >
                <TextArea
                  value={draft.description}
                  onChange={(e) => set({ description: e.target.value })}
                  rows={4}
                />
              </Field>
            </Card>

            <Card
              title="Imagen del banner"
              subtitle="Recomendado: 1920 × 600 px · JPG o PNG · máx. 5 MB"
            >
              <StorageManager
                defaultFiles={
                  snapshot.mainBanner ? [{ key: snapshot.mainBanner }] : []
                }
                onUploadSuccess={({ key }) => set({ mainBanner: key })}
                onFileRemove={() => set({ mainBanner: null })}
                processFile={processFile}
                accessLevel={"public"}
                acceptedFileTypes={["image/*"]}
                isResumable={false}
                showThumbnails={true}
                maxFileCount={1}
                components={{ FileList: ImageFileList }}
              />
            </Card>

            <Card title="Información del evento">
              <Field label="Ubicación" required>
                <TextInput
                  value={draft.location}
                  onChange={(e) => set({ location: e.target.value })}
                  placeholder="Campus Cumbayá, Auditorio…"
                />
              </Field>
              <Field
                label="Tarifa del evento"
                hint="Texto libre, ej. “Gratuito” o “$25”."
              >
                <TextInput
                  value={draft.cost}
                  onChange={(e) => set({ cost: e.target.value })}
                />
              </Field>
            </Card>

            <Card title="Entradas" subtitle="Tipos de entrada y su precio (opcional).">
              {ticketRows === 0 && (
                <p className="mb-3 text-sm text-gray-400">Sin entradas configuradas.</p>
              )}
              {Array.from({ length: ticketRows }).map((_, i) => (
                <div key={i} className="mb-2 flex items-center gap-2">
                  <TextInput
                    value={draft.ticketTitle[i] ?? ""}
                    placeholder="Nombre (ej. General)"
                    onChange={(e) => setTicket(i, "title", e.target.value)}
                  />
                  <TextInput
                    value={draft.ticketPrice[i] ?? ""}
                    placeholder="Precio"
                    type="number"
                    min="0"
                    step="0.01"
                    className="!w-32"
                    onChange={(e) => setTicket(i, "price", e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeTicket(i)}
                    className="shrink-0 rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-brand-500"
                    title="Quitar entrada"
                  >
                    <MdClose className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <SecondaryButton
                type="button"
                onClick={() => setTicket(ticketRows, "title", "")}
                className="mt-1 !py-2"
              >
                <MdAdd className="h-4 w-4" /> Agregar entrada
              </SecondaryButton>
            </Card>

            <Card
              title="Galería de fotos"
              subtitle="Se muestran en la landing debajo de la descripción."
            >
              <StorageManager
                defaultFiles={snapshot.galleryPhotos.map((key) => ({ key }))}
                onUploadSuccess={({ key }) =>
                  setDraft((d) => ({
                    ...d,
                    galleryPhotos: d.galleryPhotos.includes(key)
                      ? d.galleryPhotos
                      : [...d.galleryPhotos, key],
                  }))
                }
                onFileRemove={({ key }) =>
                  setDraft((d) => ({
                    ...d,
                    galleryPhotos: d.galleryPhotos.filter((k) => k !== key),
                  }))
                }
                processFile={processFile}
                accessLevel={"public"}
                acceptedFileTypes={["image/*"]}
                isResumable={false}
                showThumbnails={true}
                maxFileCount={30}
                components={{ FileList: ImageFileList }}
              />
            </Card>

            <Card
              title="Logos de aliados"
              subtitle="Logos de instituciones o sponsors del evento."
            >
              <StorageManager
                defaultFiles={snapshot.partnerLogos.map((key) => ({ key }))}
                onUploadSuccess={({ key }) =>
                  setDraft((d) => ({
                    ...d,
                    partnerLogos: d.partnerLogos.includes(key)
                      ? d.partnerLogos
                      : [...d.partnerLogos, key],
                  }))
                }
                onFileRemove={({ key }) =>
                  setDraft((d) => ({
                    ...d,
                    partnerLogos: d.partnerLogos.filter((k) => k !== key),
                  }))
                }
                processFile={processFile}
                accessLevel={"public"}
                acceptedFileTypes={["image/*"]}
                isResumable={false}
                showThumbnails={true}
                maxFileCount={30}
                components={{ FileList: ImageFileList }}
              />
            </Card>

            <Card title="Contenido adicional" subtitle="Bloques opcionales de la landing.">
              <Field label="Información adicional">
                <TextArea
                  value={draft.extraInfo}
                  onChange={(e) => set({ extraInfo: e.target.value })}
                />
              </Field>
              <Field
                label="Checkbox de consentimiento del usuario"
                hint="Texto del consentimiento que acepta quien se registra."
              >
                <TextArea
                  value={draft.userConsentCheck}
                  onChange={(e) => set({ userConsentCheck: e.target.value })}
                  rows={2}
                />
              </Field>
              <Field
                label="Bloque HTML personalizado"
                hint="HTML que se renderiza bajo la descripción (enlaces, agenda, etc.)."
              >
                <TextArea
                  value={draft.customHtml}
                  onChange={(e) => set({ customHtml: e.target.value })}
                  rows={4}
                  className="font-mono text-xs"
                />
              </Field>
              <Field
                label="Meta scripts"
                hint="Scripts de medición (píxeles, analytics). Solo administradores."
              >
                <TextArea
                  value={draft.metaScripts}
                  onChange={(e) => set({ metaScripts: e.target.value })}
                  rows={2}
                  className="font-mono text-xs"
                />
              </Field>
            </Card>
          </div>
          </EditableSection>
        </div>

        {/* ── Live preview column ── */}
        <div className="xl:sticky xl:top-4 xl:self-start">
          <Card
            title="Vista previa"
            headerRight={
              <div className="flex items-center gap-2">
                <Chip color={draft.active ? "green" : "gray"}>
                  {draft.active ? "En vivo" : "Oculta"}
                </Chip>
                <div className="flex overflow-hidden rounded-lg border border-gray-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setDevice("desktop")}
                    className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium ${
                      device === "desktop"
                        ? "bg-navy-700 text-white"
                        : "bg-white text-gray-500 dark:bg-navy-800"
                    }`}
                  >
                    <MdDesktopWindows className="h-3.5 w-3.5" /> Escritorio
                  </button>
                  <button
                    type="button"
                    onClick={() => setDevice("mobile")}
                    className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium ${
                      device === "mobile"
                        ? "bg-navy-700 text-white"
                        : "bg-white text-gray-500 dark:bg-navy-800"
                    }`}
                  >
                    <MdSmartphone className="h-3.5 w-3.5" /> Móvil
                  </button>
                </div>
              </div>
            }
          >
            <div
              className={`overflow-hidden rounded-xl border border-gray-200 shadow-sm transition-all dark:border-white/10 ${
                device === "mobile" ? "mx-auto w-[280px]" : "w-full"
              }`}
            >
              {/* Fake browser bar */}
              <div className="flex items-center gap-1.5 border-b border-gray-100 bg-gray-50 px-3 py-2 dark:border-white/5 dark:bg-navy-900">
                <span className="h-2 w-2 rounded-full bg-gray-300" />
                <span className="h-2 w-2 rounded-full bg-gray-300" />
                <span className="h-2 w-2 rounded-full bg-gray-300" />
                <span className="ml-2 flex-1 truncate rounded-md bg-white px-2 py-0.5 text-[10px] text-gray-400 dark:bg-navy-800">
                  eventflow.ec/landing/{eventId ? `${eventId.slice(0, 8)}…` : ""}
                </span>
              </div>
              {/* Hero */}
              <div
                className="relative flex flex-col justify-end bg-cover bg-center p-4"
                style={{
                  minHeight: device === "mobile" ? 300 : 240,
                  backgroundImage: bannerUrl
                    ? `linear-gradient(rgba(9,45,56,.75), rgba(9,45,56,.75)), url(${bannerUrl})`
                    : "linear-gradient(135deg, #0f3d4a 0%, #17636f 100%)",
                }}
              >
                <div className="absolute left-4 top-3 text-[11px] font-bold tracking-wide text-white/90">
                  USFQ
                </div>
                {previewDate && (
                  <div className="absolute right-3 top-2.5 rounded-full border border-white/40 px-2 py-0.5 text-[10px] text-white/90">
                    {previewDate}
                  </div>
                )}
                <h4 className="text-lg font-bold leading-snug text-white">
                  {draft.title || "Título del evento"}
                </h4>
                <p className="mt-1.5 line-clamp-4 text-xs leading-relaxed text-white/80">
                  {draft.description || "La descripción corta aparecerá aquí."}
                </p>
                <div
                  className={`mt-3 flex ${
                    device === "mobile" ? "flex-col gap-2" : "items-center gap-3"
                  }`}
                >
                  <span className="inline-flex w-fit rounded-lg bg-brand-500 px-3.5 py-1.5 text-xs font-semibold text-white">
                    Inscribirse
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-white/80">
                    <MdAccessTime className="h-3.5 w-3.5" />
                    {previewHour ? `${previewHour} ${tzLabel(event?.timezone)}` : ""}
                    {draft.location ? ` · ${draft.location}` : ""}
                  </span>
                </div>
              </div>
              {/* Body skeleton */}
              <div className="flex flex-col gap-2.5 bg-white p-4 dark:bg-navy-800">
                <div className="h-2.5 w-24 rounded bg-gray-200 dark:bg-navy-700" />
                <div
                  className={`grid gap-2 ${
                    device === "mobile" ? "grid-cols-1" : "grid-cols-3"
                  }`}
                >
                  <div className="h-12 rounded-lg bg-gray-100 dark:bg-navy-700" />
                  <div className="h-12 rounded-lg bg-gray-100 dark:bg-navy-700" />
                  <div className="h-12 rounded-lg bg-gray-100 dark:bg-navy-700" />
                </div>
                <div className="h-2 w-full rounded bg-gray-100 dark:bg-navy-700" />
                <div className="h-2 w-2/3 rounded bg-gray-100 dark:bg-navy-700" />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-xs dark:border-white/5">
              <span className="text-gray-400">Se actualiza mientras escribes</span>
              <a
                className="flex items-center gap-1 font-medium text-brand-500 hover:text-navy-700 hover:no-underline"
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Abrir en pestaña nueva <MdOutlineOpenInNew className="h-3.5 w-3.5" />
              </a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
