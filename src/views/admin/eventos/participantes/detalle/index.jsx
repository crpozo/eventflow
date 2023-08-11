import React from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import Banner from "./components/Banner";
import { DataStore } from "aws-amplify";
import { Attendee } from "models"
import {
  AttendeeUpdateForm 
 } from 'ui-components';
 import {
  MdOutlineModeEditOutline,
  MdChevronLeft
} from "react-icons/md";

const Dashboard = () => {

  const [attendee, setAttendee] = React.useState(null);
  const navigate = useNavigate();
  const { id } = useParams();
  const eventID = localStorage.getItem('eventID');

  React.useEffect(() => {

    if(!id){
      navigate('/');
    }

    DataStore.query(Attendee, (a) => a.id.eq(id)).then( results => {
      setAttendee(results[0]);
      console.log("Attendee: ", results)
    });

  }, [navigate]);

  const deleteAttendee = () => {
    DataStore.delete(attendee);
    alert("Participante eliminada con éxito")
    navigate(`/admin/eventos/${eventID}/participantes`);
  }

  if(!attendee){
    return <p>Loading...</p>
  }

  return (
    <div className="area-page">
      <div className="grid h-full">
        <Banner />
      </div>
      <Link
        to={`/admin/eventos/${eventID}/participantes`}
        className="flex gap items-center mb-[32px] font-medium text-brand-500 hover:no-underline hover:text-navy-700 dark:hover:text-white"
      >
        <MdChevronLeft className="h-7 w-7" /> Lista de participantes
      </Link>
      {attendee && attendee.length !== 0 &&
        <div className="!z-5 relative flex flex-col bg-white bg-clip-border shadow-3xl shadow-shadow-500 px-[14px] py-[20px] rounded-3xl sm:px-[14px] dark:!bg-navy-800 dark:text-white dark:shadow-none !z-5 overflow-hidden">

          <div className="flex items-center justify-between px-3 mb-4">
            <p className="text-3xl flex items-center font-bold text-black dark:text-white">
              <MdOutlineModeEditOutline className="h-11 w-11 mr-3" /> Acerca del participante
            </p>
          </div>

          <AttendeeUpdateForm
              attendee={attendee}
              onSuccess={() => {
                navigate(`/admin/eventos/${eventID}/participantes`);
              }}
              onCancel={() => {
                navigate(`/admin/eventos/${eventID}/participantes`);
              }}
            />
              <button onClick={deleteAttendee} className="max-w-[120px] ml-3 sm:mt-[-66px] linear rounded-xl bg-red-500 py-[10px] text-sm font-medium text-white transition duration-200 hover:bg-red-600 active:bg-red-700 dark:bg-red-400 dark:text-white dark:hover:bg-red-300 dark:active:bg-red-200">
                Eliminar
              </button>

        </div>
      }
    </div>
  );
};

export default Dashboard;
