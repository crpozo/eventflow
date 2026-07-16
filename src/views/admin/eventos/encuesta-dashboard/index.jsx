import React from "react";
import { useNavigate } from "react-router-dom";
import { DataStore } from "aws-amplify/datastore";
import { post, generateClient } from "aws-amplify/api";
import * as XLSX from "xlsx";
import { Survey, SurveyResponse, EventAttendee } from "models";
import { readStoredEvent } from "scripts/utils";
import {
  PageHeader,
  Card,
  Chip,
  PrimaryButton,
  SecondaryButton,
  TYPE,
  PageLoader,
} from "components/adminUi";
import { MdAutoAwesome, MdFileDownload, MdRefresh } from "react-icons/md";

// Per-event survey results dashboard: AI insights (cached on Survey.insights),
// response rate vs. checked-in attendees, a detail table of anonymous answers,
// and an Excel export. "Analizar con IA" calls the surveyAnalyzer Lambda, which
// runs Claude over the responses and stores the structured insights back on the
// Survey — so the page doesn't re-analyze on every load.
const USER_API = "userApi";

const stripHtml = (s) =>
  String(s || "")
    .replace(/<[^>]*>/g, "")
    .trim();

const valOf = (f) =>
  Array.isArray(f?.userData) ? f.userData.filter(Boolean).join(", ") : "";

// Chip colors for theme sentiment tags (adminUi Chip palette).
const SENT_CHIP = {
  positivo: "green",
  neutral: "gray",
  negativo: "red",
};

// The analyzer Lambda writes insights straight to DynamoDB, which DataStore's
// local cache never picks up (no AppSync _version/_lastChangedAt stamp). Plain
// GraphQL reads DynamoDB directly, so insights are fetched through this query
// instead of the DataStore record.
const INSIGHTS_QUERY = /* GraphQL */ `
  query SurveyInsightsByEvent($filter: ModelSurveyFilterInput) {
    listSurveys(filter: $filter, limit: 1000) {
      items {
        id
        insights
        insightsAt
        questions
      }
    }
  }
`;

// Human labels for formBuilder field types (chips in "Resultados por pregunta").
const FIELD_TYPE_LABELS = {
  "radio-group": "Opción única",
  select: "Lista desplegable",
  "checkbox-group": "Selección múltiple",
  text: "Texto corto",
  textarea: "Texto largo",
  number: "Número",
  date: "Fecha",
};

// Survey.questions is AWSJSON: GraphQL returns a (possibly double-encoded)
// string, DataStore an already-parsed array — and elements can themselves be
// JSON strings. Normalize to an array of question objects, or null.
const parseQuestions = (raw) => {
  let val = raw;
  try {
    for (let i = 0; i < 3 && typeof val === "string"; i++) {
      val = JSON.parse(val);
    }
    if (!Array.isArray(val)) return null;
    return val
      .map((q) => (typeof q === "string" ? JSON.parse(q) : q))
      .filter((q) => q && typeof q === "object");
  } catch {
    return null;
  }
};

const clip = (s, n = 120) =>
  s.length > n ? `${s.slice(0, n).trimEnd()}…` : s;

/* Horizontal div-bars for option questions (and date distributions). Bar width
   scales against the most-voted option; the % reads against total answers. */
function OptionBars({ rows, total }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="mt-3 flex flex-col gap-2">
      {rows.map((r, i) => {
        const pct = total > 0 ? Math.round((r.count / total) * 100) : 0;
        return (
          <div key={i} className="flex items-center gap-3">
            <span
              title={r.label}
              className="line-clamp-2 w-36 shrink-0 break-words text-sm text-navy-700 dark:text-gray-100 sm:w-52"
            >
              {r.label}
            </span>
            <div className="h-2.5 w-full min-w-0 flex-1 rounded-full bg-gray-100 dark:bg-navy-700">
              <div
                className="h-2.5 rounded-full bg-teal-500"
                style={{
                  width: `${
                    r.count > 0 ? Math.max(2, (r.count / max) * 100) : 0
                  }%`,
                }}
              />
            </div>
            <span className="w-20 shrink-0 text-right text-sm font-semibold text-navy-700 dark:text-white">
              {r.count} · {pct}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* Type-specific body of a question card. perResponse = one userData array per
   response that actually answered this question (already trimmed/non-empty). */
function QuestionBody({ q, perResponse, total }) {
  const type = q.type;

  if (
    type === "radio-group" ||
    type === "select" ||
    type === "checkbox-group" ||
    type === "date"
  ) {
    // Count each option once per response (checkbox-group userData can carry
    // several values; a duplicated value still counts as one respondent).
    const counts = new Map();
    perResponse.forEach((ud) => {
      new Set(ud).forEach((v) => counts.set(v, (counts.get(v) || 0) + 1));
    });
    let rows;
    if (type === "date") {
      rows = [...counts.keys()]
        .sort((a, b) => String(a).localeCompare(String(b)))
        .map((v) => ({ label: v, count: counts.get(v) }));
    } else {
      // userData stores the option VALUE (e.g. "option-1") — map it back to
      // its label via question.values; unknown values render raw, appended.
      const defined = Array.isArray(q.values) ? q.values : [];
      rows = defined.map((o) => ({
        label: stripHtml(o.label) || String(o.value),
        count: counts.get(String(o.value)) || 0,
      }));
      const known = new Set(defined.map((o) => String(o.value)));
      [...counts.keys()]
        .filter((v) => !known.has(v))
        .forEach((v) => rows.push({ label: v, count: counts.get(v) }));
    }
    if (rows.length === 0) {
      return (
        <p className="mt-3 text-sm text-gray-500">Sin respuestas todavía.</p>
      );
    }
    return <OptionBars rows={rows} total={total} />;
  }

  if (type === "number") {
    const nums = perResponse
      .flat()
      .map(Number)
      .filter((n) => Number.isFinite(n));
    if (nums.length === 0) {
      return (
        <p className="mt-3 text-sm text-gray-500">
          Sin valores numéricos todavía.
        </p>
      );
    }
    const fmt = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
    const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
    const stats = [
      ["Promedio", fmt(avg)],
      ["Mín", fmt(Math.min(...nums))],
      ["Máx", fmt(Math.max(...nums))],
    ];
    return (
      <div className="mt-3 flex gap-8">
        {stats.map(([label, value]) => (
          <div key={label}>
            <p className="text-xs text-gray-400">{label}</p>
            <p className="text-2xl font-bold text-navy-700 dark:text-white">
              {value}
            </p>
          </div>
        ))}
      </div>
    );
  }

  // text / textarea (and any unknown type): up to 3 sample answers + total.
  const texts = perResponse.map((ud) => ud.join(", ")).filter(Boolean);
  if (texts.length === 0) {
    return (
      <p className="mt-3 text-sm text-gray-500">Sin respuestas todavía.</p>
    );
  }
  return (
    <div className="mt-3">
      <ul className="flex flex-col gap-1.5">
        {texts.slice(0, 3).map((t, i) => (
          <li key={i} className="truncate text-sm italic text-gray-500">
            “{clip(t)}”
          </li>
        ))}
      </ul>
      {texts.length > 3 && (
        <p className="mt-1.5 text-xs text-gray-400">
          y {texts.length - 3} respuesta(s) más
        </p>
      )}
    </div>
  );
}

const Dashboard = () => {
  const navigate = useNavigate();
  const stored = readStoredEvent();
  const eventId = stored?.id;
  const eventTitle = stored?.title || "Evento";

  const [survey, setSurvey] = React.useState(null);
  const [responses, setResponses] = React.useState([]);
  const [checkedIn, setCheckedIn] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [analyzing, setAnalyzing] = React.useState(false);
  // Insights fetched OUTSIDE DataStore (see INSIGHTS_QUERY note) + the ones
  // returned inline by the analyze endpoint. Preferred over survey.insights.
  const [apiInsights, setApiInsights] = React.useState(null);
  // Canonical question definitions from the same GraphQL read (raw AWSJSON);
  // preferred over the DataStore copy, which can lag behind direct writes.
  const [apiQuestions, setApiQuestions] = React.useState(null);

  const gqlClient = React.useMemo(() => generateClient(), []);

  const refreshInsights = React.useCallback(async () => {
    if (!eventId) return;
    try {
      const res = await gqlClient.graphql({
        query: INSIGHTS_QUERY,
        variables: { filter: { surveyEventId: { eq: eventId } } },
      });
      const item = res?.data?.listSurveys?.items?.[0];
      if (item?.insights) {
        setApiInsights({ insights: item.insights, insightsAt: item.insightsAt });
      }
      if (item?.questions) {
        setApiQuestions(item.questions);
      }
    } catch (e) {
      console.error("insights fetch:", e);
    }
  }, [eventId, gqlClient]);

  React.useEffect(() => {
    refreshInsights();
  }, [refreshInsights]);

  React.useEffect(() => {
    if (!eventId) {
      navigate("/admin");
      return;
    }
    // Live survey (questions/config; insights come from refreshInsights).
    const sub = DataStore.observeQuery(Survey, (s) =>
      s.surveyEventId.eq(eventId)
    ).subscribe(({ items }) => setSurvey(items[0] || null));

    (async () => {
      try {
        const [resp, atts] = await Promise.all([
          DataStore.query(SurveyResponse, (r) => r.eventID.eq(eventId)),
          DataStore.query(EventAttendee, (e) => e.eventID.eq(eventId)),
        ]);
        setResponses(resp);
        setCheckedIn(atts.filter((a) => a.checkIn === true).length);
      } catch (e) {
        console.error("dashboard load:", e);
      } finally {
        setLoading(false);
      }
    })();

    return () => sub.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, navigate]);

  const insights = React.useMemo(() => {
    let val = apiInsights?.insights ?? survey?.insights;
    if (!val) return null;
    // AWSJSON can arrive single or DOUBLE encoded (the Lambda used to store a
    // stringified object, which AWSJSON wraps again): keep parsing while it's
    // still a string, then only accept a real object.
    try {
      for (let i = 0; i < 3 && typeof val === "string"; i++) {
        val = JSON.parse(val);
      }
    } catch {
      return null;
    }
    return val && typeof val === "object" ? val : null;
  }, [apiInsights, survey]);

  const insightsAt = apiInsights?.insightsAt ?? survey?.insightsAt;

  // Per-question AI insights (new "perQuestion" key). Old analyses don't have
  // it — the section then shows a one-line "re-analiza" hint instead.
  const perQuestion = React.useMemo(
    () => (Array.isArray(insights?.perQuestion) ? insights.perQuestion : []),
    [insights]
  );
  const pqByName = React.useMemo(() => {
    const m = {};
    perQuestion.forEach((p) => {
      if (p?.name) m[p.name] = p;
    });
    return m;
  }, [perQuestion]);

  // Canonical question list (order, types, option values): GraphQL copy first,
  // DataStore second; if neither parses, derive the union of answered names
  // from the responses themselves (label/type as stored in each answer).
  const questions = React.useMemo(() => {
    const canonical =
      parseQuestions(apiQuestions) ?? parseQuestions(survey?.questions);
    if (canonical && canonical.length > 0) return canonical;
    const seen = new Map();
    responses.forEach((r) => {
      (Array.isArray(r.answers) ? r.answers : []).forEach((f) => {
        if (f?.name && !seen.has(f.name)) {
          seen.set(f.name, { name: f.name, label: f.label, type: f.type });
        }
      });
    });
    return [...seen.values()];
  }, [apiQuestions, survey, responses]);

  // One entry per real question with the userData of every response that
  // answered it (blank/whitespace-only answers don't count).
  const questionStats = React.useMemo(
    () =>
      questions
        .filter((q) => q.type !== "header" && q.type !== "paragraph" && q.name)
        .map((q) => {
          const perResponse = [];
          responses.forEach((r) => {
            const f = (Array.isArray(r.answers) ? r.answers : []).find(
              (a) => a?.name === q.name
            );
            const ud = Array.isArray(f?.userData)
              ? f.userData.map((v) => String(v ?? "").trim()).filter(Boolean)
              : [];
            if (ud.length > 0) perResponse.push(ud);
          });
          return { q, perResponse, total: perResponse.length };
        }),
    [questions, responses]
  );

  // Columns for the detail table (stable order). Derived from the same
  // normalized `questions` memo as the per-question cards, so the table and
  // the Excel export survive a cold/lagging DataStore copy (GraphQL fallback)
  // and legacy string-encoded question shapes.
  const columns = React.useMemo(
    () =>
      questions
        .filter((q) => q.type !== "header" && q.type !== "paragraph" && q.name)
        .map((q) => ({ name: q.name, label: stripHtml(q.label) || q.name })),
    [questions]
  );

  const rows = React.useMemo(
    () =>
      responses.map((r) => {
        const answers = Array.isArray(r.answers) ? r.answers : [];
        const byName = {};
        answers.forEach((f) => {
          byName[f.name] = valOf(f);
        });
        return { id: r.id, createdAt: r.createdAt, byName };
      }),
    [responses]
  );

  // Capped at 100: with test data (anonymous links answered without check-in)
  // responses can exceed check-ins and a ">100%" rate reads as a bug.
  const responseRate =
    checkedIn > 0
      ? Math.min(100, Math.round((responses.length / checkedIn) * 100))
      : null;

  async function analyze() {
    if (analyzing) return;
    if (responses.length === 0) {
      alert("Aún no hay respuestas para analizar.");
      return;
    }
    setAnalyzing(true);
    try {
      const op = post({
        apiName: USER_API,
        path: "/survey-analyze",
        options: { body: { eventId } },
      });
      const { body } = await op.response;
      // The endpoint returns the freshly generated insights — render them
      // immediately (DataStore never syncs the Lambda's direct-DDB write).
      const data = await body.json().catch(() => ({}));
      if (data?.insights) {
        setApiInsights({ insights: data.insights, insightsAt: data.insightsAt });
      } else {
        await refreshInsights();
      }
    } catch (e) {
      console.error("analyze:", e);
      // Surface the real backend error (Lambda returns { error }) instead of a
      // generic message — API Gateway/Bedrock failures differ in fix.
      const status = e?.response?.statusCode;
      let detail = "";
      try {
        detail = JSON.parse(e?.response?.body || "{}").error || "";
      } catch (_) {}
      alert(
        `No se pudo analizar${status ? ` (HTTP ${status})` : ""}${
          detail ? `: ${detail}` : ""
        }`
      );
    } finally {
      setAnalyzing(false);
    }
  }

  const [pdfBusy, setPdfBusy] = React.useState(false);
  // El PDF del análisis se genera en el cliente; @react-pdf/renderer se carga
  // bajo demanda (igual que pdf-lib en los gafetes) para no engordar el bundle.
  async function downloadAnalysisPdfClick() {
    if (!insights) return;
    setPdfBusy(true);
    try {
      const { downloadAnalysisPdf } = await import("./AnalysisPdf");
      await downloadAnalysisPdf({
        eventTitle,
        insights,
        insightsAt,
        metrics: {
          responses: responses.length,
          checkedIn,
          responseRate,
        },
      });
    } catch (e) {
      console.error("PDF análisis IA:", e);
      alert("No se pudo generar el PDF del análisis.");
    } finally {
      setPdfBusy(false);
    }
  }

  function exportExcel() {
    if (rows.length === 0) {
      alert("No hay respuestas para exportar.");
      return;
    }
    const data = rows.map((row, i) => {
      const o = { "#": i + 1 };
      columns.forEach((c) => {
        o[c.label] = row.byName[c.name] || "";
      });
      o["Fecha"] = row.createdAt
        ? new Date(row.createdAt).toLocaleString("es-EC")
        : "";
      return o;
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Respuestas");
    XLSX.writeFile(wb, `${eventTitle}-encuesta.xlsx`);
  }

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="campus-page mt-3">
      <PageHeader
        crumbs={[
          { label: "Eventos", to: "/admin/eventos" },
          { label: eventTitle },
          { label: "Resultados encuesta" },
        ]}
        title="Resultados de la encuesta"
        subtitle="Respuestas, análisis con IA y exportación."
        actions={
          <>
            <PrimaryButton
              onClick={analyze}
              disabled={analyzing}
              className="flex items-center gap-1.5"
            >
              {insights ? <MdRefresh /> : <MdAutoAwesome />}
              {analyzing
                ? "Analizando…"
                : insights
                ? "Re-analizar con IA"
                : "Analizar con IA"}
            </PrimaryButton>
            <SecondaryButton onClick={exportExcel}>
              <MdFileDownload /> Exportar Excel
            </SecondaryButton>
          </>
        }
      />

      <div className="flex flex-col gap-5">
      {/* Metrics */}
      <div className="grid gap-5 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-gray-500">Respuestas</p>
          <p className={TYPE.metricValue}>
            {responses.length}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Check-ins</p>
          <p className={TYPE.metricValue}>
            {checkedIn}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Tasa de respuesta</p>
          <p className={TYPE.metricValue}>
            {responseRate !== null ? `${responseRate}%` : "—"}
          </p>
        </Card>
      </div>

      {/* AI insights */}
      {insights ? (
        <Card
          title="Análisis con IA"
          headerRight={
            <div className="flex items-center gap-3">
              {insightsAt ? (
                <span className="text-xs text-gray-400">
                  {new Date(insightsAt).toLocaleString("es-EC")}
                </span>
              ) : null}
              <SecondaryButton
                onClick={downloadAnalysisPdfClick}
                disabled={pdfBusy}
                title="Descargar el análisis como PDF"
              >
                <MdFileDownload />
                {pdfBusy ? "Generando…" : "Descargar PDF"}
              </SecondaryButton>
            </div>
          }
        >
          {insights.executiveSummary && (
            <p className="mb-4 text-sm leading-relaxed text-navy-700 dark:text-gray-100">
              {insights.executiveSummary}
            </p>
          )}

          {insights.overallSentiment && (
            <div className="mb-4">
              <p className="text-sm text-gray-500">Sentimiento general</p>
              <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-3 rounded-full"
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(100, Number(insights.overallSentiment.score) || 0)
                    )}%`,
                    background:
                      (Number(insights.overallSentiment.score) || 0) >= 66
                        ? "#16a34a"
                        : (Number(insights.overallSentiment.score) || 0) >= 40
                        ? "#f59e0b"
                        : "#e41b23",
                  }}
                />
              </div>
              <p className="mt-1 text-sm font-medium">
                {insights.overallSentiment.label} (
                {insights.overallSentiment.score}/100)
              </p>
            </div>
          )}

          {Array.isArray(insights.themes) && insights.themes.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-sm font-semibold text-gray-600 dark:text-gray-300">
                Temas principales
              </p>
              <div className="flex flex-col gap-2">
                {insights.themes.map((t, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-gray-100 p-3 dark:border-navy-700"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-navy-700 dark:text-white">
                        {t.title}
                      </span>
                      <Chip color={SENT_CHIP[t.sentiment] || "gray"}>
                        {t.sentiment}
                        {typeof t.mentions === "number"
                          ? ` · ${t.mentions}`
                          : ""}
                      </Chip>
                    </div>
                    {t.summary && (
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                        {t.summary}
                      </p>
                    )}
                    {Array.isArray(t.sampleQuotes) &&
                      t.sampleQuotes.length > 0 && (
                        <ul className="mt-1 list-disc pl-5 text-xs italic text-gray-500">
                          {t.sampleQuotes.slice(0, 3).map((q, j) => (
                            <li key={j}>“{q}”</li>
                          ))}
                        </ul>
                      )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {Array.isArray(insights.strengths) &&
              insights.strengths.length > 0 && (
                <div>
                  <p className="mb-1 text-sm font-semibold text-green-700">
                    Fortalezas
                  </p>
                  <ul className="list-disc pl-5 text-sm text-navy-700 dark:text-gray-200">
                    {insights.strengths.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            {Array.isArray(insights.concerns) &&
              insights.concerns.length > 0 && (
                <div>
                  <p className="mb-1 text-sm font-semibold text-red-700">
                    Preocupaciones
                  </p>
                  <ul className="list-disc pl-5 text-sm text-navy-700 dark:text-gray-200">
                    {insights.concerns.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
          </div>

          {Array.isArray(insights.recommendations) &&
            insights.recommendations.length > 0 && (
              <div className="mt-4">
                <p className="mb-1 text-sm font-semibold text-navy-700 dark:text-white">
                  Recomendaciones accionables
                </p>
                <ul className="list-disc pl-5 text-sm text-navy-700 dark:text-gray-200">
                  {insights.recommendations.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
        </Card>
      ) : (
        <Card title="Análisis con IA">
          <p className="text-sm text-gray-500">
            Aún no hay análisis de IA. Pulsa <b>Analizar con IA</b> para generar un
            resumen ejecutivo, sentimiento, temas y recomendaciones a partir de las{" "}
            {responses.length} respuesta(s).
          </p>
        </Card>
      )}

      {/* Per-question results: one compact card per real question, with a
          type-appropriate mini-viz and (when available) its AI insight. */}
      {questionStats.length > 0 && (
        <div className="flex flex-col gap-3">
          <div>
            <h3 className="text-lg font-bold text-navy-700 dark:text-white">
              Resultados por pregunta
            </h3>
            {insights && perQuestion.length === 0 && (
              <p className="mt-1 text-sm text-gray-500">
                Re-analiza con IA para obtener el resumen por pregunta (si ya
                lo hiciste, aún no hay suficiente feedback sustantivo por
                pregunta).
              </p>
            )}
          </div>
          {questionStats.map(({ q, perResponse, total }, i) => {
            const ai = pqByName[q.name];
            return (
              <Card key={q.name || i} className="!p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="min-w-0 text-base font-semibold text-navy-700 dark:text-white">
                    {i + 1}. {stripHtml(q.label) || q.name}
                  </p>
                  <div className="flex shrink-0 items-center gap-2">
                    <Chip color="gray" dot={false}>
                      {FIELD_TYPE_LABELS[q.type] || q.type}
                    </Chip>
                    <span className="text-xs text-gray-400">
                      {total} respuesta{total === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
                <QuestionBody q={q} perResponse={perResponse} total={total} />
                {ai && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl bg-teal-50 p-3 dark:bg-teal-900/20">
                    <MdAutoAwesome className="mt-0.5 shrink-0 text-teal-600" />
                    <p className="min-w-0 flex-1 text-sm text-teal-900 dark:text-teal-200">
                      {ai.insight}
                    </p>
                    {ai.sentiment && (
                      <Chip color={SENT_CHIP[ai.sentiment] || "gray"}>
                        {ai.sentiment}
                      </Chip>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail table */}
      <Card title="Respuestas individuales (anónimas)">
        {rows.length === 0 ? (
          <p className="text-sm text-gray-500">Todavía no hay respuestas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b border-gray-200 text-left dark:border-navy-700 ${TYPE.th}`}>
                  <th className="py-2 pr-3">#</th>
                  {columns.map((c) => (
                    <th key={c.name} className="py-2 pr-3">
                      {c.label}
                    </th>
                  ))}
                  <th className="py-2 pr-3">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={row.id}
                    className="border-b border-gray-100 align-top dark:border-navy-700"
                  >
                    <td className="py-2 pr-3 text-gray-400">{i + 1}</td>
                    {columns.map((c) => (
                      <td
                        key={c.name}
                        className="py-2 pr-3 text-navy-700 dark:text-gray-100"
                      >
                        {row.byName[c.name] || (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    ))}
                    <td className="py-2 pr-3 text-gray-400">
                      {row.createdAt
                        ? new Date(row.createdAt).toLocaleDateString("es-EC")
                        : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      </div>
    </div>
  );
};

export default Dashboard;
