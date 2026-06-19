import React from "react";

// Icon Imports
import {
  MdHome,
  MdBarChart,
  MdAccountBalance,
  MdCalendarToday,
} from "react-icons/md";
import { LuUserCheck } from "react-icons/lu";
import EventSectionGuard from "components/EventSectionGuard";

// Admin Imports (lazy-loaded for code-splitting)
const MainDashboard = React.lazy(() => import("views/admin/default"));
const Reportes = React.lazy(() => import("views/admin/reportes"));

// Area Imports
const Campus = React.lazy(() => import("views/campus"));
const CampusCrear = React.lazy(() => import("views/campus/crear"));
const CampusEditar = React.lazy(() => import("views/campus/detalle"));
const Area = React.lazy(() => import("views/area"));
const AreaCrear = React.lazy(() => import("views/area/crear"));
const AreaEditar = React.lazy(() => import("views/area/detalle"));
const Carrera = React.lazy(() => import("views/carrera"));
const CarreraCrear = React.lazy(() => import("views/carrera/crear"));
const CarreraEditar = React.lazy(() => import("views/carrera/detalle"));
const Navegar = React.lazy(() => import("views/navegar"));

// Event Imports
const Eventos = React.lazy(() => import("views/admin/eventos"));
const EventoCrear = React.lazy(() => import("views/admin/eventos/crear"));
const EventoDetalle = React.lazy(() => import("views/admin/eventos/detalle"));
const DiseñoGafete = React.lazy(() => import("views/admin/eventos/diseno-gafete"));
const Landing = React.lazy(() => import("views/landing/index"));
const LandingRegistro = React.lazy(() => import("views/landing/registro"));
const EventoLanding = React.lazy(() => import("views/admin/eventos/landing"));
const EventoFormulario = React.lazy(() => import("views/admin/eventos/formulario"));
const EventoParticipantes = React.lazy(() => import("views/admin/eventos/participantes"));
const EventoParticipantesCrear = React.lazy(() => import("views/admin/eventos/participantes/crear"));
const EventoParticipantesDetalle = React.lazy(() => import("views/admin/eventos/participantes/detalle"));

// Other Imports
const Privacidad = React.lazy(() => import("views/privacidad"));
const Permisos = React.lazy(() => import("views/admin/permisos"));


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
    component: <Reportes />,
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
    component: (
      <EventSectionGuard section="detalle">
        <EventoDetalle />
      </EventSectionGuard>
    ),
  },
  {
    name: "Evento landing",
    layout: "/admin",
    path: "eventos/:id/landing",
    icon: <MdCalendarToday className="h-6 w-6" />,
    component: (
      <EventSectionGuard section="landing">
        <EventoLanding />
      </EventSectionGuard>
    ),
  },
  {
    name: "Diseño gafete",
    layout: "/admin",
    path: "eventos/:id/diseno-gafete",
    icon: <MdCalendarToday className="h-6 w-6" />,
    component: (
      <EventSectionGuard section="gafete">
        <DiseñoGafete />
      </EventSectionGuard>
    ),
  },
  {
    name: "Evento formulario",
    layout: "/admin",
    path: "eventos/:id/formulario",
    icon: <MdCalendarToday className="h-6 w-6" />,
    component: (
      <EventSectionGuard section="formulario">
        <EventoFormulario />
      </EventSectionGuard>
    ),
  },
  {
    name: "Evento Participantes",
    layout: "/admin",
    path: "eventos/:id/participantes",
    icon: <MdCalendarToday className="h-6 w-6" />,
    component: (
      <EventSectionGuard section="participantes">
        <EventoParticipantes />
      </EventSectionGuard>
    ),
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
    name: "Landing idioma",
    layout: "/landing",
    path: ":id/:lang",
    icon: <MdCalendarToday className="h-6 w-6" />,
    component: <Landing />,
  },
  {
    name: "Permisos",
    layout: "/admin",
    path: "permisos",
    icon: <LuUserCheck className="h-6 w-6" />,
    component: <Permisos />,
  },
  {
    name: "Estructura académica",
    layout: "/page",
    path: "campus",
    icon: <MdAccountBalance className="h-6 w-6" />,
    component: <Navegar />,
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
