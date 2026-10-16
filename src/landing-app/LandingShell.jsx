import { Routes, Route } from "react-router-dom";
import LandingFrame from "layouts/landing/LandingFrame";
import Landing from "views/landing";

// Árbol de la landing pública liviana (y de su HTML estático): el mismo marco
// y la misma vista que el panel monta en /landing/*, pero sin App.jsx, sin el
// Authenticator ni las rutas del admin.
export default function LandingShell({ initialData = null, hydrated = false }) {
  const page = <Landing initialData={initialData} hydrated={hydrated} />;
  return (
    <LandingFrame>
      <Routes>
        <Route path="/landing/:id" element={page} />
        <Route path="/landing/:id/:lang" element={page} />
      </Routes>
    </LandingFrame>
  );
}
