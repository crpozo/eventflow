import Navbar from "components/navbar";
import { Routes, Route, Navigate } from "react-router-dom";
import routes from "routes.js";

export default function Landing() {

  const getRoutes = (routes) => {
    return routes.map((prop, key) => {
      if (prop.layout === "/privacidad") {
        return (
          <Route path={`/${prop.path}`} element={prop.component} key={key} />
        );
      } else {
        return null;
      }
    });
  };

  return (
    <div className="flex h-full w-full legal-layout">
      <div className="h-full w-full bg-lightPrimary dark:!bg-navy-900">
        <main
          className={`mx-[12px] h-full flex-none transition-all md:pr-2`}
        >
          <div className="h-full">
            <Navbar
              logoText={"Eventflow Tailwind React"}
              signOut={false}
            />
            <div className="pt-5s mx-auto mb-auto h-full p-2 md:pr-2">
              <Routes>
                {getRoutes(routes)}
              </Routes>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
