import React from "react";
import { DataStore } from 'aws-amplify/datastore';
import { Event, Landing, Form, Badge, Area, Career } from "models"
import { useNavigate, Link } from "react-router-dom";
import DevelopmentTable from "./components/DevelopmentTable";
import { formatDate } from 'scripts/utils'
import {
  MdAdd,
} from "react-icons/md";
import { AiOutlineWarning } from "react-icons/ai";
import { usePermissions } from "../../../providers/PermissionsProvider";
import { PageHeader, Card, PrimaryButton } from "components/adminUi";


const Marketplace = () => {

  const navigate = useNavigate();
  const [events, setEvents] = React.useState([]);
  const [columns, setColumns] = React.useState([])
  const [rows, setRows] = React.useState([])
  const [duplicating, setDuplicating] = React.useState(null);
  // Area filter (admin only): list of areas + careerID -> areaID map + selection
  const [areas, setAreas] = React.useState([]);
  const [careerToArea, setCareerToArea] = React.useState({});
  const [selectedArea, setSelectedArea] = React.useState("");
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
       Header: "FECHA DEL EVENTO",
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
     update_date: formatDate(event.startDate || event.date),
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
        // Admin: get all events + areas/careers to enable the area filter
        const [results, areaList, careerList] = await Promise.all([
          DataStore.query(Event),
          DataStore.query(Area),
          DataStore.query(Career),
        ]);
        const map = {};
        careerList.forEach((c) => {
          map[c.id] = c.areaID;
        });
        setCareerToArea(map);
        setAreas(
          areaList
            .slice()
            .sort((a, b) => (a.title || "").localeCompare(b.title || ""))
        );
        setEvents(results);
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
    };
    load();
  }, [loading, isAdmin, navigate]);

  // Rebuild the table whenever the events or the selected area change.
  React.useEffect(() => {
    const filtered = selectedArea
      ? events.filter((e) => careerToArea[e.careerID] === selectedArea)
      : events;
    buildTable(filtered);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, selectedArea, careerToArea]);

  if(loading){
    return (
      <div className="flex min-h-[60vh] w-full flex-col items-center justify-center">
        <span className="loader"></span>
        <h2 className="mt-2 text-xl text-black dark:text-white">Cargando…</h2>
      </div>
    )
  }

  return (
    <div className="mt-3">
      <PageHeader
        crumbs={[{ label: "Eventos" }]}
        title="Eventos"
        subtitle="Crea y administra los eventos de la organización."
      />

      {events.length !== 0 ?
        <div className="grid h-full grid-cols-1 gap-5">
          <DevelopmentTable
            columnsData={columns}
            tableData={rows}
            onDuplicate={duplicateEvent}
            duplicating={duplicating}
            areas={areas}
            selectedArea={selectedArea}
            onAreaChange={setSelectedArea}
          />
        </div>
        :
        <Card>
          <Link className="mb-4 inline-block hover:no-underline" to="crear">
            <PrimaryButton type="button" className="flex items-center gap-1">
              Crear Evento <MdAdd className="h-5 w-5" />
            </PrimaryButton>
          </Link>
          <p className="flex items-center gap-2 text-sm text-navy-700 dark:text-white">
            <AiOutlineWarning /> No existen eventos en la base de datos...
          </p>
        </Card>
      }
    </div>
  );
};

export default Marketplace;
