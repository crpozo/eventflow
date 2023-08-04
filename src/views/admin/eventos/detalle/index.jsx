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
      updateEvent(formData);
    }
  }
  
  React.useEffect(() => {
    if(!id || id === "no-id"){
      navigate(`/admin/eventos`);
      return 
    }

    localStorage.setItem("eventID", id)

    DataStore.query(Event, (c) => c.id.eq(id)).then( results => {
      setEvent(results[0]);
      console.log("Event: ", results)
      setValue("title", results[0].title);
      setValue("description", results[0].description);
    });
  }, [id,setValue, navigate]);

  async function updateEvent(formData) {
    const updatedEvent= await DataStore.save(
      Event.copyOf(event, updated => {
        updated.title = formData.title;
        updated.description = formData.description;
      })
    );
    setEvent(updatedEvent);
    alert("Evento actualizado con éxito");
  }

  const deleteEvent = () => {
    DataStore.delete(event);
    alert("Evento eliminado con éxito")
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
          <button onClick={deleteEvent} className="linear mt-2 rounded-xl bg-red-500 py-[12px] text-base font-medium text-white transition duration-200 hover:bg-red-600 active:bg-red-700 dark:bg-red-400 dark:text-white dark:hover:bg-red-300 dark:active:bg-red-200">
            Eliminar Evento
          </button>
        </>
      }
    </div>
  );
};

export default Dashboard;
