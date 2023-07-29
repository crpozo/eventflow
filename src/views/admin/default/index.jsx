import React from "react";
import Banner from "./components/Banner";
import NftCard from "components/card/NftCard";
import { useNavigate} from "react-router-dom";

import { DataStore } from "aws-amplify";
import { Event } from "models"

const Dashboard = () => {

  const [events, setEvents] = React.useState([]);
  const navigate = useNavigate();

  React.useEffect( () => {

    const subAreaId = localStorage.getItem('subAreaId');
    if(!subAreaId){
      navigate(`/page/campus`);
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

      <div className="!z-5 relative flex flex-col bg-white bg-clip-border shadow-3xl shadow-shadow-500 px-[34px] py-4 rounded-[20px] dark:!bg-navy-800 dark:text-white dark:shadow-none !z-5 overflow-hidden">

        {/* Recenlty Added setion */}
        <div className="mb-5 mt-4 flex items-center justify-between">
          <h4 className="text-3xl font-bold text-navy-700 dark:text-white">
            Eventos en progreso 
          </h4>
        </div>

        {/* Recently Add NFTs */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-4 mb-4">
          {events && events.map(event => (
             <NftCard
              key={event.id}
              color="bg-purplePrimary"
              title={event.title}
              cat="Ver detalle"
            />
          ))}
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
