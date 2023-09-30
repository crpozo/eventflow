import React, { useState, useEffect } from "react";
import logo from "assets/img/usfq/logo.svg";
import { useParams, Link } from "react-router-dom";
import Registro from "./registro/index";
import { DataStore } from "aws-amplify";
import { StorageImage } from "@aws-amplify/ui-react-storage";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { Landing, Event } from "models";
import { FiExternalLink } from "react-icons/fi";
import { LuCalendarClock } from "react-icons/lu";
import { BsPlusLg as PlusIcon } from "react-icons/bs";
import {
  AiOutlineMinus as MinusIcon,
  AiOutlineExclamationCircle as ExclaimationCircle,
} from "react-icons/ai";
import { API, graphqlOperation } from "aws-amplify";

export default function SignIn() {
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);
  const { id } = useParams();
  const [landing, setLanding] = React.useState([]);
  const [event, setEvent] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [tickets, setTickets] = React.useState([]);
  const [userData, setUserData] = useState([]);
  const [ticketsQuantity, setTicketsQuantity] = useState(1);
  const [selectedCost, setSelectedCost] = React.useState(null);
  const [showRegister, setShowRegister] = React.useState(false); // Add a loading state

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

  useEffect(() => {
    console.log(ticketsQuantity);
  }, [ticketsQuantity]);

  React.useEffect(() => {
    const subEvent = DataStore.observeQuery(Event, (e) =>
      e.id.eq(id)
    ).subscribe((results) => {
      if (results.items.length > 0) {
        setEvent(results.items[0]);
        console.log(results.items[0]);
      }
    });

    return () => {
      subEvent.unsubscribe();
    };
  }, []);

  React.useEffect(() => {
    const sub = DataStore.observeQuery(Landing, (l) =>
      l.landingEventId.eq(id)
    ).subscribe((results) => {
      if (results.items.length > 0) {
        setLanding(results.items[0]);
        console.log("Landing: ", results.items);
        const tickets = results.items[0].ticketTitle.map((title, index) => {
          const cost =
            results.items[0].ticketPrice[index] !== undefined
              ? `$${results.items[0].ticketPrice[index].toFixed(2)}`
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
    });

    return () => {
      sub.unsubscribe();
    };
  }, []);

  function formatDate(inputDate) {
    const daysOfWeek = [
      "Domingo",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
    ];
    const months = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];

    const date = new Date(inputDate);
    const dayOfWeek = daysOfWeek[date.getUTCDay()];
    const month = months[date.getUTCMonth()];
    const day = date.getUTCDate();
    const year = date.getUTCFullYear();
    let hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const ampm = hours >= 12 ? "pm" : "am";

    if (hours > 12) {
      hours -= 12;
    }

    hours = hours < 10 ? "0" + hours : hours;
    const formattedMinutes = minutes < 10 ? "0" + minutes : minutes;

    return `${dayOfWeek}, ${("0" + day).slice(-2)}/${(
      "0" +
      (date.getUTCMonth() + 1)
    ).slice(-2)}/${year} - ${hours}:${formattedMinutes} ${ampm}`;
  }

  if (loading && landing.length === 0) {
    return (
      <div className="fixed bottom-0 left-0 right-0 top-0 z-50 flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-lightPrimary opacity-75">
        <div className="loader mb-4 h-16 w-16 rounded-full border-4 border-t-4 border-gray-200 ease-linear"></div>
        <h2 className="mb-2 text-center text-xl font-semibold text-black">
          Cargando...
        </h2>
        <p className="w-1/3 text-center text-black">
          Esto puede tardar unos segundos, por favor no cierre esta página.
        </p>
      </div>
    );
  }

  if (landing && !landing.active && authStatus == "unauthenticated") {
    return (
      <div className="fixed bottom-0 left-0 right-0 top-0 z-50 flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-lightPrimary">
        <h2 className="mb-2 text-center text-xl font-semibold text-black">
          El evento no se encuentra activo...
        </h2>
        {/* <p className="w-1/3 text-center text-black">Por favor comunicarse con el administrador</p> */}
      </div>
    );
  }

  // if(landing.length === 0 ){
  //   return (
  //   <div className="flex h-screen">
  //     <div className="m-auto">
  //       <h1 className="text-xl">No existe una landing page con el id: {id}</h1>
  //     </div>
  //   </div>
  //   );
  // }

  return (
    <>
      <div className="flex h-[140px] w-full bg-usfqPrimary">
        <div className="container flex items-center justify-between">
          <img src={logo} className="w-[120px]" />
          <Link
            to="https://www.usfq.edu.ec/es"
            className="flex items-center gap-2 hover:text-red-500 hover:no-underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Ir a página oficial USFQ <FiExternalLink className="h-5 w-5" />
          </Link>
        </div>
      </div>

      {landing && (
        <div className="absolute w-full">
          <StorageImage
            className="md: !min-h-[400px] !w-full !object-cover md:!max-h-[500px]"
            alt="banner"
            imgKey={landing.mainBanner}
            accessLevel="public"
            onStorageGetError={(error) => console.error(error)}
          />
        </div>
      )}

      <div className="container relative mb-[200px] mt-[75px] sm:mt-[100px] xl:mt-[120px]">
        <div className="flex flex-col items-center justify-center gap-4 bg-blackBanner px-4 py-4 md:!h-[250px] md:max-w-[500px] md:!py-[40px]">
          <p className="border-b-2 border-solid pb-2 font-bold text-white md:text-2xl">
            {landing.title}
          </p>
          <p className="text-center leading-7 leading-none text-white md:text-lg">
            {landing.description}
          </p>
        </div>
      </div>

      <div className="container mx-auto mb-16 h-full w-full items-center justify-center px-2 md:px-0 lg:mb-10 lg:items-center lg:justify-start">
        {showRegister ? (
          <>
            <Registro
              landing={landing}
              setShowRegister={setShowRegister}
              userData={userData}
              setUserData={setUserData}
              quantity={ticketsQuantity}
              eventID={id}
            />
          </>
        ) : (
          <>
            <div className="mb-[60px] border-b border-gray-300 pb-[60px]">
              <h2 className="mb-5 text-4xl font-bold">Dónde y cuándo</h2>

              <div className="grid grid-cols-1 md:grid-cols-3">
                <div className="flex items-center gap-5">
                  <LuCalendarClock className="h-8 w-8 min-w-[31px]" />
                  <div>
                    <h3 className="text-lg font-bold">Fecha y hora</h3>
                    {event && (
                      <p className="text-lg">{formatDate(event.date)}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-center gap-6">
                  <LuCalendarClock className="h-8 w-8 min-w-[31px]" />
                  <div>
                    <h3 className="text-lg font-bold">Ubicación</h3>
                    <p className="text-lg">{landing.location}</p>
                  </div>
                </div>
                {/* Checkout  */}
                <div className="mx-auto flex w-full max-w-[450px] flex-col justify-center rounded-md border border-gray-500 p-4">
                  <div className="mb-3 flex w-full items-center justify-between gap-5">
                    <select
                      className="select-arrow w-full max-w-[280px] appearance-none text-ellipsis rounded-md border bg-white py-2.5 pl-3 pr-[40px] text-black shadow-sm	outline-none focus:border-indigo-600"
                      onChange={(e) => {
                        setSelectedCost(e.target.value);
                      }}
                    >
                      {tickets &&
                        tickets.map((result, i) => (
                          <option key={i} value={result.cost}>
                            {result.title}
                          </option>
                        ))}
                    </select>
                    {/* Ticket Quantity => Increment / Decrement Boxes  */}

                    <div className="flex shrink-0 items-center justify-between gap-3">
                      <div
                        onClick={quantityDecrementHandler}
                        className="cursor-pointer rounded-lg bg-[#D9D9D9] bg-opacity-70 p-[6px] text-[#A6A6A6]"
                      >
                        <MinusIcon className="text-base" />
                      </div>
                      <div className="text-xl font-semibold">
                        {ticketsQuantity}
                      </div>
                      <div
                        onClick={quantityIncrementHandler}
                        className="cursor-pointer rounded-lg bg-[#D9D9D9] bg-opacity-70 p-[6px] text-[#A6A6A6]"
                      >
                        <PlusIcon className="cursor-pointer" />
                      </div>
                    </div>
                  </div>
                  <p className="mb-3 text-xl font-bold">
                    {selectedCost !== null ? selectedCost : "Vacio"}
                  </p>
                  {/* => Button  */}
                  <button
                    href="crear"
                    onClick={() => setShowRegister(true)}
                    className="linear text-md flex w-full items-center justify-center gap-1 rounded-xl bg-red-500 py-[12px] pl-3 pr-3 font-medium text-white transition duration-200 hover:bg-black"
                  >
                    Reserver un lugar
                  </button>
                </div>
                {/* Checkout  */}
                {/* <div className="mx-auto flex w-full max-w-[450px] flex-col justify-center gap-4 rounded-xl border border-gray-500 p-4">
                  <div className="flex w-full flex-col items-center justify-start gap-4 rounded-[10px] border-2 border-solid border-blue-700 p-3">
                    <div className="flex w-full items-start justify-between gap-5">
                      <div className="text-left text-base font-semibold">
                        CriptoPro Business Seminar Ecuador
                      </div>
                      <div className="flex shrink-0 items-center justify-between gap-3">
                        <div
                          onClick={quantityDecrementHandler}
                          className="cursor-pointer rounded-lg bg-[#D9D9D9] bg-opacity-70 p-[6px] text-[#A6A6A6]"
                        >
                          <MinusIcon className="text-base" />
                        </div>
                        <div className="text-xl font-semibold">
                          {ticketsQuantity}
                        </div>
                        <div
                          onClick={quantityIncrementHandler}
                          className="cursor-pointer rounded-lg bg-[#D9D9D9] bg-opacity-70 p-[6px] text-[#A6A6A6]"
                        >
                          <PlusIcon className="cursor-pointer" />
                        </div>
                      </div>
                    </div>
                    <div className="flex w-full items-center justify-start gap-2">
                      <div className="text-left text-base font-semibold">
                        {" "}
                        Gratis
                      </div>
                      <ExclaimationCircle className="text-lg text-blue-700" />
                    </div>
                  </div>
                  <button
                    href="crear"
                    onClick={() => {
                      setShowRegister(true);
                    }}
                    className="linear text-md flex w-full items-center justify-center gap-1 rounded-md bg-red-500 py-[12px] pl-3 pr-3 font-medium text-white transition duration-200 hover:bg-black"
                  >
                    Reservar un lugar
                  </button>
                </div> */}
              </div>
            </div>

            <div className="mb-[80px]">
              <h2 className="mb-5 text-4xl font-bold">Informacion adicional</h2>
              <p className="text-lg">{landing.extraInfo}</p>
            </div>

            <Link className="mb-2 flex justify-center text-center text-lg hover:no-underline">
              Necesitas ayuda?
            </Link>
          </>
        )}
      </div>
    </>
  );
}
