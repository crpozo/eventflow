import React, { useState, useMemo } from "react";
import logo from "assets/img/usfq/logo_2025.png";
import bgPlaceholder from "assets/img/usfq/bg-placeholder.webp";
import { useParams, Link, useNavigate } from "react-router-dom";
import Registro from "./registro/index";
import { formatDateHour, formatHour } from 'scripts/utils';
import { useAwsTranslation} from 'scripts/useAwsTranslation';
import { getLandingUI } from 'scripts/landingTranslations';
import LandingExtras from './components/LandingExtras';
import { useAuthenticator } from "@aws-amplify/ui-react";
import { FiExternalLink } from "react-icons/fi";
import { LuCalendarClock, LuMapPin } from "react-icons/lu";
import { IoTicketOutline } from "react-icons/io5";
import { BsPlusLg as PlusIcon } from "react-icons/bs";
import {
  AiOutlineMinus as MinusIcon,
} from "react-icons/ai";
/* GRAPHQL */
import { generateClient } from 'aws-amplify/api';
import { getEvent, listLandings, eventAttendeesIdsByEventID, getEventAttendee } from '../../graphql/queries';

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

  // Dynamic, user-generated content translated on the fly via Amazon Translate.
  const baseTexts = useMemo(() => {
    // Multi-day: prefer startDate/endDate range, fall back to legacy single date.
    const startIso = event?.startDate || event?.date;
    const endIso = event?.endDate;
    let eventDate = startIso ? formatDateHour(startIso) : "";
    if (startIso && endIso) {
      const sameDay =
        new Date(endIso).toDateString() === new Date(startIso).toDateString();
      if (sameDay) {
        // Same calendar day: append only the end time, without repeating the
        // weekday/date. Skip it when the end time equals the start time.
        const endHour = formatHour(endIso);
        if (endHour && endHour !== formatHour(startIso)) {
          eventDate = `${formatDateHour(startIso)} — ${endHour}`;
        }
      } else {
        // Spans multiple days: show the full end date and time.
        eventDate = `${formatDateHour(startIso)} — ${formatDateHour(endIso)}`;
      }
    }
    const texts = {
      title: landing?.title || "",
      description: landing?.description || "",
      location: landing?.location || "",
      extraInfo: landing?.extraInfo || "",
      eventDate,
    };
    // Ticket titles are created per-landing, so translate each one.
    (landing?.ticketTitle || []).forEach((title, i) => {
      texts[`ticket_${i}`] = title || "";
    });
    return texts;
  }, [landing, event?.date, event?.startDate, event?.endDate]);

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
    const currentUuidMatch = currentUrl.match(uuidRegex);
    const currentUuid = currentUuidMatch ? currentUuidMatch[1] : null;
    // Check if the user is on the specific UUID
    if (currentUuid === targetUuid) {
      setIsSubeventLanding(true); 
    }

    getLandingEventGraphql();
   
    async function getLandingEventGraphql() {

      // Fetch the event and its landing concurrently. The landing FK lives on
      // the Landing side (landingEventId), so Event.Landing does not resolve and
      // it must be looked up via listLandings. Running both in parallel saves one
      // cross-region round-trip vs the previous sequential awaits.
      const [resultEvent, resultLanding] = await Promise.all([
        client.graphql({ query: getEvent, variables: { id: id } }),
        client.graphql({
          query: listLandings,
          variables: { filter: { landingEventId: { eq: id } } },
        }),
      ]);

      if (resultEvent.data.getEvent) {
        const ev = resultEvent.data.getEvent;
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
  if ((loading && landing && landing.length === 0) || (searchParams.get('EventAttendee') && !eventAttendee && eventAttendee !== false)) {

    return (
      <div className="fixed inset-0 z-50 flex top-[-10px] min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-lightPrimary p-3">
        <span className="loader"></span>
        <h2 className="mb-2 text-center text-xl text-black">
          {ui.loading}
        </h2>
      </div>
    );
  }

  // Landing is deactivated
  if (!loading && landing.active === false && authStatus === "unauthenticated") {
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
  if (searchParams.get('EventAttendee') && eventAttendee === false) {
    searchParams.delete('EventAttendee');
    window.history.replaceState({}, '', `${url.origin}${url.pathname}`);
  }

  return (
    <>
      <div className="flex h-[70px] md:h-[90px] w-full bg-usfqPrimary relative">
        <div className="container flex items-center justify-between px-4">
          <img src={logo} alt="USFQ Logo" className="w-[120px] sm:w-[150px] md:w-[180px] lg:w-[200px]" />
          <div className="flex items-center gap-2 md:gap-4">
            <Link
              to="https://www.usfq.edu.ec/es"
              className="flex items-center gap-2 whitespace-nowrap md:min-w-[185px] hover:text-red-500 hover:no-underline text-sm"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="hidden sm:inline">{ui.officialWeb}</span>{" "}
              <FiExternalLink className="h-4 w-4" />
            </Link>

            {/* Separator */}
            <span className="h-5 w-px bg-black/20" aria-hidden="true" />

            {/* Language switcher (ES / EN) */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => changeLang("ES")}
                aria-label="Español"
                title="Español"
                className={`flex items-center gap-1 px-1 py-1 rounded select-none outline-none focus:outline-none focus-visible:outline-none transition-opacity duration-200 ${
                  lang === "ES" ? "opacity-100" : "opacity-40 hover:opacity-100"
                }`}
              >
                <span className="text-xl leading-none">🇲🇽</span>
                <span className="text-xs font-semibold">ES</span>
              </button>
              <button
                type="button"
                onClick={() => changeLang("EN")}
                aria-label="English"
                title="English"
                className={`flex items-center gap-1 px-1 py-1 rounded select-none outline-none focus:outline-none focus-visible:outline-none transition-opacity duration-200 ${
                  lang === "EN" ? "opacity-100" : "opacity-40 hover:opacity-100"
                }`}
              >
                <span className="text-xl leading-none">🇺🇸</span>
                <span className="text-xs font-semibold">EN</span>
              </button>
            </div>
          </div>
        </div>
      </div>


      {landing && (
        <div className="relative w-full">
          {landing.mainBanner ? (
            <img
              className="min-h-[320px] md:min-h-[400px] w-full object-cover md:max-h-[400px]"
              src={`https://dnuc5lxyun5b.cloudfront.net/public/${landing.mainBanner}`}
              alt="Banner"
              fetchpriority="high"
              decoding="async"
            />
          ) : (
            <img
              className="min-h-[320px] md:min-h-[400px] w-full object-cover md:max-h-[400px]"
              src={bgPlaceholder}
              alt="Banner"
              fetchpriority="high"
              decoding="async"
            />
          )}

          <div className="container absolute inset-0 flex items-center justify-center md:justify-start">
            <div className="flex flex-col items-center justify-center gap-4 rounded-xl bg-black/50 backdrop-blur-md px-3 py-3 lg:max-w-[43%] xl:max-w-[40%] md:!pb-[25px] md:!pt-[25px]">
              <h1 className="font-bold text-center text-white text-[28px] md:text-[40px] w-full">
                {translated.title}
              </h1>
            </div>
          </div>

        </div>
      )}
      {/* Conditionals ==> Register for event +  Checkout and event details*/}
      {landing && 
        <div
          className={`sm:px-2! container mt-[35px] mx-auto mb-12 md:mb-15 h-full w-full items-center justify-center px-4 md:px-0 lg:mb-11 lg:items-center lg:justify-start`}
        >
          <div
            className={` ${
              showRegister ? "block" : "hidden"
            } transition-all duration-300`}
          >
            <Registro
              landing={landing}
              event={event}
              showRegister = { showRegister }
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
            <div
              className={` mb-[40px] border-b border-gray-300 pb-[30px] md:pb-[40px] transition-all duration-300`}
            >
              <h2 className="pt-2 md:pt-0 mb-3 lg:!mb-6 text-[28px] md:text-4xl font-bold">{ui.eventDetails}</h2>

              <div className="grid grid-cols-1 items-start gap-7 sm:gap-5 lg:grid-cols-3">
                <div className="flex items-center gap-5 lg:col-span-1">
                  <div>
                    {event && <p className="text-md">{translated.description}</p>}
                  </div>
                </div>
                <div className="flex flex-col lg:items-start gap-5 lg:ml-[40px] mt-auto mb-auto lg:col-span-1">
                  <div className="flex gap-3">
                    <LuCalendarClock className="h-8 w-8 min-w-[31px]" />
                    <div>
                      <h3 className="text-lg font-bold">{ui.dateAndTime}</h3>
                      {event && <p className="text-md">{translated.eventDate}</p>}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <LuMapPin className="h-9 w-9 min-w-[31px]" />
                    <div>
                      <h3 className="text-lg font-bold">{ui.location}</h3>
                      <p className="text-md max-w-[300px]">{translated.location}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-6 LG:ml-5 lg:ml-[-25px]">
                    <IoTicketOutline className="h-10 w-10 min-w-[31px] hidden lg:block" />
                  <div className="flex-grow">
                    <h3 className="text-lg font-bold mb-2 hidden lg:block">
                      {isSubeventLanding ? ui.selectActivity : ui.confirmAttendance}
                    </h3>

                    <div className={`mx-auto flex w-full min-w-full flex-col justify-center rounded-md
                      ${landing.cost !== 'Gratuito' && !isSubeventLanding ? '' : ''}`}>

                      {/* Solo muestra selector de precio y cantidad si no es subevento */}
                      {!isSubeventLanding && landing.cost !== 'Gratuito' && (
                        <>
                          <div className="mb-3 flex w-full justify-between gap-5 sm:flex-row sm:items-center">
                            <select
                              className="select-arrow w-full md:max-w-[300px] appearance-none text-ellipsis rounded-md border bg-white py-2.5 pl-3 pr-[40px] text-black shadow-sm outline-none focus:border-indigo-600"
                              onChange={(e) => {
                                setSelectedCost(e.target.value);
                              }}
                            >
                              {tickets.map((result, i) => (
                                <option key={i} value={result.cost}>
                                  {translated[`ticket_${i}`] || result.title}
                                </option>
                              ))}
                            </select>

                            <div className="flex shrink-0 items-center gap-2 sm:justify-between">
                              <button
                                onClick={quantityDecrementHandler}
                                className="cursor-pointer rounded-lg bg-[#ebebeb] bg-opacity-70 p-[8px] text-[#A6A6A6] focus:outline-none hover:bg-[#D9D9D9]"
                              >
                                <MinusIcon className="text-base" />
                              </button>
                              <div className="flex min-w-[25px] items-center justify-center text-xl font-semibold">
                                {ticketsQuantity}
                              </div>
                              <button
                                onClick={quantityIncrementHandler}
                                className="cursor-pointer rounded-lg bg-[#ebebeb] bg-opacity-70 p-[8px] text-[#A6A6A6] focus:outline-none hover:bg-[#D9D9D9]"
                              >
                                <PlusIcon className="cursor-pointer" />
                              </button>
                            </div>
                          </div>

                          <p className="mb-3 text-xl font-semibold">
                            {selectedCost !== null
                              ? `$${(selectedCost * ticketsQuantity).toFixed(2)}`
                              : ui.empty}{" "}
                            <span className="text-[15px] font-normal text-[#717171]">{ui.plusTax}</span>
                          </p>
                        </>
                      )}

                      {/* Botón */}
                      <div className="flex items-center">
                        {isSoldOut === null ? (
                          <div className="flex justify-center items-center gap-2 text-gray-600 text-sm">
                            <span className="loader-small animate-spin rounded-full border-2 border-gray-300 border-t-red-500 h-7 w-7"></span>
                          </div>
                        ) : isSoldOut ? (
                          <span className="text-red-600 font-bold py-2">{ui.soldOut}</span>
                        ) : (
                          <button
                            onClick={() => {
                              if (isSubeventLanding && cardsRef.current) {
                                cardsRef.current.scrollIntoView({
                                  behavior: "smooth",
                                  block: "start",
                                });
                              } else {
                                setShowRegister(true);
                              }
                            }}
                            className="flex w-full max-w-full md:max-w-[250px] items-center justify-center gap-1 rounded-xl bg-red-500 py-[10px] px-3 font-medium text-white transition duration-200 hover:bg-black"
                          >
                            {isSubeventLanding ? ui.seeActivities : ui.bookTicket}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {isSubeventLanding && (
              <>
                <h2 ref={cardsRef} className="pt-2 md:pt-0 mb-5 md:!mb-3 text-[28px] md:text-4xl font-bold">{ui.registerInActivity}</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-10">
                  {subeventos.map((evento) => (
                    <a
                      key={evento.id}
                      href={`/landing/${evento.id}`}
                      className="group block transform rounded-xl border border-gray-300 bg-white p-5 shadow-md transition duration-300 hover:scale-105 hover:shadow-xl hover:no-underline"
                    >
                      <div className="flex h-full flex-col justify-between">
                        <h3 className="text-xl font-semibold text-gray-800 group-hover:text-red-500 transition-colors duration-200">
                          {evento.title}
                        </h3>
                        <p className="mt-2 text-sm text-gray-600">{ui.clickForMore}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </>
            )}

            {landing.extraInfo && landing.extraInfo.trim().length > 0 && (
              <div className="mb-[40px] md:mb-[45px]">
                <h2 className="mb-[35px] text-[28px] md:text-4xl font-bold">{ui.additionalNotes}</h2>
                <p className="text-[16px] md:text-lg">{translated.extraInfo}</p>
              </div>
            )}

            {/* Gallery + custom HTML + partner logos carousel (below event details) */}
            <LandingExtras landing={landing} ui={ui} />

            {/* <Link to="mailto:sd@usfq.edu.ec" className="mb-2 flex justify-center text-center text-lg hover:text-red-500">
              ¿Requiere soporte?
            </Link> */}
          </div>
        </div>
      }

      {showExpiredPopup && (
        <div className="px-4 fixed inset-0 z-[999] flex items-center justify-center backdrop-blur-sm bg-black/60 transition-all duration-300">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full text-center animate-fade-in">
            <div className="flex justify-center mb-4">
              <svg
                className="w-12 h-12 text-red-500"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold text-gray-800 mb-2">{ui.eventFinished}</h2>
            <p className="text-md text-gray-600 mb-4 px-2">
              {ui.dateUnavailable}
            </p>
          </div>
        </div>
      
      )}

    </>
  );
}
