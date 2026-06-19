# userManager — deploy runbook

REST Lambda that creates/deletes **Cognito** accounts for the admin *Permisos*
page. The DynamoDB `User` record is created/deleted from the frontend (GraphQL),
so this function only touches Cognito. **Not wired into Amplify until you run the
CLI steps below.**

Endpoints (behind API Gateway, API name **`userApi`**):

| Method | Path | Body / Param | Action |
|--------|------|--------------|--------|
| POST   | `/users` | `{ email, name }` | `AdminCreateUser` (emails a temp password) |
| DELETE | `/users/{email}` | email in path | `AdminDeleteUser` (idempotent) |

## 1. Create the function

```bash
amplify add function
#   Name:    userManager
#   Runtime: NodeJS
#   Template: Hello World
#   Advanced settings? Yes
#   - Access other resources? Yes
#       * select the **auth** resource (Cognito) -> read
#         (injects AUTH_<resource>_USERPOOLID + lets you add admin IAM)
#   - Recurring schedule? No
#   - Environment variables? No   (USER_POOL_ID is auto-detected from AUTH_*_USERPOOLID)
#   - Secrets? No
#   Edit now? No
```

Then keep this folder's `src/index.js`, `src/package.json` and
`custom-policies.json` (answer **No** to any overwrite prompt, then
`git checkout -- amplify/backend/function/userManager/src` to restore them).

`custom-policies.json` already grants `cognito-idp:AdminCreateUser` /
`AdminDeleteUser` / `AdminGetUser`.

## 2. Expose it as a REST API named `userApi`

```bash
amplify add api
#   Select: REST
#   Friendly name: userApi      <-- must match USER_API in the frontend
#   Path: /users
#   Lambda source: Use existing Lambda -> userManager
#   Restrict access? Yes -> Authenticated users only (Cognito)  [recommended]
#   Add another path: /users/{email}  -> same function
```

> The frontend calls `apiName: "userApi"`, paths `/users` (POST) and
> `/users/{email}` (DELETE). Keep the name `userApi`.

## 3. Deploy

```bash
amplify push
```
This also re-generates `src/aws-exports.js` with the REST endpoint so the app
can call it. Commit the updated `aws-exports.js`.

## 4. Verify

- Create a user from **/admin/permisos → Crear usuario**. The person should get
  a Cognito invite email with a temporary password; a `User` record appears in
  the table.
- Delete a user; the Cognito account and the record are removed.

## Notes

- `USER_POOL_ID` is auto-detected from the injected `AUTH_*_USERPOOLID` env var.
- Cognito sends the invite email using your User Pool's message configuration
  (verify the pool's "from" address / SES setup if you customized it).
- If create succeeds in Cognito but the GraphQL record fails, just delete the
  Cognito user and retry (rare; the two steps are sequential in the frontend).
