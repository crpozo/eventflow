import { Routes, Route } from "react-router-dom";
import routes from "routes.js";
import LandingFrame from "./LandingFrame";

export default function Landing() {
  const getRoutes = (routes) => {
    return routes.map((prop) => {
      if (prop.layout === "/landing") {
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
  return (
    <LandingFrame>
      <Routes>
        {getRoutes(routes)}
      </Routes>
    </LandingFrame>
  );
}
