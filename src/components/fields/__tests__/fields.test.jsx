/* Tests de InputField y TextField: asociación label/control y clases por estado
 * (deshabilitado > error > éxito > normal). */
import React from "react";
import { render, screen } from "@testing-library/react";
import InputField from "../InputField";
import TextField from "../TextField";

describe("InputField", () => {
  const renderInput = (props = {}) =>
    render(
      <InputField label="Nombre" id="nombre" placeholder="Escribe" {...props} />
    );

  test("asocia el label al input por id y aplica el estilo normal", () => {
    renderInput();
    const input = screen.getByLabelText("Nombre");
    expect(input).toHaveAttribute("id", "nombre");
    expect(input.className).toContain("border-gray-200");
  });

  test("variant auth usa label medium y por defecto negrita", () => {
    const { unmount } = renderInput({ variant: "auth" });
    expect(screen.getByText("Nombre").className).toContain("ml-1.5");
    unmount();
    renderInput();
    expect(screen.getByText("Nombre").className).toContain("font-bold");
  });

  test("deshabilitado gana sobre el estado y apaga el borde", () => {
    renderInput({ disabled: true, state: "error" });
    const input = screen.getByLabelText("Nombre");
    expect(input).toBeDisabled();
    expect(input.className).toContain("!bg-gray-100");
    expect(input.className).not.toContain("border-red-500");
  });

  test("estado error pinta el campo en rojo", () => {
    renderInput({ state: "error" });
    expect(screen.getByLabelText("Nombre").className).toContain("border-red-500");
  });

  test("estado success pinta el campo en verde", () => {
    renderInput({ state: "success" });
    expect(screen.getByLabelText("Nombre").className).toContain(
      "border-green-500"
    );
  });
});

describe("TextField", () => {
  const renderArea = (props = {}) =>
    render(
      <TextField label="Descripción" id="descripcion" rows={4} {...props} />
    );

  test("asocia el label al textarea por id y aplica el estilo normal", () => {
    renderArea();
    const area = screen.getByLabelText("Descripción");
    expect(area.tagName).toBe("TEXTAREA");
    expect(area).toHaveAttribute("rows", "4");
    expect(area.className).toContain("border-gray-200");
  });

  test("deshabilitado gana sobre el estado y apaga el borde", () => {
    renderArea({ disabled: true, state: "success" });
    const area = screen.getByLabelText("Descripción");
    expect(area.className).toContain("!bg-gray-100");
    expect(area.className).not.toContain("border-green-500");
  });

  test("estado error pinta el campo en rojo", () => {
    renderArea({ state: "error" });
    expect(screen.getByLabelText("Descripción").className).toContain(
      "!border-red-500"
    );
  });

  test("estado success pinta el campo en verde", () => {
    renderArea({ state: "success" });
    expect(screen.getByLabelText("Descripción").className).toContain(
      "!border-green-500"
    );
  });
});
