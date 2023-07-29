import React from "react";
import Banner from "./components/Banner";
import { DataStore } from "aws-amplify";
import { Event } from "models"
import {
  CampusCreateForm 
 } from 'ui-components';
import { useForm } from "react-hook-form"

const Dashboard = () => {

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const [subAreaId, setSubAreaId ] = React.useState();

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

      <CampusCreateForm 

        overrides={{
          title: {
            errorMessage: "El titulo es un campo obligatorio"
          }
        }}

        onSubmit={(fields) => {
          console.log("guardar")
        }}
        onCancel={() => {
          console.log("cancelar")
        }}
        
      />

    </div>
  );
};

export default Dashboard;
