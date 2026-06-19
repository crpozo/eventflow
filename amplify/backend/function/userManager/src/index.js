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
const {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

const cognito = new CognitoIdentityProviderClient({});

// Amplify injects the user pool id as AUTH_<resource>_USERPOOLID; find it.
const USER_POOL_ID =
  process.env.USER_POOL_ID ||
  Object.entries(process.env).find(([k]) => /USERPOOLID$/.test(k))?.[1];

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

      const attrs = [
        { Name: "email", Value: email },
        { Name: "email_verified", Value: "true" },
      ];
      if (body.name) attrs.push({ Name: "name", Value: body.name });

      const res = await cognito.send(
        new AdminCreateUserCommand({
          UserPoolId: USER_POOL_ID,
          Username: email,
          UserAttributes: attrs,
          DesiredDeliveryMediums: ["EMAIL"], // Cognito emails the temp password
        })
      );
      const sub = res.User?.Attributes?.find((a) => a.Name === "sub")?.Value;
      return json(200, { ok: true, username: email, sub });
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
