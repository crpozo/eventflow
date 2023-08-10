import React from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import Banner from "./components/Banner";
import { DataStore } from "aws-amplify";
import { Event, Attendee, EventAttendee } from "models"
import {
  AttendeeCreateForm
 } from 'ui-components';
 import {
  MdPersonAddAlt,
  MdChevronLeft
} from "react-icons/md";

const Dashboard = () => {

  const id = useParams().id;
  const navigate = useNavigate();
  const eventID = localStorage.getItem('eventID');

  React.useEffect(() => {
    if(!id || id === "no-id"){
      navigate(`/`);
      return
    }

  }, [id, navigate]);

  // await DataStore.save(
  //   new Post({
  //     title: 'My First Post',
  //     rating: 10,
  //     status: PostStatus.INACTIVE
  //   })
  // );

  return (
    <div className="event-detail-page">
      <div className="grid h-full">
        <Banner />
      </div>

      <Link
        to={`/admin/eventos/${eventID}/participantes`}
        className="flex gap items-center mb-[32px] font-medium text-brand-500 hover:no-underline hover:text-navy-700 dark:hover:text-white"
      >
        <MdChevronLeft className="h-7 w-7" /> Lista de participantes
      </Link>

        <div className="!z-5 relative flex flex-col bg-white bg-clip-border shadow-3xl shadow-shadow-500 px-[14px] py-[20px] rounded-3xl sm:px-[14px] dark:!bg-navy-800 dark:text-white dark:shadow-none !z-5 overflow-hidden">

          <div className="flex items-center justify-between px-3 mb-4">
            <p className="text-3xl flex items-center font-bold text-black dark:text-white">
              <MdPersonAddAlt className="h-12 w-12 mr-3" /> Acerca del participante
            </p>
          </div>

          <AttendeeCreateForm
            onSuccess={(fields) => {
              console.log(fields)
              alert("Participante creado con éxito");         
              navigate(`/admin/eventos/${eventID}/participantes`);
            }}
            onSubmit={(fields) => {
              console.log(fields)
              // Save Attende data store, take the id
              // Save the EventAttendee with the event id + attende id
              return;
            }}
            onCancel={() => {
              navigate(`/admin/eventos/${eventID}/participantes`);
            }}
          />
        </div>

    </div>
  );
};

export default Dashboard;
