import React from "react";
import Banner from "./components/Banner";
import { useNavigate,  Link } from "react-router-dom";
import { CareerCreateForm } from 'ui-components';
import {
  MdOutlinePermIdentity,
  MdChevronLeft
} from "react-icons/md";

const Dashboard = () => {

  const navigate = useNavigate();
  const areaID = JSON.parse(localStorage.getItem("EVENTFLOW.area")).id;

  return (
    <div className="area-page">
      <div className="grid h-full">
        <Banner />
      </div>

      <Link
        to="/page/campus/area/subarea"
        className="flex gap items-center mb-[32px] font-medium text-brand-500 hover:no-underline hover:text-navy-700 dark:hover:text-white"
      >
        <MdChevronLeft className="h-7 w-7" /> Lista de subareas
      </Link>

      <div className="!z-5 relative flex flex-col bg-white bg-clip-border shadow-3xl shadow-shadow-500 px-[14px] pt-[34px] rounded-3xl sm:px-[34px] dark:!bg-navy-800 dark:text-white dark:shadow-none !z-5 overflow-hidden">

          <div className="flex items-center justify-between px-3 mb-4">
            <p className="text-3xl flex items-center font-bold text-black dark:text-white">
              <MdOutlinePermIdentity className="h-12 w-12 mr-3" /> Acerca del Subárea
            </p>
          </div>
          <CareerCreateForm 

            onSuccess={() => {
              alert("Subarea creada con éxito")
              navigate(`/page/campus/area/subarea`);
            }}
            onSubmit={(fields) => {
              if(areaID){
                fields.areaID = areaID;
                return fields;
              }
            }}
            onCancel={() => {
              navigate(`/page/campus/area/subarea`);
            }}
          />

        </div>
    </div>
  );
};

export default Dashboard;
