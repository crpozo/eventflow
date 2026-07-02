import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { DataStore } from 'aws-amplify/datastore';
import { Area } from "models"
import { AreaUpdateForm } from 'ui-components';
import { PageHeader, Card } from "components/adminUi";
import { MdDeleteOutline } from "react-icons/md";

const Dashboard = () => {

  const [area, setarea] = React.useState(null);
  const navigate = useNavigate();
  const id = useLocation().state?.id;

  React.useEffect(() => {

    if(!id){
      navigate('/page/campus/area');
    }

    DataStore.query(Area, (a) => a.id.eq(id)).then( results => {
      setarea(results[0]);
    });

  }, [navigate]);

  const deleteEvent = () => {
    DataStore.delete(area);
    alert("Area eliminada con éxito")
    navigate('/page/campus/area');
  }

  if(!area){
    return (
      <div className="flex min-h-[60vh] w-full flex-col items-center justify-center">
        <span className="loader"></span>
        <h2 className="mt-2 text-xl text-black dark:text-white">Cargando…</h2>
      </div>
    );
  }

  return (
    <div className="area-page mt-3">
      <PageHeader
        crumbs={[
          { label: "Estructura", to: "/page/campus" },
          { label: "Áreas", to: "/page/campus/area" },
          { label: "Editar" },
        ]}
        title="Editar área"
        subtitle="Actualiza la información del área académica."
      />

      {area &&
        <div className="flex flex-col gap-5">
          <Card title="Información del área">
            <AreaUpdateForm
              area={area}
              onSuccess={() => {
                navigate(`/page/campus/area`);
              }}
              onCancel={() => {
                navigate(`/page/campus/area`);
              }}
            />
          </Card>

          <Card
            title="Zona de peligro"
            subtitle="Eliminar el área es permanente: no se puede deshacer."
          >
            <button
              type="button"
              onClick={deleteEvent}
              className="inline-flex items-center gap-2 rounded-xl border border-red-500 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <MdDeleteOutline className="h-4 w-4" />
              Eliminar área
            </button>
          </Card>
        </div>
      }
    </div>
  );
};

export default Dashboard;
