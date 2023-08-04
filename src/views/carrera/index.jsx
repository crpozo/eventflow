import React from "react";
import { useNavigate, useLocation} from "react-router-dom";
import Banner from "./components/Banner";
import { DataStore } from "aws-amplify";
import { Career } from "models"

const Dashboard = () => {

  const [subArea, setSubArea] = React.useState([]);
  const navigate = useNavigate();
  const areaID = localStorage.getItem('areaID');

  React.useEffect(() => {
    // AWS amplify data 
    DataStore.query(Career, (a) => a.areaID.eq(areaID)).then( results => {
      setSubArea(results);
      console.log("SubArea: ",results)
    });
  }, []);

  if(!subArea){
    return <p>Loading...</p>
  }

  if(!areaID){
    navigate('/page/campus');
  }

  return (
    <div className="subArea-page">
      <div className="mt-3 grid h-full">
        {/* NFt Banner */}
        <Banner />
      </div>
      <ul>
        {subArea && subArea.map( (subArea,i) => {
          return <li onClick={() => {
            localStorage.setItem("subAreaID", subArea.id)
            navigate(`/`, { state: { id: subArea.id} });
           }} key={i}>{subArea.title}</li>
        })}
      </ul>
    </div>
  );
};

export default Dashboard;
