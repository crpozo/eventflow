import React from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import Banner from "./components/Banner";
import { DataStore } from 'aws-amplify/datastore';
import { Campus } from "models"
import {
  CampusUpdateForm
 } from 'ui-components';
 import {
  MdOutlinePermIdentity,
  MdChevronLeft
} from "react-icons/md";

const Dashboard = () => {

  const [campus, setCampus] = React.useState({});
  const navigate = useNavigate();
  const id = useLocation().state?.id;

  React.useEffect(() => { 

    if(!id){
      navigate('/page/campus');
      return;
    }

    DataStore.query(Campus, (c) => c.id.eq(id)).then( results => {
      setCampus(results[0]);
    });

  }, [id, navigate]);

  const deleteEvent = () => {
    DataStore.delete(campus);
    alert("Campus eliminado con éxito")
    navigate('/page/campus');
  }

  if(!campus){
    return <p>Loading...</p>
  }

  return (
    <div className="campus-page">
      <div className="grid h-full">
        <Banner />
      </div>
      <Link
        to="/page/campus"
        className="flex gap items-center mb-[32px] font-medium text-brand-500 hover:no-underline hover:text-navy-700 dark:hover:text-white"
      >
        <MdChevronLeft className="h-7 w-7" /> Lista de campus
      </Link>
      {campus &&
        <div className="!z-5 relative flex flex-col bg-white bg-clip-border shadow-card px-[14px] py-[20px] rounded-3xl sm:px-[14px] dark:!bg-navy-800 dark:text-white dark:shadow-none !z-5 overflow-hidden">

          <CampusUpdateForm
            campus={campus}
            onSuccess={() => {
              navigate('/page/campus');
            }}
            onCancel={() => {
              navigate('/page/campus');
            }}
          />
          
          <button onClick={deleteEvent} className="max-w-[120px] ml-3 sm:mt-[-66px] linear rounded-xl bg-red-500 py-[10px] text-sm font-medium text-white transition duration-200 hover:bg-red-600 active:bg-red-700 dark:bg-red-400 dark:text-white dark:hover:bg-red-300 dark:active:bg-red-200">
            Eliminar
          </button>

        </div>
      }
    </div>
  );
};

export default Dashboard;
