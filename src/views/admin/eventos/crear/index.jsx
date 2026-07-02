import React from "react";
import { useNavigate } from "react-router-dom";
import { EventCreateForm } from 'ui-components';
import { PageHeader, Card } from "components/adminUi";

const Dashboard = () => {

  const navigate = useNavigate();

  return (
    <div className="event-page mt-3">
      <PageHeader
        crumbs={[
          { label: "Eventos", to: "/admin/eventos" },
          { label: "Crear evento" },
        ]}
        title="Crear evento"
        subtitle="Completa la información para crear un nuevo evento."
      />

      <Card title="Información del evento">
        <EventCreateForm
          onSuccess={() => {
            alert("Evento creado con éxito")
            navigate('/admin/eventos');
          }}
          // onSubmit={(fields) => {
          //   if(subAreaId){
          //     console.log(fields)
          //     console.log(subAreaId)
          //     fields.careerID = subAreaId;
          //     return fields
          //   }
          // }}
          onCancel={() => {
            navigate('/admin/eventos');
          }}
          onError={(error) => {
            console.log("error: ", error)
          }}
        />
      </Card>

    </div>
  );
};

export default Dashboard;
