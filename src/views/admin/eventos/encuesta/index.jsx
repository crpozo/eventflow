import React, { Component, createRef } from "react";
import { useNavigate } from "react-router-dom";
import { DataStore } from "aws-amplify/datastore";
import { post } from "aws-amplify/api";
import { Survey } from "models";
import { EditableSection, useCanEditSection } from "components/sectionEdit";
import { MdContentCopy, MdSend } from "react-icons/md";
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

const Dashboard = () => {
  const navigate = useNavigate();
  const stored = JSON.parse(localStorage.getItem("EVENTFLOW.event") || "null");
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
  const [copied, setCopied] = React.useState(false);

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

  function copyLink() {
    navigator.clipboard?.writeText(publicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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
      alert(
        "No se pudo enviar la prueba. Verifica que la encuesta esté guardada y que el envío esté desplegado."
      );
    } finally {
      setTesting(false);
    }
  }

  class FormBuilder extends Component {
    fb = createRef();
    componentDidMount() {
      $(this.fb.current).formBuilder({
        formData: surveyData,
        onSave: this.handleSave,
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

    handleSave = () => {
      const json = $(this.fb.current).formBuilder("getData", "json");
      if (!json) return;
      persistSurvey({ questions: JSON.parse(json) })
        .then(() => alert("Encuesta guardada con éxito"))
        .catch((e) => {
          console.error("save survey:", e);
          alert("No se pudo guardar la encuesta");
        });
    };

    render() {
      return <div id="fb-editor" ref={this.fb} />;
    }
  }

  if (!ready) {
    return (
      <div className="bottom-0 left-0 right-0 top-[-10px] z-50 flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-lightPrimary p-3">
        <span className="loader"></span>
        <h2 className="mb-2 text-center text-xl text-black">Cargando...</h2>
      </div>
    );
  }

  const inputCls =
    "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-navy-700 outline-none focus:border-brand-500";

  return (
    <div className="campus-page">
      <div className="grid h-full">
        <h2 className="text-2xl font-bold text-navy-700 dark:text-white mb-2 mt-2">
          Encuesta del evento
        </h2>
      </div>

      {/* Builder */}
      <div className="relative flex flex-col bg-white bg-clip-border shadow-card px-[14px] py-[20px] rounded-3xl dark:!bg-navy-800 dark:text-white overflow-hidden">
        <p className="text-sm text-gray-500 mb-3">
          Diseña las preguntas. Usa <b>Opción única</b> (radio) para escalas de
          satisfacción y <b>Texto largo</b> para comentarios abiertos (los que la
          IA analiza).
        </p>
        <EditableSection section="formulario">
          <FormBuilder />
        </EditableSection>
      </div>

      {/* Config + share */}
      <div className="mt-4 relative flex flex-col gap-4 bg-white bg-clip-border shadow-card px-[20px] py-[20px] rounded-3xl dark:!bg-navy-800 dark:text-white">
        <h3 className="text-lg font-bold text-navy-700 dark:text-white">
          Envío e invitación
        </h3>

        <label className="flex items-center gap-2 text-sm text-navy-700 dark:text-white">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="h-4 w-4 accent-brand-500"
          />
          Activar envío automático al finalizar el evento (solo a quienes hicieron
          check-in)
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-navy-700 dark:text-white">
              Asunto del correo
            </label>
            <input
              className={inputCls}
              value={emailSubject}
              placeholder="Cuéntanos tu experiencia — Evento USFQ"
              onChange={(e) => setEmailSubject(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-navy-700 dark:text-white">
              Enviar el (opcional — por defecto, al finalizar)
            </label>
            <input
              type="datetime-local"
              className={inputCls}
              value={sendAt}
              onChange={(e) => setSendAt(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-navy-700 dark:text-white">
            Mensaje de invitación
          </label>
          <textarea
            className={inputCls}
            rows={3}
            value={emailIntro}
            placeholder="Gracias por asistir. Tu opinión nos ayuda a mejorar; toma menos de 2 minutos."
            onChange={(e) => setEmailIntro(e.target.value)}
          />
        </div>

        <div>
          <button
            onClick={saveConfig}
            disabled={savingCfg || !canEdit}
            className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-black disabled:opacity-50"
          >
            {savingCfg ? "Guardando..." : "Guardar configuración"}
          </button>
        </div>

        <div className="h-px bg-gray-200 dark:bg-navy-700" />

        {/* Public link */}
        <div>
          <label className="text-sm font-medium text-navy-700 dark:text-white">
            Enlace público de la encuesta
          </label>
          <div className="mt-1 flex items-center gap-2">
            <input className={inputCls} readOnly value={publicLink} />
            <button
              onClick={copyLink}
              className="flex shrink-0 items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-sm text-navy-700 hover:bg-gray-100"
            >
              <MdContentCopy /> {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
        </div>

        {/* Test send */}
        <div>
          <label className="text-sm font-medium text-navy-700 dark:text-white">
            Enviar prueba a mi correo
          </label>
          <div className="mt-1 flex items-center gap-2">
            <input
              className={inputCls}
              type="email"
              placeholder="tucorreo@usfq.edu.ec"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
            <button
              onClick={sendTest}
              disabled={testing}
              className="flex shrink-0 items-center gap-1 rounded-xl bg-navy-700 px-3 py-2 text-sm text-white hover:bg-black disabled:opacity-50"
            >
              <MdSend /> {testing ? "Enviando..." : "Enviar prueba"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
