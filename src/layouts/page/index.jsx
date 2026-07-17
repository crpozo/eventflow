import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "components/navbar";
import Footer from "components/footer/Footer";
import routes from "routes.js";
 
export default function Admin(props) {
  const { ...rest } = props;
  const location = useLocation();
  const [currentRoute, setCurrentRoute] = React.useState("Campus");

  React.useEffect(() => {
    getActiveRoute(routes);
  }, [location.pathname]);

  const getActiveRoute = (routes) => {
    const activeRoute = "Campus";
    for (const route of routes) {
      if (window.location.href.includes(route.layout + "/" + route.path)) {
        setCurrentRoute(route.name);
      }
    }
    return activeRoute;
  };
  const getActiveNavbar = (routes) => {
    const activeNavbar = false;
    for (const route of routes) {
      if (window.location.href.includes(route.layout + route.path)) {
        return route.secondary;
      }
    }
    return activeNavbar;
  };
  const getRoutes = (routes) => {
    return routes.map((prop) => {
      if (prop.layout === "/page") {
        return (
          <Route
            path={`/${prop.path}`}
            element={prop.component}
            key={prop.layout + prop.path}
          />
        );
      } else {
        return null;
      }
    });
  };

  document.documentElement.dir = "ltr";
  return (
    <div className="flex h-full w-full">
      {/* Navbar & Main Content */}
      <div className="h-full w-full bg-lightPrimary dark:!bg-navy-900">
        {/* Main Content */}
        <main
          className={`mx-[12px] h-full flex-none transition-all md:pr-2`}
        >
          {/* Routes */}
          <div className="h-full flex flex-col min-h-screen w-full px-2">
            <Navbar
              logoText={"Eventflow Tailwind React"}
              brandText={currentRoute}
              secondary={getActiveNavbar(routes)}
              {...rest}
            />
            <div className="w-full pt-5s flex-grow mx-auto mb-auto h-full p-2 md:pr-2">
              <Routes>
                {getRoutes(routes)}
                <Route
                  path="/"
                  element={<Navigate to="/admin/default" replace />}
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
