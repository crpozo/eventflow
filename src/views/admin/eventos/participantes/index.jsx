import React from "react";
import Banner from "./components/Banner";
import { DataStore } from 'aws-amplify/datastore';
import { Attendee } from "models"
import { useNavigate, useParams } from "react-router-dom";
import DevelopmentTable from "./components/DevelopmentTable";
import { formatDate } from 'scripts/utils'

const Marketplace = () => {

  const navigate = useNavigate();
  const [columns, setColumns] = React.useState(null);
  const [rows, setRows] = React.useState(null);
  const id = useParams().id;

  React.useEffect(() => {
    if(!id || id === "no-id"){
      navigate(`/admin/eventos`);
      return 
    }
  }, [id, navigate]);

  React.useEffect(() => {

    const sub = DataStore.observeQuery(Attendee, (a) =>
      a.EventAttendees.eventID.eq(id)
    ).subscribe(({ items }) => {
      try{

        let columns = [
          {
            Header: "ID",
            accessor: "id",
          },
          {
            Header: "Creacion",
            accessor: "create_date",
          },
          {
            Header: "Detalle",
            accessor: "action",
          },
        ];
        setColumns(columns);

        let updatedRows = items.map(user => ({
          id: user.id,
          create_date: formatDate(user.createdAt),
          action: user.id
        }));

        setRows(updatedRows);

      } catch (e) {
        console.error("Error in observeQuery subscription:", e);
      }
    });

    return () => {
      sub.unsubscribe();
    };

  }, [id]);

  if(!rows){
    return <p>Loading...</p>
  }

  return (
    <div className="grid h-full grid-cols-1 gap-5">
      <div className="col-span-1 h-fit w-full xl:col-span-1 2xl:col-span-2">
        <Banner />

        <div className="grid h-full grid-cols-1 gap-5">
          
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
