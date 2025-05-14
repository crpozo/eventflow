import React from "react";
import Banner from "./components/Banner";
import { useNavigate, Link } from "react-router-dom";
import { CampusCreateForm } from 'ui-components';
import {
  MdOutlinePermIdentity,
  MdChevronLeft
} from "react-icons/md";

const Dashboard = () => {

  const navigate = useNavigate();

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

      <div className="!z-5 relative flex flex-col bg-white bg-clip-border shadow-card px-[14px] pt-[34px] rounded-3xl sm:px-[34px] dark:!bg-navy-800 dark:text-white dark:shadow-none !z-5 overflow-hidden">

          <CampusCreateForm 
            overrides={{
              title: {
                errorMessage: "El titulo es un campo obligatorio"
              }
            }}

            onSuccess={() => {
              alert("Campus creado con éxito")
              navigate('/page/campus');
            }}
            onCancel={() => {
              navigate('/page/campus');
            }}
          />

        </div>
    </div>
  );
};

export default Dashboard;
