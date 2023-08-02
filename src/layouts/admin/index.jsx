import React from "react";
import { Routes, Route, Navigate, useRoutes } from "react-router-dom";
import Navbar from "components/navbar";
import Sidebar from "components/sidebar";
import Footer from "components/footer/Footer";
import routes from "routes.js";
 
export default function Admin(props) {
  const { ...rest } = props;
  const [open, setOpen] = React.useState(true);
  const [currentRoute, setCurrentRoute] = React.useState("Main Dashboard");
  const [activePath, setActivePath] = React.useState('');
  const [eventId, setEventId] = React.useState('');
  const routeResult = useRoutes(routes);

  React.useEffect(() => {
    window.addEventListener("resize", () =>
      window.innerWidth < 1200 ? setOpen(false) : setOpen(true)
    );
  }, []);

  React.useEffect(() => {
    const eventId = localStorage.getItem('eventId');
    if(eventId){
      setEventId(eventId);
    } 
  }, []);

  // Show secondary Sidebar 
  React.useEffect(() => {
    if(routeResult?.props.match.route.path == 'eventos/:id/landing' ||
      routeResult?.props.match.route.path == 'eventos/:id/detalle' ||
      routeResult?.props.match.route.path == 'eventos/:id/formulario' ||
      routeResult?.props.match.route.path == 'eventos/:id/usuarios'){
      setActivePath(routeResult?.props.match.route.path)
    } else {
      setActivePath('')
    }
  }, [routeResult]);

  const getActiveRoute = (routes) => {
    let activeRoute = "Main Dashboard";
    for (let i = 0; i < routes.length; i++) {
      console.log(routeResult)
      console.log(routeResult.props.match.route.path, routes[i].path)
      if (
        window.location.href.indexOf(
          routes[i].layout + "/" + routes[i].path
        ) !== -1
      ) {
        console.log("routes[i].name: ",routes[i])
        setCurrentRoute(routes[i].name);
      }
    }
    return activeRoute;
  };
  const getActiveNavbar = (routes) => {
    let activeNavbar = false;
    for (let i = 0; i < routes.length; i++) {
      if (
        window.location.href.indexOf(routes[i].layout + routes[i].path) !== -1
      ) {
        return routes[i].secondary;
      }
    }
    return activeNavbar;
  };
  const getRoutes = (routes) => {
    return routes.map((prop, key) => {
      if (prop.layout === "/admin") {
        return (
          <Route path={`/${prop.path}`} element={prop.component} key={key} />
        );
      } else {
        return null;
      }
    });
  };

  document.documentElement.dir = "ltr";
  return (
    <div className="flex h-full w-full">
      <Sidebar open={open} onClose={() => setOpen(false)} eventId={eventId} activePath={activePath} />
      {/* Navbar & Main Content */}
      <div className="h-full w-full bg-lightPrimary dark:!bg-navy-900">
        {/* Main Content */}
        <main
          className={`mx-[12px] h-full flex-none transition-all md:pr-2 
          ${ activePath != '' ? "xl:ml-[455px]" : "xl:ml-[280px]"} `}
        >
          {/* Routes */}
          <div className="h-full">
            <Navbar
              onOpenSidenav={() => setOpen(true)}
              logoText={"Eventflow Tailwind React"}
              brandText={currentRoute}
              secondary={getActiveNavbar(routes)}
              {...rest}
            />
            <div className="pt-5s mx-auto mb-auto h-full min-h-[84vh] p-2 md:pr-2">
              <Routes>
                {getRoutes(routes)}

                <Route
                  path="/"
                  element={<Navigate to="/admin/dashboard" replace />}
                />
              </Routes>
            </div>
            <div className="p-3">
              <Footer />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
