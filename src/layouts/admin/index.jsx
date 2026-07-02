import React from "react";
import { Routes, Route, Navigate, useRoutes } from "react-router-dom";
import Navbar from "components/navbar";
import Sidebar from "components/sidebar";
import routes from "routes.js";
import { usePermissions } from "../../providers/PermissionsProvider";

export default function Admin(props) {
  const { reportesOnly, ...rest } = props;
  const { isReportesOnly } = usePermissions();
  const [open, setOpen] = React.useState(true);
  const [activePath, setActivePath] = React.useState('');
  const routeResult = useRoutes(routes);

  React.useEffect(() => {
    window.addEventListener("resize", () =>
      window.innerWidth < 1200 ? setOpen(false) : setOpen(true)
    );
  }, []);

  // Show secondary Sidebar
  React.useEffect(() => {
    if(routeResult?.props.match.route.path === 'eventos/:id/landing' ||
      routeResult?.props.match.route.path === 'eventos/:id/diseno-gafete' ||
      routeResult?.props.match.route.path === 'eventos/:id/detalle' ||
      routeResult?.props.match.route.path === 'eventos/:id/formulario' ||
      routeResult?.props.match.route.path === 'eventos/:id/participantes' ||
      routeResult?.props.match.route.path === 'eventos/:id/encuesta' ||
      routeResult?.props.match.route.path === 'eventos/:id/encuesta-dashboard'){
      setActivePath(routeResult?.props.match.route.path)
    } else {
      setActivePath('')
    }
  }, [routeResult]);

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
  const getRoutes = React.useCallback((routes) => {
    return routes.map((prop, key) => {
      if (prop.layout === "/admin") { 
        return (
          <Route path={`/${prop.path}`} element={
            <React.Suspense fallback={
              <div className="flex min-h-[200px] w-full items-center justify-center">
                <span className="loader"></span>
              </div>
            }>
              {prop.component}
            </React.Suspense>
          } key={key} />
        );
      } else {
        return null;
      }
    });
  }, []);

  document.documentElement.dir = "ltr";

  // Layout for users with "Reportes" role only - no sidebar, simplified navbar with logout
  if (isReportesOnly || reportesOnly) {
    return (
      <div className="flex h-full w-full bg-lightPrimary dark:!bg-navy-900">
        <main className="flex w-full">
          <div className="h-full flex flex-col min-h-screen w-full px-4">
            {/* Simple navbar with just logo and user icon */}
            <Navbar
              onOpenSidenav={() => {}}
              logoText={"Eventflow Tailwind React"}
              brandText="Reportes"
              secondary={false}
              {...rest}
            />
            <div className="flex-grow mx-auto w-full pt-6 pb-4">
              <Routes>
                {getRoutes(routes)}
                <Route path="/" element={<Navigate to="/admin/reportes" replace />} />
              </Routes>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Normal layout for other users
  return (
    <div className="flex h-full w-full ">
      <Sidebar open={open} onClose={() => setOpen(false)} activePath={activePath} />
      {/* Navbar & Main Content */}
      <div className="h-full w-full bg-lightPrimary dark:!bg-navy-900">
        {/* Main Content */}
        <main
          className={`flex mx-[12px] transition-all md:pr-2
          ${ activePath !== '' ? "xl:ml-[408px]" : "xl:ml-[88px]"} `}
        >
          {/* Routes */}
          <div className="h-full flex flex-col min-h-screen w-full px-2">
            {/* Mock has no top bar on desktop (sign-out lives in the rail
                avatar); keep the navbar below xl for the hamburger + logo. */}
            <div className="xl:hidden">
              <Navbar
                onOpenSidenav={() => setOpen(true)}
                logoText={"Eventflow Tailwind React"}
                brandText={"Dashboard"}
                secondary={getActiveNavbar(routes)}
                {...rest}
              />
            </div>
            {/* max-w keeps content dense on wide monitors instead of
                stretching cards across the full viewport */}
            {/* No footer: admin pages (dashboard especially) must fit one
                viewport without scrolling. */}
            <div className="flex-grow mx-auto w-full max-w-[1480px] pt-4 pb-4 md:pr-2">
              <Routes>
                {getRoutes(routes)}
                <Route
                  path="/"
                  element={<Navigate to="/admin/dashboard" replace />}
                />
              </Routes>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
