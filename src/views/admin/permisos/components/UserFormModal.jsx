import React from "react";
import { MdClose } from "react-icons/md";
import PermissionTree from "./PermissionTree";

// Validación mínima de email: algo@algo.algo en cualquier parte del texto.
// Clases negadas (equivalentes al '.' de /.+@.+\..+/) para evitar el
// backtracking super-lineal del regex original.
const EMAIL_RE =
  /[^\n\r\u2028\u2029]@[^\n\r\u2028\u2029][^.\n\r\u2028\u2029]*\.[^\n\r\u2028\u2029]/;

/**
 * Create / edit user modal. Collects email, name, role and the hierarchical
 * permissions, then calls onSubmit(data). The parent owns the API calls.
 */
export default function UserFormModal({ mode, user, roles, tree, onSubmit, onClose }) {
  const isEdit = mode === "edit";
  const [email, setEmail] = React.useState(user?.email || "");
  const [name, setName] = React.useState(user?.name || "");
  const [roleID, setRoleID] = React.useState(user?.roleID || "");
  const [perms, setPerms] = React.useState({
    campusIDs: (user?.campusIDs || []).filter(Boolean),
    areaIDs: (user?.areaIDs || []).filter(Boolean),
    eventIDs: (user?.eventIDs || []).filter(Boolean),
  });
  const [busy, setBusy] = React.useState(false);

  const roleName = roles.find((r) => r.id === roleID)?.name;
  const isAdminRole = roleName === "Admin";
  const submitLabel = isEdit ? "Guardar cambios" : "Crear usuario";

  const submit = async () => {
    if (!isEdit && !EMAIL_RE.test(email)) {
      alert("Ingresa un email válido.");
      return;
    }
    if (!roleID) {
      alert("Selecciona un rol.");
      return;
    }
    setBusy(true);
    try {
      await onSubmit({
        id: user?.id,
        email: email.trim().toLowerCase(),
        name: name.trim(),
        roleID,
        // Admin has full access; don't persist (now-stale) granular permissions.
        campusIDs: isAdminRole ? [] : perms.campusIDs,
        areaIDs: isAdminRole ? [] : perms.areaIDs,
        eventIDs: isAdminRole ? [] : perms.eventIDs,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className="my-8 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl dark:!bg-navy-800 dark:text-white">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold">
            {isEdit ? "Editar usuario" : "Crear usuario"}
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-navy-700 dark:hover:text-white">
            <MdClose className="h-6 w-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="user-form-email" className="mb-1 block text-sm font-semibold">Email</label>
            <input
              id="user-form-email"
              type="email"
              value={email}
              disabled={isEdit}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="persona@usfq.edu.ec"
              className="w-full rounded-xl border border-gray-200 p-3 text-sm outline-none disabled:bg-gray-100 dark:!bg-navy-900 dark:disabled:bg-navy-900/50"
            />
          </div>
          <div>
            <label htmlFor="user-form-name" className="mb-1 block text-sm font-semibold">Nombre</label>
            <input
              id="user-form-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre y apellido"
              className="w-full rounded-xl border border-gray-200 p-3 text-sm outline-none dark:!bg-navy-900"
            />
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="user-form-role" className="mb-1 block text-sm font-semibold">Rol</label>
          <select
            id="user-form-role"
            value={roleID}
            onChange={(e) => setRoleID(e.target.value)}
            className="w-full rounded-xl border border-gray-200 p-3 text-sm outline-none dark:!bg-navy-900"
          >
            <option value="">Selecciona un rol…</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        <div className="mt-4">
          <span className="mb-1 block text-sm font-semibold">
            Permisos (campus → área → evento)
          </span>
          {isAdminRole ? (
            <p className="rounded-xl bg-gray-50 p-3 text-sm text-gray-600 dark:!bg-navy-900 dark:text-gray-300">
              El rol Admin tiene acceso completo; no requiere asignación.
            </p>
          ) : (
            <PermissionTree tree={tree} value={perms} onChange={setPerms} />
          )}
        </div>

        {!isEdit && (
          <p className="mt-3 text-xs text-gray-500">
            Se creará la cuenta de acceso (Cognito) y se enviará una invitación
            por correo con una contraseña temporal.
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium hover:bg-gray-50 dark:border-navy-700 dark:hover:bg-navy-900"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-black disabled:opacity-50"
          >
            {busy ? "Guardando…" : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
