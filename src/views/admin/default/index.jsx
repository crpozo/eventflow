import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { DataStore } from 'aws-amplify/datastore';
import { Event } from "models"
import {
  MdBarChart,
  MdCalendarToday,
  MdOutlineCalendarMonth,
  MdAdd,
  MdChevronRight,
  MdCheckCircleOutline,
  MdOutlineUpcoming,
} from "react-icons/md";
import { AiOutlineWarning } from "react-icons/ai";
import { usePermissions } from "../../../providers/PermissionsProvider";
import { PageHeader, Card, TYPE } from "components/adminUi";

const SHORTCUTS = [
  {
    title: "Todos mis eventos",
    desc: "Administra cada evento: landing, formulario, encuesta y participantes.",
    Icon: MdCalendarToday,
    link: "/admin/eventos",
  },
  {
    title: "Visualizar Reportes",
    desc: "Métricas de registro y check-in, con exportación a Excel.",
    Icon: MdBarChart,
    link: "/admin/reportes",
  },
  {
    title: "Crear un evento",
    desc: "Configura un nuevo evento en minutos.",
    Icon: MdAdd,
    link: "/admin/eventos/crear",
  },
];

// Compact "lun 06/07/2026 · 09:00" in the event's timezone.
const compactDate = (iso, tz) => {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    const zone = tz || "America/Guayaquil";
    const date = new Intl.DateTimeFormat("es-EC", {
      weekday: "short", day: "2-digit", month: "2-digit", year: "numeric", timeZone: zone,
    }).format(d);
    const hour = new Intl.DateTimeFormat("es-EC", {
      hour: "2-digit", minute: "2-digit", hour12: false, timeZone: zone,
    }).format(d);
    return `${date} · ${hour}`;
  } catch (e) {
    return "";
  }
};

const Metric = ({ Icon, label, value }) => (
  <Card className="!p-4">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-brand-500">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className={TYPE.metricLabel}>{label}</p>
        <p className={`${TYPE.metricValue} leading-tight`}>{value}</p>
      </div>
    </div>
  </Card>
);

const Dashboard = () => {

  const [events, setEvents] = React.useState([]);
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

  if (loading) {
    return (
      <div className="flex min-h-[60vh] w-full flex-col items-center justify-center">
        <span className="loader"></span>
        <h2 className="mt-2 text-xl text-black dark:text-white">Cargando…</h2>
      </div>
    );
  }

  const now = new Date();
  const upcoming = events
    .filter((e) => e.date && new Date(e.date) > now)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const thisMonth = events.filter((e) => {
    if (!e.date) return false;
    const d = new Date(e.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const finished = events.filter((e) => e.date && new Date(e.date) <= now);

  return (
    <div className="mt-2">
      <PageHeader
        crumbs={[{ label: "Dashboard" }]}
        title="Dashboard"
        subtitle="Resumen general de tus eventos."
      />

      {events.length !== 0 ? (
        // Compact by design: the whole dashboard must fit ONE viewport.
        <div className="flex flex-col gap-4">

          {/* Metrics */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric Icon={MdBarChart} label="Total eventos" value={events.length} />
            <Metric Icon={MdOutlineUpcoming} label="Próximos" value={upcoming.length} />
            <Metric Icon={MdOutlineCalendarMonth} label="Este mes" value={thisMonth.length} />
            <Metric Icon={MdCheckCircleOutline} label="Finalizados" value={finished.length} />
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            {/* Upcoming events list */}
            <Card
              title="Próximos eventos"
              subtitle="Los siguientes en el calendario."
              className="xl:col-span-2 !p-4"
            >
              {upcoming.length === 0 ? (
                <p className="text-[15px] text-gray-400">
                  No hay eventos próximos en el calendario.
                </p>
              ) : (
                <div className="flex flex-col">
                  {upcoming.slice(0, 4).map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => navigate(`/admin/eventos/${e.id}/detalle/`)}
                      className="flex items-center justify-between gap-3 border-b border-gray-100 py-2.5 text-left transition last:border-0 hover:bg-gray-50 dark:border-white/5 dark:hover:bg-navy-700"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold text-navy-700 dark:text-white">
                          {e.title}
                        </p>
                        <p className="mt-0.5 text-sm text-gray-500">
                          {compactDate(e.date, e.timezone)}
                          {e.location ? ` · ${e.location}` : ""}
                        </p>
                      </div>
                      <MdChevronRight className="h-5 w-5 shrink-0 text-gray-300" />
                    </button>
                  ))}
                </div>
              )}
            </Card>

            {/* Shortcuts */}
            <div className="flex flex-col gap-4">
              {SHORTCUTS.map(({ title, desc, Icon, link }) => (
                <Link
                  to={link}
                  key={link}
                  className="group flex flex-1 items-center gap-4 rounded-2xl bg-white p-4 shadow-card transition hover:shadow-xl hover:no-underline dark:!bg-navy-800 dark:text-white"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-brand-500">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold leading-tight text-navy-700 dark:text-white">
                      {title}
                    </h3>
                    <p className="mt-0.5 line-clamp-1 text-sm text-gray-500">{desc}</p>
                    <span className="mt-1 flex items-center gap-1 text-[15px] font-medium text-brand-500">
                      Ver más
                      <MdChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

        </div>
      ) : (
        <Card>
          <p className="flex items-center gap-2 text-[15px] text-navy-700 dark:text-white">
            <AiOutlineWarning /> No existen eventos en la base de datos...
          </p>
        </Card>
      )}

    </div>
  );
};

export default Dashboard;
