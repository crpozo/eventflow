/* Tests de los íconos SVG: los props camelCase de React se renderizan como
 * atributos SVG kebab-case válidos. */
import React from "react";
import { render } from "@testing-library/react";
import SearchIcon from "../SearchIcon";
import ThemsIcon from "../ThemsIcon";

describe("SearchIcon", () => {
  test("renderiza el path con stroke-linecap/linejoin/width", () => {
    const { container } = render(<SearchIcon />);
    const path = container.querySelector("path");
    expect(path).toHaveAttribute("stroke-linecap", "round");
    expect(path).toHaveAttribute("stroke-linejoin", "round");
    expect(path).toHaveAttribute("stroke-width", "2");
    expect(container.querySelector("svg")).toHaveAttribute(
      "stroke",
      "currentColor"
    );
  });
});

describe("ThemsIcon", () => {
  test("renderiza el grupo con el clip-path que apunta al defs", () => {
    const { container } = render(<ThemsIcon />);
    expect(container.querySelector("g")).toHaveAttribute(
      "clip-path",
      "url(#clip0_201_2879)"
    );
    expect(container.querySelector("clipPath")).toHaveAttribute(
      "id",
      "clip0_201_2879"
    );
  });
});
