import React from "react";
import Dropdown from "components/dropdown";
import { FiAlignJustify } from "react-icons/fi";
import { Link } from "react-router-dom";
import logo from "assets/img/usfq/logo_usfq.svg";
// Icon Imports
import {
  MdPerson
} from "react-icons/md";
import { useAuthenticator } from '@aws-amplify/ui-react';

const Navbar = (props) => {

  const { user, signOut } = useAuthenticator((context) => [context.user]);
  const showSignOut = props.signOut !== undefined ? props.signOut : true;
  const { onOpenSidenav } = props;
  const [campus, setCampus] = React.useState(null);
  const [area, setArea] = React.useState(null);
  const [subarea, setSubArea] = React.useState(null);

  React.useEffect(() => {
    const campusLocal = localStorage.getItem('EVENTFLOW.campus');
    if(campusLocal !== null && campusLocal !== undefined){
      setCampus(JSON.parse(campusLocal).title);
    } else {
      setCampus(null)
    }

    const areaLocal = localStorage.getItem('EVENTFLOW.area');
    if(areaLocal !== null && areaLocal !== undefined){
      setArea(JSON.parse(areaLocal).title);
    } else{
      setArea(null);
    }

    const subAreaLocal = localStorage.getItem('EVENTFLOW.subarea');
    if(subAreaLocal !== null && subAreaLocal !== undefined){
      setSubArea(JSON.parse(subAreaLocal).title);
    }else{
      setSubArea(null);
    }

  }, [props]);

  return (
    <nav className="sticky top-4 z-40 flex flex-row flex-wrap items-center justify-between rounded-xl bg-white/10 px-2 py-2 backdrop-blur-xl dark:bg-[#0b14374d] gap-5 mb-4 md:gap-0">
      <div className="ml-[6px]">
        <p className="shrink text-[33px] capitalize text-navy-700 dark:text-white">
          <Link
            to="/"
            className="font-bold text-3xl	capitalize hover:no-underline text-black hover:text-black dark:hover:text-white"
          >
            <img className="max-w-[120px]" src={logo} />
          </Link>
        </p> 
      </div>
      <div className="flex items-center gap-5">
        <p className="hidden md:block py-[10px] px-[10px] border border-gray-100 rounded-3xl text-sm">
        {campus && <span>{campus} / </span>}
        {area && <span>{area} / </span>}
        {subarea && <span>{subarea}</span>}
        </p>
        {showSignOut &&
          <div className="relative mt-[3px] flex h-[45px] flex-grow items-center justify-around gap-2 rounded-full bg-white px-2 py-2 shadow-xl shadow-shadow-500 dark:!bg-navy-800 dark:shadow-none md:flex-grow-0 md:gap-1 max-w-[200px] sm:w-[200px] xl:w-[45px] xl:gap-2 xl:!bg-yellowPrimary">
            <span
              className="flex cursor-pointer text-xl text-gray-600 dark:text-white xl:hidden"
              onClick={onOpenSidenav}
            >
              <FiAlignJustify className="h-5 w-5" />
            </span>
            {/* Profile & Dropdown */}
              <Dropdown
                button={
                  <MdPerson className="h-[22px] w-[22px] fill-dark cursor-pointer"/>
                }
                children={
                  <div className="flex  w-56 flex-col justify-start rounded-[20px] bg-white bg-cover bg-no-repeat shadow-xl shadow-shadow-500 dark:!bg-navy-700 dark:text-white dark:shadow-none">

                    <div className="flex flex-col p-4">
                      <button className="text-left text-sm text-gray-800 hover:text-brand-500 dark:text-white hover:dark:text-white" 
                      onClick={signOut}>
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                }
                classNames={"py-2 top-8 -left-[180px] w-max"}
              />
          </div>
        }
      </div>
    </nav>
  );
};

export default Navbar;
