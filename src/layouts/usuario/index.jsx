import { Routes, Route, Link } from "react-router-dom";
import routes from "routes.js";
import logo from "assets/img/usfq/logo.svg";
import { FiExternalLink } from "react-icons/fi";


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
        <main className={`mx-auto d-flex flex-col	justify-center min-h-screen`}>
            <div className="flex h-[100px] w-full bg-usfqPrimary">
              <div className="container flex items-center justify-between">
                <img src={logo} className="w-[120px]" />
                <Link
                  to="https://www.usfq.edu.ec/es"
                  className="flex items-center gap-2 hover:text-red-500 hover:no-underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ir a página oficial USFQ <FiExternalLink className="h-5 w-5" />
                </Link>
              </div>
            </div>
            <div className="flex items-center mb-auto lg:pl-0 xl:max-w-full flex-1">
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
