import React from "react";
import { Link } from "react-router-dom";
import Banner from "./components/Banner";
import NftCard from "components/card/NftCard";
import { DataStore } from "aws-amplify";
import { Campus } from "models"
import {
  MdAdd
} from "react-icons/md";

const Dashboard = () => {

  const [campus, setCampus] = React.useState([]);

  React.useEffect(() => {
    // AWS amplify data 
    DataStore.query(Campus).then( (results) => {
      setCampus(results);
      console.log("Campus: ",results)
    });
  }, []);

  if(!campus){
    return <p>Loading...</p>
  }

  return (
    <div className="campus-page">
  
      <div className="grid h-full">
        <Banner />
      </div>  

      <div className="!z-5 relative flex flex-col bg-white bg-clip-border shadow-3xl shadow-shadow-500 px-[25px] py-[25px] rounded-[20px] dark:!bg-navy-800 dark:text-white dark:shadow-none !z-5 overflow-hidden">

        <div className="flex flex-col items-center justify-between gap-3 mb-4 sm:flex-row sm:gap-0">
          <p className="text-2xl font-bold text-navy-700 dark:text-white">
            Selecciona un campus
          </p>
          <Link className="hover:no-underline" to="crear"> 
            <button href="crear" className="linear flex items-center gap-1 pr-3 pl-3 rounded-xl bg-brand-500 py-[12px] text-sm font-medium text-white transition duration-200 hover:bg-black dark:bg-brand-400 dark:text-white dark:hover:bg-brand-300 dark:active:bg-brand-200">
              Crear Campus <MdAdd className="h-4 w-4" />
            </button>
          </Link>
        </div>

        {campus.length !== 0 ?  
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4 mb-4">
            {campus && campus.map(campus => (
              <NftCard
                modelName="campus"
                modelID={campus.id}
                pathSelect="area/"
                pathEdit="editar/"
                key={campus.id}
                color="bg-pinkPrimary"
                date={campus.updatedAt}
                title={campus.title}
                cat="Seleccionar"
              />
            ))}
          </div>
         :
         <p>No existen campus en la base de datos...</p>
        }

      </div>
    </div>
  );
};

export default Dashboard;
