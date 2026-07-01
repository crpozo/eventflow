import React from "react";
import { useNavigate } from "react-router-dom";
import { DataStore } from "aws-amplify/datastore";
import { post } from "aws-amplify/api";
import * as XLSX from "xlsx";
import { Survey, SurveyResponse, EventAttendee } from "models";
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

const SENT_COLOR = {
  positivo: "#16a34a",
  neutral: "#6b7280",
  negativo: "#dc2626",
};

const Dashboard = () => {
  const navigate = useNavigate();
  const stored = JSON.parse(localStorage.getItem("EVENTFLOW.event") || "null");
  const eventId = stored?.id;
  const eventTitle = stored?.title || "Evento";

  const [survey, setSurvey] = React.useState(null);
  const [responses, setResponses] = React.useState([]);
  const [checkedIn, setCheckedIn] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [analyzing, setAnalyzing] = React.useState(false);

  React.useEffect(() => {
    if (!eventId) {
      navigate("/admin");
      return;
    }
    // Live survey (so insights refresh after analysis writes them back).
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
    if (!survey?.insights) return null;
    try {
      return typeof survey.insights === "string"
        ? JSON.parse(survey.insights)
        : survey.insights;
    } catch {
      return null;
    }
  }, [survey]);

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
      await body.json().catch(() => ({}));
      // observeQuery on Survey will pick up the written-back insights.
      alert("Análisis completado.");
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

  const card =
    "relative flex flex-col rounded-3xl bg-white bg-clip-border p-5 shadow-card dark:!bg-navy-800 dark:text-white";

  return (
    <div className="campus-page flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-navy-700 dark:text-white">
          Resultados de la encuesta
        </h2>
        <div className="flex gap-2">
          <button
            onClick={analyze}
            disabled={analyzing}
            className="flex items-center gap-1 rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-black disabled:opacity-50"
          >
            {insights ? <MdRefresh /> : <MdAutoAwesome />}
            {analyzing
              ? "Analizando…"
              : insights
              ? "Re-analizar con IA"
              : "Analizar con IA"}
          </button>
          <button
            onClick={exportExcel}
            className="flex items-center gap-1 rounded-xl border border-gray-200 px-4 py-2 text-sm text-navy-700 hover:bg-gray-100 dark:text-white"
          >
            <MdFileDownload /> Exportar Excel
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className={card}>
          <p className="text-sm text-gray-500">Respuestas</p>
          <p className="text-3xl font-bold text-navy-700 dark:text-white">
            {responses.length}
          </p>
        </div>
        <div className={card}>
          <p className="text-sm text-gray-500">Check-ins</p>
          <p className="text-3xl font-bold text-navy-700 dark:text-white">
            {checkedIn}
          </p>
        </div>
        <div className={card}>
          <p className="text-sm text-gray-500">Tasa de respuesta</p>
          <p className="text-3xl font-bold text-navy-700 dark:text-white">
            {responseRate !== null ? `${responseRate}%` : "—"}
          </p>
        </div>
      </div>

      {/* AI insights */}
      {insights ? (
        <div className={card}>
          <div className="mb-3 flex items-center gap-2">
            <MdAutoAwesome className="text-brand-500" />
            <h3 className="text-lg font-bold text-navy-700 dark:text-white">
              Análisis con IA
            </h3>
            {survey?.insightsAt && (
              <span className="text-xs text-gray-400">
                {new Date(survey.insightsAt).toLocaleString("es-EC")}
              </span>
            )}
          </div>

          {insights.executiveSummary && (
            <p className="mb-4 text-[15px] leading-relaxed text-navy-700 dark:text-gray-100">
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
                      <span
                        className="rounded-full px-2 py-0.5 text-xs text-white"
                        style={{
                          background: SENT_COLOR[t.sentiment] || "#6b7280",
                        }}
                      >
                        {t.sentiment}
                        {typeof t.mentions === "number"
                          ? ` · ${t.mentions}`
                          : ""}
                      </span>
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
                  <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-200">
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
                  <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-200">
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
                <p className="mb-1 text-sm font-semibold text-brand-600">
                  Recomendaciones accionables
                </p>
                <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-200">
                  {insights.recommendations.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
        </div>
      ) : (
        <div className={card}>
          <p className="text-sm text-gray-500">
            Aún no hay análisis de IA. Pulsa <b>Analizar con IA</b> para generar un
            resumen ejecutivo, sentimiento, temas y recomendaciones a partir de las{" "}
            {responses.length} respuesta(s).
          </p>
        </div>
      )}

      {/* Detail table */}
      <div className={card}>
        <h3 className="mb-3 text-lg font-bold text-navy-700 dark:text-white">
          Respuestas individuales (anónimas)
        </h3>
        {rows.length === 0 ? (
          <p className="text-sm text-gray-500">Todavía no hay respuestas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500 dark:border-navy-700">
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
      </div>
    </div>
  );
};

export default Dashboard;
