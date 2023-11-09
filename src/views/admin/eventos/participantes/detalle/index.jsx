import React from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import Banner from "./components/Banner";
import { DataStore } from "aws-amplify";
import { Attendee, EventAttendee } from "models"
 import {
  BiUser
} from "react-icons/bi";

const Dashboard = () => {

  const [attendee, setAttendee] = React.useState(null);
  const [eventAttende, setEventAttendee] = React.useState(null);
  const navigate = useNavigate();
  const { id } = useParams();

  React.useEffect(() => {

    if(!id){
      navigate('/');
    }

    DataStore.query(Attendee, (a) => a.id.eq(id)).then( results => {
      if(results.length > 0){
        setAttendee(results[0]);
        DataStore.query(EventAttendee,  (e) => e.attendeeID.eq(results[0].id)).then(results => {
          if(results.length > 0){
            setEventAttendee(results[0])
            console.log("EventAttendee: ", results)
          }
        })
      }
    });
  }, [navigate]);

  if(!attendee){
    return <p>Loading...</p>
  }

  return (
    <div className="area-page container mt-5 mb-[70px]">
      {/* <div className="grid h-full">
        <Banner />
      </div> */}
      {EventAttendee && EventAttendee.length !== 0 &&
        <div className="!z-5 max-w-3xl mx-auto relative flex flex-col bg-white bg-clip-border shadow-3xl shadow-shadow-500 px-[14px] py-[20px] rounded-3xl sm:px-[14px] dark:!bg-navy-800 dark:text-white dark:shadow-none !z-5 overflow-hidden">

          <div className="flex items-center justify-between px-3 mb-4">
            <p className="text-3xl flex items-center font-bold text-black dark:text-white">
              <BiUser className="h-11 w-11 mr-3" /> Acerca del participante
            </p>
            {EventAttendee.map((eventAttendee, i) => (
              <div key={i}>
                {eventAttendee.formAnswer.find(item => item.name === "nombres") && (
                <p className="text-md mb-3 w-full text-right font-bold capitalize">
                  {/* {eventAttendee.formAnswer.find(item => item.name === "nombres").userData[0]} */}
                </p>
              )}
              </div>
            ))}
          </div>

        </div>
      }
    </div>
  );
};

export default Dashboard;
