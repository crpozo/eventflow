import React, { useState, useMemo } from "react";
import logo from "assets/img/usfq/logo_2025.png";
import bgPlaceholder from "assets/img/usfq/bg-placeholder.png";
import { useParams, Link } from "react-router-dom";
import Registro from "./registro/index";
import { formatDateHour} from 'scripts/utils';
import { useDeepLTranslation} from 'scripts/useDeepLTranslation';
import { useAuthenticator } from "@aws-amplify/ui-react";
import { FiExternalLink } from "react-icons/fi";
import { LuCalendarClock, LuMapPin, LuInfo } from "react-icons/lu";
import { IoTicketOutline } from "react-icons/io5";
import { BsPlusLg as PlusIcon } from "react-icons/bs";
import {
  AiOutlineMinus as MinusIcon,
} from "react-icons/ai";
/* GRAPHQL */
import { generateClient } from 'aws-amplify/api';
import { DataStore } from "aws-amplify/datastore";
import { getEvent, listLandings, eventAttendeesByEventID ,getEventAttendee } from '../../graphql/queries';
import { EventAttendee } from "models";

export default function SignIn() {
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);
  const [lang, setLang] = useState("ES");
  const { id } = useParams();
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
  const [isSoldOut, setIsSoldOut] = useState(false);
  
  // Translations

  const baseTexts = useMemo(() => ({
    title: landing?.title || "",
    description: landing?.description || "",
    place: landing?.place || "",
    eventDate: landing?.start ? formatDateHour(landing.start) : "",
  }), [landing?.title, landing?.description, landing?.place, landing?.start]);

  const translated = useDeepLTranslation(baseTexts, lang);

  // Generate landing cards
  const [isSubeventLanding, setIsSubeventLanding] = React.useState(false);
  const cardsRef = React.useRef(null);
  const subeventos = [
    { id: "364f6cfb-16a6-4f10-839f-e606df7b5537", title: "Wok This Way" },
    { id: "5eef9fae-24f6-49a5-871c-b84f381ce975", title: "La Ruta del Baguette Perdido" },
    { id: "da0fea1e-7517-4c62-97c4-970cc448ad9b", title: "Ni tan arroz, ni tan fideo" },
    { id: "c8df1315-8a36-43f1-ab5a-89f8a21b72b4", title: "El Llamado de la Masa" },
    { id: "219a2ee6-896b-4c46-8119-badd8e25d381", title: "Crêpe Diem" },
    { id: "91327434-221e-4e2f-82fa-41fdf5e69a93", title: "Maestros del Fuego" },
    { id: "60ab0461-3802-4816-af77-b29aaaced2c4", title: "Tejiendo Fuego" },
    { id: "939722b8-9169-47c7-9cfc-64f8a40e0bd4", title: "Cardio en Clave Tropical" },
    { id: "88bc02e3-2162-4892-96b7-f0df45153efd", title: "Jamming" },
    { id: "674989ad-f5f0-4e9d-a1c5-916c825f24fd", title: "¡Ven a Champagnear!" },
    { id: "79123410-02da-487a-b26f-101c181aee88", title: "¿Y si no era por Ahí?" },
    { id: "e67b8d27-2c63-407e-a139-beba70669b3a", title: "Los Hilos del Destino" },
    { id: "62f0cc8b-9abf-4b73-9976-bd9dfaeff7fc", title: "Campo de Batalla: Estacionamiento USFQ" },
    { id: "3a6a2bfa-24d5-44df-a883-d376649b27c8", title: "El Arte de Mover el Aire" },
    { id: "2960f399-7f97-4f2e-bdb2-5ab4ccdc3e58", title: "Nada por aquí, mucho por allá" },
    { id: "8bed927b-afb0-4aff-adeb-0c1691da51c9", title: "Clown" },
    { id: "0174b708-bc60-4f40-b925-65ab2ba66807", title: "Aguanta que viene el giro" },
    { id: "7f702324-9813-4074-a2b7-70cc1f612af1", title: "¡No es el filtro, soy yo!" },
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

      const resultEvent = await client.graphql({ 
        query: getEvent,
        variables: { id: id } 
      });

      const resultLanding = await client.graphql({ 
        query: listLandings,
        variables: {
          filter: {
            landingEventId: {
              eq: id
            }
          }
        }
      });

      if(resultEvent.data.getEvent){

        setEvent(resultEvent.data.getEvent);

        if(resultLanding.data.listLandings.items[0]){

          setLanding(resultLanding.data.listLandings.items[0])
          // Format price ticket
          const tickets = resultLanding.data.listLandings.items[0].ticketTitle.map((title, index) => {
            const cost =
            resultLanding.data.listLandings.items[0].ticketPrice[index] !== undefined
                ? `${resultLanding.data.listLandings.items[0].ticketPrice[index].toFixed(2)}`
                : "Vacio";
            if (index == 0) setSelectedCost(cost);
            return {
              title,
              cost,
            };
          });
          setTickets(tickets);
          setLoading(false);
        }

        try {
          const resultAttendees = await client.graphql({
            query: eventAttendeesByEventID,
            variables: {
              eventID: id,
              filter: {
                _deleted: { ne: true }
              }
            }
          });
        
          const items = resultAttendees?.data?.eventAttendeesByEventID?.items || [];
          const currentRegs = Array.isArray(items) ? items.length : 0;
          const maxRegs = resultEvent?.data?.getEvent?.maxRegs;
        
          if (typeof maxRegs === 'number' && currentRegs >= maxRegs) {
            setIsSoldOut(true);
          }
        } catch (error) {
          console.error("Error fetching event attendees or validating maxRegs:", error);
        }

      }
    }

  }, [id]);

  // Verify if date is expired to show a popup message
  React.useEffect(() => {
    if (event && typeof event.date === 'string') {
      const eventDate = new Date(event.date);
      const now = new Date();
  
      const hoursDiff = (now - eventDate) / (1000 * 60 * 60);
  
      if (hoursDiff > 24) {
        setShowExpiredPopup(true);
      }
    }
  }, [event?.date]);

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
  if (loading && landing && landing.length === 0 || searchParams.get('EventAttendee') && !eventAttendee && eventAttendee != false) {

    return (
      <div className="fixed inset-0 z-50 flex top-[-10px] min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-lightPrimary p-3">
        <span className="loader"></span>
        <h2 className="mb-2 text-center text-xl text-black">
          Cargando...
        </h2>
      </div>
    );
  }

  // Landing is deactivated 
  if (!loading && landing.active == false && authStatus == "unauthenticated") {
    return (
      <div className="fixed bottom-0 left-0 right-0 top-0 z-50 flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-lightPrimary p-3">
        <img src={logo} className="w-[80px] mb-3 md:w-[90px] lg:w-[150px]" />
        <h2 className="mb-2 text-center text-xl font-semibold text-black">
          El evento no se encuentra activo
        </h2>
      </div>
    );
  }

  // If eventAttendee doesnt exist remove the query parameter
  if (searchParams.get('EventAttendee') && eventAttendee == false) {
    searchParams.delete('EventAttendee');
    window.history.replaceState({}, '', `${url.origin}${url.pathname}`);
  }

  return (
    <>
      <div className="flex h-[70px] md:h-[90px] w-full bg-usfqPrimary relative">
        <div className="container flex items-center justify-between">
          <img src={logo} className="w-[150px] md:w-[180px] lg:w-[200px]" />
          <Link
            to="https://www.usfq.edu.ec/es"
            className="flex items-center gap-2 hover:text-red-500 hover:no-underline text-sm"
            target="_blank"
            rel="noopener noreferrer"
          >
            Web oficial USFQ <FiExternalLink className="h-4 w-4" />
          </Link>
        </div>
        {/* <div className=" absolute top-[5px] right-[120px] flex gap-1 items-center mr-[-20px]">
          <button onClick={() => setLang("ES")} className="pr-2 py-1">
            🇪🇸
          </button>
          <button onClick={() => setLang("EN")} className="pr-2 py-1">
            🇺🇸
          </button>
        </div> */}
      </div>


      {landing && (
        <div className="relative w-full">
          {landing.mainBanner ? (
            <img
              className="min-h-[320px] md:min-h-[400px] w-full object-cover md:max-h-[400px]"
              src={`https://dnuc5lxyun5b.cloudfront.net/public/${landing.mainBanner}`}
              alt="Banner"
            />
          ) : (
            <img
              className="min-h-[320px] md:min-h-[400px] w-full object-cover md:max-h-[400px]"
              src={bgPlaceholder}
              alt="Banner"
            />
          )}

          <div className="container absolute inset-0 flex items-center justify-center md:justify-start">
            <div className="flex flex-col items-center justify-center gap-4 rounded-lg bg-black/50 backdrop-blur-md px-3 py-3 lg:max-w-[43%] xl:max-w-[40%] md:!pb-[25px] md:!pt-[25px]">
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
            />

          </div>
          <div className={`${showRegister ? "hidden" : "block"}`}>
            <div
              className={` mb-[40px] border-b border-gray-300 pb-[30px] md:pb-[40px] transition-all duration-300`}
            >
              <h2 className="pt-2 md:pt-0 mb-3 lg:!mb-6 text-[28px] md:text-4xl font-bold">Detalles del evento</h2>

              <div className="grid grid-cols-1 items-start gap-7 sm:gap-5 lg:grid-cols-3">
                <div className="flex items-center gap-5 lg:col-span-1">
                  <div>
                    {event && <p className="text-md">{landing.description}</p>}
                  </div>
                </div>
                <div className="flex flex-col lg:items-start gap-5 lg:ml-[60px] mt-auto mb-auto lg:col-span-1">
                  <div className="flex gap-3">
                    <LuCalendarClock className="h-8 w-8 min-w-[31px]" />
                    <div>
                      <h3 className="text-lg font-bold">Fecha y hora</h3>
                      {event && <p className="text-md">{formatDateHour(event.date)}</p>}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <LuMapPin className="h-9 w-9 min-w-[31px]" />
                    <div>
                      <h3 className="text-lg font-bold">Ubicación</h3>
                      <p className="text-md max-w-[300px]">{landing.location}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-6 LG:ml-5 lg:ml-[-25px]">
                    <IoTicketOutline className="h-10 w-10 min-w-[31px] hidden lg:block" />
                  <div className="flex-grow">
                    <h3 className="text-lg font-bold mb-2 hidden lg:block">
                      {isSubeventLanding ? "Selecciona un evento" : "Confirma tu asistencia"}
                    </h3>

                    <div className={`mx-auto flex w-full min-w-full flex-col justify-center rounded-md
                      ${landing.cost !== 'Gratuito' && !isSubeventLanding ? 'border border-gray-500' : ''}`}>

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
                                  {result.title}
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
                              : "Vacío"}{" "}
                            <span className="text-[15px] font-normal text-[#717171]">+ IVA</span>
                          </p>
                        </>
                      )}

                      {/* Botón */}
                      <div className="flex">
                        {isSoldOut ? (
                          <span className="text-red-600 font-bold py-2">Entradas Agotadas</span>
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
                            {isSubeventLanding ? "Ver eventos" : "Reservar ticket"}
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
                <h2 ref={cardsRef} className="pt-2 md:pt-0 mb-5 md:!mb-3 text-[28px] md:text-4xl font-bold">Regístrate en una actividad</h2>

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
                        <p className="mt-2 text-sm text-gray-600">Haz clic para más detalles</p>
                      </div>
                    </a>
                  ))}
                </div>
              </>
            )}

            {landing.extraInfo && landing.extraInfo.trim().length > 0 && (
              <div className="mb-[40px] md:mb-[45px]">
                <h2 className="mb-[35px] text-[28px] md:text-4xl font-bold">Notas adicionales</h2>
                <p className="text-[16px] md:text-lg">{landing.extraInfo}</p>
              </div>
            )}

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
            <h2 className="text-2xl font-extrabold text-gray-800 mb-2">Evento finalizado!</h2>
            <p className="text-md text-gray-600 mb-4 px-2">
              Esta fecha ya no está disponible.
            </p>
          </div>
        </div>
      
      )}

    </>
  );
}
