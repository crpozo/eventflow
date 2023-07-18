import React from "react";
import Banner from "./components/Banner";
import { DataStore } from "aws-amplify";
import { Event } from "models"
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
        {/* NFt Banner */}
        <Banner />
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
          <input {...register("title", { required: true })}/>
          <input {...register("description", { required: true })} />
          {errors.exampleRequired && <p>This field is required</p>}
          <div>
          <input type="submit" />
          </div>
        </form>
    </div>
  );
};

export default Dashboard;
