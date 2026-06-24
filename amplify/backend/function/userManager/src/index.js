/**
 * userManager — REST Lambda behind API Gateway (Amplify "api" REST category).
 *
 * Handles the Cognito side of user management for the admin "Permisos" page:
 *   POST   /users            body { email, name }  -> AdminCreateUser (invite)
 *   DELETE /users/{email}                          -> AdminDeleteUser
 *
 * The DynamoDB User record itself is created/deleted from the frontend via the
 * AppSync GraphQL API, so DataStore versioning stays consistent — this function
 * only touches Cognito.
 *
 * ── IMPORTANT (untested reference; wire it up before relying on it) ──
 * Create with `amplify add function` + `amplify add api` (REST). Grant the
 * function access to the **auth** (Cognito) category so AUTH_*_USERPOOLID and
 * the cognito-idp:Admin*User IAM are injected. See README.md for the runbook.
 */
// rev 2026-06-24b: SES invite + resend (POST /users {resend}); resend now CREATES
// the Cognito account if it doesn't exist (stranded users). Bump this string to
// bust the deploy hash when Amplify wrongly reports "No Change".
const {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminGetUserCommand,
  AdminSetUserPasswordCommand,
} = require("@aws-sdk/client-cognito-identity-provider");
const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

const cognito = new CognitoIdentityProviderClient({});
const ses = new SESClient({});

// Amplify injects the user pool id as AUTH_<resource>_USERPOOLID; find it.
const USER_POOL_ID =
  process.env.USER_POOL_ID ||
  Object.entries(process.env).find(([k]) => /USERPOOLID$/.test(k))?.[1];

// Verified SES sender + login URL for the invitation email.
const SES_FROM = process.env.SES_FROM;
const LOGIN_URL = process.env.LOGIN_URL || "https://www.eventflow.ec";

// Generate a temp password meeting the Cognito policy: >=8 chars with at least
// one lowercase, uppercase, digit and symbol (ambiguous chars excluded).
const genTempPassword = () => {
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const digit = "23456789";
  const sym = "!@#$%*?-";
  const all = lower + upper + digit + sym;
  const pick = (s) => s[Math.floor(Math.random() * s.length)];
  const chars = [pick(lower), pick(upper), pick(digit), pick(sym)];
  for (let i = 0; i < 8; i++) chars.push(pick(all));
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
};

// Custom Spanish invitation email (carries the temp password since Cognito's
// own email is suppressed). Plain admin-authored name; admin-only endpoint.
const buildInviteEmail = (email, name, tempPassword) => {
  const hi = name ? `Hola ${name},` : "Hola,";
  const html =
    `<div style="font-family:Arial,sans-serif;font-size:15px;color:#1a1a1a;line-height:1.5">` +
    `<p>${hi}</p>` +
    `<p>Se ha creado tu cuenta en <strong>Eventflow</strong> (gestión de eventos USFQ).</p>` +
    `<p><strong>Usuario:</strong> ${email}<br>` +
    `<strong>Contraseña temporal:</strong> ${tempPassword}</p>` +
    `<p>Ingresa en <a href="${LOGIN_URL}">${LOGIN_URL}</a> con esos datos. Se te pedirá ` +
    `crear una nueva contraseña en el primer inicio de sesión.</p>` +
    `<p>Si no esperabas este correo, puedes ignorarlo.</p>` +
    `<p>— Equipo Eventflow USFQ</p></div>`;
  const text =
    `${hi}\n\nSe ha creado tu cuenta en Eventflow (gestión de eventos USFQ).\n\n` +
    `Usuario: ${email}\nContraseña temporal: ${tempPassword}\n\n` +
    `Ingresa en ${LOGIN_URL}. Se te pedirá crear una nueva contraseña en el primer inicio de sesión.\n\n` +
    `— Equipo Eventflow USFQ`;
  return new SendEmailCommand({
    Source: SES_FROM,
    Destination: { ToAddresses: [email] },
    Message: {
      Subject: { Data: "Acceso a Eventflow USFQ", Charset: "UTF-8" },
      Body: {
        Html: { Data: html, Charset: "UTF-8" },
        Text: { Data: text, Charset: "UTF-8" },
      },
    },
  });
};

// Reminder for a user who ALREADY set their password (resend with no temp pw).
const buildReminderEmail = (email, name) => {
  const hi = name ? `Hola ${name},` : "Hola,";
  const html =
    `<div style="font-family:Arial,sans-serif;font-size:15px;color:#1a1a1a;line-height:1.5">` +
    `<p>${hi}</p>` +
    `<p>Tienes una cuenta en <strong>Eventflow</strong> (gestión de eventos USFQ).</p>` +
    `<p><strong>Usuario:</strong> ${email}</p>` +
    `<p>Ingresa en <a href="${LOGIN_URL}">${LOGIN_URL}</a> con tu correo y contraseña. ` +
    `Si la olvidaste, usa la opción <strong>"¿Olvidaste tu contraseña?"</strong> en la pantalla de inicio de sesión.</p>` +
    `<p>— Equipo Eventflow USFQ</p></div>`;
  const text =
    `${hi}\n\nTienes una cuenta en Eventflow (gestión de eventos USFQ).\n\n` +
    `Usuario: ${email}\n\nIngresa en ${LOGIN_URL} con tu correo y contraseña. ` +
    `Si la olvidaste, usa "¿Olvidaste tu contraseña?" en la pantalla de inicio.\n\n` +
    `— Equipo Eventflow USFQ`;
  return new SendEmailCommand({
    Source: SES_FROM,
    Destination: { ToAddresses: [email] },
    Message: {
      Subject: { Data: "Acceso a Eventflow USFQ", Charset: "UTF-8" },
      Body: {
        Html: { Data: html, Charset: "UTF-8" },
        Text: { Data: text, Charset: "UTF-8" },
      },
    },
  });
};

const json = (statusCode, data) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "OPTIONS,POST,DELETE",
  },
  body: JSON.stringify(data),
});

exports.handler = async (event) => {
  try {
    if (!USER_POOL_ID) {
      return json(500, { error: "USER_POOL_ID not configured (grant auth access to the function)" });
    }

    const method = event.httpMethod || event.requestContext?.http?.method;

    if (method === "OPTIONS") return json(200, { ok: true });

    if (method === "POST") {
      const body = JSON.parse(event.body || "{}");
      const email = (body.email || "").trim().toLowerCase();
      if (!email) return json(400, { error: "email is required" });

      // ── Resend login instructions to an EXISTING Cognito user ──
      if (body.resend) {
        let status;
        let exists = true;
        try {
          const u = await cognito.send(
            new AdminGetUserCommand({ UserPoolId: USER_POOL_ID, Username: email })
          );
          status = u.UserStatus;
        } catch (e) {
          if (e?.name === "UserNotFoundException") exists = false;
          else throw e;
        }
        if (!SES_FROM) return json(500, { error: "SES_FROM not configured" });

        // No Cognito account yet (e.g. created while the API was down) -> create
        // it now and send the full invite. If it exists but the user never
        // finished the first login -> reset the temp password and resend the
        // invite. If they already set their own password -> reminder only.
        const needsTemp =
          !exists ||
          status === "FORCE_CHANGE_PASSWORD" ||
          status === "RESET_REQUIRED";
        let tempPassword;
        if (!exists) {
          tempPassword = genTempPassword();
          const attrs = [
            { Name: "email", Value: email },
            { Name: "email_verified", Value: "true" },
          ];
          if (body.name) attrs.push({ Name: "name", Value: body.name });
          await cognito.send(
            new AdminCreateUserCommand({
              UserPoolId: USER_POOL_ID,
              Username: email,
              UserAttributes: attrs,
              TemporaryPassword: tempPassword,
              MessageAction: "SUPPRESS",
            })
          );
        } else if (needsTemp) {
          tempPassword = genTempPassword();
          await cognito.send(
            new AdminSetUserPasswordCommand({
              UserPoolId: USER_POOL_ID,
              Username: email,
              Password: tempPassword,
              Permanent: false,
            })
          );
        }
        try {
          await ses.send(
            needsTemp
              ? buildInviteEmail(email, body.name, tempPassword)
              : buildReminderEmail(email, body.name)
          );
        } catch (e) {
          console.error("resend email failed:", e);
          return json(200, {
            ok: true,
            resent: false,
            emailSent: false,
            withTempPassword: needsTemp,
            ...(needsTemp ? { tempPassword } : {}),
            emailError: e?.message || String(e),
          });
        }
        return json(200, {
          ok: true,
          resent: true,
          created: !exists,
          emailSent: true,
          withTempPassword: needsTemp,
        });
      }

      const attrs = [
        { Name: "email", Value: email },
        { Name: "email_verified", Value: "true" },
      ];
      if (body.name) attrs.push({ Name: "name", Value: body.name });

      const tempPassword = genTempPassword();
      const res = await cognito.send(
        new AdminCreateUserCommand({
          UserPoolId: USER_POOL_ID,
          Username: email,
          UserAttributes: attrs,
          TemporaryPassword: tempPassword,
          MessageAction: "SUPPRESS", // we send our own Spanish invite via SES
        })
      );
      const sub = res.User?.Attributes?.find((a) => a.Name === "sub")?.Value;

      // Send the custom Spanish invitation (carrying the temp password) via SES.
      let emailSent = false;
      let emailError;
      if (SES_FROM) {
        try {
          await ses.send(buildInviteEmail(email, body.name, tempPassword));
          emailSent = true;
        } catch (e) {
          emailError = e?.message || String(e);
          console.error("invite email failed:", e);
        }
      } else {
        emailError = "SES_FROM not configured";
      }

      // If the email didn't go out, return the temp password so the admin can
      // share it manually (the Cognito user already exists with this password).
      return json(200, {
        ok: true,
        username: email,
        sub,
        emailSent,
        ...(emailSent ? {} : { tempPassword, emailError }),
      });
    }

    if (method === "DELETE") {
      const email = decodeURIComponent(
        event.pathParameters?.email ||
          (event.path || "").split("/").pop() ||
          ""
      )
        .trim()
        .toLowerCase();
      if (!email) return json(400, { error: "email is required" });

      try {
        await cognito.send(
          new AdminDeleteUserCommand({ UserPoolId: USER_POOL_ID, Username: email })
        );
      } catch (e) {
        // Idempotent: already gone from Cognito is fine.
        if (e?.name !== "UserNotFoundException") throw e;
      }
      return json(200, { ok: true });
    }

    return json(405, { error: `Method ${method} not allowed` });
  } catch (err) {
    console.error("userManager error:", err);
    const code = err?.name === "UsernameExistsException" ? 409 : 500;
    return json(code, { error: err?.message || String(err), name: err?.name });
  }
};
