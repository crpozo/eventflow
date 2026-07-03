# USFQ_SendTodayEventEmails (Lambda manual — NO gestionada por Amplify)

Recordatorio diario de eventos. Vive solo en la consola AWS (cuenta 531978016318,
`sa-east-1`); esta carpeta es la copia de referencia del código desplegado —
**editar aquí no despliega nada**. Para actualizarla:

```sh
cd infra/USFQ_SendTodayEventEmails
zip -r /tmp/reminder.zip lambda_function.py   # + deps si cambian (requests, etc.)
aws lambda update-function-code --function-name USFQ_SendTodayEventEmails \
  --zip-file fileb:///tmp/reminder.zip --profile usfq --region sa-east-1
```

- **Trigger**: regla EventBridge `USFQ_SendTodayEventEmails_8AM`, `cron(0 13 * * ? *)`
  (13:00 UTC = 8:00 Ecuador, diario).
- **Qué hace**: lista todos los Events por AppSync (API key), filtra los que son HOY
  en la zona del evento, y por cada inscrito invoca `USFQ_SEND_TICKET_EMAIL`
  (reenvía el ticket como recordatorio).
- **Runtime**: Python 3.13. Deps empaquetadas en el zip: `requests` (+ transitivas).
- **Env vars**: `API_EVENTFLOW_GRAPHQLAPIENDPOINTOUTPUT`, `API_EVENTFLOW_GRAPHQLAPIKEYOUTPUT`.

## Historial
- **2026-07-03**: fix de dos bugs que hacían que eventos nuevos no recibieran
  recordatorio: (1) filtraba solo por `date`, pero los formularios del admin
  escriben `startDate` (`date` queda null) → ahora `startDate || date`;
  (2) comparaba el prefijo del string UTC contra la fecha local → ahora convierte
  a la zona del evento (Quito -5 / Galápagos -6), con lo que los eventos
  nocturnos ya no caen en el día siguiente UTC.
