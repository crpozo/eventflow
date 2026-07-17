/**
 * Tests de LandingExtras (src/views/landing/components/LandingExtras.jsx):
 * galería (dedupe + resolución CloudFront), carrusel de logos duplicado y el
 * lightbox accesible (click, Enter/Espacio, Escape, botón Cerrar y el fondo
 * clickeable que cierra sin cerrar al hacer click en la imagen ampliada).
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import LandingExtras from "views/landing/components/LandingExtras";

const CLOUDFRONT = "https://dnuc5lxyun5b.cloudfront.net/public/";

const ui = { gallery: "Galería de fotos", partners: "Aliados" };

const renderExtras = (landing = {}) =>
  render(<LandingExtras landing={landing} ui={ui} />);

const getDialog = () => screen.queryByRole("dialog");

describe("LandingExtras: secciones condicionales", () => {
  test("sin fotos ni logos no renderiza ninguna sección", () => {
    renderExtras({});
    expect(screen.queryByText(ui.gallery)).not.toBeInTheDocument();
    expect(screen.queryByText(ui.partners)).not.toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  test("galería: dedupe de keys repetidas y resolución CloudFront vs URL absoluta", () => {
    renderExtras({
      galleryPhotos: ["foto1.jpg", "foto1.jpg", "https://cdn.example.com/x.png", null],
    });

    expect(screen.getByText(ui.gallery)).toBeInTheDocument();
    // "foto1.jpg" duplicada se colapsa a una sola imagen.
    const img1 = screen.getByAltText(`${ui.gallery} 1`);
    const img2 = screen.getByAltText(`${ui.gallery} 2`);
    expect(screen.queryByAltText(`${ui.gallery} 3`)).not.toBeInTheDocument();
    // Key relativa => prefijo CloudFront; URL absoluta => intacta.
    expect(img1).toHaveAttribute("src", `${CLOUDFRONT}foto1.jpg`);
    expect(img2).toHaveAttribute("src", "https://cdn.example.com/x.png");
  });

  test("carrusel de aliados duplica la lista de logos para el loop continuo", () => {
    renderExtras({ partnerLogos: ["l1.png", "l2.png"] });

    expect(screen.getByText(ui.partners)).toBeInTheDocument();
    const logos = screen.getAllByAltText("partner logo");
    expect(logos).toHaveLength(4); // 2 logos x 2 (lista duplicada)
    expect(logos[0]).toHaveAttribute("src", `${CLOUDFRONT}l1.png`);
    expect(logos[2]).toHaveAttribute("src", `${CLOUDFRONT}l1.png`);
  });
});

describe("LandingExtras: lightbox", () => {
  test("click en una foto abre el lightbox con esa imagen y Escape lo cierra", () => {
    renderExtras({ galleryPhotos: ["foto1.jpg"] });

    expect(getDialog()).not.toBeInTheDocument();
    fireEvent.click(screen.getByAltText(`${ui.gallery} 1`));

    const dialog = getDialog();
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");
    // La imagen ampliada dentro del dialog apunta a la misma URL.
    const zoomed = dialog.querySelector("img");
    expect(zoomed).toHaveAttribute("src", `${CLOUDFRONT}foto1.jpg`);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(getDialog()).not.toBeInTheDocument();
  });

  test("teclado: Enter abre, botón Cerrar cierra, Espacio reabre y el fondo clickeable cierra", () => {
    renderExtras({ galleryPhotos: ["foto1.jpg"] });
    const thumb = screen.getByAltText(`${ui.gallery} 1`);

    // Una tecla cualquiera no abre nada.
    fireEvent.keyDown(thumb, { key: "Tab" });
    expect(getDialog()).not.toBeInTheDocument();

    // Enter sobre la miniatura (burbujea al <button>) abre el lightbox.
    fireEvent.keyDown(thumb, { key: "Enter" });
    expect(getDialog()).toBeInTheDocument();

    // El botón X (aria-label Cerrar) lo cierra.
    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(getDialog()).not.toBeInTheDocument();

    // Espacio también abre.
    fireEvent.keyDown(thumb, { key: " " });
    expect(getDialog()).toBeInTheDocument();

    // El fondo clickeable (todo el overlay oscuro) cierra.
    fireEvent.click(
      screen.getByRole("button", { name: "Cerrar imagen ampliada" })
    );
    expect(getDialog()).not.toBeInTheDocument();
  });

  test("click en la imagen ampliada NO cierra; el fondo clickeable sí", () => {
    renderExtras({ galleryPhotos: ["foto1.jpg"] });
    fireEvent.click(screen.getByAltText(`${ui.gallery} 1`));

    // La imagen ampliada no tiene handlers: ni click ni teclado la cierran.
    const dialog = getDialog();
    const zoomed = dialog.querySelector("img");
    fireEvent.click(zoomed);
    expect(getDialog()).toBeInTheDocument();

    fireEvent.keyDown(zoomed, { key: "Enter" });
    expect(getDialog()).toBeInTheDocument();

    // El fondo clickeable (cubre todo el overlay) sí cierra.
    fireEvent.click(
      screen.getByRole("button", { name: "Cerrar imagen ampliada" })
    );
    expect(getDialog()).not.toBeInTheDocument();
  });

  test("los logos del carrusel también abren el lightbox", () => {
    renderExtras({ partnerLogos: ["l1.png"] });
    fireEvent.click(screen.getAllByAltText("partner logo")[0]);
    const dialog = getDialog();
    expect(dialog).toBeInTheDocument();
    expect(dialog.querySelector("img")).toHaveAttribute(
      "src",
      `${CLOUDFRONT}l1.png`
    );
  });

  test("teclado en los logos: Enter/Espacio abren el lightbox; otras teclas no", () => {
    renderExtras({ partnerLogos: ["l1.png"] });
    const logo = screen.getAllByAltText("partner logo")[0];

    // Una tecla cualquiera no abre nada.
    fireEvent.keyDown(logo, { key: "a" });
    expect(getDialog()).not.toBeInTheDocument();

    // Enter abre (burbujea al <button> del logo).
    fireEvent.keyDown(logo, { key: "Enter" });
    expect(getDialog()).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(getDialog()).not.toBeInTheDocument();

    // Espacio también abre.
    fireEvent.keyDown(logo, { key: " " });
    expect(getDialog()).toBeInTheDocument();
    expect(getDialog().querySelector("img")).toHaveAttribute(
      "src",
      `${CLOUDFRONT}l1.png`
    );
  });
});
