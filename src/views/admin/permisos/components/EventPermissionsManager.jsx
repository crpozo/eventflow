import React from "react";
import { DataStore } from "aws-amplify/datastore";
import { Event, User, EventPermission } from "models";

const SECTIONS = [
  { key: "detalle", label: "Detalle" },
  { key: "landing", label: "Landing" },
  { key: "formulario", label: "Formulario" },
  { key: "gafete", label: "Diseño Gafete" },
  { key: "participantes", label: "Participantes" },
];
const ACTIONS = [
  { key: "view", label: "Ver" },
  { key: "edit", label: "Editar" },
];

/**
 * Admin tool: configure, per user + per event, which sections they can
 * View / Edit. Stored as 'section:action' tokens on EventPermission.
 *
 * Note: as soon as a user has ANY EventPermission row, they become "managed"
 * and can only access events/sections explicitly granted here.
 */
export default function EventPermissionsManager() {
  const [users, setUsers] = React.useState([]);
  const [events, setEvents] = React.useState([]);
  const [userId, setUserId] = React.useState("");
  const [eventId, setEventId] = React.useState("");
  const [caps, setCaps] = React.useState(new Set());
  const [existing, setExisting] = React.useState(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const [u, e] = await Promise.all([
        DataStore.query(User),
        DataStore.query(Event),
      ]);
      setUsers(
        u.slice().sort((a, b) => (a.email || "").localeCompare(b.email || ""))
      );
      setEvents(
        e.slice().sort((a, b) => (a.title || "").localeCompare(b.title || ""))
      );
    })();
  }, []);

  // Load existing permission whenever the user+event selection changes.
  React.useEffect(() => {
    if (!userId || !eventId) {
      setExisting(null);
      setCaps(new Set());
      return;
    }
    let active = true;
    (async () => {
      const rows = await DataStore.query(EventPermission, (p) =>
        p.and((c) => [c.userID.eq(userId), c.eventID.eq(eventId)])
      );
      if (!active) return;
      const rec = rows[0] || null;
      setExisting(rec);
      setCaps(new Set((rec?.capabilities || []).filter(Boolean)));
    })();
    return () => {
      active = false;
    };
  }, [userId, eventId]);

  const toggle = (section, action) => {
    setCaps((prev) => {
      const next = new Set(prev);
      const token = `${section}:${action}`;
      if (next.has(token)) {
        next.delete(token);
        // removing view also removes edit (can't edit without view)
        if (action === "view") next.delete(`${section}:edit`);
      } else {
        next.add(token);
        // editing implies viewing
        if (action === "edit") next.add(`${section}:view`);
      }
      return next;
    });
  };

  const save = async () => {
    if (!userId || !eventId) {
      alert("Selecciona un usuario y un evento.");
      return;
    }
    setBusy(true);
    try {
      const capabilities = Array.from(caps);
      if (existing) {
        await DataStore.save(
          EventPermission.copyOf(existing, (u) => {
            u.capabilities = capabilities;
          })
        );
      } else {
        await DataStore.save(
          new EventPermission({ userID: userId, eventID: eventId, capabilities })
        );
      }
      alert("Permisos del evento guardados con éxito");
    } catch (e) {
      console.error("save event permission error", e);
      alert("Error guardando los permisos.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-8">
      <h2 className="mb-1 text-2xl font-bold text-navy-700 dark:text-white">
        Permisos por evento
      </h2>
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
        Configura, por usuario y evento, qué secciones puede ver y editar. Al
        asignar cualquier permiso por evento a un usuario, este pasa a modo
        "gestionado": solo verá los eventos y secciones que le otorgues aquí.
      </p>

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-semibold">Usuario</label>
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full rounded-xl border border-gray-200 p-3 text-sm outline-none dark:!bg-navy-900"
          >
            <option value="">Selecciona un usuario…</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.email}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">Evento</label>
          <select
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="w-full rounded-xl border border-gray-200 p-3 text-sm outline-none dark:!bg-navy-900"
          >
            <option value="">Selecciona un evento…</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {userId && eventId && (
        <>
          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:!bg-navy-900">
                <tr>
                  <th className="p-3 text-left font-semibold">Sección</th>
                  {ACTIONS.map((a) => (
                    <th key={a.key} className="p-3 text-center font-semibold">
                      {a.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SECTIONS.map((s) => (
                  <tr key={s.key} className="border-t border-gray-200">
                    <td className="p-3">{s.label}</td>
                    {ACTIONS.map((a) => (
                      <td key={a.key} className="p-3 text-center">
                        <input
                          type="checkbox"
                          className="h-5 w-5 accent-brand-500"
                          checked={caps.has(`${s.key}:${a.key}`)}
                          onChange={() => toggle(s.key, a.key)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={save}
            disabled={busy}
            className="mt-4 rounded-xl bg-brand-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-black disabled:opacity-50"
          >
            {busy ? "Guardando…" : "Guardar permisos del evento"}
          </button>
        </>
      )}
    </div>
  );
}
