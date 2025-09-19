import React from "react";
import { Link } from "react-router-dom";
import Banner from "./components/Banner";
import NftCard from "components/card/NftCard";
import { DataStore } from "aws-amplify/datastore";
import { Campus } from "models";
import { MdAdd } from "react-icons/md";

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

  // Memoize sorted list (newest first)
  const sorted = React.useMemo(() => {
    return [...items].sort((a, b) => {
      const aDate = a?.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bDate = b?.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return bDate - aDate;
    });
  }, [items]);

  return (
    <div className="campus-page">
      <div className="grid h-full">
        <Banner />
      </div>

      <div className="relative flex flex-col bg-white bg-clip-border shadow-card px-[25px] py-[25px] rounded-[20px] dark:!bg-navy-800 dark:text-white dark:shadow-none overflow-hidden">
        {/* Header */}
        <div className="flex flex-col items-center justify-between gap-3 mb-4 sm:flex-row sm:gap-0">
          <p className="text-2xl font-medium text-navy-700 dark:text-white">
            Campus institucionales
          </p>

          <Link className="hover:no-underline" to="crear" aria-label="Crear campus">
            <button
              type="button"
              className="linear flex items-center gap-1 px-3 rounded-xl bg-brand-500 py-[12px] text-sm font-medium text-white transition duration-200 hover:bg-black dark:bg-brand-400 dark:text-white dark:hover:bg-brand-300 dark:active:bg-brand-200"
            >
              Crear Campus <MdAdd className="h-4 w-4" />
            </button>
          </Link>
        </div>

        {/* Content States */}
        {loading && (
          <p className="text-sm text-navy-700/80 dark:text-white/80">Loading campus…</p>
        )}

        {!loading && error && (
          <p className="text-sm text-red-600">
            Failed to load campus. {String(error?.message || error)}
          </p>
        )}

        {!loading && !error && sorted.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-10">
            <p className="text-base text-navy-700 dark:text-white">
              No campus yet.
            </p>
            <Link to="crear">
              <button
                type="button"
                className="linear px-4 py-2 rounded-xl bg-brand-500 text-sm font-medium text-white transition duration-200 hover:bg-black dark:bg-brand-400 dark:hover:bg-brand-300"
              >
                Create your first Campus
              </button>
            </Link>
          </div>
        )}

        {!loading && !error && sorted.length > 0 && (
          <div
            className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4 3xl:grid-cols-4 mb-4"
            role="list"
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
          </div>
        )}
      </div>
    </div>
  );
};

export default CampusComponent;
