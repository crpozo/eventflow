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

      <div className="!z-5 relative flex flex-col bg-white bg-clip-border shadow-3xl shadow-shadow-500 px-[14px] py-[34px] rounded-3xl sm:px-[34px] dark:!bg-navy-800 dark:text-white dark:shadow-none !z-5 overflow-hidden">

        <div className="flex items-center justify-between mb-4">
          <p className="text-xl font-medium text-black dark:text-white">
            Selecciona un campus al cual deseas acceder
          </p>
          <Link className="hover:no-underline" to="crear"> 
            <button href="crear" className="linear flex items-center gap-1 pr-4 pl-4 rounded-xl bg-brand-500 py-[12px] text-base font-medium text-white transition duration-200 hover:bg-black dark:bg-brand-400 dark:text-white dark:hover:bg-brand-300 dark:active:bg-brand-200">
              Crear Campus <MdAdd className="h-5 w-5" />
            </button>
          </Link>
        </div>

        {/* Recently Add NFTs */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4 mb-4">
          {campus && campus.map(campus => (
             <NftCard
              propId={campus.id}
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

      </div>
    </div>
  );
};

export default Dashboard;
