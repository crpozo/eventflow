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

  async function createAttende(fields){
    const attendee = await DataStore.save(
      new Attendee({
        name: fields.name,
        type: fields.type,
        age: fields.age,
        position: fields.position
      })
    );
    return attendee;
  }

  async function createEventAttendee( eventID, attendeeID){
    const eventAttendee = await DataStore.save(
      new EventAttendee({
        eventID: eventID,
        attendeeID: attendeeID,
        authorized: false,
        checkIn: false
      })
    );
  }

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

            onSuccess={() => {
              alert("Participante creado con éxito");    
              navigate(`/admin/eventos/${eventID}/participantes`);     
            }}

            onSubmit={async (fields) => {
              let attendee = await createAttende(fields);
              createEventAttendee(eventID, attendee.id);
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
