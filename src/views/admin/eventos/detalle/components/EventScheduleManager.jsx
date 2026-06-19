import React from "react";
import { DataStore } from "aws-amplify/datastore";
import { Event } from "models";

// ISO -> value for <input type="datetime-local"> in local time.
const toInput = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate()
  )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/**
 * Multi-day schedule editor for an event: start date + end date.
 * Keeps the legacy `date` field in sync with `startDate` so existing code that
 * still reads `date` (tickets, etc.) keeps working.
 */
export default function EventScheduleManager({ event }) {
  const [start, setStart] = React.useState(() =>
    toInput(event?.startDate || event?.date)
  );
  const [end, setEnd] = React.useState(() => toInput(event?.endDate));
  const [busy, setBusy] = React.useState(false);

  const save = async () => {
    if (start && end && new Date(end) < new Date(start)) {
      alert("La fecha de fin no puede ser anterior a la de inicio.");
      return;
    }
    setBusy(true);
    try {
      await DataStore.save(
        Event.copyOf(event, (u) => {
          u.startDate = start ? new Date(start).toISOString() : null;
          u.endDate = end ? new Date(end).toISOString() : null;
          // keep legacy single date aligned with the start date
          if (start) u.date = new Date(start).toISOString();
        })
      );
      alert("Fechas del evento guardadas con éxito");
    } catch (e) {
      console.error("save schedule error", e);
      alert("Error guardando las fechas.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6 rounded-3xl border border-gray-200 bg-white p-5 dark:!bg-navy-800 dark:text-white">
      <h3 className="mb-1 text-xl font-bold text-navy-700 dark:text-white">
        Fechas del evento (multi-día)
      </h3>
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
        Define un rango de inicio y fin. El registro permanece abierto durante
        esos días.
      </p>
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <label className="mb-1 block text-sm font-semibold">
            Fecha y hora de inicio
          </label>
          <input
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-brand-500 dark:!bg-navy-900"
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-sm font-semibold">
            Fecha y hora de fin
          </label>
          <input
            type="datetime-local"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-brand-500 dark:!bg-navy-900"
          />
        </div>
      </div>
      <button
        type="button"
        onClick={save}
        disabled={busy}
        className="mt-4 rounded-xl bg-brand-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-black disabled:opacity-50"
      >
        {busy ? "Guardando…" : "Guardar fechas"}
      </button>
    </div>
  );
}
