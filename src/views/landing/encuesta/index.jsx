import React, { Component, createRef } from "react";
import logo from "assets/img/usfq/logo_2025.png";
import { useParams, useSearchParams } from "react-router-dom";
import { DataStore } from "aws-amplify/datastore";
import { Survey, SurveyResponse, Event } from "models";

// Public, anonymous survey page. Attendees who checked in receive a link like
//   /landing/<eventId>/encuesta?a=<attendeeId>
// The `a` token is stored only to de-duplicate submissions and measure the
// response rate — it is never shown as identity in the dashboard. Renders the
// Survey.questions with the same jQuery formBuilder renderer the registration
// form uses, then persists the answers as a SurveyResponse.

let $ = null;
const loadJQuery = async () => {
  if ($) return $;
  const jq = (await import("jquery")).default;
  window.jQuery = jq;
  window.$ = jq;
  await import("jquery-ui-sortable");
  await import("formBuilder");
  await import("formBuilder/dist/form-render.min.js");
  $ = jq;
  return jq;
};

class SurveyRender extends Component {
  fb = createRef();
  async componentDidMount() {
    const jq = await loadJQuery();
    const el = jq(this.fb.current);
    el.empty();
    el.formRender({ dataType: "json", formData: this.props.formData });
  }
  render() {
    return <div id="fb-editor" ref={this.fb} />;
  }
}

const SurveyPublic = () => {
  const { id } = useParams();
  const [params] = useSearchParams();
  const token = params.get("a") || null;

  const [state, setState] = React.useState("loading"); // loading|ready|done|already|none|error
  const [survey, setSurvey] = React.useState(null);
  const [eventTitle, setEventTitle] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const surveys = await DataStore.query(Survey, (s) =>
          s.surveyEventId.eq(id)
        );
        if (!alive) return;
        const s = surveys[0];
        if (!s || !Array.isArray(s.questions) || s.questions.length === 0) {
          setState("none");
          return;
        }
        setSurvey(s);

        const ev = await DataStore.query(Event, (e) => e.id.eq(id));
        if (alive && ev[0]) setEventTitle(ev[0].title || "");

        // Already answered with this token?
        if (token) {
          const prev = await DataStore.query(SurveyResponse, (r) =>
            r.and((r) => [r.surveyID.eq(s.id), r.token.eq(token)])
          );
          if (alive && prev.length > 0) {
            setState("already");
            return;
          }
        }
        if (alive) setState("ready");
      } catch (e) {
        console.error("survey load:", e);
        if (alive) setState("error");
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, token]);

  async function handleSubmit() {
    if (!survey || submitting) return;
    setSubmitting(true);
    try {
      const jq = await loadJQuery();
      const userData = jq("#fb-editor").formRender("userData");
      // Require at least one non-empty answer so accidental blank submits don't count.
      const hasAnswer = Array.isArray(userData)
        ? userData.some(
            (f) =>
              Array.isArray(f.userData) &&
              f.userData.some((v) => String(v || "").trim().length > 0)
          )
        : false;
      if (!hasAnswer) {
        alert("Por favor responde al menos una pregunta.");
        setSubmitting(false);
        return;
      }
      await DataStore.save(
        new SurveyResponse({
          surveyID: survey.id,
          eventID: id,
          token,
          answers: userData,
        })
      );
      setState("done");
    } catch (e) {
      console.error("survey submit:", e);
      alert("No se pudo enviar tu respuesta. Intenta de nuevo.");
      setSubmitting(false);
    }
  }

  const Shell = ({ children }) => (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col items-center py-10 px-4">
      <img src={logo} alt="USFQ" className="h-12 mb-6" />
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-card p-6 sm:p-8">
        {children}
      </div>
    </div>
  );

  if (state === "loading") {
    return (
      <Shell>
        <p className="text-center text-gray-500">Cargando encuesta…</p>
      </Shell>
    );
  }

  if (state === "none") {
    return (
      <Shell>
        <h1 className="text-xl font-bold text-navy-700 mb-2">
          Encuesta no disponible
        </h1>
        <p className="text-gray-600">
          Este evento aún no tiene una encuesta publicada.
        </p>
      </Shell>
    );
  }

  if (state === "error") {
    return (
      <Shell>
        <h1 className="text-xl font-bold text-navy-700 mb-2">Ups…</h1>
        <p className="text-gray-600">
          No pudimos cargar la encuesta. Vuelve a intentar más tarde.
        </p>
      </Shell>
    );
  }

  if (state === "already") {
    return (
      <Shell>
        <h1 className="text-xl font-bold text-navy-700 mb-2">
          ¡Ya respondiste! 🎉
        </h1>
        <p className="text-gray-600">
          Gracias, ya registramos tu opinión sobre este evento.
        </p>
      </Shell>
    );
  }

  if (state === "done") {
    return (
      <Shell>
        <h1 className="text-xl font-bold text-navy-700 mb-2">
          ¡Gracias por tu opinión! 🙌
        </h1>
        <p className="text-gray-600">
          Tu respuesta nos ayuda a mejorar los próximos eventos.
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="text-2xl font-bold text-navy-700 mb-1">
        {eventTitle || "Encuesta del evento"}
      </h1>
      <p className="text-gray-500 mb-5 text-sm">
        Tu respuesta es anónima. Toma menos de 2 minutos.
      </p>
      <SurveyRender formData={survey.questions} />
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="mt-6 w-full rounded-xl bg-brand-500 py-3 text-white font-medium transition hover:bg-black disabled:opacity-50"
      >
        {submitting ? "Enviando…" : "Enviar respuesta"}
      </button>
    </Shell>
  );
};

export default SurveyPublic;
