import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DataStore } from "aws-amplify/datastore";
import { Event } from "models";
import { EventUpdateForm } from "ui-components";
import { EditableSection, useCanEditSection } from "components/sectionEdit";
import { PageHeader, Card } from "components/adminUi";
import { MdDeleteOutline } from "react-icons/md";

const Dashboard = () => {
  const [event, setEvent] = React.useState([]);
  const id = useParams().id;
  const navigate = useNavigate();
  // The delete button lives outside the EditableSection fieldset now, so it
  // must be gated by the same "detalle" edit permission explicitly.
  const canEdit = useCanEditSection("detalle");

  React.useEffect(() => {
    if (!id || id === "no-id") {
      navigate(`/admin/eventos`);
      return;
    }

    DataStore.query(Event, (e) => e.id.eq(id)).then((results) => {
      setEvent(results[0]);
      // Never store JSON.stringify(undefined) — it writes the literal string
      // "undefined", which crashes pages that JSON.parse this key.
      if (results[0]) {
        localStorage.setItem("EVENTFLOW.event", JSON.stringify(results[0]));
      }
    });
  }, [id, navigate]);

  const deleteEvent = () => {
    DataStore.delete(event);
    alert("Evento eliminado con éxito");
    navigate("/admin/eventos");
  };

  if (!event) {
    return <p>Loading...</p>;
  }

  return (
    <div className="event-detail-page mt-3">
      <PageHeader
        crumbs={[
          { label: "Eventos", to: "/admin/eventos" },
          { label: event?.title || "Evento" },
          { label: "Detalle" },
        ]}
        title="Detalle del evento"
        subtitle="Información general, fechas, certificados y configuración."
      />

      {event && event.length !== 0 && (
        <div className="flex flex-col gap-5">
          <Card title="Información del evento">
            <EditableSection section="detalle">
              <EventUpdateForm
                event={event}
                onSuccess={() => {
                  alert("Evento actualizado con éxito");
                }}
                onCancel={() => {
                  navigate("/admin/eventos");
                }}
              />
            </EditableSection>
          </Card>

          <Card
            title="Zona de peligro"
            subtitle="Eliminar el evento es permanente: no se puede deshacer."
          >
            <button
              type="button"
              onClick={deleteEvent}
              disabled={!canEdit}
              className="inline-flex items-center gap-2 rounded-xl border border-red-500 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <MdDeleteOutline className="h-4 w-4" />
              Eliminar evento
            </button>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
