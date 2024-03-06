import React from "react";
import Banner from "./components/Banner";
import { useNavigate, Link } from "react-router-dom";
import { EventCreateForm } from 'ui-components';
import {
  MdEditCalendar,
  MdChevronLeft
} from "react-icons/md";

const Dashboard = () => {

  const navigate = useNavigate();
  const [subAreaId, setSubAreaId ] = React.useState();

  React.useEffect( () => {
    setSubAreaId(JSON.parse(localStorage.getItem("EVENTFLOW.subarea")).id);
  }, []);

  return (
    <div className="event-page">

      <div className="grid h-full">
        <Banner />
      </div>

      <Link
        to="/admin/eventos"
        className="flex gap items-center mb-[32px] font-medium text-brand-500 hover:no-underline hover:text-navy-700 dark:hover:text-white"
      >
        <MdChevronLeft className="h-7 w-7" /> Lista de eventos
      </Link>

      <div className="!z-5 relative flex flex-col bg-white bg-clip-border shadow-card px-[14px] pt-[34px] rounded-3xl sm:px-[34px] dark:!bg-navy-800 dark:text-white dark:shadow-none !z-5 overflow-hidden">

          <div className="flex items-center justify-between px-3 mb-4">
            <p className="text-3xl flex items-center font-bold text-black dark:text-white">
              <MdEditCalendar className="h-12 w-12 mr-3" /> Acerca del Evento
            </p>
          </div>
          <EventCreateForm 
            onSuccess={() => {
              alert("Evento creado con éxito")
              navigate('/admin/eventos');
            }}
            // onSubmit={(fields) => {
            //   if(subAreaId){
            //     console.log(fields)
            //     console.log(subAreaId)
            //     fields.careerID = subAreaId;
            //     return fields  
            //   }
            // }}
            onCancel={() => {
              navigate('/admin/eventos');
            }}
            onError={(error) => {
              console.log("error: ",error)
            }}
          />

        </div>

    </div>
  );
};

export default Dashboard;
