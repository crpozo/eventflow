import React from "react";
import { useNavigate } from "react-router-dom";
import { DataStore } from "aws-amplify/datastore";
import { Campus, Area, Career } from "models";
import { usePermissions } from "../../providers/PermissionsProvider";
import { MdAdd, MdEdit, MdChevronRight, MdArrowForward } from "react-icons/md";

/**
 * Single-page guided selector: Campus → Área → Subárea, all on one screen with
 * a breadcrumb. Levels that have exactly one option are auto-skipped. Picking a
 * subárea stores the selection (EVENTFLOW.*) and goes to the events list — same
 * contract the old multi-page flow used.
 */
export default function Navegar() {
  const navigate = useNavigate();
  const { loading: permLoading, isAdmin, canSeeCampus, canSeeArea } = usePermissions();

  const [campuses, setCampuses] = React.useState([]);
  const [areas, setAreas] = React.useState([]);
  const [careers, setCareers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const [campus, setCampus] = React.useState(null);
  const [area, setArea] = React.useState(null);

  React.useEffect(() => {
    (async () => {
      try {
        const [c, a, ca] = await Promise.all([
          DataStore.query(Campus),
          DataStore.query(Area),
          DataStore.query(Career),
        ]);
        setCampuses(c);
        setAreas(a);
        setCareers(ca);
      } catch (e) {
        console.error("Navegar: error cargando datos", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const byTitle = (x, y) => (x.title || "").localeCompare(y.title || "");
  const visibleCampuses = campuses.filter((c) => canSeeCampus(c.id)).sort(byTitle);
  const visibleAreas = campus
    ? areas.filter((a) => a.campusID === campus.id && canSeeArea(a.id)).sort(byTitle)
    : [];
  const visibleCareers = area
    ? careers.filter((c) => c.areaID === area.id).sort(byTitle)
    : [];

  const selectCampus = (c) => {
    localStorage.setItem("EVENTFLOW.campus", JSON.stringify(c));
    localStorage.removeItem("EVENTFLOW.area");
    localStorage.removeItem("EVENTFLOW.subarea");
    localStorage.removeItem("EVENTFLOW.event");
    setArea(null);
    setCampus(c);
  };
  const selectArea = (a) => {
    localStorage.setItem("EVENTFLOW.area", JSON.stringify(a));
    localStorage.removeItem("EVENTFLOW.subarea");
    localStorage.removeItem("EVENTFLOW.event");
    setArea(a);
  };
  const selectCareer = (c) => {
    localStorage.setItem("EVENTFLOW.subarea", JSON.stringify(c));
    localStorage.removeItem("EVENTFLOW.event");
    navigate("/"); // events list
  };

  // Auto-skip intermediate levels (campus/área) that have a single option.
  React.useEffect(() => {
    if (loading || permLoading) return;
    if (!campus && visibleCampuses.length === 1) {
      selectCampus(visibleCampuses[0]);
    } else if (campus && !area && visibleAreas.length === 1) {
      selectArea(visibleAreas[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, permLoading, campus, area, campuses, areas]);

  const level = !campus ? "campus" : !area ? "area" : "subarea";
  const options =
    level === "campus" ? visibleCampuses : level === "area" ? visibleAreas : visibleCareers;

  const headings = {
    campus: { title: "Selecciona un campus", create: "Crear Campus", createPath: "/page/campus/crear", editPath: "/page/campus/editar" },
    area: { title: "Selecciona un área", create: "Crear Área", createPath: "/page/campus/area/crear", editPath: "/page/campus/area/editar" },
    subarea: { title: "Selecciona una subárea", create: "Crear Subárea", createPath: "/page/campus/area/subarea/crear", editPath: "/page/campus/area/subarea/editar" },
  };
  const h = headings[level];

  const onSelect = (item) =>
    level === "campus" ? selectCampus(item) : level === "area" ? selectArea(item) : selectCareer(item);

  if (loading || permLoading) {
    return (
      <div className="flex min-h-[50vh] w-full flex-col items-center justify-center p-3">
        <span className="loader"></span>
        <h2 className="mt-4 text-center text-xl">Cargando…</h2>
      </div>
    );
  }

  return (
    <div className="navegar-page">
      {/* Breadcrumb */}
      <div className="mb-4 flex flex-wrap items-center gap-1 text-sm">
        <button
          onClick={() => { setCampus(null); setArea(null); }}
          className={`font-medium ${level === "campus" ? "text-brand-500" : "text-gray-500 hover:text-navy-700 dark:hover:text-white"}`}
        >
          Campus
        </button>
        {campus && (
          <>
            <MdChevronRight className="h-4 w-4 text-gray-400" />
            <button
              onClick={() => setArea(null)}
              className={`font-medium ${level === "area" ? "text-brand-500" : "text-gray-500 hover:text-navy-700 dark:hover:text-white"}`}
            >
              {campus.title}
            </button>
          </>
        )}
        {area && (
          <>
            <MdChevronRight className="h-4 w-4 text-gray-400" />
            <span className="font-medium text-brand-500">{area.title}</span>
          </>
        )}
      </div>

      <div className="!z-5 relative flex flex-col rounded-[20px] bg-white bg-clip-border px-[25px] py-[25px] shadow-card dark:!bg-navy-800 dark:text-white dark:shadow-none">
        <div className="mb-5 flex flex-col items-center justify-between gap-3 sm:flex-row sm:gap-0">
          <p className="text-2xl font-bold text-navy-700 dark:text-white">{h.title}</p>
          {isAdmin && (
            <button
              onClick={() => navigate(h.createPath)}
              className="linear flex items-center gap-1 rounded-xl bg-brand-500 px-3 py-[12px] text-sm font-medium text-white transition duration-200 hover:bg-black"
            >
              {h.create} <MdAdd className="h-4 w-4" />
            </button>
          )}
        </div>

        {options.length === 0 ? (
          <p className="py-8 text-center text-gray-500">
            No hay {level === "campus" ? "campus" : level === "area" ? "áreas" : "subáreas"} disponibles.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {options.map((item) => (
              <div
                key={item.id}
                className="group flex items-center justify-between rounded-xl border border-gray-200 p-4 transition hover:border-brand-500 hover:shadow-md dark:border-navy-700"
              >
                <button onClick={() => onSelect(item)} className="flex flex-1 items-center gap-3 text-left">
                  <span className="text-lg font-medium text-navy-700 dark:text-white">{item.title}</span>
                </button>
                <div className="flex items-center gap-1">
                  {isAdmin && (
                    <button
                      onClick={() => navigate(h.editPath, { state: { id: item.id } })}
                      aria-label="Editar"
                      className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-navy-700 dark:hover:bg-navy-900 dark:hover:text-white"
                    >
                      <MdEdit className="h-5 w-5" />
                    </button>
                  )}
                  <button
                    onClick={() => onSelect(item)}
                    aria-label="Seleccionar"
                    className="rounded-lg p-2 text-brand-500 transition group-hover:translate-x-0.5"
                  >
                    <MdArrowForward className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
