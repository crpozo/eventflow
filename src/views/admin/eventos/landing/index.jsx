import React from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import Banner from "./components/Banner";
import { DataStore } from 'aws-amplify/datastore';
import { Event, Landing } from "models";
import { LandingCreateForm, LandingUpdateForm} from 'ui-components';
import {
  MdWeb,
} from "react-icons/md";

const Dashboard = () => {

  const navigate = useNavigate();
  const [event, setEvent] = React.useState(null);
  const [landing, setLanding] = React.useState(null);
  const eventId = JSON.parse(localStorage.getItem("EVENTFLOW.event")).id;

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
    if(!eventId){
      navigate(`/admin/eventos`);
      return 
    }    

    DataStore.query(Event, (e) => e.id.eq(eventId)).then( results => {
      setEvent(results[0]);
    });

    DataStore.query(Landing, (l) => l.landingEventId.eq(eventId)).then( results => {
      setLanding(results[0]);
    });

  }, [eventId, navigate]);

  return (
    <div className="landing-page">
      <div className="grid h-full">
        <Banner />
      </div>

      <div className="!z-5 relative flex flex-col bg-white bg-clip-border shadow-card px-[14px] py-[20px] rounded-3xl sm:px-[14px] dark:!bg-navy-800 dark:text-white dark:shadow-none !z-5 overflow-hidden">

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
