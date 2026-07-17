import React, { useEffect, useState } from "react";
import { generateClient, post, del } from "aws-amplify/api";
import { DataStore } from "aws-amplify/datastore";
import { User } from "models";
import { fetchUserAttributes } from "aws-amplify/auth";
import { MdAdd, MdEdit, MdDelete, MdSearch, MdOutlineMail } from "react-icons/md";
import { PageHeader, Card, PrimaryButton, TYPE, PageLoader } from "components/adminUi";
import UserFormModal from "./components/UserFormModal";
import EventPermissionsManager from "./components/EventPermissionsManager";

const client = generateClient();

// REST API (Amplify) backed by the userManager Lambda. See the function's
// README for the deploy runbook. Until deployed, create/delete show a notice.
const USER_API = "userApi";

// The userApi REST endpoint (userManager Lambda) may not be deployed yet.
const isApiMissing = (err) =>
  /API name is invalid|No API named|not configured|does not exist/i.test(
    String(err?.message || err)
  );

// Cognito already has a login for this email (AdminCreateUser -> 409
// UsernameExistsException). Not a failure: reuse the existing login.
const isUserExists = (err) => {
  const status =
    err?.response?.statusCode ??
    err?.$metadata?.httpStatusCode ??
    err?.statusCode;
  return (
    status === 409 ||
    /409|UsernameExists|already exists|ya existe/i.test(
      `${err?.message || ""} ${err?.name || ""}`
    )
  );
};

// Orden alfabético por título (tolerante a títulos vacíos).
const byTitle = (x, y) => (x.title || "").localeCompare(y.title || "");

// Construye el árbol Campus -> Área -> Evento (aplanando Career).
const buildTree = (campuses, areas, careers, events) => {
  const careerToArea = {};
  careers.forEach((c) => { careerToArea[c.id] = c.areaID; });

  const eventsByArea = {};
  events.forEach((e) => {
    const areaId = careerToArea[e.careerID];
    if (!areaId) return;
    eventsByArea[areaId] = eventsByArea[areaId] || [];
    eventsByArea[areaId].push(e);
  });

  const areasByCampus = {};
  areas.forEach((a) => {
    areasByCampus[a.campusID] = areasByCampus[a.campusID] || [];
    areasByCampus[a.campusID].push(a);
  });

  return campuses
    .map((c) => ({
      id: c.id,
      title: c.title,
      areas: (areasByCampus[c.id] || [])
        .map((a) => ({
          id: a.id,
          title: a.title,
          events: (eventsByArea[a.id] || []).sort(byTitle),
        }))
        .sort(byTitle),
    }))
    .sort(byTitle);
};

// Mensaje de éxito según cómo quedó la cuenta de acceso (login) en Cognito.
const createdUserMessage = ({ loginStatus, tempPassword }, email) => {
  if (loginStatus === "created") return "Usuario creado e invitado por correo.";
  if (loginStatus === "created-noemail")
    return `Usuario creado, pero NO se pudo enviar el correo de invitación.\n\nComparte esta contraseña temporal manualmente con ${email}:\n\n${tempPassword || "(no disponible)"}\n\nDeberá cambiarla en el primer inicio de sesión.`;
  if (loginStatus === "exists")
    return "Usuario creado. Ya existía una cuenta de acceso para ese correo; se reutilizó (no se reenvió invitación).";
  return "Usuario creado con su rol y permisos.\n\nLa cuenta de acceso (login) se generará cuando despliegues la función 'userManager' (Cognito).";
};

// Mensaje según la respuesta del backend al reenviar la invitación.
const resendResultMessage = (result, email) => {
  if (result.emailSent) return `Instrucciones de acceso reenviadas a ${email}.`;
  if (result.withTempPassword && result.tempPassword)
    return `No se pudo enviar el correo. Comparte esta contraseña temporal manualmente con ${email}:\n\n${result.tempPassword}\n\nDeberá cambiarla en el primer inicio de sesión.`;
  return (
    "No se pudo reenviar el correo." +
    (result.emailError ? "\n\n" + result.emailError : "")
  );
};

// Detalle del error al reenviar: cuerpo del error o diagnóstico de deploy.
const resendErrorDetail = async (err) => {
  let msg = "";
  try {
    const d = await err?.response?.body?.json?.();
    msg = d?.error || "";
  } catch (parseErr) {
    console.error("No se pudo leer el cuerpo del error:", parseErr);
  }
  if (msg) return msg;
  const status = err?.response?.statusCode;
  if (status === 404 || /unknown error/i.test(String(err?.message || "")))
    return "El endpoint /users no está desplegado en el API Gateway. Corre 'amplify push' (despliega userManager + userApi).";
  if (isApiMissing(err))
    return "La función de acceso (userManager) aún no está desplegada.";
  return msg;
};

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
      const [userList, rolesRes, campusRes, areasRes, careersRes, eventsRes] =
        await Promise.all([
          DataStore.query(User),
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

      const roleItems = rolesRes.data.listRoles.items;
      const roleById = {};
      roleItems.forEach((r) => { roleById[r.id] = r; });
      setUsers(
        userList.map((u) => ({
          id: u.id,
          email: u.email,
          name: u.name,
          roleID: u.roleID,
          role: roleById[u.roleID] || null,
          campusIDs: u.campusIDs || [],
          areaIDs: u.areaIDs || [],
          eventIDs: u.eventIDs || [],
        }))
      );
      setRoles(roleItems);

      // Build Campus -> Area -> Event tree (flattening Career).
      setTree(
        buildTree(
          campusRes.data.listCampuses.items,
          areasRes.data.listAreas.items,
          careersRes.data.listCareers.items,
          eventsRes.data.listEvents.items
        )
      );
    } catch (err) {
      console.error("Error fetching data:", err);
      alert("Error cargando datos. ¿Ya hiciste 'amplify push' con los campos nuevos de User?");
    } finally {
      setIsLoading(false);
    }
  };

  // ── User persistence (via DataStore so versioning + subscriptions stay
  //    consistent with the rest of the app) ─────────────────────────────────
  const saveExistingUser = async (data) => {
    const existing = await DataStore.query(User, data.id);
    if (!existing) throw new Error("Usuario no encontrado");
    await DataStore.save(
      User.copyOf(existing, (u) => {
        u.name = data.name;
        u.roleID = data.roleID;
        u.campusIDs = data.campusIDs;
        u.areaIDs = data.areaIDs;
        u.eventIDs = data.eventIDs;
      })
    );
  };

  const createUser = async (data) => {
    // 1) Cognito account (sends the invite email).
    //    - function not deployed yet  -> create just the record.
    //    - login already exists (409) -> reuse it, still create the record.
    let loginStatus = "none"; // "created" | "created-noemail" | "exists" | "none"
    let tempPassword;
    try {
      const op = post({
        apiName: USER_API,
        path: "/users",
        options: { body: { email: data.email, name: data.name } },
      });
      const { body } = await op.response;
      const result = await body.json().catch(() => ({}));
      if (result?.emailSent === false) {
        // Cognito user exists but the SES invite failed -> the temp password
        // comes back so the admin can relay it manually (don't claim success).
        loginStatus = "created-noemail";
        tempPassword = result.tempPassword;
      } else {
        loginStatus = "created";
      }
    } catch (err) {
      if (isUserExists(err)) loginStatus = "exists";
      else if (!isApiMissing(err)) throw err; // real error
    }
    // 2) User record via DataStore. The app links the login to it by email.
    await DataStore.save(
      new User({
        email: data.email,
        name: data.name,
        roleID: data.roleID,
        campusIDs: data.campusIDs,
        areaIDs: data.areaIDs,
        eventIDs: data.eventIDs,
      })
    );
    return { loginStatus, tempPassword };
  };

  const handleSubmit = async (data) => {
    try {
      if (modal.mode === "edit") {
        await saveExistingUser(data);
        setModal(null);
        await fetchData();
        alert("Usuario actualizado.");
      } else {
        const created = await createUser(data);
        setModal(null);
        await fetchData();
        alert(createdUserMessage(created, data.email));
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
      const existing = await DataStore.query(User, u.id);
      if (existing) await DataStore.delete(existing);
      await fetchData();
      alert("Usuario eliminado.");
    } catch (err) {
      console.error("delete user error:", err);
      alert("No se pudo eliminar: " + (err?.message || err));
    }
  };

  // Resend the login instructions email to an existing user. The backend
  // resets a fresh temp password if they never logged in, else sends a reminder.
  const handleResend = async (u) => {
    if (!window.confirm(`¿Reenviar las instrucciones de acceso a ${u.email}?`))
      return;
    try {
      const op = post({
        apiName: USER_API,
        path: "/users",
        options: { body: { email: u.email, name: u.name, resend: true } },
      });
      const { body } = await op.response;
      const result = await body.json().catch(() => ({}));
      alert(resendResultMessage(result, u.email));
    } catch (err) {
      const msg = await resendErrorDetail(err);
      console.error("resend error:", err);
      alert("No se pudo reenviar el correo." + (msg ? "\n\n" + msg : ""));
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
    return <PageLoader label="Cargando permisos…" />;
  }

  if (!currentUser || currentUser.role?.name !== "Admin") {
    return (
      <div className="mt-5 flex items-center justify-center px-4">
        <Card title="Acceso denegado" className="w-full max-w-md">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            No tienes permisos para acceder a esta sección.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="admin-manager-page mt-3">
      <PageHeader
        crumbs={[{ label: "Permisos" }]}
        title="Permisos"
        subtitle="Usuarios, roles y accesos por evento."
        actions={
          <PrimaryButton
            onClick={() => setModal({ mode: "create", user: null })}
            className="flex items-center gap-1.5"
          >
            <MdAdd className="h-5 w-5" /> Crear usuario
          </PrimaryButton>
        }
      />

      <Card
        title="Usuarios"
        subtitle="Cuentas del panel, su rol y el alcance de sus permisos."
      >
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 dark:border-white/10 dark:bg-navy-900">
          <MdSearch className="h-5 w-5 shrink-0 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por email, nombre o rol…"
            className="w-full bg-transparent text-sm text-navy-700 outline-none dark:text-white"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                className={`border-b border-gray-200 text-left dark:border-navy-700 ${TYPE.th}`}
              >
                <th className="py-2 pr-3">Email</th>
                <th className="py-2 pr-3">Nombre</th>
                <th className="py-2 pr-3">Rol</th>
                <th className="py-2 pr-3">Permisos</th>
                <th className="py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-gray-100 last:border-b-0 dark:border-navy-700"
                >
                  <td className={`py-2.5 pr-3 ${TYPE.td}`}>{u.email}</td>
                  <td className={`py-2.5 pr-3 ${TYPE.td}`}>{u.name || "—"}</td>
                  <td className={`py-2.5 pr-3 ${TYPE.td}`}>
                    {u.role?.name || "Sin rol"}
                  </td>
                  <td className="py-2.5 pr-3 text-sm text-gray-600 dark:text-gray-300">
                    {permSummary(u)}
                  </td>
                  <td className="py-2.5">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setModal({ mode: "edit", user: u })}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-navy-700 transition hover:bg-gray-50 dark:border-navy-700 dark:text-white dark:hover:bg-navy-900"
                      >
                        <MdEdit className="h-4 w-4" /> Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResend(u)}
                        title="Reenviar instrucciones de acceso por correo"
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-navy-700 transition hover:bg-gray-50 dark:border-navy-700 dark:text-white dark:hover:bg-navy-900"
                      >
                        <MdOutlineMail className="h-4 w-4" /> Reenviar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(u)}
                        disabled={u.id === currentUser?.id}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-40 dark:border-red-900/40"
                      >
                        <MdDelete className="h-4 w-4" /> Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-sm text-gray-400">
                    No hay usuarios que coincidan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Per-event section permissions (Ver/Editar) */}
      <EventPermissionsManager />

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
