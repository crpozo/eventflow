import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";

// PDF del "Análisis con IA" del dashboard de encuestas. Módulo separado que se
// importa DINÁMICAMENTE desde el botón (igual que pdf-lib en los gafetes) para
// que @react-pdf/renderer no entre al bundle principal del admin.

const BRAND_RED = "#e41b23"; // único rojo permitido (regla de diseño)
const NAVY = "#1B254B";
const GRAY = "#6b7280";
const GREEN = "#15803d";
const AMBER = "#b45309";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    paddingBottom: 56,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: NAVY,
  },
  headerBar: {
    borderBottomWidth: 2,
    borderBottomColor: BRAND_RED,
    paddingBottom: 10,
    marginBottom: 14,
  },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold" },
  subtitle: { fontSize: 11, color: GRAY, marginTop: 3 },
  metricsRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  metricBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 6,
    padding: 8,
  },
  metricLabel: { fontSize: 8, color: GRAY },
  metricValue: { fontSize: 14, fontFamily: "Helvetica-Bold", marginTop: 2 },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
    marginTop: 12,
  },
  paragraph: { lineHeight: 1.5, color: NAVY },
  sentimentTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#e5e7eb",
    marginTop: 6,
    marginBottom: 4,
  },
  sentimentFill: { height: 8, borderRadius: 4 },
  themeBox: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 6,
    padding: 8,
    marginBottom: 6,
  },
  themeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  themeTitle: { fontFamily: "Helvetica-Bold", fontSize: 10.5 },
  themeTag: { fontSize: 8.5, color: GRAY },
  quote: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Oblique",
    color: GRAY,
    marginTop: 2,
    marginLeft: 8,
  },
  listItem: { flexDirection: "row", marginBottom: 3 },
  bullet: { width: 10 },
  listText: { flex: 1, lineHeight: 1.4 },
  twoCols: { flexDirection: "row", gap: 16 },
  col: { flex: 1 },
  colTitleGreen: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: GREEN,
    marginBottom: 4,
  },
  colTitleRed: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: BRAND_RED,
    marginBottom: 4,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: GRAY,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 6,
  },
});

const sentimentColor = (score) => {
  if (score >= 66) return "#16a34a";
  if (score >= 40) return "#f59e0b";
  return BRAND_RED;
};

// Color del tag de sentimiento de un tema (verde / rojo / ámbar).
const themeTagColor = (sentiment) => {
  if (sentiment === "positivo") return GREEN;
  if (sentiment === "negativo") return BRAND_RED;
  return AMBER;
};

// Normaliza a array (los insights vienen de la IA y pueden traer campos
// ausentes o mal formados).
const asArray = (v) => (Array.isArray(v) ? v : []);

// Claves estables para listas renderizadas: derivadas del contenido con
// `toKey`, numerando los duplicados para conservar la unicidad (evita usar el
// índice del array como key).
const withStableKeys = (items, toKey = String) => {
  const seen = new Map();
  return (items || []).map((item) => {
    const base = String(toKey(item) ?? "");
    const count = seen.get(base) || 0;
    seen.set(base, count + 1);
    return { key: count === 0 ? base : `${base}-${count}`, item };
  });
};

const Bullets = ({ items }) =>
  withStableKeys(items).map(({ key, item }) => (
    <View key={key} style={styles.listItem} wrap={false}>
      <Text style={styles.bullet}>•</Text>
      <Text style={styles.listText}>{String(item)}</Text>
    </View>
  ));

export function AnalysisPdfDoc({
  eventTitle,
  insights,
  insightsAt,
  metrics = {},
}) {
  const score = Math.max(
    0,
    Math.min(100, Number(insights?.overallSentiment?.score) || 0)
  );
  const themes = asArray(insights?.themes);
  const strengths = asArray(insights?.strengths);
  const concerns = asArray(insights?.concerns);
  const recommendations = asArray(insights?.recommendations);
  const generatedAt = insightsAt
    ? new Date(insightsAt).toLocaleString("es-EC")
    : "";

  return (
    <Document
      title={`Análisis con IA — ${eventTitle || "Encuesta"}`}
      author="EventFlow"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBar}>
          <Text style={styles.title}>Análisis con IA</Text>
          <Text style={styles.subtitle}>
            {eventTitle || "Encuesta"}
            {generatedAt ? `  ·  Analizado el ${generatedAt}` : ""}
          </Text>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Respuestas</Text>
            <Text style={styles.metricValue}>
              {metrics.responses ?? "—"}
            </Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Check-ins</Text>
            <Text style={styles.metricValue}>
              {metrics.checkedIn ?? "—"}
            </Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Tasa de respuesta</Text>
            <Text style={styles.metricValue}>
              {metrics.responseRate != null ? `${metrics.responseRate}%` : "—"}
            </Text>
          </View>
        </View>

        {insights?.executiveSummary ? (
          <Text style={styles.paragraph}>{insights.executiveSummary}</Text>
        ) : null}

        {insights?.overallSentiment ? (
          <View wrap={false}>
            <Text style={styles.sectionTitle}>Sentimiento general</Text>
            <View style={styles.sentimentTrack}>
              <View
                style={[
                  styles.sentimentFill,
                  {
                    width: `${score}%`,
                    backgroundColor: sentimentColor(score),
                  },
                ]}
              />
            </View>
            <Text>
              {insights.overallSentiment.label} ({score}/100)
            </Text>
          </View>
        ) : null}

        {themes.length > 0 ? (
          <View>
            <Text style={styles.sectionTitle}>Temas principales</Text>
            {withStableKeys(themes, (t) => t.title).map(({ key, item: t }) => (
              <View key={key} style={styles.themeBox} wrap={false}>
                <View style={styles.themeHeader}>
                  <Text style={styles.themeTitle}>{t.title || "—"}</Text>
                  <Text
                    style={[styles.themeTag, { color: themeTagColor(t.sentiment) }]}
                  >
                    {t.sentiment || ""}
                    {typeof t.mentions === "number" ? ` · ${t.mentions}` : ""}
                  </Text>
                </View>
                {t.summary ? (
                  <Text style={styles.paragraph}>{t.summary}</Text>
                ) : null}
                {withStableKeys(asArray(t.sampleQuotes).slice(0, 3)).map(
                  ({ key: quoteKey, item: q }) => (
                    <Text key={quoteKey} style={styles.quote}>
                      “{String(q)}”
                    </Text>
                  )
                )}
              </View>
            ))}
          </View>
        ) : null}

        {strengths.length > 0 || concerns.length > 0 ? (
          <View style={[styles.twoCols, { marginTop: 12 }]}>
            {strengths.length > 0 ? (
              <View style={styles.col}>
                <Text style={styles.colTitleGreen}>Fortalezas</Text>
                <Bullets items={strengths} />
              </View>
            ) : null}
            {concerns.length > 0 ? (
              <View style={styles.col}>
                <Text style={styles.colTitleRed}>Preocupaciones</Text>
                <Bullets items={concerns} />
              </View>
            ) : null}
          </View>
        ) : null}

        {recommendations.length > 0 ? (
          <View>
            <Text style={styles.sectionTitle}>Recomendaciones accionables</Text>
            <Bullets items={recommendations} />
          </View>
        ) : null}

        <View style={styles.footer} fixed>
          <Text>Generado con EventFlow</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Página ${pageNumber} de ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}

// Genera el blob y dispara la descarga en el navegador. Nombre alineado al
// export de Excel (`${eventTitle}-encuesta.xlsx`).
export async function downloadAnalysisPdf(props) {
  const blob = await pdf(<AnalysisPdfDoc {...props} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${props.eventTitle || "encuesta"}-analisis-ia.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
