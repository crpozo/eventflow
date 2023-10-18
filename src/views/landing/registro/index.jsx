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
import $ from "jquery";
import { Attendee, EventAttendee } from "models";

window.jQuery = $;
window.$ = $;
require("jquery-ui-sortable");
require("formBuilder");
require("formBuilder/dist/form-render.min.js");

const Registro = (props) => {
  const { userData, setUserData, quantity, price, eventID } = props;
  const [formData, setFormData] = React.useState([]);
  const [eventAttende, setEventAttende] = React.useState(null);
  const [authorized, setAuthorized] = React.useState(false);
  const [formRegister, setFormRegister] = React.useState(false);
  const id = useParams().id;

  const pdfContentRef = useRef();

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
    if(eventAttende && eventAttende.id){
      const eventAttendeeDataStore = DataStore.observeQuery(EventAttendee, (e) =>
      e.id.eq(eventAttende.id)
      ).subscribe((results) => {
        console.log(results);
      });
    }
  });

  /*
  useEffect(() => {
    if (formRegister) {
      handleExport();
    }
  }, [formRegister]);
  */

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
      return responseData[0].valor;
    } catch (err) {
      console.error("postRegistroFinanciero: ", err);
      throw err;
    }
  };

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

  const validateForm = () => {
    const form = document.querySelector("#fb-editor .rendered-form");
    const formElements = form.querySelectorAll("[required]");
    let isValid = true;

    formElements.forEach((element) => {
      if (!element.checkValidity()) {
        form.scrollIntoView({
          behavior: "smooth",
        });
        isValid = false;
        const error = document.createElement("div");
        error.className = "error-message text-red-500";
        error.textContent = "El campo no puede estar en blanco";
        element.insertAdjacentElement("afterend", error);
      }
    });

    return isValid;
  };

  const clearErrorMessages = () => {
    const errorMessages = document.querySelectorAll(".error-message");
    errorMessages.forEach((error) => error.remove());
  };

  const handleExport = () => {

    for (let i = 0; i < quantity; i++) {
    const pdfContent = document.getElementById("pdf-content").outerHTML;
    html2pdf()
      .set({ 
        image: { type: 'jpeg', quality: 1 },
        margin: [5, -220, 0, 0], 
        jsPDF: { unit: 'mm', format: [520, 340]}
      })
      .from(pdfContent)
      .save(`${props.landing.title + " - ticket "+ i }.pdf`);
    }
  };

  // Format Ticket date in spanish
  function formatSpanishDate(dateString) {
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

    const days = [
      "Domingo",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
    ];

    const date = new Date(dateString);
    const dayName = days[date.getUTCDay()];
    const monthName = months[date.getUTCMonth()];
    const day = date.getUTCDate();
    const month = date.getUTCMonth() + 1; // Adding 1 to match the "mm" format
    const year = date.getUTCFullYear();
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();

    const formattedDate = `${dayName}, ${monthName} ${month
      .toString()
      .padStart(2, "0")}/${day.toString().padStart(2, "0")}/${year} - ${hours
      .toString()
      .padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${
      hours >= 12 ? "PM" : "AM"
    }`;

    return formattedDate;
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

      const attendee = await createAttende(); // Make sure to await the creation of the attendee

      if (attendee) {
        try {
          // Create and save the EventAttendee record with the base64 PDF
          const newEventAttendee = await DataStore.save(
            new EventAttendee({
              eventID: eventID,
              attendeeID: attendee.id,
              authorized: false,
              checkIn: false,
              formAnswers: userData,
              ticket: '', // Store the PDF as a base64 string
              email: userData.find(item => item.name === 'email').userData[0].toString(),
              allowContact: false,
              quantity,
              scanned: 0,
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
            evento_id: "810110188",
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
          }];
          const trs = await postRegistroFinanciero(requestBody, accessToken)
          console.log(requestBody)
          window.open(`https://btnpagos.usfq.edu.ec/pagos/TIPO_TARJETA.ASPX?orgname=5&TRS=${trs}`, '_blank');


          // Chequear la base de datos, si cambio autorize ejecutar
          // Una vez realizado el pago generar pdf y autorizar variable.

          // DataStore.clear()

          // Generate and save the PDF
          /*
          const pdfContent = pdfContentRef.current;
          const dataUrl = await domtoimage.toPng(pdfContent, { quality: 1 });
          const base64Pdf = dataUrl.split(",")[1];
          */


        } catch (error) {
          console.error("HandleSubmit:", error);
        }
      }
    } else {
      console.log("Form is not valid");
    }
  };

  // Creating an array of ticket components based on the quantity
  const ticketsArray = Array.from({ length: quantity }, (v, i) => i);

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

        {!authorized && formRegister &&
          <div className="fixed bottom-0 left-0 right-0 top-0 z-50 flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-lightPrimary opacity-75">
            <div className="loader mb-4 h-16 w-16 rounded-full border-4 border-t-4 border-gray-200 ease-linear"></div>
            <h2 className="mb-2 text-center text-xl font-semibold text-black">
              Esperando recibir el pago desde la plataforma USFQ...
            </h2>
            <p className="w-1/3 text-center text-black">
              Por favor no cierre esta página.
            </p>
          </div>
        }

        {authorized && userData.length !== 0 && (
          <>
            <div className="mb-[35px] flex flex-col items-center justify-center text-center">
              <h1 className="mb-1 text-2xl">Compra éxitosa!</h1>
              <h2 className="mb-4 text-xl">
                Descargue su ticket para escanearlo en el evento
              </h2>
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
              className={`mt-4 grid w-full ${
                quantity > 1 && " lg:grid-cols-3"
              } items-center gap-4`}
            >
              {ticketsArray.map((_, index) => (
                <div
                  key={index}
                  ref={pdfContentRef}
                  id="pdf-content"
                  className="mb-4 flex w-full items-start justify-center"
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
                          {eventAttende && 
                            <QRCode
                              id="qrcode"
                              className="mb-[24px]"
                              size={170}
                              style={{ height: "auto" }}
                              value={eventAttende.id}
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
                            {data.name == "nombre" && (
                              <p className="text-md mb-1 w-full text-right font-bold capitalize">
                                {data.userData[0]}
                              </p>
                            )}
                            {data.name == "empresa" && (
                              <p className="text-md mb-1 w-full text-right font-bold capitalize">
                                {data.userData[0]}
                              </p>
                            )}
                            {data.name == "cargo" && (
                              <p className="text-md mb-1 w-full text-right font-bold capitalize">
                                {data.userData[0]}
                              </p>
                            )}
                            {eventAttende && (
                              <p className="text-md mb-1 w-full text-right font-bold capitalize">
                                Código de ticket: {eventAttende.id}
                              </p>
                            )}
                          </div>
                        ))}
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
