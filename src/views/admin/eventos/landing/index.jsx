import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import Banner from "./components/Banner";
import { DataStore } from "aws-amplify";
import { Event } from "models"
import { useForm } from "react-hook-form"

const Dashboard = () => {

  const [event, setEvent] = React.useState([]);
  const id = useParams().id;
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm();

  const onSubmit = ( formData ) => {
    if(event){
      updateEvent(event.id, formData);
    }
  }

  React.useEffect(() => {
    console.log(id)
    if(!id || id === "no-id"){
      navigate(`/admin/eventos`);
      return 
    }    
  }, [id,setValue, navigate]);

  async function updateEvent(id, formData) {
    const updatedEvent= await DataStore.save(
      Event.copyOf(event, updated => {
        updated.title = formData.title;
        updated.description = formData.description;
      })
    );
    setEvent(updatedEvent);
    alert("Evento actualizado con éxito");
  }
  
  if(!event){
    return <p>Loading...</p>
  }

  return (
    <div className="campus-page">
      <div className="mt-3 grid h-full">
        {/* NFt Banner */}
        <Banner />
      </div>
      {event &&
        <>
          <form onSubmit={handleSubmit(onSubmit)}>
            <input {...register("title", { required: true })}/>
            {errors.title && <p>This field is required</p>}
            <input {...register("description", { required: true })} />
            {errors.description && <p>This field is required</p>}
            <div>
            <input className="linear mt-2 rounded-xl bg-brand-500 py-[12px] text-base font-medium text-white transition duration-200 hover:bg-brand-600 active:bg-brand-700 dark:bg-brand-400 dark:text-white dark:hover:bg-brand-300 dark:active:bg-brand-200" value="Guardar" type="submit" />
            </div>
          </form>
        </>
      }
    </div>
  );
};

export default Dashboard;
