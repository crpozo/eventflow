import React from "react";
import { useNavigate } from "react-router-dom";
import { DataStore } from 'aws-amplify/datastore';
import { Event, EventAttendee, Landing } from "models";
import { MdAdd, MdArrowForward } from "react-icons/md";
import { AiOutlineWarning } from "react-icons/ai";
import { usePermissions } from "../../../providers/PermissionsProvider";
import {
  PageHeader,
  Card,
  Chip,
  PrimaryButton,
  PageLoader,
  TYPE,
} from "components/adminUi";

const DAY_MS = 864e5;

// Los formularios de evento escriben `startDate` (las filas antiguas solo
// traen `date`), así que toda lectura de fecha usa el fallback — misma
// convención que eventos/reportes/landing.
const eventStart = (e) => e.startDate || e.date;

// Fin real del evento: `endDate` cuando existe y es válido, si no el inicio.
// Sin esto, un evento multi-día que ya empezó se contaría como "finalizado" y
// el "próximo" saltaría al siguiente justo el día que más importa.
const eventEndMs = (e) => {
  const end = Date.parse(e.endDate || "");
  return Number.isNaN(end) ? Date.parse(eventStart(e) || "") : end;
};

// Ventana seleccionada: copia del selector y etiqueta de comparación. El
// grano define además cómo se agrupan los puntos del gráfico.
const PERIODS = {
  "30d": { label: "30 días", vsLabel: "vs. mes anterior", grain: "por día" },
  "6m": { label: "6 meses", vsLabel: "vs. semestre anterior", grain: "por mes" },
  "1y": { label: "Año", vsLabel: "vs. año anterior", grain: "por mes" },
};

// gray-600 (#4c4c4c) + dark:text-gray-300 es el ÚNICO par legible del tema
// para texto secundario: este config remapea gray-500 a #adb5bd (~2,1:1 sobre
// blanco) y gray-400 a #a0aec0 (~2,3:1), muy por debajo del 4,5:1 de WCAG AA.
// gray-400/500 se reservan para bordes e iconos decorativos, nunca para texto.
const MUTED = "text-gray-600 dark:text-gray-300";

// Anillo de foco visible para las tarjetas con role="button" (brand-500 es el
// rojo del tema; brand-600 es AZUL y está vetado).
const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-navy-900";

// Activa un control no nativo con Enter/Espacio sin anidar interactivos.
const activateOnKey = (fn) => (ev) => {
  if (ev.key === "Enter" || ev.key === " ") {
    ev.preventDefault();
    fn();
  }
};

// "lun 06/07/26 · 09:00" compacto, en la zona horaria del evento.
const compactDate = (iso, tz) => {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const zone = tz || "America/Guayaquil";
    const date = new Intl.DateTimeFormat("es-EC", {
      weekday: "short", day: "2-digit", month: "2-digit", year: "2-digit", timeZone: zone,
    }).format(d);
    const hour = new Intl.DateTimeFormat("es-EC", {
      hour: "2-digit", minute: "2-digit", hour12: false, timeZone: zone,
    }).format(d);
    return `${date.replace(",", "")} · ${hour}`;
  } catch (e) {
    // Timezone o fecha inválidas: se registra y se muestra vacío.
    console.error("compactDate: ", e);
    return "";
  }
};

// Día natural "YYYY-MM-DD" en la zona del evento (en-CA emite el orden ISO),
// para que los helpers de día coincidan con compactDate y no con la zona del
// navegador.
const dayKey = (d, tz) =>
  new Intl.DateTimeFormat("en-CA", {
    year: "numeric", month: "2-digit", day: "2-digit",
    timeZone: tz || "America/Guayaquil",
  }).format(d);

// "Hoy" / "Mañana" / "En N días" / "En N meses" (días naturales, zona del evento).
const relativeWhen = (iso, tz) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  try {
    const days = Math.round(
      (Date.parse(dayKey(d, tz)) - Date.parse(dayKey(new Date(), tz))) / DAY_MS
    );
    if (days <= 0) return "Hoy";
    if (days === 1) return "Mañana";
    if (days < 60) return `En ${days} días`;
    return `En ${Math.round(days / 30.44)} meses`;
  } catch (e) {
    // Timezone inválida en dayKey: se registra y se muestra vacío.
    console.error("relativeWhen: ", e);
    return "";
  }
};

const monthShort = (d) =>
  new Intl.DateTimeFormat("es-EC", { month: "short" }).format(d).replaceAll(".", "");

// "8 jul" — etiqueta corta para el eje y el texto del pico.
const shortDay = (d) =>
  new Intl.DateTimeFormat("es-EC", { day: "numeric", month: "short" })
    .format(d)
    .replaceAll(".", "");

// Clave de día en la zona del navegador: el eje del gráfico es "mis últimos
// 30 días", no los de la zona de cada evento.
const localDayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

// Dos iniciales significativas del título: se saltan los tokens numéricos y
// las palabras vacías, en mayúsculas. Una sola palabra → sus dos primeras letras.
const STOPWORDS = new Set(["de", "y", "la", "el", "en", "del"]);
const initialsOf = (title) => {
  const words = (title || "")
    .trim()
    .split(/\s+/)
    .filter((w) => w && !/^\d/.test(w) && !STOPWORDS.has(w.toLowerCase()));
  if (words.length === 0) return "EV";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

// Paleta suave y estable del avatar, elegida con un hash barato del id. Cada
// entrada lleva su par oscuro (mismo patrón que CHIP_COLORS de adminUi) y un
// texto con contraste suficiente: gray-500 sobre gray-100 daba ~1,85:1. Sin
// azules: blue-600 es casi idéntico al brand-600 vetado y es ajeno al admin.
const AVATAR_COLORS = [
  "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  "bg-gray-100 text-gray-600 dark:bg-navy-700 dark:text-gray-300",
  "bg-red-100 text-brand-500 dark:bg-red-900/30 dark:text-red-300",
  "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300",
];
const avatarColor = (id) => {
  const s = String(id || "");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.codePointAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
};


// Lectura defensiva del subárea guardada: un valor corrupto o de un formato
// antiguo hace que JSON.parse lance y tumbe el árbol de React (pantalla en
// blanco). El `?.` solo cubría el caso null.
const readSubArea = () => {
  try {
    return JSON.parse(localStorage.getItem("EVENTFLOW.subarea") || "null");
  } catch (e) {
    console.error("subarea inválida en localStorage: ", e);
    return null;
  }
};

/* ── Geometría del gráfico ────────────────────────────────────────────────
   Compartida entre el SVG y las etiquetas del eje: solo así cada etiqueta cae
   sobre su punto. PADX evita que el trazo (strokeWidth 3) y el círculo del
   pico se recorten a la mitad contra los bordes del viewBox. */
const CHART_W = 1000;
const CHART_H = 170;
const CHART_PADX = 10;
const CHART_PADY = 12;
const chartX = (i, n) =>
  n <= 1
    ? CHART_W / 2
    : CHART_PADX + (i / (n - 1)) * (CHART_W - 2 * CHART_PADX);

/* ── Serie de registros ───────────────────────────────────────────────────
   Cada builder devuelve los puntos del periodo y `prev`, el total de la
   ventana anterior de igual longitud, para que el delta y el gráfico cuenten
   la misma historia. */

// 30 puntos diarios en la zona del navegador.
function buildDailySeries(attendees, now) {
  const nowMs = now.getTime();
  const startMs = new Date(
    now.getFullYear(), now.getMonth(), now.getDate() - 29
  ).getTime();
  const byDay = new Map();
  const points = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29 + i);
    const p = { date: d, label: shortDay(d), value: 0 };
    byDay.set(localDayKey(d), p);
    points.push(p);
  }
  let prev = 0;
  attendees.forEach((a) => {
    const t = Date.parse(a.createdAt);
    if (Number.isNaN(t) || t > nowMs) return;
    if (t >= startMs) {
      const p = byDay.get(localDayKey(new Date(t)));
      if (p) p.value += 1;
    } else if (t >= startMs - 30 * DAY_MS) {
      prev += 1;
    }
  });
  return { points, prev };
}

// n meses calendario terminando en el actual.
function buildMonthlySeries(attendees, now, n) {
  const nowMs = now.getTime();
  const byMonth = new Map();
  const points = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const p = { date: d, label: monthShort(d), value: 0 };
    byMonth.set(`${d.getFullYear()}-${d.getMonth()}`, p);
    points.push(p);
  }
  const rangeStart = new Date(now.getFullYear(), now.getMonth() - (n - 1), 1).getTime();
  const prevStart = new Date(now.getFullYear(), now.getMonth() - (2 * n - 1), 1).getTime();
  let prev = 0;
  attendees.forEach((a) => {
    const t = Date.parse(a.createdAt);
    if (Number.isNaN(t) || t > nowMs) return;
    if (t >= rangeStart) {
      const d = new Date(t);
      const p = byMonth.get(`${d.getFullYear()}-${d.getMonth()}`);
      if (p) p.value += 1;
    } else if (t >= prevStart) {
      prev += 1;
    }
  });
  return { points, prev };
}

// Eje: exactamente 5 marcas repartidas por posición fraccionaria (no por un
// paso entero redondeado, que duplicaba la penúltima). Se guarda el índice del
// punto para poder alinear cada etiqueta con su x real y usarlo como key.
const AXIS_TICKS = 5;
function buildAxis(points) {
  const last = points.length - 1;
  const ticks = [];
  for (let k = 0; k < AXIS_TICKS; k++) {
    const i = Math.round((k * last) / (AXIS_TICKS - 1));
    if (ticks[ticks.length - 1]?.i !== i) ticks.push({ i, label: points[i].label });
  }
  return ticks;
}

// Rango del periodo. Se antepone el año del primer punto cuando el rango cruza
// el año: en "Año" el primer mes casi siempre es del año anterior.
function buildRangeLabel(points, period) {
  const first = points[0];
  const last = points[points.length - 1];
  const l0 = period === "30d" ? shortDay(first.date) : first.label;
  const l1 = period === "30d" ? shortDay(last.date) : last.label;
  const y0 = first.date.getFullYear();
  const y1 = last.date.getFullYear();
  return y0 === y1 ? `${l0} – ${l1} ${y1}` : `${l0} ${y0} – ${l1} ${y1}`;
}

// Días finales consecutivos sin ningún registro.
function trailingQuiet(points) {
  let quiet = 0;
  for (let i = points.length - 1; i >= 0 && points[i].value === 0; i--) quiet += 1;
  return quiet;
}

function useRegistrationSeries(attendees, period) {
  return React.useMemo(() => {
    const now = new Date();
    const { points, prev } =
      period === "30d"
        ? buildDailySeries(attendees, now)
        : buildMonthlySeries(attendees, now, period === "6m" ? 6 : 12);

    const total = points.reduce((s, p) => s + p.value, 0);
    const peakIdx = points.reduce(
      (best, p, i) => (p.value > points[best].value ? i : best),
      0
    );

    return {
      points,
      total,
      // null = no hay base comparable (la ventana anterior fue 0).
      delta: prev > 0 ? Math.round(((total - prev) / prev) * 100) : null,
      axis: buildAxis(points),
      peak: points[peakIdx],
      // El aviso de inactividad solo tiene sentido con grano diario.
      quiet: period === "30d" ? trailingQuiet(points) : 0,
      rangeLabel: buildRangeLabel(points, period),
    };
  }, [attendees, period]);
}

// Mensaje bajo el gráfico: el pico y, si aplica, cuánto lleva sin registros.
// La preposición depende del grano ("el 9 jul" vs "en jul 2026"), y en los
// periodos mensuales se añade el año porque dos julios son indistinguibles.
function buildInsight(series, period) {
  if (series.total === 0) return "Sin registros en este periodo.";
  const unidad = series.peak.value === 1 ? "registro" : "registros";
  const cuando =
    period === "30d"
      ? `el ${series.peak.label}`
      : `en ${series.peak.label} ${series.peak.date.getFullYear()}`;
  const base = `Pico: ${series.peak.value} ${unidad} ${cuando}`;
  if (series.quiet >= 2) return `${base} · ${series.quiet} días sin registros nuevos`;
  return base;
}

const chipFor = (landing) => {
  if (landing?.active) return <Chip color="green">Publicado</Chip>;
  if (landing) return <Chip color="gray">Oculto</Chip>;
  return <Chip color="amber">Borrador</Chip>;
};

/* ── Tarjeta de métrica: número grande a la izquierda, etiqueta en dos
   líneas a la derecha. Con `onClick` la tarjeta entera es el control
   (role=button + teclado), así no se anidan interactivos. ───────────── */
function Metric({ value, suffix, label1, label2, arrow, onClick }) {
  const body = (
    <div className="flex items-center justify-between gap-3">
      {/* items-center (no baseline): con baseline la segunda línea de la
          etiqueta cae por debajo del número y el par se ve desplazado. */}
      <div className="flex items-center gap-3">
        <span className={`${TYPE.metricValue} leading-none`}>
          {value}
          {suffix && (
            <span className={`text-lg font-semibold ${MUTED}`}>{suffix}</span>
          )}
        </span>
        {/* text-sm a propósito: son dos líneas junto a un número text-4xl en
            una rejilla de 4 columnas; a text-base la etiqueta desborda. */}
        <span className={`text-sm leading-snug ${MUTED}`}>
          {label1}
          <br />
          {label2}
        </span>
      </div>
      {/* La flecha pasa a negro al pasar el cursor por la tarjeta (group), igual
          que el hover del botón primario. En oscuro va a blanco: el negro
          desaparecería sobre navy. */}
      {arrow && (
        <MdArrowForward className="h-5 w-5 shrink-0 text-brand-500 transition-colors group-hover:text-black dark:group-hover:text-white" />
      )}
    </div>
  );
  if (!onClick) return <Card className="!p-4">{body}</Card>;
  return (
    <Card
      // `group` habilita el group-hover: de la flecha.
      // dark:hover:!bg-navy-700 con important: Card aplica dark:!bg-navy-800,
      // y sin important la declaración base gana siempre (no habría hover).
      className={`group !p-4 cursor-pointer transition hover:bg-gray-50 dark:hover:!bg-navy-700 ${FOCUS_RING}`}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={activateOnKey(onClick)}
    >
      {body}
    </Card>
  );
}

/* ── Área + línea en SVG puro (sin librerías de gráficos, como el resto del
   admin). El color va por currentColor sobre teal-700 / teal-300, así el
   trazo mantiene contraste en oscuro y comparte tono con las píldoras. ── */
function Sparkline({ points, label }) {
  const n = points.length;
  const max = Math.max(...points.map((p) => p.value), 1);
  // Id único por instancia: un id fijo colisionaría si se montan dos gráficos
  // y el degradado se resolvería contra el primero del documento.
  const gradientId = `efChartArea-${React.useId().replaceAll(":", "")}`;
  const yAt = (v) => CHART_PADY + (1 - v / max) * (CHART_H - CHART_PADY * 2);
  const line = points
    .map((p, i) => `${chartX(i, n).toFixed(1)},${yAt(p.value).toFixed(1)}`)
    .join(" ");
  const peak = points.reduce(
    (best, p, i) => (p.value > points[best].value ? i : best),
    0
  );
  // Altura FIJA: con preserveAspectRatio por defecto el alto salía del ancho
  // (viewBox 1000x170 ≈ 330 px en pantalla ancha) y el dashboard no cabía en
  // un viewport. Con "none" el SVG se estira al alto del contenedor; el trazo
  // se salva con non-scaling-stroke y el punto del pico se dibuja como overlay
  // HTML para que no salga ovalado.
  return (
    <div className="relative mt-3 h-28 w-full text-teal-700 dark:text-teal-300 sm:h-32">
      <svg
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        preserveAspectRatio="none"
        className="h-full w-full"
        role="img"
        aria-label={label}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.20" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          points={`${CHART_PADX},${CHART_H} ${line} ${CHART_W - CHART_PADX},${CHART_H}`}
          fill={`url(#${gradientId})`}
        />
        <polyline
          points={line}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {points[peak].value > 0 && (
        <span
          data-testid="chart-peak"
          className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[currentColor]"
          style={{
            left: `${(chartX(peak, n) / CHART_W) * 100}%`,
            top: `${(yAt(points[peak].value) / CHART_H) * 100}%`,
          }}
        />
      )}
    </div>
  );
}

// Las etiquetas se posicionan en absoluto sobre la x real de su punto: con
// `justify-between` se repartían por ancho de texto y no coincidían con la
// curva. Los extremos se anclan hacia dentro para no salirse de la tarjeta.
const anchorFor = (i, n) => {
  if (i === 0) return "translate-x-0";
  if (i === n - 1) return "-translate-x-full";
  return "-translate-x-1/2";
};

function AxisLabels({ axis, count }) {
  return (
    <div className={`relative mt-2 h-4 text-xs ${MUTED}`}>
      {axis.map(({ i, label }) => (
        <span
          key={i}
          className={`absolute top-0 whitespace-nowrap ${anchorFor(i, count)}`}
          style={{ left: `${(chartX(i, count) / CHART_W) * 100}%` }}
        >
          {label}
        </span>
      ))}
    </div>
  );
}

/* ── Selector de periodo: el activo es una píldora negra en claro y BLANCA en
   oscuro (navy-700 sobre navy-900 daba ~1,13:1, invisible, y además los
   inactivos se leían más claros que el activo). ───────────────────────── */
function PeriodSelector({ period, onChange }) {
  return (
    <div
      role="group"
      aria-label="Periodo del gráfico"
      className="flex items-center gap-1 rounded-2xl bg-gray-100 p-1 dark:bg-navy-900"
    >
      {Object.entries(PERIODS).map(([key, p]) => (
        <button
          key={key}
          type="button"
          aria-pressed={period === key}
          onClick={() => onChange(key)}
          className={
            period === key
              ? `rounded-xl bg-black px-3.5 py-1.5 text-sm font-semibold text-white dark:bg-white dark:text-navy-700 ${FOCUS_RING}`
              : `rounded-xl px-3.5 py-1.5 text-sm transition hover:text-navy-700 dark:hover:text-white ${MUTED} ${FOCUS_RING}`
          }
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

// Píldora del delta. Se renderiza SIEMPRE: cuando la ventana anterior fue 0
// (primer mes de uso) antes desaparecía y la cabecera quedaba incompleta.
function DeltaChip({ delta, vsLabel }) {
  if (delta === null) {
    return <Chip color="gray" dot={false}>Sin base previa</Chip>;
  }
  return (
    <Chip color={delta >= 0 ? "green" : "amber"} dot={false}>
      {delta >= 0 ? "+" : "−"}
      {Math.abs(delta)}% {vsLabel}
    </Chip>
  );
}

/* ── Tarjeta grande de registros ──────────────────────────────────────── */
function RegistrationsCard({ series, period, onPeriodChange }) {
  const P = PERIODS[period];
  const insight = buildInsight(series, period);
  return (
    <Card className="!p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={`text-base font-medium ${MUTED}`}>Registros</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className={`${TYPE.metricValue} leading-none`}>
              {series.total}
            </span>
            <DeltaChip delta={series.delta} vsLabel={P.vsLabel} />
          </div>
          <p className={`mt-1.5 text-base ${MUTED}`}>
            {series.rangeLabel} · {P.grain}
          </p>
        </div>

        <PeriodSelector period={period} onChange={onPeriodChange} />
      </div>

      <Sparkline
        points={series.points}
        label={`Registros, ${P.label.toLowerCase()}: ${series.total} en total. ${insight}`}
      />

      <AxisLabels axis={series.axis} count={series.points.length} />

      {/* Verde solo cuando hay pico: un periodo vacío en verde se leería como
          estado positivo. Se usa Chip en vez de rehacer la píldora a mano. */}
      <div className="mt-3">
        <Chip color={series.total === 0 ? "gray" : "green"}>{insight}</Chip>
      </div>
    </Card>
  );
}

/* ── Próximo evento, en una sola fila horizontal ──────────────────────── */
function NextEventCard({ event, landing, count, onOpen }) {
  return (
    <Card className="lg:col-span-2 !p-4">
      <div className="flex flex-wrap items-center gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${avatarColor(
            event.id
          )}`}
        >
          {initialsOf(event.title)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {/* min-w-0 también en el propio elemento truncado: un flex item
                tiene min-width:auto y con nowrap nunca llegaría a truncar. */}
            <p className="min-w-0 truncate text-base font-bold text-navy-700 dark:text-white">
              {event.title}
            </p>
            {chipFor(landing)}
          </div>
          <p className={`mt-0.5 text-base ${MUTED}`}>
            {compactDate(eventStart(event), event.timezone)} · {count} inscritos
          </p>
        </div>
        {/* Esta tarjeta muestra SIEMPRE el evento más próximo, es decir uno que
            todavía no ocurre: un reporte de asistencia o un CSV de check-in no
            tendrían datos que mostrar. La acción útil es abrir el evento. */}
        <PrimaryButton onClick={onOpen}>Ver evento</PrimaryButton>
      </div>
    </Card>
  );
}

/* ── Siguiente paso: estado vacío cuando no hay más eventos próximos ──── */
function NextStepCard({ moreCount, onGo }) {
  const hasMore = moreCount > 0;
  // El icono acompaña al destino: "+" solo cuando la acción es crear.
  const Icon = hasMore ? MdArrowForward : MdAdd;
  return (
    <Card
      className={`!p-4 cursor-pointer transition hover:bg-gray-50 dark:hover:!bg-navy-700 ${FOCUS_RING}`}
      role="button"
      tabIndex={0}
      onClick={onGo}
      onKeyDown={activateOnKey(onGo)}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600 dark:bg-navy-700 dark:text-gray-300">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-base font-bold text-navy-700 dark:text-white">
            {hasMore ? `${moreCount} eventos próximos más` : "Sin más eventos próximos"}
          </p>
          <p className={`mt-0.5 text-base ${MUTED}`}>
            {hasMore
              ? "Revisa el calendario completo."
              : "Programa el siguiente para mantener el ritmo."}
          </p>
        </div>
      </div>
    </Card>
  );
}

const Dashboard = () => {

  const [events, setEvents] = React.useState([]);
  const [attendees, setAttendees] = React.useState([]);
  const [landings, setLandings] = React.useState([]);
  const [period, setPeriod] = React.useState("30d");
  // El loader se mantiene hasta el primer snapshot sincronizado de DataStore:
  // una caché local vacía emite [] antes de que llegue la nube, y eso mostraba
  // un falso "no hay eventos" durante unos segundos al cargar.
  const [synced, setSynced] = React.useState(false);
  const navigate = useNavigate();
  const { loading, isAdmin } = usePermissions();

  React.useEffect(() => {
    if (loading) return;
    // Se muestran los eventos en cuanto llega alguno (caché local); solo se
    // sigue esperando mientras haya cero Y DataStore no confirme la sync.
    const onResults = ({ items, isSynced }) => {
      setEvents(items);
      if (isSynced || items.length) setSynced(true);
    };
    let sub;
    if (isAdmin) {
      sub = DataStore.observeQuery(Event).subscribe(onResults);
    } else {
      const subAreaId = readSubArea()?.id;
      if (!subAreaId) {
        navigate(`/page/campus`, { state: { error: "Escoge un campus, area y subarea para acceder a tus eventos" } });
        return;
      }
      sub = DataStore.observeQuery(Event, (e) => e.careerID.eq(subAreaId)).subscribe(onResults);
    }
    return () => sub?.unsubscribe();
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

  // Inscritos acotados a los eventos visibles (los no-admin solo ven los suyos).
  const scopedAttendees = React.useMemo(() => {
    const ids = new Set(events.map((e) => e.id));
    return attendees.filter((a) => ids.has(a.eventID));
  }, [events, attendees]);

  // Event.Landing resuelve null en este proyecto — se hace la búsqueda inversa.
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

  // El corte usa el FIN del evento: uno en curso sigue siendo "próximo".
  // `dated` son los eventos con fecha parseable — los demás no entran en
  // ninguno de los dos grupos y falsearían el denominador de "finalizados".
  const { upcoming, finished, dated } = React.useMemo(() => {
    const nowMs = Date.now();
    const withDate = events.filter(
      (e) => eventStart(e) && !Number.isNaN(Date.parse(eventStart(e)))
    );
    const up = withDate
      .filter((e) => eventEndMs(e) > nowMs)
      .sort((a, b) => Date.parse(eventStart(a)) - Date.parse(eventStart(b)));
    const fin = withDate.filter((e) => eventEndMs(e) <= nowMs);
    return { upcoming: up, finished: fin, dated: withDate.length };
  }, [events]);

  const series = useRegistrationSeries(scopedAttendees, period);

  // Evento de referencia: el más próximo. Alimenta las métricas 2 y 3 y la
  // tarjeta inferior, así el dashboard cuenta una sola historia.
  const next = upcoming[0] || null;

  const header = (
    <PageHeader
      title="Dashboard"
      subtitle="Resumen general de tus eventos."
      actions={
        <PrimaryButton
          onClick={() => navigate("/admin/eventos/crear")}
          className="flex items-center gap-1"
        >
          <MdAdd className="h-4 w-4" /> Crear evento
        </PrimaryButton>
      }
    />
  );

  if (loading || !synced) {
    return <PageLoader />;
  }

  if (events.length === 0) {
    return (
      <div>
        {header}
        <Card>
          <p className="flex items-center gap-2 text-base text-navy-700 dark:text-white">
            <AiOutlineWarning /> No existen eventos en la base de datos...
          </p>
        </Card>
      </div>
    );
  }

  const nextCount = next ? countByEvent.get(next.id) || 0 : 0;

  // Abre el detalle del evento. Se deja el evento en EVENTFLOW.event porque el
  // sidebar lee de ahí el panel de secciones (mismo contrato que la tabla de
  // /admin/eventos); sin esto el panel mostraría el evento anterior.
  const openEvent = () => {
    if (!next) return;
    localStorage.setItem("EVENTFLOW.event", JSON.stringify(next));
    navigate(`/admin/eventos/${next.id}/detalle/`);
  };

  const goNextStep = () =>
    navigate(upcoming.length > 1 ? "/admin/eventos" : "/admin/eventos/crear");

  return (
    <div>
      {header}

      <div className="flex flex-col gap-3">

        {/* Métricas: valor grande + etiqueta en dos líneas */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            value={events.length}
            label1="Total"
            label2="eventos"
            arrow
            onClick={() => navigate("/admin/eventos")}
          />
          <Metric
            value={upcoming.length}
            label1={upcoming.length === 1 ? "Próximo" : "Próximos"}
            label2={
              next
                ? `${upcoming.length > 1 ? "el más cercano " : ""}${relativeWhen(
                    eventStart(next),
                    next.timezone
                  ).toLocaleLowerCase("es-EC")}`
                : "sin agendar"
            }
          />
          <Metric value={nextCount} label1="Inscritos" label2="al próximo" />
          <Metric
            value={finished.length}
            suffix={`/${dated}`}
            label1="Eventos"
            label2="finalizados"
          />
        </div>

        {/* Registros a lo largo del tiempo */}
        <RegistrationsCard
          series={series}
          period={period}
          onPeriodChange={setPeriod}
        />

        {/* Próximo evento + siguiente paso */}
        <div className="grid gap-3 lg:grid-cols-3">
          {next ? (
            <NextEventCard
              event={next}
              landing={landingByEvent.get(next.id)}
              count={nextCount}
              onOpen={openEvent}
            />
          ) : (
            <Card className="lg:col-span-2 !p-4">
              <p className={`text-base ${MUTED}`}>
                No hay eventos próximos en el calendario.
              </p>
            </Card>
          )}

          <NextStepCard moreCount={upcoming.length - 1} onGo={goNextStep} />
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
