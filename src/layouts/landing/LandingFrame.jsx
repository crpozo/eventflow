// Marco de las páginas públicas /landing/*: contenedor blanco a pantalla
// completa y el pie oscuro del rediseño 2026-10 (institución a la izquierda,
// web oficial a la derecha). Lo comparten el layout del panel (rutas de
// routes.js) y la landing liviana/estática (src/landing-app), para que ambas
// pinten exactamente el mismo HTML.
export default function LandingFrame({ children }) {
  return (
    <div>
      <div className="relative float-right h-full min-h-screen w-full !bg-white dark:!bg-navy-900">
        <main className={`mx-auto min-h-screen flex flex-col`}>
            <div className="flex-grow mb-auto lg:pl-0 xl:max-w-full">
              {children}
            </div>
            <footer className="bg-[#111111] text-white">
              <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4 px-6 py-8 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-base font-bold">Universidad San Francisco de Quito</p>
                  {/* El año del HTML estático puede quedar viejo tras el cambio de año: se corrige al hidratar. */}
                  <p suppressHydrationWarning className="mt-0.5 text-sm text-white/60">Copyright © {new Date().getFullYear()} · Eventos USFQ</p>
                </div>
                <a
                  href="https://www.usfq.edu.ec"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-white hover:text-white/70 hover:no-underline"
                >
                  usfq.edu.ec ↗
                </a>
              </div>
            </footer>
        </main>
      </div>
    </div>
  );
}
