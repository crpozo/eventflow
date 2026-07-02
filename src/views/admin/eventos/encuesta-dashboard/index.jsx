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
    listSurveys(filter: $filter) {
      items {
        id
        insights
        insightsAt
      }
    }
  }
`;

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
    const raw = apiInsights?.insights ?? survey?.insights;
    if (!raw) return null;
    try {
      return typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      return null;
    }
  }, [apiInsights, survey]);

  const insightsAt = apiInsights?.insightsAt ?? survey?.insightsAt;

  // Columns for the detail table, from the survey definition (stable order).
  const columns = React.useMemo(() => {
    const qs = Array.isArray(survey?.questions) ? survey.questions : [];
    return qs
      .filter((q) => q.type !== "header" && q.type !== "paragraph")
      .map((q) => ({ name: q.name, label: stripHtml(q.label) || q.name }));
  }, [survey]);

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

  const responseRate =
    checkedIn > 0 ? Math.round((responses.length / checkedIn) * 100) : null;

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
    return (
      <div className="flex min-h-[60vh] w-full flex-col items-center justify-center">
        <span className="loader"></span>
        <h2 className="mt-2 text-xl text-black dark:text-white">Cargando…</h2>
      </div>
    );
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
            insightsAt ? (
              <span className="text-xs text-gray-400">
                {new Date(insightsAt).toLocaleString("es-EC")}
              </span>
            ) : null
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
                        : "#dc2626",
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
