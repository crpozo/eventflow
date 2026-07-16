// Tests de withCertFields: la inyección automática de los campos de
// certificado en el formulario de registro (cert_nombre + cert_enviar).
// Cobertura para SonarQube vía `npm run test:coverage` (lcov).
import {
  withCertFields,
  CERT_NAME_MAXLEN,
} from "./certFields";

const par = (label) => ({ type: "paragraph", label });
const header = (label) => ({ type: "header", label });
const sel = (name, label, values) => ({ name, label, type: "select", values });
const txt = (name, label) => ({ name, label, type: "text" });
const YN = [
  { label: "Si", value: "Siquiero" },
  { label: "No", value: "Noquiero" },
];
const base = [txt("email", "Email"), txt("nombres", "Nombre y apellido")];
const names = (qs) => (Array.isArray(qs) ? qs.map((q) => q.name || q.type) : []);

describe("withCertFields — inyección automática", () => {
  it("inyecta cert_enviar y cert_nombre cuando el evento tiene certificados", () => {
    const out = withCertFields([...base], true);
    expect(names(out)).toEqual(
      expect.arrayContaining(["cert_enviar", "cert_nombre"])
    );
    // al final, después de las preguntas del admin
    expect(names(out).slice(0, base.length)).toEqual(names(base));
  });

  it("no inyecta nada si el evento no tiene certificados activados", () => {
    const qs = [...base];
    expect(withCertFields(qs, false)).toBe(qs);
  });

  it("no inyecta sobre un formulario vacío o inválido", () => {
    expect(withCertFields([], true)).toEqual([]);
    expect(withCertFields(null, true)).toBeNull();
    expect(withCertFields(undefined, true)).toBeUndefined();
  });

  it("cert_enviar usa values legibles Sí/No con Sí preseleccionado", () => {
    const ce = withCertFields([...base], true).find(
      (q) => q.name === "cert_enviar"
    );
    expect(ce.values).toEqual([
      { label: "Sí", value: "Si", selected: true },
      { label: "No", value: "No", selected: false },
    ]);
  });

  it("cert_nombre lleva maxlength y no es requerido", () => {
    const cn = withCertFields([...base], true).find(
      (q) => q.name === "cert_nombre"
    );
    expect(cn.maxlength).toBe(CERT_NAME_MAXLEN);
    expect(cn.required).toBe(false);
  });
});

describe("withCertFields — guardas anti-duplicado por FORMA del campo", () => {
  it("un paragraph decorativo que menciona 'certificado' NO suprime la inyección", () => {
    const qs = [
      par("Al finalizar recibirás tu certificado de participación"),
      ...base,
    ];
    const out = names(withCertFields(qs, true));
    expect(out).toEqual(expect.arrayContaining(["cert_enviar", "cert_nombre"]));
  });

  it("un header que menciona 'certificados' NO suprime la inyección", () => {
    const qs = [header("Certificados del evento"), ...base];
    expect(names(withCertFields(qs, true))).toEqual(
      expect.arrayContaining(["cert_enviar", "cert_nombre"])
    );
  });

  it("un campo de texto ajeno ('certificado de votación') NO suprime la inyección", () => {
    const qs = [txt("votacion", "Número de certificado de votación"), ...base];
    expect(names(withCertFields(qs, true))).toEqual(
      expect.arrayContaining(["cert_enviar", "cert_nombre"])
    );
  });

  it("una pregunta manual (select) suprime cert_enviar pero no cert_nombre", () => {
    const qs = [
      ...base,
      sel("certificado", "Desea recibir certificado de participación", YN),
    ];
    const out = names(withCertFields(qs, true));
    expect(out).not.toContain("cert_enviar");
    expect(out).toContain("cert_nombre");
  });

  it("un select 'certificado + nombre' cuenta como PREGUNTA (suprime ask, inyecta name)", () => {
    const qs = [
      ...base,
      sel("q", "¿Desea recibir el certificado con su nombre?", YN),
    ];
    const out = names(withCertFields(qs, true));
    expect(out).not.toContain("cert_enviar");
    expect(out).toContain("cert_nombre");
  });

  it("un campo de texto 'Nombre para el certificado' manual suprime cert_nombre", () => {
    const qs = [...base, txt("minombre", "Nombre para el certificado")];
    const out = names(withCertFields(qs, true));
    expect(out).toContain("cert_enviar");
    expect(out).not.toContain("cert_nombre");
  });
});

describe("withCertFields — tolerancia AWSJSON", () => {
  it("acepta questions como string JSON", () => {
    const out = withCertFields(JSON.stringify(base), true);
    expect(Array.isArray(out)).toBe(true);
    expect(names(out)).toEqual(
      expect.arrayContaining(["cert_enviar", "cert_nombre"])
    );
  });

  it("acepta elementos que son strings JSON (detección sin romper)", () => {
    const qs = base.map((q) => JSON.stringify(q));
    const out = withCertFields(qs, true);
    expect(names(out)).toEqual(
      expect.arrayContaining(["cert_enviar", "cert_nombre"])
    );
  });

  it("devuelve intacto un string que no es JSON", () => {
    expect(withCertFields("no-es-json", true)).toBe("no-es-json");
  });

  it("no muta el array original", () => {
    const qs = [...base];
    const copia = JSON.parse(JSON.stringify(qs));
    withCertFields(qs, true);
    expect(qs).toEqual(copia);
  });
});
