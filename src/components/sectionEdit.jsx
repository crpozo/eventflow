import React from "react";
import { useParams } from "react-router-dom";
import { AiOutlineEye } from "react-icons/ai";
import { usePermissions } from "../providers/PermissionsProvider";

/**
 * Resolves the current event id (from the route param or the cached
 * EVENTFLOW.event) and tells whether the current user may EDIT the given
 * section. Admins and unmanaged users always can; managed users need the
 * `<section>:edit` capability.
 */
export function useCanEditSection(section) {
  const { loading, can } = usePermissions();
  const params = useParams();
  let id = params.id;
  if (!id) {
    try {
      id = JSON.parse(localStorage.getItem("EVENTFLOW.event"))?.id;
    } catch (e) {
      id = undefined;
    }
  }
  // While loading or with no event resolved, don't lock the UI.
  if (loading || !id) return true;
  return can(id, section, "edit");
}

export function ReadOnlyBanner() {
  return (
    <div className="mb-3 flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 dark:!bg-navy-900 dark:text-amber-300">
      <AiOutlineEye className="h-5 w-5 shrink-0" />
      Modo solo lectura: puedes ver esta sección pero no editarla.
    </div>
  );
}

/**
 * Wraps editable content. When the user lacks edit permission for the section,
 * shows a banner and disables every form control inside via a disabled
 * <fieldset> (native inputs, buttons, uploads and the form submit).
 */
export function EditableSection({ section, children }) {
  const canEdit = useCanEditSection(section);
  return (
    <>
      {!canEdit && <ReadOnlyBanner />}
      <fieldset disabled={!canEdit} className="m-0 min-w-0 border-0 p-0">
        {children}
      </fieldset>
    </>
  );
}
