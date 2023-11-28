import React from "react";
import Banner from "./components/Banner";
import NftCard from "components/card/NftCard";
import { useNavigate, Link } from "react-router-dom";
import { DataStore } from 'aws-amplify/datastore';
import { Event } from "models"
import {
  MdEast
} from "react-icons/md";
import { AiOutlineWarning } from "react-icons/ai";

const Dashboard = () => {

  const [events, setEvents] = React.useState([]);
  const navigate = useNavigate();

  React.useEffect( () => {
    if(!localStorage.getItem("EVENTFLOW.subarea") || localStorage.getItem("EVENTFLOW.subarea") === undefined){
      navigate(`/page/campus`);
      return
    }

    const subAreaId = JSON.parse(localStorage.getItem("EVENTFLOW.subarea"))?.id;
    if(!subAreaId){
      console.log("subAreaId: ",subAreaId)
      navigate(`/page/campus`, { state: { error: "Escoge un campus, area y subarea para acceder a tus eventos"} });
    } else {

      const sub = DataStore.observeQuery(Event, (e) => e.careerID.eq(subAreaId)).subscribe((results) => {
        setEvents(results.items);
        console.log("Events: ",results.items)
      });
  
      return () => {
        sub.unsubscribe();
      };

    }
  }, [navigate]);

  return (
    <div>
      <div className="grid h-full">
        <Banner />
      </div>  

      <div className="!z-5 relative flex flex-col bg-white bg-clip-border shadow-3xl shadow-shadow-500 px-[25px] py-[25px] rounded-[20px] dark:!bg-navy-800 dark:text-white dark:shadow-none !z-5 overflow-hidden">

        {events.length !== 0 ? 
          <>
            {/* Recenlty Added setion */}
            <div className="mb-[32px] mt-2 flex items-center justify-between">
              <h4 className="text-2xl font-bold text-navy-700 dark:text-white">
                Eventos en progreso 
              </h4>
            </div>

            {/* Recently Add NFTs */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4 mb-[32px]">
              {events && events.map(event => (
                <NftCard
                  modelName="event"
                  modelId={event.id}
                  model={event}
                  key={event.id}
                  color="bg-purplePrimary"
                  pathSelect={`/admin/eventos/${event.id}/detalle`}
                  date={event.updatedAt}
                  title={event.title}
                  cat="Ver Detalle"
                />
              ))}
            </div>

            <Link className="hover:no-underline" to="/admin/eventos"> 
              <button href="crear" className="linear flex items-center gap-1 pr-3 pl-3 rounded-xl bg-brand-500 py-[12px] text-sm font-medium text-white transition duration-200 hover:bg-black dark:bg-brand-400 dark:text-white dark:hover:bg-brand-300 dark:active:bg-brand-200">
                Todos los eventos <MdEast className="h-4 w-4" />
              </button>
            </Link>
          </>
          :
          <p className="flex gap-2 items-center"> <AiOutlineWarning/> No existen eventos en la base de datos...</p>
        }

      </div>

    </div>
  );
};

export default Dashboard;
