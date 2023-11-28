import React from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import Banner from "./components/Banner";
import { DataStore } from 'aws-amplify/datastore';
import { Area } from "models"
import {
  AreaUpdateForm 
 } from 'ui-components';
 import {
  MdOutlinePermIdentity,
  MdChevronLeft
} from "react-icons/md";

const Dashboard = () => {

  const [area, setarea] = React.useState(null);
  const navigate = useNavigate();
  const id = useLocation().state?.id;
  
  React.useEffect(() => {

    if(!id){
      navigate('/page/campus/area');
    }

    DataStore.query(Area, (a) => a.id.eq(id)).then( results => {
      setarea(results[0]);
      console.log("Area: ", results)
    });

  }, [navigate]);

  const deleteEvent = () => {
    DataStore.delete(area);
    alert("Area eliminada con éxito")
    navigate('/page/campus/area');
  }

  if(!area){
    return <p>Loading...</p>
  }

  return (
    <div className="area-page">
      <div className="grid h-full">
        {/* NFt Banner */}
        <Banner />
      </div>
      <Link
        to="/page/campus/area"
        className="flex gap items-center mb-[32px] font-medium text-brand-500 hover:no-underline hover:text-navy-700 dark:hover:text-white"
      >
        <MdChevronLeft className="h-7 w-7" /> Lista de area
      </Link>
      {area &&
        <div className="!z-5 relative flex flex-col bg-white bg-clip-border shadow-3xl shadow-shadow-500 px-[14px] py-[20px] rounded-3xl sm:px-[14px] dark:!bg-navy-800 dark:text-white dark:shadow-none !z-5 overflow-hidden">

          <div className="flex items-center justify-between px-3 mb-4">
            <p className="text-3xl flex items-center font-bold text-black dark:text-white">
              <MdOutlinePermIdentity className="h-12 w-12 mr-3" /> Acerca del area
            </p>
          </div>

          <AreaUpdateForm
              area={area}
              onSuccess={() => {
                navigate(`/page/campus/area`);
              }}
              onCancel={() => {
                navigate(`/page/campus/area`);
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
