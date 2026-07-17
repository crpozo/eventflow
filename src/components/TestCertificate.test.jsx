/* Tests de TestCertificate: payload del POST a /certificate-test y los
 * estados de UI (validación, enviando, éxito y las variantes de error). */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TestCertificate from "./TestCertificate";

jest.mock("aws-amplify/api", () => ({ post: jest.fn() }));
import { post } from "aws-amplify/api";

// Respuesta 2xx del endpoint con el JSON dado.
const respuestaOk = (data) => ({
  response: Promise.resolve({ body: { json: async () => data } }),
});

const escribirCorreo = (valor) =>
  fireEvent.change(screen.getByPlaceholderText("correo@ejemplo.com"), {
    target: { value: valor },
  });

const botonEnviar = () =>
  screen.getByRole("button", { name: /test certificate|enviando/i });

afterEach(() => {
  jest.clearAllMocks();
});

describe("TestCertificate: envío exitoso", () => {
  test("postea a userApi /certificate-test con el payload del formulario", async () => {
    post.mockReturnValue(respuestaOk({ ok: true }));
    render(
      <TestCertificate
        eventId="ev-1"
        certificate="certs/tpl.png"
        certificatePosition='{"x":40,"y":60}'
      />
    );
    escribirCorreo("user@test.com");
    fireEvent.click(botonEnviar());

    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith({
      apiName: "userApi",
      path: "/certificate-test",
      options: {
        body: {
          eventId: "ev-1",
          email: "user@test.com",
          certificateKey: "certs/tpl.png",
          position: '{"x":40,"y":60}',
        },
      },
    });
    const msg = await screen.findByText(
      "Certificado de prueba enviado a user@test.com."
    );
    expect(msg).toHaveClass("text-green-600");
  });

  test("recorta espacios del correo y usa '' si faltan plantilla/posición", async () => {
    post.mockReturnValue(respuestaOk({ ok: true }));
    render(<TestCertificate eventId="ev-2" />);
    escribirCorreo("  a@b.com  ");
    fireEvent.click(botonEnviar());

    expect(post).toHaveBeenCalledWith(
      expect.objectContaining({
        options: {
          body: {
            eventId: "ev-2",
            email: "a@b.com",
            certificateKey: "",
            position: "",
          },
        },
      })
    );
    await screen.findByText("Certificado de prueba enviado a a@b.com.");
  });

  test("muestra 'Enviando…' deshabilitado mientras espera y vuelve al estado normal", async () => {
    let resolver;
    post.mockReturnValue({ response: new Promise((res) => (resolver = res)) });
    render(<TestCertificate eventId="ev-1" />);
    escribirCorreo("a@b.com");
    fireEvent.click(botonEnviar());

    expect(screen.getByRole("button", { name: "Enviando…" })).toBeDisabled();

    resolver({ body: { json: async () => ({ ok: true }) } });
    await screen.findByText("Certificado de prueba enviado a a@b.com.");
    expect(
      screen.getByRole("button", { name: "Test certificate" })
    ).toBeEnabled();
  });

  test("Enter dentro del input dispara el envío sin submitear el form padre", async () => {
    post.mockReturnValue(respuestaOk({ ok: true }));
    const onSubmit = jest.fn((e) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <TestCertificate eventId="ev-1" />
      </form>
    );
    escribirCorreo("a@b.com");
    fireEvent.keyDown(screen.getByPlaceholderText("correo@ejemplo.com"), {
      key: "Enter",
    });

    expect(post).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
    await screen.findByText("Certificado de prueba enviado a a@b.com.");
  });
});

describe("TestCertificate: validación y errores", () => {
  test("sin correo no postea y pide ingresarlo", () => {
    render(<TestCertificate eventId="ev-1" />);
    escribirCorreo("   ");
    fireEvent.click(botonEnviar());

    expect(post).not.toHaveBeenCalled();
    expect(screen.getByText("Ingresa un correo.")).toHaveClass("text-red-600");
  });

  test("respuesta 2xx con ok=false muestra el error del servidor", async () => {
    post.mockReturnValue(
      respuestaOk({ ok: false, error: "Plantilla inválida" })
    );
    render(<TestCertificate eventId="ev-1" />);
    escribirCorreo("a@b.com");
    fireEvent.click(botonEnviar());

    expect(await screen.findByText("Plantilla inválida")).toHaveClass(
      "text-red-600"
    );
  });

  test("respuesta 2xx con ok=false sin error usa el mensaje genérico", async () => {
    post.mockReturnValue(respuestaOk({ ok: false }));
    render(<TestCertificate eventId="ev-1" />);
    escribirCorreo("a@b.com");
    fireEvent.click(botonEnviar());

    expect(await screen.findByText("No se pudo enviar.")).toBeInTheDocument();
  });

  test("rechazo con body.json() extrae el error y antepone el status", async () => {
    post.mockReturnValue({
      response: Promise.reject({
        response: {
          statusCode: 500,
          body: { json: async () => ({ error: "Falla interna" }) },
        },
      }),
    });
    render(<TestCertificate eventId="ev-1" />);
    escribirCorreo("a@b.com");
    fireEvent.click(botonEnviar());

    expect(await screen.findByText("(500) Falla interna")).toHaveClass(
      "text-red-600"
    );
  });

  test("rechazo con body.json() sin error usa message", async () => {
    post.mockReturnValue({
      response: Promise.reject({
        response: {
          statusCode: 502,
          body: { json: async () => ({ message: "Gateway caído" }) },
        },
      }),
    });
    render(<TestCertificate eventId="ev-1" />);
    escribirCorreo("a@b.com");
    fireEvent.click(botonEnviar());

    expect(await screen.findByText("(502) Gateway caído")).toBeInTheDocument();
  });

  test("rechazo con body.text() parsea el JSON del texto", async () => {
    post.mockReturnValue({
      response: Promise.reject({
        response: {
          statusCode: 400,
          body: { text: async () => '{"error":"Correo inválido"}' },
        },
      }),
    });
    render(<TestCertificate eventId="ev-1" />);
    escribirCorreo("a@b.com");
    fireEvent.click(botonEnviar());

    expect(
      await screen.findByText("(400) Correo inválido")
    ).toBeInTheDocument();
  });

  test("rechazo con body.text() no-JSON muestra el texto tal cual", async () => {
    post.mockReturnValue({
      response: Promise.reject({
        response: {
          statusCode: 400,
          body: { text: async () => "puro texto" },
        },
      }),
    });
    render(<TestCertificate eventId="ev-1" />);
    escribirCorreo("a@b.com");
    fireEvent.click(botonEnviar());

    expect(await screen.findByText("(400) puro texto")).toBeInTheDocument();
  });

  test("rechazo con body string JSON extrae el error (sin status no hay prefijo)", async () => {
    post.mockReturnValue({
      response: Promise.reject({
        response: { body: '{"error":"Cadena con error"}' },
      }),
    });
    render(<TestCertificate eventId="ev-1" />);
    escribirCorreo("a@b.com");
    fireEvent.click(botonEnviar());

    expect(await screen.findByText("Cadena con error")).toBeInTheDocument();
  });

  test("rechazo con body string no-JSON muestra la cadena", async () => {
    post.mockReturnValue({
      response: Promise.reject({
        response: { statusCode: 403, body: "Prohibido" },
      }),
    });
    render(<TestCertificate eventId="ev-1" />);
    escribirCorreo("a@b.com");
    fireEvent.click(botonEnviar());

    expect(await screen.findByText("(403) Prohibido")).toBeInTheDocument();
  });

  test("si body.json() explota cae al message del error", async () => {
    post.mockReturnValue({
      response: Promise.reject({
        message: "Fallback del err",
        response: {
          body: {
            json: async () => {
              throw new Error("json roto");
            },
          },
        },
      }),
    });
    render(<TestCertificate eventId="ev-1" />);
    escribirCorreo("a@b.com");
    fireEvent.click(botonEnviar());

    expect(await screen.findByText("Fallback del err")).toBeInTheDocument();
  });

  test("rechazo sin response usa err.message y sin message el genérico", async () => {
    post.mockReturnValueOnce({
      response: Promise.reject(new Error("Network down")),
    });
    render(<TestCertificate eventId="ev-1" />);
    escribirCorreo("a@b.com");
    fireEvent.click(botonEnviar());
    expect(await screen.findByText("Network down")).toBeInTheDocument();

    post.mockReturnValueOnce({ response: Promise.reject({}) });
    fireEvent.click(botonEnviar());
    expect(await screen.findByText("Error al enviar.")).toBeInTheDocument();
    // El botón queda habilitado de nuevo tras el error (finally).
    expect(
      screen.getByRole("button", { name: "Test certificate" })
    ).toBeEnabled();
  });
});
