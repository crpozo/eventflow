/* Tests de caracterización de los toggles estilo Horizon UI:
 *  - Checkbox — components/checkbox
 *  - Progress — components/progress
 *  - Radio — components/radio
 *  - Switch — components/switch
 * Fijan el className EXACTO (normalizando espacios) que produce cada color,
 * el fallback brand para colores desconocidos y el paso de props (...rest),
 * para garantizar que el refactor del mapa de colores no cambie el render.
 */
import React from "react";
import { render, screen } from "@testing-library/react";

import Checkbox from "components/checkbox";
import Progress from "components/progress";
import Radio from "components/radio";
import Switch from "components/switch";

// Colapsa saltos de línea/indentación del template literal a un solo espacio.
const normalizar = (clases) => clases.replace(/\s+/g, " ").trim();

const COLORES = [
  "red",
  "blue",
  "green",
  "yellow",
  "orange",
  "teal",
  "navy",
  "lime",
  "cyan",
  "pink",
  "purple",
  "amber",
  "indigo",
  "gray",
];

// Colores fuera de la paleta (incluye claves del prototipo de Object para
// verificar que el lookup no las resuelva como si fueran colores válidos).
const COLORES_DESCONOCIDOS = ["fucsia", "constructor", "toString", ""];

const BASE_CHECKBOX =
  "defaultCheckbox relative flex h-[20px] min-h-[20px] w-[20px] min-w-[20px] appearance-none items-center " +
  "justify-center rounded-md border border-gray-300 text-white/0 outline-none transition duration-[0.2s] " +
  "checked:border-none checked:text-white hover:cursor-pointer dark:border-white/10";

const BASE_SWITCH =
  "relative h-5 w-10 appearance-none rounded-[20px] bg-[#e0e5f2] outline-none transition duration-[0.5s] " +
  "before:absolute before:top-[50%] before:h-4 before:w-4 before:translate-x-[2px] before:translate-y-[-50%] before:rounded-[20px] " +
  'before:bg-white before:shadow-[0_2px_5px_rgba(0,_0,_0,_.2)] before:transition before:content-[""] ' +
  "checked:before:translate-x-[22px] hover:cursor-pointer dark:bg-white/5";

const BASE_RADIO =
  'before:contet[""] relative h-5 w-5 cursor-pointer appearance-none rounded-full ' +
  "border !border-gray-300 transition-all duration-[0.2s] before:absolute before:top-[3px] " +
  "before:left-[50%] before:h-3 before:w-3 before:translate-x-[-50%] before:rounded-full before:transition-all before:duration-[0.2s] dark:!border-gray-800";

const BASE_PROGRESS_INTERIOR =
  "flex h-full items-center justify-center rounded-full";

describe("Checkbox — clases por color", () => {
  it.each(COLORES)("color %s renderiza las clases checked de la paleta", (color) => {
    render(<Checkbox color={color} extra="mi-extra" />);
    expect(normalizar(screen.getByRole("checkbox").className)).toBe(
      `${BASE_CHECKBOX} checked:border-none checked:bg-${color}-500 dark:checked:bg-${color}-400 mi-extra`
    );
  });

  it.each(COLORES_DESCONOCIDOS)(
    "color desconocido %p cae al fallback brand",
    (color) => {
      render(<Checkbox color={color} extra="mi-extra" />);
      expect(normalizar(screen.getByRole("checkbox").className)).toBe(
        `${BASE_CHECKBOX} checked:bg-brand-500 dark:checked:bg-brand-400 mi-extra`
      );
    }
  );

  it("sin color usa el fallback brand y pasa ...rest (name pisa 'weekly')", () => {
    render(<Checkbox extra="mi-extra" name="otro" defaultChecked />);
    const checkbox = screen.getByRole("checkbox");
    expect(normalizar(checkbox.className)).toBe(
      `${BASE_CHECKBOX} checked:bg-brand-500 dark:checked:bg-brand-400 mi-extra`
    );
    expect(checkbox).toHaveAttribute("name", "otro");
    expect(checkbox).toBeChecked();
  });
});

describe("Switch — clases por color", () => {
  it.each(COLORES)("color %s renderiza las clases checked de la paleta", (color) => {
    render(<Switch color={color} extra="mi-extra" />);
    expect(normalizar(screen.getByRole("checkbox").className)).toBe(
      `${BASE_SWITCH} checked:bg-${color}-500 dark:checked:bg-${color}-400 mi-extra`
    );
  });

  it.each(COLORES_DESCONOCIDOS)(
    "color desconocido %p cae al fallback brand",
    (color) => {
      render(<Switch color={color} extra="mi-extra" />);
      expect(normalizar(screen.getByRole("checkbox").className)).toBe(
        `${BASE_SWITCH} checked:bg-brand-500 dark:checked:bg-brand-400 mi-extra`
      );
    }
  );

  it("sin color usa el fallback brand y conserva name='weekly' por defecto", () => {
    render(<Switch extra="mi-extra" />);
    const toggle = screen.getByRole("checkbox");
    expect(normalizar(toggle.className)).toBe(
      `${BASE_SWITCH} checked:bg-brand-500 dark:checked:bg-brand-400 mi-extra`
    );
    expect(toggle).toHaveAttribute("name", "weekly");
  });
});

describe("Radio — clases por color", () => {
  it.each(COLORES)("color %s renderiza las clases checked de la paleta", (color) => {
    render(<Radio color={color} />);
    expect(normalizar(screen.getByRole("radio").className)).toBe(
      `${BASE_RADIO} checked:!border-${color}-500 checked:before:!bg-${color}-500 dark:checked:!border-${color}-400 dark:checked:before:!bg-${color}-400`
    );
  });

  it.each(COLORES_DESCONOCIDOS)(
    "color desconocido %p cae al fallback brand",
    (color) => {
      render(<Radio color={color} />);
      expect(normalizar(screen.getByRole("radio").className)).toBe(
        `${BASE_RADIO} checked:!border-brand-500 checked:before:!bg-brand-500 dark:checked:!border-brand-400 dark:checked:before:!bg-brand-400`
      );
    }
  );

  it("pasa id, name y ...rest al input", () => {
    render(<Radio id="mi-radio" name="grupo" defaultChecked />);
    const radio = screen.getByRole("radio");
    expect(radio).toHaveAttribute("id", "mi-radio");
    expect(radio).toHaveAttribute("name", "grupo");
    expect(radio).toBeChecked();
  });
});

describe("Progress — clases por color y ancho", () => {
  it.each(COLORES)("color %s renderiza las clases bg de la paleta", (color) => {
    const { container } = render(<Progress color={color} value={40} />);
    const barra = container.firstChild.firstChild;
    expect(normalizar(barra.className)).toBe(
      `${BASE_PROGRESS_INTERIOR} bg-${color}-500 dark:bg-${color}-400`
    );
    expect(barra).toHaveStyle({ width: "40%" });
  });

  it.each(COLORES_DESCONOCIDOS)(
    "color desconocido %p cae al fallback brand",
    (color) => {
      const { container } = render(<Progress color={color} value={10} />);
      expect(normalizar(container.firstChild.firstChild.className)).toBe(
        `${BASE_PROGRESS_INTERIOR} bg-brand-500 dark:bg-brand-400`
      );
    }
  );

  it("sin width usa w-full en el contenedor", () => {
    const { container } = render(<Progress value={25} />);
    expect(normalizar(container.firstChild.className)).toBe(
      "h-2 w-full rounded-full bg-gray-200 dark:bg-navy-700"
    );
  });

  it("con width usa la clase recibida en lugar de w-full", () => {
    const { container } = render(<Progress value={25} width="w-1/2" />);
    expect(normalizar(container.firstChild.className)).toBe(
      "h-2 w-1/2 rounded-full bg-gray-200 dark:bg-navy-700"
    );
  });
});
