import Footer from "components/footer/FooterAuthDefault";
import { Link, Routes, Route, Navigate } from "react-router-dom";
import routes from "routes.js";
import FixedPlugin from "components/fixedPlugin/FixedPlugin";

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
  document.documentElement.dir = "ltr";
  return (
    <div>
      <div className="relative float-right h-full min-h-screen w-full !bg-white dark:!bg-navy-900">
        <main className={`mx-auto min-h-screen`}>
            <div className="mb-auto lg:max-w-[48%] lg:pl-0 xl:max-w-full">
              <Routes>
                {getRoutes(routes)}
              </Routes>
            </div>
        </main>
      </div>
    </div>
  );
}
