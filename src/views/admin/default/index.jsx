import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { DataStore } from 'aws-amplify/datastore';
import { Event, EventAttendee, Landing } from "models";
import { MdAdd, MdChevronRight } from "react-icons/md";
import { AiOutlineWarning } from "react-icons/ai";
import { usePermissions } from "../../../providers/PermissionsProvider";
import {
  PageHeader,
  Card,
  Chip,
  PrimaryButton,
  SecondaryButton,
  TYPE,
} from "components/adminUi";

const DAY_MS = 864e5;

// The event forms write `startDate` (legacy rows may only carry `date`), so
// every date read must fall back — same convention as eventos/reportes/landing.
const eventStart = (e) => e.startDate || e.date;

// Selected time window: copy + ms used by the "Registros" metric, its delta
// and the bar chart on the right column.
const PERIODS = {
  "30d": {
    label: "30 días",
    ms: 30 * DAY_MS,
    metricLabel: "Registros · 30 días",
    chartTitle: "Registros por semana",
    rangeLabel: "últimos 30 días",
    vsLabel: "vs. mes anterior",
  },
  "6m": {
    label: "6 meses",
    ms: 183 * DAY_MS,
    metricLabel: "Registros · 6 meses",
    chartTitle: "Registros por mes",
    rangeLabel: "últimos 6 meses",
    vsLabel: "vs. semestre anterior",
  },
  "1y": {
    label: "Año",
    ms: 365 * DAY_MS,
    metricLabel: "Registros · año",
    chartTitle: "Registros por mes",
    rangeLabel: "último año",
    vsLabel: "vs. año anterior",
  },
};

// Light → dark teal ramp; the last bucket is always teal-600.
const TEAL_RAMP = ["bg-teal-100", "bg-teal-200", "bg-teal-400", "bg-teal-600"];
const barColor = (i, n) =>
  i === n - 1 ? "bg-teal-600" : TEAL_RAMP[Math.floor((i / (n - 1)) * (TEAL_RAMP.length - 1))];

// Compact "lun 06/07/26 · 09:00" in the event's timezone.
const compactDate = (iso, tz) => {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    const zone = tz || "America/Guayaquil";
    const date = new Intl.DateTimeFormat("es-EC", {
      weekday: "short", day: "2-digit", month: "2-digit", year: "2-digit", timeZone: zone,
    }).format(d);
    const hour = new Intl.DateTimeFormat("es-EC", {
      hour: "2-digit", minute: "2-digit", hour12: false, timeZone: zone,
    }).format(d);
    return `${date.replace(",", "")} · ${hour}`;
  } catch (e) {
    return "";
  }
};

// Calendar day "YYYY-MM-DD" in the event's timezone (en-CA emits ISO order),
// so day-level helpers agree with compactDate instead of the browser's tz.
const dayKey = (d, tz) =>
  new Intl.DateTimeFormat("en-CA", {
    year: "numeric", month: "2-digit", day: "2-digit",
    timeZone: tz || "America/Guayaquil",
  }).format(d);

// "Hoy" / "Mañana" / "En N días" / "En N meses" (calendar days, event tz).
const relativeWhen = (iso, tz) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  try {
    const days = Math.round(
      (Date.parse(dayKey(d, tz)) - Date.parse(dayKey(new Date(), tz))) / DAY_MS
    );
    if (days <= 0) return "Hoy";
    if (days === 1) return "Mañana";
    if (days < 60) return `En ${days} días`;
    return `En ${Math.round(days / 30.44)} meses`;
  } catch (e) {
    return "";
  }
};

// "06 jul" (event tz, for the same reason as above)
const shortDayMonth = (iso, tz) => {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("es-EC", {
      day: "2-digit", month: "short", timeZone: tz || "America/Guayaquil",
    })
      .format(d)
      .replace(/\./g, "");
  } catch (e) {
    return "";
  }
};

const monthShort = (d) =>
  new Intl.DateTimeFormat("es-EC", { month: "short" }).format(d).replace(/\./g, "");

const slugify = (s) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "evento";

const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

// "↗ +22%" / "↘ -8%" — teal when growing, brand red when shrinking. Dark
// surfaces lighten to *-300 like CHIP_COLORS (brand 50–400 is legacy purple,
// so the dark red comes from the red ramp).
const Delta = ({ pct, suffix = "" }) => (
  <span
    className={`text-sm font-semibold ${
      pct >= 0
        ? "text-teal-600 dark:text-teal-300"
        : "text-brand-500 dark:text-red-300"
    }`}
  >
    {pct >= 0 ? "↗ +" : "↘ "}
    {pct}%{suffix ? ` ${suffix}` : ""}
  </span>
);

const Dashboard = () => {

  const [events, setEvents] = React.useState([]);
  const [attendees, setAttendees] = React.useState([]);
  const [landings, setLandings] = React.useState([]);
  const [period, setPeriod] = React.useState("30d");
  const navigate = useNavigate();
  const { loading, isAdmin } = usePermissions();

  React.useEffect(() => {
    if (loading) return;
    let sub;
    if (isAdmin) {
      sub = DataStore.observeQuery(Event).subscribe((results) => setEvents(results.items));
    } else {
      const subAreaId = JSON.parse(localStorage.getItem("EVENTFLOW.subarea"))?.id;
      if (!subAreaId) {
        navigate(`/page/campus`, { state: { error: "Escoge un campus, area y subarea para acceder a tus eventos" } });
        return;
      }
      sub = DataStore.observeQuery(Event, (e) => e.careerID.eq(subAreaId)).subscribe((results) => setEvents(results.items));
    }
    return () => sub && sub.unsubscribe();
  }, [loading, isAdmin, navigate]);

  React.useEffect(() => {
    const sub = DataStore.observeQuery(EventAttendee).subscribe((results) =>
      setAttendees(results.items)
    );
    return () => sub.unsubscribe();
  }, []);

  React.useEffect(() => {
    const sub = DataStore.observeQuery(Landing).subscribe((results) =>
      setLandings(results.items)
    );
    return () => sub.unsubscribe();
  }, []);

  // Attendees scoped to the visible events (non-admins only see their own).
  const scopedAttendees = React.useMemo(() => {
    const ids = new Set(events.map((e) => e.id));
    return attendees.filter((a) => ids.has(a.eventID));
  }, [events, attendees]);

  // Event.Landing resolves null in this project — reverse lookup instead.
  const landingByEvent = React.useMemo(() => {
    const m = new Map();
    landings.forEach((l) => {
      if (l.landingEventId) m.set(l.landingEventId, l);
    });
    return m;
  }, [landings]);

  const countByEvent = React.useMemo(() => {
    const m = new Map();
    scopedAttendees.forEach((a) => m.set(a.eventID, (m.get(a.eventID) || 0) + 1));
    return m;
  }, [scopedAttendees]);

  const { upcoming, finished } = React.useMemo(() => {
    const nowMs = Date.now();
    const up = events
      .filter((e) => eventStart(e) && new Date(eventStart(e)).getTime() > nowMs)
      .sort((a, b) => new Date(eventStart(a)) - new Date(eventStart(b)));
    const fin = events.filter(
      (e) => eventStart(e) && new Date(eventStart(e)).getTime() <= nowMs
    );
    return { upcoming: up, finished: fin };
  }, [events]);

  // Mini sparkline: events CREATED per calendar month, last 6 months.
  const sparkline = React.useMemo(() => {
    const now = new Date();
    const buckets = [];
    const byMonth = new Map();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const b = { value: 0 };
      byMonth.set(`${d.getFullYear()}-${d.getMonth()}`, b);
      buckets.push(b);
    }
    events.forEach((e) => {
      if (!e.createdAt) return;
      const d = new Date(e.createdAt);
      if (isNaN(d.getTime())) return;
      const b = byMonth.get(`${d.getFullYear()}-${d.getMonth()}`);
      if (b) b.value += 1;
    });
    return buckets.map((b) => b.value);
  }, [events]);

  // Registrations inside the selected window vs. the previous one.
  const regStats = React.useMemo(() => {
    const nowMs = Date.now();
    const w = PERIODS[period].ms;
    let cur = 0;
    let prev = 0;
    scopedAttendees.forEach((a) => {
      const t = Date.parse(a.createdAt);
      if (isNaN(t) || t > nowMs) return;
      if (t >= nowMs - w) cur += 1;
      else if (t >= nowMs - 2 * w) prev += 1;
    });
    return { cur, prev, delta: prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null };
  }, [scopedAttendees, period]);

  // Chart buckets: 4 weeks (S1..S4) for 30d, calendar months for 6m/1y.
  // The delta shown next to "{total} en total" is computed from the SAME
  // window as the buckets (vs. the preceding window of equal length) — the
  // rolling-window regStats.delta belongs to the metric card only.
  const chart = React.useMemo(() => {
    const nowMs = Date.now();
    const pctDelta = (cur, prev) =>
      prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null;
    if (period === "30d") {
      const start = nowMs - 30 * DAY_MS;
      const step = 7.5 * DAY_MS;
      const buckets = [1, 2, 3, 4].map((n) => ({ label: `S${n}`, value: 0 }));
      let prev = 0;
      scopedAttendees.forEach((a) => {
        const t = Date.parse(a.createdAt);
        if (isNaN(t) || t > nowMs) return;
        if (t >= start) buckets[Math.min(3, Math.floor((t - start) / step))].value += 1;
        else if (t >= start - 30 * DAY_MS) prev += 1;
      });
      const total = buckets.reduce((s, b) => s + b.value, 0);
      return { buckets, total, delta: pctDelta(total, prev) };
    }
    const now = new Date();
    const n = period === "6m" ? 6 : 12;
    const buckets = [];
    const byMonth = new Map();
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const b = { label: monthShort(d), value: 0 };
      byMonth.set(`${d.getFullYear()}-${d.getMonth()}`, b);
      buckets.push(b);
    }
    // Previous window = the n calendar months right before the displayed range.
    const rangeStart = new Date(now.getFullYear(), now.getMonth() - (n - 1), 1).getTime();
    const prevStart = new Date(now.getFullYear(), now.getMonth() - (2 * n - 1), 1).getTime();
    let prev = 0;
    scopedAttendees.forEach((a) => {
      const t = Date.parse(a.createdAt);
      if (isNaN(t) || t > nowMs) return;
      if (t >= rangeStart) {
        const d = new Date(t);
        const b = byMonth.get(`${d.getFullYear()}-${d.getMonth()}`);
        if (b) b.value += 1;
      } else if (t >= prevStart) {
        prev += 1;
      }
    });
    const total = buckets.reduce((s, b) => s + b.value, 0);
    return { buckets, total, delta: pctDelta(total, prev) };
  }, [scopedAttendees, period]);

  // Featured event for the dark report card: first upcoming with registrations,
  // otherwise the nearest upcoming one; hidden when there is none.
  const featured = React.useMemo(
    () => upcoming.find((e) => (countByEvent.get(e.id) || 0) > 0) || upcoming[0] || null,
    [upcoming, countByEvent]
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] w-full flex-col items-center justify-center">
        <span className="loader"></span>
        <h2 className="mt-2 text-xl text-black dark:text-white">Cargando…</h2>
      </div>
    );
  }

  const P = PERIODS[period];
  const rows = upcoming.slice(0, 4);
  const sparkMax = Math.max(...sparkline, 0);
  const chartMax = Math.max(...chart.buckets.map((b) => b.value), 0);

  const exportCsv = () => {
    if (!featured) return;
    const list = scopedAttendees.filter((a) => a.eventID === featured.id);
    const lines = [
      ["Email", "Autorizado", "Check-in", "Ticket", "Cantidad", "Fecha de registro"]
        .map(csvCell)
        .join(","),
      ...list.map((a) =>
        [
          a.email,
          a.authorized ? "Sí" : "No",
          a.checkIn ? "Sí" : "No",
          a.ticket || "",
          a.quantity ?? "",
          a.createdAt ? new Date(a.createdAt).toLocaleString("es-EC") : "",
        ]
          .map(csvCell)
          .join(",")
      ),
    ];
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reporte-${slugify(featured.title)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const chipFor = (eventId) => {
    const landing = landingByEvent.get(eventId);
    if (landing?.active) return <Chip color="green">Publicado</Chip>;
    if (landing) return <Chip color="gray">Oculto</Chip>;
    return <Chip color="amber">Borrador</Chip>;
  };

  return (
    <div>
      <PageHeader
        crumbs={[{ label: "Dashboard" }]}
        title="Dashboard"
        subtitle="Resumen general de tus eventos."
        actions={
          <>
            {/* Segmented period control */}
            <div className="flex items-center gap-1 rounded-2xl bg-gray-100 p-1 dark:bg-navy-800">
              {Object.entries(PERIODS).map(([key, p]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPeriod(key)}
                  className={
                    period === key
                      ? "rounded-xl bg-white px-3.5 py-1.5 text-sm font-semibold text-navy-700 shadow dark:bg-navy-700 dark:text-white"
                      : "rounded-xl px-3.5 py-1.5 text-sm text-gray-500 transition hover:text-navy-700 dark:hover:text-white"
                  }
                >
                  {p.label}
                </button>
              ))}
            </div>
            <PrimaryButton
              onClick={() => navigate("/admin/eventos/crear")}
              className="flex items-center gap-1"
            >
              <MdAdd className="h-4 w-4" /> Crear evento
            </PrimaryButton>
          </>
        }
      />

      {events.length !== 0 ? (
        // Compact by design: the whole dashboard must fit ONE viewport.
        <div className="flex flex-col gap-4">

          {/* Metrics */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card
              className="!p-4 cursor-pointer transition hover:shadow-xl"
              role="button"
              tabIndex={0}
              onClick={() => navigate("/admin/eventos")}
              onKeyDown={(ev) => {
                if (ev.key === "Enter" || ev.key === " ") {
                  ev.preventDefault();
                  navigate("/admin/eventos");
                }
              }}
            >
              <p className={TYPE.metricLabel}>Total eventos</p>
              <div className="mt-1 flex items-end justify-between gap-2">
                <p className={`${TYPE.metricValue} leading-tight`}>{events.length}</p>
                <div className="flex h-10 items-end gap-1">
                  {sparkline.map((v, i) => (
                    <div
                      key={i}
                      className={`w-1.5 rounded-sm ${
                        i === sparkline.length - 1
                          ? "bg-brand-500"
                          : "bg-gray-200 dark:bg-navy-700"
                      }`}
                      style={{
                        height: `${sparkMax > 0 ? Math.max(4, Math.round((v / sparkMax) * 40)) : 4}px`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </Card>

            <Card className="!p-4">
              <p className={TYPE.metricLabel}>Próximos</p>
              <div className="mt-1 flex items-end justify-between gap-2">
                <p className={`${TYPE.metricValue} leading-tight`}>{upcoming.length}</p>
                {upcoming.length > 0 && (
                  <p className="text-sm text-gray-500">
                    sig. {shortDayMonth(eventStart(upcoming[0]), upcoming[0].timezone)}
                  </p>
                )}
              </div>
            </Card>

            <Card className="!p-4">
              <p className={TYPE.metricLabel}>{P.metricLabel}</p>
              <div className="mt-1 flex items-end justify-between gap-2">
                <p className={`${TYPE.metricValue} leading-tight`}>{regStats.cur}</p>
                {regStats.delta !== null && <Delta pct={regStats.delta} />}
              </div>
            </Card>

            <Card className="!p-4">
              <p className={TYPE.metricLabel}>Finalizados</p>
              <div className="mt-1 flex items-end justify-between gap-2">
                <p className={`${TYPE.metricValue} leading-tight`}>{finished.length}</p>
                {events.length > 0 && (
                  <p className="text-sm text-gray-500">
                    {Math.round((finished.length / events.length) * 100)}% del total
                  </p>
                )}
              </div>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            {/* Upcoming events table */}
            <Card
              title="Próximos eventos"
              className="xl:col-span-2 !p-4"
              headerRight={
                <Link
                  to="/admin/eventos"
                  className="flex items-center text-sm font-bold text-brand-500 transition hover:text-black hover:no-underline dark:hover:text-white"
                >
                  Ver todos ({events.length})
                  <MdChevronRight className="h-4 w-4" />
                </Link>
              }
            >
              {upcoming.length === 0 ? (
                <p className="text-base text-gray-400">
                  No hay eventos próximos en el calendario.
                </p>
              ) : (
                <>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-white/10">
                        <th className={`${TYPE.th} pb-2 pr-4 text-left`}>Evento</th>
                        <th className={`${TYPE.th} pb-2 pr-4 text-left`}>Fecha</th>
                        <th className={`${TYPE.th} pb-2 pr-4 text-left`}>Estado</th>
                        <th className={`${TYPE.th} pb-2 text-right`}>Inscritos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((e, i) => {
                        const count = countByEvent.get(e.id) || 0;
                        return (
                          <tr
                            key={e.id}
                            onClick={() => navigate(`/admin/eventos/${e.id}/detalle/`)}
                            className={`cursor-pointer transition hover:bg-gray-50 dark:hover:bg-navy-700 ${
                              i < rows.length - 1
                                ? "border-b border-gray-100 dark:border-white/10"
                                : ""
                            }`}
                          >
                            <td className="w-full max-w-0 py-2.5 pr-4">
                              <p className="truncate text-base font-bold text-navy-700 dark:text-white">
                                {e.title}
                              </p>
                              <p className="mt-0.5 text-sm text-gray-500">
                                {relativeWhen(eventStart(e), e.timezone)}
                              </p>
                            </td>
                            <td className={`${TYPE.td} whitespace-nowrap py-2.5 pr-4`}>
                              {compactDate(eventStart(e), e.timezone)}
                            </td>
                            <td className="py-2.5 pr-4">{chipFor(e.id)}</td>
                            <td className="whitespace-nowrap py-2.5 text-right">
                              <span className="inline-flex items-center gap-1">
                                {count > 0 ? (
                                  <span className="text-base font-bold text-navy-700 dark:text-white">
                                    {count}
                                  </span>
                                ) : (
                                  <span className="text-base text-gray-400">—</span>
                                )}
                                <MdChevronRight className="h-4 w-4 text-gray-300" />
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <p className="mt-3 text-sm text-gray-500">
                    Mostrando {rows.length} de {upcoming.length} próximos · los
                    finalizados están en{" "}
                    <Link
                      to="/admin/eventos"
                      className="font-bold text-brand-500 hover:text-black hover:no-underline dark:hover:text-white"
                    >
                      Todos mis eventos
                    </Link>
                  </p>
                </>
              )}
            </Card>

            {/* Right column */}
            <div className="flex flex-col gap-4">
              {/* Registrations bar chart — divs only, no chart libs */}
              <Card
                title={P.chartTitle}
                className="!p-4"
                headerRight={
                  <span className="text-xs text-gray-400">{P.rangeLabel}</span>
                }
              >
                <p className="-mt-1 mb-3 text-sm text-gray-500">
                  {chart.total} en total
                  {chart.delta !== null && (
                    <>
                      {" · "}
                      <span
                        className={`font-semibold ${
                          chart.delta >= 0
                            ? "text-teal-600 dark:text-teal-300"
                            : "text-brand-500 dark:text-red-300"
                        }`}
                      >
                        {chart.delta >= 0
                          ? `+${chart.delta}%`
                          : `↘ ${chart.delta}%`}{" "}
                        {P.vsLabel}
                      </span>
                    </>
                  )}
                </p>
                <div className="flex h-28 items-end justify-between gap-2">
                  {chart.buckets.map((b, i) => {
                    const isLast = i === chart.buckets.length - 1;
                    return (
                      <div
                        key={i}
                        className="flex h-full flex-1 flex-col items-center justify-end gap-1"
                      >
                        <span
                          className={`text-xs ${
                            isLast
                              ? "font-bold text-navy-700 dark:text-white"
                              : "text-gray-400"
                          }`}
                        >
                          {b.value}
                        </span>
                        <div
                          className={`w-full rounded-md ${barColor(i, chart.buckets.length)}`}
                          style={{
                            height: `${chartMax > 0 ? Math.max(6, Math.round((b.value / chartMax) * 60)) : 6}px`,
                          }}
                        />
                        {/* Always text-xs (no ad-hoc sizes per the adminUi
                            standard); the 12 labels of "1y" alternate instead
                            of shrinking — odd indexes keep the last visible. */}
                        <span
                          className={`text-xs ${
                            isLast
                              ? "font-semibold text-navy-700 dark:text-white"
                              : "text-gray-400"
                          }`}
                        >
                          {period === "1y" && i % 2 === 0 ? "\u00A0" : b.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Report card for the featured upcoming event — white like the
                  rest (the navy version stole too much attention). */}
              {featured && (
                <Card className="!p-4">
                  <h3 className="line-clamp-1 text-lg font-bold text-navy-700 dark:text-white">
                    Reporte del {featured.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {countByEvent.get(featured.id) || 0} inscritos hasta hoy. Exporta
                    la lista para logística y check-in.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <PrimaryButton onClick={() => navigate("/admin/reportes")}>
                      Ver reporte
                    </PrimaryButton>
                    <SecondaryButton onClick={exportCsv}>
                      Exportar CSV
                    </SecondaryButton>
                  </div>
                </Card>
              )}
            </div>
          </div>

        </div>
      ) : (
        <Card>
          <p className="flex items-center gap-2 text-base text-navy-700 dark:text-white">
            <AiOutlineWarning /> No existen eventos en la base de datos...
          </p>
        </Card>
      )}

    </div>
  );
};

export default Dashboard;
