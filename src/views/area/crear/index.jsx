import React from "react";
import Banner from "./components/Banner";
import { useNavigate,  Link } from "react-router-dom";
import { AreaCreateForm } from 'ui-components';
import {
  MdOutlinePermIdentity,
  MdChevronLeft
} from "react-icons/md";

const Dashboard = () => {

  const navigate = useNavigate();
  const campusID = JSON.parse(localStorage.getItem("EVENTFLOW.campus")).id

  return (
    <div className="area-page">
      <div className="grid h-full">
        <Banner />
      </div>

      <Link
        to="/page/campus/area"
        className="flex gap items-center mb-[32px] font-medium text-brand-500 hover:no-underline hover:text-navy-700 dark:hover:text-white"
      >
        <MdChevronLeft className="h-7 w-7" /> Lista de areas
      </Link>

      <div className="!z-5 relative flex flex-col bg-white bg-clip-border shadow-card px-[14px] pt-[34px] rounded-3xl sm:px-[34px] dark:!bg-navy-800 dark:text-white dark:shadow-none !z-5 overflow-hidden">

          <AreaCreateForm 

            overrides={{
              campusId: {
                errorMessage: "El titulo es un campo obligatorio"
              }
            }}

            onSuccess={() => {
              alert("Area creada con éxito")
              navigate(`/page/campus/area`);
            }}
            onSubmit={(fields) => {
              if(campusID){
                fields.campusID = campusID;
                return fields;
              }
            }}
            onCancel={() => {
              navigate(`/page/campus/area`);
            }}
          />

        </div>
    </div>
  );
};

export default Dashboard;
