import React from "react";
import Banner from "./components/Banner";
import NftCard from "components/card/NftCard";
import { useNavigate, Link } from "react-router-dom";
import { DataStore } from "aws-amplify";
import { Event } from "models"
import {
  MdEast
} from "react-icons/md";

const Dashboard = () => {

  const [events, setEvents] = React.useState([]);
  const navigate = useNavigate();

  React.useEffect( () => {

    const subAreaId = localStorage.getItem('subAreaID');
    if(!subAreaId){
      console.log("subAreaId: ",subAreaId)
      navigate(`/page/campus`, { state: { error: "Escoge un campus, area y subarea para acceder a tus eventos"} });
    } else {

      DataStore.query(Event, (e) => e.careerID.eq(subAreaId)).then( results => {
        setEvents(results);
        console.log("Events: ",results)
      });

    }
  }, [navigate]);

  return (
    <div>

      <div className="grid h-full">
        <Banner />
      </div>  

      <div className="!z-5 relative flex flex-col bg-white bg-clip-border shadow-3xl shadow-shadow-500 px-[25px] py-[25px] rounded-[20px] dark:!bg-navy-800 dark:text-white dark:shadow-none !z-5 overflow-hidden">

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

      </div>

    </div>
  );
};

export default Dashboard;
