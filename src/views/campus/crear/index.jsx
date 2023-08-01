import React from "react";
import Banner from "./components/Banner";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { DataStore } from "aws-amplify";
import { Event } from "models"
import {
  CampusCreateForm 
 } from 'ui-components';
import { useForm } from "react-hook-form"
import {
  MdOutlinePermIdentity,
  MdChevronLeft
} from "react-icons/md";

const Dashboard = () => {

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const [subAreaId, setSubAreaId ] = React.useState();
  const navigate = useNavigate();

  React.useEffect( () => {
    setSubAreaId(localStorage.getItem('subAreaId'));
  }, []);

  const onSubmit = ( formData ) => {
    createEvent(formData);
  }

  async function createEvent(formData) {
    await DataStore.save(
      new Event({
        "title": formData.title,
        "description": formData.description,
        "careerID": subAreaId
      })
    );
    alert("Evento creado con éxito");
  }

  return (
    <div className="campus-page">

      

      <div className="mt-3 grid h-full">
        <Banner />
      </div>

      <Link
        to="/page/campus"
        className="flex gap items-center mb-5 font-medium text-brand-500 hover:no-underline hover:text-navy-700 dark:hover:text-white"
      >
        <MdChevronLeft className="h-7 w-7" /> Lista de campus
      </Link>

      <div className="!z-5 relative flex flex-col bg-white bg-clip-border shadow-3xl shadow-shadow-500 px-[14px] pt-[34px] rounded-3xl sm:px-[34px] dark:!bg-navy-800 dark:text-white dark:shadow-none !z-5 overflow-hidden">

          <div className="flex items-center justify-between px-3 mb-4">
            <p className="text-3xl flex items-center font-bold text-black dark:text-white">
              <MdOutlinePermIdentity className="h-12 w-12 mr-3" /> Acerca del Campus
            </p>
          </div>
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
