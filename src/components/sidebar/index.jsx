/* eslint-disable */
import React from "react";
import { HiX } from "react-icons/hi";
import Links from "./components/Links";
import { Link, useParams } from "react-router-dom";
import routes from "routes.js";
import { Landing } from "models"
import { formatDateHour, tzLabel } from 'scripts/utils'
import { DataStore } from 'aws-amplify/datastore';
import {
  MdChevronLeft,
  MdInfoOutline,
  MdWeb,
  MdListAlt,
  MdPoll,
  MdInsights,
  MdBadge,
  MdPeople,
} from "react-icons/md";
import {
  LiaExternalLinkAltSolid,
} from "react-icons/lia";
import { usePermissions } from "../../providers/PermissionsProvider";

// Event sub-nav sections (secondary sidebar). Path segment must match the
// route path suffix in routes.js (eventos/:id/<path>).
const EVENT_SECTIONS = [
  { path: "detalle", label: "Detalle Evento", Icon: MdInfoOutline },
  { path: "landing", label: "Landing page", Icon: MdWeb },
  { path: "formulario", label: "Formulario", Icon: MdListAlt },
  { path: "encuesta", label: "Encuesta", Icon: MdPoll },
  { path: "encuesta-dashboard", label: "Resultados encuesta", Icon: MdInsights },
  { path: "diseno-gafete", label: "Diseño Gafete", Icon: MdBadge },
  { path: "participantes", label: "Participantes", Icon: MdPeople },
];

const Sidebar = ({ open, onClose, eventModel, activePath}) => {

  const [event, setEvent] = React.useState(null);
  const [landing, setLanding] = React.useState(null);
  const [isActive, setIsActive] = React.useState(false);
  const { isAdmin } = usePermissions();

 const filteredRoutes = React.useMemo(() => {
    return routes
  //  if (!isAdmin) return routes;
  //  return routes.filter((r) => {
  //    const name = (r?.name || "").toLowerCase();
  //    const path = (r?.path || "").toLowerCase();
  //    // ajusta los términos si tu item usa otro label/path
  //    const matchesBlocklist =
  //      /restablecer|reset|restore/.test(name) ||
  //      /restablecer|reset|restore/.test(path) ||
  //      `${r?.layout || ""}/${path}` === "/page/campus";
  //    return !matchesBlocklist;
   }, []);

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
    <div
      className={`sm:none duration-175 linear fixed !z-50 flex min-h-[96%] flex-col bg-black pb-10 shadow-2xl shadow-white/5 transition-all max-w-[204px] ${activePath != '' ? 'rounded-l-3xl max-w-[100px]' : 'rounded-3xl'} ml-2 xl:ml-3 mt-3 mb-4 dark:!bg-navy-800 dark:text-white md:!z-50 lg:!z-50 xl:!z-0	 ${
        open ? "translate-x-0" : "-translate-x-96"
      }`}
    >
      <span
        className={`absolute ${activePath != '' ? 'top-6 -right-[240px] text-black z-[60]' : 'top-4 right-4 text-white'}  block cursor-pointer xl:hidden`}
        onClick={onClose}
      >
        <HiX />
      </span>

      {/* <div className={`mx-[56px] mt-[50px] flex items-center`}>
        <div className="mt-1 ml-1 h-2.5 font-poppins text-[26px] font-bold uppercase text-navy-700 dark:text-white">
          Eventflow
        </div>
      </div> */}
      <div className="mt-[15px] mb-7 h-px dark:bg-white/30" />
      {/* Nav item */}

      <ul className="mb-auto pt-1">
        <Links routes={filteredRoutes} activePath={activePath} />
      </ul>

      {/* Free Horizon Card */}
      {/* <div className="flex justify-center">
        <SidebarCard />
      </div> */}

      {/* Nav item end */}
      { activePath != '' &&
        <div
          className={`sm:none bg-white duration-175 linear fixed rounded-r-3xl !z-50 min-h-full max-h-screen overflow-y-auto bg-gray pb-10 shadow-2xl shadow-white/5 transition-all ${
            open
              ? 'left-[-14px] translate-x-[100px] xl:translate-x-[110px]'
              : 'left-[-14px] -translate-x-96 xl:translate-x-[110px]'
          } w-[268px] xl:w-[268px] dark:!bg-navy-800 dark:text-white md:!z-50 lg:!z-50 xl:!z-0`}
          >
          <div className="flex flex-col">
            {/* Back to events */}
            <div className="px-4 pt-4 pb-2">
              <Link className="flex items-center gap-1 text-sm font-medium text-brand-500 hover:text-navy-700 hover:no-underline" to={ `eventos/`}>
                <MdChevronLeft className="h-5 w-5" /> Eventos
              </Link>
            </div>

            {/* Event header: compact title + meta + controls in one row */}
            <div className="px-5 pb-4 border-b border-gray-200 dark:border-white/10">
              <h2 className="text-base font-semibold leading-snug text-navy-700 dark:text-white">
                {event?.title}
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                {formatDateHour(event?.date, "ES", event?.timezone)} ({tzLabel(event?.timezone)})
              </p>
              <div className="mt-3 flex items-center gap-2">
                <select
                  className="cursor-pointer rounded-lg border border-gray-200 bg-white py-1.5 pl-2.5 pr-7 text-xs font-medium text-navy-700 outline-none select-arrow appearance-none focus:border-brand-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-navy-800 dark:text-white"
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
                <Link
                  className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-brand-500 hover:bg-gray-50 hover:text-navy-700 hover:no-underline dark:border-white/10 dark:hover:bg-navy-700"
                  to={ `/landing/${event?.id}`} target="_blank" rel="noopener noreferrer">
                  Ver landing <LiaExternalLinkAltSolid className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Section nav: compact items with icons + pill active state */}
            <p className="px-6 pt-4 pb-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Gestión del evento
            </p>
            <nav className="flex flex-col pb-2">
              {EVENT_SECTIONS.map(({ path, label, Icon }) => {
                const active = activePath === `eventos/:id/${path}`;
                return (
                  <Link
                    key={path}
                    className={`mx-3 my-[2px] flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition hover:no-underline ${
                      active
                        ? "bg-brand-500 text-white hover:bg-brand-500 hover:text-white"
                        : "text-gray-700 hover:bg-gray-100 hover:text-black dark:text-gray-200 dark:hover:bg-navy-700 dark:hover:text-white"
                    }`}
                    to={ `eventos/${event?.id}/${path}/`}>
                    <Icon className={`h-5 w-5 shrink-0 ${active ? "text-white" : "text-gray-400"}`} />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>
         
        </div>
      }
      
    </div>
    </>
  );
};

export default Sidebar;
