import React from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import Banner from "./components/Banner";
import { DataStore } from "aws-amplify";
import { Event } from "models"
import {
  EventUpdateForm
 } from 'ui-components';
 import {
  MdEditCalendar,
  MdChevronLeft
} from "react-icons/md";

const Dashboard = () => {

  const [event, setEvent] = React.useState([]);
  const id = useParams().id;
  const navigate = useNavigate();
  localStorage.setItem("eventID", id)

  React.useEffect(() => {
    if(!id || id === "no-id"){
      navigate(`/admin/eventos`);
      return
    }

    DataStore.query(Event, (e) => e.id.eq(id)).then( results => {
      setEvent(results[0]);
      console.log("Event: ", results)
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
      <div className="mt-3 grid h-full">
        <Banner />
      </div>

      <Link
        to="/admin/eventos"
        className="flex gap items-center mb-[32px] font-medium text-brand-500 hover:no-underline hover:text-navy-700 dark:hover:text-white"
      >
        <MdChevronLeft className="h-7 w-7" /> Lista de eventos
      </Link>

      {event && event.length !== 0 &&
        <div className="!z-5 relative flex flex-col bg-white bg-clip-border shadow-3xl shadow-shadow-500 px-[14px] py-[20px] rounded-3xl sm:px-[14px] dark:!bg-navy-800 dark:text-white dark:shadow-none !z-5 overflow-hidden">

          <div className="flex items-center justify-between px-3 mb-4">
            <p className="text-3xl flex items-center font-bold text-black dark:text-white">
              <MdEditCalendar className="h-12 w-12 mr-3" /> Acerca del Evento
            </p>
          </div>

          <EventUpdateForm
            event={event}
            onSuccess={() => {            
              navigate('/admin/eventos');
            }}
            onCancel={() => {
              navigate('/admin/eventos');
            }}
          />

          <button onClick={deleteEvent} className="max-w-[120px] ml-3 sm:mt-[-66px] linear rounded-xl bg-red-500 py-[10px] text-sm font-medium text-white transition duration-200 hover:bg-red-600 active:bg-red-700 dark:bg-red-400 dark:text-white dark:hover:bg-red-300 dark:active:bg-red-200">
            Eliminar
          </button>
        </div>
      }
    </div>
  );
};

export default Dashboard;
