import React from "react";
import { useNavigate, Link } from "react-router-dom";
import NftCard from "components/card/NftCard";
import { DataStore } from 'aws-amplify/datastore';
import { Career } from "models";
import { PageHeader, Card, PrimaryButton, PageLoader } from "components/adminUi";
import { MdAdd } from "react-icons/md";

const Dashboard = () => {

  const [subArea, setSubArea] = React.useState([]);
  const navigate = useNavigate();
  const areaID = JSON.parse(localStorage.getItem("EVENTFLOW.area")).id;

  React.useEffect(() => {

    const sub = DataStore.observeQuery(Career, (a) => a.areaID.eq(areaID)).subscribe((results) => {
      setSubArea(results.items);
    });

    return () => {
      sub.unsubscribe();
    };

  }, [areaID]);

  if(!subArea){
    return <PageLoader />;
  }

  if(!areaID){
    navigate('/page/campus');
  }

  return (
    <div className="subArea-page mt-3">
      <PageHeader
        crumbs={[
          { label: "Estructura", to: "/page/campus" },
          { label: "Áreas", to: "/page/campus/area" },
          { label: "Subáreas" },
        ]}
        title="Subáreas académicas"
        subtitle="Selecciona una subárea del área académica."
        actions={
          <Link className="hover:no-underline" to="crear">
            <PrimaryButton type="button" className="flex items-center gap-1.5">
              Crear subárea <MdAdd className="h-4 w-4" />
            </PrimaryButton>
          </Link>
        }
      />

      <Card>
        {subArea.length !== 0 ?
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4 3xl:grid-cols-4">
            {subArea && [...subArea].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).map(subArea => (
              <NftCard
                modelName="subarea"
                modelID={subArea.id}
                model={subArea}
                pathSelect="/"
                pathEdit="editar/"
                key={subArea.id}
                color="bg-lightGray"
                date={subArea.updatedAt}
                title={subArea.title}
                cat="Seleccionar"
              />
            ))}
          </div>
        :
          <p className="text-sm text-gray-500">
            No existen subáreas para el área seleccionada…
          </p>
        }
      </Card>
    </div>

  );
};

export default Dashboard;
