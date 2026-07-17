import React from "react";
import { Link } from "react-router-dom";
import NftCard from "components/card/NftCard";
import { DataStore } from "aws-amplify/datastore";
import { Campus } from "models";
import { MdAdd } from "react-icons/md";
import { usePermissions } from "../../providers/PermissionsProvider";
import { PageHeader, Card, PrimaryButton, PageLoader } from "components/adminUi";

/**
 * Campus list with realtime updates from DataStore.
 * - Proper loading/empty/error states
 * - Uses observeQuery to stay in sync
 * - Stable, memoized sorting by updatedAt desc
 */
const CampusComponent = () => {
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const { isAdmin, campusIDsAllowed } = usePermissions();

  React.useEffect(() => {
    let mounted = true;

    // Use observeQuery to get realtime updates + initial list
    const sub = DataStore.observeQuery(Campus).subscribe({
      next: ({ items, isSynced }) => {
        if (!mounted) return;
        setItems(items || []);
        // Mark loading false when we have at least one emission
        if (isSynced || items) setLoading(false);
      },
      error: (err) => {
        if (!mounted) return;
        setError(err);
        setLoading(false);
      },
    });

    return () => {
      mounted = false;
      sub.unsubscribe();
    };
  }, []);

  // Memoize sorted list (newest first), filtered by the user's allowed campuses
  // (admins / legacy users see all).
  const sorted = React.useMemo(() => {
    const visible =
      isAdmin || campusIDsAllowed == null
        ? items
        : items.filter((c) => campusIDsAllowed.includes(c.id));
    return [...visible].sort((a, b) => {
      const aDate = a?.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bDate = b?.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return bDate - aDate;
    });
  }, [items, isAdmin, campusIDsAllowed]);

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="campus-page mt-3">
      <PageHeader
        crumbs={[{ label: "Estructura" }]}
        title="Estructura"
        subtitle="Campus de la organización: selecciona uno para ver sus áreas."
        actions={
          <Link className="hover:no-underline" to="crear" aria-label="Crear campus">
            <PrimaryButton type="button" className="flex items-center gap-1.5">
              <MdAdd className="h-4 w-4" /> Crear Campus
            </PrimaryButton>
          </Link>
        }
      />

      <Card title="Campus institucionales">
        {error && (
          <p className="text-sm text-red-600">
            No se pudieron cargar los campus. {String(error?.message || error)}
          </p>
        )}

        {!error && sorted.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-10">
            <p className="text-sm text-gray-500">Aún no hay campus.</p>
            <Link className="hover:no-underline" to="crear">
              <PrimaryButton type="button">Crear el primer campus</PrimaryButton>
            </Link>
          </div>
        )}

        {!error && sorted.length > 0 && (
          <ul
            className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4 3xl:grid-cols-4"
            aria-label="Campus list"
          >
            {sorted.map((c) => (
              <NftCard
                key={c.id}
                modelName="campus"
                modelID={c.id}
                model={c}
                pathSelect="area/"
                pathEdit="editar/"
                color="bg-lightGray"
                date={c.updatedAt}
                title={c.title}
                cat="Seleccionar"
                role="listitem"
              />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};

export default CampusComponent;
