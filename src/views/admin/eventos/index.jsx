import React from "react";
import Banner from "./components/Banner";
import { DataStore } from 'aws-amplify/datastore';
import { Event } from "models"
import { useNavigate, Link } from "react-router-dom";
import DevelopmentTable from "./components/DevelopmentTable";
import { formatDate } from 'scripts/utils'
import {
  MdAdd,
} from "react-icons/md";
import { AiOutlineWarning } from "react-icons/ai";

const Marketplace = () => {

  const navigate = useNavigate();
  const [events, setEvents] = React.useState([]);
  const [columns, setColumns] = React.useState([])
  const [rows, setRows] = React.useState([])

  window.localStorage.removeItem('EVENTFLOW.event');

  React.useEffect( () => {
    const subAreaId = JSON.parse(localStorage.getItem("EVENTFLOW.subarea"))?.id;
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
            Header: "EDITAR",
            accessor: "action",
          },
        ];
        setColumns(columns);
  
        for( let event of results ){
          rows.push({
            "title": event.title,
            "create_date": formatDate(event.createdAt),
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
          <div className="!z-5 relative flex flex-col bg-white bg-clip-border shadow-card px-[25px] py-[25px] rounded-[20px] dark:!bg-navy-800 dark:text-white dark:shadow-none !z-5 overflow-hidden">
          <Link className="hover:no-underline mb-4" to="crear">
            <button className="linear flex items-center gap-1 pr-3 pl-3 rounded-xl bg-brand-500 py-[12px] text-sm font-medium text-white transition duration-200 hover:bg-black dark:bg-brand-400 dark:text-white dark:hover:bg-brand-300 dark:active:bg-brand-200">
              Crear Evento <MdAdd className="h-5 w-5" />
            </button>
          </Link>
            <p className="flex gap-2 items-center"> <AiOutlineWarning/> No existen eventos en la base de datos...</p>
          </div>
        }
        
      </div>
    </div>
  );
};

export default Marketplace;
