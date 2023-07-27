import React from "react";
import Banner from "./components/Banner";
import { DataStore } from "aws-amplify";
import { Attendee } from "models"
import { useNavigate, useParams } from "react-router-dom";
import DevelopmentTable from "./components/DevelopmentTable";

const Marketplace = () => {

  const navigate = useNavigate();
  const [user, setuser] = React.useState([]);
  const [columns, setColumns] = React.useState([]);
  const [rows, setRows] = React.useState([]);
  const id = useParams().id;

  React.useEffect(() => {
    if(!id || id === "no-id"){
      navigate(`/admin/eventos`);
      return 
    }
  }, [id, navigate]);

  React.useEffect(() => {
    DataStore.query(Attendee).then( (results) => {
      let columns = [];
      let rows = [];
      setuser(results);
      console.log("Usuarios: ",results)
      columns = [
        {
          Header: "Nombre",
          accessor: "name",
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

      for( let user of results ){
        rows.push({
          "name": user.name,
          "create_date": user.createdAt,
          "action": user.id
        })
      }
      setRows(rows)
    });
    
  }, []);

  if(!user){
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
