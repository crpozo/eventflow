import Navbar from "components/navbar";
import { Routes, Route } from "react-router-dom";
import routes from "routes.js";

export default function Landing() {
  const getRoutes = (routes) => {
    return routes.map((prop, key) => {
      if (prop.layout === "/usuario") {
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
      <div className="relative float-right h-full min-h-screen w-full !bg-usfqPrimary dark:!bg-navy-900">
        <main className={`mx-auto`}>
            {/* <div className="h-full">
              <nav className="absolute top-4 z-40 flex flex-row flex-wrap items-center justify-between rounded-xl bg-white/10 px-2 pt-2 backdrop-blur-xl dark:bg-[#0b14374d] gap-5 md:gap-0">
                <div className="ml-[6px]">
                  <p className="shrink text-[33px] capitalize text-navy-700 dark:text-white">
                    <span className="font-black text-3xl capitalize hover:no-underline text-black hover:text-black dark:hover:text-white">
                      Eventflow
                    </span>
                  </p>
                </div>
              </nav>
            </div> */}
            <div className="flex items-center mb-auto lg:pl-0 xl:max-w-full min-h-screen">
              <Routes>
                {getRoutes(routes)}
              </Routes>
            </div>
            {/* <footer className="bg-black flex justify-center p-4">
              <p className="text-white text-center">Copyright © 2023 Universidad San Francisco de Quito</p>
            </footer> */}
        </main>
      </div>
    </div>
  );
}
