import React from "react";
import logo from "assets/img/usfq/logo.png";
import InputField from "components/fields/InputField";
import { FcGoogle } from "react-icons/fc";
import Checkbox from "components/checkbox";
import { useParams, Link } from "react-router-dom";
import { DataStore } from "aws-amplify";
import { StorageImage } from '@aws-amplify/ui-react-storage';
import { Landing } from "models";

export default function SignIn() {

  const { id } = useParams();
  const [landing, setLanding] = React.useState(null);
  const [loading, setLoading] = React.useState(true); // Add a loading state

  React.useEffect(() => {

    console.log(id)
    
    
    // DataStore.query(Event, (e) => e.id.eq(eventId)).then( results => {
    //   setEvent(results[0]);
    //   console.log("Event: ", results)
    // });

    DataStore.query(Landing, (l) => l.landingEventId.eq(id)).then( results => {
      if (results.length > 0) {
        setLanding(results[0]);
        console.log("Landing: ", results)
        setLoading(false); 
      }
    });

  }, []);

  if (loading) {
    return (
      <div className="fixed top-0 left-0 right-0 bottom-0 w-full h-screen z-50 overflow-hidden bg-lightPrimary opacity-75 flex flex-col items-center justify-center">
        <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-16 w-16 mb-4"></div>
        <h2 className="text-center text-black text-xl font-semibold mb-2">Cargando...</h2>
        <p className="w-1/3 text-center text-black">Esto puede tardar unos segundos, por favor no cierre esta página.</p>
      </div>
    );
  }

  if(!landing ){
    return (
    <div class="flex h-screen">
      <div class="m-auto">
        <h1 className="text-xl">No existe una landing page con el id: {id}</h1>
      </div>
    </div>
    );
  }

  return (
    
    <>
      <div className="w-full h-[140px] bg-usfqPrimary flex">
        <div className="container flex justify-between items-center">
          <img src={logo} />
          <Link to="https://www.usfq.edu.ec/es" target="_blank" rel="noopener noreferrer">  Ir a página oficial USFQ</Link>
        </div>
      </div>
    
      <StorageImage 
        className="!w-full !max-h-[500px] !object-cover"
        alt="banner" 
        imgKey={landing.mainBanner} 
        accessLevel="public"
        onStorageGetError={(error) => console.error(error)}
      />

      <div className="container">
        <p className="text-3xl font-bold">{landing.title}</p>
        <p className="text-2xl mb-10 leading-none">{landing.description}</p>
        <a href="#" className="bg-purple-800 py-4 px-8 text-white font-bold uppercase text-xs rounded hover:bg-gray-200 hover:text-gray-800">Contact us</a>
      </div>  

      <div className="container mt-16 mb-16 h-full w-full items-center justify-center px-2 mx-auto md:px-0 lg:mb-10 lg:items-center lg:justify-start">
      
        donde y cuando

        informacion adicional

      </div>
    </>
  );
}
