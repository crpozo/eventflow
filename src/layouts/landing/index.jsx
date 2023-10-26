import { Routes, Route } from "react-router-dom";
import routes from "routes.js";

export default function Landing() {
  const getRoutes = (routes) => {
    return routes.map((prop, key) => {
      if (prop.layout === "/landing") {
        return (
          <Route path={`/${prop.path}`} element={prop.component} key={key} />
        );
      } else {
        return null;
      }
    });
  };
  return (
    <div>
      <div className="relative float-right h-full min-h-screen w-full !bg-white dark:!bg-navy-900">
        <main className={`mx-auto min-h-screen`}>
            <div className="mb-auto lg:pl-0 xl:max-w-full">
              <Routes>
                {getRoutes(routes)}
              </Routes>
            </div>
            <footer className="bg-black flex justify-center p-4">
              <p className="text-white text-center">Copyright © 2023 Universidad San Francisco de Quito</p>
            </footer>
        </main>
      </div>
    </div>
  );
}
