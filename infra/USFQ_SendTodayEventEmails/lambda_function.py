import boto3
import requests
import os
import datetime
import json

# USFQ_SendTodayEventEmails — rev 2026-07-03
# Recordatorio diario (EventBridge cron 13:00 UTC = 8:00 Ecuador): para cada
# evento de HOY reenvía el ticket por email a todos sus inscritos invocando
# USFQ_SEND_TICKET_EMAIL.
#
# Fixes 2026-07-03:
#   1. Los formularios del admin escriben `startDate` (no `date`, que queda
#      null en eventos nuevos) → se usa startDate || date, como el resto de
#      la plataforma.
#   2. La fecha se compara en la zona DEL EVENTO (Quito -5 / Galápagos -6),
#      no por prefijo del string UTC — un evento de 19:00+ local caía en el
#      día siguiente UTC y nunca recibía recordatorio.

# AWS
REGION = "sa-east-1"
lambda_client = boto3.client("lambda", region_name=REGION)
GRAPHQL_ENDPOINT = os.environ["API_EVENTFLOW_GRAPHQLAPIENDPOINTOUTPUT"]
GRAPHQL_API_KEY = os.environ["API_EVENTFLOW_GRAPHQLAPIKEYOUTPUT"]

# ---------- GraphQL queries with pagination ----------
listEventsQuery = """
query ListEvents($limit: Int, $nextToken: String) {
  listEvents(limit: $limit, nextToken: $nextToken) {
    items {
      id
      title
      date
      startDate
      timezone
      _deleted
    }
    nextToken
  }
}
"""

listEventAttendeesQuery = """
query ListEventAttendees($eventID: ID!, $limit: Int, $nextToken: String) {
  eventAttendeesByEventID(eventID: $eventID, limit: $limit, nextToken: $nextToken) {
    items {
      id
      email
      _deleted
    }
    nextToken
  }
}
"""

# ---------- Helpers ----------
def gql_post(query: str, variables: dict | None = None) -> dict:
    """Small wrapper around requests.post for AppSync GraphQL."""
    headers = {"x-api-key": GRAPHQL_API_KEY, "Content-Type": "application/json"}
    resp = requests.post(
        GRAPHQL_ENDPOINT,
        headers=headers,
        json={"query": query, "variables": variables or {}},
        timeout=20,
    )
    if resp.status_code != 200:
        raise RuntimeError(f"GraphQL HTTP {resp.status_code}: {resp.text}")
    data = resp.json()
    if "errors" in data:
        raise RuntimeError(f"GraphQL errors: {data['errors']}")
    return data["data"]

def fetch_all_events(limit: int = 200) -> list[dict]:
    """Fetch all events across all pages."""
    all_items: list[dict] = []
    next_token = None
    while True:
        data = gql_post(
            listEventsQuery,
            {"limit": limit, "nextToken": next_token},
        )["listEvents"]
        all_items.extend(data.get("items", []))
        next_token = data.get("nextToken")
        if not next_token:
            break
    return all_items

def fetch_all_attendees(event_id: str, limit: int = 200) -> list[dict]:
    """Fetch all attendees for a given event across all pages."""
    all_items: list[dict] = []
    next_token = None
    while True:
        data = gql_post(
            listEventAttendeesQuery,
            {"eventID": event_id, "limit": limit, "nextToken": next_token},
        )["eventAttendeesByEventID"]
        all_items.extend(data.get("items", []))
        next_token = data.get("nextToken")
        if not next_token:
            break
    return all_items

# ---------- Date helpers (fixes 1 & 2) ----------
def _event_tz(e: dict) -> datetime.timezone:
    """Fixed offset for the event's zone — Ecuador has no DST."""
    hours = -6 if e.get("timezone") == "Pacific/Galapagos" else -5
    return datetime.timezone(datetime.timedelta(hours=hours))

def _event_local_day(e: dict) -> str | None:
    """Calendar day (YYYY-MM-DD) of the event start, in the EVENT's timezone.
    The admin forms write startDate; legacy rows may only carry date."""
    iso = e.get("startDate") or e.get("date")
    if not iso:
        return None
    try:
        dt = datetime.datetime.fromisoformat(str(iso).replace("Z", "+00:00"))
    except ValueError:
        return None
    return str(dt.astimezone(_event_tz(e)).date())

def _is_today(e: dict) -> bool:
    day = _event_local_day(e)
    if day is None:
        return False
    today = str(datetime.datetime.now(_event_tz(e)).date())
    return day == today

# ---------- Lambda entry ----------
def lambda_handler(event, context):
    # 1) Get ALL events (paginated)
    events = fetch_all_events(limit=200)

    # 2) Filter: only today's events (in the event's own timezone) and not deleted
    todays_events = [e for e in events if not e.get("_deleted") and _is_today(e)]

    print("todays_events recibidos:")
    print(todays_events)

    total_attendees = 0

    # 3) For each event, get ALL attendees (paginated) and invoke the mailer Lambda
    for ev in todays_events:
        event_id = ev["id"]

        attendees = fetch_all_attendees(event_id, limit=200)
        valid_attendees = [a for a in attendees if not a.get("_deleted")]
        total_attendees += len(valid_attendees)

        for attendee in valid_attendees:
            try:
                lambda_client.invoke(
                    FunctionName="USFQ_SEND_TICKET_EMAIL",
                    InvocationType="Event",  # async fire-and-forget
                    Payload=json.dumps({
                        "eventAttendeeId": attendee["id"],
                        "statusPayment": "SUCCESSFUL",
                        "typePayment": "CARD",
                        "manualMode": False,
                    }).encode(),
                )
            except Exception as e:
                print(f"Error invoking ticket email for attendee {attendee.get('id')}: {e}")

    print(f"Total attendees for today's events (all pages): {total_attendees}")
    return {"statusCode": 200, "body": "Reminder for today's events executed (paginated)"}
