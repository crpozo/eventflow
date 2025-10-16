import React from "react";
import Banner from "./components/Banner";
import { DataStore } from 'aws-amplify/datastore';
import { Event, Landing, Form, Badge } from "models"
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
  const [duplicating, setDuplicating] = React.useState(null);
  const { loading, isAdmin } = usePermissions();

  window.localStorage.removeItem('EVENTFLOW.event');

  const duplicateEvent = async (eventId) => {
    try {
      setDuplicating(eventId);

      // Obtener el evento original con sus relaciones
      const originalEvent = await DataStore.query(Event, eventId);
      if (!originalEvent) {
        alert("Error: Evento no encontrado");
        return;
      }

      // Primero crear el nuevo evento (sin las relaciones)
      const newEvent = await DataStore.save(new Event({
        title: `${originalEvent.title} (Copia)`,
        description: originalEvent.description,
        category: originalEvent.category,
        location: originalEvent.location,
        date: originalEvent.date,
        contactTemplate: originalEvent.contactTemplate,
        termsCondition: originalEvent.termsCondition,
        totalScannedTicket: originalEvent.totalScannedTicket,
        maxRegs: originalEvent.maxRegs,
        eventIdUSFQ: originalEvent.eventIdUSFQ,
        periodoUSFQ: originalEvent.periodoUSFQ,
        usuarioUSFQ: originalEvent.usuarioUSFQ,
        careerID: originalEvent.careerID,
      }));

      // Duplicar Badge si existe y actualizar el evento
      if (originalEvent.eventBadgeId) {
        const originalBadge = await DataStore.query(Badge, originalEvent.eventBadgeId);
        if (originalBadge) {
          const newBadge = await DataStore.save(new Badge({
            frontDesign: originalBadge.frontDesign,
            backDesign: originalBadge.backDesign,
          }));

          // Actualizar el evento con el nuevo badge
          await DataStore.save(
            Event.copyOf(newEvent, (updated) => {
              updated.eventBadgeId = newBadge.id;
            })
          );
        }
      }

      // Duplicar Landing si existe
      // Buscar landing asociada al evento original
      const landings = await DataStore.query(Landing, (l) => l.landingEventId.eq(eventId));
      if (landings && landings.length > 0) {
        const originalLanding = landings[0];
        console.log("Landing original encontrada:", originalLanding);

        const newLandingData = {
          active: originalLanding.active,
          title: originalLanding.title,
          description: originalLanding.description,
          mainBanner: originalLanding.mainBanner,
          location: originalLanding.location,
          cost: originalLanding.cost,
          ticketTitle: originalLanding.ticketTitle,
          ticketPrice: originalLanding.ticketPrice,
          extraInfo: originalLanding.extraInfo,
          userConsentCheck: originalLanding.userConsentCheck,
          metaScripts: originalLanding.metaScripts,
          Event: newEvent, // Establecer la relación con el nuevo evento
        };

        console.log("Nueva landing a crear:", newLandingData);
        const newLanding = await DataStore.save(new Landing(newLandingData));
        console.log("Landing duplicada exitosamente:", newLanding);
      }

      // Duplicar Form si existe
      // Buscar formulario asociado al evento original
      const forms = await DataStore.query(Form, (f) => f.formEventId.eq(eventId));
      if (forms && forms.length > 0) {
        const originalForm = forms[0];
        console.log("Form original encontrado:", originalForm);

        const newForm = await DataStore.save(new Form({
          questions: originalForm.questions,
          Event: newEvent, // Establecer la relación con el nuevo evento
        }));
        console.log("Form duplicado exitosamente:", newForm);
      }

      alert(`Evento duplicado exitosamente: ${newEvent.title}`);

      // Recargar la lista de eventos
      const results = isAdmin
        ? await DataStore.query(Event)
        : await DataStore.query(Event, (e) => e.careerID.eq(JSON.parse(localStorage.getItem("EVENTFLOW.subarea"))?.id));

      setEvents(results);
      buildTable(results);

    } catch (error) {
      console.error("Error duplicando evento:", error);
      alert("Error al duplicar el evento. Por favor, intenta de nuevo.");
    } finally {
      setDuplicating(null);
    }
  };

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
     { Header: "ACCIONES", accessor: "duplicate" },
   ];
   setColumns(columns);
   const rows = results.map((event) => ({
     title: event.title,
     update_date: formatDate(event.date),
     action: event.id,
     duplicate: event.id,
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
    return (<div className="bottom-0 left-0 right-0 top-[-10px] z-50 flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-lightPrimary opacity-[100%] p-3">
        <span className="loader"></span>
        <h2 className="mb-2 text-center text-xl text-black">
          Cargando...
        </h2>
      </div>)
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
              onDuplicate={duplicateEvent}
              duplicating={duplicating}
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
