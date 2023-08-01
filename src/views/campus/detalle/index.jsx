import React from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import Banner from "./components/Banner";
import { DataStore } from "aws-amplify";
import { Campus } from "models"
import { useForm } from "react-hook-form"
import {
  CampusUpdateForm
 } from 'ui-components';
 import {
  MdOutlinePermIdentity,
  MdChevronLeft
} from "react-icons/md";

const Dashboard = () => {

  const [campus, setCampus] = React.useState([]);
  const navigate = useNavigate();
  const { state } = useLocation();
  const id = state?.id;

  const {
    formState: { errors },
    setValue,
  } = useForm();
  
  React.useEffect(() => {
    if(id === "no-id"){
      navigate(`/`);
      return 
    }

    if(!id){
      navigate('/page/campus');
    }

    DataStore.query(Campus, (c) => c.id.eq(id)).then( results => {
      setCampus(results[0]);
      console.log("Campus: ", results)
    });
  }, [id,setValue, navigate]);

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
      <div className="mt-3 grid h-full">
        {/* NFt Banner */}
        <Banner />
      </div>
      <Link
        to="/page/campus"
        className="flex gap items-center mb-5 font-medium text-brand-500 hover:no-underline hover:text-navy-700 dark:hover:text-white"
      >
        <MdChevronLeft className="h-7 w-7" /> Lista de campus
      </Link>
      {campus &&
        <div className="!z-5 relative flex flex-col bg-white bg-clip-border shadow-3xl shadow-shadow-500 px-[14px] py-[34px] rounded-3xl sm:px-[34px] dark:!bg-navy-800 dark:text-white dark:shadow-none !z-5 overflow-hidden">

          <div className="flex items-center justify-between px-3 mb-4">
            <p className="text-3xl flex items-center font-bold text-black dark:text-white">
              <MdOutlinePermIdentity className="h-12 w-12 mr-3" /> Acerca del Campus
            </p>
          </div>

          <CampusUpdateForm
              campus={campus}
              onSuccess={() => {
                navigate('/page/campus');
              }}
              onCancel={() => {
                navigate('/page/campus');
              }}
            />
              <button onClick={deleteEvent} className="max-w-[150px] ml-3 sm:mt-[-66px] linear rounded-xl bg-red-500 py-[10px] text-base font-medium text-white transition duration-200 hover:bg-red-600 active:bg-red-700 dark:bg-red-400 dark:text-white dark:hover:bg-red-300 dark:active:bg-red-200">
                Eliminar
              </button>

        </div>
      }
    </div>
  );
};

export default Dashboard;
