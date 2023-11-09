import React from "react";

// Admin Imports
import MainDashboard from "views/admin/default";
import Reports from "views/admin/reportes";

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
import EventoCrear from "views/admin/eventos/crear";
import EventoDetalle from "views/admin/eventos/detalle";
import Landing from "views/landing/index";
import LandingRegistro from "views/landing/registro";
import EventoLanding from "views/admin/eventos/landing";
import EventoFormulario from "views/admin/eventos/formulario";
import EventoParticipantes from "views/admin/eventos/participantes";
import EventoParticipantesCrear from "views/admin/eventos/participantes/crear";
import EventoParticipantesDetalle from "views/admin/eventos/participantes/detalle";

// Legal Imports
import Privacidad from "views/privacidad";

// Icon Imports
import {
  MdHome,
  MdBarChart,
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
    name: "Evento Participantes",
    layout: "/admin",
    path: "eventos/:id/participantes",
    icon: <MdCalendarToday className="h-6 w-6" />,
    component: <EventoParticipantes />,
  },
  {
    name: "Evento Participantes Detalle",
    layout: "/usuario",
    path: ":id",
    icon: <MdCalendarToday className="h-6 w-6" />,
    component: <EventoParticipantesDetalle />,
  },
  {
    name: "Evento Participantes Crear",
    layout: "/admin",
    path: "eventos/:id/participantes/crear",
    icon: <MdCalendarToday className="h-6 w-6" />,
    component: <EventoParticipantesCrear />,
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
    name: "Campus",
    layout: "/page",
    path: "campus",
    icon: <MdAccountBalance className="h-6 w-6" />,
    component: <Campus />,
  },
  {
    name: "Privacidad",
    layout: "/privacidad",
    path: "",
    icon: <MdCalendarToday className="h-6 w-6" />,
    component: <Privacidad />,
  },
];
export default routes;
