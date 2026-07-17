import React from "react";
import Dropdown from "components/dropdown";
import { FiAlignJustify } from "react-icons/fi";
import { Link } from "react-router-dom";
import logo from "assets/img/usfq/logo_2025.png";
import { MdPerson } from "react-icons/md";
import { useAuthenticator } from "@aws-amplify/ui-react";

const Navbar = ({ signOut: showSignOutProp, onOpenSidenav }) => {
  const { signOut } = useAuthenticator((context) => [context.user]);
  const showSignOut = showSignOutProp !== undefined ? showSignOutProp : true;

  const [campus, setCampus] = React.useState(null);
  const [area, setArea] = React.useState(null);
  const [subarea, setSubarea] = React.useState(null);

  // Load location info (campus, area, subarea) from localStorage
  React.useEffect(() => {
    const getLocalTitle = (key) => {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item).title : null;
    };

    setCampus(getLocalTitle("EVENTFLOW.campus"));
    setArea(getLocalTitle("EVENTFLOW.area"));
    setSubarea(getLocalTitle("EVENTFLOW.subarea"));
  }, []);

  return (
    <nav className="relative top-4 z-40 mb-11 flex flex-row flex-wrap items-center justify-between gap-5 rounded-xl bg-white/10 px-0 py-2 backdrop-blur-xl dark:bg-[#0b14374d] md:gap-0">

      {/* Top banner announcement */}
      {/* {showBanner && (
        <div className="w-full bg-yellow-100 text-yellow-800 text-sm font-medium px-4 py-[10px] flex justify-center items-center relative flex-wrap text-center rounded-[15px] mb-[15px]">
          <span className="mx-auto">
            ⚠️ Sistema en actualización hasta el <strong>05 de mayo</strong>. Si encuentras intermitencias, por favor comunícate con soporte.
          </span>
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 text-yellow-800 hover:text-yellow-600 text-xl font-bold
                      focus:outline-none focus:ring-0 focus-visible:outline-none active:outline-none
                      sm:right-4"
            onClick={() => setShowBanner(false)}
            aria-label="Cerrar anuncio"
          >
            &times;
          </button>
        </div>
      )} */}

      {/* Logo */}
      <div className="">
        <p className="shrink text-[33px] capitalize text-navy-700 dark:text-white">
          <Link
            to="/"
            className="font-bold text-3xl capitalize text-black hover:text-black dark:hover:text-white hover:no-underline"
          >
            <img
              src={logo}
              alt="USFQ Logo"
              className="max-w-[200px]"
            />
          </Link>
        </p>
      </div>

      {/* Right section (location info + profile dropdown) */}
      <div className="flex items-center gap-5">
        {(campus || area || subarea) && (
          <p className="hidden rounded-3xl border border-gray-100 py-[10px] px-[10px] text-sm md:block">
            {[campus, area, subarea].filter(Boolean).join(" / ")}
          </p>
        )}

        {showSignOut && (
          <div className="relative mt-[3px] flex h-[45px] max-w-[200px] flex-grow items-center justify-around gap-2 rounded-full bg-white px-2 py-2 shadow-xl shadow-shadow-500 dark:!bg-navy-800 dark:shadow-none md:flex-grow-0 md:gap-1 sm:w-[200px] xl:w-[45px] xl:gap-2 xl:!bg-yellowPrimary">
            <button
              type="button"
              className="flex cursor-pointer text-xl text-gray-600 dark:text-white xl:hidden"
              onClick={onOpenSidenav}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onOpenSidenav();
                }
              }}
              aria-label="Open sidenav"
            >
              <FiAlignJustify className="h-5 w-5" />
            </button>

            <Dropdown
              button={
                <MdPerson
                  className="h-[22px] w-[22px] fill-dark cursor-pointer"
                  aria-label="User menu"
                />
              }
              classNames={"py-2 top-8 -left-[180px] w-max z-10"}
            >
              <div className="flex w-56 flex-col justify-start rounded-[20px] bg-white bg-cover bg-no-repeat shadow-xl shadow-shadow-500 dark:!bg-navy-700 dark:text-white dark:shadow-none">
                <div className="flex flex-col p-4">
                  <button
                    type="button"
                    className="focus:outline-none text-left text-sm text-gray-800 hover:text-brand-500 dark:text-white hover:dark:text-white"
                    onClick={signOut}
                  >
                    Cerrar sesión
                  </button>
                </div>
              </div>
            </Dropdown>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
