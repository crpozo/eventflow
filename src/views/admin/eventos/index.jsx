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
import { usePermissions } from "../../../providers/PermissionsProvider"; 


const Marketplace = () => {

  const navigate = useNavigate();
  const [events, setEvents] = React.useState([]);
  const [columns, setColumns] = React.useState([])
  const [rows, setRows] = React.useState([])
  const { loading, isAdmin } = usePermissions();

  window.localStorage.removeItem('EVENTFLOW.event');

  const buildTable = (results) => {
   const columns = [
     { Header: "TITULO", accessor: "title" },
     {
       Header: "ACTUALIZACIÓN",
       accessor: "update_date",
       sortType: (rowA, rowB, columnId) => {
         const parseDate = (str) => {
           const [day, month, year] = str.split("/").map(Number);
           return new Date(year, month - 1, day);
         };
         return parseDate(rowA.values[columnId]) - parseDate(rowB.values[columnId]);
       },
     },
     { Header: "EDITAR", accessor: "action" },
   ];
   setColumns(columns);
   const rows = results.map((event) => ({
     title: event.title,
     update_date: formatDate(event.date),
     action: event.id,
     model: event,
   }));
   setRows(rows);
 };

  React.useEffect( () => {
    
    if (loading) return; 

    const load = async () => {
      if (isAdmin) {
        // Admin: get all events
        const results = await DataStore.query(Event);
        setEvents(results);
        buildTable(results);
        return;
      }

      // No admin: requires subárea and filter by careerID
      const subAreaId = JSON.parse(localStorage.getItem("EVENTFLOW.subarea"))?.id;
      if (!subAreaId) {
        navigate(`/page/campus`);
        return;
      }
      const results = await DataStore.query(Event, (e) => e.careerID.eq(subAreaId));
      setEvents(results);
      buildTable(results);
    };
    load();
  }, [loading, isAdmin, navigate]);

  if(loading){
    return <p>Cargando...</p>
  }

  return (
    <div className="grid h-full grid-cols-1 gap-5">
      <div className="col-span-1 h-fit w-full xl:col-span-1 2xl:col-span-2">
        <Banner />

        {events.length !== 0 ? 
          <div className="grid h-full grid-cols-1 gap-5">
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
