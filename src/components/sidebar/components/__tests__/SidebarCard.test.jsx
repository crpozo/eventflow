// Tests de SidebarCard (FreeCard): la tarjeta de upgrade que cuelga al final
// del sidebar. Presentacional pero con contrato observable: el pitch y el CTA
// externo. Cobertura para SonarQube vía `npm run test:coverage`.
import React from "react";
import { render, screen } from "@testing-library/react";
import FreeCard from "components/sidebar/components/SidebarCard";

describe("SidebarCard (FreeCard)", () => {
  it("muestra el pitch de upgrade a PRO", () => {
    render(<FreeCard />);
    expect(
      screen.getByText(/Improve your development process/i)
    ).toBeInTheDocument();
    // El texto "Upgrade to PRO" aparece como título y como CTA.
    expect(screen.getAllByText("Upgrade to PRO").length).toBeGreaterThanOrEqual(
      2
    );
  });

  it("el CTA es un link externo a horizon-ui PRO que abre en otra pestaña", () => {
    render(<FreeCard />);
    const link = screen.getByRole("link", { name: "Upgrade to PRO" });
    expect(link).toHaveAttribute(
      "href",
      "https://horizon-ui.com/pro?ref=live-free-tailwind-react"
    );
    expect(link).toHaveAttribute("target", "blank");
  });
});
