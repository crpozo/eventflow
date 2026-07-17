/* Tests de MiniCalendar: arranca con hoy seleccionado y permite elegir otro día. */
import React from "react";
import { render, fireEvent } from "@testing-library/react";
import MiniCalendar from "../MiniCalendar";

describe("MiniCalendar", () => {
  test("arranca con el día de hoy seleccionado en la vista de mes", () => {
    const { container } = render(<MiniCalendar />);
    const activo = container.querySelector(".react-calendar__tile--active");
    expect(activo).not.toBeNull();
    expect(activo).toHaveTextContent(String(new Date().getDate()));
  });

  test("al hacer click en otro día del mes ese queda seleccionado", () => {
    const { container } = render(<MiniCalendar />);
    const tiles = Array.from(
      container.querySelectorAll(
        ".react-calendar__month-view__days .react-calendar__tile"
      )
    );
    const otro = tiles.find(
      (t) =>
        !t.className.includes("react-calendar__tile--active") &&
        !t.className.includes("neighboringMonth")
    );
    fireEvent.click(otro);
    expect(otro.className).toContain("react-calendar__tile--active");
  });
});
