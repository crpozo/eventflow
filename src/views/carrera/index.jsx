import React from "react";
import { useNavigate, Link } from "react-router-dom";
import NftCard from "components/card/NftCard";
import Banner from "./components/Banner";
import { DataStore } from 'aws-amplify/datastore';
import { Career } from "models";
import {
  MdAdd,
  MdChevronLeft
} from "react-icons/md";
import { AiOutlineWarning } from "react-icons/ai";

const Dashboard = () => {

  const [subArea, setSubArea] = React.useState([]);
  const navigate = useNavigate();
  const areaID = JSON.parse(localStorage.getItem("EVENTFLOW.area")).id;

  React.useEffect(() => {

    const sub = DataStore.observeQuery(Career, (a) => a.areaID.eq(areaID)).subscribe((results) => {
      setSubArea(results.items);
      console.log("SubArea: ",results.items)
    });

    return () => {
      sub.unsubscribe();
    };

  }, [areaID]);

  if(!subArea){
    return <p>Loading...</p>
  }

  if(!areaID){
    navigate('/page/campus');
  }

  return (
    <div className="subArea-page">
      
      <div className="grid h-full">
        <Banner />
      </div>

      <Link
        to="/page/campus/area"
        className="flex gap items-center mb-[32px] font-medium text-brand-500 hover:no-underline hover:text-navy-700 dark:hover:text-white"
      >
        <MdChevronLeft className="h-7 w-7" /> Lista de areas
      </Link>

      <div className="!z-5 relative flex flex-col bg-white bg-clip-border shadow-card px-[25px] py-[25px] rounded-[20px] dark:!bg-navy-800 dark:text-white dark:shadow-none !z-5 overflow-hidden">

        <div className="flex flex-col items-center justify-between gap-3 mb-4 sm:flex-row sm:gap-0">
          <p className="text-2xl font-medium text-navy-700 dark:text-white">
            Selecciona una subárea
          </p>
          <Link className="hover:no-underline" to="crear"> 
            <button href="crear" className="linear flex items-center gap-1 pr-3 pl-3 rounded-xl bg-brand-500 py-[12px] text-sm font-medium text-white transition duration-200 hover:bg-black dark:bg-brand-400 dark:text-white dark:hover:bg-brand-300 dark:active:bg-brand-200">
              Crear Subárea <MdAdd className="h-4 w-4" />
            </button>
          </Link>
        </div>

        {subArea.length !== 0 ?  
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4 3xl:grid-cols-4 mb-4">
            {subArea && subArea.map(subArea => (
              <NftCard
                modelName="subarea"
                modelID={subArea.id}
                model={subArea}
                pathSelect="/"
                pathEdit="editar/"
                key={subArea.id}
                color="bg-usfqPrimary"
                date={subArea.updatedAt}
                title={subArea.title}
                cat="Seleccionar"
              />
            ))}
          </div>
        :
        <p className="flex gap-2 items-center"><AiOutlineWarning/> No existen subáreas para el área seleccionada...</p>
        }

      </div>
    </div>

  );
};

export default Dashboard;
