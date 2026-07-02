import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { DataStore } from 'aws-amplify/datastore';
import { Career } from "models"
import { CareerUpdateForm } from 'ui-components';
import { PageHeader, Card } from "components/adminUi";
import { MdDeleteOutline } from "react-icons/md";

const Dashboard = () => {

  const [subArea, setSubArea] = React.useState(null);
  const navigate = useNavigate();
  const id = useLocation().state?.id;

  React.useEffect(() => {

    if(!id){
      navigate('/page/campus/area/subarea');
    }

    DataStore.query(Career, (a) => a.id.eq(id)).then( results => {
      setSubArea(results[0]);
    });

  }, [navigate]);

  const deleteEvent = () => {
    DataStore.delete(subArea);
    alert("Subárea eliminada con éxito")
    navigate('/page/campus/area/subarea');
  }

  if(!subArea){
    return (
      <div className="flex min-h-[60vh] w-full flex-col items-center justify-center">
        <span className="loader"></span>
        <h2 className="mt-2 text-xl text-black dark:text-white">Cargando…</h2>
      </div>
    );
  }

  return (
    <div className="subarea-page mt-3">
      <PageHeader
        crumbs={[
          { label: "Estructura", to: "/page/campus" },
          { label: "Subáreas", to: "/page/campus/area/subarea" },
          { label: "Editar" },
        ]}
        title="Editar subárea"
        subtitle="Actualiza la información de la subárea académica."
      />

      {subArea &&
        <div className="flex flex-col gap-5">
          <Card title="Información de la subárea">
            <CareerUpdateForm
              career={subArea}
              onSuccess={() => {
                navigate(`/page/campus/area/subarea`);
              }}
              onCancel={() => {
                navigate(`/page/campus/area/subarea`);
              }}
            />
          </Card>

          <Card
            title="Zona de peligro"
            subtitle="Eliminar la subárea es permanente: no se puede deshacer."
          >
            <button
              type="button"
              onClick={deleteEvent}
              className="inline-flex items-center gap-2 rounded-xl border border-red-500 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <MdDeleteOutline className="h-4 w-4" />
              Eliminar subárea
            </button>
          </Card>
        </div>
      }
    </div>
  );
};

export default Dashboard;
