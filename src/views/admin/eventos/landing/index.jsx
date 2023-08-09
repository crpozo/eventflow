import React from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import Banner from "./components/Banner";
import { DataStore } from "aws-amplify";
import { Event, Landing } from "models";
import { LandingCreateForm, LandingUpdateForm} from 'ui-components';
import {
  MdWeb,
} from "react-icons/md";

const Dashboard = () => {

  const navigate = useNavigate();
  const [event, setEvent] = React.useState(null);
  const [landing, setLanding] = React.useState(null);
  const eventId = localStorage.getItem('eventID');

  React.useEffect(() => {
    const sub = DataStore.observeQuery(Landing, (l) =>
      l.landingEventId.eq(eventId)
    ).subscribe(({ items }) => {
      setLanding(items[0]);
    });

    return () => {
      sub.unsubscribe();
    };
  }, []);

  React.useEffect(() => {
    console.log(eventId)
    if(!eventId){
      navigate(`/admin/eventos`);
      return 
    }    

    DataStore.query(Event, (e) => e.id.eq(eventId)).then( results => {
      setEvent(results[0]);
      console.log("Event: ", results)
    });

    DataStore.query(Landing, (l) => l.landingEventId.eq(eventId)).then( results => {
      setLanding(results[0]);
      console.log("Landing: ", results)
    });

  }, [eventId, navigate]);

  return (
    <div className="landing-page">
      <div className="mt-3 grid h-full">
        <Banner />
      </div>

      <div className="!z-5 relative flex flex-col bg-white bg-clip-border shadow-3xl shadow-shadow-500 px-[14px] py-[20px] rounded-3xl sm:px-[14px] dark:!bg-navy-800 dark:text-white dark:shadow-none !z-5 overflow-hidden">

          <div className="flex items-center justify-between px-3 mb-4">
            <p className="text-3xl flex items-center font-bold text-black dark:text-white">
              <MdWeb className="h-12 w-12 mr-3" /> Acerca de la página web
            </p>
          </div>        

          {landing && landing.length !== 0 ?
              <LandingUpdateForm
                landing={landing}
                onSuccess={() => {
                  alert("Landing actualiza con éxito")
                }}
              />
            :
              <LandingCreateForm
                onSuccess={() => {
                  alert("Landing actualiza con éxito")
                }}
                onSubmit={(fields) => {
                  if(event){
                    fields.Event = event;
                    return fields  
                  }
              }}
              />
          }
        </div>      
      
    </div>
  );
};

export default Dashboard;
