/* Tests del kit de diseño del admin (src/components/adminUi/index.jsx). */
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { renderWithRouter } from "../../testUtils/amplifyMocks";
import {
  TYPE,
  PageHeader,
  Card,
  Field,
  TextInput,
  TextArea,
  Toggle,
  CopyField,
  PrimaryButton,
  SecondaryButton,
  Chip,
  PageLoader,
  FullScreenLoader,
  SavedAgo,
} from "./index";

describe("TYPE (tokens tipográficos)", () => {
  test("expone los tokens estándar del admin", () => {
    expect(TYPE.metricValue).toContain("text-4xl");
    expect(TYPE.metricValue).toContain("font-bold");
    expect(TYPE.metricLabel).toContain("text-gray-500");
    expect(TYPE.th).toContain("uppercase");
    expect(TYPE.td).toContain("text-base");
  });
});

describe("PageHeader", () => {
  test("renderiza título h1 y subtítulo", () => {
    renderWithRouter(<PageHeader title="Eventos" subtitle="Todos tus eventos" />);
    const h1 = screen.getByRole("heading", { level: 1, name: "Eventos" });
    expect(h1).toHaveClass("text-3xl", "font-bold");
    expect(screen.getByText("Todos tus eventos")).toBeInTheDocument();
  });

  test("no renderiza subtítulo cuando no se pasa", () => {
    renderWithRouter(<PageHeader title="Eventos" />);
    expect(screen.queryByText("Todos tus eventos")).not.toBeInTheDocument();
  });

  test("con un solo crumb NO renderiza breadcrumb (duplicaría el título)", () => {
    renderWithRouter(
      <PageHeader crumbs={[{ label: "Dashboard" }]} title="Dashboard" />
    );
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  test("con jerarquía renderiza breadcrumb: link para crumbs con `to` y span para el actual", () => {
    renderWithRouter(
      <PageHeader
        crumbs={[
          { label: "Eventos", to: "/admin/eventos" },
          { label: "Mi evento" },
        ]}
        title="Mi evento"
      />
    );
    const nav = screen.getByRole("navigation");
    expect(nav).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "Eventos" });
    expect(link).toHaveAttribute("href", "/admin/eventos");
    // el crumb actual no es link
    expect(
      screen.queryByRole("link", { name: "Mi evento" })
    ).not.toBeInTheDocument();
    // separador entre crumbs
    expect(nav).toHaveTextContent("/");
  });

  test("renderiza las acciones del lado derecho", () => {
    renderWithRouter(
      <PageHeader title="Eventos" actions={<button>Nuevo evento</button>} />
    );
    expect(
      screen.getByRole("button", { name: "Nuevo evento" })
    ).toBeInTheDocument();
  });
});

describe("Card", () => {
  test("renderiza título, subtítulo, headerRight y children", () => {
    render(
      <Card
        title="Configuración"
        subtitle="Ajustes generales"
        headerRight={<span>derecha</span>}
      >
        <p>contenido</p>
      </Card>
    );
    expect(
      screen.getByRole("heading", { level: 3, name: "Configuración" })
    ).toBeInTheDocument();
    expect(screen.getByText("Ajustes generales")).toBeInTheDocument();
    expect(screen.getByText("derecha")).toBeInTheDocument();
    expect(screen.getByText("contenido")).toBeInTheDocument();
  });

  test("sin título ni headerRight no renderiza encabezado", () => {
    render(<Card>solo cuerpo</Card>);
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(screen.getByText("solo cuerpo")).toBeInTheDocument();
  });

  test("mezcla className propio y pasa props extra a la sección", () => {
    render(
      <Card data-testid="mi-card" className="mt-6">
        x
      </Card>
    );
    const card = screen.getByTestId("mi-card");
    expect(card).toHaveClass("rounded-2xl", "bg-white", "mt-6");
  });
});

describe("Field", () => {
  test("renderiza label y asterisco solo cuando es requerido", () => {
    const { rerender } = render(
      <Field label="Nombre" required>
        <input />
      </Field>
    );
    expect(screen.getByText("Nombre")).toBeInTheDocument();
    expect(screen.getByText("*")).toHaveClass("text-brand-500");

    rerender(
      <Field label="Nombre">
        <input />
      </Field>
    );
    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });

  test("counter dentro del límite usa gris y no resalta", () => {
    render(
      <Field label="Título" counter={{ value: 12, max: 80 }}>
        <input />
      </Field>
    );
    const counter = screen.getByText("12 / 80");
    expect(counter).toHaveClass("text-gray-400");
    expect(counter).not.toHaveClass("text-brand-500");
  });

  test("counter excedido resalta en brand y negrita", () => {
    render(
      <Field label="Título" counter={{ value: 95, max: 80 }}>
        <input />
      </Field>
    );
    const counter = screen.getByText("95 / 80");
    expect(counter).toHaveClass("text-brand-500", "font-semibold");
    expect(counter).not.toHaveClass("text-gray-400");
  });

  test("renderiza hint y children", () => {
    render(
      <Field label="Slug" hint="Solo minúsculas y guiones">
        <input placeholder="mi-evento" />
      </Field>
    );
    expect(screen.getByText("Solo minúsculas y guiones")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("mi-evento")).toBeInTheDocument();
  });
});

describe("TextInput", () => {
  test("propaga props nativas, dispara onChange y fija altura de 50px", () => {
    const onChange = jest.fn();
    render(
      <TextInput
        placeholder="Escribe aquí"
        defaultValue="hola"
        onChange={onChange}
        className="extra"
      />
    );
    const input = screen.getByPlaceholderText("Escribe aquí");
    expect(input).toHaveValue("hola");
    expect(input).toHaveClass("h-[50px]", "extra", "rounded-xl");
    fireEvent.change(input, { target: { value: "mundo" } });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(input).toHaveValue("mundo");
  });
});

describe("TextArea", () => {
  test("usa 3 filas por defecto y permite sobreescribirlas", () => {
    const { rerender } = render(<TextArea placeholder="Descripción" />);
    expect(screen.getByPlaceholderText("Descripción")).toHaveAttribute(
      "rows",
      "3"
    );
    rerender(<TextArea placeholder="Descripción" rows={6} />);
    expect(screen.getByPlaceholderText("Descripción")).toHaveAttribute(
      "rows",
      "6"
    );
  });

  test("propaga onChange y mezcla className", () => {
    const onChange = jest.fn();
    render(
      <TextArea placeholder="Notas" onChange={onChange} className="extra" />
    );
    const area = screen.getByPlaceholderText("Notas");
    expect(area).toHaveClass("leading-relaxed", "extra");
    fireEvent.change(area, { target: { value: "texto" } });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(area).toHaveValue("texto");
  });
});

describe("Toggle", () => {
  test("encendido: aria-checked true, fondo teal y perilla a la derecha", () => {
    render(<Toggle checked={true} onChange={() => {}} />);
    const sw = screen.getByRole("switch");
    expect(sw).toHaveAttribute("aria-checked", "true");
    expect(sw).toHaveClass("bg-teal-600");
    expect(sw.querySelector("span")).toHaveClass("left-6");
  });

  test("apagado: aria-checked false, fondo gris y perilla a la izquierda", () => {
    render(<Toggle checked={false} onChange={() => {}} />);
    const sw = screen.getByRole("switch");
    expect(sw).toHaveAttribute("aria-checked", "false");
    expect(sw).toHaveClass("bg-gray-300");
    expect(sw.querySelector("span")).toHaveClass("left-1");
  });

  test("al hacer click invierte el valor: onChange recibe el opuesto", () => {
    const onChange = jest.fn();
    const { rerender } = render(<Toggle checked={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(true);

    rerender(<Toggle checked={true} onChange={onChange} />);
    fireEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenLastCalledWith(false);
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  test("deshabilitado: no dispara onChange al hacer click", () => {
    const onChange = jest.fn();
    render(<Toggle checked={false} onChange={onChange} disabled />);
    const sw = screen.getByRole("switch");
    expect(sw).toBeDisabled();
    fireEvent.click(sw);
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("CopyField", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
    delete navigator.clipboard;
  });

  test("muestra el valor, copia al portapapeles y vuelve a 'Copiar' tras 1.5s", () => {
    const writeText = jest.fn();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    render(<CopyField value="https://eventflow.ec/mi-evento" />);
    expect(
      screen.getByText("https://eventflow.ec/mi-evento")
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /copiar/i }));
    expect(writeText).toHaveBeenCalledWith("https://eventflow.ec/mi-evento");
    expect(screen.getByRole("button")).toHaveTextContent("Copiado");

    act(() => {
      jest.advanceTimersByTime(1500);
    });
    expect(screen.getByRole("button")).toHaveTextContent("Copiar");
  });

  test("sin navigator.clipboard no revienta y aun así marca 'Copiado'", () => {
    delete navigator.clipboard;
    render(<CopyField value="abc-123" />);
    fireEvent.click(screen.getByRole("button", { name: /copiar/i }));
    expect(screen.getByRole("button")).toHaveTextContent("Copiado");
  });
});

describe("Botones", () => {
  test("PrimaryButton renderiza children, dispara onClick y lleva estilo brand", () => {
    const onClick = jest.fn();
    render(
      <PrimaryButton onClick={onClick} className="w-full">
        Guardar
      </PrimaryButton>
    );
    const btn = screen.getByRole("button", { name: "Guardar" });
    expect(btn).toHaveClass("bg-brand-500", "text-white", "w-full");
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test("PrimaryButton deshabilitado no dispara onClick", () => {
    const onClick = jest.fn();
    render(
      <PrimaryButton onClick={onClick} disabled>
        Guardar
      </PrimaryButton>
    );
    const btn = screen.getByRole("button", { name: "Guardar" });
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  test("SecondaryButton renderiza children, dispara onClick y mezcla className", () => {
    const onClick = jest.fn();
    render(
      <SecondaryButton onClick={onClick} className="extra">
        Cancelar
      </SecondaryButton>
    );
    const btn = screen.getByRole("button", { name: "Cancelar" });
    expect(btn).toHaveClass("border-gray-200", "bg-white", "extra");
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test("SecondaryButton respeta disabled", () => {
    const onClick = jest.fn();
    render(
      <SecondaryButton onClick={onClick} disabled>
        Cancelar
      </SecondaryButton>
    );
    const btn = screen.getByRole("button", { name: "Cancelar" });
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe("Chip", () => {
  test("usa la paleta del color indicado", () => {
    render(<Chip color="green">Publicado</Chip>);
    expect(screen.getByText("Publicado")).toHaveClass(
      "bg-teal-50",
      "text-teal-700"
    );
  });

  test("color por defecto y colores desconocidos caen en gris", () => {
    const { rerender } = render(<Chip>Borrador</Chip>);
    expect(screen.getByText("Borrador")).toHaveClass(
      "bg-gray-100",
      "text-gray-600"
    );
    rerender(<Chip color="morado">Borrador</Chip>);
    expect(screen.getByText("Borrador")).toHaveClass(
      "bg-gray-100",
      "text-gray-600"
    );
  });

  test("colores red y amber aplican sus clases", () => {
    const { rerender } = render(<Chip color="red">Error</Chip>);
    expect(screen.getByText("Error")).toHaveClass("bg-red-50", "text-red-600");
    rerender(<Chip color="amber">Pendiente</Chip>);
    expect(screen.getByText("Pendiente")).toHaveClass(
      "bg-amber-50",
      "text-amber-600"
    );
  });

  test("renderiza el punto por defecto y lo oculta con dot={false}", () => {
    const { rerender } = render(<Chip>Activo</Chip>);
    expect(
      screen.getByText("Activo").querySelector("span.rounded-full")
    ).toBeInTheDocument();
    rerender(<Chip dot={false}>Activo</Chip>);
    expect(
      screen.getByText("Activo").querySelector("span.rounded-full")
    ).not.toBeInTheDocument();
  });
});

describe("Loaders", () => {
  test("PageLoader muestra 'Cargando…' por defecto con el anillo dentro de la columna", () => {
    const { container } = render(<PageLoader />);
    expect(screen.getByText("Cargando…")).toBeInTheDocument();
    expect(container.querySelector("span.loader")).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("min-h-[70vh]");
  });

  test("PageLoader acepta label personalizado", () => {
    render(<PageLoader label="Cargando eventos…" />);
    expect(screen.getByText("Cargando eventos…")).toBeInTheDocument();
  });

  test("FullScreenLoader es overlay fijo y muestra el label", () => {
    const { container } = render(<FullScreenLoader label="Preparando todo…" />);
    expect(screen.getByText("Preparando todo…")).toBeInTheDocument();
    expect(container.querySelector("span.loader")).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("fixed", "inset-0", "z-50");
  });

  test("FullScreenLoader usa 'Cargando…' por defecto", () => {
    render(<FullScreenLoader />);
    expect(screen.getByText("Cargando…")).toBeInTheDocument();
  });
});

describe("SavedAgo", () => {
  const NOW = new Date("2026-07-16T12:00:00Z");

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  const agoDate = (secs) => new Date(NOW.getTime() - secs * 1000);

  test("sin savedAt no renderiza nada", () => {
    const { container } = render(<SavedAgo savedAt={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  test("menos de un minuto: 'hace un momento'", () => {
    render(<SavedAgo savedAt={agoDate(45)} />);
    expect(screen.getByText(/Guardado hace un momento/)).toBeInTheDocument();
  });

  test("minutos: 'hace 5 min'", () => {
    render(<SavedAgo savedAt={agoDate(5 * 60 + 10)} />);
    expect(screen.getByText(/Guardado hace 5 min/)).toBeInTheDocument();
  });

  test("horas: 'hace 3 h'", () => {
    render(<SavedAgo savedAt={agoDate(3 * 3600 + 120)} />);
    expect(screen.getByText(/Guardado hace 3 h/)).toBeInTheDocument();
  });

  test("días: 'hace 2 d'", () => {
    render(<SavedAgo savedAt={agoDate(2 * 86400 + 3600)} />);
    expect(screen.getByText(/Guardado hace 2 d/)).toBeInTheDocument();
  });

  test("el intervalo de 30s refresca el label sin cambiar props", () => {
    render(<SavedAgo savedAt={agoDate(45)} />);
    expect(screen.getByText(/hace un momento/)).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(30000); // ahora han pasado 75s
    });
    expect(screen.getByText(/Guardado hace 1 min/)).toBeInTheDocument();
    expect(screen.queryByText(/hace un momento/)).not.toBeInTheDocument();
  });

  test("al desmontar limpia el intervalo (no quedan timers colgados)", () => {
    const { unmount } = render(<SavedAgo savedAt={agoDate(10)} />);
    unmount();
    expect(jest.getTimerCount()).toBe(0);
  });
});
