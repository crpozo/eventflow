import React from "react";
import Banner from "./components/Banner";
import { DataStore } from "aws-amplify";
import { Event } from "models"
import { useNavigate} from "react-router-dom";
import DevelopmentTable from "./components/DevelopmentTable";

const Marketplace = () => {

  const navigate = useNavigate();
  const [eventos, setEventos] = React.useState([]);
  const [columns, setColumns] = React.useState([])
  const [rows, setRows] = React.useState([])

  React.useEffect( () => {
    const subAreaId = localStorage.getItem('subAreaId');
    if(!subAreaId){
      navigate(`/page/campus`);
    }
  }, [navigate]);

  React.useEffect(() => {
    DataStore.query(Event).then( (results) => {
      let columns = [];
      let rows = [];
      setEventos(results);
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
          Header: "ACCION",
          accessor: "action",
        },
      ];
      setColumns(columns);

      for( let event of results ){
        rows.push({
          "title": event.title,
          "create_date": event.createdAt,
          "action": event.id
        })
      }
      setRows(rows)
    });
  }, []);

  if(!eventos){
    return <p>Loading...</p>
  }


  return (
    <div className="mt-3 grid h-full grid-cols-1 gap-5">
      <div className="col-span-1 h-fit w-full xl:col-span-1 2xl:col-span-2">
        {/* NFt Banner */}
        <Banner />

        <div className="mt-5 grid h-full grid-cols-1 gap-5">
          <DevelopmentTable
            columnsData={columns}
            tableData={rows}
          />
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
