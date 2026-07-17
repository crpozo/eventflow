import React from "react";
import { useNavigate } from "react-router-dom";
import { DataStore } from "aws-amplify/datastore";
import { post, generateClient } from "aws-amplify/api";
import { Survey } from "models";
import { readStoredEvent } from "scripts/utils";
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
  SavedAgo,
  Chip,
  PageLoader,
} from "components/adminUi";
import { MdSend, MdOutlineRemoveRedEye } from "react-icons/md";
import {
  QuestionsTab,
  PreviewModal,
  hydrateQuestions,
  exportQuestions,
} from "./builder";

// Survey admin — custom React builder (canvas + palette) that edits
// Survey.questions in the same formBuilder JSON the public page renders with
// jQuery formRender. Field `name`s are the join key for the results dashboard
// and the analysis Lambda, so the builder never rewrites them (see builder.jsx
// for the data-compat rules). Invite config (subject/intro/schedule/active)
// lives on the same Survey row, edited in the "Envío e invitación" tab.
const USER_API = "userApi";

// The send Lambda stamps sentAt straight in DynamoDB (no AppSync mutation),
// so DataStore's local cache never sees it — same situation as the insights
// on the results dashboard. Plain GraphQL reads DynamoDB directly.
const SENT_AT_QUERY = /* GraphQL */ `
  query SurveySentAtByEvent($filter: ModelSurveyFilterInput) {
    listSurveys(filter: $filter, limit: 1000) {
      items {
        id
        sentAt
      }
    }
  }
`;

const TABS = [
  { id: "preguntas", label: "Preguntas" },
  { id: "envio", label: "Envío e invitación" },
  { id: "compartir", label: "Compartir y probar" },
];

// AWSDateTime (UTC ISO, e.g. "2026-07-02T23:00:00.000Z") -> "YYYY-MM-DDTHH:mm"
// in LOCAL time, which is what <input type="datetime-local"> displays. Must
// stay symmetric with the `new Date(sendAt).toISOString()` in saveConfig —
// slicing the UTC string instead would shift the schedule by the UTC offset
// on every open+save cycle.
function toDatetimeLocal(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

// Etiqueta del botón de envío manual según el estado actual.
function sendNowLabel(sending, sentAtInfo) {
  if (sending) return "Enviando…";
  if (sentAtInfo) return "Reenviar encuesta";
  return "Enviar encuesta ahora";
}

// Mensaje de confirmación del envío manual: reenvío si ya hay sentAt; si es el
// primer envío, la nota depende del estado del envío automático.
function buildSendNowMessage(sentAtInfo, active, unsaved) {
  if (sentAtInfo) {
    return `La encuesta ya se envió el ${new Date(sentAtInfo).toLocaleString(
      "es-EC"
    )}. ¿Reenviar a todos los asistentes con check-in?${unsaved}`;
  }
  // Manual send stamps sentAt, and the scheduled sender skips any
  // survey with sentAt — the pending auto-send won't run anymore.
  const autoNote = active
    ? "\n\nNota: el envío automático programado ya no se ejecutará después de este envío manual; los asistentes que hagan check-in más tarde no recibirán la encuesta salvo que la reenvíes."
    : "\n(El envío automático está desactivado; este envío es manual y único.)";
  return `Se enviará la encuesta por correo a todos los asistentes con check-in. ¿Continuar?${autoNote}${unsaved}`;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const stored = readStoredEvent();
  const eventId = stored?.id;

  const [survey, setSurvey] = React.useState(null);
  const [ready, setReady] = React.useState(false);
  const canEdit = useCanEditSection("formulario");

  // Builder state — hydrated from Survey.questions at most ONCE (see
  // hydratedForId below); later DataStore emissions must not stomp edits.
  const [fields, setFields] = React.useState([]);
  const [selectedUid, setSelectedUid] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [savedAt, setSavedAt] = React.useState(null);
  const [showPreview, setShowPreview] = React.useState(false);
  const [tab, setTab] = React.useState("preguntas");
  const hydratedForId = React.useRef(null);
  // True as soon as the user edits anything (questions or config): hydration
  // must never overwrite unsaved local work, even if a Survey with an unseen
  // id arrives late from sync.
  const dirtyRef = React.useRef(false);
  const setFieldsDirty = React.useCallback((updater) => {
    dirtyRef.current = true;
    setFields(updater);
  }, []);

  // Config (invite) fields — mirrored from the Survey row. Auto-send is ON by
  // default for a NEW survey; an existing row's saved value wins on hydration.
  const [active, setActive] = React.useState(true);
  const [emailSubject, setEmailSubject] = React.useState("");
  const [emailIntro, setEmailIntro] = React.useState("");
  const [sendAt, setSendAt] = React.useState("");
  const [savingCfg, setSavingCfg] = React.useState(false);

  const [testEmail, setTestEmail] = React.useState("");
  const [testing, setTesting] = React.useState(false);

  // Manual send — sentAt is fetched outside DataStore (see SENT_AT_QUERY).
  const [sentAtInfo, setSentAtInfo] = React.useState(null);
  const [sending, setSending] = React.useState(false);
  const gqlClient = React.useMemo(() => generateClient(), []);

  const publicLink = `${window.location.origin}/landing/${eventId}/encuesta`;

  React.useEffect(() => {
    if (!eventId) {
      navigate("/admin");
      return;
    }
    const sub = DataStore.observeQuery(Survey, (s) =>
      s.surveyEventId.eq(eventId)
    ).subscribe(({ items, isSynced }) => {
      const s = items.length > 0 ? items[0] : null;
      // Always keep the freshest record for copyOf()…
      setSurvey(s);
      // …but hydrate the editors at most once (the first Survey we ever see)
      // and never over unsaved edits. Later emissions — the echo of our own
      // save, or a remote row landing after sync — must not stomp local state.
      if (s && hydratedForId.current === null && !dirtyRef.current) {
        hydratedForId.current = s.id;
        setFields(hydrateQuestions(s.questions));
        setActive(!!s.active);
        setEmailSubject(s.emailSubject || "");
        setEmailIntro(s.emailIntro || "");
        // datetime-local wants LOCAL wall time, not the UTC string
        setSendAt(toDatetimeLocal(s.sendAt));
      }
      // Don't unlock the editor on the pre-sync snapshot: an empty local
      // store may still hide an existing remote Survey, and editing against
      // it would fork a duplicate row (or lose the edits when it arrives).
      if (s || isSynced) setReady(true);
    });
    return () => sub.unsubscribe();
  }, [eventId, navigate]);

  React.useEffect(() => {
    if (!eventId) return;
    (async () => {
      try {
        const res = await gqlClient.graphql({
          query: SENT_AT_QUERY,
          variables: { filter: { surveyEventId: { eq: eventId } } },
        });
        const item = res?.data?.listSurveys?.items?.[0];
        if (item?.sentAt) setSentAtInfo(item.sentAt);
      } catch (e) {
        console.error("sentAt fetch:", e);
      }
    })();
  }, [eventId, gqlClient]);

  // Upsert helper: create the Survey if it doesn't exist yet, else patch it.
  async function persistSurvey(patch) {
    if (!canEdit) return null;
    // The `survey` state can lag right after a create (setSurvey below and
    // the observeQuery echo are async), so re-check the store before deciding
    // to create — two quick saves must not fork duplicate rows for the event.
    let target = survey;
    if (!target) {
      const existing = await DataStore.query(Survey, (s) =>
        s.surveyEventId.eq(eventId)
      );
      if (existing.length > 0) target = existing[0];
    }
    let saved;
    if (target) {
      saved = await DataStore.save(
        Survey.copyOf(target, (u) => {
          Object.assign(u, patch);
        })
      );
    } else {
      // Claim the new id BEFORE saving: the observeQuery echo of this save
      // can fire before this `await` resumes, and it must never re-hydrate
      // the builder (DataStore models generate their id at construction).
      const created = new Survey({
        surveyEventId: eventId,
        questions: [],
        // Persist the default-ON toggle even when the first save is of
        // questions (patch has no `active`); an explicit patch still wins.
        active,
        ...patch,
      });
      hydratedForId.current = created.id;
      saved = await DataStore.save(created);
    }
    setSurvey(saved);
    return saved;
  }

  async function saveSurvey() {
    if (!canEdit || saving) return;
    setSaving(true);
    try {
      const questions = exportQuestions(fields);
      await persistSurvey({ questions });
      setSavedAt(new Date());
    } catch (e) {
      console.error("save survey:", e);
      alert("No se pudo guardar la encuesta");
    } finally {
      setSaving(false);
    }
  }

  async function saveConfig() {
    if (!canEdit) return;
    setSavingCfg(true);
    try {
      await persistSurvey({
        active,
        emailSubject: emailSubject || null,
        emailIntro: emailIntro || null,
        sendAt: sendAt ? new Date(sendAt).toISOString() : null,
      });
      alert("Configuración guardada");
    } catch (e) {
      console.error("saveConfig:", e);
      alert("No se pudo guardar la configuración");
    } finally {
      setSavingCfg(false);
    }
  }

  async function sendTest() {
    if (!testEmail) {
      alert("Escribe un correo para la prueba");
      return;
    }
    setTesting(true);
    try {
      const op = post({
        apiName: USER_API,
        path: "/survey-test",
        options: { body: { eventId, email: testEmail } },
      });
      const { body } = await op.response;
      await body.json().catch(() => ({}));
      alert(`Correo de prueba enviado a ${testEmail}`);
    } catch (e) {
      console.error("sendTest:", e);
      const status = e?.response?.statusCode;
      let detail = "";
      try {
        detail = JSON.parse(e?.response?.body || "{}").error || "";
      } catch (_) {}
      const statusPart = status ? ` (HTTP ${status})` : "";
      const detailPart = detail ? `: ${detail}` : "";
      alert(`No se pudo enviar la prueba${statusPart}${detailPart}`);
    } finally {
      setTesting(false);
    }
  }

  // Manual send to every checked-in attendee. Same /survey-test route as the
  // individual test — the Lambda branches on `sendAll`. Resending is allowed
  // even with sentAt already stamped (the admin decides; we confirm first).
  async function sendNow() {
    if (!canEdit || sending) return;
    // The Lambda reads the Survey row from DynamoDB: unsaved subject/intro
    // edits (dirtyRef) would NOT go out in this send — warn before confirming.
    const unsaved = dirtyRef.current
      ? "\n\nTienes cambios sin guardar (asunto/mensaje o preguntas): el correo saldrá con la última versión GUARDADA."
      : "";
    const msg = buildSendNowMessage(sentAtInfo, active, unsaved);
    if (!window.confirm(msg)) return;
    setSending(true);
    try {
      const op = post({
        apiName: USER_API,
        path: "/survey-test",
        options: { body: { eventId, sendAll: true } },
      });
      const { body } = await op.response;
      const data = await body.json().catch(() => ({}));
      if (data?.sentAt) setSentAtInfo(data.sentAt);
      alert(`Encuesta enviada a ${data?.sent ?? 0} asistente(s)`);
    } catch (e) {
      console.error("sendNow:", e);
      const status = e?.response?.statusCode;
      let detail = "";
      try {
        detail = JSON.parse(e?.response?.body || "{}").error || "";
      } catch (_) {}
      const statusPart = status ? ` (HTTP ${status})` : "";
      const detailPart = detail ? `: ${detail}` : "";
      alert(`No se pudo enviar la encuesta${statusPart}${detailPart}`);
    } finally {
      setSending(false);
    }
  }

  if (!ready) {
    // PageLoader (columna de contenido): el overlay full-screen viejo tapaba
    // el sidebar dentro del admin.
    return <PageLoader />;
  }

  return (
    <div className="campus-page mt-3">
      <PageHeader
        crumbs={[
          { label: "Eventos", to: "/admin/eventos" },
          { label: stored?.title || "Evento" },
          { label: "Encuesta" },
        ]}
        title="Encuesta del evento"
        subtitle="Diseña las preguntas y configura el envío a los asistentes."
        actions={
          <>
            <SavedAgo savedAt={savedAt} />
            <SecondaryButton onClick={() => setShowPreview(true)}>
              <MdOutlineRemoveRedEye className="h-4 w-4" />
              Vista previa
            </SecondaryButton>
            <PrimaryButton onClick={saveSurvey} disabled={!canEdit || saving}>
              {saving ? "Guardando…" : "Guardar encuesta"}
            </PrimaryButton>
          </>
        }
      />

      {/* tabs */}
      <div className="mb-4 flex gap-6 border-b border-gray-100 dark:border-white/10">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`-mb-px flex items-center gap-2 border-b-2 pb-2.5 text-base transition ${
              tab === t.id
                ? "border-brand-500 font-semibold text-brand-500"
                : // border-[transparent]: the config replaces the whole palette
                  // and has no `transparent`, so the stock class isn't generated
                  "border-[transparent] text-gray-500 hover:text-navy-700 dark:hover:text-white"
            }`}
          >
            {t.label}
            {t.id === "preguntas" && (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-brand-500">
                {fields.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "preguntas" && (
        <div>
          {/* plain div wrapper: EditableSection renders banner+fieldset and
              would break a grid if it were a direct grid child */}
          <EditableSection section="formulario">
            <QuestionsTab
              fields={fields}
              setFields={setFieldsDirty}
              selectedUid={selectedUid}
              setSelectedUid={setSelectedUid}
              canEdit={canEdit}
              eventId={eventId}
            />
          </EditableSection>
        </div>
      )}

      {tab === "envio" && (
        <Card
          title="Envío e invitación"
          subtitle="Correo que reciben los asistentes con el enlace a la encuesta."
        >
          {/* label: clicking the text toggles too (button is labelable) */}
          <label className="mb-4 flex cursor-pointer items-center gap-3">
            <Toggle
              checked={active}
              onChange={(v) => {
                dirtyRef.current = true;
                setActive(v);
              }}
            />
            <span className="text-sm text-navy-700 dark:text-white">
              Activar envío automático 1 hora después de finalizar el evento
              (solo a quienes hicieron check-in)
            </span>
          </label>

          <div className="grid gap-x-4 sm:grid-cols-2">
            <Field label="Asunto del correo">
              <TextInput
                value={emailSubject}
                placeholder="Cuéntanos tu experiencia — Evento USFQ"
                onChange={(e) => {
                  dirtyRef.current = true;
                  setEmailSubject(e.target.value);
                }}
              />
            </Field>
            <Field
              label="Enviar el"
              hint="Opcional — por defecto, 1 hora después de finalizar."
            >
              <TextInput
                type="datetime-local"
                value={sendAt}
                onChange={(e) => {
                  dirtyRef.current = true;
                  setSendAt(e.target.value);
                }}
              />
            </Field>
          </div>

          <Field label="Mensaje de invitación">
            <TextArea
              rows={3}
              value={emailIntro}
              placeholder="Gracias por asistir. Tu opinión nos ayuda a mejorar; toma menos de 2 minutos."
              onChange={(e) => {
                dirtyRef.current = true;
                setEmailIntro(e.target.value);
              }}
            />
          </Field>

          <div className="mt-4">
            <PrimaryButton onClick={saveConfig} disabled={savingCfg || !canEdit}>
              {savingCfg ? "Guardando..." : "Guardar configuración"}
            </PrimaryButton>
          </div>

          <div className="mt-4 border-t border-gray-100 pt-4 dark:border-white/10">
            <h4 className="text-base font-semibold text-navy-700 dark:text-white">
              Envío manual
            </h4>
            <p className="mt-0.5 text-sm text-gray-500">
              Envía la encuesta ahora a todos los asistentes con check-in —
              útil si el envío automático quedó para después.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <PrimaryButton
                onClick={sendNow}
                disabled={sending || !canEdit}
                className="flex shrink-0 items-center gap-1.5"
              >
                <MdSend className="h-4 w-4" />
                {sendNowLabel(sending, sentAtInfo)}
              </PrimaryButton>
              {sentAtInfo && (
                <Chip color="green">
                  Enviada el {new Date(sentAtInfo).toLocaleString("es-EC")}
                </Chip>
              )}
            </div>
          </div>
        </Card>
      )}

      {tab === "compartir" && (
        <Card
          title="Compartir y probar"
          subtitle="Comparte el enlace público o envíate una prueba del correo."
        >
          <Field label="Enlace público de la encuesta">
            <CopyField value={publicLink} />
          </Field>

          <Field label="Enviar prueba a mi correo">
            <div className="flex items-center gap-2">
              <TextInput
                type="email"
                placeholder="tucorreo@usfq.edu.ec"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
              <PrimaryButton
                onClick={sendTest}
                disabled={testing}
                className="flex shrink-0 items-center gap-1.5"
              >
                <MdSend className="h-4 w-4" />
                {testing ? "Enviando..." : "Enviar prueba"}
              </PrimaryButton>
            </div>
          </Field>
        </Card>
      )}

      {showPreview && (
        <PreviewModal fields={fields} onClose={() => setShowPreview(false)} />
      )}
    </div>
  );
};

export default Dashboard;
