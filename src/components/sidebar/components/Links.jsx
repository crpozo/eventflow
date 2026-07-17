/* eslint-disable array-callback-return, eqeqeq */
import React from "react";
import { Link, useLocation } from "react-router-dom";
import DashIcon from "components/icons/DashIcon";
// chakra imports

export function SidebarLinks(props) {
  // Chakra color mode
  let location = useLocation();

  const { routes } = props;

  // verifies if routeName is the one active (in browser input)
  const activeRoute = (routeName) => {
    return location.pathname.includes(routeName);
  };

  const createLinks = (routes) => {
    return routes.map((route) => {
      // Key estable derivada del contenido de la ruta (layout + path es único
      // en routes.js), en lugar del índice del array.
      const routeKey = `${route.layout}/${route.path}`;
      if (
        route.layout === "/admin" ||
        route.layout === "/auth" ||
        route.layout === "/rtl" ||
        route.layout === "/page"
      ) {
        return (
          <div key={routeKey}>
          { route.path != 'campus/editar' && route.path != 'campus/crear' && route.path != 'campus/area' && route.path != 'campus/area/editar' && route.path != 'campus/area/crear' &&  route.path != 'campus/area/subarea' && route.path != 'campus/area/subarea/crear' && route.path != 'campus/area/subarea/editar' && route.path != 'eventos/crear' && route.path != 'eventos/:id/landing' && route.path != 'eventos/:id/detalle' && route.path != 'eventos/:id/diseno-gafete' && route.path != 'eventos/:id/participantes' && route.path != 'eventos/:id/participantes/crear' && route.path != 'eventos/:id/participantes/:id' && route.path != 'eventos/:id/formulario' && route.path != 'eventos/:id/encuesta' && route.path != 'eventos/:id/encuesta-dashboard'  &&
          <Link className="hover:no-underline" key={routeKey} to={route.layout + "/" + route.path}>
            <div className="relative mb-2 flex hover:cursor-pointer">
              <li
                className={`
                  my-[3px] flex w-full cursor-pointer justfiy-center items-center py-2 px-[10px] mx-4 rounded-[5px]
                  ${props.activePath != '' ? 'xl:px-3' :  'xl:px-5' }
                  ${activeRoute(route.path) ? 'bg-brand-500' : 'hover:bg-brand-500'}
                `}
                key={routeKey}
              >
                <span
                  className={`${
                    activeRoute(route.path) === true
                      ? "font-bold text-white dark:text-white"
                      : "font-medium text-white"
                  }`}
                >
                  {route.icon ? route.icon : <DashIcon />}{" "}
                </span>
                {props.activePath == '' &&
                <p
                  className={`leading-1 ml-3 flex ${
                    activeRoute(route.path) === true
                      ? "font-bold text-white dark:text-white"
                      : "font-medium text-white"
                  }`}
                >
                  {route.name}
                </p>
                }
              </li>
              {/* {activeRoute(route.path) ? (
                <div className="absolute right-0 top-px h-9 w-1 rounded-lg bg-brand-500 dark:bg-brand-400" />
              ) : null} */}
            </div>
          </Link>
          }
          </div>
        );
      }
    });
  };
  // BRAND
  return createLinks(routes);
}

export default SidebarLinks;
