import React, { useState, useMemo } from "react";
import logo from "assets/img/usfq/logo_2025.png";
import bgPlaceholder from "assets/img/usfq/bg-placeholder.webp";
import { useParams, Link, useNavigate } from "react-router-dom";
import Registro from "./registro/index";
import { formatDateHour, formatHour, tzCityLabel } from 'scripts/utils';
import { useAwsTranslation} from 'scripts/useAwsTranslation';
import { getLandingUI } from 'scripts/landingTranslations';
import LandingExtras from './components/LandingExtras';
import { FullScreenLoader } from "components/adminUi";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { FiExternalLink } from "react-icons/fi";
import { LuCalendarClock, LuMapPin } from "react-icons/lu";
import { BsPlusLg as PlusIcon } from "react-icons/bs";
import {
  AiOutlineMinus as MinusIcon,
} from "react-icons/ai";
/* GRAPHQL */
import { generateClient } from 'aws-amplify/api';
import { getEvent, listLandings, eventAttendeesIdsByEventID, getEventAttendee } from '../../graphql/queries';

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
  const sameDay = startIso && endIso &&
    new Date(startIso).toDateString() === new Date(endIso).toDateString();
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

export default function SignIn() {
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);
  const { id, lang: langParam } = useParams();
  const navigate = useNavigate();
  // Language can come from the URL (/landing/:id/en) so links are shareable per
  // language; otherwise fall back to the last choice or Spanish.
  const [lang, setLang] = useState(() => {
    if (langParam) return langParam.toLowerCase() === "en" ? "EN" : "ES";
    return localStorage.getItem("landingLang") || "ES";
  });
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
  const [landing, setLanding] = React.useState([]);
  const [event, setEvent] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [tickets, setTickets] = React.useState([]);
  const [userData, setUserData] = useState([]);
  const [ticketsQuantity, setTicketsQuantity] = useState(1);
  const [selectedCost, setSelectedCost] = React.useState(null);
  const [showRegister, setShowRegister] = React.useState(false);
  const [eventAttendee, setEventAttendee] = useState(null);
  const searchParams = new URLSearchParams(document.location.search);
  const url = new URL(window.location.href);
  const client = generateClient(); 
  const [showExpiredPopup, setShowExpiredPopup] = useState(false);
  const [isSoldOut, setIsSoldOut] = useState(null);
  
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
      const sameDay =
        new Date(endIso).toDateString() === new Date(startIso).toDateString();
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
  const [isSubeventLanding, setIsSubeventLanding] = React.useState(false);
  const cardsRef = React.useRef(null);
  const subeventos = [
    { id: "939722b8-9169-47c7-9cfc-64f8a40e0bd4", title: "Cardio en Clave Tropical" },
    { id: "79123410-02da-487a-b26f-101c181aee88", title: "¿Y si no era por Ahí?" },
    { id: "0174b708-bc60-4f40-b925-65ab2ba66807", title: "Aguanta que viene el giro" },
    { id: "219a2ee6-896b-4c46-8119-badd8e25d381", title: "Crêpe Diem" }
  ];

  // Get Landing + Event in GRAPHQL
  React.useEffect(() => {

    const currentUrl = window.location.href;
    // UUID you want to detect
    const targetUuid = "bb85f39d-8300-4ada-ab70-c2b70cfc4b0b";
    // Regular expression to extract the UUID after "/landing/"
    const uuidRegex = /\/landing\/([0-9a-fA-F-]+)(\/|$)/;
    // Extract the UUID from the current URL
    const currentUuidMatch = uuidRegex.exec(currentUrl);
    const currentUuid = currentUuidMatch ? currentUuidMatch[1] : null;
    // Check if the user is on the specific UUID
    if (currentUuid === targetUuid) {
      setIsSubeventLanding(true); 
    }

    getLandingEventGraphql();

    // Reintento acotado: sin él, un error transitorio de AppSync (throttling,
    // red) rechaza el Promise.all sin handler y la landing pública se queda en
    // el loader infinito.
    async function getLandingEventGraphql(attempt = 0) {
      try {
        await loadLandingEvent();
      } catch (e) {
        console.error("landing: fallo cargando evento/landing", e);
        if (attempt < 2) {
          setTimeout(() => getLandingEventGraphql(attempt + 1), 2500);
        }
      }
    }

    async function loadLandingEvent() {

      // Fetch the event and its landing concurrently. The landing FK lives on
      // the Landing side (landingEventId), so Event.Landing does not resolve and
      // it must be looked up via listLandings. Running both in parallel saves one
      // cross-region round-trip vs the previous sequential awaits.
      // El getEvent GENERADO (queries.js) es anterior a los campos de
      // certificado y no selecciona sendCertificates. En vez de un segundo
      // round-trip, se inyecta el campo en la MISMA query (tras la llave de
      // apertura, independiente de la lista de campos); si el texto generado
      // cambiara de forma, cae al original y el flag queda false.
      const getEventWithCertFlag = getEvent.includes("sendCertificates")
        ? getEvent
        : getEvent.replace(
            /getEvent\(id: \$id\) \{/,
            "getEvent(id: $id) {\n      sendCertificates"
          );
      const [resultEvent, resultLanding] = await Promise.all([
        client.graphql({ query: getEventWithCertFlag, variables: { id: id } }),
        client.graphql({
          query: listLandings,
          variables: { filter: { landingEventId: { eq: id } } },
        }),
      ]);

      if (resultEvent.data.getEvent) {
        const ev = {
          ...resultEvent.data.getEvent,
          sendCertificates:
            resultEvent.data.getEvent.sendCertificates ?? false,
        };
        setEvent(ev);

        const landingItem = resultLanding?.data?.listLandings?.items?.[0];
        if (landingItem) {
          setLanding(landingItem);
          // Format price ticket
          const tickets = landingItem.ticketTitle.map((title, index) => {
            const cost =
              landingItem.ticketPrice[index] !== undefined
                ? `${landingItem.ticketPrice[index].toFixed(2)}`
                : "Vacio";
            if (index === 0) setSelectedCost(cost);
            return {
              title,
              cost,
            };
          });
          setTickets(tickets);
          setLoading(false);
        }

        // Sold-out check: only relevant when a cap (maxRegs) is set. Count by
        // paging an id-only projection (no PII) and stop as soon as we reach the
        // cap — avoids pulling the entire attendee table on this public page.
        const maxRegs = ev.maxRegs;
        if (typeof maxRegs === "number") {
          try {
            let nextToken = null;
            let count = 0;
            do {
              const resp = await client.graphql({
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
            setIsSoldOut(count >= maxRegs);
          } catch (error) {
            console.error("Error validating maxRegs:", error);
            setIsSoldOut(false);
          }
        } else {
          setIsSoldOut(false);
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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

    if(searchParams.get('EventAttendee')){
      getEventAttendeeGraphql();
    }

    async function getEventAttendeeGraphql() {

      const resultEventAttendee = await client.graphql({ 
        query: getEventAttendee,
        variables: { id: searchParams.get('EventAttendee') } 
      });

      if(resultEventAttendee.data.getEventAttendee){
        setEventAttendee(resultEventAttendee.data.getEventAttendee)
      } else {
        setEventAttendee(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get('EventAttendee')]);

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
  if (isLandingLoading(loading, landing, searchParams.get('EventAttendee'), eventAttendee)) {

    return <FullScreenLoader label={ui.loading} />;
  }

  // Landing is deactivated
  if (isLandingDeactivated(loading, landing, authStatus)) {
    return (
      <div className="fixed bottom-0 left-0 right-0 top-0 z-50 flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-lightPrimary p-3">
        <img src={logo} alt="USFQ Logo" className="w-[80px] mb-3 md:w-[90px] lg:w-[150px]" />
        <h2 className="mb-2 text-center text-xl font-semibold text-black">
          {ui.eventNotActive}
        </h2>
      </div>
    );
  }

  // If eventAttendee doesnt exist remove the query parameter
  if (hasInvalidAttendeeParam(searchParams.get('EventAttendee'), eventAttendee)) {
    searchParams.delete('EventAttendee');
    window.history.replaceState({}, '', `${url.origin}${url.pathname}`);
  }

  // ── Rediseño 2026-10 ──────────────────────────────────────────────────
  // Hero con el banner COMPLETO a todo el ancho (el alto sigue su proporción,
  // sin recorte) y el texto sobre un degradado oscuro a la izquierda para que
  // se lea. Debajo, una tarjeta
  // blanca con fecha/ubicación/CTA que se superpone al hero, y el cuerpo
  // "Sobre el evento" con una columna de detalles sin viñetas.
  const bannerSrc = resolveBannerSrc(landing);
  const { venue, venueDetail } = splitLocation(translated.location);
  const startIso = event?.startDate || event?.date;
  const heroDate = startIso ? longDate(startIso, lang, eventTz) : "";
  const heroTime = timeRange(startIso, event?.endDate, lang, eventTz);
  const tagline = firstSentence(translated.extraInfo);
  const isFree = landing.cost === "Gratuito";
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
                  className={`rounded-full px-3 py-1 text-xs font-bold transition ${
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
          {/* Banner a TODO el ancho: el alto sigue la proporción de la imagen, así
              se ve entera (sin recortar ni bandas laterales). */}
          <img
            className="relative block h-auto w-full"
            src={bannerSrc}
            alt="Banner"
            fetchpriority="high"
            decoding="async"
          />
          {/* Overlay: degradado oscuro en el lado del texto para garantizar contraste */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" aria-hidden="true" />

          <div className="absolute inset-0 hidden md:flex items-center">
            <div className="mx-auto w-full max-w-[1200px] px-6">
              <div className="max-w-[560px] text-white">
                {translated.description && (
                  <p className="mb-4 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-white/90">
                    <span className="h-[3px] w-8 rounded-full bg-brand-500" aria-hidden="true" />
                    <span dangerouslySetInnerHTML={{ __html: translated.description }} />
                  </p>
                )}
                <h1 className="text-[40px] font-bold leading-[1.05] md:text-[56px] lg:text-[64px] [text-shadow:0_2px_16px_rgba(0,0,0,.45)]">
                  {translated.title}
                </h1>
                {tagline && <p className="mt-5 max-w-[520px] text-lg text-white/85">{tagline}</p>}
                <div className="mt-7 flex flex-wrap items-center gap-4">
                  {isSoldOut === false && (
                    <button
                      type="button"
                      onClick={onReserve}
                      className="rounded-xl bg-brand-500 px-6 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-black"
                    >
                      {isSubeventLanding ? ui.seeActivities : ui.bookTicket}
                    </button>
                  )}
                  {heroDate && (
                    <span className="text-base font-semibold text-white/90">
                      {heroDate}{heroTime.start ? ` · ${heroTime.start}` : ""}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* En móvil el hero no lleva texto encima (taparía la imagen): va debajo */}
      {landing && (
        <div className="mx-auto w-full max-w-[1200px] px-5 pt-6 md:hidden">
          {translated.description && (
            <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-brand-500">
              <span className="h-[3px] w-6 rounded-full bg-brand-500" aria-hidden="true" />
              <span dangerouslySetInnerHTML={{ __html: translated.description }} />
            </p>
          )}
          <h1 className="text-[34px] font-bold leading-tight text-navy-700">{translated.title}</h1>
          {tagline && <p className="mt-3 text-base text-gray-600">{tagline}</p>}
        </div>
      )}

      {landing && (
        <div className="mx-auto w-full max-w-[1200px] px-5 pb-12">
          <div className={`${showRegister ? "block" : "hidden"} pt-8 transition-all duration-300`}>
            <Registro
              landing={landing}
              event={event}
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
          </div>

          <div className={`${showRegister ? "hidden" : "block"}`}>
            {/* Tarjeta de datos clave: se superpone al borde inferior del hero */}
            <section
              aria-label={ui.eventDetails}
              className="relative z-10 mt-6 grid grid-cols-1 overflow-hidden rounded-2xl bg-white shadow-[0_12px_40px_rgba(0,0,0,.10)] md:-mt-16 md:grid-cols-3"
            >
              <h2 className="sr-only">{ui.eventDetails}</h2>

              <div className="flex gap-4 border-b border-gray-100 p-6 md:border-b-0 md:border-r">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-brand-500">
                  <LuCalendarClock className="h-6 w-6" />
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
                      <p className="mt-1 text-xl font-bold text-navy-700">{heroDate || eventDate}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-2 text-base text-gray-600">
                        {heroTime.label && <span>{heroTime.label}</span>}
                        <span className="inline-flex items-center whitespace-nowrap rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-navy-700">
                          {eventTzLabel}
                        </span>
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-4 border-b border-gray-100 p-6 md:border-b-0 md:border-r">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                  <LuMapPin className="h-6 w-6" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-600">{ui.location}</p>
                  <p className="mt-1 text-xl font-bold text-navy-700">{venue}</p>
                  {venueDetail && <p className="mt-1 text-base text-gray-600">{venueDetail}</p>}
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-lg font-bold text-navy-700">
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
            <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <h2 className="text-[28px] font-bold text-navy-700 md:text-4xl">{ui.about}</h2>
                {landing.extraInfo && landing.extraInfo.trim().length > 0 ? (
                  <div className="mt-5 space-y-4 text-[17px] leading-relaxed text-gray-600">
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

              <aside className="lg:col-span-2">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-600">{ui.details}</p>
                <div className="mt-3 flex flex-col gap-3">
                  {/* Sin viñetas: cada dato es una tarjeta limpia */}
                  <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4">
                    <p className="text-lg font-bold text-navy-700">{ui.dateAndTime}</p>
                    <p className="mt-0.5 text-base text-gray-600">
                      {eventDateEnd ? `${eventDate} — ${eventDateEnd}` : eventDate}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4">
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
            <LandingExtras landing={landing} ui={ui} />
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
