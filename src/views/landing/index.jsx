import React from "react";
import logo from "assets/img/usfq/logo.svg";
import { useParams, Link } from "react-router-dom";
import Registro from "./registro/index"
import { DataStore } from "aws-amplify";
import { StorageImage } from '@aws-amplify/ui-react-storage';
import { Landing } from "models";
import {
  FiExternalLink,
} from "react-icons/fi";
import {
  LuCalendarClock,
} from "react-icons/lu";

export default function SignIn() {

  const { id } = useParams();
  const [landing, setLanding] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [tickets, setTickets] = React.useState([]); 
  const [selectedCost, setSelectedCost] = React.useState(null);
  const [showRegister, setShowRegister] = React.useState(false); // Add a loading state

  React.useEffect(() => {

    console.log(id)
    
    
    // DataStore.query(Event, (e) => e.id.eq(eventId)).then( results => {
    //   setEvent(results[0]);
    //   console.log("Event: ", results)
    // });

    DataStore.query(Landing, (l) => l.landingEventId.eq(id)).then( results => {
      console.log(landing.length)
      if (results.length > 0) {
        setLanding(results[0]);
        console.log("Landing: ", results)
        const tickets = results[0].ticketTitle.map( (title, index) => {
          const cost = results[0].ticketPrice[index] !== undefined ? `$${results[0].ticketPrice[index].toFixed(2)}` : 'Vacio';
          if(index == 0) setSelectedCost(cost)
          return {
            title,
            cost
          }
        })
        
        setTickets(tickets)
        setLoading(false); 
      } 
    });

  }, []);

  if (loading && landing.length !== 0) {
    return (
      <div className="fixed top-0 left-0 right-0 bottom-0 w-full h-screen z-50 overflow-hidden bg-lightPrimary opacity-75 flex flex-col items-center justify-center">
        <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-16 w-16 mb-4"></div>
        <h2 className="text-center text-black text-xl font-semibold mb-2">Cargando...</h2>
        <p className="w-1/3 text-center text-black">Esto puede tardar unos segundos, por favor no cierre esta página.</p>
      </div>
    );
  }

  if(landing.length === 0 ){
    return (
    <div className="flex h-screen">
      <div className="m-auto">
        <h1 className="text-xl">No existe una landing page con el id: {id}</h1>
      </div>
    </div>
    );
  }

  return (
    
    <>
      <div className="w-full h-[140px] bg-usfqPrimary flex">
        <div className="container flex justify-between items-center">  
          <img src={logo} className="w-[120px]"/>
          <Link to="https://www.usfq.edu.ec/es"  className="flex items-center gap-2 hover:no-underline hover:text-red-500" target="_blank" rel="noopener noreferrer">  
            Ir a página oficial USFQ  <FiExternalLink className="h-5 w-5" />
          </Link>
        </div>
      </div>
    
      <div className="absolute w-full">
        <StorageImage 
          className="!w-full !min-h-[400px] md: md:!max-h-[500px] !object-cover"
          alt="banner" 
          imgKey={landing.mainBanner} 
          accessLevel="public"
          onStorageGetError={(error) => console.error(error)}
        />
      </div>

      <div className="container mb-[200px] relative mt-[75px] sm:mt-[100px] xl:mt-[120px]">
        <div className="md:max-w-[500px] md:!h-[250px] bg-blackBanner flex flex-col justify-center items-center gap-4 px-4 py-4 md:!py-[40px]">
          <p className="md:text-2xl font-bold text-white border-solid border-b-2 pb-2">{landing.title}</p>
          <p className="md:text-lg leading-none text-white text-center leading-7">{landing.description}</p>
        </div>  
      </div>
      
      <div className="container mb-16 h-full w-full items-center justify-center px-2 mx-auto md:px-0 lg:mb-10 lg:items-center lg:justify-start">

      {showRegister ?
          <>
            <Registro landing={landing} setShowRegister={setShowRegister}/>
          </>
        :
          <>
          <div className="border-b border-gray-300 pb-[60px] mb-[60px]">
            <h2 className="text-4xl font-bold mb-5">Dónde y cuándo</h2>

            <div className="grid grid-cols-1 md:grid-cols-3">
              <div className="flex items-center gap-5">
                <LuCalendarClock className="h-8 min-w-[31px] w-8" />
                <div>
                  <h3 className="text-lg font-bold">Fecha y hora</h3>
                  <p className="text-lg">Viernes, Junio 16/06/2023 - 18:00pm</p>
                </div>
              </div>
              <div className="flex justify-center items-center gap-6">
                <LuCalendarClock className="h-8 min-w-[31px] w-8" />
                <div>
                  <h3 className="text-lg font-bold">Ubicación</h3>
                  <p className="text-lg">{landing.location}</p>
                </div>
              </div>
              <div className="w-full max-w-[450px] flex flex-col justify-center border border-gray-500 rounded-md p-4 mx-auto">
                <div className="w-full flex justify-between items-center gap-5 mb-3">
                  <select
                      className="w-full max-w-[300px] py-2.5 pl-3 pr-[40px] text-black bg-white border rounded-md shadow-sm outline-none appearance-none text-ellipsis	focus:border-indigo-600 select-arrow"
                      onChange={(e) => {
                        setSelectedCost(e.target.value);
                      }}
                    >
                      {tickets && tickets.map((result,i) => (
                          <option key={i} value={result.cost}>
                            {result.title}
                          </option>
                      ))}
                  </select>
                  <p className="text-xl font-bold">
                    {selectedCost !== null ? selectedCost : "Vacio"} {/* Mostrar el costo seleccionado */}
                  </p>
                </div>
                <button href="crear" onClick={() => {
                  setShowRegister(true)
                }}
                className="w-full linear flex justify-center items-center gap-1 pr-3 pl-3 rounded-xl bg-red-500 py-[12px] text-md font-medium text-white transition duration-200 hover:bg-black">
                  Checkout
                </button>
              </div>
            </div>
          </div>

          <div className="mb-[80px]">
            <h2 className="text-4xl font-bold mb-5">Informacion adicional</h2>
            <p className="text-lg">{landing.extraInfo}</p>
          </div>

          <Link className="flex justify-center text-lg text-center mb-2 hover:no-underline">Necesitas ayuda?</Link>

          </>
      }
      </div>
    </>
  );
}
