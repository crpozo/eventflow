/* eslint-disable */

import { HiX } from "react-icons/hi";
import Links from "./components/Links";
import { Link } from "react-router-dom";
import routes from "routes.js";

const Sidebar = ({ open, onClose, eventId, activePath}) => {

  return (
    <>
    <div
      className={`sm:none duration-175 linear fixed !z-50 flex min-h-[96%] flex-col bg-black pb-10 shadow-2xl shadow-white/5 transition-all ${activePath != '' ? 'rounded-l-3xl' : 'rounded-3xl'} ml-3 mt-3 mb-4 dark:!bg-navy-800 dark:text-white md:!z-50 lg:!z-50 xl:!z-0	 ${
        open ? "translate-x-0" : "-translate-x-96"
      }`}
    >
      <span
        className="absolute top-4 right-4 block cursor-pointer text-white xl:hidden"
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
        <Links routes={routes} />
      </ul>

      {/* Free Horizon Card */}
      {/* <div className="flex justify-center">
        <SidebarCard />
      </div> */}

      {/* Nav item end */}
      { activePath != '' && 
        <div
          className={`sm:none bg-white duration-175 linear fixed rounded-r-3xl !z-50 min-h-full bg-gray pb-10 shadow-2xl shadow-white/5 transition-all left-[-14px] dark:!bg-navy-800 dark:text-white md:!z-50 lg:!z-50 xl:!z-0 translate-x-56`}
          >
          <div className="mt-[58px] mb-7 h-px dark:bg-white/30" />
          <div className="flex flex-col gap-10">
            <div className="pt-2 pb-4">
              <Link className="px-[35px]" to={ `eventos/`}>Eventos</Link>
            </div>
            <div className="">
            <Link className="px-[35px] py-3" to={ `/landing/${eventId}`} target="_blank">Link del evento</Link>
            </div>
            <div className="flex flex-col">
              <Link 
                className={`px-[35px] py-3 ${activePath === `eventos/:id/detalle` ? "text-brand-500" : ""}`}
               to={ `eventos/${eventId}/detalle/`}>
                  Detalle Evento
              </Link>
              <Link 
                className={`px-[35px] py-3 ${activePath === `eventos/:id/landing` ? "text-brand-500" : ""}`}
               to={ `eventos/${eventId}/landing/`}>
                  Landing Page
              </Link>
              <Link 
                className={`px-[35px] py-3 ${activePath === `eventos/:id/formulario` ? "text-brand-500" : ""}`}
                to={ `eventos/${eventId}/formulario/`}>
                  Formulario
              </Link>
              <Link 
                className={`px-[35px] py-3 ${activePath === `eventos/:id/usuarios` ? "text-brand-500" : ""}`} 
                to={ `eventos/${eventId}/usuarios/`}>
                  Usuarios
              </Link>
            </div>
          </div>
         
        </div>
      }
      
    </div>
    </>
  );
};

export default Sidebar;
