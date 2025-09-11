import React from "react";
import Banner from "./components/Banner";
import NftCard from "components/card/NftCard";
import { useNavigate, Link } from "react-router-dom";
import { DataStore } from 'aws-amplify/datastore';
import { Event } from "models"
import {
  MdBarChart
} from "react-icons/md";
import { AiOutlineWarning } from "react-icons/ai";
import { usePermissions } from "../../../providers/PermissionsProvider";

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
      <div className="fixed inset-0 z-50 flex top-[-10px] min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-lightPrimary p-3">
        <span className="loader"></span>
        <h2 className="mb-2 text-center text-xl text-black">
          Cargando...
        </h2>
      </div>
    )
  }

  return (
    <div>
      <div className="grid h-full">
        <Banner />
      </div>  

      <div className="!z-5 relative flex flex-col bg-white bg-clip-border py-[10px] pb-[30px] ml-[-20px] px-3 rounded-[20px] dark:!bg-navy-800 dark:text-white dark:shadow-none !z-5 overflow-hidden">

        {events.length !== 0 ? 
          <>

            {/* Metrics */}
            <div className="grid grid-cols-1 gap-[20px] md:grid-cols-2 lg:grid-cols-2 mb-6">
              <div className="rounded-2xl p-6 bg-white shadow-md border-[1px] border-[#f0f0f0] h-[120px] flex flex-col justify-between">
                  <h3 className="text-lg font-semibold">Total eventos</h3>
                <p className="text-3xl font-bold text-navy-800 flex gap-2 items-center dark:text-white">
                  <MdBarChart className="h-7 w-7 text-brand-500" /> {events.length}
                </p>
              </div>

              <div className="rounded-2xl p-6 bg-white shadow-md border-[1px] border-[#f0f0f0] h-[120px] flex flex-col justify-between">
                <h3 className="text-lg font-semibold">Próximos eventos</h3>
                <p className="text-3xl flex gap-2 items-center font-bold text-navy-800 dark:text-white">
                  <MdBarChart className="h-7 w-7 text-brand-500" />
                  {events.filter(e => new Date(e.date) > new Date()).length}
                </p>
              </div>
            </div>

            {/* Shortcuts */}
            <div className="grid grid-cols-1 gap-[20px] md:grid-cols-2 lg:grid-cols-3 ">
              {cards.map((card, index) => (
                <Link
                  to={card.link}
                  key={index}
                  className={`rounded-2xl p-6 bg-white shadow-md border border-gray-200 text-black hover:shadow-xl transition-transform hover:scale-[1.02] no-underline hover:no-underline hover:text-brand-500`}
                >
                  <div className="flex flex-col h-full justify-between">
                    <h3 className="text-lg font-semibold">{card.title}</h3>
                    <div className="mt-4 text-sm font-medium flex items-center gap-1 text-black">
                      Ver más <span className="text-brand-500">→</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

          </>
          :
          <p className="flex gap-2 items-center"> <AiOutlineWarning/> No existen eventos en la base de datos...</p>
        }

      </div>

    </div>
  );
};

export default Dashboard;
