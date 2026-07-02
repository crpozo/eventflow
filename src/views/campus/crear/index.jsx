import React from "react";
import { useNavigate } from "react-router-dom";
import { CampusCreateForm } from "ui-components";
import { PageHeader, Card } from "components/adminUi";

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="campus-page mt-3">
      <PageHeader
        crumbs={[
          { label: "Estructura", to: "/page/campus" },
          { label: "Crear campus" },
        ]}
        title="Crear campus"
        subtitle="Registra un nuevo campus de la organización."
      />

      <Card title="Información del campus">
        <CampusCreateForm
          overrides={{
            title: {
              errorMessage: "El titulo es un campo obligatorio",
            },
          }}
          onSuccess={() => {
            alert("Campus creado con éxito");
            navigate("/page/campus");
          }}
          onCancel={() => {
            navigate("/page/campus");
          }}
        />
      </Card>
    </div>
  );
};

export default Dashboard;
