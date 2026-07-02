import React from "react";
import { useNavigate } from "react-router-dom";
import { AreaCreateForm } from 'ui-components';
import { PageHeader, Card } from "components/adminUi";

const Dashboard = () => {

  const navigate = useNavigate();
  const campusID = JSON.parse(localStorage.getItem("EVENTFLOW.campus")).id

  return (
    <div className="area-page mt-3">
      <PageHeader
        crumbs={[
          { label: "Estructura", to: "/page/campus" },
          { label: "Áreas", to: "/page/campus/area" },
          { label: "Crear" },
        ]}
        title="Crear área"
        subtitle="Registra una nueva área académica para este campus."
      />

      <Card title="Información del área">
        <AreaCreateForm

          overrides={{
            campusId: {
              errorMessage: "El titulo es un campo obligatorio"
            }
          }}

          onSuccess={() => {
            alert("Area creada con éxito")
            navigate(`/page/campus/area`);
          }}
          onSubmit={(fields) => {
            if(campusID){
              fields.campusID = campusID;
              return fields;
            }
          }}
          onCancel={() => {
            navigate(`/page/campus/area`);
          }}
        />
      </Card>
    </div>
  );
};

export default Dashboard;
