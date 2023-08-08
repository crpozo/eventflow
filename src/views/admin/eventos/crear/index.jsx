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
  const [formData, setFormData] = React.useState()
  const [subAreaId, setSubAreaId ] = React.useState();

  React.useEffect( () => {
    setSubAreaId(localStorage.getItem('subAreaID'));
  }, []);

  React.useEffect( () => {
    console.log(formData)
  }, [formData]);

  return (
    <div className="event-page">

      <div className="mt-3 grid h-full">
        <Banner />
      </div>

      <Link
        to="/admin/eventos"
        className="flex gap items-center mb-[32px] font-medium text-brand-500 hover:no-underline hover:text-navy-700 dark:hover:text-white"
      >
        <MdChevronLeft className="h-7 w-7" /> Lista de eventos
      </Link>

      <div className="!z-5 relative flex flex-col bg-white bg-clip-border shadow-3xl shadow-shadow-500 px-[14px] pt-[34px] rounded-3xl sm:px-[34px] dark:!bg-navy-800 dark:text-white dark:shadow-none !z-5 overflow-hidden">

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
            onCancel={() => {
              navigate('/admin/eventos');
            }}
          />

        </div>

    </div>
  );
};

export default Dashboard;
