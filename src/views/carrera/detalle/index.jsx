import React from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import Banner from "./components/Banner";
import { DataStore } from 'aws-amplify/datastore';
import { Career } from "models"
import {
  CareerUpdateForm 
 } from 'ui-components';
 import {
  MdOutlinePermIdentity,
  MdChevronLeft
} from "react-icons/md";

const Dashboard = () => {

  const [subArea, setSubArea] = React.useState(null);
  const navigate = useNavigate();
  const id = useLocation().state?.id;
  
  React.useEffect(() => {

    if(!id){
      navigate('/page/campus/area/subarea');
    }

    DataStore.query(Career, (a) => a.id.eq(id)).then( results => {
      setSubArea(results[0]);
      console.log("Subárea: ", results)
    });

  }, [navigate]);

  const deleteEvent = () => {
    DataStore.delete(subArea);
    alert("Subárea eliminada con éxito")
    navigate('/page/campus/area/subarea');
  }

  if(!subArea){
    return <p>Loading...</p>
  }

  return (
    <div className="subarea-page">
      <div className="grid h-full">
        <Banner />
      </div>
      <Link
        to="/page/campus/area/subarea"
        className="flex gap items-center mb-[32px] font-medium text-brand-500 hover:no-underline hover:text-navy-700 dark:hover:text-white"
      >
        <MdChevronLeft className="h-7 w-7" /> Lista de Subáreas
      </Link>
      {subArea &&
        <div className="!z-5 relative flex flex-col bg-white bg-clip-border shadow-card px-[14px] py-[20px] rounded-3xl sm:px-[14px] dark:!bg-navy-800 dark:text-white dark:shadow-none !z-5 overflow-hidden">

          <div className="flex items-center justify-between px-3 mb-4">
            <p className="text-3xl flex items-center font-bold text-black dark:text-white">
              <MdOutlinePermIdentity className="h-12 w-12 mr-3" /> Acerca de la subárea
            </p>
          </div>

          <CareerUpdateForm
              career={subArea}
              onSuccess={() => {
                navigate(`/page/campus/area/subarea`);
              }}
              onCancel={() => {
                navigate(`/page/campus/area/subarea`);
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
