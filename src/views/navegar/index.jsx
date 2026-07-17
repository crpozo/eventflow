import React from "react";
import { useNavigate } from "react-router-dom";
import { DataStore } from "aws-amplify/datastore";
import { Campus, Area, Career } from "models";
import { usePermissions } from "../../providers/PermissionsProvider";
import { PageHeader, Card, PrimaryButton, PageLoader } from "components/adminUi";
import { MdAdd, MdEdit, MdChevronRight, MdArrowForward } from "react-icons/md";

/**
 * Single-page guided selector: Campus → Área → Subárea, all on one screen with
 * a breadcrumb. Levels that have exactly one option are auto-skipped. Picking a
 * subárea stores the selection (EVENTFLOW.*) and goes to the events list — same
 * contract the old multi-page flow used.
 */

// Nivel actual del selector según lo ya elegido.
const getLevel = (campus, area) => {
  if (!campus) return "campus";
  if (!area) return "area";
  return "subarea";
};

// Textos y rutas de cada nivel.
const HEADINGS = {
  campus: { title: "Selecciona un campus", create: "Crear Campus", createPath: "/page/campus/crear", editPath: "/page/campus/editar" },
  area: { title: "Selecciona un área", create: "Crear Área", createPath: "/page/campus/area/crear", editPath: "/page/campus/area/editar" },
  subarea: { title: "Selecciona una subárea", create: "Crear Subárea", createPath: "/page/campus/area/subarea/crear", editPath: "/page/campus/area/subarea/editar" },
};

// Sustantivo (plural) de cada nivel para el estado vacío.
const EMPTY_NOUNS = { campus: "campus", area: "áreas", subarea: "subáreas" };

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

  const level = getLevel(campus, area);
  const optionsByLevel = {
    campus: visibleCampuses,
    area: visibleAreas,
    subarea: visibleCareers,
  };
  const options = optionsByLevel[level];

  const h = HEADINGS[level];

  const selectByLevel = {
    campus: selectCampus,
    area: selectArea,
    subarea: selectCareer,
  };
  const onSelect = selectByLevel[level];

  if (loading || permLoading) {
    return <PageLoader />;
  }

  return (
    <div className="navegar-page mt-3">
      <PageHeader
        crumbs={[{ label: "Estructura" }]}
        title="Estructura"
        subtitle="Navega por campus, áreas y subáreas para llegar a los eventos."
      />

      {/* Interactive level breadcrumb (resets the selection, not navigation) */}
      <div className="mb-4 flex flex-wrap items-center gap-1 text-sm">
        <button
          type="button"
          onClick={() => { setCampus(null); setArea(null); }}
          className={`font-medium ${level === "campus" ? "text-brand-500" : "text-gray-500 hover:text-navy-700 dark:hover:text-white"}`}
        >
          Campus
        </button>
        {campus && (
          <>
            <MdChevronRight className="h-4 w-4 text-gray-300" />
            <button
              type="button"
              onClick={() => setArea(null)}
              className={`font-medium ${level === "area" ? "text-brand-500" : "text-gray-500 hover:text-navy-700 dark:hover:text-white"}`}
            >
              {campus.title}
            </button>
          </>
        )}
        {area && (
          <>
            <MdChevronRight className="h-4 w-4 text-gray-300" />
            <span className="font-medium text-brand-500">{area.title}</span>
          </>
        )}
      </div>

      <Card
        title={h.title}
        headerRight={
          isAdmin ? (
            <PrimaryButton
              type="button"
              onClick={() => navigate(h.createPath)}
              className="flex items-center gap-1.5"
            >
              {h.create} <MdAdd className="h-4 w-4" />
            </PrimaryButton>
          ) : null
        }
      >
        {options.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">
            No hay {EMPTY_NOUNS[level]} disponibles.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {options.map((item) => (
              // The WHOLE card selects the item (not just the title): the
              // container handles the click; inner actions stopPropagation.
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(item)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onSelect(item);
                }}
                className="group flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-gray-200 p-5 transition hover:border-brand-500 hover:shadow-md dark:border-navy-700"
              >
                <span className="min-w-0 truncate text-base font-semibold text-navy-700 dark:text-white">
                  {item.title}
                </span>
                <div className="flex shrink-0 items-center gap-1">
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(h.editPath, { state: { id: item.id } });
                      }}
                      aria-label="Editar"
                      className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-navy-700 dark:hover:bg-navy-900 dark:hover:text-white"
                    >
                      <MdEdit className="h-5 w-5" />
                    </button>
                  )}
                  <span className="rounded-lg p-2 text-brand-500 transition group-hover:translate-x-0.5">
                    <MdArrowForward className="h-5 w-5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
