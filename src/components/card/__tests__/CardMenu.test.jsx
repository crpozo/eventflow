/* Tests de CardMenu: botón de tres puntos, apertura del dropdown y variantes. */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CardMenu from "../CardMenu";

describe("CardMenu", () => {
  test("renderiza el botón con type=button y los 4 paneles del menú", () => {
    const { container } = render(<CardMenu />);
    const boton = screen.getByRole("button");
    expect(boton).toHaveAttribute("type", "button");
    ["Panel 1", "Panel 2", "Panel 3", "Panel 4"].forEach((panel) =>
      expect(screen.getByText(panel)).toBeInTheDocument()
    );
    // Cerrado: el contenedor del dropdown queda en scale-0.
    expect(container.querySelector(".scale-0")).not.toBeNull();
  });

  test("mousedown sobre el botón abre el dropdown y click no revienta", () => {
    const { container } = render(<CardMenu />);
    fireEvent.mouseDown(screen.getByRole("button"));
    expect(container.querySelector(".scale-100")).not.toBeNull();
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("Panel 1")).toBeInTheDocument();
  });

  test("variante transparente: botón sin fondo y menú anclado en top-8", () => {
    const { container } = render(<CardMenu transparent />);
    expect(screen.getByRole("button").className).toContain("bg-none");
    expect(container.querySelector(".top-8")).not.toBeNull();
  });

  test("variante normal: botón con fondo claro y menú anclado en top-11", () => {
    const { container } = render(<CardMenu />);
    expect(screen.getByRole("button").className).toContain("bg-lightPrimary");
    expect(container.querySelector(".top-11")).not.toBeNull();
  });
});
