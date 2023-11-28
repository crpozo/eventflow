import React from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import Banner from "./components/Banner";
import { Hub } from 'aws-amplify/utils';
import { DataStore } from 'aws-amplify/datastore';
import { Attendee, EventAttendee } from "models"
import avatar from "assets/img/usfq/avatar.png";

const Profile = () => {

  const [attendee, setAttendee] = React.useState(null);
  const [eventAttende, setEventAttendee] = React.useState(null);
  const navigate = useNavigate();
  const { id } = useParams();

  React.useEffect(() => {

    if(!id){
      navigate('/');
    }

    const subscription = DataStore.observeQuery(Attendee, (a) => a.id.eq(id)).subscribe( results => {
      if(results.items.length > 0 ){
        setAttendee(results.items[0]);
        DataStore.query(EventAttendee,  (e) => e.attendeeID.eq(results.items[0].id)).then(results => {
          if(results.length > 0 ){
            setEventAttendee(results[0])
            console.log("EventAttendee: ", results)
          }
        })
      }
    }); 

    if(attendee){
      subscription.unsubscribe();
    }
    
  }, []);

  if (!attendee) {
    return (
      <div className="fixed bottom-0 left-0 right-0 top-0 z-50 flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-lightPrimary opacity-[85%]">
        {/* <div className="loader mb-4 h-16 w-16 rounded-full border-4 border-t-4 border-gray-200 ease-linear"></div> */}
        <h2 className="mb-2 text-center text-xl font-semibold text-black">
          No existe un participante con ID: 
        </h2>
        <p className="w-1/3 text-center text-black">
          {id}
        </p>
      </div>
    );
  }

  return (
    <div className="profile-page container mt-[100px] md:mt-[50px] mb-[30px]">
      {/* <div className="grid h-full">
        <Banner />
      </div> */}
      {eventAttende && eventAttende.length !== 0 &&
        <div className="!z-5 max-w-md mx-auto relative flex flex-colbg-clip-border dark:!bg-navy-800 dark:text-white dark:shadow-none !z-5">

          <div className="flex flex-col justify-between gap-[50px] mb-4 w-full">

          <div className="card w-full">
            <div className="banner">
              <img src={avatar}/>
            </div>
            <h2 className="name mb-3">
              {eventAttende.formAnswers.find(item => item.name === "nombres").userData[0]}
            </h2>
            <div className="flex flex-col items-center mb-3">
            {eventAttende.formAnswers.map((formAnswer, i) => (
              <div key={i}>
                {formAnswer.userData 
                  && formAnswer.userData[0] !== "" 
                  && formAnswer.name !== 'nombres' 
                  && 
                  <p className="text-md mb-3 w-full">
                    <span className="font-semibold">
                      {formAnswer.label + ':'} 
                    </span> 
                    <span className="ml-2">
                      {formAnswer.userData[0]}
                    </span>
                  </p>
                }
              </div>
            ))}
            </div>
            <div className="actions">
              <div className="follow-btn">
                <a href="#">Seguir en LinkedIn</a>
              </div>
            </div>
          </div>

          </div>
        </div>
      }
    </div>
  );
};

export default Profile;
