import React from "react";
import { useNavigate } from "react-router-dom";
import { CareerCreateForm } from 'ui-components';
import { PageHeader, Card } from "components/adminUi";

const Dashboard = () => {

  const navigate = useNavigate();
  const areaID = JSON.parse(localStorage.getItem("EVENTFLOW.area")).id;

  return (
    <div className="area-page mt-3">
      <PageHeader
        crumbs={[
          { label: "Estructura", to: "/page/campus" },
          { label: "Subáreas", to: "/page/campus/area/subarea" },
          { label: "Crear" },
        ]}
        title="Crear subárea"
        subtitle="Registra una nueva subárea para el área seleccionada."
      />

      <Card title="Información de la subárea">
        <CareerCreateForm

          onSuccess={() => {
            alert("Subarea creada con éxito")
            navigate(`/page/campus/area/subarea`);
          }}
          onSubmit={(fields) => {
            if(areaID){
              fields.areaID = areaID;
              return fields;
            }
          }}
          onCancel={() => {
            navigate(`/page/campus/area/subarea`);
          }}
        />
      </Card>
    </div>
  );
};

export default Dashboard;
