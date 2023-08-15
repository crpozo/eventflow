import React from "react";
import Banner from "./components/Banner";
import { DataStore } from "aws-amplify";
import { Event } from "models"
import { useNavigate} from "react-router-dom";
import DevelopmentTable from "./components/DevelopmentTable";

const Marketplace = () => {

  const navigate = useNavigate();
  const [events, setEvents] = React.useState([]);
  const [columns, setColumns] = React.useState([])
  const [rows, setRows] = React.useState([])

  window.localStorage.removeItem('EVENTFLOW.event');

  React.useEffect( () => {
    const subAreaId = JSON.parse(localStorage.getItem("EVENTFLOW.subarea")).id;
    if(!subAreaId){
      navigate(`/page/campus`);
    } else {
      DataStore.query(Event, (e) => e.careerID.eq(subAreaId)).then( results => {
        let columns = [];
        let rows = [];
        setEvents(results);
        console.log("Eventos: ",results)
        columns = [
          {
            Header: "TITULO",
            accessor: "title",
          },
          {
            Header: "CREACION",
            accessor: "create_date",
          },
          {
            Header: "",
            accessor: "action",
          },
        ];
        setColumns(columns);
  
        for( let event of results ){
          rows.push({
            "title": event.title,
            "create_date": event.createdAt,
            "action": event.id,
            "model": event
          })
        }
        setRows(rows)
      });
    }

  }, [navigate]);

  if(!events){
    return <p>Loading...</p>
  }

  return (
    <div className="grid h-full grid-cols-1 gap-5">
      <div className="col-span-1 h-fit w-full xl:col-span-1 2xl:col-span-2">
        <Banner />

        {events.length !== 0 ? 
          <div className="mt-5 grid h-full grid-cols-1 gap-5">
            <DevelopmentTable
              columnsData={columns}
              tableData={rows}
            />
          </div>
          :
          <div className="!z-5 relative flex flex-col bg-white bg-clip-border shadow-3xl shadow-shadow-500 px-[25px] py-[25px] rounded-[20px] dark:!bg-navy-800 dark:text-white dark:shadow-none !z-5 overflow-hidden">
            <p>No existen eventos en la base de datos...</p>
          </div>
        }
        
      </div>
    </div>
  );
};

export default Marketplace;
