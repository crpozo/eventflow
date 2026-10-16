/**
 * Tests del acceso a datos de la landing pública (GraphQL directo).
 * El cliente es un doble con graphql() que despacha por nombre de operación.
 */
import {
  fetchLandingBundle,
  findLandingByEvent,
  findFormByEvent,
  buildTickets,
  findRegistrationsByEmail,
  createAttendeeRecord,
  createEventAttendeeRecord,
  saveAttendeeTicket,
} from "views/landing/landingData";

const op = (query) => /(?:query|mutation) (\w+)/.exec(query)[1];

const fakeClient = (handlers) => {
  const calls = [];
  return {
    calls,
    graphql: jest.fn(async ({ query, variables }) => {
      const name = op(query);
      calls.push({ name, variables });
      const h = handlers[name];
      if (!h) throw new Error(`operación no esperada: ${name}`);
      return { data: await h(variables, calls.filter((c) => c.name === name).length) };
    }),
  };
};

const EVENT = { id: "ev-1", title: "Evento", updatedAt: "t1" };
const LANDING = { id: "l-1", landingEventId: "ev-1", title: "Landing", updatedAt: "t1" };
const FORM = { id: "f-1", formEventId: "ev-1", questions: "[]", updatedAt: "t1" };

describe("fetchLandingBundle", () => {
  test("una sola petición con evento, landing y formulario en la primera página", async () => {
    const client = fakeClient({
      LandingBundle: () => ({
        getEvent: EVENT,
        listLandings: { items: [LANDING], nextToken: null },
        listForms: { items: [FORM], nextToken: null },
      }),
    });
    const out = await fetchLandingBundle(client, "ev-1");
    expect(out).toEqual({ event: EVENT, landing: LANDING, form: FORM });
    expect(client.calls).toHaveLength(1);
    expect(client.calls[0].variables).toMatchObject({
      eventId: "ev-1",
      lf: { landingEventId: { eq: "ev-1" } },
      ff: { formEventId: { eq: "ev-1" } },
      limit: 1000,
    });
  });

  test("sigue paginando el scan cuando la landing o el formulario no están en la primera página", async () => {
    const client = fakeClient({
      LandingBundle: () => ({
        getEvent: EVENT,
        listLandings: { items: [], nextToken: "L2" },
        listForms: { items: [{ ...FORM, _deleted: true }], nextToken: "F2" },
      }),
      FindLanding: (v) => {
        expect(v.nextToken).toBe("L2");
        return { listLandings: { items: [LANDING], nextToken: null } };
      },
      FindForm: (v, n) =>
        n === 1
          ? { listForms: { items: [], nextToken: "F3" } }
          : { listForms: { items: [FORM], nextToken: null } },
    });
    const out = await fetchLandingBundle(client, "ev-1");
    expect(out.landing).toEqual(LANDING);
    expect(out.form).toEqual(FORM);
    expect(client.calls.map((c) => c.name)).toEqual([
      "LandingBundle",
      "FindLanding",
      "FindForm",
      "FindForm",
    ]);
  });

  test("evento borrado o inexistente devuelve event null", async () => {
    const client = fakeClient({
      LandingBundle: () => ({
        getEvent: { ...EVENT, _deleted: true },
        listLandings: { items: [LANDING], nextToken: null },
        listForms: { items: [], nextToken: null },
      }),
    });
    const out = await fetchLandingBundle(client, "ev-1");
    expect(out.event).toBeNull();
    expect(out.form).toBeNull();
  });

  test("con ids conocidos (landing estática) usa búsquedas por id sin scans", async () => {
    const client = fakeClient({
      LandingRefresh: (v) => {
        expect(v).toEqual({ eventId: "ev-1", landingId: "l-1", formId: "f-1", withForm: true });
        return { getEvent: EVENT, getLanding: LANDING, getForm: FORM };
      },
    });
    const out = await fetchLandingBundle(client, "ev-1", { landingId: "l-1", formId: "f-1" });
    expect(out).toEqual({ event: EVENT, landing: LANDING, form: FORM });
  });

  test("con landing conocida pero sin formulario, lo busca por evento", async () => {
    const client = fakeClient({
      LandingRefresh: (v) => {
        expect(v.withForm).toBe(false);
        return { getEvent: EVENT, getLanding: LANDING };
      },
      FindForm: () => ({ listForms: { items: [FORM], nextToken: null } }),
    });
    const out = await fetchLandingBundle(client, "ev-1", { landingId: "l-1" });
    expect(out.form).toEqual(FORM);
  });
});

describe("búsquedas por evento", () => {
  test("findLandingByEvent y findFormByEvent devuelven null al agotar la tabla", async () => {
    const client = fakeClient({
      FindLanding: () => ({ listLandings: { items: [], nextToken: null } }),
      FindForm: () => ({ listForms: { items: [], nextToken: null } }),
    });
    expect(await findLandingByEvent(client, "x")).toBeNull();
    expect(await findFormByEvent(client, "x")).toBeNull();
  });
});

describe("buildTickets", () => {
  test("formatea precios a 2 decimales y marca los vacíos", () => {
    expect(
      buildTickets({ ticketTitle: ["General", "VIP", "Cortesía"], ticketPrice: [10, 25.5] })
    ).toEqual([
      { title: "General", cost: "10.00" },
      { title: "VIP", cost: "25.50" },
      { title: "Cortesía", cost: "Vacio" },
    ]);
  });

  test("sin landing o sin tickets devuelve lista vacía", () => {
    expect(buildTickets(null)).toEqual([]);
    expect(buildTickets({})).toEqual([]);
  });
});

describe("registro", () => {
  test("findRegistrationsByEmail pagina el índice y descarta borrados", async () => {
    const client = fakeClient({
      RegistrationsByEmail: (v, n) =>
        n === 1
          ? { eventAttendeesByEmail: { items: [{ id: "a", eventID: "e1" }, { id: "b", eventID: "e2", _deleted: true }], nextToken: "N" } }
          : { eventAttendeesByEmail: { items: [{ id: "c", eventID: "e3" }], nextToken: null } },
    });
    const out = await findRegistrationsByEmail(client, "a@b.com");
    expect(out.map((r) => r.id)).toEqual(["a", "c"]);
    expect(client.calls[0].variables).toMatchObject({ email: "a@b.com", limit: 1000, nextToken: null });
  });

  test("createAttendeeRecord crea un Attendee vacío", async () => {
    const client = fakeClient({ CreateAttendee: (v) => {
      expect(v).toEqual({ input: {} });
      return { createAttendee: { id: "att-1" } };
    } });
    expect(await createAttendeeRecord(client)).toEqual({ id: "att-1" });
  });

  test("createEventAttendeeRecord guarda formAnswers como string JSON (AWSJSON)", async () => {
    const answers = [{ name: "email", userData: ["a@b.com"] }];
    const client = fakeClient({
      CreateEventAttendee: (v) => ({ createEventAttendee: { id: "ea-1", formAnswers: v.input.formAnswers } }),
    });
    const out = await createEventAttendeeRecord(client, { eventID: "e", formAnswers: answers });
    expect(out.formAnswers).toBe(JSON.stringify(answers));
    // Si ya viene serializado no se vuelve a serializar.
    const again = await createEventAttendeeRecord(client, { eventID: "e", formAnswers: "[1]" });
    expect(again.formAnswers).toBe("[1]");
  });

  test("saveAttendeeTicket actualiza con la _version vigente y devuelve el ticket previo", async () => {
    const client = fakeClient({
      GetEventAttendeeTicket: () => ({ getEventAttendee: { id: "ea-1", ticket: "sent-qr:x", _version: 3 } }),
      UpdateEventAttendeeTicket: (v) => {
        expect(v.input).toEqual({ id: "ea-1", ticket: "public/t.txt", _version: 3 });
        return { updateEventAttendee: { id: "ea-1", ticket: "public/t.txt", _version: 4 } };
      },
    });
    const out = await saveAttendeeTicket(client, "ea-1", "public/t.txt");
    expect(out.previousTicket).toBe("sent-qr:x");
    expect(out.saved._version).toBe(4);
  });

  test("saveAttendeeTicket no actualiza si el EventAttendee no existe", async () => {
    const client = fakeClient({ GetEventAttendeeTicket: () => ({ getEventAttendee: null }) });
    expect(await saveAttendeeTicket(client, "nope", "x")).toEqual({ previousTicket: null, saved: null });
    expect(client.calls).toHaveLength(1);
  });
});
