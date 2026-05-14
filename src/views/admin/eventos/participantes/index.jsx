import React from "react";
import Banner from "./components/Banner";
import { DataStore } from 'aws-amplify/datastore';
import { EventAttendee, Event } from "models"
import { useNavigate, useParams } from "react-router-dom";
import DevelopmentTable from "./components/DevelopmentTable";
import { formatDate } from 'scripts/utils'
import { regenMissingTickets } from "services/regenMissingTickets";

const Marketplace = () => {

  const navigate = useNavigate();
  const [columns, setColumns] = React.useState(null);
  const [rows, setRows] = React.useState(null);
  const [event, setEvent] = React.useState(null);
  const id = useParams().id;

  React.useEffect(() => {
    if(!id || id === "no-id"){
      navigate(`/admin/eventos`);
      return
    }

    // Cargar el evento para obtener el Badge
    DataStore.query(Event, id).then((result) => {
      setEvent(result);
    });
  }, [id, navigate]);

  React.useEffect(() => {
    if (!event) return;
    window.__regenMissingTickets = (opts) => regenMissingTickets(event, opts);
    console.info(
      `[regen] Listo. Ejecuta window.__regenMissingTickets() para regenerar tickets faltantes del evento "${event.title}". ` +
        `Para previsualizar sin enviar: window.__regenMissingTickets({ dryRun: true }).`
    );
    return () => {
      delete window.__regenMissingTickets;
    };
  }, [event]);

  React.useEffect(() => {

    const sub = DataStore.observeQuery(EventAttendee, (ea) =>
      ea.eventID.eq(id)
    ).subscribe(({ items }) => {
      try{

        let columns = [
          {
            Header: "Email",
            accessor: "email",
          },
          {
            Header: "Creacion",
            accessor: "create_date",
          },
          {
            Header: "Acciones",
            accessor: "actions",
          },
        ];
        setColumns(columns);

        let updatedRows = items.map(eventAttendee => ({
          email: eventAttendee.email,
          create_date: formatDate(eventAttendee.createdAt),
          actions: eventAttendee,
          eventAttendee: eventAttendee
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
            event={event}
          />
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
