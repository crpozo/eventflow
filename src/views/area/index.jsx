import React from "react";
import { useNavigate, Link } from "react-router-dom";
import Banner from "./components/Banner";
import NftCard from "components/card/NftCard";
import { DataStore } from "aws-amplify";
import { Area } from "models"
import {
  MdAdd,
  MdChevronLeft
} from "react-icons/md";

const Dashboard = () => {

  const [area, setArea] = React.useState([]);
  const navigate = useNavigate();
  const campusID = JSON.parse(localStorage.getItem("EVENTFLOW.campus")).id

  React.useEffect(() => {
    DataStore.query(Area, (a) => a.campusID.eq(campusID)).then( results => {
      setArea(results);
      console.log("Area: ",results)
    });
  }, [campusID]);

  if(!area){
    return <p>Loading...</p>
  }

  if(!campusID){
    navigate('/page/campus');
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

      <div className="!z-5 relative flex flex-col bg-white bg-clip-border shadow-3xl shadow-shadow-500 px-[25px] py-[25px] rounded-[20px] dark:!bg-navy-800 dark:text-white dark:shadow-none !z-5 overflow-hidden">

        <div className="flex flex-col items-center justify-between gap-3 mb-4 sm:flex-row sm:gap-0">
          <p className="text-2xl font-bold text-navy-700 dark:text-white">
            Selecciona un área
          </p>
          <Link className="hover:no-underline" to="crear"> 
            <button href="crear" className="linear flex items-center gap-1 pr-3 pl-3 rounded-xl bg-brand-500 py-[12px] text-sm font-medium text-white transition duration-200 hover:bg-black dark:bg-brand-400 dark:text-white dark:hover:bg-brand-300 dark:active:bg-brand-200">
              Crear Área <MdAdd className="h-4 w-4" />
            </button>
          </Link>
        </div>

        {area.length !== 0 ?  
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4 mb-4">
            {area && area.map(area => (
              <NftCard
                modelName="area"
                modelID={area.id}
                model={area}
                pathSelect="subarea/"
                pathEdit="editar/"
                key={area.id}
                color="bg-purplePrimary"
                date={area.updatedAt}
                title={area.title}
                cat="Seleccionar"
              />
            ))}
          </div>
        :
         <p>No existen areas para el campus seleccionado...</p>
        }

      </div>

    </div>
  );
};

export default Dashboard;
