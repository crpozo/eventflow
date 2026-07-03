import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { DataStore } from "aws-amplify/datastore";
import { Campus } from "models";
import { CampusUpdateForm } from "ui-components";
import { PageHeader, Card, PageLoader } from "components/adminUi";
import { MdDeleteOutline } from "react-icons/md";

const Dashboard = () => {
  const [campus, setCampus] = React.useState({});
  const navigate = useNavigate();
  const id = useLocation().state?.id;

  React.useEffect(() => {
    if (!id) {
      navigate("/page/campus");
      return;
    }

    DataStore.query(Campus, (c) => c.id.eq(id)).then((results) => {
      setCampus(results[0]);
    });
  }, [id, navigate]);

  const deleteEvent = () => {
    DataStore.delete(campus);
    alert("Campus eliminado con éxito");
    navigate("/page/campus");
  };

  if (!campus) {
    return <PageLoader />;
  }

  return (
    <div className="campus-page mt-3">
      <PageHeader
        crumbs={[
          { label: "Estructura", to: "/page/campus" },
          { label: "Editar campus" },
        ]}
        title="Editar campus"
        subtitle="Actualiza la información del campus."
      />

      {campus && (
        <div className="flex flex-col gap-5">
          <Card title="Información del campus">
            <CampusUpdateForm
              campus={campus}
              onSuccess={() => {
                navigate("/page/campus");
              }}
              onCancel={() => {
                navigate("/page/campus");
              }}
            />
          </Card>

          <Card
            title="Eliminar campus"
            subtitle="Esta acción es permanente y no se puede deshacer."
          >
            <button
              type="button"
              onClick={deleteEvent}
              className="inline-flex items-center gap-2 rounded-xl border border-red-500 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <MdDeleteOutline className="h-4 w-4" />
              Eliminar campus
            </button>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
