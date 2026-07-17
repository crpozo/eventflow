/**
 * @jest-environment node
 *
 * Entorno node (no jsdom): el SDK del Lambda (@smithy/core cbor) necesita
 * TextDecoder global, ausente en jsdom de CRA; estos helpers no tocan DOM.
 */
// Tests de los helpers puros del Lambda userManager (via exports._test):
// genTempPassword (política Cognito, sin caracteres ambiguos) y los builders
// de correo SES buildInviteEmail / buildReminderEmail. Importa el módulo REAL
// del Lambda — sus node_modules viven junto a él y requerirlo no toca red
// (los clients AWS solo se instancian). Se fijan SES_FROM y LOGIN_URL ANTES
// del require porque el módulo los lee al cargarse.
process.env.SES_FROM = "no-reply@eventflow.ec";
process.env.LOGIN_URL = "https://login.pruebas.eventflow.ec";

const {
  genTempPassword,
  buildInviteEmail,
  buildReminderEmail,
} = require("../../amplify/backend/function/userManager/src/index.js")._test;

const LOGIN_URL = process.env.LOGIN_URL;

// Alfabetos EXACTOS del módulo (sin ambiguos: l, o, I, O, 0, 1).
const LOWER = "abcdefghijkmnpqrstuvwxyz";
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const DIGIT = "23456789";
const SYM = "!@#$%*?-";
const ALLOWED = new Set((LOWER + UPPER + DIGIT + SYM).split(""));

describe("genTempPassword — política Cognito", () => {
  it("200 iteraciones: longitud 12 y al menos una minúscula, mayúscula, dígito y símbolo", () => {
    for (let i = 0; i < 200; i++) {
      const pw = genTempPassword();
      expect(typeof pw).toBe("string");
      expect(pw).toHaveLength(12);
      const chars = pw.split("");
      expect(chars.some((c) => LOWER.includes(c))).toBe(true);
      expect(chars.some((c) => UPPER.includes(c))).toBe(true);
      expect(chars.some((c) => DIGIT.includes(c))).toBe(true);
      expect(chars.some((c) => SYM.includes(c))).toBe(true);
    }
  });

  it("200 iteraciones: solo usa los alfabetos permitidos (sin ambiguos l/o/I/O/0/1)", () => {
    for (let i = 0; i < 200; i++) {
      const pw = genTempPassword();
      for (const c of pw) {
        expect(ALLOWED.has(c)).toBe(true);
      }
      // Explícito: nunca aparecen los caracteres ambiguos excluidos.
      expect(pw).not.toMatch(/[loIO01]/);
    }
  });

  it("dos llamadas consecutivas producen contraseñas distintas (probabilístico)", () => {
    // 62^12 combinaciones: una colisión en 20 pares delataría un RNG roto.
    for (let i = 0; i < 20; i++) {
      expect(genTempPassword()).not.toBe(genTempPassword());
    }
  });

  it("no deja los 4 obligatorios siempre al inicio (el shuffle actúa)", () => {
    // Sin shuffle, el primer char sería SIEMPRE minúscula. En 100 corridas
    // la probabilidad de que eso pase por azar es (~1/2)^100 ≈ 0.
    const firsts = Array.from({ length: 100 }, () => genTempPassword()[0]);
    expect(firsts.some((c) => !LOWER.includes(c))).toBe(true);
  });
});

describe("buildInviteEmail — invitación con contraseña temporal", () => {
  const email = "ana.perez@usfq.edu.ec";
  const name = "Ana Pérez";
  const tempPassword = "Ab2!efghijkm";
  let cmd, input, html, text, subject;

  beforeAll(() => {
    cmd = buildInviteEmail(email, name, tempPassword);
    input = cmd.input;
    html = input.Message.Body.Html.Data;
    text = input.Message.Body.Text.Data;
    subject = input.Message.Subject.Data;
  });

  it("devuelve un SendEmailCommand con Source y destinatario correctos", () => {
    expect(cmd.constructor.name).toBe("SendEmailCommand");
    expect(input.Source).toBe("no-reply@eventflow.ec");
    expect(input.Destination.ToAddresses).toEqual([email]);
  });

  it("subject correcto y charset UTF-8 en subject y cuerpos", () => {
    expect(subject).toBe("Acceso a Eventflow USFQ");
    expect(input.Message.Subject.Charset).toBe("UTF-8");
    expect(input.Message.Body.Html.Charset).toBe("UTF-8");
    expect(input.Message.Body.Text.Charset).toBe("UTF-8");
  });

  it("el HTML saluda por nombre e incluye usuario, contraseña temporal y URL de login", () => {
    expect(html).toContain(`Hola ${name},`);
    expect(html).toContain(`<strong>Usuario:</strong> ${email}`);
    expect(html).toContain(`<strong>Contraseña temporal:</strong> ${tempPassword}`);
    expect(html).toContain(`<a href="${LOGIN_URL}">${LOGIN_URL}</a>`);
  });

  it("el texto plano incluye nombre, usuario, contraseña temporal y URL de login", () => {
    expect(text).toContain(`Hola ${name},`);
    expect(text).toContain(`Usuario: ${email}`);
    expect(text).toContain(`Contraseña temporal: ${tempPassword}`);
    expect(text).toContain(LOGIN_URL);
  });

  it("sin placeholders rotos en subject/html/text", () => {
    for (const s of [subject, html, text]) {
      expect(s).not.toMatch(/undefined|null|\$\{|\{\{/);
    }
  });

  it("sin nombre saluda con 'Hola,' genérico y no filtra 'undefined'", () => {
    const c = buildInviteEmail(email, "", tempPassword);
    const h = c.input.Message.Body.Html.Data;
    const t = c.input.Message.Body.Text.Data;
    expect(h).toContain("<p>Hola,</p>");
    expect(t).toMatch(/^Hola,\n/);
    expect(h).not.toContain("Hola ,");
    expect(h).not.toMatch(/undefined/);
    expect(t).not.toMatch(/undefined/);
  });
});

describe("buildReminderEmail — recordatorio sin contraseña", () => {
  const email = "juan.lopez@usfq.edu.ec";
  const name = "Juan López";
  let cmd, input, html, text, subject;

  beforeAll(() => {
    cmd = buildReminderEmail(email, name);
    input = cmd.input;
    html = input.Message.Body.Html.Data;
    text = input.Message.Body.Text.Data;
    subject = input.Message.Subject.Data;
  });

  it("devuelve un SendEmailCommand con Source, destinatario y subject correctos", () => {
    expect(cmd.constructor.name).toBe("SendEmailCommand");
    expect(input.Source).toBe("no-reply@eventflow.ec");
    expect(input.Destination.ToAddresses).toEqual([email]);
    expect(subject).toBe("Acceso a Eventflow USFQ");
  });

  it("HTML y texto saludan por nombre e incluyen usuario y URL de login", () => {
    expect(html).toContain(`Hola ${name},`);
    expect(html).toContain(`<strong>Usuario:</strong> ${email}`);
    expect(html).toContain(`<a href="${LOGIN_URL}">${LOGIN_URL}</a>`);
    expect(text).toContain(`Hola ${name},`);
    expect(text).toContain(`Usuario: ${email}`);
    expect(text).toContain(LOGIN_URL);
  });

  it("NO incluye contraseña temporal y sí la ruta de recuperación", () => {
    expect(html).not.toContain("Contraseña temporal");
    expect(text).not.toContain("Contraseña temporal");
    expect(html).toContain("¿Olvidaste tu contraseña?");
    expect(text).toContain("¿Olvidaste tu contraseña?");
  });

  it("sin placeholders rotos en subject/html/text", () => {
    for (const s of [subject, html, text]) {
      expect(s).not.toMatch(/undefined|null|\$\{|\{\{/);
    }
  });

  it("sin nombre saluda con 'Hola,' genérico y no filtra 'undefined'", () => {
    const c = buildReminderEmail(email, undefined);
    const h = c.input.Message.Body.Html.Data;
    const t = c.input.Message.Body.Text.Data;
    expect(h).toContain("<p>Hola,</p>");
    expect(t).toMatch(/^Hola,\n/);
    expect(h).not.toMatch(/undefined/);
    expect(t).not.toMatch(/undefined/);
  });
});
