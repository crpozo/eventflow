# certificateSender — deploy runbook

Reference Lambda that automatically emails personalized certificates to every
attendee once an event ends. **Not yet wired into Amplify** — `amplify push`
ignores it until you register it with the CLI (so it cannot break your backend).
Follow these steps to deploy it.

## 1. Create the function with the CLI (generates CloudFormation + IAM)

```bash
amplify add function
#   Select: Lambda function
#   Name:   certificateSender
#   Runtime: NodeJS
#   Template: "Hello World"
#   Advanced settings? Yes
#   - Access other resources:
#       * storage (the S3 bucket)  -> read
#       * api / DataStore (Event, EventAttendee) -> read + update
#         (this injects EVENT_TABLE / EVENTATTENDEE_TABLE-style env vars and IAM)
#   - Recurring schedule? Yes -> e.g. every 1 hour  (creates the EventBridge rule)
#   - Environment variables / secrets: add SES_FROM (verified sender)
```

Then replace the generated `src/index.js` and `src/package.json` with the files
in this folder (or copy this folder's `src/` over the generated one).

## 2. Environment variables

The CLI injects table/bucket names with its own naming. Map them (in the
function's env or by editing the few `process.env.*` reads at the top of
`index.js`) to:

| Var | Value |
|-----|-------|
| `EVENT_TABLE` | DynamoDB table for `Event` (e.g. `Event-<apiId>-staging`) |
| `EVENTATTENDEE_TABLE` | DynamoDB table for `EventAttendee` |
| `BYEVENT_INDEX` | `byEvent` (GSI on EventAttendee) |
| `STORAGE_BUCKET` | the Amplify storage S3 bucket |
| `SES_FROM` | a **verified** SES sender address |

## 3. SES

- Verify the `SES_FROM` address/domain in Amazon SES (same region).
- If your SES account is in **sandbox**, you can only send to verified
  recipients — request production access to email all attendees.
- Grant the function IAM permission `ses:SendRawEmail` (add to the function's
  CloudFormation policy, Resource `*`).

## 4. Deploy

```bash
amplify push
```

## 5. How it works

- Runs on the schedule; scans `Event` for `sendCertificates = true` with no
  `certificatesSentAt`.
- Only processes events whose `endDate` (or legacy `date`) is in the past.
- Loads the template image (`Event.certificate`, stored under `public/` in S3),
  renders each attendee's name at `Event.certificatePosition`
  (`{xPct,yPct,fontPct,color,align}`), emails a PDF, then stamps
  `certificatesSentAt`.

## Notes / limitations

- Template is expected to be an **image** (PNG/JPG); matches the admin editor.
- Attendee name is extracted best-effort from `formAnswers` (field matching
  /nombre|name/i). Adjust `extractName()` if your form uses a different field.
- This code is a tested-by-design reference but has **not** been run end-to-end
  in this environment; verify with one test event before enabling broadly.
