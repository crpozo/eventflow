import React from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Banner from "./components/Banner";
import { DataStore } from 'aws-amplify/datastore';
import { Event } from "models"
import {
  EventUpdateForm
 } from 'ui-components';
import { EditableSection } from "components/sectionEdit";
 import {
  MdEditCalendar,
  MdChevronLeft,
  MdDeleteOutline
} from "react-icons/md";

const Dashboard = () => {

  const [event, setEvent] = React.useState([]);
  const id = useParams().id;
  const navigate = useNavigate();

  React.useEffect(() => {
    if(!id || id === "no-id"){
      navigate(`/admin/eventos`);
      return
    }

    DataStore.query(Event, (e) => e.id.eq(id)).then( results => {
      setEvent(results[0]);
      localStorage.setItem("EVENTFLOW.event", JSON.stringify(results[0]))
    });
  }, [id, navigate]);

  const deleteEvent = () => {
    DataStore.delete(event);
    alert("Evento eliminado con éxito")
    navigate('/admin/eventos');
  }

  if(!event){
    return <p>Loading...</p>
  }

  return (
    <div className="event-detail-page">
      <div className="grid h-full">
        <Banner />
      </div>

      {event && event.length !== 0 &&
        <div className="!z-5 relative flex flex-col bg-white bg-clip-border shadow-card px-[14px] py-[20px] rounded-3xl sm:px-[14px] dark:!bg-navy-800 dark:text-white dark:shadow-none !z-5 overflow-hidden">

          <EditableSection section="detalle">
            <EventUpdateForm
              event={event}
              onSuccess={() => {
                alert("Evento actualizado con éxito")
              }}
              onCancel={() => {
                navigate('/admin/eventos');
              }}
            />

            <button
              type="button"
              onClick={deleteEvent}
              className="mt-4 inline-flex items-center gap-2 self-start rounded-xl bg-red-500 px-5 py-2.5 text-sm font-medium text-white transition duration-200 hover:bg-red-600 active:bg-red-700 dark:bg-red-400 dark:text-white dark:hover:bg-red-300 dark:active:bg-red-200"
            >
              <MdDeleteOutline className="h-4 w-4" />
              Eliminar
            </button>
          </EditableSection>
        </div>
      }
    </div>
  );
};

export default Dashboard;
