/* Tests de componentes pequeños: FooterAuthDefault y NftCard. */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { seedStoredEvent } from "../testUtils/amplifyMocks";
import Footer from "./footer/FooterAuthDefault";
import NftCard from "./card/NftCard";

describe("FooterAuthDefault", () => {
  test("muestra el copyright con el año actual", () => {
    render(<Footer />);
    const anio = new Date().getFullYear();
    expect(
      screen.getByText(
        (_, el) =>
          el.tagName === "P" &&
          el.textContent === `©${anio} Eventflow. Todos los derechos reservados.`
      )
    ).toBeInTheDocument();
  });

  test("renderiza los 4 enlaces con sus destinos correctos", () => {
    render(<Footer />);
    expect(screen.getAllByRole("link")).toHaveLength(4);
    expect(screen.getByRole("link", { name: "Support" })).toHaveAttribute(
      "href",
      "mailto:hello@simmmple.com"
    );
    expect(screen.getByRole("link", { name: "License" })).toHaveAttribute(
      "href",
      "https://simmmple.com/licenses"
    );
    expect(screen.getByRole("link", { name: "Terms of Use" })).toHaveAttribute(
      "href",
      "https://simmmple.com/terms-of-service"
    );
    expect(screen.getByRole("link", { name: "Blog" })).toHaveAttribute(
      "href",
      "https://blog.horizon-ui.com/"
    );
  });
});

describe("NftCard", () => {
  // Espía de ruta: muestra pathname y state.id de la navegación actual.
  const EspiaRuta = () => {
    const loc = useLocation();
    return (
      <div data-testid="ruta">
        {loc.pathname}|{loc.state?.id ?? "sin-id"}
      </div>
    );
  };

  const renderCard = (props) =>
    render(
      <MemoryRouter initialEntries={["/lista"]}>
        <EspiaRuta />
        <NftCard {...props} />
      </MemoryRouter>
    );

  beforeEach(() => {
    localStorage.clear();
  });

  test("muestra título, fecha formateada y el botón de categoría", () => {
    const fecha = "2026-07-15T10:00:00";
    const d = new Date(fecha);
    const esperada = `${d.getDate()} ${d.toLocaleString("default", { month: "short" })}. ${d.getFullYear()}`;

    renderCard({ title: "Feria de Carreras", date: fecha, cat: "Ver evento", pathSelect: "/x", color: "bg-blue-500" });

    expect(screen.getByRole("heading", { name: "Feria de Carreras" })).toBeInTheDocument();
    expect(
      screen.getByText(
        (_, el) => el.tagName === "P" && el.textContent === `Última actualización: ${esperada}`
      )
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ver evento" })).toBeInTheDocument();
  });

  test("con pathEdit muestra 'Editar' y navega con el id del modelo en el state", () => {
    renderCard({
      title: "Mi área",
      cat: "Ver",
      modelID: "m-7",
      pathEdit: "/admin/editar",
      pathSelect: "/admin/ver",
    });

    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    expect(screen.getByTestId("ruta")).toHaveTextContent("/admin/editar|m-7");
  });

  test("sin pathEdit NO renderiza el botón Editar", () => {
    renderCard({ title: "Sin edición", cat: "Ver", pathSelect: "/x" });
    expect(screen.queryByRole("button", { name: "Editar" })).not.toBeInTheDocument();
  });

  test("seleccionar un campus guarda el modelo y limpia área, subárea y evento", () => {
    localStorage.setItem("EVENTFLOW.area", JSON.stringify({ id: "a1" }));
    localStorage.setItem("EVENTFLOW.subarea", JSON.stringify({ id: "s1" }));
    seedStoredEvent({ id: "ev-1", title: "Evento viejo" });

    const campus = { id: "c1", name: "Cumbayá" };
    renderCard({
      title: "Cumbayá",
      cat: "Ver áreas",
      modelName: "campus",
      model: campus,
      pathSelect: "/admin/areas",
    });

    fireEvent.click(screen.getByRole("button", { name: "Ver áreas" }));

    expect(screen.getByTestId("ruta")).toHaveTextContent("/admin/areas|sin-id");
    expect(JSON.parse(localStorage.getItem("EVENTFLOW.campus"))).toEqual(campus);
    expect(localStorage.getItem("EVENTFLOW.area")).toBeNull();
    expect(localStorage.getItem("EVENTFLOW.subarea")).toBeNull();
    expect(localStorage.getItem("EVENTFLOW.event")).toBeNull();
  });

  test("seleccionar un área limpia subárea y evento pero conserva el campus", () => {
    localStorage.setItem("EVENTFLOW.campus", JSON.stringify({ id: "c1" }));
    localStorage.setItem("EVENTFLOW.subarea", JSON.stringify({ id: "s1" }));
    seedStoredEvent();

    const area = { id: "a1", name: "Ingeniería" };
    renderCard({
      title: "Ingeniería",
      cat: "Ver subáreas",
      modelName: "area",
      model: area,
      pathSelect: "/admin/subareas",
    });

    fireEvent.click(screen.getByRole("button", { name: "Ver subáreas" }));

    expect(JSON.parse(localStorage.getItem("EVENTFLOW.area"))).toEqual(area);
    expect(localStorage.getItem("EVENTFLOW.campus")).not.toBeNull();
    expect(localStorage.getItem("EVENTFLOW.subarea")).toBeNull();
    expect(localStorage.getItem("EVENTFLOW.event")).toBeNull();
  });

  test("seleccionar una subárea solo limpia el evento", () => {
    localStorage.setItem("EVENTFLOW.area", JSON.stringify({ id: "a1" }));
    seedStoredEvent();

    renderCard({
      title: "Software",
      cat: "Ver eventos",
      modelName: "subarea",
      model: { id: "s1" },
      pathSelect: "/admin/eventos",
    });

    fireEvent.click(screen.getByRole("button", { name: "Ver eventos" }));

    expect(localStorage.getItem("EVENTFLOW.event")).toBeNull();
    expect(localStorage.getItem("EVENTFLOW.area")).not.toBeNull();
    expect(JSON.parse(localStorage.getItem("EVENTFLOW.subarea"))).toEqual({ id: "s1" });
  });

  test("sin modelName no escribe ni borra nada en localStorage, pero sí navega", () => {
    const evento = seedStoredEvent({ id: "ev-1", title: "Evento Test" });

    renderCard({ title: "Solo navega", cat: "Ir", pathSelect: "/destino" });
    fireEvent.click(screen.getByRole("button", { name: "Ir" }));

    expect(screen.getByTestId("ruta")).toHaveTextContent("/destino|sin-id");
    expect(JSON.parse(localStorage.getItem("EVENTFLOW.event"))).toEqual(evento);
    expect(localStorage.length).toBe(1);
  });
});
