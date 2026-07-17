import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DataStore } from 'aws-amplify/datastore';

import { Attendee, EventAttendee } from "models"
import {
  AttendeeCreateForm
 } from 'ui-components';
import { useCanEditSection } from "components/sectionEdit";
import { readStoredEvent } from "scripts/utils";
import { PageHeader, Card } from "components/adminUi";

async function createEventAttendee( eventID, attendeeID){
  await DataStore.save(
    new EventAttendee({
      eventID: eventID,
      attendeeID: attendeeID,
      authorized: false,
      checkIn: false
    })
  );
}

const Dashboard = () => {

  const id = useParams().id;
  const navigate = useNavigate();
  const storedEvent = readStoredEvent();
  const eventID = storedEvent?.id;
  const canEdit = useCanEditSection("participantes");

  React.useEffect(() => {
    if(!id || id === "no-id"){
      navigate(`/`);
    }

  }, [id, navigate]);

  // View-only (managed) users can't create participants by URL either.
  React.useEffect(() => {
    if (!canEdit) {
      navigate(`/admin/eventos/${eventID}/participantes`);
    }
  }, [canEdit, eventID, navigate]);

  async function createAttende(fields){
    if (!canEdit) return;
    const attendee = await DataStore.save(
      new Attendee({
        name: fields.name,
        type: fields.type,
        age: fields.age,
        position: fields.position
      })
    );
    return attendee;
  }

  return (
    <div className="event-detail-page mt-3">
      <PageHeader
        crumbs={[
          { label: "Eventos", to: "/admin/eventos" },
          { label: storedEvent?.title || "Evento" },
          { label: "Participantes", to: `/admin/eventos/${eventID}/participantes` },
          { label: "Crear" },
        ]}
        title="Agregar participante"
        subtitle="Registra manualmente un participante para este evento."
      />

      <Card title="Datos del participante">
        <AttendeeCreateForm

          onSuccess={() => {
            alert("Participante creado con éxito");
            navigate(`/admin/eventos/${eventID}/participantes`);
          }}

          onSubmit={async (fields) => {
            let attendee = await createAttende(fields);
            createEventAttendee(eventID, attendee.id);
          }}

          onCancel={() => {
            navigate(`/admin/eventos/${eventID}/participantes`);
          }}

        />
      </Card>

    </div>
  );
};

export default Dashboard;
