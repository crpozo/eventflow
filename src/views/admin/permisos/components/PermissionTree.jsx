import React from "react";
import { MdChevronRight, MdExpandMore } from "react-icons/md";

/**
 * Hierarchical Campus -> Area -> Event permission picker with inheritance.
 *
 * value = { campusIDs: [], areaIDs: [], eventIDs: [] }
 * - Granting a campus implies all its areas and events (children shown checked
 *   + disabled / "heredado").
 * - Granting an area implies all its events.
 * - Otherwise individual events can be granted.
 *
 * `tree` = [{ id, title, areas: [{ id, title, events: [{ id, title }] }] }]
 */
export default function PermissionTree({ tree, value, onChange }) {
  const campusIDs = value?.campusIDs || [];
  const areaIDs = value?.areaIDs || [];
  const eventIDs = value?.eventIDs || [];
  const [expanded, setExpanded] = React.useState({});

  const toggleExpand = (key) =>
    setExpanded((p) => ({ ...p, [key]: !p[key] }));

  const toggleIn = (list, id) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...new Set([...list, id])];

  const set = (patch) => onChange({ campusIDs, areaIDs, eventIDs, ...patch });

  return (
    <div className="rounded-xl border border-gray-200 dark:border-navy-700">
      {tree.length === 0 && (
        <p className="p-4 text-sm text-gray-500">No hay campus/áreas/eventos.</p>
      )}
      {tree.map((campus) => {
        const campusOn = campusIDs.includes(campus.id);
        const open = expanded[campus.id];
        return (
          <div key={campus.id} className="border-b border-gray-100 dark:border-navy-700 last:border-b-0">
            <div className="flex items-center gap-2 px-3 py-2">
              <button
                type="button"
                onClick={() => toggleExpand(campus.id)}
                className="text-gray-500 hover:text-navy-700 dark:hover:text-white"
                aria-label="expandir"
              >
                {open ? <MdExpandMore className="h-5 w-5" /> : <MdChevronRight className="h-5 w-5" />}
              </button>
              <label className="flex flex-1 cursor-pointer items-center gap-2 font-semibold">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-brand-500"
                  checked={campusOn}
                  onChange={() => set({ campusIDs: toggleIn(campusIDs, campus.id) })}
                />
                {campus.title || "Campus"}
                <span className="text-xs font-normal text-gray-400">
                  ({campus.areas.length} áreas)
                </span>
              </label>
            </div>

            {open && (
              <div className="ml-7 border-l border-gray-100 dark:border-navy-700">
                {campus.areas.map((area) => {
                  const areaInherited = campusOn;
                  const areaOn = areaInherited || areaIDs.includes(area.id);
                  const areaOpen = expanded[`a-${area.id}`];
                  return (
                    <div key={area.id} className="border-b border-gray-50 dark:border-navy-800 last:border-b-0">
                      <div className="flex items-center gap-2 px-3 py-1.5">
                        <button
                          type="button"
                          onClick={() => toggleExpand(`a-${area.id}`)}
                          className="text-gray-400 hover:text-navy-700 dark:hover:text-white"
                          aria-label="expandir"
                        >
                          {areaOpen ? <MdExpandMore className="h-4 w-4" /> : <MdChevronRight className="h-4 w-4" />}
                        </button>
                        <label className="flex flex-1 cursor-pointer items-center gap-2 text-sm font-medium">
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-brand-500"
                            checked={areaOn}
                            disabled={areaInherited}
                            onChange={() => set({ areaIDs: toggleIn(areaIDs, area.id) })}
                          />
                          {area.title || "Área"}
                          {areaInherited && (
                            <span className="text-xs text-gray-400">(heredado)</span>
                          )}
                          <span className="text-xs font-normal text-gray-400">
                            ({area.events.length} eventos)
                          </span>
                        </label>
                      </div>

                      {areaOpen && (
                        <div className="ml-7 border-l border-gray-50 dark:border-navy-800">
                          {area.events.length === 0 && (
                            <p className="px-3 py-1.5 text-xs text-gray-400">Sin eventos</p>
                          )}
                          {area.events.map((ev) => {
                            const evInherited = campusOn || areaIDs.includes(area.id);
                            const evOn = evInherited || eventIDs.includes(ev.id);
                            return (
                              <label
                                key={ev.id}
                                className="flex cursor-pointer items-center gap-2 px-3 py-1 text-sm"
                              >
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 accent-brand-500"
                                  checked={evOn}
                                  disabled={evInherited}
                                  onChange={() => set({ eventIDs: toggleIn(eventIDs, ev.id) })}
                                />
                                {ev.title || "Evento"}
                                {evInherited && (
                                  <span className="text-xs text-gray-400">(heredado)</span>
                                )}
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
