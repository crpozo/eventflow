import React, { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/api";
import { post, del } from "aws-amplify/api";
import { fetchUserAttributes } from "aws-amplify/auth";
import { MdAdd, MdEdit, MdDelete, MdSearch } from "react-icons/md";
import Banner from "./components/Banner";
import UserFormModal from "./components/UserFormModal";
import EventPermissionsManager from "./components/EventPermissionsManager";

const client = generateClient();

// REST API (Amplify) backed by the userManager Lambda. See the function's
// README for the deploy runbook. Until deployed, create/delete show a notice.
const USER_API = "userApi";

const AdminUserManager = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [tree, setTree] = useState([]); // campus -> areas -> events
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null); // { mode, user }

  useEffect(() => {
    (async () => {
      try {
        const { email } = await fetchUserAttributes();
        const res = await client.graphql({
          query: /* GraphQL */ `
            query ($filter: ModelUserFilterInput) {
              listUsers(filter: { and: [{ _deleted: { ne: true } }, $filter] }) {
                items { id email role { id name } }
              }
            }
          `,
          variables: { filter: { email: { eq: email } } },
        });
        setCurrentUser(res.data.listUsers.items[0] || null);
      } catch (err) {
        console.error("Error obteniendo usuario:", err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (currentUser?.role?.name === "Admin") fetchData();
  }, [currentUser]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, rolesRes, campusRes, areasRes, careersRes, eventsRes] =
        await Promise.all([
          client.graphql({
            query: /* GraphQL */ `
              query {
                listUsers(filter: { _deleted: { ne: true } }, limit: 1000) {
                  items { id email name roleID role { id name } campusIDs areaIDs eventIDs }
                }
              }
            `,
          }),
          client.graphql({
            query: /* GraphQL */ `
              query { listRoles(filter: { _deleted: { ne: true } }) { items { id name } } }
            `,
          }),
          client.graphql({
            query: /* GraphQL */ `
              query { listCampuses(filter: { _deleted: { ne: true } }, limit: 1000) { items { id title } } }
            `,
          }),
          client.graphql({
            query: /* GraphQL */ `
              query { listAreas(filter: { _deleted: { ne: true } }, limit: 1000) { items { id title campusID } } }
            `,
          }),
          client.graphql({
            query: /* GraphQL */ `
              query { listCareers(filter: { _deleted: { ne: true } }, limit: 5000) { items { id areaID } } }
            `,
          }),
          client.graphql({
            query: /* GraphQL */ `
              query { listEvents(filter: { _deleted: { ne: true } }, limit: 5000) { items { id title careerID } } }
            `,
          }),
        ]);

      setUsers(usersRes.data.listUsers.items);
      setRoles(rolesRes.data.listRoles.items);

      // Build Campus -> Area -> Event tree (flattening Career).
      const campuses = campusRes.data.listCampuses.items;
      const areas = areasRes.data.listAreas.items;
      const careers = careersRes.data.listCareers.items;
      const events = eventsRes.data.listEvents.items;

      const careerToArea = {};
      careers.forEach((c) => { careerToArea[c.id] = c.areaID; });
      const eventsByArea = {};
      events.forEach((e) => {
        const areaId = careerToArea[e.careerID];
        if (!areaId) return;
        (eventsByArea[areaId] = eventsByArea[areaId] || []).push(e);
      });
      const areasByCampus = {};
      areas.forEach((a) => {
        (areasByCampus[a.campusID] = areasByCampus[a.campusID] || []).push(a);
      });

      const builtTree = campuses
        .map((c) => ({
          id: c.id,
          title: c.title,
          areas: (areasByCampus[c.id] || [])
            .map((a) => ({
              id: a.id,
              title: a.title,
              events: (eventsByArea[a.id] || []).sort((x, y) =>
                (x.title || "").localeCompare(y.title || "")
              ),
            }))
            .sort((x, y) => (x.title || "").localeCompare(y.title || "")),
        }))
        .sort((x, y) => (x.title || "").localeCompare(y.title || ""));
      setTree(builtTree);
    } catch (err) {
      console.error("Error fetching data:", err);
      alert("Error cargando datos. ¿Ya hiciste 'amplify push' con los campos nuevos de User?");
    } finally {
      setIsLoading(false);
    }
  };

  // ── User persistence ────────────────────────────────────────────────────
  const getUserVersion = async (id) => {
    const r = await client.graphql({
      query: /* GraphQL */ `query ($id: ID!) { getUser(id: $id) { _version } }`,
      variables: { id },
    });
    return r.data.getUser?._version;
  };

  const saveExistingUser = async (data) => {
    const _version = await getUserVersion(data.id);
    await client.graphql({
      query: /* GraphQL */ `
        mutation ($input: UpdateUserInput!) {
          updateUser(input: $input) { id }
        }
      `,
      variables: {
        input: {
          id: data.id,
          name: data.name,
          roleID: data.roleID,
          campusIDs: data.campusIDs,
          areaIDs: data.areaIDs,
          eventIDs: data.eventIDs,
          _version,
        },
      },
    });
  };

  // The userApi REST endpoint (userManager Lambda) may not be deployed yet.
  const isApiMissing = (err) =>
    /API name is invalid|No API named|not configured|does not exist/i.test(
      String(err?.message || err)
    );

  const createUser = async (data) => {
    // 1) Cognito account (sends the invite email). If the function isn't
    //    deployed yet, fall back to creating just the record so the page works.
    let loginCreated = false;
    try {
      const op = post({
        apiName: USER_API,
        path: "/users",
        options: { body: { email: data.email, name: data.name } },
      });
      await op.response;
      loginCreated = true;
    } catch (err) {
      if (!isApiMissing(err)) throw err; // real error (e.g. email already exists)
    }
    // 2) User record via GraphQL (keeps DataStore versioning correct). The app
    //    links the login to this record by email.
    await client.graphql({
      query: /* GraphQL */ `
        mutation ($input: CreateUserInput!) { createUser(input: $input) { id } }
      `,
      variables: {
        input: {
          email: data.email,
          name: data.name,
          roleID: data.roleID,
          campusIDs: data.campusIDs,
          areaIDs: data.areaIDs,
          eventIDs: data.eventIDs,
        },
      },
    });
    return loginCreated;
  };

  const handleSubmit = async (data) => {
    try {
      if (modal.mode === "edit") {
        await saveExistingUser(data);
        setModal(null);
        await fetchData();
        alert("Usuario actualizado.");
      } else {
        const loginCreated = await createUser(data);
        setModal(null);
        await fetchData();
        alert(
          loginCreated
            ? "Usuario creado e invitado por correo."
            : "Usuario creado con su rol y permisos.\n\nLa cuenta de acceso (login) se generará cuando despliegues la función 'userManager' (Cognito)."
        );
      }
    } catch (err) {
      console.error("save user error:", err);
      alert("No se pudo guardar: " + (err?.message || err));
    }
  };

  const handleDelete = async (u) => {
    if (u.id === currentUser?.id) {
      alert("No puedes eliminar tu propio usuario.");
      return;
    }
    if (!window.confirm(`¿Eliminar al usuario ${u.email}?`)) return;
    try {
      // 1) Cognito account (idempotent). If the function isn't deployed yet,
      //    skip it and still remove the record.
      try {
        const op = del({ apiName: USER_API, path: `/users/${encodeURIComponent(u.email)}` });
        await op.response;
      } catch (err) {
        if (!isApiMissing(err)) throw err;
      }
      // 2) User record.
      const _version = await getUserVersion(u.id);
      await client.graphql({
        query: /* GraphQL */ `
          mutation ($input: DeleteUserInput!) { deleteUser(input: $input) { id } }
        `,
        variables: { input: { id: u.id, _version } },
      });
      await fetchData();
      alert("Usuario eliminado.");
    } catch (err) {
      console.error("delete user error:", err);
      alert("No se pudo eliminar: " + (err?.message || err));
    }
  };

  const permSummary = (u) => {
    if (u.role?.name === "Admin") return "Acceso completo";
    const c = (u.campusIDs || []).filter(Boolean).length;
    const a = (u.areaIDs || []).filter(Boolean).length;
    const e = (u.eventIDs || []).filter(Boolean).length;
    if (!c && !a && !e) return "Sin permisos";
    return [c && `${c} campus`, a && `${a} áreas`, e && `${e} eventos`]
      .filter(Boolean)
      .join(" · ");
  };

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = !q
      ? users
      : users.filter(
          (u) =>
            (u.email || "").toLowerCase().includes(q) ||
            (u.name || "").toLowerCase().includes(q) ||
            (u.role?.name || "").toLowerCase().includes(q)
        );
    return [...list].sort((a, b) => {
      const ra = a.role?.name || "zzz";
      const rb = b.role?.name || "zzz";
      if (ra === "Admin" && rb !== "Admin") return -1;
      if (rb === "Admin" && ra !== "Admin") return 1;
      return (a.email || "").localeCompare(b.email || "");
    });
  }, [users, search]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] w-full flex-col items-center justify-center p-3">
        <span className="loader"></span>
        <h2 className="mt-4 text-center text-xl">Cargando permisos...</h2>
      </div>
    );
  }

  if (!currentUser || currentUser.role?.name !== "Admin") {
    return (
      <div className="mt-5 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-xl border border-red-200 p-6 text-center shadow-sm">
          <h2 className="mb-2 text-xl font-semibold text-brand-500">Acceso denegado</h2>
          <p>No tienes permisos para acceder a esta sección.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-manager-page">
      <div className="grid h-full">
        <Banner />
      </div>

      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold">Gestión de usuarios y permisos</h2>
          <button
            onClick={() => setModal({ mode: "create", user: null })}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-black"
          >
            <MdAdd className="h-5 w-5" /> Crear usuario
          </button>
        </div>

        <div className="mb-4 flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 dark:border-navy-700">
          <MdSearch className="h-5 w-5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por email, nombre o rol…"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>

        <div className="mb-10 overflow-hidden rounded-xl border border-gray-200 shadow-sm dark:border-navy-700">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#f8f9fb] dark:!bg-navy-900">
              <tr>
                <th className="border-b border-gray-200 p-3 dark:border-navy-700">Email</th>
                <th className="border-b border-gray-200 p-3 dark:border-navy-700">Nombre</th>
                <th className="border-b border-gray-200 p-3 dark:border-navy-700">Rol</th>
                <th className="border-b border-gray-200 p-3 dark:border-navy-700">Permisos</th>
                <th className="border-b border-gray-200 p-3 text-right dark:border-navy-700">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:!bg-navy-800">
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-gray-100 last:border-b-0 dark:border-navy-700">
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">{u.name || "—"}</td>
                  <td className="p-3">{u.role?.name || "Sin rol"}</td>
                  <td className="p-3 text-gray-600 dark:text-gray-300">{permSummary(u)}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setModal({ mode: "edit", user: u })}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium hover:bg-gray-50 dark:border-navy-700 dark:hover:bg-navy-900"
                      >
                        <MdEdit className="h-4 w-4" /> Editar
                      </button>
                      <button
                        onClick={() => handleDelete(u)}
                        disabled={u.id === currentUser?.id}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-40"
                      >
                        <MdDelete className="h-4 w-4" /> Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-400">
                    No hay usuarios que coincidan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Per-event section permissions (Ver/Editar) */}
        <EventPermissionsManager />
      </div>

      {modal && (
        <UserFormModal
          mode={modal.mode}
          user={modal.user}
          roles={roles}
          tree={tree}
          onSubmit={handleSubmit}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
};

export default AdminUserManager;
