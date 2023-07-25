import React from "react";

// Admin Imports
import MainDashboard from "views/admin/default";
import NFTMarketplace from "views/admin/marketplace";
import Profile from "views/admin/profile";
import DataTables from "views/admin/tables";
import RTLDefault from "views/rtl/default";

// Area Imports
import Campus from "views/campus";
import Area from "views/area";
import Carrera from "views/carrera";

// Event Imports
import Eventos from "views/admin/eventos";
import EventoDetalle from "views/admin/eventos/detalle";
import EventoCrear from "views/admin/eventos/crear";
import EventoLanding from "views/admin/eventos/landing";
import Landing from "views/landing/SignIn";
import EventoFormulario from "views/admin/eventos/formulario";

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
    name: "Campus",
    layout: "/page",
    path: "campus",
    icon: <MdAccountBalance className="h-6 w-6" />,
    component: <Campus />,
  },
  {
    name: "Area",
    layout: "/page",
    path: "campus/area",
    icon: <MdAccountBalance className="h-6 w-6" />,
    component: <Area />,
  },
  {
    name: "Subarea",
    layout: "/page",
    path: "campus/area/subarea",
    icon: <MdAccountBalance className="h-6 w-6" />,
    component: <Carrera />,
  },
  {
    name: "Eventos",
    layout: "/admin",
    path: "eventos",
    icon: <MdCalendarToday className="h-6 w-6" />,
    component: <Eventos />,
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
    name: "Landing",
    layout: "/landing",
    path: ":id",
    icon: <MdCalendarToday className="h-6 w-6" />,
    component: <Landing />,
  },
  {
    name: "NFT Marketplace",
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
    name: "RTL Admin",
    layout: "/rtl",
    path: "rtl",
    icon: <MdHome className="h-6 w-6" />,
    component: <RTLDefault />,
  },
];
export default routes;
