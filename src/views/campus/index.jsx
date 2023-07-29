import React from "react";
import { useNavigate, Link } from "react-router-dom";
import Banner from "./components/Banner";
import NftCard from "components/card/NftCard";
import { DataStore } from "aws-amplify";
import { Campus } from "models"

const Dashboard = () => {

  const [campus, setCampus] = React.useState([]);

  const navigate = useNavigate();

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

      <div className="!z-5 relative flex flex-col bg-white bg-clip-border shadow-3xl shadow-shadow-500 px-[34px] py-[34px] rounded-3xl dark:!bg-navy-800 dark:text-white dark:shadow-none !z-5 overflow-hidden">

        <div className="flex items-center justify-end mb-5">
          <Link className="" to="crear"> 
            <button href="crear" className="linear mt-2 pr-4 pl-4 rounded-xl bg-brand-500 py-[12px] text-base font-medium text-white transition duration-200 hover:bg-black dark:bg-brand-400 dark:text-white dark:hover:bg-brand-300 dark:active:bg-brand-200">
              Crear Campus
            </button>
          </Link>
        </div>

        {/* Recently Add NFTs */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-4 mb-4">
          {campus && campus.map(campus => (
             <NftCard
              key={campus.id}
              color="bg-pinkPrimary"
              title={campus.title}
              cat="Seleccionar"
            />
          ))}
        </div>

        {/* <ul>
          {campus && campus.map( (campus,i) => {
            return <li onClick={() => navigate(`area/`, { state: { id: campus.id} }) } key={i}>{campus.title}</li>
          })}
        </ul> */}
      </div>
    </div>
  );
};

export default Dashboard;
