// Acceso a datos de la landing pública con GraphQL directo (nunca DataStore).
//
// DataStore sincronizaba en el navegador de CADA visitante anónimo las 15
// tablas completas (≈10 000 inscripciones con correos y respuestas, ~21 MB de
// JSON en 35 peticiones) solo para leer un formulario y comprobar duplicados.
// Aquí se piden únicamente los campos que la landing pinta, en un solo viaje.

// Campos del evento que usan la landing y el registro.
export const EVENT_FIELDS = `
  id title description category location date startDate endDate timezone
  sendCertificates contactTemplate maxRegs eventIdUSFQ periodoUSFQ usuarioUSFQ
  updatedAt _version _deleted
`;

// Campos de la landing (sin metaScripts: solo los edita el admin).
export const LANDING_FIELDS = `
  id active title description mainBanner location cost ticketTitle ticketPrice
  extraInfo userConsentCheck galleryPhotos partnerLogos customHtml landingEventId
  updatedAt _version _deleted
`;

export const FORM_FIELDS = `id questions formEventId updatedAt _version _deleted`;

// listLandings/listForms con filtro son Scans: `limit` cuenta registros LEÍDOS,
// así que se piden de 1000 en 1000 y se pagina hasta encontrar el registro.
const PAGE = 1000;

// Evento + landing + formulario en UNA petición (AppSync resuelve los tres
// campos raíz en paralelo). Si la landing o el formulario no aparecen en la
// primera página del scan, se siguen buscando con findByEvent.
const LANDING_BUNDLE = /* GraphQL */ `
  query LandingBundle($eventId: ID!, $lf: ModelLandingFilterInput, $ff: ModelFormFilterInput, $limit: Int) {
    getEvent(id: $eventId) { ${EVENT_FIELDS} }
    listLandings(filter: $lf, limit: $limit) { items { ${LANDING_FIELDS} } nextToken }
    listForms(filter: $ff, limit: $limit) { items { ${FORM_FIELDS} } nextToken }
  }
`;

// Refresco cuando ya se conocen los ids (landing estática): búsquedas por
// clave primaria, sin scans.
const LANDING_REFRESH = /* GraphQL */ `
  query LandingRefresh($eventId: ID!, $landingId: ID!, $formId: ID!, $withForm: Boolean!) {
    getEvent(id: $eventId) { ${EVENT_FIELDS} }
    getLanding(id: $landingId) { ${LANDING_FIELDS} }
    getForm(id: $formId) @include(if: $withForm) { ${FORM_FIELDS} }
  }
`;

const LIST_LANDINGS = /* GraphQL */ `
  query FindLanding($filter: ModelLandingFilterInput, $limit: Int, $nextToken: String) {
    listLandings(filter: $filter, limit: $limit, nextToken: $nextToken) { items { ${LANDING_FIELDS} } nextToken }
  }
`;

const LIST_FORMS = /* GraphQL */ `
  query FindForm($filter: ModelFormFilterInput, $limit: Int, $nextToken: String) {
    listForms(filter: $filter, limit: $limit, nextToken: $nextToken) { items { ${FORM_FIELDS} } nextToken }
  }
`;

const live = (item) => (item && !item._deleted ? item : null);

// Recorre las páginas de un scan hasta encontrar el primer registro vivo.
async function scanFirst(client, query, root, filter, startToken = null) {
  let nextToken = startToken;
  do {
    const res = await client.graphql({ query, variables: { filter, limit: PAGE, nextToken } });
    const page = res?.data?.[root];
    const hit = (page?.items || []).map(live).find(Boolean);
    if (hit) return hit;
    nextToken = page?.nextToken ?? null;
  } while (nextToken);
  return null;
}

// Landing de un evento (el FK vive en Landing.landingEventId).
export const findLandingByEvent = (client, eventId) =>
  scanFirst(client, LIST_LANDINGS, "listLandings", { landingEventId: { eq: eventId } });

// Formulario de un evento (FK en Form.formEventId).
export const findFormByEvent = (client, eventId) =>
  scanFirst(client, LIST_FORMS, "listForms", { formEventId: { eq: eventId } });

/**
 * Evento, landing y formulario de una landing pública.
 * Con `known` (ids de la landing estática) usa búsquedas por id; si no, una
 * sola petición con los tres campos y paginación solo cuando hace falta.
 * @returns {Promise<{event: object|null, landing: object|null, form: object|null}>}
 */
export async function fetchLandingBundle(client, eventId, known = {}) {
  if (known.landingId) {
    const res = await client.graphql({
      query: LANDING_REFRESH,
      variables: {
        eventId,
        landingId: known.landingId,
        formId: known.formId || "-",
        withForm: Boolean(known.formId),
      },
    });
    const d = res?.data || {};
    let form = live(d.getForm);
    if (!known.formId) form = await findFormByEvent(client, eventId);
    return { event: live(d.getEvent), landing: live(d.getLanding), form };
  }

  const res = await client.graphql({
    query: LANDING_BUNDLE,
    variables: {
      eventId,
      lf: { landingEventId: { eq: eventId } },
      ff: { formEventId: { eq: eventId } },
      limit: PAGE,
    },
  });
  const d = res?.data || {};
  const firstLive = (page) => (page?.items || []).map(live).find(Boolean) || null;
  let landing = firstLive(d.listLandings);
  let form = firstLive(d.listForms);
  const [moreLanding, moreForm] = await Promise.all([
    !landing && d.listLandings?.nextToken
      ? scanFirst(client, LIST_LANDINGS, "listLandings", { landingEventId: { eq: eventId } }, d.listLandings.nextToken)
      : null,
    !form && d.listForms?.nextToken
      ? scanFirst(client, LIST_FORMS, "listForms", { formEventId: { eq: eventId } }, d.listForms.nextToken)
      : null,
  ]);
  landing = landing || moreLanding;
  form = form || moreForm;
  return { event: live(d.getEvent), landing, form };
}

// Tickets formateados para el selector de la landing ("10.00" o "Vacio").
export const buildTickets = (landing) =>
  (landing?.ticketTitle || []).map((title, index) => ({
    title,
    cost:
      landing.ticketPrice?.[index] !== undefined && landing.ticketPrice?.[index] !== null
        ? `${Number(landing.ticketPrice[index]).toFixed(2)}`
        : "Vacio",
  }));

// ── Registro ─────────────────────────────────────────────────────────────

const REGISTRATIONS_BY_EMAIL = /* GraphQL */ `
  query RegistrationsByEmail($email: String!, $limit: Int, $nextToken: String) {
    eventAttendeesByEmail(email: $email, limit: $limit, nextToken: $nextToken) {
      items { id eventID _deleted }
      nextToken
    }
  }
`;

// Inscripciones (vivas) de un correo en cualquier evento: solo id y evento,
// lo justo para validar duplicados y subeventos.
export async function findRegistrationsByEmail(client, email) {
  const out = [];
  let nextToken = null;
  do {
    const res = await client.graphql({
      query: REGISTRATIONS_BY_EMAIL,
      variables: { email, limit: PAGE, nextToken },
    });
    const page = res?.data?.eventAttendeesByEmail;
    (page?.items || []).forEach((it) => {
      if (live(it)) out.push(it);
    });
    nextToken = page?.nextToken ?? null;
  } while (nextToken);
  return out;
}

const CREATE_ATTENDEE = /* GraphQL */ `
  mutation CreateAttendee($input: CreateAttendeeInput!) {
    createAttendee(input: $input) { id }
  }
`;

export async function createAttendeeRecord(client) {
  const res = await client.graphql({ query: CREATE_ATTENDEE, variables: { input: {} } });
  return res?.data?.createAttendee || null;
}

const ATTENDEE_FIELDS = `
  id eventID attendeeID email authorized checkIn formAnswers ticket
  allowContact quantity scanned profileURL createdAt updatedAt _version _deleted
`;

const CREATE_EVENT_ATTENDEE = /* GraphQL */ `
  mutation CreateEventAttendee($input: CreateEventAttendeeInput!) {
    createEventAttendee(input: $input) { ${ATTENDEE_FIELDS} }
  }
`;

// formAnswers es AWSJSON: se guarda como string (igual que lo serializaba
// DataStore), así el admin y los Lambdas leen el mismo formato de siempre.
export async function createEventAttendeeRecord(client, input) {
  const res = await client.graphql({
    query: CREATE_EVENT_ATTENDEE,
    variables: {
      input: {
        ...input,
        formAnswers:
          typeof input.formAnswers === "string"
            ? input.formAnswers
            : JSON.stringify(input.formAnswers),
      },
    },
  });
  return res?.data?.createEventAttendee || null;
}

const GET_ATTENDEE_TICKET = /* GraphQL */ `
  query GetEventAttendeeTicket($id: ID!) {
    getEventAttendee(id: $id) { id ticket _version _deleted }
  }
`;

const UPDATE_ATTENDEE_TICKET = /* GraphQL */ `
  mutation UpdateEventAttendeeTicket($input: UpdateEventAttendeeInput!) {
    updateEventAttendee(input: $input) { id ticket _version }
  }
`;

/**
 * Guarda la ruta del PDF del ticket. Lee primero la versión vigente (la tabla
 * tiene detección de conflictos: update exige _version) y devuelve el ticket
 * PREVIO, para saber si el Lambda ya había enviado el correo ("sent-qr:…").
 */
export async function saveAttendeeTicket(client, id, ticket) {
  const cur = await client.graphql({ query: GET_ATTENDEE_TICKET, variables: { id } });
  const original = cur?.data?.getEventAttendee;
  if (!original) return { previousTicket: null, saved: null };
  const res = await client.graphql({
    query: UPDATE_ATTENDEE_TICKET,
    variables: { input: { id, ticket, _version: original._version } },
  });
  return { previousTicket: original.ticket ?? null, saved: res?.data?.updateEventAttendee || null };
}
