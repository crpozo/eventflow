import React, { Component, createRef } from "react";
import { useNavigate } from "react-router-dom";
import { DataStore } from "aws-amplify/datastore";
import { post } from "aws-amplify/api";
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
} from "components/adminUi";
import { MdSend } from "react-icons/md";
import $ from "jquery";
window.jQuery = $;
window.$ = $;
require("jquery-ui-sortable");
require("formBuilder");

// Survey builder — same jQuery formBuilder used for the registration form
// (views/admin/eventos/formulario), but tuned for feedback surveys: rating-style
// fields (radio-group / checkbox-group / select) are ENABLED and the USFQ default
// identity fields are dropped (the survey is anonymous). The definition is stored
// on Survey.questions; the invite config (subject/intro/schedule/active) lives on
// the same Survey row and is edited in the config card below.
const USER_API = "userApi";

// Module scope so its identity is stable across re-renders: the config inputs
// live in the same page component, and a class declared inline would be a NEW
// type on every keystroke — React would unmount/remount it and re-init the
// jQuery builder each time (layout jumps, lost work-in-progress). jQuery owns
// this subtree, so never re-render it; props are still refreshed on the
// instance, so onSave always sees the latest state.
class SurveyBuilder extends Component {
  fb = createRef();

  componentDidMount() {
    $(this.fb.current).formBuilder({
      formData: this.props.formData,
      onSave: () => {
        const json = $(this.fb.current).formBuilder("getData", "json");
        if (json) this.props.onSave(JSON.parse(json));
      },
      i18n: {
        override: {
          "en-US": {
            save: "Guardar encuesta",
            header: "Título",
            paragraph: "Descripción",
            select: "Selección",
            text: "Texto corto",
            textArea: "Texto largo",
            number: "Número",
            dateField: "Fecha",
            "radio-group": "Opción única",
            "checkbox-group": "Opción múltiple",
          },
        },
      },
      // Allow rating/choice fields; drop file uploads, buttons, hidden, autocomplete.
      disableFields: ["autocomplete", "button", "hidden", "file"],
    });
  }

  shouldComponentUpdate() {
    return false; // jQuery owns this DOM
  }

  render() {
    return <div id="fb-editor" ref={this.fb} />;
  }
}

const Dashboard = () => {
  const navigate = useNavigate();
  const stored = readStoredEvent();
  const eventId = stored?.id;

  const [survey, setSurvey] = React.useState(null);
  const [surveyData, setSurveyData] = React.useState([]);
  const [ready, setReady] = React.useState(false);
  const canEdit = useCanEditSection("formulario");

  // Config (invite) fields — mirrored from the Survey row.
  const [active, setActive] = React.useState(false);
  const [emailSubject, setEmailSubject] = React.useState("");
  const [emailIntro, setEmailIntro] = React.useState("");
  const [sendAt, setSendAt] = React.useState("");
  const [savingCfg, setSavingCfg] = React.useState(false);

  const [testEmail, setTestEmail] = React.useState("");
  const [testing, setTesting] = React.useState(false);

  const publicLink = `${window.location.origin}/landing/${eventId}/encuesta`;

  React.useEffect(() => {
    if (!eventId) {
      navigate("/admin");
      return;
    }
    const sub = DataStore.observeQuery(Survey, (s) =>
      s.surveyEventId.eq(eventId)
    ).subscribe(({ items }) => {
      if (items.length > 0) {
        const s = items[0];
        setSurvey(s);
        setSurveyData(s.questions || []);
        setActive(!!s.active);
        setEmailSubject(s.emailSubject || "");
        setEmailIntro(s.emailIntro || "");
        // datetime-local wants "YYYY-MM-DDTHH:mm"
        setSendAt(s.sendAt ? String(s.sendAt).slice(0, 16) : "");
      } else {
        setSurvey(null);
        setSurveyData([]);
      }
      setReady(true);
    });
    return () => sub.unsubscribe();
  }, [eventId, navigate]);

  // Upsert helper: create the Survey if it doesn't exist yet, else patch it.
  async function persistSurvey(patch) {
    if (!canEdit) return null;
    if (survey) {
      return DataStore.save(
        Survey.copyOf(survey, (u) => {
          Object.assign(u, patch);
        })
      );
    }
    return DataStore.save(
      new Survey({ surveyEventId: eventId, questions: [], ...patch })
    );
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
      alert(
        `No se pudo enviar la prueba${status ? ` (HTTP ${status})` : ""}${
          detail ? `: ${detail}` : ""
        }`
      );
    } finally {
      setTesting(false);
    }
  }

  function handleBuilderSave(questions) {
    persistSurvey({ questions })
      .then(() => alert("Encuesta guardada con éxito"))
      .catch((e) => {
        console.error("save survey:", e);
        alert("No se pudo guardar la encuesta");
      });
  }

  if (!ready) {
    return (
      <div className="bottom-0 left-0 right-0 top-[-10px] z-50 flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-lightPrimary p-3">
        <span className="loader"></span>
        <h2 className="mb-2 text-center text-xl text-black">Cargando...</h2>
      </div>
    );
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
      />

      <div className="flex flex-col gap-5">
        {/* Builder */}
        <Card
          title="Preguntas"
          subtitle={
            <>
              Diseña las preguntas. Usa <b>Opción única</b> (radio) para escalas
              de satisfacción y <b>Texto largo</b> para comentarios abiertos
              (los que la IA analiza).
            </>
          }
          className="overflow-hidden"
        >
          <EditableSection section="formulario">
            {/* key: remount ONLY when the Survey record (dis)appears — e.g. the
                saved questions arrive from DataStore sync after first paint —
                never on config keystrokes. */}
            <SurveyBuilder
              key={survey?.id || "new"}
              formData={surveyData}
              onSave={handleBuilderSave}
            />
          </EditableSection>
        </Card>

        {/* Config */}
        <Card
          title="Envío e invitación"
          subtitle="Correo que reciben los asistentes con el enlace a la encuesta."
        >
          {/* label: clicking the text toggles too (button is labelable) */}
          <label className="mb-4 flex cursor-pointer items-center gap-3">
            <Toggle checked={active} onChange={(v) => setActive(v)} />
            <span className="text-sm text-navy-700 dark:text-white">
              Activar envío automático al finalizar el evento (solo a quienes
              hicieron check-in)
            </span>
          </label>

          <div className="grid gap-x-4 sm:grid-cols-2">
            <Field label="Asunto del correo">
              <TextInput
                value={emailSubject}
                placeholder="Cuéntanos tu experiencia — Evento USFQ"
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </Field>
            <Field label="Enviar el" hint="Opcional — por defecto, al finalizar.">
              <TextInput
                type="datetime-local"
                value={sendAt}
                onChange={(e) => setSendAt(e.target.value)}
              />
            </Field>
          </div>

          <Field label="Mensaje de invitación">
            <TextArea
              rows={3}
              value={emailIntro}
              placeholder="Gracias por asistir. Tu opinión nos ayuda a mejorar; toma menos de 2 minutos."
              onChange={(e) => setEmailIntro(e.target.value)}
            />
          </Field>

          <div className="mt-4">
            <PrimaryButton onClick={saveConfig} disabled={savingCfg || !canEdit}>
              {savingCfg ? "Guardando..." : "Guardar configuración"}
            </PrimaryButton>
          </div>
        </Card>

        {/* Share + test */}
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
      </div>
    </div>
  );
};

export default Dashboard;
