/* eslint-disable */
import React from "react";
import { HiX } from "react-icons/hi";
import { Link, useLocation } from "react-router-dom";
import { Landing } from "models"
import { tzLabel } from 'scripts/utils'
import { DataStore } from 'aws-amplify/datastore';
import Dropdown from "components/dropdown";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { Chip } from "components/adminUi";
import {
  MdChevronLeft,
  MdChevronRight,
  MdHome,
  MdCalendarToday,
  MdBarChart,
  MdAccountBalance,
  MdOutlineCalendarMonth,
  MdInfoOutline,
  MdWeb,
  MdListAlt,
  MdPoll,
  MdInsights,
  MdBadge,
  MdPeople,
} from "react-icons/md";
import { LuUserCheck } from "react-icons/lu";
import {
  LiaExternalLinkAltSolid,
} from "react-icons/lia";
import { usePermissions } from "../../providers/PermissionsProvider";
import logoDragon from "assets/img/usfq/logo-dragon-icon.png";

// Icon-only primary rail (mock: black bar, "ef" logo on top, avatar at bottom).
const RAIL_ITEMS = [
  { to: "/admin/dashboard", Icon: MdHome, match: "dashboard", label: "Dashboard" },
  { to: "/admin/eventos", Icon: MdCalendarToday, match: "eventos", label: "Eventos" },
  { to: "/admin/reportes", Icon: MdBarChart, match: "reportes", label: "Reportes" },
  { to: "/admin/permisos", Icon: LuUserCheck, match: "permisos", label: "Permisos" },
  { to: "/page/campus", Icon: MdAccountBalance, match: "campus", label: "Estructura" },
];

// Event sub-nav sections (secondary sidebar). Path segment must match the
// route path suffix in routes.js (eventos/:id/<path>). Items show an icon +
// label; the active one gets a soft red pill + chevron.
const EVENT_SECTIONS = [
  { path: "detalle", label: "Detalle Evento", Icon: MdInfoOutline },
  { path: "landing", label: "Landing page", Icon: MdWeb },
  { path: "formulario", label: "Formulario", Icon: MdListAlt },
  { path: "encuesta", label: "Encuesta", Icon: MdPoll },
  { path: "encuesta-dashboard", label: "Resultados encuesta", Icon: MdInsights },
  { path: "diseno-gafete", label: "Diseño Gafete", Icon: MdBadge },
  { path: "participantes", label: "Participantes", Icon: MdPeople },
];

// Compact date for the event header, e.g. "lun 06/07/2026 · 09:00" in the
// EVENT's timezone (matches the mock).
const compactDate = (iso, tz) => {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    const zone = tz || "America/Guayaquil";
    const date = new Intl.DateTimeFormat("es-EC", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: zone,
    }).format(d);
    const hour = new Intl.DateTimeFormat("es-EC", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: zone,
    }).format(d);
    return `${date} · ${hour}`;
  } catch (e) {
    return "";
  }
};

const Sidebar = ({ open, onClose, eventModel, activePath}) => {

  const [event, setEvent] = React.useState(null);
  const [landing, setLanding] = React.useState(null);
  const [isActive, setIsActive] = React.useState(false);
  const { isAdmin } = usePermissions();
  const location = useLocation();
  const { user, signOut } = useAuthenticator((context) => [context.user]);

  // Initials for the rail avatar (from the login email).
  const initials = String(
    user?.signInDetails?.loginId || user?.username || "US"
  )
    .slice(0, 2)
    .toUpperCase();

  React.useEffect(() => {
    const event = localStorage.getItem('EVENTFLOW.event');
    if(event && event !== null && event !== undefined && event!= 'undefined'){
      setEvent(JSON.parse(event));
    }

  }, [activePath]);

  React.useEffect( () => {

    if(event){
      const sub = DataStore.observeQuery(Landing, (l) => l.landingEventId.eq(event.id)).subscribe(({ items }) => {
        // Always reset (null when the event has no landing yet) so switching
        // events never leaves the previous event's landing/active state behind.
        setLanding(items[0] || null)
        setIsActive(items[0]?.active ?? false)
      });

      return () => {
        sub.unsubscribe();
      };
    }

  }, [event])

  async function updateLanding(state) {
    // No landing record yet (new event): nothing to toggle — the landing page
    // section creates it on first save.
    if (!landing) return;
    await DataStore.save(
      Landing.copyOf(landing, updated => {
        updated.active = state;
      })
    );
  }

  return (
    <>
    {/* ── Primary rail: black, icons-only, ef logo + avatar ── */}
    <div
      className={`fixed top-0 left-0 !z-50 flex h-full min-h-screen w-[72px] flex-col items-center bg-black py-4 transition-all dark:!bg-navy-900 md:!z-50 lg:!z-50 xl:!z-0 ${
        open ? "translate-x-0" : "-translate-x-96"
      }`}
    >
      <span
        className={`absolute ${activePath != '' ? 'top-5 -right-[336px] text-black z-[60]' : 'top-5 -right-8 text-black'} block cursor-pointer xl:hidden`}
        onClick={onClose}
      >
        <HiX />
      </span>

      {/* USFQ logo (dragon icon) on a white tile for contrast on the black rail */}
      <Link
        to="/admin/dashboard"
        className="mb-6 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 hover:no-underline"
      >
        <img src={logoDragon} alt="USFQ" className="h-full w-full object-contain" />
      </Link>

      {/* Nav icons */}
      <nav className="flex flex-1 flex-col items-center gap-2">
        {RAIL_ITEMS.map(({ to, Icon, match, label }) => {
          const active = location.pathname.includes(match);
          return (
            <Link
              key={to}
              to={to}
              title={label}
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition hover:no-underline ${
                active
                  ? "bg-brand-500 text-white"
                  : "text-gray-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5" />
            </Link>
          );
        })}
      </nav>

      {/* Avatar + sign out */}
      <Dropdown
        button={
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-xs font-semibold text-white"
            aria-label="Menú de usuario"
          >
            {initials}
          </button>
        }
        children={
          <div className="flex w-48 flex-col rounded-2xl bg-white p-3 shadow-xl shadow-shadow-500 dark:!bg-navy-700 dark:text-white">
            <p className="mb-2 truncate text-xs text-gray-400">
              {user?.signInDetails?.loginId || ""}
            </p>
            <button
              className="text-left text-sm font-medium text-gray-800 hover:text-brand-500 focus:outline-none dark:text-white"
              onClick={signOut}
            >
              Cerrar sesión
            </button>
          </div>
        }
        classNames={"bottom-12 left-10 w-max z-[60]"}
      />
    </div>

    {/* ── Secondary panel: event management ── */}
    { activePath != '' &&
      <div
        className={`fixed top-0 left-0 !z-40 h-full min-h-screen w-[320px] overflow-y-auto border-r border-gray-100 bg-white pb-10 shadow-sm transition-all dark:border-white/10 dark:!bg-navy-800 dark:text-white md:!z-40 xl:!z-0 ${
          open ? 'translate-x-[72px]' : '-translate-x-96 xl:translate-x-[72px]'
        }`}
      >
        <div className="flex flex-col">
          {/* Back to events */}
          <div className="px-4 pt-4 pb-2">
            <Link className="flex items-center gap-1 text-sm font-medium text-brand-500 hover:text-navy-700 hover:no-underline" to={ `eventos/`}>
              <MdChevronLeft className="h-5 w-5" /> Eventos
            </Link>
          </div>

          {/* Event header: status chips + compact title + meta (mock layout) */}
          <div className="px-5 pb-4 border-b border-gray-100 dark:border-white/10">
            <div className="mb-2.5 flex items-center gap-2">
              <Chip color={isActive ? "green" : "gray"}>
                {isActive ? "Publicado" : "Oculto"}
              </Chip>
              <select
                className="cursor-pointer appearance-none rounded-full bg-gray-100 py-1 pl-2.5 pr-6 text-xs font-medium text-navy-700 outline-none select-arrow disabled:cursor-not-allowed disabled:opacity-50 dark:bg-navy-700 dark:text-white"
                disabled={!landing}
                title={!landing ? "Crea la landing del evento primero" : undefined}
                onChange={(e) => {
                  if(e.target.value == 'public'){
                    updateLanding(true)
                  } else if(e.target.value == 'hidden'){
                    updateLanding(false)
                  }
                }}
                value={isActive ? "public" : "hidden"}
              >
                <option value="public">Público</option>
                <option value="hidden">Oculto</option>
              </select>
            </div>
            <h2 className="text-base font-semibold leading-snug text-navy-700 dark:text-white">
              {event?.title}
            </h2>
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-500">
              <MdOutlineCalendarMonth className="h-4 w-4 shrink-0" />
              {compactDate(event?.date, event?.timezone)} ({tzLabel(event?.timezone)})
            </p>
            <Link
              className="mt-2 flex w-fit items-center gap-1 text-sm font-medium text-brand-500 hover:text-navy-700 hover:no-underline"
              to={ `/landing/${event?.id}`} target="_blank" rel="noopener noreferrer">
              Link del evento <LiaExternalLinkAltSolid className="h-4 w-4" />
            </Link>
          </div>

          {/* Section nav: plain text items, soft red pill + chevron when active */}
          <p className="px-6 pt-4 pb-1 text-xs font-bold uppercase tracking-wider text-gray-400">
            Gestión del evento
          </p>
          <nav className="flex flex-col gap-1 pb-3 pt-1">
            {EVENT_SECTIONS.map(({ path, label, Icon }) => {
              const active = activePath === `eventos/:id/${path}`;
              return (
                <Link
                  key={path}
                  className={`mx-3 flex items-center justify-between rounded-xl px-4 py-3 text-sm transition hover:no-underline ${
                    active
                      ? "bg-red-50 font-medium text-brand-500 hover:text-brand-500"
                      // navy-700, NOT gray-700: this theme's gray-700 is
                      // #DEDEDE (nearly white) and unreadable on white.
                      : "font-normal text-navy-700 hover:bg-gray-50 hover:text-black dark:text-gray-200 dark:hover:bg-navy-700 dark:hover:text-white"
                  }`}
                  to={ `eventos/${event?.id}/${path}/`}>
                  <span className="flex min-w-0 items-center gap-3">
                    <Icon
                      className={`h-[18px] w-[18px] shrink-0 ${
                        active ? "text-brand-500" : "text-gray-400"
                      }`}
                    />
                    <span className="truncate">{label}</span>
                  </span>
                  {active && <MdChevronRight className="h-4 w-4 shrink-0" />}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    }
    </>
  );
};

export default Sidebar;
