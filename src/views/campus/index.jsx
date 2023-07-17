import React from "react";
import { useNavigate } from "react-router-dom";
import Banner from "./components/Banner";
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
      <div className="mt-3 grid h-full">
        {/* NFt Banner */}
        <Banner />
      </div>
      <ul>
        {campus && campus.map( (campus,i) => {
          return <li onClick={() => navigate(`area/`, { state: { id: campus.id} }) } key={i}>{campus.title}</li>
        })}
      </ul>
    </div>
  );
};

export default Dashboard;
