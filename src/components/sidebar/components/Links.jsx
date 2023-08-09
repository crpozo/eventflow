/* eslint-disable */
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
    return routes.map((route, index) => {
      if (
        route.layout === "/admin" ||
        route.layout === "/auth" ||
        route.layout === "/rtl" ||
        route.layout === "/page"
      ) {
        return (
          <div key={index}>
          { route.path != 'campus/editar' && route.path != 'campus/crear' && route.path != 'campus/area' && route.path != 'campus/area/editar' && route.path != 'campus/area/crear' &&  route.path != 'campus/area/subarea' && route.path != 'campus/area/subarea/crear' && route.path != 'campus/area/subarea/editar' && route.path != 'eventos/crear' && route.path != 'eventos/:id/landing' && route.path != 'eventos/:id/detalle' && route.path != 'eventos/:id/usuarios' && route.path != 'eventos/:id/usuarios/crear' && route.path != 'eventos/:id/formulario'  &&
          <Link className="hover:no-underline" key={index} to={route.layout + "/" + route.path}>
            <div className="relative mb-3 flex hover:cursor-pointer">
              <li
                className="my-[3px] flex cursor-pointer items-center px-[33px] xl:px-10"
                key={index}
              >
                <span
                  className={`${
                    activeRoute(route.path) === true
                      ? "font-bold text-brand-500 dark:text-white"
                      : "font-medium text-white"
                  }`}
                >
                  {route.icon ? route.icon : <DashIcon />}{" "}
                </span>
                <p
                  className={`leading-1 ml-4 flex ${
                    activeRoute(route.path) === true
                      ? "font-bold text-brand-500 dark:text-white"
                      : "font-medium text-white"
                  }`}
                >
                  {route.name}
                </p>
              </li>
              {activeRoute(route.path) ? (
                <div className="absolute right-0 top-px h-9 w-1 rounded-lg bg-brand-500 dark:bg-brand-400" />
              ) : null}
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
