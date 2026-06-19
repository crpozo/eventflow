import React from "react";
import { useParams } from "react-router-dom";
import { AiOutlineWarning } from "react-icons/ai";
import { usePermissions } from "../providers/PermissionsProvider";

/**
 * Gates an event sub-section (detalle, landing, formulario, gafete,
 * participantes) by the current user's per-event permissions.
 *
 * - Admins and "unmanaged" users (no EventPermission rows) pass through
 *   (legacy area-based behavior).
 * - Managed users must have the `<section>:view` capability for this event,
 *   otherwise they get an access-denied message. This also closes the previous
 *   gap where any authenticated user could open an event by URL/localStorage.
 */
export default function EventSectionGuard({ section, children }) {
  const { loading, can } = usePermissions();
  const { id } = useParams();

  if (loading) return null;

  if (id && !can(id, section, "view")) {
    return (
      <div className="!z-5 relative mt-3 flex flex-col items-center gap-2 rounded-[20px] bg-white px-[25px] py-[40px] text-center shadow-card dark:!bg-navy-800 dark:text-white">
        <AiOutlineWarning className="h-8 w-8 text-red-500" />
        <h2 className="text-xl font-bold">Acceso denegado</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          No tienes permiso para ver esta sección de este evento. Contacta a un
          administrador.
        </p>
      </div>
    );
  }

  return children;
}
