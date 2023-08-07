import React from "react";

// Admin Imports
import MainDashboard from "views/admin/default";
import Reports from "views/admin/reportes";
import NFTMarketplace from "views/admin/marketplace";
import Profile from "views/admin/profile";
import DataTables from "views/admin/tables";

// Area Imports
import Campus from "views/campus";
import CampusCrear from "views/campus/crear";
import CampusEditar from "views/campus/detalle";
import Area from "views/area";
import AreaCrear from "views/area/crear";
import AreaEditar from "views/area/detalle";
import Carrera from "views/carrera";
import CarreraCrear from "views/carrera/crear";
import CarreraEditar from "views/carrera/detalle";

// Event Imports
import Eventos from "views/admin/eventos";
import EventoDetalle from "views/admin/eventos/detalle";
import EventoCrear from "views/admin/eventos/crear";
import EventoLanding from "views/admin/eventos/landing";
import EventoFormulario from "views/admin/eventos/formulario";
import EventoUsuarios from "views/admin/eventos/usuarios";
import EventoUsuariosCrear from "views/admin/eventos/usuarios/crear";
import Landing from "views/landing/SignIn";
import LandingRegistro from "views/landing/registro";

// Auth Imports
import SignIn from "views/auth/SignIn";

// Icon Imports
import {
  MdHome,
  MdOutlineShoppingCart,
  MdBarChart,
  MdPerson,
  MdLock,
  MdAccountBalance,
  MdCalendarToday,
} from "react-icons/md";

const routes = [
  {
    name: "Dashboard",
    layout: "/admin",
    path: "dashboard",
    icon: <MdHome className="h-6 w-6" />,
    component: <MainDashboard />,
  },
  {
    name: "Campus Crear",
    layout: "/page",
    path: "campus/crear",
    icon: <MdAccountBalance className="h-6 w-6" />,
    component: <CampusCrear />,
  },
  {
    name: "Campus Editar",
    layout: "/page",
    path: "campus/editar",
    icon: <MdAccountBalance className="h-6 w-6" />,
    component: <CampusEditar />,
  },
  {
    name: "Area",
    layout: "/page",
    path: "campus/area",
    icon: <MdAccountBalance className="h-6 w-6" />,
    component: <Area />,
  },
  {
    name: "Area Crear",
    layout: "/page",
    path: "campus/area/crear",
    icon: <MdAccountBalance className="h-6 w-6" />,
    component: <AreaCrear />,
  },
  {
    name: "Area Editar",
    layout: "/page",
    path: "campus/area/editar",
    icon: <MdAccountBalance className="h-6 w-6" />,
    component: <AreaEditar />,
  },
  {
    name: "Subarea",
    layout: "/page",
    path: "campus/area/subarea",
    icon: <MdAccountBalance className="h-6 w-6" />,
    component: <Carrera />,
  },
  {
    name: "Subarea Crear",
    layout: "/page",
    path: "campus/area/subarea/crear",
    icon: <MdAccountBalance className="h-6 w-6" />,
    component: <CarreraCrear />,
  },
  {
    name: "Subarea Editar",
    layout: "/page",
    path: "campus/area/subarea/editar",
    icon: <MdAccountBalance className="h-6 w-6" />,
    component: <CarreraEditar />,
  },
  {
    name: "Eventos",
    layout: "/admin",
    path: "eventos",
    icon: <MdCalendarToday className="h-6 w-6" />,
    component: <Eventos />,
  },
  {
    name: "Reportes",
    layout: "/admin",
    path: "reportes",
    icon: <MdBarChart className="h-6 w-6" />,
    component: <Reports />,
  },
  {
    name: "Evento crear",
    layout: "/admin",
    path: "eventos/crear",
    icon: <MdCalendarToday className="h-6 w-6" />,
    component: <EventoCrear />,
  },
  {
    name: "Evento detalle",
    layout: "/admin",
    path: "eventos/:id/detalle",
    icon: <MdCalendarToday className="h-6 w-6" />,
    component: <EventoDetalle />,
  },
  {
    name: "Evento landing",
    layout: "/admin",
    path: "eventos/:id/landing",
    icon: <MdCalendarToday className="h-6 w-6" />,
    component: <EventoLanding />,
  },
  {
    name: "Evento formulario",
    layout: "/admin",
    path: "eventos/:id/formulario",
    icon: <MdCalendarToday className="h-6 w-6" />,
    component: <EventoFormulario />,
  },
  {
    name: "Evento Usuarios",
    layout: "/admin",
    path: "eventos/:id/usuarios",
    icon: <MdCalendarToday className="h-6 w-6" />,
    component: <EventoUsuarios />,
  },
  {
    name: "Evento Usuarios Crear",
    layout: "/admin",
    path: "eventos/:id/usuarios/crear",
    icon: <MdCalendarToday className="h-6 w-6" />,
    component: <EventoUsuariosCrear />,
  },
  {
    name: "Landing",
    layout: "/landing",
    path: ":id",
    icon: <MdCalendarToday className="h-6 w-6" />,
    component: <Landing />,
  },
  {
    name: "Registro",
    layout: "/landing",
    path: ":id/registro",
    icon: <MdCalendarToday className="h-6 w-6" />,
    component: <LandingRegistro />,
  },
  {
    name: "NFT",
    layout: "/admin",
    path: "nft-marketplace",
    icon: <MdOutlineShoppingCart className="h-6 w-6" />,
    component: <NFTMarketplace />,
    secondary: true,
  },
  {
    name: "Data Tables",
    layout: "/admin",
    icon: <MdBarChart className="h-6 w-6" />,
    path: "data-tables",
    component: <DataTables />,
  },
  {
    name: "Profile",
    layout: "/admin",
    path: "profile",
    icon: <MdPerson className="h-6 w-6" />,
    component: <Profile />,
  },
  {
    name: "Sign In",
    layout: "/auth",
    path: "sign-in",
    icon: <MdLock className="h-6 w-6" />,
    component: <SignIn />,
  },
  {
    name: "Campus",
    layout: "/page",
    path: "campus",
    icon: <MdAccountBalance className="h-6 w-6" />,
    component: <Campus />,
  },
];
export default routes;
