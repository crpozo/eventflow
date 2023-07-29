import React from "react";
import { useNavigate, useLocation} from "react-router-dom";
import Banner from "./components/Banner";
import { DataStore } from "aws-amplify";
import { Area } from "models"

const Dashboard = () => {

  const [area, setArea] = React.useState([]);

  const navigate = useNavigate();
  const { state } = useLocation();
  const id = state?.id;

  React.useEffect(() => {
    console.log(state)
    // AWS amplify data 
    DataStore.query(Area, (c) => c.campusID.eq(id)).then( results => {
      setArea(results);
      console.log("Area: ",results)
    });
  }, [id]);

  if(!area){
    return <p>Loading...</p>
  }

  if(!id){
    navigate('/');
  }

  return (
    <div className="area-page">
      <div className="mt-3 grid h-full">
        {/* NFt Banner */}
        <Banner />
      </div>
      <ul>
        {area && area.map( (area,i) => {
          return <li onClick={() => navigate(`subarea/`, { state: { id: area.id} }) } key={i}>{area.title}</li>
        })}
      </ul>
    </div>
  );
};

export default Dashboard;
