import React, { Component, createRef } from "react";
import logo from "assets/img/usfq/logo_2025.png";
import { useParams, useSearchParams } from "react-router-dom";
import { generateClient } from "aws-amplify/api";
import {
  translateFormData,
  restoreOriginalLabels,
} from "scripts/translateFormData";

// Plain GraphQL, NOT DataStore: anonymous first-time visitors (everyone who
// clicks the email link) have an EMPTY local DataStore cache, and
// DataStore.query returns those empty local results immediately — the page
// showed "Encuesta no disponible" even though the survey exists. GraphQL hits
// AppSync directly (API key auth, same pattern as the public landing). The
// generated src/graphql files predate the Survey models, so the operations
// are defined inline (same as INSIGHTS_QUERY in encuesta-dashboard).
const SURVEY_QUERY = /* GraphQL */ `
  query PublicSurveyByEvent($filter: ModelSurveyFilterInput) {
    listSurveys(filter: $filter, limit: 1000) {
      items {
        id
        questions
      }
    }
  }
`;

const EVENT_TITLE_QUERY = /* GraphQL */ `
  query PublicEventTitle($id: ID!) {
    getEvent(id: $id) {
      id
      title
    }
  }
`;

const PREV_RESPONSE_QUERY = /* GraphQL */ `
  query PublicPrevResponse($filter: ModelSurveyResponseFilterInput) {
    listSurveyResponses(filter: $filter, limit: 1000) {
      items {
        id
      }
    }
  }
`;

const CREATE_RESPONSE_MUTATION = /* GraphQL */ `
  mutation PublicCreateSurveyResponse($input: CreateSurveyResponseInput!) {
    createSurveyResponse(input: $input) {
      id
    }
  }
`;

// Survey.questions is AWSJSON: over GraphQL it arrives as a (possibly
// double-encoded) JSON string, and elements can themselves be strings.
// Same tolerant normalization the results dashboard uses.
const normalizeQuestions = (raw) => {
  let val = raw;
  try {
    for (let i = 0; i < 3 && typeof val === "string"; i++) {
      val = JSON.parse(val);
    }
    if (!Array.isArray(val)) return null;
    return val
      .map((q) => (typeof q === "string" ? JSON.parse(q) : q))
      .filter((q) => q && typeof q === "object");
  } catch (e) {
    return null;
  }
};

// Public, anonymous survey page. Attendees who checked in receive a link like
//   /landing/<eventId>/encuesta?a=<attendeeId>
// The `a` token is stored only to de-duplicate submissions and measure the
// response rate — it is never shown as identity in the dashboard. Renders the
// Survey.questions with the same jQuery formBuilder renderer the registration
// form uses, then persists the answers as a SurveyResponse.
//
// Language: an ES/EN toggle (mirroring the landing) translates the survey on
// the fly via Amazon Translate, reusing translateFormData. Stored answers are
// ALWAYS normalized back to Spanish labels (restoreOriginalLabels) so the
// dashboard + AI analysis stay consistent regardless of the display language.

// Fixed UI strings for this page (self-contained; no landingTranslations dep).
const UI = {
  ES: {
    subtitle: "Tu respuesta es anónima. Toma menos de 2 minutos.",
    submit: "Enviar respuesta",
    submitting: "Enviando…",
    loading: "Cargando encuesta…",
    noneTitle: "Encuesta no disponible",
    noneText: "Este evento aún no tiene una encuesta publicada.",
    errorTitle: "Ups…",
    errorText: "No pudimos cargar la encuesta. Vuelve a intentar más tarde.",
    alreadyTitle: "¡Ya respondiste! 🎉",
    alreadyText: "Gracias, ya registramos tu opinión sobre este evento.",
    doneTitle: "¡Gracias por tu opinión! 🙌",
    doneText: "Tu respuesta nos ayuda a mejorar los próximos eventos.",
    fallbackTitle: "Encuesta del evento",
    alertNoAnswer: "Por favor responde al menos una pregunta.",
    alertSubmitFail: "No se pudo enviar tu respuesta. Intenta de nuevo.",
  },
  EN: {
    subtitle: "Your answer is anonymous. It takes less than 2 minutes.",
    submit: "Submit response",
    submitting: "Sending…",
    loading: "Loading survey…",
    noneTitle: "Survey not available",
    noneText: "This event doesn't have a published survey yet.",
    errorTitle: "Oops…",
    errorText: "We couldn't load the survey. Please try again later.",
    alreadyTitle: "You already responded! 🎉",
    alreadyText: "Thanks, we've already recorded your feedback for this event.",
    doneTitle: "Thanks for your feedback! 🙌",
    doneText: "Your response helps us improve future events.",
    fallbackTitle: "Event survey",
    alertNoAnswer: "Please answer at least one question.",
    alertSubmitFail: "We couldn't submit your response. Please try again.",
  },
};

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

// FormBuilder render wrapper. Re-renders whenever `formData` (already the
// translated-or-original definition, chosen by the parent) changes. A render
// token guards against the race where the user toggles language quickly: only
// the latest render is allowed to paint, so a stale translation can't clobber
// a newer one.
class SurveyRender extends Component {
  fb = createRef();
  renderToken = 0;

  async componentDidMount() {
    await this.renderForm();
  }

  async componentDidUpdate(prevProps) {
    if (
      JSON.stringify(prevProps.formData) !== JSON.stringify(this.props.formData)
    ) {
      await this.renderForm();
    }
  }

  async renderForm() {
    const myToken = ++this.renderToken;
    const jq = await loadJQuery();
    // A newer render started while we awaited jQuery — abandon this one.
    if (myToken !== this.renderToken || !this.fb.current) return;
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

  // Language toggle (ES default). Persisted in the same key the landing uses so
  // a visitor's choice carries across pages. URL is untouched (the survey route
  // has no lang param).
  const [lang, setLang] = React.useState(
    () => localStorage.getItem("landingLang") || "ES"
  );
  const ui = UI[lang] || UI.ES;

  const changeLang = (next) => {
    setLang(next);
    localStorage.setItem("landingLang", next);
  };

  // Definition actually rendered: ES original, or a translated copy on EN.
  const [renderData, setRenderData] = React.useState(null);

  const gql = React.useMemo(() => generateClient(), []);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await gql.graphql({
          query: SURVEY_QUERY,
          variables: { filter: { surveyEventId: { eq: id } } },
        });
        if (!alive) return;
        const s = res?.data?.listSurveys?.items?.[0];
        const qs = s ? normalizeQuestions(s.questions) : null;
        if (!s || !Array.isArray(qs) || qs.length === 0) {
          setState("none");
          return;
        }
        setSurvey({ ...s, questions: qs });

        // Event title (top-level getEvent is fine — only NESTED relations
        // resolve null in this project).
        try {
          const evRes = await gql.graphql({
            query: EVENT_TITLE_QUERY,
            variables: { id },
          });
          if (alive) setEventTitle(evRes?.data?.getEvent?.title || "");
        } catch (e) {
          // Title is cosmetic — never block the survey on it.
          console.error("survey event title:", e);
        }

        // Already answered with this token?
        if (token) {
          const prevRes = await gql.graphql({
            query: PREV_RESPONSE_QUERY,
            variables: {
              filter: { surveyID: { eq: s.id }, token: { eq: token } },
            },
          });
          const prev = prevRes?.data?.listSurveyResponses?.items || [];
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
  }, [id, token, gql]);

  // Choose what SurveyRender paints. On ES use the original questions as-is; on
  // EN show the original immediately, then upgrade to the translated copy once
  // Amazon Translate responds. `active` ignores a stale translation if the user
  // toggles again before it resolves.
  React.useEffect(() => {
    if (!survey || !Array.isArray(survey.questions)) return;
    const target = (lang || "ES").toLowerCase();

    setRenderData(survey.questions);
    if (target === "es") return;

    let active = true;
    (async () => {
      const translated = await translateFormData(survey.questions, target);
      if (active) setRenderData(translated);
    })();
    return () => {
      active = false;
    };
  }, [survey, lang]);

  async function handleSubmit() {
    if (!survey || submitting) return;
    setSubmitting(true);
    try {
      const jq = await loadJQuery();
      let userData = jq("#fb-editor").formRender("userData");
      // Require at least one non-empty answer so accidental blank submits don't count.
      const hasAnswer = Array.isArray(userData)
        ? userData.some(
            (f) =>
              Array.isArray(f.userData) &&
              f.userData.some((v) => String(v || "").trim().length > 0)
          )
        : false;
      if (!hasAnswer) {
        alert(ui.alertNoAnswer);
        setSubmitting(false);
        return;
      }
      // If the form is shown translated, restore the original Spanish labels so
      // stored answers stay in ES (dashboard + AI group by name and read labels).
      // Pass the ORIGINAL definition, never the translated copy.
      if ((lang || "ES").toLowerCase() !== "es") {
        userData = restoreOriginalLabels(userData, survey.questions);
      }
      // GraphQL mutation, not DataStore.save: on a cold anonymous store a
      // DataStore save only queues locally and syncs in background — closing
      // the tab right after the "thanks" screen could lose the response. The
      // mutation confirms the write reached AppSync before showing "done".
      // AWSJSON input must be a JSON string.
      await gql.graphql({
        query: CREATE_RESPONSE_MUTATION,
        variables: {
          input: {
            surveyID: survey.id,
            eventID: id,
            token,
            answers: JSON.stringify(userData),
          },
        },
      });
      setState("done");
    } catch (e) {
      console.error("survey submit:", e);
      alert(ui.alertSubmitFail);
      setSubmitting(false);
    }
  }

  const LangToggle = () => (
    <div className="flex items-center justify-end gap-1 mb-4">
      <button
        type="button"
        onClick={() => changeLang("ES")}
        aria-label="Español"
        title="Español"
        className={`flex items-center gap-1 px-1 py-1 rounded select-none outline-none focus:outline-none focus-visible:outline-none transition-opacity duration-200 ${
          lang === "ES" ? "opacity-100" : "opacity-40 hover:opacity-100"
        }`}
      >
        <span className="text-xl leading-none">🇲🇽</span>
        <span className="text-xs font-semibold">ES</span>
      </button>
      <button
        type="button"
        onClick={() => changeLang("EN")}
        aria-label="English"
        title="English"
        className={`flex items-center gap-1 px-1 py-1 rounded select-none outline-none focus:outline-none focus-visible:outline-none transition-opacity duration-200 ${
          lang === "EN" ? "opacity-100" : "opacity-40 hover:opacity-100"
        }`}
      >
        <span className="text-xl leading-none">🇺🇸</span>
        <span className="text-xs font-semibold">EN</span>
      </button>
    </div>
  );

  const Shell = ({ children }) => (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col items-center py-10 px-4">
      <img src={logo} alt="USFQ" className="h-12 mb-6" />
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-card p-6 sm:p-8">
        <LangToggle />
        {children}
      </div>
    </div>
  );

  if (state === "loading") {
    return (
      <Shell>
        <p className="text-center text-gray-500">{ui.loading}</p>
      </Shell>
    );
  }

  if (state === "none") {
    return (
      <Shell>
        <h1 className="text-xl font-bold text-navy-700 mb-2">{ui.noneTitle}</h1>
        <p className="text-gray-600">{ui.noneText}</p>
      </Shell>
    );
  }

  if (state === "error") {
    return (
      <Shell>
        <h1 className="text-xl font-bold text-navy-700 mb-2">{ui.errorTitle}</h1>
        <p className="text-gray-600">{ui.errorText}</p>
      </Shell>
    );
  }

  if (state === "already") {
    return (
      <Shell>
        <h1 className="text-xl font-bold text-navy-700 mb-2">
          {ui.alreadyTitle}
        </h1>
        <p className="text-gray-600">{ui.alreadyText}</p>
      </Shell>
    );
  }

  if (state === "done") {
    return (
      <Shell>
        <h1 className="text-xl font-bold text-navy-700 mb-2">{ui.doneTitle}</h1>
        <p className="text-gray-600">{ui.doneText}</p>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="text-2xl font-bold text-navy-700 mb-1">
        {eventTitle || ui.fallbackTitle}
      </h1>
      <p className="text-gray-500 mb-5 text-sm">{ui.subtitle}</p>
      <div className="survey-form">
        {renderData && <SurveyRender formData={renderData} />}
      </div>
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="mt-5 w-full rounded-xl bg-brand-500 py-2.5 text-[15px] text-white font-semibold transition hover:bg-black disabled:opacity-50"
      >
        {submitting ? ui.submitting : ui.submit}
      </button>
    </Shell>
  );
};

export default SurveyPublic;
