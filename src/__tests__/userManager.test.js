/**
 * @jest-environment node
 *
 * Entorno node (no jsdom): el SDK del Lambda (@smithy/core cbor) necesita
 * TextDecoder global, ausente en jsdom de CRA; estos helpers no tocan DOM.
 */
// Tests del Lambda userManager: helpers puros (via exports._test) y el HANDLER
// completo (POST crear/resend, DELETE, dispatch y errores). Los paquetes
// @aws-sdk/* se mockean por RUTA ABSOLUTA resuelta desde el node_modules DEL
// LAMBDA (tiene copias propias — jest mockea por módulo RESUELTO, así el
// require interno del lambda cae en los fakes sin tocar red). Se fijan
// SES_FROM / LOGIN_URL / USER_POOL_ID ANTES del require porque el módulo los
// lee al cargarse. CRA usa resetMocks:true — implementaciones en beforeEach.
process.env.SES_FROM = "no-reply@eventflow.ec";
process.env.LOGIN_URL = "https://login.pruebas.eventflow.ec";
process.env.USER_POOL_ID = "us-east-1_TestPool";

const path = require("path");
const LAMBDA_DIR = path.resolve(
  __dirname,
  "../../amplify/backend/function/userManager/src"
);
const LAMBDA = path.join(LAMBDA_DIR, "index.js");
const fromLambda = (id) => require.resolve(id, { paths: [LAMBDA_DIR] });

// jest.fn compartidos: los factories crean clases fake cuyo send delega aquí.
const cognitoSend = jest.fn();
const sesSend = jest.fn();

// Clase fake CON NOMBRE real (los tests de los builders comprueban
// constructor.name === "SendEmailCommand"): guarda el input y marca el tipo.
const cmdClass = (type) =>
  ({
    [type]: class {
      constructor(input) {
        this.input = input;
        this.__type = type;
      }
    },
  }[type]);

jest.doMock(fromLambda("@aws-sdk/client-cognito-identity-provider"), () => ({
  CognitoIdentityProviderClient: class {
    send(cmd) {
      return cognitoSend(cmd);
    }
  },
  AdminCreateUserCommand: cmdClass("AdminCreateUserCommand"),
  AdminDeleteUserCommand: cmdClass("AdminDeleteUserCommand"),
  AdminGetUserCommand: cmdClass("AdminGetUserCommand"),
  AdminSetUserPasswordCommand: cmdClass("AdminSetUserPasswordCommand"),
}));
jest.doMock(fromLambda("@aws-sdk/client-ses"), () => ({
  SESClient: class {
    send(cmd) {
      return sesSend(cmd);
    }
  },
  SendEmailCommand: cmdClass("SendEmailCommand"),
}));

// eslint-disable-next-line import/no-dynamic-require
const lambdaModule = require(LAMBDA);
const { handler } = lambdaModule;
const { genTempPassword, buildInviteEmail, buildReminderEmail } =
  lambdaModule._test;

// resetMocks:true limpia implementaciones antes de CADA test — reinstalar.
beforeEach(() => {
  cognitoSend.mockImplementation(async () => ({}));
  sesSend.mockImplementation(async () => ({}));
});

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

/* ═══════════════ exports.handler — REST de Permisos ═══════════════ */

const post = (body) => ({ httpMethod: "POST", body: JSON.stringify(body) });
const bodyOf = (res) => JSON.parse(res.body);
const err = (name) => Object.assign(new Error(name), { name });

// Enruta cognito.send por tipo de comando: valor fijo o función.
const cognitoRoute = (routes) => {
  cognitoSend.mockImplementation(async (cmd) => {
    const r = routes[cmd.__type];
    if (r === undefined) throw new Error(`cognito inesperado: ${cmd.__type}`);
    return typeof r === "function" ? r(cmd) : r;
  });
};

// La política Cognito que debe cumplir toda contraseña temporal emitida.
const expectPolicy = (pw) => {
  expect(pw).toHaveLength(12);
  const chars = pw.split("");
  expect(chars.some((c) => LOWER.includes(c))).toBe(true);
  expect(chars.some((c) => UPPER.includes(c))).toBe(true);
  expect(chars.some((c) => DIGIT.includes(c))).toBe(true);
  expect(chars.some((c) => SYM.includes(c))).toBe(true);
};

describe("handler — dispatch y configuración", () => {
  it("OPTIONS responde 200 con CORS completo", async () => {
    const res = await handler({ httpMethod: "OPTIONS" });
    expect(res.statusCode).toBe(200);
    expect(bodyOf(res)).toEqual({ ok: true });
    expect(res.headers).toMatchObject({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "OPTIONS,POST,DELETE",
    });
  });

  it("métodos no soportados → 405", async () => {
    const res = await handler({ httpMethod: "PATCH" });
    expect(res.statusCode).toBe(405);
    expect(bodyOf(res).error).toBe("Method PATCH not allowed");
  });

  it("body que no es JSON → 500 controlado (catch global)", async () => {
    const res = await handler({ httpMethod: "POST", body: "{roto" });
    expect(res.statusCode).toBe(500);
    expect(cognitoSend).not.toHaveBeenCalled();
  });

  it("sin USER_POOL_ID configurado → 500 explicando el grant de auth", async () => {
    const saved = {};
    for (const k of Object.keys(process.env)) {
      if (k === "USER_POOL_ID" || /USERPOOLID$/.test(k)) {
        saved[k] = process.env[k];
        delete process.env[k];
      }
    }
    let freshHandler;
    jest.isolateModules(() => {
      // eslint-disable-next-line import/no-dynamic-require, global-require
      freshHandler = require(LAMBDA).handler;
    });
    Object.assign(process.env, saved);
    const res = await freshHandler(post({ email: "x@y.z" }));
    expect(res.statusCode).toBe(500);
    expect(bodyOf(res).error).toContain("USER_POOL_ID not configured");
    expect(cognitoSend).not.toHaveBeenCalled();
  });
});

describe("handler POST — crear usuario (invitación)", () => {
  it("sin email → 400 sin tocar Cognito", async () => {
    const res = await handler(post({ name: "Ana" }));
    expect(res.statusCode).toBe(400);
    expect(bodyOf(res).error).toBe("email is required");
    expect(cognitoSend).not.toHaveBeenCalled();
  });

  it("crea en Cognito (SUPPRESS), invita por SES y NO filtra la contraseña", async () => {
    cognitoRoute({
      AdminCreateUserCommand: {
        User: { Attributes: [{ Name: "sub", Value: "sub-123" }] },
      },
    });
    const res = await handler(
      post({ email: "  Ana.Perez@USFQ.edu.ec ", name: "Ana Pérez" })
    );
    expect(res.statusCode).toBe(200);
    const b = bodyOf(res);
    expect(b).toEqual({
      ok: true,
      username: "ana.perez@usfq.edu.ec",
      sub: "sub-123",
      emailSent: true,
    });
    // alta en Cognito: email normalizado, verificado, SUPPRESS y política de pw
    const create = cognitoSend.mock.calls[0][0];
    expect(create.__type).toBe("AdminCreateUserCommand");
    expect(create.input).toMatchObject({
      UserPoolId: "us-east-1_TestPool",
      Username: "ana.perez@usfq.edu.ec",
      MessageAction: "SUPPRESS",
    });
    expect(create.input.UserAttributes).toEqual([
      { Name: "email", Value: "ana.perez@usfq.edu.ec" },
      { Name: "email_verified", Value: "true" },
      { Name: "name", Value: "Ana Pérez" },
    ]);
    expectPolicy(create.input.TemporaryPassword);
    // la invitación en español lleva ESA contraseña
    const mail = sesSend.mock.calls[0][0];
    expect(mail.__type).toBe("SendEmailCommand");
    expect(mail.input.Destination.ToAddresses).toEqual([
      "ana.perez@usfq.edu.ec",
    ]);
    expect(mail.input.Message.Body.Html.Data).toContain(
      create.input.TemporaryPassword
    );
  });

  it("si SES falla devuelve la contraseña temporal para compartirla manual", async () => {
    cognitoRoute({ AdminCreateUserCommand: { User: {} } });
    sesSend.mockImplementation(async () => {
      throw new Error("Email address is not verified");
    });
    const res = await handler(post({ email: "x@y.z" }));
    expect(res.statusCode).toBe(200);
    const b = bodyOf(res);
    expect(b.emailSent).toBe(false);
    expect(b.emailError).toBe("Email address is not verified");
    expectPolicy(b.tempPassword);
    expect(b.tempPassword).toBe(
      cognitoSend.mock.calls[0][0].input.TemporaryPassword
    );
  });

  it("sin SES_FROM configurado no intenta SES y lo explica", async () => {
    const saved = process.env.SES_FROM;
    delete process.env.SES_FROM;
    let freshHandler;
    jest.isolateModules(() => {
      // eslint-disable-next-line import/no-dynamic-require, global-require
      freshHandler = require(LAMBDA).handler;
    });
    process.env.SES_FROM = saved;
    cognitoRoute({ AdminCreateUserCommand: { User: {} } });
    const res = await freshHandler(post({ email: "x@y.z" }));
    const b = bodyOf(res);
    expect(b.emailSent).toBe(false);
    expect(b.emailError).toBe("SES_FROM not configured");
    expectPolicy(b.tempPassword);
    expect(sesSend).not.toHaveBeenCalled();
  });

  it("usuario ya existente → 409 con el nombre del error", async () => {
    cognitoRoute({
      AdminCreateUserCommand: () => {
        throw err("UsernameExistsException");
      },
    });
    const res = await handler(post({ email: "x@y.z" }));
    expect(res.statusCode).toBe(409);
    expect(bodyOf(res).name).toBe("UsernameExistsException");
  });
});

describe("handler POST — resend (reenviar acceso)", () => {
  it("usuario CONFIRMED: solo recordatorio, sin tocar la contraseña", async () => {
    cognitoRoute({ AdminGetUserCommand: { UserStatus: "CONFIRMED" } });
    const res = await handler(post({ email: "ana@x.com", resend: true, name: "Ana" }));
    expect(res.statusCode).toBe(200);
    expect(bodyOf(res)).toEqual({
      ok: true,
      resent: true,
      created: false,
      emailSent: true,
      withTempPassword: false,
    });
    expect(cognitoSend.mock.calls.map(([c]) => c.__type)).toEqual([
      "AdminGetUserCommand",
    ]);
    const html = sesSend.mock.calls[0][0].input.Message.Body.Html.Data;
    expect(html).not.toContain("Contraseña temporal");
    expect(html).toContain("¿Olvidaste tu contraseña?");
  });

  it("FORCE_CHANGE_PASSWORD: resetea temp password (no permanente) y reinvita", async () => {
    cognitoRoute({
      AdminGetUserCommand: { UserStatus: "FORCE_CHANGE_PASSWORD" },
      AdminSetUserPasswordCommand: {},
    });
    const res = await handler(post({ email: "ana@x.com", resend: true }));
    expect(bodyOf(res)).toEqual({
      ok: true,
      resent: true,
      created: false,
      emailSent: true,
      withTempPassword: true,
    });
    const set = cognitoSend.mock.calls.find(
      ([c]) => c.__type === "AdminSetUserPasswordCommand"
    )[0];
    expect(set.input.Username).toBe("ana@x.com");
    expect(set.input.Permanent).toBe(false);
    expectPolicy(set.input.Password);
    expect(sesSend.mock.calls[0][0].input.Message.Body.Html.Data).toContain(
      set.input.Password
    );
  });

  it("cuenta varada (sin Cognito): la CREA con SUPPRESS y manda invitación completa", async () => {
    cognitoRoute({
      AdminGetUserCommand: () => {
        throw err("UserNotFoundException");
      },
      AdminCreateUserCommand: {},
    });
    const res = await handler(
      post({ email: "nuevo@x.com", resend: true, name: "Nuevo" })
    );
    expect(bodyOf(res)).toEqual({
      ok: true,
      resent: true,
      created: true,
      emailSent: true,
      withTempPassword: true,
    });
    const create = cognitoSend.mock.calls.find(
      ([c]) => c.__type === "AdminCreateUserCommand"
    )[0];
    expect(create.input.MessageAction).toBe("SUPPRESS");
    expect(create.input.UserAttributes).toContainEqual({
      Name: "name",
      Value: "Nuevo",
    });
    expectPolicy(create.input.TemporaryPassword);
    expect(sesSend.mock.calls[0][0].input.Message.Body.Html.Data).toContain(
      create.input.TemporaryPassword
    );
  });

  it("si el correo del resend falla → 200 con la contraseña para compartir manual", async () => {
    cognitoRoute({
      AdminGetUserCommand: { UserStatus: "RESET_REQUIRED" },
      AdminSetUserPasswordCommand: {},
    });
    sesSend.mockImplementation(async () => {
      throw new Error("SES sandbox");
    });
    const res = await handler(post({ email: "ana@x.com", resend: true }));
    expect(res.statusCode).toBe(200);
    const b = bodyOf(res);
    expect(b).toMatchObject({
      ok: true,
      resent: false,
      emailSent: false,
      withTempPassword: true,
      emailError: "SES sandbox",
    });
    expectPolicy(b.tempPassword);
  });

  it("error inesperado de Cognito en el resend → 500 con el nombre", async () => {
    cognitoRoute({
      AdminGetUserCommand: () => {
        throw err("InternalErrorException");
      },
    });
    const res = await handler(post({ email: "ana@x.com", resend: true }));
    expect(res.statusCode).toBe(500);
    expect(bodyOf(res).name).toBe("InternalErrorException");
  });
});

describe("handler DELETE — baja en Cognito", () => {
  it("pathParameters.email URL-encoded: decodifica, normaliza y borra", async () => {
    const res = await handler({
      httpMethod: "DELETE",
      pathParameters: { email: "Ana.Perez%40usfq.edu.ec" },
    });
    expect(res.statusCode).toBe(200);
    expect(bodyOf(res)).toEqual({ ok: true });
    const del = cognitoSend.mock.calls[0][0];
    expect(del.__type).toBe("AdminDeleteUserCommand");
    expect(del.input).toEqual({
      UserPoolId: "us-east-1_TestPool",
      Username: "ana.perez@usfq.edu.ec",
    });
  });

  it("sin pathParameters cae al último segmento del path", async () => {
    await handler({ httpMethod: "DELETE", path: "/users/Juan%40x.com" });
    expect(cognitoSend.mock.calls[0][0].input.Username).toBe("juan@x.com");
  });

  it("idempotente: UserNotFoundException también responde 200", async () => {
    cognitoRoute({
      AdminDeleteUserCommand: () => {
        throw err("UserNotFoundException");
      },
    });
    const res = await handler({
      httpMethod: "DELETE",
      pathParameters: { email: "ya-borrado@x.com" },
    });
    expect(res.statusCode).toBe(200);
    expect(bodyOf(res)).toEqual({ ok: true });
  });

  it("otros errores de Cognito → 500", async () => {
    cognitoRoute({
      AdminDeleteUserCommand: () => {
        throw err("TooManyRequestsException");
      },
    });
    const res = await handler({
      httpMethod: "DELETE",
      pathParameters: { email: "x@y.z" },
    });
    expect(res.statusCode).toBe(500);
    expect(bodyOf(res).name).toBe("TooManyRequestsException");
  });

  it("sin email en la ruta → 400", async () => {
    const res = await handler({ httpMethod: "DELETE", path: "/users/" });
    expect(res.statusCode).toBe(400);
    expect(bodyOf(res).error).toBe("email is required");
    expect(cognitoSend).not.toHaveBeenCalled();
  });
});
