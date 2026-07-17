import React, { useEffect, useMemo, useState } from "react";
import { graphic } from "echarts";
import { useNavigate } from "react-router-dom";
import { DataStore } from 'aws-amplify/datastore';
import {
  Campus,
  Area,
  Career,
  Event,
  EventAttendee,
  Form,
  Landing,
} from "models";
import * as XLSX from "xlsx";
import {
  MdFileDownload,
  MdPeople,
  MdCheckCircleOutline,
  MdSearch,
  MdFilterList,
  MdClose,
  MdLocationOn,
  MdOutlineCalendarMonth,
  MdSearchOff,
  MdArrowBack,
  MdInsertChartOutlined,
} from "react-icons/md";
import PieChartApache from "views/admin/reportes/components/PieChartApache";
import { usePermissions } from "../../../providers/PermissionsProvider"
import {
  PageHeader,
  Card,
  TextInput,
  PrimaryButton,
  SecondaryButton,
  Chip,
  TYPE,
} from "components/adminUi";


/* ── Donut: pure-SVG progress ring (no chart lib) ─────────────────────────
   value 0..100 → progress arc in brand-500 over a gray track. The % renders
   centered. Used both in the aggregate "Tasa de check-in" metric (~64px) and
   on each event card (~44px). */
function Donut({ value = 0, size = 44, stroke = 5, className = "" }) {
  const pct = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct / 100);
  const center = size / 2;
  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={stroke}
        />
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="#e41b23"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>
      <span
        className={`absolute font-bold text-navy-700 dark:text-white ${
          size >= 56 ? "text-sm" : "text-xs"
        }`}
      >
        {pct}%
      </span>
    </div>
  );
}


/* ── OptionBars: horizontal div-bars for option questions ─────────────────
   Adapted from views/admin/eventos/encuesta-dashboard (OptionBars). Bar width
   scales against the most-voted option; the % reads against total answers. No
   chart lib — plain divs (track gray-100, fill teal-500). */
function OptionBars({ rows, total }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="mt-3 flex flex-col gap-2">
      {rows.map((r) => {
        const pct = total > 0 ? Math.round((r.count / total) * 100) : 0;
        return (
          <div key={r.key || r.label} className="flex items-center gap-3">
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

// Human labels for formBuilder field types (chips in "Resultados del evento").
const FIELD_TYPE_LABELS = {
  "radio-group": "Opción única",
  select: "Lista desplegable",
  "checkbox-group": "Selección múltiple",
  number: "Número",
};

/* ── Helpers puros (a nivel de módulo para evitar anidamiento profundo y
   re-creación en cada render) ─────────────────────────────────────────── */

// Strip HTML tags from strings (form labels sometimes contain markup).
// `[^<>]*` (en vez de `[^>]*`) evita el backtracking super-lineal ante
// cadenas con muchos `<` sin cerrar; para etiquetas bien formadas el
// resultado es idéntico.
const stripHtml = (html) => {
  if (!html || typeof html !== 'string') return html;
  return html.replace(/<[^<>]*>/g, '').trim();
};

// Updater para selects dependientes: conserva la selección previa solo si
// sigue presente en la lista; si no, la limpia (nunca auto-selecciona).
const keepSelectionIfValid = (list) => (prev) =>
  list.some((item) => item.id === prev) ? prev : "";

// Cruza el check-in por email: busca el asistente cuyo email coincide con el
// campo "Email" del formulario. Si no encuentra al asistente, asigna false
// por defecto.
const checkInForUser = (eventAttendees, user) => {
  const email = user.find((field) => field.Campo === "Email").Valor;
  const attendee = eventAttendees.find((att) => att.email === email);
  return attendee ? attendee.checkIn : false;
};

// Excel data flatten handler (no captura nada del componente: solo usa
// stripHtml y sus argumentos, por eso vive a nivel de módulo).
function flattenData(data) {
  const flattenedData = [];

  data.forEach((array) => {

    // We remove header and paragraph from array
    let filteredArray = array.filter(item => {
      let type = item.type;
      return type !== "header" && type !== "paragraph";
    });

    const flatArray = filteredArray.map((item) => {
      const flatItem = {
        Tipo: item.type,
        Campo: stripHtml(item.label),
        Valor: item.userData[0],
      };

      return flatItem;
    });

    flattenedData.push(flatArray);
  });

  return flattenedData;
}

// ¿Pasa el evento los filtros de campus/área/subárea activos?
const passesTaxonomyFilters = (
  ev,
  { campusSelectID, areaSelectID, careerSelectID, careerById, areaById }
) => {
  // Campus filter (always active: default = first visible campus).
  if (campusSelectID) {
    const career = careerById.get(ev.careerID);
    const area = career ? areaById.get(career.areaID) : undefined;
    if (area?.campusID !== campusSelectID) return false;
  }
  // Área filter (only when a real area is selected).
  if (areaSelectID && areaSelectID !== "empty-area") {
    const career = careerById.get(ev.careerID);
    if (career?.areaID !== areaSelectID) return false;
  }
  // Subárea filter (only when a real career is selected): pasa cuando no hay
  // subárea real seleccionada o el evento pertenece a ella.
  return (
    !careerSelectID ||
    careerSelectID === "empty-career" ||
    ev.careerID === careerSelectID
  );
};

// Opciones base de echarts para una pregunta mapeada a pie-chart en el Form.
const buildPieChartOptions = (label) => ({
  title: {
    text: `${stripHtml(label)}`,
    subtext: "Real Time Data",
    left: "center",
    textStyle: {
      fontSize: 23,
    },
    subtextStyle: {
      fontSize: 14,
    },
  },
  color: ["#4E79A7", "#F28E2B", "#E15759", "#76B7B2", "#59A14F"],
  tooltip: {
    trigger: "item",
  },
  series: [
    {
      name: stripHtml(label),
      type: "pie",
      radius: "50%",
      data: [], // This will be populated with userData and count
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: "rgba(0, 0, 0, 0.5)",
        },
      },
    },
  ],
});

// Opciones base de echarts para una pregunta mapeada a bar-chart en el Form.
const buildBarChartOptions = (label) => ({
  xAxis: {
    type: "category",
    data: [], // Initialize with an empty array
  },
  yAxis: {
    type: "value",
  },
  title: {
    text: `${stripHtml(label)}`,
    subtext: "Real Time Data",
    left: "center",
    textStyle: {
      fontSize: 23,
    },
    subtextStyle: {
      fontSize: 14,
    },
  },
  color: new graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: "#F28E2B" },  // Rojo oscuro
    { offset: 1, color: "#59A14F" } // Rojo más claro
  ]),
  tooltip: {
    trigger: "item",
  },
  legend: {
    orient: "horizontal",
    top: "bottom",
    textStyle: {
      fontSize: 14,
    },
  },
  series: [
    {
      type: "bar",
      showBackground: true,
      data: [], // This will be populated with userData and count
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: "rgba(0, 0, 0, 0.5)",
        },
      },
    },
  ],
});

// Solo estos tipos de chart del Form se grafican; cualquier otro className
// ("no-chart", "default-chart"…) se ignora.
const CHART_OPTION_BUILDERS = {
  "pie-chart": buildPieChartOptions,
  "bar-chart": buildBarChartOptions,
};

// Copia la pregunta agregando el className definido en el Form cuando hay
// match por nombre; si no hay match, la devuelve sin cambios.
const applyFormClassName = (question, formData) => {
  const matchingFormQuestion = formData.find((formQuestion) =>
    formQuestion.name.includes(question.name)
  );
  return matchingFormQuestion
    ? { ...question, className: matchingFormQuestion.className }
    : question;
};

// Acumula la respuesta de UNA pregunta graficable dentro de groupedData. Solo
// grafica tipos con builder resuelto (pie/bar): cubre "no-chart" y también
// selects sin mapeo de chart — p. ej. el cert_enviar inyectado (className
// form-control → "default-chart"), que antes llegaba aquí con options
// undefined y reventaba en options.series[0] tumbando TODOS los gráficos
// del evento.
const accumulateQuestionAnswer = (groupedData, question, isLastEventItem) => {
  if (question.type !== "number" && question.type !== "select") return;
  const label = question.label;
  if (!question.userData) return;
  const userData = question.userData[0]; // Assuming there's only one value in userData
  // Anclado con ^ para evitar backtracking super-lineal; con `.*` greedy el
  // resultado es idéntico al patrón sin anclar.
  const match = question.className.match(/^(.*)-chart/);
  const type = (match ? match[1] : "default") + "-chart";
  const buildOptions = CHART_OPTION_BUILDERS[type];
  if (!buildOptions) return;

  // Check if an entry with the same label already exists in groupedData
  if (!groupedData[label]) {
    // If it doesn't exist, create a new entry with options and userData
    groupedData[label] = {
      title: stripHtml(label),
      type: type,
      options: buildOptions(label),
      userDataCounts: {}, // Object to store userData counts
    };
  }

  // Populate the chart data for the specific question
  const entry = groupedData[label];
  const chartData = entry.options.series[0].data;
  const userDataCounts = entry.userDataCounts;
  let barChartXaxisData;
  if (type === "bar-chart") {
    barChartXaxisData = entry.options?.xAxis?.data;
  }
  if (userDataCounts[userData]) {
    userDataCounts[userData]++;
    if (isLastEventItem) {
      const keys = Object.keys(userDataCounts);
      entry.options.series[0].data = keys.map((key) => ({
        name: key,
        value: userDataCounts[key],
      }));
    }
  } else {
    if (barChartXaxisData) {
      barChartXaxisData.push(userData);
    }
    userDataCounts[userData] = 1;
    chartData.push({
      name: userData,
      value: 1,
    });
  }
};

// Chart data handler: agrupa las respuestas por pregunta y produce las
// opciones de echarts listas para renderizar.
function groupEventData(eventData, formData) {
  const groupedData = {};

  const updatedArray = eventData.map((questions) =>
    questions.map((question) => applyFormClassName(question, formData))
  );

  if (updatedArray && updatedArray.length > 0) {
    // Iterate through each event item
    updatedArray.forEach((eventItem, index) => {
      eventItem.forEach((question) => {
        accumulateQuestionAnswer(
          groupedData,
          question,
          index === eventData.length - 1
        );
      });
    });
  }

  // Convert the groupedData object to an array
  return Object.values(groupedData);
}

// Preguntas del Form reducidas a {className, name} para el match de charts,
// descartando campos informativos o incompletos.
const extractFormQuestionMeta = (questions) =>
  questions
    .map((obj) => ({
      className: obj.className,
      name: obj.name,
    }))
    .filter((item) => {
      let type = item.type;
      return (
        type !== "header" &&
        type !== "paragraph" &&
        Object.values(item).every((value) => value !== undefined)
      );
    });

// Respuestas de asistentes sin campos informativos (header/paragraph).
const removeInformativeFields = (attendeesAnswers) => {
  const cleaned = [];
  attendeesAnswers.forEach((arrayInterno) => {
    cleaned.push(
      arrayInterno.filter(
        (elemento) =>
          elemento.type !== "header" && elemento.type !== "paragraph"
      )
    );
  });
  return cleaned;
};

// Tipos de pregunta graficables en las distribuciones derivadas.
const GRAPHABLE_FIELD_TYPES = new Set([
  "radio-group",
  "select",
  "checkbox-group",
  "number",
]);

// Deriva distribuciones por pregunta a partir de `attendees` (cada elemento es
// el formAnswers de UN asistente: campos {name,type,label,userData,values?}).
// A diferencia de chartsData (que solo existe cuando el Form definió
// classNames pie-/bar-chart), esto SIEMPRE produce barras para las preguntas
// de opción presentes en los datos.
//
// Shape: [{ name, label, type, rows:[{key,label,count}], total, nums? }]
//  - tipos de opción (radio-group/select/checkbox-group): rows + total
//  - number: nums (valores finitos) para Promedio/Mín/Máx
const buildQuestionStats = (attendees, chartedLabels) => {
  if (!Array.isArray(attendees) || attendees.length === 0) return [];

  // 1) Canonical question list = union of graphable fields across attendees,
  //    keyed by name (fallback label). First field seen wins its meta
  //    (type/label/values), matching how the Form defined the question.
  const order = [];
  const byKey = new Map();
  attendees.forEach((ans) => {
    (Array.isArray(ans) ? ans : []).forEach((f) => {
      if (!f || f.type === "header" || f.type === "paragraph") return;
      if (!GRAPHABLE_FIELD_TYPES.has(f.type)) return;
      const key = f.name || f.label;
      if (!key) return;
      if (!byKey.has(key)) {
        byKey.set(key, {
          name: f.name || key,
          label: f.label,
          type: f.type,
          values: Array.isArray(f.values) ? f.values : null,
          perResponse: [],
        });
        order.push(key);
      }
    });
  });

  if (order.length === 0) return [];

  // 2) Collect userData per attendee for each question (blank answers skip).
  attendees.forEach((ans) => {
    (Array.isArray(ans) ? ans : []).forEach((f) => {
      if (!f) return;
      const key = f.name || f.label;
      const entry = byKey.get(key);
      if (!entry) return;
      const ud = Array.isArray(f.userData)
        ? f.userData.map((v) => String(v ?? "").trim()).filter(Boolean)
        : [];
      if (ud.length > 0) entry.perResponse.push(ud);
    });
  });

  // 3) Build the render-ready stats, skipping questions already shown as
  //    echarts (dedupe by stripped label) to avoid duplicate graphs.
  return order
    .map((key) => byKey.get(key))
    .filter((e) => !chartedLabels.has(stripHtml(e.label)))
    .map((e) => {
      const total = e.perResponse.length;
      if (e.type === "number") {
        const nums = e.perResponse
          .flat()
          .map(Number)
          .filter((n) => Number.isFinite(n));
        return { ...e, total: nums.length, nums };
      }
      // Option types: count each option once per response (checkbox-group
      // userData can carry several values; duplicates still count once).
      const counts = new Map();
      e.perResponse.forEach((ud) => {
        new Set(ud).forEach((v) => counts.set(v, (counts.get(v) || 0) + 1));
      });
      // Map stored VALUE → its label via the field's `values`; unknown values
      // render raw and are appended after the defined options.
      const defined = Array.isArray(e.values) ? e.values : [];
      const rows = defined.map((o) => ({
        key: `opt-${String(o.value)}`,
        label: stripHtml(o.label) || String(o.value),
        count: counts.get(String(o.value)) || 0,
      }));
      const known = new Set(defined.map((o) => String(o.value)));
      [...counts.keys()]
        .filter((v) => !known.has(v))
        .forEach((v) =>
          rows.push({ key: `extra-${v}`, label: v, count: counts.get(v) })
        );
      return { ...e, rows, total };
    })
    .filter((e) => (e.type === "number" ? true : e.rows.length > 0));
};

/* ── QuestionDistribution: cuerpo de una card de "Resultados del evento" ──
   Para preguntas numéricas muestra Promedio/Mín/Máx (o el aviso vacío);
   para preguntas de opción, las barras de OptionBars. */
function QuestionDistribution({ stat }) {
  if (stat.type !== "number") {
    return <OptionBars rows={stat.rows} total={stat.total} />;
  }
  if (stat.nums.length === 0) {
    return (
      <p className="mt-3 text-sm text-gray-500">Sin valores numéricos.</p>
    );
  }
  const summary = [
    ["Promedio", stat.nums.reduce((a, b) => a + b, 0) / stat.nums.length],
    ["Mín", Math.min(...stat.nums)],
    ["Máx", Math.max(...stat.nums)],
  ];
  return (
    <div className="mt-3 flex gap-8">
      {summary.map(([label, value]) => (
        <div key={label}>
          <p className="text-xs text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-navy-700 dark:text-white">
            {Number.isInteger(value) ? String(value) : value.toFixed(1)}
          </p>
        </div>
      ))}
    </div>
  );
}

const Reportes = () => {

  /*******************************************/
  /************** INIT VARIABLES *************/
  /*******************************************/

  const [campusList, setCampusList] = useState(null);
  const [campusSelectID, setCampusSelectID] = useState("");
  const [areaList, setAreaList] = useState(null);
  const [areaSelectID, setAreaSelectID] = useState(null);
  const [careerList, setCareerList] = useState(null);
  const [careerSelectID, setCareerSelectID] = useState(null);
  const [eventList, setEventList] = useState(null);
  const [eventSelectID, setEventSelectID] = useState(null);
  const [attendees, setAttendees] = useState(null);
  const [eventAttendes, setEventAttendes] = useState(null);
  const [chartsData, setChartsData] = useState([]);

  // --- ADD: grid data (all visible events + aggregated counts + landings + name maps)
  const [allEvents, setAllEvents] = useState([]);
  const [countByEventMap, setCountByEventMap] = useState(new Map()); // id -> {registros, checkIn}
  const [landingByEvent, setLandingByEvent] = useState(new Map()); // landingEventId -> landing
  const [careerById, setCareerById] = useState(new Map()); // id -> {title, areaID}
  const [areaById, setAreaById] = useState(new Map()); // id -> {title, campusID}
  const [campusById, setCampusById] = useState(new Map()); // id -> title

  // --- ADD: UI state (search + collapsible filter panel)
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const {
    isAdmin,
    isReportesOnly,
    loading: permLoading,
    eventIDsAllowed,
    canSeeCampus,
    canSeeArea,
    canSeeEvent,
  } = usePermissions();
  // Scope a list of events to what this user may see (admin / no-restriction ->
  // all). Used so a Reportes (or managed) user only sees their granted events.
  const scopeEvents = (list) =>
    !Array.isArray(list) ? list : list.filter((e) => canSeeEvent(e.id));

  // --- ADD: date filters state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // --- ADD: ISO helpers (end of day for endDate)
  const toStartISO = (d) => (d ? new Date(`${d}T00:00:00`).toISOString() : "");
  const toEndISO = (d) => (d ? new Date(`${d}T23:59:59`).toISOString() : "");

  const getEventDateISO = (ev) => {
    const raw =
      ev.startDate ||
      ev.date ||
      ev.start_at ||
      ev.start ||
      ev.createdAt ||
      null;
    if (!raw) return null;

    try {
      // Already ISO (AWSDateTime) or AWSDate (YYYY-MM-DD)
      if (typeof raw === "string" && (raw.includes("T") || /^\d{4}-\d{2}-\d{2}$/.test(raw))) {
        return raw;
      }
      const d = new Date(raw);
      return Number.isNaN(d.getTime()) ? null : d.toISOString();
    } catch {
      return null;
    }
  };

  const subAreaId = JSON.parse(localStorage.getItem("EVENTFLOW.subarea"))?.id;

  const navigate = useNavigate();
  // Nota: los totales por evento y las opciones legacy de echarts
  // (totalCheckIn/totalRegistros/optionTipo/optionCargos/optionEdad) se
  // eliminaron: el rediseño muestra métricas agregadas (aggregate) y nadie
  // leía esos estados.

  /*******************************************/
  /************ FILTERS * GET DATA ***********/
  /*******************************************/

  // Get campus results as observeQueryr
  useEffect(() => {
    if (permLoading) return;

    // Allow access for: Admin, Reportes role, or users with subAreaId
    if (!isAdmin && !isReportesOnly && !subAreaId) {
      navigate("/page/campus");
      return;
    }

    const subscription = DataStore.observeQuery(Campus).subscribe((results) => {
      // Only campuses this user is allowed to see (admin -> all).
      const visible = results.items.filter((c) => canSeeCampus(c.id));
      if (visible.length > 0) {
        setCampusList(visible);
        setCampusSelectID(visible[0].id);
      }
    });

    return () => subscription.unsubscribe();
  }, [permLoading, isAdmin, isReportesOnly, subAreaId, navigate]);

  // Get areas for selected campus, filtered by date range (drives downstream filters)
  useEffect(() => {
    let alive = true;
    if (!campusSelectID) return;

    DataStore.query(Area, (a) => a.campusID.eq(campusSelectID)).then(async (allAreas) => {
      if (!alive) return;
      // Only areas this user is allowed to see (admin -> all).
      const areas = allAreas.filter((a) => canSeeArea(a.id));

      if (!areas.length) {
        // Reset everything if no areas
        setAreaList([{ id: "empty-area", title: "Vacío" }]); setAreaSelectID("");
        setCareerList([{ id: "empty-career", title: "Vacío" }]); setCareerSelectID("");
        setEventList([{ id: "empty-event", title: "Vacío" }]); setEventSelectID("");
        return;
      }

      // If no date filters, just publish the list. Do NOT auto-select an area:
      // the grid must show ALL campus events by default and the Área/Subárea
      // filters (and their chips) only apply when the user actively picks one.
      if (!startDate && !endDate) {
        setAreaList(areas);
        return;
      }

      // Date range filtering
      const areaIDs = new Set(areas.map((a) => a.id));
      const allCareers = await DataStore.query(Career);
      if (!alive) return;

      const careers = allCareers.filter((c) => areaIDs.has(c.areaID));
      const careerByIdLocal = new Map(careers.map((c) => [c.id, c]));
      const careerIDs = new Set(careers.map((c) => c.id));

      const allEventsLocal = await DataStore.query(Event);
      if (!alive) return;

      const startISO = toStartISO(startDate);
      const endISO = toEndISO(endDate);

      const inRange = allEventsLocal.filter((ev) => {
        if (!careerIDs.has(ev.careerID)) return false;
        const iso = getEventDateISO(ev);
        if (!iso) return false;
        const after = startISO ? iso >= startISO : true;
        const before = endISO ? iso <= endISO : true;
        return after && before;
      });

      const areasWithEvents = new Set(
        inRange
          .map((ev) => careerByIdLocal.get(ev.careerID)?.areaID)
          .filter(Boolean)
      );

      const filteredAreas = areas.filter((a) => areasWithEvents.has(a.id));

      if (filteredAreas.length) {
        setAreaList(filteredAreas);
        // Keep the user's area selection only if it's still valid; never
        // auto-select one (default = no Área filter → all campus events).
        setAreaSelectID(keepSelectionIfValid(filteredAreas));
      } else {
        setAreaList([{ id: "empty-area", title: "Vacío" }]); setAreaSelectID("");
        setCareerList([{ id: "empty-career", title: "Vacío" }]); setCareerSelectID("");
        setEventList([{ id: "empty-event", title: "Vacío" }]); setEventSelectID("");
      }
    });

    return () => {
      alive = false;
    };
  }, [campusSelectID, startDate, endDate]);


  // Get careers for selected area, filtered by date range
  useEffect(() => {
    let alive = true;
    if (!areaSelectID) return;

    DataStore.query(Career, (c) => c.areaID.eq(areaSelectID)).then(async (careers) => {
      if (!alive) return;

      if (!careers.length) {
        setCareerList([{ id: "empty-career", title: "Vacío" }]); setCareerSelectID("");
        setEventList([{ id: "empty-event", title: "Vacío" }]); setEventSelectID("");
        return;
      }

      if (!startDate && !endDate) {
        setCareerList(careers);
        // Do NOT auto-select a subárea: picking an Área narrows the grid to that
        // area's events, and the Subárea filter only applies when the user picks
        // one explicitly. Keep a still-valid prior selection, else clear it.
        setCareerSelectID(keepSelectionIfValid(careers));
        return;
      }

      const careerIDs = new Set(careers.map((c) => c.id));
      const allEventsLocal = await DataStore.query(Event);
      if (!alive) return;

      const startISO = toStartISO(startDate);
      const endISO = toEndISO(endDate);

      const inRange = allEventsLocal.filter((ev) => {
        if (!careerIDs.has(ev.careerID)) return false;
        const iso = getEventDateISO(ev);
        if (!iso) return false;
        const after = startISO ? iso >= startISO : true;
        const before = endISO ? iso <= endISO : true;
        return after && before;
      });

      const careersWithEvents = new Set(inRange.map((ev) => ev.careerID));
      const filteredCareers = careers.filter((c) => careersWithEvents.has(c.id));

      if (filteredCareers.length) {
        setCareerList(filteredCareers);
        // Keep a still-valid prior subárea selection; never auto-select one.
        setCareerSelectID(keepSelectionIfValid(filteredCareers));
      } else {
        setCareerList([{ id: "empty-career", title: "Vacío" }]); setCareerSelectID("");
        setEventList([{ id: "empty-event", title: "Vacío" }]); setEventSelectID("");
      }
    });

    return () => {
      alive = false;
    };
  }, [areaSelectID, startDate, endDate]);


  // Get events depending on the subarea ID
  useEffect(() => {
    if (!careerSelectID) return;

    const startISO = toStartISO(startDate);
    const endISO = toEndISO(endDate);

    DataStore.query(Event, (ev) => ev.careerID.eq(careerSelectID)).then((results) => {
      // Only events this user is allowed to see (admin -> all).
      let filtered = scopeEvents(results);

      // Apply date range client-side if user picked dates
      if (startISO || endISO) {
        filtered = filtered.filter((ev) => {
          const iso = getEventDateISO(ev);
          if (!iso) return false; // exclude events without a valid date
          const afterStart = startISO ? iso >= startISO : true;
          const beforeEnd  = endISO   ? iso <= endISO   : true;
          return afterStart && beforeEnd;
        });
      }

      if (filtered.length > 0) {
        setEventList(filtered);
        // Do NOT auto-open an event here: with the resumen/detalle split,
        // setting eventSelectID to a real id makes selectedEvent truthy and
        // hijacks the view into MODO DETALLE of an arbitrary event. Picking a
        // Subárea must only narrow the grid (shownEvents already filters by
        // careerSelectID). Keep a still-valid prior selection, else stay in
        // resumen (''). Detail is entered only by clicking a card or the
        // Eventos <select>.
        setEventSelectID(keepSelectionIfValid(filtered));
      } else {
        setEventSelectID("");
        setEventList([{ id: "empty-event", title: "Vacío" }]);
      }
    });
  }, [careerSelectID, startDate, endDate]);


  /*******************************************/
  /*********** GRID DATA (all events) ********/
  /*******************************************/

  // Load small tables (Campus/Area/Career) once permissions are ready and build
  // name maps, respecting canSeeCampus/canSeeArea (a non-admin only sees theirs).
  useEffect(() => {
    if (permLoading) return;
    let alive = true;

    (async () => {
      const [campuses, areas, careers] = await Promise.all([
        DataStore.query(Campus),
        DataStore.query(Area),
        DataStore.query(Career),
      ]);
      if (!alive) return;

      const campusMap = new Map();
      campuses.forEach((c) => {
        if (canSeeCampus(c.id)) campusMap.set(c.id, c.title);
      });

      const areaMap = new Map();
      areas.forEach((a) => {
        if (canSeeArea(a.id)) areaMap.set(a.id, { title: a.title, campusID: a.campusID });
      });

      const careerMap = new Map();
      careers.forEach((c) => {
        careerMap.set(c.id, { title: c.title, areaID: c.areaID });
      });

      setCampusById(campusMap);
      setAreaById(areaMap);
      setCareerById(careerMap);
    })();

    return () => {
      alive = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permLoading]);

  // Load ALL visible events + aggregated attendee counts + landings for the grid.
  // Mirrors the visibility rules of exportAllEventsToExcel: if !isAdmin and
  // eventIDsAllowed is an array -> only those; else if subAreaId -> careerID===subAreaId.
  useEffect(() => {
    if (permLoading) return;
    let alive = true;

    (async () => {
      // 1) Events, scoped to what the user may see
      let events = await DataStore.query(Event);
      if (!alive) return;
      events = scopeEvents(events);
      if (!isAdmin) {
        if (Array.isArray(eventIDsAllowed)) {
          const allow = new Set(eventIDsAllowed);
          events = events.filter((ev) => allow.has(ev.id));
        } else if (!isReportesOnly && subAreaId) {
          events = events.filter((ev) => ev.careerID === subAreaId);
        }
      }
      setAllEvents(events);

      // 2) All EventAttendee once, grouped by eventID -> {registros, checkIn}
      const allEA = await DataStore.query(EventAttendee);
      if (!alive) return;
      const counts = new Map();
      allEA.forEach((rec) => {
        const prev = counts.get(rec.eventID) || { registros: 0, checkIn: 0 };
        prev.registros += 1;
        if (rec.checkIn === true) prev.checkIn += 1;
        counts.set(rec.eventID, prev);
      });
      setCountByEventMap(counts);

      // 3) Landings mapped by landingEventId (NEVER event.Landing — resolves null)
      const landings = await DataStore.query(Landing);
      if (!alive) return;
      const lm = new Map();
      landings.forEach((l) => {
        if (l.landingEventId) lm.set(l.landingEventId, l);
      });
      setLandingByEvent(lm);
    })();

    return () => {
      alive = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permLoading, isAdmin, isReportesOnly]);


  // Get EventAttendee data on loading or selecting an event
  React.useEffect(() => {
    // Deselected (back to the aggregate overview): clear the event detail.
    if (eventSelectID == null || eventSelectID === "") {
      setChartsData([]);
      setAttendees(null);
      setEventAttendes(null);
      return;
    }
    if (eventSelectID === 0) {
      const eventListID = new Set(eventList.map((event) => event.id));

      DataStore.query(EventAttendee).then((results) => {
        const filtered = results.filter((item) =>
          eventListID.has(item.eventID)
        );
        if (filtered.length > 0) {
          setAttendees(filtered.map(item => item.formAnswers));
          setEventAttendes(filtered);
        } else {
          setAttendees([]);
          setEventAttendes([]);
        }
      });

    } else {

      DataStore.query(EventAttendee, (e) => e.eventID.eq(eventSelectID)).then(
        (results) => {
          setChartsData([]);
          if(results.length > 0){
            setAttendees(
              results.length > 0 ? results.map((item) => item.formAnswers) : null
            );
            setEventAttendes(results.length > 0 ? results : null);
          } else {
            setAttendees([]);
            setEventAttendes([]);
          }
        }
      );

    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventSelectID]);

  /*******************************************/
  /*************** EXCEL EXPORT **************/
  /*******************************************/

  // Generate excel using library XLSX
  function exportToExcel(data, eventAttendees) {
    if (!data || data.length === 0) {
      alert("No hay datos para exportar en este evento.");
      return;
    }

    const flattenedData = flattenData(data);

    const formattedData = flattenedData.map((user) => {
        const checkInValue = checkInForUser(eventAttendees, user);

        const userData = user.reduce((acc, item) => {
            acc[item.Campo] = item.Valor;
            return acc;
        }, {});

        userData["CheckIn"] = checkInValue; // Agregar el valor de CheckIn

        return userData;
    });

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Datos");

    // Grid cards can select events outside the career-scoped `eventList`, so
    // resolve the filename from `allEvents` (the fully-scoped superset the grid
    // draws from) first, then fall back to `eventList`, then a safe default —
    // never dereference an undefined match.
    const eventName =
      allEvents.find((e) => e.id === eventSelectID)?.title ||
      eventList?.find((item) => item.id === eventSelectID)?.title ||
      "evento";
    XLSX.writeFile(workbook, `${eventName}.xlsx`);
  }

  async function exportAllEventsToExcel() {
    try {
      // 1) Traer todos los eventos
      let allEvents = await DataStore.query(Event);
      // Acotar a lo que el usuario puede ver. Si tiene permisos por evento
      // (Reportes / managed), limitamos a esos; si no, al subárea (legacy).
      if (!isAdmin) {
        if (Array.isArray(eventIDsAllowed)) {
          const allow = new Set(eventIDsAllowed);
          allEvents = allEvents.filter((ev) => allow.has(ev.id));
        } else if (!isReportesOnly && subAreaId) {
          allEvents = allEvents.filter((ev) => ev.careerID === subAreaId);
        }
      }
      const eventMap = new Map(allEvents.map((e) => [e.id, e.title]));
      const eventIDs = new Set(allEvents.map((e) => e.id));

      // 2) Traer todos los EventAttendee y filtrar por los eventos elegibles
      const allEA = await DataStore.query(EventAttendee);
      const ea = allEA.filter((rec) => eventIDs.has(rec.eventID));
      if (!ea.length) {
        alert("No hay registros para exportar.");
        return;
      }

      // 3) Aplanar cada registro (formAnswers) en columnas
      const formatted = ea.map((rec) => {
        const answers = Array.isArray(rec.formAnswers) ? rec.formAnswers : [];
        const row = {};
        answers.forEach((field) => {
          if (!field || field.type === "header" || field.type === "paragraph") return;
          const label = field.label || field.name || "Campo";
          const value = Array.isArray(field.userData) ? field.userData[0] : field.userData;
          row[label] = value;
        });
        row["EventID"] = rec.eventID || "";
        row["EventTitle"] = eventMap.get(rec.eventID) || "";
        row["Email"] = rec.email || "";
        row["CheckIn"] = !!rec.checkIn;
        row["CreatedAt"] = rec.createdAt || "";
        return row;
      });

      // 4) Generar Excel
      const ws = XLSX.utils.json_to_sheet(formatted);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "EventAttendees");
      XLSX.writeFile(wb, "eventflow_all_event_attendees.xlsx");
    } catch (err) {
      console.error("Error exportando base completa:", err);
      alert("Ocurrió un error al exportar la base completa.");
    }
  }



  // Use Effect  to execute events data
  useEffect(() => {
    if (attendees) {
      DataStore.query(Form, (f) => f.Event.id.eq(eventSelectID)).then((results) => {
        if(results.length > 0){

          // Obtain questions from Form only to match className and remove any informative field
          const filteredArray = extractFormQuestionMeta(results[0].questions);

          // Obtain questions from EventAttendees and remove any informative field
          const cleanedAttendees = removeInformativeFields(attendees);

          const groupedData = groupEventData(cleanedAttendees, filteredArray);
          setChartsData(groupedData);
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attendees]);


  /*******************************************/
  /************ GRID DERIVATIONS *************/
  /*******************************************/

  // Short "18 mar 2026" (es-EC): day 2-digit + month short + year numeric.
  const fmtShortDate = (ev) => {
    const iso = getEventDateISO(ev);
    if (!iso) return "Sin fecha";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "Sin fecha";
    return d.toLocaleDateString("es-EC", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Status derivation (reuses Dashboard concept):
  //  Pasado (gray): event date < today (by day)
  //  Activo (green): landing exists and active === true
  //  Próximo (amber): future / not published
  const statusFor = (ev) => {
    const iso = getEventDateISO(ev);
    if (iso) {
      const d = new Date(iso);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const eventDay = new Date(d);
      eventDay.setHours(0, 0, 0, 0);
      if (eventDay.getTime() < today.getTime()) {
        return { color: "gray", label: "Pasado" };
      }
    }
    const landing = landingByEvent.get(ev.id);
    if (landing?.active === true) return { color: "green", label: "Activo" };
    return { color: "amber", label: "Próximo" };
  };

  // Breadcrumb "{Campus} · {Área} · {Subárea}" from the name maps (omit missing).
  const eventBreadcrumb = (ev) => {
    const career = careerById.get(ev.careerID); // {title, areaID}
    const area = career ? areaById.get(career.areaID) : undefined; // {title, campusID}
    const campusTitle = area ? campusById.get(area.campusID) : undefined;
    return [campusTitle, area?.title, career?.title].filter(Boolean).join(" · ");
  };

  const countsFor = (ev) =>
    countByEventMap.get(ev.id) || { registros: 0, checkIn: 0 };

  // Date-range predicate reused for the grid (same criterion as eventList).
  const inDateRange = (ev) => {
    const startISO = toStartISO(startDate);
    const endISO = toEndISO(endDate);
    if (!startISO && !endISO) return true;
    const iso = getEventDateISO(ev);
    if (!iso) return false;
    const afterStart = startISO ? iso >= startISO : true;
    const beforeEnd = endISO ? iso <= endISO : true;
    return afterStart && beforeEnd;
  };

  // Events shown in the grid: allEvents narrowed by the active filters
  // (campus/area/subárea/date-range) and the search term.
  const shownEvents = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const taxonomy = {
      campusSelectID,
      areaSelectID,
      careerSelectID,
      careerById,
      areaById,
    };
    return allEvents
      .filter((ev) => {
        // Campus/Área/Subárea (helper a nivel de módulo).
        if (!passesTaxonomyFilters(ev, taxonomy)) return false;
        // Date range.
        if (!inDateRange(ev)) return false;
        // Search by title.
        if (term && !(ev.title || "").toLowerCase().includes(term)) return false;
        return true;
      })
      .sort((a, b) => {
        const ia = getEventDateISO(a) || "";
        const ib = getEventDateISO(b) || "";
        return ib.localeCompare(ia); // most recent first
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    allEvents,
    campusSelectID,
    areaSelectID,
    careerSelectID,
    startDate,
    endDate,
    searchTerm,
    careerById,
    areaById,
  ]);

  // Aggregated metrics over the shown grid.
  const aggregate = useMemo(() => {
    let registros = 0;
    let checkIn = 0;
    shownEvents.forEach((ev) => {
      const c = countsFor(ev);
      registros += c.registros;
      checkIn += c.checkIn;
    });
    const rate = registros > 0 ? Math.round((checkIn / registros) * 100) : 0;
    return { registros, checkIn, rate };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shownEvents, countByEventMap]);

  const campusFilterName = campusById.get(campusSelectID) || "todos";

  // Selected event (for the drill-in detail): may be outside the current grid
  // filter, so fall back to allEvents.
  const selectedEvent = eventSelectID
    ? shownEvents.find((e) => e.id === eventSelectID) ||
      allEvents.find((e) => e.id === eventSelectID) ||
      null
    : null;

  // Top metrics: the SELECTED event's own numbers when one is picked, else the
  // aggregate over the shown grid.
  const detail = React.useMemo(() => {
    if (!selectedEvent) return aggregate;
    const c = countByEventMap.get(selectedEvent.id) || {
      registros: 0,
      checkIn: 0,
    };
    const rate =
      c.registros > 0 ? Math.round((c.checkIn / c.registros) * 100) : 0;
    return { registros: c.registros, checkIn: c.checkIn, rate };
  }, [selectedEvent, aggregate, countByEventMap]);

  /*******************************************/
  /********* DERIVED DISTRIBUTIONS ***********/
  /*******************************************/

  // Labels of questions already rendered as echarts (chartsData), so we don't
  // duplicate them as derived bars. chartsData entries carry `title` (stripped
  // label) from groupEventData; compare against the stripped question label.
  const chartedLabels = React.useMemo(() => {
    const s = new Set();
    (chartsData || []).forEach((c) => {
      const t = stripHtml(c?.title);
      if (t) s.add(t);
    });
    return s;
  }, [chartsData]);

  // Distribuciones por pregunta derivadas de `attendees` (la lógica vive en
  // buildQuestionStats, a nivel de módulo).
  const questionStats = React.useMemo(
    () => buildQuestionStats(attendees, chartedLabels),
    [attendees, chartedLabels]
  );

  // Whether the detail view has anything graphable (echarts or derived bars).
  const hasCharts =
    (chartsData && chartsData.length > 0) || questionStats.length > 0;
  // Attendees still loading for the selected event (null = not yet fetched).
  const detailLoading = selectedEvent != null && attendees == null;

  // Bring the event report into view when a card is picked.
  const detailRef = React.useRef(null);
  React.useEffect(() => {
    if (eventSelectID && detailRef.current) {
      detailRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [eventSelectID]);

  // Active filter chips (Campus principal + Área / Subárea / fechas cuando aplican).
  const activeAreaName =
    areaSelectID && areaSelectID !== "empty-area"
      ? areaById.get(areaSelectID)?.title
      : undefined;
  const activeCareerName =
    careerSelectID && careerSelectID !== "empty-career"
      ? careerById.get(careerSelectID)?.title
      : undefined;

  // Contenido de "Resultados del evento" (cargando / gráficos / vacío):
  // early returns en lugar de ternarios anidados dentro del JSX.
  const renderDetailResults = () => {
    if (detailLoading) {
      return (
        <Card>
          <p className="text-base text-gray-500">
            Cargando datos del evento…
          </p>
        </Card>
      );
    }
    if (hasCharts) {
      return (
        <div className="flex flex-col gap-4">
          {/* echarts configured via Form className (pie-/bar-chart) */}
          {chartsData && chartsData.length > 0 && (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {chartsData.map((chart) => (
                <PieChartApache
                  key={chart.title}
                  option={chart.options}
                  height="450px"
                />
              ))}
            </div>
          )}

          {/* distribuciones derivadas de attendees (opción múltiple /
              número) que NO estén ya cubiertas por los echarts */}
          {questionStats.map((s) => (
            <Card key={s.name} className="!p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="min-w-0 text-base font-semibold text-navy-700 dark:text-white">
                  {stripHtml(s.label) || s.name}
                </p>
                <div className="flex shrink-0 items-center gap-2">
                  <Chip color="gray" dot={false}>
                    {FIELD_TYPE_LABELS[s.type] || s.type}
                  </Chip>
                  <span className="text-xs text-gray-400">
                    {s.total} respuesta{s.total === 1 ? "" : "s"}
                  </span>
                </div>
              </div>

              <QuestionDistribution stat={s} />
            </Card>
          ))}
        </div>
      );
    }
    return (
      <Card>
        <div className="flex items-center gap-3 text-gray-500">
          <MdInsertChartOutlined className="h-6 w-6 shrink-0" />
          <span className="text-base">
            Este evento no tiene preguntas de opción múltiple para
            graficar. Usa “Exportar este evento” para ver todas las
            respuestas.
          </span>
        </div>
      </Card>
    );
  };

  return (
    <div className="report-page mt-3 px-2 sm:px-0">
      <PageHeader
        crumbs={[{ label: "Reportes" }]}
        title="Reportes"
        subtitle="Métricas y exportación de datos de tus eventos."
        actions={
          <>
            {/* Short labels below sm so both buttons fit a phone viewport.
                "Exportar evento actual" solo se muestra con un evento abierto:
                en modo resumen attendees es null y el botón siempre caería en el
                alert "No hay datos…" (guarda de exportToExcel). El modo detalle
                ya ofrece "Exportar este evento"; "Exportar base completa" queda
                siempre disponible. */}
            {selectedEvent && (
              <PrimaryButton
                onClick={() => exportToExcel(attendees, eventAttendes)}
                className="flex items-center gap-1.5 whitespace-nowrap"
              >
                <MdFileDownload className="h-4 w-4" />
                <span className="hidden sm:inline">Exportar evento actual</span>
                <span className="sm:hidden">Evento actual</span>
              </PrimaryButton>
            )}
            <SecondaryButton
              onClick={exportAllEventsToExcel}
              className="whitespace-nowrap"
            >
              <MdFileDownload className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar base completa</span>
              <span className="sm:hidden">Base completa</span>
            </SecondaryButton>
          </>
        }
      />

      {/* ── MODO RESUMEN (selectedEvent == null): búsqueda + filtros +
          métricas agregadas + grilla de tarjetas ─────────────────────── */}
      {!selectedEvent && (
        <>
      {/* 1) Search bar + Filtros toggle */}
      <div className="mb-3 flex gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 dark:border-white/10 dark:bg-navy-800">
          <MdSearch className="h-5 w-5 shrink-0 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar evento por nombre…"
            className="w-full border-none bg-[transparent] text-base text-navy-700 outline-none placeholder:text-gray-400 dark:text-white"
          />
        </div>
        <SecondaryButton
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className="whitespace-nowrap"
          aria-expanded={showFilters}
        >
          <MdFilterList className="h-4 w-4" />
          <span className="hidden sm:inline">Filtros</span>
        </SecondaryButton>
      </div>

      {/* 2) Active filter chips */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-sm text-gray-500">Filtros:</span>

        {/* Campus is the primary filter (always shown). */}
        {campusById.get(campusSelectID) && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-navy-700 dark:border-white/10 dark:bg-navy-800 dark:text-white">
            <MdLocationOn className="h-4 w-4 text-gray-400" />
            {campusById.get(campusSelectID)}
          </span>
        )}

        {activeAreaName && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-navy-700 dark:border-white/10 dark:bg-navy-800 dark:text-white">
            {activeAreaName}
            <button
              type="button"
              onClick={() => { setAreaSelectID(""); setCareerSelectID(""); }}
              aria-label="Quitar filtro de área"
              className="text-gray-400 transition hover:text-brand-500"
            >
              <MdClose className="h-4 w-4" />
            </button>
          </span>
        )}

        {activeCareerName && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-navy-700 dark:border-white/10 dark:bg-navy-800 dark:text-white">
            {activeCareerName}
            <button
              type="button"
              onClick={() => setCareerSelectID("")}
              aria-label="Quitar filtro de subárea"
              className="text-gray-400 transition hover:text-brand-500"
            >
              <MdClose className="h-4 w-4" />
            </button>
          </span>
        )}

        {(startDate || endDate) && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-navy-700 dark:border-white/10 dark:bg-navy-800 dark:text-white">
            <MdOutlineCalendarMonth className="h-4 w-4 text-gray-400" />
            {startDate || "…"} – {endDate || "…"}
            <button
              type="button"
              onClick={() => { setStartDate(""); setEndDate(""); }}
              aria-label="Quitar filtro de fechas"
              className="text-gray-400 transition hover:text-brand-500"
            >
              <MdClose className="h-4 w-4" />
            </button>
          </span>
        )}

        <button
          type="button"
          onClick={() => setShowFilters(true)}
          className="rounded-full border border-dashed border-gray-300 px-3 py-1.5 text-sm text-gray-500 transition hover:border-brand-500 hover:text-brand-500 dark:border-white/20"
        >
          ＋ Añadir filtro
        </button>
      </div>

      {/* Collapsible filter panel: the original selects + date inputs. */}
      {showFilters && (
        <Card
          title="Filtros"
          className="mb-4"
          headerRight={
            <button
              type="button"
              onClick={() => setShowFilters(false)}
              aria-label="Cerrar filtros"
              title="Cerrar filtros"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-navy-700 dark:hover:bg-navy-700 dark:hover:text-white"
            >
              <MdClose className="h-5 w-5" />
            </button>
          }
        >
          <div className="relative mb-3 flex flex-col gap-2 sm:flex-row sm:gap-4">
            <div className="flex min-w-0 flex-col sm:flex-initial">
              <label
                htmlFor="reportes-fecha-inicio"
                className="mb-1.5 text-sm font-semibold text-navy-700 dark:text-white"
              >
                Fecha inicio
              </label>
              <TextInput
                id="reportes-fecha-inicio"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="flex min-w-0 flex-col sm:flex-initial">
              <label
                htmlFor="reportes-fecha-fin"
                className="mb-1.5 text-sm font-semibold text-navy-700 dark:text-white"
              >
                Fecha fin
              </label>
              <TextInput
                id="reportes-fecha-fin"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {/* Reset button */}
            <div className="flex items-end">
              <SecondaryButton
                type="button"
                onClick={() => { setStartDate(""); setEndDate(""); }}
                className="w-full justify-center whitespace-nowrap sm:w-auto"
                aria-label="Resetear fechas"
              >
                Restablecer
              </SecondaryButton>
            </div>
          </div>


          <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">

            <div className="flex w-full flex-col min-w-0">
              <label
                htmlFor="reportes-filtro-campus"
                className="mb-1.5 text-sm font-semibold text-navy-700 dark:text-white"
              >
                Campus
              </label>
              <select
                id="reportes-filtro-campus"
                className="select-arrow w-full appearance-none truncate rounded-xl border border-gray-200 bg-white py-2.5 pl-3.5 pr-8 text-sm text-navy-700 outline-none transition focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
                onChange={(e) => setCampusSelectID(e.target.value)}
                value={campusSelectID}
              >
                {campusList?.map((result) => (
                  <option key={result.id} value={result.id}>
                    {result.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex w-full flex-col min-w-0">
              <label
                htmlFor="reportes-filtro-area"
                className="mb-1.5 text-sm font-semibold text-navy-700 dark:text-white"
              >
                Área
              </label>
              <select
                id="reportes-filtro-area"
                className="select-arrow w-full appearance-none truncate rounded-xl border border-gray-200 bg-white py-2.5 pl-3.5 pr-8 text-sm text-navy-700 outline-none transition focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
                onChange={(e) => setAreaSelectID(e.target.value)}
                value={areaSelectID || ""}
              >
                {areaList?.map((result) => (
                  <option key={result.id} value={result.id}>
                    {result.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex w-full flex-col min-w-0">
              <label
                htmlFor="reportes-filtro-subarea"
                className="mb-1.5 text-sm font-semibold text-navy-700 dark:text-white"
              >
                Subárea
              </label>
              <select
                id="reportes-filtro-subarea"
                className="select-arrow w-full appearance-none truncate rounded-xl border border-gray-200 bg-white py-2.5 pl-3.5 pr-8 text-sm text-navy-700 outline-none transition focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
                onChange={(e) => setCareerSelectID(e.target.value)}
                value={careerSelectID || ""}
              >
                {careerList?.map((result) => (
                  <option key={result.id} value={result.id}>
                    {result.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex w-full flex-col min-w-0">
              <label
                htmlFor="reportes-filtro-eventos"
                className="mb-1.5 text-sm font-semibold text-navy-700 dark:text-white"
              >
                Eventos
              </label>
              <select
                id="reportes-filtro-eventos"
                className="select-arrow w-full appearance-none truncate rounded-xl border border-gray-200 bg-white py-2.5 pl-3.5 pr-8 text-sm text-navy-700 outline-none transition focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
                onChange={(e) => setEventSelectID(e.target.value)}
                value={eventSelectID || ""}
              >
                {/* <option value="0">
                    Todos los eventos
                  </option> */}
                {eventList?.map((result) => (
                  <option key={result.id} value={result.id}>
                    {result.title}
                  </option>
                ))}
              </select>
            </div>

          </div>
        </Card>
      )}

      {/* 3) Aggregated metrics over the shown grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-brand-500">
              <MdPeople className="h-5 w-5" />
            </div>
            <div>
              <p className={TYPE.metricLabel}>Total Registros</p>
              <p className={`${TYPE.metricValue} leading-tight`}>
                {detail.registros}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-brand-500">
              <MdCheckCircleOutline className="h-5 w-5" />
            </div>
            <div>
              <p className={TYPE.metricLabel}>Total Check-in</p>
              <p className={`${TYPE.metricValue} leading-tight`}>
                {detail.checkIn}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <Donut value={detail.rate} size={64} stroke={7} />
            <div>
              <p className={TYPE.metricLabel}>Tasa de check-in</p>
              <p className={`${TYPE.metricValue} leading-tight`}>
                {detail.rate}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* 4) Section header */}
      <div className="mb-3 mt-6 flex items-baseline gap-2">
        <h2 className="text-lg font-bold text-navy-700 dark:text-white">Eventos</h2>
        <span className="text-sm text-gray-500">
          · {shownEvents.length} en {campusFilterName}
        </span>
      </div>

      {/* 5) Event card grid */}
      {shownEvents.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shownEvents.map((ev) => {
            const selected = ev.id === eventSelectID;
            const status = statusFor(ev);
            const c = countsFor(ev);
            const rate =
              c.registros > 0 ? Math.round((c.checkIn / c.registros) * 100) : 0;
            const crumb = eventBreadcrumb(ev);
            return (
              <Card
                key={ev.id}
                role="button"
                tabIndex={0}
                onClick={() => setEventSelectID(ev.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setEventSelectID(ev.id);
                  }
                }}
                className={`!p-4 cursor-pointer transition ${
                  selected
                    ? "border-2 border-brand-500 bg-red-50"
                    : "border-2 border-[transparent] hover:border-gray-200 dark:hover:border-white/10"
                }`}
              >
                {/* Top row: date + status chip */}
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-sm text-gray-500">
                    <MdOutlineCalendarMonth className="h-4 w-4" />
                    {fmtShortDate(ev)}
                  </span>
                  <Chip color={status.color}>{status.label}</Chip>
                </div>

                {/* Title */}
                <h3
                  className={`line-clamp-2 text-base font-bold ${
                    selected ? "text-brand-500" : "text-navy-700 dark:text-white"
                  }`}
                >
                  {ev.title}
                </h3>

                {/* Breadcrumb */}
                {crumb && (
                  <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                    <MdLocationOn className="h-4 w-4 shrink-0" />
                    <span className="truncate">{crumb}</span>
                  </p>
                )}

                {/* Bottom row: mini-stats + donut */}
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex gap-6">
                    <div>
                      <p className="text-2xl font-bold text-navy-700 dark:text-white">
                        {c.registros}
                      </p>
                      <p className="text-xs text-gray-400">registros</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-navy-700 dark:text-white">
                        {c.checkIn}
                      </p>
                      <p className="text-xs text-gray-400">check-in</p>
                    </div>
                  </div>
                  <Donut value={rate} size={44} stroke={5} />
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <div className="flex items-center gap-3 text-gray-500">
            <MdSearchOff className="h-6 w-6 shrink-0" />
            <span className="text-base">
              No hay eventos para los filtros actuales.
            </span>
          </div>
        </Card>
      )}
        </>
      )}

      {/* ── MODO DETALLE (selectedEvent != null): vista individual del
          evento — barra de acciones, header, métricas propias y gráficos/
          distribuciones derivadas de sus preguntas ──────────────────────── */}
      {selectedEvent && (
        <div ref={detailRef} className="scroll-mt-4">
          {/* 1) Barra superior: volver + exportar este evento */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <SecondaryButton onClick={() => setEventSelectID(null)}>
              <MdArrowBack className="h-4 w-4" />
              Volver a eventos
            </SecondaryButton>
            <PrimaryButton
              onClick={() => exportToExcel(attendees, eventAttendes)}
              className="flex items-center gap-1.5 whitespace-nowrap"
            >
              <MdFileDownload className="h-4 w-4" />
              Exportar este evento
            </PrimaryButton>
          </div>

          {/* 2) Header del evento */}
          <Card className="mb-4 !p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Reporte del evento
            </p>
            <h2 className="mt-1 text-2xl font-bold text-navy-700 dark:text-white">
              {selectedEvent.title}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <MdOutlineCalendarMonth className="h-4 w-4" />
                {fmtShortDate(selectedEvent)}
              </span>
              <Chip color={statusFor(selectedEvent).color}>
                {statusFor(selectedEvent).label}
              </Chip>
              {eventBreadcrumb(selectedEvent) && (
                <span className="flex min-w-0 items-center gap-1.5">
                  <MdLocationOn className="h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {eventBreadcrumb(selectedEvent)}
                  </span>
                </span>
              )}
            </div>
          </Card>

          {/* 3) Métricas del evento */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-brand-500">
                  <MdPeople className="h-5 w-5" />
                </div>
                <div>
                  <p className={TYPE.metricLabel}>Registros</p>
                  <p className={`${TYPE.metricValue} leading-tight`}>
                    {detail.registros}
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-brand-500">
                  <MdCheckCircleOutline className="h-5 w-5" />
                </div>
                <div>
                  <p className={TYPE.metricLabel}>Check-in</p>
                  <p className={`${TYPE.metricValue} leading-tight`}>
                    {detail.checkIn}
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-3">
                <Donut value={detail.rate} size={64} stroke={7} />
                <div>
                  <p className={TYPE.metricLabel}>Tasa de check-in</p>
                  <p className={`${TYPE.metricValue} leading-tight`}>
                    {detail.rate}%
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* 4) Resultados del evento: gráficos + distribuciones */}
          <div className="mt-6">
            <h2 className="mb-3 text-lg font-bold text-navy-700 dark:text-white">
              Resultados del evento
            </h2>

            {renderDetailResults()}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reportes;
