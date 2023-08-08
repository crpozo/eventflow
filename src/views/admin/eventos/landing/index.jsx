import React from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import Banner from "./components/Banner";
import { DataStore } from "aws-amplify";
import { Landing } from "models";
import { LandingCreateForm, LandingUpdateForm} from 'ui-components';
import {
  MdOutlinePermIdentity,
  MdChevronLeft
} from "react-icons/md";

const Dashboard = () => {

  const navigate = useNavigate();
  const [event, setEvent] = React.useState(null);
  const [landing, setLanding] = React.useState(null);
  const eventId = localStorage.getItem('eventID');

  React.useEffect(() => {
    console.log(eventId)
    if(!eventId){
      navigate(`/admin/eventos`);
      return 
    }    

    DataStore.query(Landing, (l) => l.landingEventId.eq(eventId)).then( results => {
      setEvent(results[0]);
      console.log("Landing: ", results)
    });

  }, [eventId, navigate]);
  
  // if(!landing ){
  //   return <p>Loading...</p>
  // }

  return (
    <div className="landing-page">
      <div className="mt-3 grid h-full">
        <Banner />
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
        />
      }
      
    </div>
  );
};

export default Dashboard;
