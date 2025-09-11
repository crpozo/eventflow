/* eslint-disable */
import React from "react";
import { HiX } from "react-icons/hi";
import Links from "./components/Links";
import { Link, useParams } from "react-router-dom";
import routes from "routes.js";
import { Landing } from "models"
import { formatDateHour } from 'scripts/utils'
import { DataStore } from 'aws-amplify/datastore';
import {
  MdChevronLeft
} from "react-icons/md";
import {
  LiaExternalLinkAltSolid,
} from "react-icons/lia";
import { usePermissions } from "../../providers/PermissionsProvider";

const Sidebar = ({ open, onClose, eventModel, activePath}) => {

  const [event, setEvent] = React.useState(null);
  const [landing, setLanding] = React.useState(null);
  const [isActive, setIsActive] = React.useState(false);
  const { isAdmin } = usePermissions();

 const filteredRoutes = React.useMemo(() => {
   if (!isAdmin) return routes;
   return routes.filter((r) => {
     const name = (r?.name || "").toLowerCase();
     const path = (r?.path || "").toLowerCase();
     // ajusta los términos si tu item usa otro label/path
     const matchesBlocklist =
       /restablecer|reset|restore/.test(name) ||
       /restablecer|reset|restore/.test(path) ||
       `${r?.layout || ""}/${path}` === "/page/campus"; // ej: Restablecer → /page/campus
     return !matchesBlocklist;
   });
 }, [isAdmin]);

  React.useEffect(() => {
    const event = localStorage.getItem('EVENTFLOW.event');
    if(event && event !== null && event !== undefined && event!= 'undefined'){
      setEvent(JSON.parse(event));
    }

  }, [activePath]);

  React.useEffect( () => {

    if(event){
      const sub = DataStore.observeQuery(Landing, (l) => l.landingEventId.eq(event.id)).subscribe(({ items }) => {
        if(items.length > 0){
          setLanding(items[0])
          setIsActive(items[0].active)
        }
      
      });
  
      return () => {
        sub.unsubscribe();
      };
    }

  }, [event])

  async function updateLanding(state) {
    const updatedLanding = await DataStore.save(
      Landing.copyOf(landing, updated => {
        updated.active = state;
      })
    );
  }

  return (
    <>
    <div
      className={`sm:none duration-175 linear fixed !z-50 flex min-h-[96%] flex-col bg-black pb-10 shadow-2xl shadow-white/5 transition-all max-w-[204px] ${activePath != '' ? 'rounded-l-3xl max-w-[100px]' : 'rounded-3xl'} ml-2 xl:ml-3 mt-3 mb-4 dark:!bg-navy-800 dark:text-white md:!z-50 lg:!z-50 xl:!z-0	 ${
        open ? "translate-x-0" : "-translate-x-96"
      }`}
    >
      <span
        className={`absolute ${activePath != '' ? 'top-6 -right-[240px] text-black z-[60]' : 'top-4 right-4 text-white'}  block cursor-pointer xl:hidden`}
        onClick={onClose}
      >
        <HiX />
      </span>

      {/* <div className={`mx-[56px] mt-[50px] flex items-center`}>
        <div className="mt-1 ml-1 h-2.5 font-poppins text-[26px] font-bold uppercase text-navy-700 dark:text-white">
          Eventflow
        </div>
      </div> */}
      <div className="mt-[15px] mb-7 h-px dark:bg-white/30" />
      {/* Nav item */}

      <ul className="mb-auto pt-1">
        <Links routes={filteredRoutes} activePath={activePath} />
      </ul>

      {/* Free Horizon Card */}
      {/* <div className="flex justify-center">
        <SidebarCard />
      </div> */}

      {/* Nav item end */}
      { activePath != '' && 
        <div
          className={`sm:none bg-white duration-175 linear fixed rounded-r-3xl !z-50 min-h-full bg-gray pb-10 shadow-2xl shadow-white/5 transition-all left-[-14px] w-[268px] xl:w-[268px] dark:!bg-navy-800 dark:text-white md:!z-50 lg:!z-50 xl:!z-0 translate-x-[100px] xl:translate-x-[110px]`}
          >
          <div className="mt-[10px] h-px dark:bg-white/30" />
          <div className="flex flex-col">
            <div className="pt-2 pb-3 border-b border-gray-700">
              <Link className="pl-[20px] pr-[25px] xl:pl-[30px] xl:pr-[35px] flex items-center text-brand-500 hover:no-underline hover:text-navy-700" to={ `eventos/`}>
                <MdChevronLeft className="h-6 w-6 mr-2" /> Eventos
              </Link>
            </div>
            <div className="flex flex-col px-[25px] xl:px-[25px] py-[30px] border-b border-gray-700">
              {/* <GoDot className="h-5 w-5" />
              <GoDotFill className="h-5 w-5 fill-green-500" /> */}
              <select
                  className="text-sm w-full py-2.5 pl-3 pr-[40px] text-black bg-white border rounded-3xl shadow-sm outline-none appearance-none text-ellipsis max-w-[110px] mb-4 focus:border-indigo-600 select-arrow cursor-pointer"
                  onChange={(e) => {
                    if(e.target.value == 'public'){
                      updateLanding(true)
                    } else if(e.target.value == 'hidden'){
                      updateLanding(false)
                    }
                  }}
                  value={isActive ? "public" : "hidden"}
                >
                <option value="public">
                  Público
                </option>
                <option value="hidden">
                  Oculto
                </option>
              </select>
              <h2 className="text-2xl font-medium mb-3">{event?.title}</h2>
              <p className="text-sm text-gray-500 mb-3">{formatDateHour(event?.date)}</p>
              <Link className="flex text-brand-500 pointer items-center hover:no-underline hover:text-black" to={ `/landing/${event?.id}`} target="_blank" rel="noopener noreferrer">
                Link del evento <LiaExternalLinkAltSolid className="ml-2 h-5 w-5" />
              </Link>
            </div>
            <div className="flex flex-col">
              <Link 
                className={`px-[25px] xl:px-[25px] py-[15px]  hover:bg-gray-200 hover:text-black hover:no-underline ${activePath === `eventos/:id/detalle` ? "bg-gray-200" : ""}`}
               to={ `eventos/${event?.id}/detalle/`}>
                  Detalle Evento
              </Link>
              <Link 
                className={`px-[25px] xl:px-[25px] py-[15px] hover:bg-gray-200 hover:text-black hover:no-underline ${activePath === `eventos/:id/landing` ? "bg-gray-200" : ""}`}
               to={ `eventos/${event?.id}/landing/`}>
                  Landing page
              </Link>
              <Link 
                className={`px-[25px] xl:px-[25px] py-[15px]  hover:bg-gray-200 hover:text-black hover:no-underline ${activePath === `eventos/:id/formulario` ? "bg-gray-200" : ""}`}
                to={ `eventos/${event?.id}/formulario/`}>
                  Formulario
              </Link>
              <Link 
                className={`px-[25px] xl:px-[25px] py-[15px]  hover:bg-gray-200 hover:text-black hover:no-underline ${activePath === `eventos/:id/diseno-gafete` ? "bg-gray-200" : ""}`}
               to={ `eventos/${event?.id}/diseno-gafete/`}>
                  Diseño Gafete
              </Link>
              {/* <Link 
                className={`px-[25px] xl:px-[25px] py-[15px]  hover:bg-gray-200 hover:text-black hover:no-underline ${activePath === `eventos/:id/participantes` ? "bg-gray-200" : ""}`} 
                to={ `eventos/${event?.id}/participantes/`}>
                  Participantes
              </Link> */}
            </div>
          </div>
         
        </div>
      }
      
    </div>
    </>
  );
};

export default Sidebar;
