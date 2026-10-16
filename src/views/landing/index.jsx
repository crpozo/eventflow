import React, { useState, useMemo } from "react";
import logo from "assets/img/usfq/logo_2025.png";
import bgPlaceholder from "assets/img/usfq/bg-placeholder.webp";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { formatDateHour, formatHour, tzCityLabel } from 'scripts/utils';
import { useAwsTranslation} from 'scripts/useAwsTranslation';
import { getLandingUI } from 'scripts/landingTranslations';
import LandingExtras from './components/LandingExtras';
import { FullScreenLoader } from "components/adminUi";
import { FiExternalLink } from "react-icons/fi";
import { LuCalendarClock, LuMapPin } from "react-icons/lu";
import { BsPlusLg as PlusIcon } from "react-icons/bs";
import {
  AiOutlineMinus as MinusIcon,
} from "react-icons/ai";
/* GRAPHQL */
import { generateClient } from 'aws-amplify/api';
import { eventAttendeesIdsByEventID, getEventAttendee } from '../../graphql/queries';
import { fetchLandingBundle, buildTickets } from './landingData';

// El registro (formBuilder + jQuery + QR + PDF) solo se descarga cuando hace
// falta: al pulsar "Reservar ticket", al volver de un pago (?EventAttendee=) o
// en segundo plano cuando el navegador queda libre tras la carga (prefetch).
const loadRegistro = () => import("./registro/index");
const Registro = React.lazy(loadRegistro);

const isBrowser = typeof window !== "undefined";

// Landing "madre" de subeventos: lista las actividades en vez de reservar.
const SUBEVENT_PARENT_ID = "bb85f39d-8300-4ada-ab70-c2b70cfc4b0b";

// URL base de CloudFront para los assets públicos subidos por el admin.
const CLOUDFRONT_PUBLIC = "https://dnuc5lxyun5b.cloudfront.net/public/";

// Resuelve el src del banner principal: key subida por el admin (vía
// CloudFront) o el placeholder local si la landing no tiene banner.
const resolveBannerSrc = (landing) =>
  landing.mainBanner
    ? `${CLOUDFRONT_PUBLIC}${landing.mainBanner}`
    : bgPlaceholder;

// "Hall Principal - USFQ (Campus Santiago Gangotena – Cumbayá)" →
// { venue: "Hall Principal - USFQ", venueDetail: "Campus Santiago Gangotena – Cumbayá" }.
export const splitLocation = (loc) => {
  const s = String(loc || "").trim();
  const m = /^(.*?)\s*\(([^)]*)\)\s*$/.exec(s);
  return m ? { venue: m[1].trim(), venueDetail: m[2].trim() } : { venue: s, venueDetail: "" };
};

// "jueves 5 de noviembre, 2026" / "Thursday, November 5, 2026", en la zona del evento.
export const longDate = (iso, lang, tz) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const txt = new Intl.DateTimeFormat(lang === "EN" ? "en-US" : "es-EC", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: tz,
  }).format(d);
  return txt.charAt(0).toUpperCase() + txt.slice(1);
};

// Día calendario (AAAA-MM-DD) de un instante en la zona del EVENTO. Decide
// "mismo día" igual en el build (UTC) que en el navegador del visitante.
export const dayKey = (iso, tz) => {
  const d = new Date(iso);
  if (!iso || Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(d);
};

// Rango horario "09:00 – 13:00" (24h) del mismo día; solo la hora de inicio si no hay fin.
export const timeRange = (startIso, endIso, lang, tz) => {
  const fmt = (iso) => {
    const d = new Date(iso);
    if (!iso || Number.isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat(lang === "EN" ? "en-US" : "es-EC", {
      hour: "2-digit", minute: "2-digit", hour12: false, timeZone: tz,
    }).format(d);
  };
  const start = fmt(startIso);
  const end = fmt(endIso);
  const sameDay = startIso && endIso && dayKey(startIso, tz) === dayKey(endIso, tz);
  const label = start && end && sameDay && end !== start ? `${start} – ${end}` : start;
  return { start, end, label };
};

// Primera oración de un texto largo (máx. 180 caracteres) para el subtítulo del hero.
export const firstSentence = (text) => {
  const s = String(text || "").replaceAll(/\s+/g, " ").trim();
  if (!s) return "";
  const m = /^(.+?[.!?])(\s|$)/.exec(s);
  const out = m ? m[1] : s;
  return out.length > 180 ? `${out.slice(0, 177).trimEnd()}…` : out;
};

// Párrafos de la descripción larga: separa por saltos de línea.
export const paragraphs = (text) =>
  String(text || "").split(/\n+/).map((p) => p.trim()).filter(Boolean);

// La landing sigue "cargando" cuando la query aún no responde o cuando el
// ?EventAttendee= de la URL todavía no se resuelve (ni válido ni inválido).
const isLandingLoading = (loading, landing, attendeeParam, eventAttendee) =>
  (loading && landing?.length === 0) ||
  (attendeeParam && !eventAttendee && eventAttendee !== false);

// Landing desactivada: se oculta solo al público (visitantes sin sesión).
const isLandingDeactivated = (loading, landing, authStatus) =>
  !loading && landing.active === false && authStatus === "unauthenticated";

// Mientras no se sabe si quien visita una landing desactivada tiene sesión,
// se muestra el loader (no se le enseña el contenido al público).
const isCheckingSession = (loading, landing, authStatus) =>
  !loading && landing.active === false && authStatus === null;

// Sesión del panel: solo se consulta para landings desactivadas, con el SDK
// de Auth cargado bajo demanda (antes useAuthenticator arrastraba Amplify UI
// completo + xstate al bundle público).
async function readAuthStatus() {
  try {
    const { fetchAuthSession } = await import("aws-amplify/auth");
    const session = await fetchAuthSession();
    return session?.tokens?.accessToken ? "authenticated" : "unauthenticated";
  } catch (e) {
    return "unauthenticated";
  }
}

// El evento siempre lleva sendCertificates booleano (los campos de
// certificado del registro dependen de él).
const withCertFlag = (ev) => ({ ...ev, sendCertificates: ev.sendCertificates ?? false });

// ?EventAttendee= inválido: la query respondió que no existe, así que hay que
// limpiarlo de la URL para no volver a consultarlo.
const hasInvalidAttendeeParam = (attendeeParam, eventAttendee) =>
  Boolean(attendeeParam) && eventAttendee === false;

// CTA del bloque de tickets: spinner mientras se valida el cupo, aviso de
// agotado, o el botón de reservar / ver actividades según el tipo de landing.
function ReserveCta({ isSoldOut, isSubeventLanding, ui, onReserve }) {
  if (isSoldOut === null) {
    return (
      <div className="flex justify-center items-center gap-2 text-gray-600 text-sm">
        <span className="loader-small animate-spin rounded-full border-2 border-gray-300 border-t-red-500 h-7 w-7"></span>
      </div>
    );
  }
  if (isSoldOut) {
    return <span className="text-red-600 font-bold py-2">{ui.soldOut}</span>;
  }
  return (
    <button
      type="button"
      onClick={onReserve}
      className="flex w-full max-w-full md:max-w-[250px] items-center justify-center gap-1 rounded-xl bg-red-500 py-[10px] px-3 font-medium text-white transition duration-200 hover:bg-black"
    >
      {isSubeventLanding ? ui.seeActivities : ui.bookTicket}
    </button>
  );
}

/**
 * Landing pública de un evento.
 * @param {object}  [initialData]  datos del build (landing estática): { eventId,
 *                                 event, landing, form, images }. Con ellos la
 *                                 página se pinta sin esperar a AppSync y luego
 *                                 se refresca en segundo plano.
 * @param {boolean} [hydrated]     true al hidratar el HTML estático: el primer
 *                                 render debe coincidir con el del build.
 */
export default function SignIn({ initialData = null, hydrated = false }) {
  const { id, lang: langParam } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const seed = initialData && initialData.eventId === id ? initialData : null;
  // Language can come from the URL (/landing/:id/en) so links are shareable per
  // language; otherwise fall back to the last choice or Spanish. Al hidratar,
  // el primer render es el del build (español) y la preferencia guardada se
  // aplica en un efecto.
  const [lang, setLang] = useState(() => {
    if (langParam) return langParam.toLowerCase() === "en" ? "EN" : "ES";
    if (hydrated || !isBrowser) return "ES";
    return localStorage.getItem("landingLang") || "ES";
  });
  React.useEffect(() => {
    if (!hydrated || langParam) return;
    if (localStorage.getItem("landingLang") === "EN") setLang("EN");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const changeLang = (next) => {
    setLang(next);
    localStorage.setItem("landingLang", next);
    // Reflect the language in the URL: /landing/:id (ES) or /landing/:id/en (EN).
    navigate(next === "EN" ? `/landing/${id}/en` : `/landing/${id}`, {
      replace: true,
    });
  };
  // Keep state in sync when the URL language segment changes (e.g. shared link
  // or browser back/forward). With no language in the URL, keep the current
  // choice (don't force Spanish).
  React.useEffect(() => {
    if (!langParam) return;
    setLang(langParam.toLowerCase() === "en" ? "EN" : "ES");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [langParam]);
  const [landing, setLanding] = React.useState(() => seed?.landing || []);
  const [event, setEvent] = React.useState(() => (seed?.event ? withCertFlag(seed.event) : []));
  const [form, setForm] = React.useState(() => seed?.form || null);
  const [loading, setLoading] = React.useState(!seed);
  const [notFound, setNotFound] = React.useState(false);
  const [tickets, setTickets] = React.useState(() => buildTickets(seed?.landing));
  const [userData, setUserData] = useState([]);
  const [ticketsQuantity, setTicketsQuantity] = useState(1);
  const [selectedCost, setSelectedCost] = React.useState(() => buildTickets(seed?.landing)[0]?.cost ?? null);
  const [showRegister, setShowRegister] = React.useState(false);
  const [eventAttendee, setEventAttendee] = useState(null);
  const attendeeParam = new URLSearchParams(location.search).get('EventAttendee');
  const clientRef = React.useRef(null);
  const getClient = () => {
    if (!clientRef.current) clientRef.current = generateClient();
    return clientRef.current;
  };
  const [showExpiredPopup, setShowExpiredPopup] = useState(false);
  // null = validando cupo (spinner). Con datos del build y sin cupo máximo se
  // sabe de entrada que no está agotado.
  const [isSoldOut, setIsSoldOut] = useState(() =>
    seed && typeof seed.event?.maxRegs !== "number" ? false : null
  );
  // Sesión: null = desconocida (solo se consulta para landings desactivadas).
  const [authStatus, setAuthStatus] = useState(null);
  // El registro se monta la primera vez que hace falta y ya no se desmonta:
  // "Regresar" solo lo oculta, así no se pierde lo escrito en el formulario.
  const [registroMounted, setRegistroMounted] = useState(false);
  React.useEffect(() => {
    if (showRegister || eventAttendee) setRegistroMounted(true);
  }, [showRegister, eventAttendee]);

  // Al abrir el registro (o volver a los detalles) la vista se desplaza con
  // suavidad al inicio del panel: sin esto, como el hero es alto, el scroll
  // quedaba donde estaba y el formulario aparecía "muy abajo".
  const registerRef = React.useRef(null);
  const detailsRef = React.useRef(null);
  const firstToggle = React.useRef(true);
  React.useEffect(() => {
    if (firstToggle.current) {
      firstToggle.current = false;
      return;
    }
    const target = showRegister ? registerRef.current : detailsRef.current;
    if (!target || typeof window.scrollTo !== "function") return;
    const top = target.getBoundingClientRect().top + window.scrollY - 24;
    try {
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    } catch (e) {
      // jsdom no implementa scrollTo con opciones.
    }
  }, [showRegister]);

  // Prefetch del registro cuando el navegador queda libre: al pulsar
  // "Reservar ticket" el formulario ya está descargado (y su motor jQuery +
  // formBuilder también), sin pesar en la carga inicial.
  React.useEffect(() => {
    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 2000));
    const cancel = window.cancelIdleCallback || clearTimeout;
    const handle = idle(() => {
      loadRegistro()
        .then((m) => m.preloadFormEngine?.())
        .catch(() => {});
    });
    return () => cancel(handle);
  }, []);

  // Translations
  // Static UI labels (instant, no API quota)
  const ui = getLandingUI(lang);

  // Event date/time is rendered DIRECTLY (not via Amazon Translate), pinned to
  // the EVENT's timezone so every viewer sees the venue's wall clock (with a
  // "(GMT-6)" label). The LANGUAGE/FORMAT follows the page's ES/EN toggle.
  const eventTz = event?.timezone || "America/Guayaquil";
  const eventTzLabel = tzCityLabel(eventTz);
  const { eventDate, eventDateEnd } = useMemo(() => {
    // Multi-day: prefer startDate/endDate range, fall back to legacy single date.
    const startIso = event?.startDate || event?.date;
    const endIso = event?.endDate;
    let date = startIso ? formatDateHour(startIso, lang, eventTz) : "";
    // For multi-day events the end date renders on its OWN line (see the render
    // below) so it doesn't cram onto the start line. Empty for single-day events.
    let end = "";
    if (startIso && endIso) {
      const sameDay = dayKey(endIso, eventTz) === dayKey(startIso, eventTz);
      if (sameDay) {
        // Same calendar day: append only the end time, without repeating the
        // weekday/date. Skip it when the end time equals the start time.
        const endHour = formatHour(endIso, lang, eventTz);
        if (endHour && endHour !== formatHour(startIso, lang, eventTz)) {
          date = `${formatDateHour(startIso, lang, eventTz)} — ${endHour}`;
        }
      } else {
        // Spans multiple days: the full end date goes on its own line.
        end = formatDateHour(endIso, lang, eventTz);
      }
    }
    return { eventDate: date, eventDateEnd: end };
  }, [event?.date, event?.startDate, event?.endDate, lang, eventTz]);

  // Dynamic, user-generated content translated on the fly via Amazon Translate.
  const baseTexts = useMemo(() => {
    const texts = {
      title: landing?.title || "",
      description: landing?.description || "",
      location: landing?.location || "",
      extraInfo: landing?.extraInfo || "",
      // Custom HTML block (e.g. agenda link) — translated like the rest so its
      // visible text follows the ES/EN toggle. Amazon Translate preserves tags.
      customHtml: landing?.customHtml || "",
    };
    // Ticket titles are created per-landing, so translate each one.
    (landing?.ticketTitle || []).forEach((title, i) => {
      texts[`ticket_${i}`] = title || "";
    });
    return texts;
  }, [landing]);

  const translated = useAwsTranslation(baseTexts, lang);

  // Generate landing cards
  const isSubeventLanding = id === SUBEVENT_PARENT_ID;
  const cardsRef = React.useRef(null);
  const subeventos = [
    { id: "939722b8-9169-47c7-9cfc-64f8a40e0bd4", title: "Cardio en Clave Tropical" },
    { id: "79123410-02da-487a-b26f-101c181aee88", title: "¿Y si no era por Ahí?" },
    { id: "0174b708-bc60-4f40-b925-65ab2ba66807", title: "Aguanta que viene el giro" },
    { id: "219a2ee6-896b-4c46-8119-badd8e25d381", title: "Crêpe Diem" }
  ];

  // Evento + landing + formulario en una sola petición. Con datos del build
  // (landing estática) la página ya está pintada: esto solo la refresca si
  // algo cambió desde el build.
  React.useEffect(() => {
    let alive = true;
    const known = seed ? { landingId: seed.landing?.id, formId: seed.form?.id } : {};

    const applyData = (ev, ld, fm) => {
      const sameAsSeed =
        seed &&
        seed.event?.updatedAt === ev.updatedAt &&
        seed.landing?.updatedAt === ld.updatedAt &&
        (seed.form?.updatedAt ?? null) === (fm?.updatedAt ?? null);
      if (sameAsSeed) return;
      setEvent(withCertFlag(ev));
      setLanding(ld);
      setForm(fm || null);
      const nextTickets = buildTickets(ld);
      setTickets(nextTickets);
      setSelectedCost(nextTickets[0]?.cost ?? null);
      setLoading(false);
    };

    // Sold-out check: only relevant when a cap (maxRegs) is set. Count by
    // paging an id-only projection (no PII) and stop as soon as we reach the
    // cap — avoids pulling the entire attendee table on this public page.
    const checkSoldOut = async (ev) => {
      const maxRegs = ev.maxRegs;
      if (typeof maxRegs !== "number") {
        setIsSoldOut(false);
        return;
      }
      try {
        let nextToken = null;
        let count = 0;
        do {
          const resp = await getClient().graphql({
            query: eventAttendeesIdsByEventID,
            variables: {
              eventID: id,
              filter: { _deleted: { ne: true } },
              limit: 1000,
              nextToken,
            },
          });
          const page = resp?.data?.eventAttendeesByEventID;
          count += page?.items?.length ?? 0;
          nextToken = page?.nextToken ?? null;
        } while (nextToken && count < maxRegs);
        if (alive) setIsSoldOut(count >= maxRegs);
      } catch (error) {
        console.error("Error validating maxRegs:", error);
        if (alive) setIsSoldOut(false);
      }
    };

    // Reintento acotado: sin él, un error transitorio de AppSync (throttling,
    // red) dejaba la landing pública en el loader infinito.
    const load = async (attempt = 0) => {
      try {
        const { event: ev, landing: ld, form: fm } = await fetchLandingBundle(getClient(), id, known);
        if (!alive) return;
        if (!ev || !ld) {
          // Evento o landing inexistente (p. ej. evento borrado): mensaje en
          // vez del loader infinito. Con datos del build se conserva lo pintado.
          if (!seed) {
            setNotFound(true);
            setLoading(false);
          }
          return;
        }
        applyData(ev, ld, fm);
        await checkSoldOut(ev);
      } catch (e) {
        console.error("landing: fallo cargando evento/landing", e);
        if (attempt < 2) {
          setTimeout(() => alive && load(attempt + 1), 2500);
        }
      }
    };
    load();
    return () => {
      alive = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Sesión solo para landings desactivadas (ver isLandingDeactivated).
  React.useEffect(() => {
    if (landing?.active !== false) return undefined;
    let alive = true;
    readAuthStatus().then((status) => alive && setAuthStatus(status));
    return () => {
      alive = false;
    };
  }, [landing?.active]);

  // Título de la pestaña con el nombre del evento (la estática ya lo trae).
  React.useEffect(() => {
    if (landing?.title) document.title = landing.title;
  }, [landing?.title]);

  // Verify if the event is over (uses end date, then start date, then legacy
  // single date) to show the "expired" popup.
  React.useEffect(() => {
    const ref = event?.endDate || event?.startDate || event?.date;
    if (typeof ref === "string") {
      const eventDate = new Date(ref);
      const now = new Date();
      const hoursDiff = (now - eventDate) / (1000 * 60 * 60);
      if (hoursDiff > 24) {
        setShowExpiredPopup(true);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.endDate, event?.startDate, event?.date]);

  // Get EventAttendee parameter + Graphql Data
  React.useEffect(() => {
    if (!attendeeParam) return;
    let alive = true;
    (async () => {
      const resultEventAttendee = await getClient().graphql({
        query: getEventAttendee,
        variables: { id: attendeeParam },
      });
      if (!alive) return;
      if (resultEventAttendee.data.getEventAttendee) {
        setEventAttendee(resultEventAttendee.data.getEventAttendee);
      } else {
        setEventAttendee(false);
      }
    })();
    return () => {
      alive = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attendeeParam]);

  // ?EventAttendee= inválido: se limpia de la URL para no volver a consultarlo.
  React.useEffect(() => {
    if (hasInvalidAttendeeParam(attendeeParam, eventAttendee)) {
      navigate({ pathname: location.pathname, search: "" }, { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attendeeParam, eventAttendee]);

  const quantityIncrementHandler = () => {
    setTicketsQuantity((prevState) => prevState + 1);
  };

  const quantityDecrementHandler = () => {
    setTicketsQuantity((prevState) => {
      if (prevState !== 1) {
        return prevState - 1;
      }
      return prevState;
    });
  };

  // Landing doesnt have any results on query + EventAttendee query parameter is not valid
  if (
    isLandingLoading(loading, landing, attendeeParam, eventAttendee) ||
    isCheckingSession(loading, landing, authStatus)
  ) {

    return <FullScreenLoader label={ui.loading} />;
  }

  // Landing is deactivated (o el evento ya no existe)
  if (notFound || isLandingDeactivated(loading, landing, authStatus)) {
    return (
      <div className="fixed bottom-0 left-0 right-0 top-0 z-50 flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-lightPrimary p-3">
        <img src={logo} alt="USFQ Logo" className="w-[80px] mb-3 md:w-[90px] lg:w-[150px]" />
        <h2 className="mb-2 text-center text-xl font-semibold text-black">
          {ui.eventNotActive}
        </h2>
      </div>
    );
  }

  // ── Rediseño 2026-10 ──────────────────────────────────────────────────
  // Hero con el banner cubriendo TODO el bloque (object-cover, alto fijo) y el
  // texto sobre un degradado oscuro a la izquierda para que se lea. Debajo, una tarjeta
  // blanca con fecha/ubicación/CTA que se superpone al hero, y el cuerpo
  // "Sobre el evento" con una columna de detalles sin viñetas.
  const bannerSrc = resolveBannerSrc(landing);
  const bannerVariants = landing.mainBanner ? initialData?.images?.[landing.mainBanner] : null;
  const { venue, venueDetail } = splitLocation(translated.location);
  const startIso = event?.startDate || event?.date;
  const heroDate = startIso ? longDate(startIso, lang, eventTz) : "";
  const heroTime = timeRange(startIso, event?.endDate, lang, eventTz);
  const tagline = firstSentence(translated.extraInfo);
  const isFree = landing.cost === "Gratuito";
  // En móvil fecha y lugar ya van en la tarjeta: la columna de detalles solo aparece si suma algo
  const hasAsideExtras = (!isFree && tickets.length > 0) || Boolean(event?.contactTemplate);
  const seatsNote = isFree
    ? [ui.freeEntry, typeof event?.maxRegs === "number" ? ui.limitedSeats : null].filter(Boolean).join(" · ")
    : null;

  const onReserve = () => {
    if (isSubeventLanding && cardsRef.current) {
      cardsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      setShowRegister(true);
    }
  };

  return (
    <>
      {/* Cabecera blanca: logo · web oficial · ES/EN */}
      <div className="flex h-[70px] md:h-[84px] w-full bg-white border-b border-gray-100 relative">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-5">
          <img src={logo} alt="USFQ Logo" className="w-[120px] sm:w-[150px] md:w-[180px] lg:w-[200px]" />
          <div className="flex items-center gap-3 md:gap-5">
            <Link
              to="https://www.usfq.edu.ec/es"
              className="flex items-center gap-1.5 whitespace-nowrap text-sm font-medium text-navy-700 hover:text-brand-500 hover:no-underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="hidden sm:inline">{ui.officialWeb}</span>{" "}
              <FiExternalLink className="h-4 w-4" />
            </Link>

            {/* Selector de idioma: píldora con el activo en negro */}
            <div className="flex items-center rounded-full border border-gray-200 bg-white p-1" role="group" aria-label="Idioma">
              {["ES", "EN"].map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => changeLang(code)}
                  aria-label={code === "ES" ? "Español" : "English"}
                  aria-pressed={lang === code}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                    lang === code
                      ? "bg-black text-white"
                      : "text-gray-600 hover:text-navy-700"
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {landing && (
        <section className="relative w-full overflow-hidden bg-black">
          {/* Banner en modo "cover": llena todo el bloque del hero (alto fijo
              relativo al viewport) sin bandas; se recorta lo que sobre. */}
          {/* Variantes AVIF/WebP del banner generadas en el build (solo landings
              estáticas y mientras el banner no cambie); si no hay, el original. */}
          <picture className="contents">
            {bannerVariants?.avif && <source type="image/avif" srcSet={bannerVariants.avif} sizes="100vw" />}
            {bannerVariants?.webp && <source type="image/webp" srcSet={bannerVariants.webp} sizes="100vw" />}
            <img
              className="relative block h-[52vh] min-h-[360px] max-h-[760px] w-full object-cover object-center md:h-[62vh] md:min-h-[460px]"
              src={bannerSrc}
              alt="Banner"
              fetchpriority="high"
              decoding="async"
            />
          </picture>
          {/* Overlay: degradado oscuro en el lado del texto para garantizar contraste */}
          <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-black/80 via-black/40 to-transparent md:block" aria-hidden="true" />
          {/* Móvil: degradado de abajo hacia arriba, el texto va anclado al pie del banner */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/5 md:hidden" aria-hidden="true" />

          <div className="absolute inset-x-0 bottom-0 flex px-5 pb-12 pt-10 md:hidden">
            <div className="w-full text-white">
              {translated.description && (
                <p
                  className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/85"
                  dangerouslySetInnerHTML={{ __html: translated.description }}
                />
              )}
              <h1 className="text-[32px] font-bold leading-[1.08] [text-shadow:0_2px_12px_rgba(0,0,0,.5)]">
                {translated.title}
              </h1>
            </div>
          </div>

          <div className="absolute inset-0 hidden md:flex items-center">
            <div className="mx-auto w-full max-w-[1200px] px-6">
              <div className="max-w-[560px] text-white">
                {translated.description && (
                  <p
                    className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-white/90"
                    dangerouslySetInnerHTML={{ __html: translated.description }}
                  />
                )}
                <h1 className="text-[40px] font-bold leading-[1.05] md:text-[56px] lg:text-[64px] [text-shadow:0_2px_16px_rgba(0,0,0,.45)]">
                  {translated.title}
                </h1>
                {tagline && <p className="mt-5 max-w-[520px] text-lg text-white/85">{tagline}</p>}
              </div>
            </div>
          </div>
        </section>
      )}

      {landing && (
        <div className="mx-auto w-full max-w-[1200px] px-3 pb-24 md:px-5 md:pb-12">
          <div
            ref={registerRef}
            className={`${showRegister ? "block animate-fade-in" : "hidden"} px-2 pt-8 md:px-0`}
          >
            {registroMounted && (
              <React.Suspense
                fallback={
                  <div className="flex flex-col items-center justify-center py-16">
                    <span className="loader" />
                    <p className="text-base text-gray-600">{ui.loadingForm}</p>
                  </div>
                }
              >
                <Registro
                  landing={landing}
                  event={event}
                  initialForm={form}
                  showRegister={showRegister}
                  setShowRegister={setShowRegister}
                  userData={userData}
                  setUserData={setUserData}
                  quantityProp={ticketsQuantity}
                  price={selectedCost}
                  eventID={id}
                  eventAttendeeProp={eventAttendee}
                  lang={lang}
                />
              </React.Suspense>
            )}
          </div>

          <div className={`${showRegister ? "hidden" : "block animate-fade-in"}`}>
            {/* Tarjeta de datos clave: se superpone al borde inferior del hero */}
            <section
              ref={detailsRef}
              aria-label={ui.eventDetails}
              className="relative z-10 -mt-5 grid grid-cols-1 overflow-hidden rounded-2xl bg-white shadow-[0_12px_40px_rgba(0,0,0,.10)] md:-mt-16 md:grid-cols-3"
            >
              <h2 className="sr-only">{ui.eventDetails}</h2>

              <div className="flex items-start gap-3 border-b border-gray-100 px-4 py-4 md:gap-4 md:border-b-0 md:border-r md:p-6">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-brand-500 md:h-12 md:w-12 md:rounded-xl">
                  <LuCalendarClock className="h-[18px] w-[18px] md:h-6 md:w-6" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-600">{ui.dateAndTime}</p>
                  {eventDateEnd ? (
                    <p className="mt-1 text-base text-navy-700">
                      <span className="font-semibold">{ui.start}:</span> {eventDate}
                      <br />
                      <span className="font-semibold">{ui.end}:</span> {eventDateEnd}
                    </p>
                  ) : (
                    <>
                      <p className="mt-0.5 text-base font-bold leading-snug text-navy-700 md:mt-1 md:text-xl">{heroDate || eventDate}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600 md:text-base">
                        {heroTime.label && <span>{heroTime.label}</span>}
                        <span className="inline-flex items-center whitespace-nowrap rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-navy-700">
                          {eventTzLabel}
                        </span>
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3 border-b border-gray-100 px-4 py-4 md:gap-4 md:border-b-0 md:border-r md:p-6">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700 md:h-12 md:w-12 md:rounded-xl">
                  <LuMapPin className="h-[18px] w-[18px] md:h-6 md:w-6" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-600">{ui.location}</p>
                  <p className="mt-0.5 text-base font-bold leading-snug text-navy-700 md:mt-1 md:text-xl">{venue}</p>
                  {venueDetail && <p className="mt-0.5 text-sm text-gray-600 md:mt-1 md:text-base">{venueDetail}</p>}
                </div>
              </div>

              <div className="px-4 py-4 md:p-6">
                <h3 className="text-base font-bold text-navy-700 md:text-lg">
                  {isSubeventLanding ? ui.selectActivity : ui.confirmAttendance}
                </h3>

                {/* Selector de entrada y cantidad: solo eventos de pago */}
                {!isSubeventLanding && !isFree && (
                  <>
                    <div className="mt-3 flex w-full items-center justify-between gap-3">
                      <select
                        className="select-arrow w-full appearance-none text-ellipsis rounded-xl border border-gray-200 bg-white py-2.5 pl-3 pr-[40px] text-navy-700 outline-none focus:border-brand-500"
                        onChange={(e) => setSelectedCost(e.target.value)}
                      >
                        {tickets.map((result, i) => (
                          <option key={`${result.title}-${result.cost}`} value={result.cost}>
                            {translated[`ticket_${i}`] || result.title}
                          </option>
                        ))}
                      </select>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={quantityDecrementHandler}
                          aria-label="Menos"
                          className="rounded-lg bg-gray-100 p-2 text-gray-600 transition hover:bg-gray-200"
                        >
                          <MinusIcon className="text-base" />
                        </button>
                        <div className="flex min-w-[25px] items-center justify-center text-xl font-semibold">
                          {ticketsQuantity}
                        </div>
                        <button
                          type="button"
                          onClick={quantityIncrementHandler}
                          aria-label="Más"
                          className="rounded-lg bg-gray-100 p-2 text-gray-600 transition hover:bg-gray-200"
                        >
                          <PlusIcon />
                        </button>
                      </div>
                    </div>
                    <p className="mt-3 text-xl font-semibold text-navy-700">
                      {selectedCost !== null
                        ? `$${(selectedCost * ticketsQuantity).toFixed(2)}`
                        : ui.empty}{" "}
                      <span className="text-[15px] font-normal text-gray-600">{ui.plusTax}</span>
                    </p>
                  </>
                )}

                <div className="mt-3">
                  <ReserveCta
                    isSoldOut={isSoldOut}
                    isSubeventLanding={isSubeventLanding}
                    ui={ui}
                    onReserve={onReserve}
                  />
                </div>
                {seatsNote && <p className="mt-2 text-sm text-gray-600">{seatsNote}</p>}
              </div>
            </section>

            {isSubeventLanding && (
              <>
                <h2 ref={cardsRef} className="mt-12 mb-5 text-[28px] font-bold text-navy-700 md:text-4xl">{ui.registerInActivity}</h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {subeventos.map((evento) => (
                    <a
                      key={evento.id}
                      href={`/landing/${evento.id}`}
                      className="group block rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:no-underline"
                    >
                      <div className="flex h-full flex-col justify-between">
                        <h3 className="text-xl font-semibold text-navy-700 transition-colors group-hover:text-brand-500">
                          {evento.title}
                        </h3>
                        <p className="mt-2 text-sm text-gray-600">{ui.clickForMore}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </>
            )}

            {/* Cuerpo: descripción larga + columna de detalles */}
            <div className="mt-8 grid grid-cols-1 gap-8 px-2 md:mt-12 md:gap-10 md:px-0 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <h2 className="text-2xl font-bold text-navy-700 md:text-4xl">{ui.about}</h2>
                {landing.extraInfo && landing.extraInfo.trim().length > 0 ? (
                  <div className="mt-4 space-y-4 text-base leading-relaxed text-gray-600 md:mt-5 md:text-[17px]">
                    {paragraphs(translated.extraInfo).map((para) => (
                      <p key={para.slice(0, 40)}>{para}</p>
                    ))}
                  </div>
                ) : (
                  <div
                    className="mt-5 text-[17px] leading-relaxed text-gray-600 [&_a]:font-medium [&_a]:text-brand-500 [&_a]:underline"
                    dangerouslySetInnerHTML={{ __html: translated.description || "" }}
                  />
                )}
                {translated.customHtml && String(translated.customHtml).trim().length > 0 && (
                  <div
                    className="landing-custom-html mt-5 text-[17px] break-words [overflow-wrap:anywhere] [&_a]:font-medium [&_a]:text-brand-500 [&_a]:underline"
                    dangerouslySetInnerHTML={{ __html: translated.customHtml }}
                  />
                )}
              </div>

              <aside className={`${hasAsideExtras ? "" : "hidden lg:block"} lg:col-span-2`}>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-600">{ui.details}</p>
                <div className="mt-3 flex flex-col gap-3">
                  {/* Sin viñetas: cada dato es una tarjeta limpia */}
                  <div className="hidden rounded-2xl border border-gray-200 bg-white px-5 py-4 lg:block">
                    <p className="text-lg font-bold text-navy-700">{ui.dateAndTime}</p>
                    <p className="mt-0.5 text-base text-gray-600">
                      {eventDateEnd ? `${eventDate} — ${eventDateEnd}` : eventDate}
                    </p>
                  </div>
                  <div className="hidden rounded-2xl border border-gray-200 bg-white px-5 py-4 lg:block">
                    <p className="text-lg font-bold text-navy-700">{ui.location}</p>
                    <p className="mt-0.5 text-base text-gray-600">{translated.location}</p>
                  </div>
                  {!isFree && tickets.length > 0 && (
                    <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4">
                      <p className="text-lg font-bold text-navy-700">{ui.tickets}</p>
                      {tickets.map((t, i) => (
                        <p key={`${t.title}-${t.cost}`} className="mt-0.5 text-base text-gray-600">
                          {translated[`ticket_${i}`] || t.title} · ${t.cost}
                        </p>
                      ))}
                    </div>
                  )}
                  {event?.contactTemplate && (
                    <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4">
                      <p className="text-lg font-bold text-navy-700">{ui.contact}</p>
                      <p className="mt-0.5 text-base text-gray-600">{event.contactTemplate}</p>
                    </div>
                  )}
                </div>
              </aside>
            </div>

            {/* Galería + logos de aliados */}
            <div className="px-2 md:px-0">
              <LandingExtras landing={landing} ui={ui} />
            </div>
          </div>
        </div>
      )}

      {/* Móvil: CTA fija abajo para reservar sin volver a subir */}
      {landing && !showRegister && isSoldOut === false && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,.08)] backdrop-blur md:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-navy-700">{translated.title}</p>
              {heroDate && (
                <p className="truncate text-xs text-gray-600">
                  {heroDate}{heroTime.start ? ` · ${heroTime.start}` : ""}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onReserve}
              className="shrink-0 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-black"
            >
              {isSubeventLanding ? ui.seeActivities : ui.bookTicket}
            </button>
          </div>
        </div>
      )}

      {showExpiredPopup && (
        <div className="px-4 fixed inset-0 z-[999] flex items-center justify-center backdrop-blur-sm bg-black/60 transition-all duration-300">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full text-center animate-fade-in">
            <div className="flex justify-center mb-4">
              <svg className="w-12 h-12 text-brand-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold text-gray-800 mb-2">{ui.eventFinished}</h2>
            <p className="text-md text-gray-600 mb-4 px-2">{ui.dateUnavailable}</p>
          </div>
        </div>
      )}
    </>
  );
}
