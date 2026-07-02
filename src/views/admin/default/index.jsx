import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { DataStore } from 'aws-amplify/datastore';
import { Event } from "models"
import {
  MdBarChart
} from "react-icons/md";
import { AiOutlineWarning } from "react-icons/ai";
import { usePermissions } from "../../../providers/PermissionsProvider";
import { PageHeader, Card, TYPE } from "components/adminUi";

const cards = [
  {
    title: "Todos mis eventos",
    gradient: "bg-gradient-to-br from-[#FFFFFF] to-[#fff]",
    link: "/admin/eventos",
  },
  {
    title: "Visualizar Reportes",
    gradient: "bg-gradient-to-br from-[#FFFFFF] to-[#fff]",
    link: "/admin/reportes",
  },
  {
    title: "Crear un evento",
    gradient: "bg-gradient-to-br from-[#FFFFFF] to-[#fff]",
    link: "/admin/eventos/crear",
  },
];

const Dashboard = () => {

  const [events, setEvents] = React.useState([]);
  const navigate = useNavigate();
  const { loading, isAdmin } = usePermissions();

  React.useEffect(() => {
    if (loading) return;
    let sub;
    if (isAdmin) {
      sub = DataStore.observeQuery(Event).subscribe((results) => setEvents(results.items));
    } else {
      const subAreaId = JSON.parse(localStorage.getItem("EVENTFLOW.subarea"))?.id;
      if (!subAreaId) {
        navigate(`/page/campus`, { state: { error: "Escoge un campus, area y subarea para acceder a tus eventos" } });
        return;
      }
      sub = DataStore.observeQuery(Event, (e) => e.careerID.eq(subAreaId)).subscribe((results) => setEvents(results.items));
    }
    return () => sub && sub.unsubscribe();
  }, [loading, isAdmin, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] w-full flex-col items-center justify-center">
        <span className="loader"></span>
        <h2 className="mt-2 text-xl text-black dark:text-white">Cargando…</h2>
      </div>
    );
  }

  return (
    <div className="mt-3">
      <PageHeader
        crumbs={[{ label: "Dashboard" }]}
        title="Dashboard"
        subtitle="Resumen general de tus eventos."
      />

      {events.length !== 0 ? (
        <div className="flex flex-col gap-5">

          {/* Metrics */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Card>
              <p className={TYPE.metricLabel}>Total eventos</p>
              <p className={`${TYPE.metricValue} mt-1 flex items-center gap-2`}>
                <MdBarChart className="h-7 w-7 text-brand-500" /> {events.length}
              </p>
            </Card>

            <Card>
              <p className={TYPE.metricLabel}>Próximos eventos</p>
              <p className={`${TYPE.metricValue} mt-1 flex items-center gap-2`}>
                <MdBarChart className="h-7 w-7 text-brand-500" />
                {events.filter(e => new Date(e.date) > new Date()).length}
              </p>
            </Card>
          </div>

          {/* Shortcuts */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {cards.map((card, index) => (
              <Link
                to={card.link}
                key={index}
                className="rounded-2xl bg-white p-5 shadow-card transition hover:shadow-xl hover:no-underline dark:!bg-navy-800 dark:text-white"
              >
                <div className="flex h-full flex-col justify-between">
                  <h3 className="text-base font-bold text-navy-700 dark:text-white">
                    {card.title}
                  </h3>
                  <div className="mt-4 flex items-center gap-1 text-sm font-medium text-gray-500">
                    Ver más <span className="text-brand-500">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

        </div>
      ) : (
        <Card>
          <p className="flex items-center gap-2 text-sm text-navy-700 dark:text-white">
            <AiOutlineWarning /> No existen eventos en la base de datos...
          </p>
        </Card>
      )}

    </div>
  );
};

export default Dashboard;
