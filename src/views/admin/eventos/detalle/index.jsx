import React from "react";
import { useLocation} from "react-router-dom";
import Banner from "./components/Banner";
import { DataStore } from "aws-amplify";
import { Event } from "models"
import { useForm, SubmitHandler } from "react-hook-form"

const Dashboard = () => {

  const [event, setEvent] = React.useState([]);
  const { state } = useLocation();
  const id = state?.id;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm()
  const onSubmit = (data) => console.log(data)


  React.useEffect(() => {
    // AWS amplify data
    DataStore.query(Event, (c) => c.id.eq(id)).then( results => {
      setEvent(results);
      console.log("Event: ",results)
    });
  }, [id]);

  if(!event){
    return <p>Loading...</p>
  }
  return (
    <div className="campus-page">
      <div className="mt-3 grid h-full">
        {/* NFt Banner */}
        <Banner />
      </div>
      {event && event.map( (event,i) => {
        return (
          <form key={i} onSubmit={handleSubmit(onSubmit)}>
            <input defaultValue={event.title} {...register("example")}/>
            <input defaultValue={event.description} {...register("exampleRequired", { required: true })} />
            {errors.exampleRequired && <p>This field is required</p>}
            <div>
            <input type="submit" />
            </div>
          </form>
        )
      })}
    </div>
  );
};

export default Dashboard;
