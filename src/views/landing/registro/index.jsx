import React, {
  Component,
  createRef,
  useRef,
} from "react";
import logo from "assets/img/usfq/logo.svg";
import QRCode from "react-qr-code";
import domtoimage from "dom-to-image";
import html2pdf from "html2pdf.js";
import { useParams, Link } from "react-router-dom";
import { HiOutlineDocumentText } from "react-icons/hi";
import { MdChevronLeft } from "react-icons/md";
import { DataStore } from "aws-amplify";
import { Form } from "models";
import $, { event } from "jquery";
import { Attendee, EventAttendee } from "models";
import { validateForm, formatSpanishDate } from "scripts/utils"

window.jQuery = $;
window.$ = $;
require("jquery-ui-sortable");
require("formBuilder");
require("formBuilder/dist/form-render.min.js");

const Registro = (props) => {
  const { userData, setUserData, quantityProp, price, eventID, setShowRegister, event } = props;
  const [formData, setFormData] = React.useState([]);
  const [eventAttendee, setEventAttende] = React.useState(null);
  const [authorized, setAuthorized] = React.useState(false);
  const [trs, setTrs] = React.useState(null);
  const [formRegister, setFormRegister] = React.useState(false);
  const [quantity, setQuantity] = React.useState(quantityProp);
  const [ticketsArray, setTicketsArray] = React.useState(Array.from({ length: quantity }, (_, index) => index));

  const currentUrl = window.location.href;
  const domain = new URL(currentUrl).origin;
  const id = useParams().id;
  const searchParams = new URLSearchParams(document.location.search);
  let eventAttendeeDataStore = null;
  const pdfContentRef = useRef();

  class FormBuilder extends Component {
    fb = createRef();
    componentDidMount() {
      $(this.fb.current).formRender({
        dataType: "json",
        formData,
      });
    }

    render() {
      return <div id="fb-editor" ref={this.fb} />;
    }
  }

  React.useEffect(() => {
    if(searchParams.get('EventAttendee')){
      DataStore.query(EventAttendee,searchParams.get('EventAttendee')).then(results => {
        if(results){
          console.log("get query and search ",results)
          setEventAttende(results)
          setFormRegister(true)
          setShowRegister(true)
          setUserData(results.formAnswers)
          setQuantity(results.quantity);
          setTicketsArray(Array.from({ length: results.quantity }, (_, index) => index));
        } 
      });
    }
  }, []);

  React.useEffect(() => {
    // AWS amplify data
    DataStore.query(Form, (c) => c.formEventId.eq(id)).then((results) => {
      if (results.length > 0) {
        setFormData(results[0].questions);
      } else {
        console.log("No form data found");
      }
    });
  }, [id]);

  React.useEffect(() => {
    if(eventAttendee 
      && eventAttendee.id 
      && eventAttendeeDataStore == null){

      eventAttendeeDataStore = DataStore.observeQuery(EventAttendee, (e) =>
      e.id.eq(eventAttendee.id)
      ).subscribe((results) => {
        if(results.items.length > 0){
          setEventAttende(results.items[0])
          setAuthorized(results.items[0].authorized)
        }
      });
    }

    if(authorized){
      eventAttendeeDataStore?.unsubscribe();
    }

  }, [formRegister]);
   
  
  React.useEffect(() => {
    if (authorized) {
      handleExport();
    }
  }, [authorized]);

  React.useEffect( () => {
    if(trs && eventAttendee){
      if(domain.includes("eventflow")){
        window.location.href = `
        https://btnpagos.usfq.edu.ec/pagos/TIPO_TARJETA.ASPX?orgname=5&TRS=${trs}
      `;  
      } else {
        window.location.href = `
        https://btnpagos.usfq.edu.ec/pagosx/TIPO_TARJETA.ASPX?orgname=5&TRS=${trs}
      `; 
      }
     
    }
  }, [trs, eventAttendee])

  if (!formData) {
    return <p>Loading...</p>;
  }

  const getTokenFinancial = async () => {
    try {
      const response = await fetch(
        "https://bvq7tg35iuv6lbgndbqbwwhgim0mpnum.lambda-url.sa-east-1.on.aws/"
      );
      if (!response.ok) {
        throw new Error(`HTTPS error! Status: ${response.status}`);
      }
      const responseData = await response.json();
      return responseData.access_token;
    } catch (err) {
      console.log("getTokenFinancial: ", err);
    }
  };

  const postRegistroFinanciero = async (data, accessToken) => {
    try {

      const response = await fetch(
        "https://wsexternal.usfq.edu.ec/WSFinancieroUSFQ/WSFinancieroUSFQ-DESA/financiero/PostRegistroExternos",
        {
          method: "POST",
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            "Authorization": `Bearer ${accessToken}`
          },
          body: JSON.stringify(data),
        }
      );
  
      if (!response.ok) {
        const errorResponseData = await response.json();
        console.log(errorResponseData)
        console.log(response)
        throw new Error(`HTTPS error! Status: ${response.status}`);
      }
  
      const responseData = await response.json();
      console.log("postRegistroFinanciero: ", responseData)

      return responseData[0].valor;
    } catch (err) {
      console.error("postRegistroFinanciero: ", err);
      throw err;
    }
  };

  const handleExport = async () => {
    try{      

      const tickets = document.querySelectorAll('[id^="pdf-content"]');
      const pdfOptions = {
        image: { type: 'jpeg', quality: 1 },
        margin: [5, -220, 0, 0],
        jsPDF: { unit: 'mm', format: [520, 340] }
      };
      
      const pdf = html2pdf().set(pdfOptions);
    
      for (const [index, ticket] of tickets.entries() ) {

        await pdf.from(ticket).toContainer().toCanvas().toPdf().get('pdf').then(function (pdf) {
          if(index != quantity-1){
            pdf.addPage();
          }
        });
      }
      pdf.outputPdf().then(function(pdf) {
        // Save ticket base 64 in eventAttendee only when creating attendee
        console.log("eventAttendee: ", eventAttendee)
        if(eventAttendee.ticket?.length == 0 || eventAttendee.ticket == null ){          
          updateEventAttendee(btoa(pdf))
        }
      })
      pdf.save(`${props.landing.title + " - ticket "}.pdf`);
    
    }catch(e){ console.error("handleExport error: ",e) }
  };

  async function updateEventAttendee(ticket) {

    const original = await DataStore.query(EventAttendee, eventAttendee.id);
    console.log("original: ",original._version)
    const updatedEventAttendee = await DataStore.save(
      EventAttendee.copyOf(original, updated => {
        updated.ticket = ticket;
      })
    );

    console.log("updatedEventAttendee: ",updatedEventAttendee)
  }

  // Submit Form
  const handleSubmit = async () => {
    clearErrorMessages();
    const isValid = validateForm();

    if (isValid) {
      const fbRender = document.querySelector("#fb-editor");
      const userData = $(fbRender).formRender("userData");
      setUserData(userData);

      async function createAttende() {
        const attendee = await DataStore.save(new Attendee({}));
        return attendee;
      }

      // Make sure to await the creation of the attendee
      const attendee = await createAttende();
      console.log("attendee: ",attendee) 

      if (attendee) {
        try {

          // Create and save the EventAttendee record
          const newEventAttendee = await DataStore.save(
            new EventAttendee({
              eventID: eventID,
              attendeeID: attendee.id,
              authorized: false,
              checkIn: false,
              formAnswers: userData,
              ticket: '', 
              email: userData.find(item => item.name === 'email').userData[0].toString(),
              allowContact: false,
              quantity,
              scanned: 0,
              profileURL: `${domain}/usuario/${attendee.id}`
            })
          );

          setEventAttende(newEventAttendee)

          setFormRegister(true);
          // get token from USFQ
          const accessToken = await getTokenFinancial();
          const requestBody = [{
            identificacion: parseInt(userData.find(item => item.name === 'identificacion').userData[0]),
            nombres: userData.find(item => item.name === 'nombres').userData[0].toString(),
            direccion: userData.find(item => item.name === 'direccion').userData[0].toString(),
            telefono: userData.find(item => item.name === 'telefono').userData[0].toString(),
            correo: userData.find(item => item.name === 'email').userData[0].toString(),
            valor: price.replace(/\$/g, ''),
            evento_descripcion: "TEST",
            evento_id: event.eventIdUSFQ.toString(),
            trs_unico: "",
            codigo: "0",
            clave: "SEOP",
            tipo_pago: "O",
            diferido: "BTNS",
            periodo: "202320",
            correo_adicional: "",
            colegio: "",
            especialidad: "",
            envio: "N",
            usuario: "OPIEVENTOS",
            reg_url_retorno: `${currentUrl}?EventAttendee=${newEventAttendee.id}`,
            reg_id_externo: newEventAttendee.id
          }];

          const trs = await postRegistroFinanciero(requestBody, accessToken)
          setTrs(trs)

        } catch (error) {
          console.error("HandleSubmit:", error);
        }
      }
    } else {
      console.log("Form is not valid");
    }
  };

  const clearErrorMessages = () => {
    const errorMessages = document.querySelectorAll(".error-message");
    errorMessages.forEach((error) => error.remove());
  };


  return (
    <div className={`campus-page `}>
      <div className="grid h-full">
        {!formRegister && (
          <>
            <Link
              onClick={() => {
                props.setShowRegister(false);
              }}
              className="gap mb-4 flex items-center font-medium text-brand-500 hover:text-navy-700 hover:no-underline dark:hover:text-white"
            >
              <MdChevronLeft className="h-7 w-7" /> Regresar
            </Link>

            <h2
              id="title-form"
              className="mb-5 flex justify-center gap-2 text-4xl font-bold"
            >
              <HiOutlineDocumentText className="h-10 w-10" /> Formulario de
              Registro
            </h2>
            <div className="mx-auto w-full max-w-[1000px]">
              <FormBuilder />
              <div className="mb-5"></div>
              <button
                href="crear"
                type="submit"
                onClick={() => {
                  handleSubmit();
                }}
                className="linear text-md mx-auto flex w-full max-w-[270px] items-center justify-center gap-1 rounded-xl bg-red-500 py-[12px] pl-3 pr-3 font-medium text-white transition duration-200 hover:bg-black"
              >
                Enviar y completar pago
              </button>
            </div>
          </>
        )}

        {!authorized && searchParams.get('EventAttendee') &&
          <div className="fixed bottom-0 left-0 right-0 top-0 z-50 flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-lightPrimary opacity-80">
            <div className="loader mb-4 h-16 w-16 rounded-full border-4 border-t-4 border-gray-200 ease-linear"></div>
            <h2 className="mb-2 text-center text-xl font-semibold text-black">
              Estamos esperando recibir el pago desde la plataforma USFQ...
            </h2>
            <p className="w-1/3 text-center text-black">
              Si se ha realizado una transferencia o un depósito, se le enviará un correo electrónico con las entradas una vez que se haya verificado el pago.
            </p>
          </div>
        }

        {!authorized && formRegister && !searchParams.get('EventAttendee') &&
          <div className="fixed bottom-0 left-0 right-0 top-0 z-50 flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-lightPrimary opacity-80">
            <div className="loader mb-4 h-16 w-16 rounded-full border-4 border-t-4 border-gray-200 ease-linear"></div>
            <h2 className="mb-2 text-center text-xl font-semibold text-black">
              Esperando recibir el pago desde la plataforma USFQ...
            </h2>
            <p className="w-1/3 text-center text-black">
              Por favor no cierre esta página.
            </p>
          </div>
        }

        {authorized && eventAttendee && userData.length !== 0 && (
          <>
            <div className="mb-[35px] flex flex-col items-center justify-center text-center">
              <h1 className="mb-3 text-2xl font-semibold">Compra éxitosa!</h1>
              <p className="text-lg">
                Descargue su ticket y presentelo el día del evento para ingresar.
              </p>
              <p className="mb-4 text-lg">
                Su ticket tambien es enviado por correo para su resplado. 
              </p>
              <button
                href="descargar"
                onClick={() => {
                  handleExport(); 
                }}
                className="linear text-md mx-auto flex w-full max-w-[270px] items-center justify-center gap-1 rounded-xl bg-red-500 py-[12px] pl-3 pr-3 font-medium text-white transition duration-200 hover:bg-black"
              >
                Descargar PDF
              </button>
            </div>
            <div
            
              className={`mt-2 grid w-full ${
                quantity > 1 && " lg:grid-cols-3"
              } items-center gap-4`}
            >
              {ticketsArray.map((_, index) => (
                <div
                  id={`pdf-content-${index}`}
                  ref={pdfContentRef}
                  key={index}
                  className={`mb-4 flex w-full items-start justify-center ticket-${index}`}
                >
                  <div className="border-gray flex w-full max-w-[400px] items-center justify-start border border-solid pb-2">
                    <div
                      style={{
                        background: "rgb(255,255,255)",
                        background:
                          " linear-gradient(0deg, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 80%, #faf3e9f7 80%)",
                      }}
                      className=" flex w-full flex-col items-center justify-between gap-[30px] px-2 pb-3 pt-8"
                    >
                      {/* QrCode + name of event + Logo  */}
                      <div className="flex w-full flex-col items-center justify-start ">
                        {/* => QrCode + Name of event + Logo  */}
                        <div className="flex items-center justify-center bg-white p-1">
                          {eventAttendee.id && 
                            <QRCode
                              id="qrcode"
                              className="mb-[24px]"
                              size={170}
                              style={{ height: "auto" }}
                              value={eventAttendee.id}
                              viewBox={`0 0 200 200`}
                            />
                          }
                        </div>
                        {/* => Event Name  */}
                        <h1 className="mb-4 text-3xl font-bold">
                          {props.landing.title}
                        </h1>
                        {/* => Logo  */}
                        <img src={logo} className="w-[150px]" />
                      </div>
                      <div className="items-center flex w-full flex-col justify-center">
                        {userData.map((data, i) => (
                          <div key={i}>
                            {data.name == "nombres" && (
                              <p className="text-md mb-3 w-full text-right font-bold capitalize">
                                {data.userData[0]}
                              </p>
                            )}
                          </div>
                        ))}
                        {eventAttendee && (
                          <p className="text-md mb-1 w-full text-center font-bold">
                            Código de ticket: <span className="d-block font-normal">{eventAttendee.id}</span>
                          </p>
                        )}
                        <p className="mb-1 mb-2 mt-3 text-right text-sm font-normal">
                          {props.event.location}
                        </p>
                        <p className="l-auto mb-1 max-w-fit bg-black px-2 py-[3px] text-right text-sm font-normal text-white">
                          {formatSpanishDate(props.event.date)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Registro;
