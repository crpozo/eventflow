import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import NftCard from "components/card/NftCard";
import { DataStore } from 'aws-amplify/datastore';
import { Area } from "models";
import { usePermissions } from "../../providers/PermissionsProvider";
import { PageHeader, Card, PrimaryButton, PageLoader } from "components/adminUi";
import { MdAdd } from "react-icons/md";

const Dashboard = () => {
  const [areas, setAreas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();
  const campusID = JSON.parse(localStorage.getItem("EVENTFLOW.campus"))?.id;
  // Access resolution (campus/area/event grants) comes from the provider, which
  // applies the per-user permissions with a legacy role.areas fallback.
  const { loading: permLoading, isAdmin, areaIDsAllowed } = usePermissions();

  useEffect(() => {
    if (!campusID) {
      navigate('/page/campus');
      return;
    }
    if (permLoading) return; // wait until access is resolved

    (async () => {
      try {
        const allAreasRes = await DataStore.query(Area, (a) => a.campusID.eq(campusID));
        if (isAdmin || areaIDsAllowed == null) {
          setAreas(allAreasRes);
        } else {
          setAreas(allAreasRes.filter((a) => areaIDsAllowed.includes(a.id)));
        }
      } catch (error) {
        console.error("Error cargando áreas:", error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [campusID, navigate, permLoading, isAdmin, areaIDsAllowed]);

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="campus-page mt-3">
      <PageHeader
        crumbs={[
          { label: "Estructura", to: "/page/campus" },
          { label: "Áreas" },
        ]}
        title="Áreas académicas"
        subtitle="Selecciona un área del campus para ver sus subáreas."
        actions={
          isAdmin && (
            <Link className="hover:no-underline" to="crear">
              <PrimaryButton type="button" className="flex items-center gap-1.5">
                Crear área <MdAdd className="h-4 w-4" />
              </PrimaryButton>
            </Link>
          )
        }
      />

      <Card>
        {areas.length !== 0 ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4 3xl:grid-cols-4">
            {[...areas]
              .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
              .map((area) => (
                <NftCard
                  modelName="area"
                  modelID={area.id}
                  model={area}
                  pathSelect="subarea/"
                  pathEdit="editar/"
                  key={area.id}
                  color="bg-lightGray"
                  date={area.updatedAt}
                  title={area.title}
                  cat="Seleccionar"
                />
              ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            No existen áreas disponibles para tu rol en este campus…
          </p>
        )}
      </Card>
    </div>
  );
};

export default Dashboard;
