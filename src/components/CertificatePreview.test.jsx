/* Tests de CertificatePreview: render de la plantilla (imagen y PDF),
 * posicionamiento proporcional del nombre y drag con reporte en porcentajes. */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CertificatePreview from "./CertificatePreview";

jest.mock("pdfjs-dist", () => ({
  GlobalWorkerOptions: {},
  getDocument: jest.fn(),
}));
import { getDocument } from "pdfjs-dist";

const CLOUDFRONT = "https://dnuc5lxyun5b.cloudfront.net/public/";
const ANCHO_RENDER = 500; // clientWidth simulado del contenedor

beforeAll(() => {
  // jsdom no trae ResizeObserver ni layout real: los simulamos.
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Object.defineProperty(HTMLElement.prototype, "clientWidth", {
    configurable: true,
    get: () => ANCHO_RENDER,
  });
});

afterAll(() => {
  delete global.ResizeObserver;
  delete HTMLElement.prototype.clientWidth;
});

afterEach(() => {
  jest.clearAllMocks();
});

// El div arrastrable es el padre directo de la imagen de la plantilla.
const getWrap = () =>
  screen.getByAltText("Plantilla del certificado").parentElement;

const mockRect = (el, rect) => {
  el.getBoundingClientRect = jest.fn(() => ({
    left: 0,
    top: 0,
    right: rect.width,
    bottom: rect.height,
    x: 0,
    y: 0,
    ...rect,
  }));
};

describe("CertificatePreview con plantilla de imagen", () => {
  test("no renderiza nada sin certificate", () => {
    const { container } = render(<CertificatePreview certificate={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  test("resuelve la key por CloudFront y muestra el nombre de ejemplo", () => {
    render(<CertificatePreview certificate="certs/plantilla.png" />);
    expect(screen.getByAltText("Plantilla del certificado")).toHaveAttribute(
      "src",
      `${CLOUDFRONT}certs/plantilla.png`
    );
    expect(screen.getByText("Nombre del Participante")).toBeInTheDocument();
    expect(screen.getByText("Vista previa")).toBeInTheDocument();
    // Sin PDF no hay estados de carga/error de PDF.
    expect(
      screen.queryByText(/Cargando vista previa del PDF/)
    ).not.toBeInTheDocument();
  });

  test("respeta URLs absolutas sin anteponer CloudFront", () => {
    render(
      <CertificatePreview certificate="https://ejemplo.com/tpl.png" />
    );
    expect(screen.getByAltText("Plantilla del certificado")).toHaveAttribute(
      "src",
      "https://ejemplo.com/tpl.png"
    );
  });

  test("posiciona el nombre con left/top en % y fontSize proporcional al ancho", () => {
    render(
      <CertificatePreview
        certificate="tpl.png"
        xPct={30}
        yPct={70}
        fontPct={10}
        color="#ff0000"
        sampleName="Juana Pérez"
      />
    );
    const nombre = screen.getByText("Juana Pérez");
    // 10% de un ancho renderizado de 500px => 50px.
    expect(nombre).toHaveStyle({
      left: "30%",
      top: "70%",
      fontSize: `${(ANCHO_RENDER * 10) / 100}px`,
      color: "#ff0000",
    });
  });

  test("valores no numéricos de xPct/yPct caen al centro (50%) y fontPct 0 usa 6", () => {
    render(
      <CertificatePreview certificate="tpl.png" xPct="abc" yPct={undefined} fontPct={0} />
    );
    const nombre = screen.getByText("Nombre del Participante");
    expect(nombre).toHaveStyle({
      left: "50%",
      top: "50%",
      fontSize: `${(ANCHO_RENDER * 6) / 100}px`,
    });
  });

  test("sin onPositionChange no hay hint de arrastre y el mousedown no reporta", () => {
    render(<CertificatePreview certificate="tpl.png" />);
    expect(
      screen.queryByText(/arrastra el nombre para posicionarlo/)
    ).not.toBeInTheDocument();
    const wrap = getWrap();
    expect(wrap).toHaveStyle({ cursor: "default" });
    // No debe explotar aunque no haya callback.
    fireEvent.mouseDown(wrap, { clientX: 10, clientY: 10 });
  });
});

describe("CertificatePreview: drag para posicionar el nombre", () => {
  test("mousedown reporta el % del punto clickeado y muestra el hint", () => {
    const onPositionChange = jest.fn();
    render(
      <CertificatePreview
        certificate="tpl.png"
        onPositionChange={onPositionChange}
      />
    );
    expect(
      screen.getByText(/arrastra el nombre para posicionarlo/)
    ).toBeInTheDocument();
    const wrap = getWrap();
    expect(wrap).toHaveStyle({ cursor: "crosshair" });
    mockRect(wrap, { width: 200, height: 100 });

    fireEvent.mouseDown(wrap, { clientX: 50, clientY: 25 });
    expect(onPositionChange).toHaveBeenCalledTimes(1);
    expect(onPositionChange).toHaveBeenLastCalledWith(25, 25);
  });

  test("mousemove durante el drag actualiza y mouseup dispara onPositionCommit una vez", () => {
    const onPositionChange = jest.fn();
    const onPositionCommit = jest.fn();
    render(
      <CertificatePreview
        certificate="tpl.png"
        onPositionChange={onPositionChange}
        onPositionCommit={onPositionCommit}
      />
    );
    const wrap = getWrap();
    mockRect(wrap, { width: 200, height: 100 });

    fireEvent.mouseDown(wrap, { clientX: 50, clientY: 25 });
    fireEvent.mouseMove(window, { clientX: 150, clientY: 75 });
    expect(onPositionChange).toHaveBeenLastCalledWith(75, 75);
    expect(onPositionCommit).not.toHaveBeenCalled();

    fireEvent.mouseUp(window);
    expect(onPositionCommit).toHaveBeenCalledTimes(1);

    // Tras soltar, mover el mouse ya no reporta ni re-commitea.
    fireEvent.mouseMove(window, { clientX: 100, clientY: 50 });
    fireEvent.mouseUp(window);
    expect(onPositionChange).toHaveBeenCalledTimes(2);
    expect(onPositionCommit).toHaveBeenCalledTimes(1);
  });

  test("clampa a [0,100] cuando el drag sale del área", () => {
    const onPositionChange = jest.fn();
    render(
      <CertificatePreview
        certificate="tpl.png"
        onPositionChange={onPositionChange}
      />
    );
    const wrap = getWrap();
    mockRect(wrap, { width: 200, height: 100 });

    fireEvent.mouseDown(wrap, { clientX: 50, clientY: 25 });
    fireEvent.mouseMove(window, { clientX: -40, clientY: 500 });
    expect(onPositionChange).toHaveBeenLastCalledWith(0, 100);
  });

  test("redondea a un decimal", () => {
    const onPositionChange = jest.fn();
    render(
      <CertificatePreview
        certificate="tpl.png"
        onPositionChange={onPositionChange}
      />
    );
    const wrap = getWrap();
    mockRect(wrap, { width: 300, height: 300 });

    // 100/300 => 33.333...% en ambos ejes → 33.3
    fireEvent.mouseDown(wrap, { clientX: 100, clientY: 100 });
    expect(onPositionChange).toHaveBeenLastCalledWith(33.3, 33.3);
  });

  test("mousemove sin mousedown previo no reporta nada", () => {
    const onPositionChange = jest.fn();
    const onPositionCommit = jest.fn();
    render(
      <CertificatePreview
        certificate="tpl.png"
        onPositionChange={onPositionChange}
        onPositionCommit={onPositionCommit}
      />
    );
    fireEvent.mouseMove(window, { clientX: 10, clientY: 10 });
    fireEvent.mouseUp(window);
    expect(onPositionChange).not.toHaveBeenCalled();
    expect(onPositionCommit).not.toHaveBeenCalled();
  });

  test("soporta touch: touchstart/touchmove reportan y touchend commitea", () => {
    const onPositionChange = jest.fn();
    const onPositionCommit = jest.fn();
    render(
      <CertificatePreview
        certificate="tpl.png"
        onPositionChange={onPositionChange}
        onPositionCommit={onPositionCommit}
      />
    );
    const wrap = getWrap();
    mockRect(wrap, { width: 200, height: 100 });

    fireEvent.touchStart(wrap, { touches: [{ clientX: 50, clientY: 25 }] });
    expect(onPositionChange).toHaveBeenLastCalledWith(25, 25);

    fireEvent.touchMove(window, { touches: [{ clientX: 100, clientY: 50 }] });
    expect(onPositionChange).toHaveBeenLastCalledWith(50, 50);

    fireEvent.touchEnd(window);
    expect(onPositionCommit).toHaveBeenCalledTimes(1);
  });
});

describe("CertificatePreview con plantilla PDF", () => {
  test("muestra el estado de carga y luego el error si pdf.js falla", async () => {
    const spyError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    getDocument.mockReturnValue({
      promise: Promise.reject(new Error("pdf roto")),
    });

    render(<CertificatePreview certificate="certs/diploma.pdf" />);
    expect(
      screen.getByText(/Cargando vista previa del PDF/)
    ).toBeInTheDocument();

    expect(
      await screen.findByText(/No se pudo cargar la vista previa del PDF/)
    ).toBeInTheDocument();
    // Sin render del PDF no hay imagen ni overlay del nombre.
    expect(
      screen.queryByAltText("Plantilla del certificado")
    ).not.toBeInTheDocument();
    expect(getDocument).toHaveBeenCalledWith(`${CLOUDFRONT}certs/diploma.pdf`);
    expect(spyError).toHaveBeenCalled();
    spyError.mockRestore();
  });

  test("renderiza la primera página del PDF como imagen (data URL)", async () => {
    const dataUrl = "data:image/png;base64,PAGINA1";
    const spyCtx = jest
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue({});
    const spyData = jest
      .spyOn(HTMLCanvasElement.prototype, "toDataURL")
      .mockReturnValue(dataUrl);

    const page = {
      getViewport: jest.fn(() => ({ width: 800, height: 600 })),
      render: jest.fn(() => ({ promise: Promise.resolve() })),
    };
    const pdf = { getPage: jest.fn(async () => page) };
    getDocument.mockReturnValue({ promise: Promise.resolve(pdf) });

    render(<CertificatePreview certificate="diploma.pdf" xPct={20} yPct={80} />);

    await waitFor(() =>
      expect(screen.getByAltText("Plantilla del certificado")).toHaveAttribute(
        "src",
        dataUrl
      )
    );
    expect(pdf.getPage).toHaveBeenCalledWith(1);
    expect(page.getViewport).toHaveBeenCalledWith({ scale: 2 });
    expect(page.render).toHaveBeenCalledTimes(1);
    // El overlay del nombre también aplica sobre el PDF renderizado.
    expect(screen.getByText("Nombre del Participante")).toHaveStyle({
      left: "20%",
      top: "80%",
    });
    expect(
      screen.queryByText(/Cargando vista previa del PDF/)
    ).not.toBeInTheDocument();

    spyCtx.mockRestore();
    spyData.mockRestore();
  });
});
