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
import { DataStore } from 'aws-amplify/datastore';
import { Form } from "models";
import $, { event } from "jquery";
import { Attendee, EventAttendee } from "models";
import { validateForm, formatSpanishDate } from "scripts/utils"
import { uploadData, getUrl } from 'aws-amplify/storage';

window.jQuery = $;
window.$ = $;
require("jquery-ui-sortable");
require("formBuilder");
require("formBuilder/dist/form-render.min.js");

const Registro = (props) => {
  const { userData, setUserData, quantityProp, price, eventID, showRegister, setShowRegister, event, eventAttendeeProp} = props;
  const [formData, setFormData] = React.useState([]);
  const [eventAttendee, setEventAttendee] = React.useState(null);
  const [authorized, setAuthorized] = React.useState(false);
  const [trs, setTrs] = React.useState(null);
  const [formRegister, setFormRegister] = React.useState(false);
  const [quantity, setQuantity] = React.useState(quantityProp);
  const [ticketsArray, setTicketsArray] = React.useState(Array.from({ length: quantity }, (_, index) => index));
  const [uploadProgress, setUploadProgress] = React.useState(100);
  const [sendEmail, setSendEmail] = React.useState(false);
  const [changeBilling, setChangeBilling] = React.useState(false);
  const [showBillingFields, setShowBillingFields] = React.useState(false);

  const currentUrl = window.location.href;
  const domain = new URL(currentUrl).origin;
  const id = useParams().id;
  const searchParams = new URLSearchParams(document.location.search);
  const pdfContentRef = useRef();
  const ticketsRef = useRef(null);

  // Show form builder class
  class FormBuilder extends Component {
    fb = createRef();
    componentDidMount() {
      $(this.fb.current).formRender({
        dataType: "json",
        formData,
      });

      // Make modifications to the DOM
      this.modifyDOM();
    }

    modifyDOM() {
      // Verify the price and modify the end-user ID if necessary
      /*
      if (price && parseFloat(price.replace(/[^\d.-]/g, '')) <= 50) {
        let identificacion = document.querySelector('#identificacion');
        let tipo_idenfiticacion = document.querySelector('#tipo_identificacion');
        if (!identificacion || !tipo_idenfiticacion) return;
        identificacion.parentElement.hidden = true;
        identificacion.value = '9999999999';
        tipo_idenfiticacion.parentElement.hidden = true;
      }
      */
    }

    shouldComponentUpdate(nextProps) {
      return JSON.stringify(this.props.formData) !== JSON.stringify(nextProps.formData);
    }
  

    render() { 
      return <div id="fb-editor" ref={this.fb} />;
    }
  }

  const memoizedFormBuilder = React.useMemo(() => 
    <FormBuilder formData={formData} />, 
    [formData]
  );

  const handleBillingCheckboxChange = (state) => {
    setShowBillingFields(state);
    setChangeBilling(state);
  };

  React.useEffect(() => {
    console.log("quantityProp: ",quantityProp)
  }, [quantityProp]); 

  // EventAttende parameter + Graphql Data
  React.useEffect(() => {

    console.log("EVENT ATTENDEE FROM CHILD: ", eventAttendeeProp)

    if(eventAttendeeProp){
      setEventAttendee(eventAttendeeProp)
      setFormRegister(true)
      setShowRegister(true)
      setAuthorized(eventAttendeeProp.authorized)
      setUserData(JSON.parse(eventAttendeeProp.formAnswers))
      setQuantity(eventAttendeeProp.quantity);
      setTicketsArray(Array.from({ length: eventAttendeeProp.quantity }, (_, index) => index));
    }

  }, [eventAttendeeProp]);

  // Observer query form data
  React.useEffect(() => {

    // Get form data
    const subQuestions = DataStore.observeQuery(Form, (c) => c.formEventId.eq(id)).subscribe((results) => {
      if (results.items.length > 0) {
        setFormData(results.items[0].questions);
      } else {
        console.log("No form data found");
      }
    });

    if(formData.length > 0){
      subQuestions.unsubscribe();
    }

  }, [showRegister]);

  // Observer query EventAttende if ticket is authorized
  // React.useEffect(() => {
  //   if(eventAttendee 
  //     && eventAttendee.id 
  //     && !authorized){

  //     eventAttendeeDataStore = DataStore.observeQuery(EventAttendee, (e) =>
  //     e.id.eq(eventAttendee.id)
  //     ).subscribe((results) => {
  //       if(results.items.length > 0){
  //         setEventAttendee(results.items[0])
  //         console.log("observeQuery: event attende change", results.items[0])
  //         setAuthorized(results.items[0].authorized)
  //       }
  //     });
  //   }

  //   if(authorized){
  //     eventAttendeeDataStore?.unsubscribe();
  //   }

  // }, [formRegister]);

   
  // Download PDF + handle mobile behavior
  React.useEffect(() => {
    if (authorized && ticketsRef.current) {
      handleExport(isMobileDevice());
      ticketsRef.current.scrollIntoView({ behavior: 'smooth' });
      const elementRect = ticketsRef.current.getBoundingClientRect();
      const desiredScrollPosition = window.scrollY + elementRect.top - 150;
      window.scrollTo({ top: desiredScrollPosition, behavior: 'smooth' });
    }
  }, [authorized]);

  // Redirect after creating eventAttende and getting token USFQ
  React.useEffect(() => {
    if (trs && eventAttendee) {
      async function redirectUSFQ() {
        const domain = window.location.href;
        const redirectUrl = domain.includes('eventflow')
          ? 'https://btnpagos.usfq.edu.ec/pagos/TIPO_TARJETA.ASPX?orgname=5&TRS='
          : 'https://btnpagos.usfq.edu.ec/pagosx/TIPO_TARJETA.ASPX?orgname=5&TRS=';
  
        const delayPromise = () => new Promise(resolve => setTimeout(resolve, 3000));
        
        try {
          await delayPromise();
          window.location.href = `${redirectUrl}${trs}`;
        } catch (error) {
          console.error('Error in redirectUSFQ:', error);
        }
      }
  
      redirectUSFQ();
    }
  }, [trs, eventAttendee]);

  // Submit Form
  const handleSubmit = async () => {
    clearErrorMessages();
    const isValid = validateForm();

    if (isValid) {

      // Show popup terms and conditions + transaction details
      const userConfirmed = await showCustomPopup();

      if (userConfirmed) {

        const fbRender = document.querySelector("#fb-editor");
        let userData = $(fbRender).formRender("userData");

        if (changeBilling) {
          // Replace the billing information with the new values
          userData = userData.map(item => {
            switch(item.name) {
              case 'identificacion':
                return {...item, userData: [document.getElementById('identificacion_facturacion').value]};
              case 'nombres':
                return {...item, userData: [document.getElementById('nombres_facturacion').value]};
              case 'direccion':
                return {...item, userData: [document.getElementById('direccion_facturacion').value]};
              case 'telefono':
                return {...item, userData: [document.getElementById('telefono_facturacion').value]};
              case 'email':
                return {...item, userData: [document.getElementById('email_facturacion').value]};
              default:
                return item;
            }
          });
        }

        setUserData(userData);
  
        async function createAttende() {
          const attendee = await DataStore.save(new Attendee({}));
          return attendee;
        }
  
        // Make sure to await the creation of the attendee
        const attendee = await createAttende();
  
        if (attendee) {
          try {
  
            // Testing multiple users
            //iterateWithDelay(userData)
            
            // Create and save the EventAttendee record
            const newEventAttendee = await DataStore.save(
              new EventAttendee({
                eventID: eventID,
                attendeeID: attendee.id,
                authorized: false,
                checkIn: false,
                formAnswers: userData,
                ticket: ``, 
                email: userData.find(item => item.name === 'email').userData[0].toString(),
                allowContact: false,
                quantity: quantityProp,
                scanned: 0,
                profileURL: `${domain}/usuario/${attendee.id}`
              })
            );
  
            setEventAttendee(newEventAttendee)
            setFormRegister(true);

            // get token from USFQ
            const accessToken = await getTokenFinancial();
            const requestBody = [{
              identificacion: parseInt(userData.find(item => item.name === 'identificacion').userData[0]),
              nombres: userData.find(item => item.name === 'nombres').userData[0].toString(),
              direccion: userData.find(item => item.name === 'direccion').userData[0].toString(),
              telefono: userData.find(item => item.name === 'telefono').userData[0].toString(),
              correo: userData.find(item => item.name === 'email').userData[0].toString(),
              valor: price.replace(/\$/g, '') * quantityProp,
              evento_descripcion: "evento usfq",
              evento_id: event?.eventIdUSFQ?.toString(),
              trs_unico: "",
              codigo: "0",
              clave: "SEOP",
              tipo_pago: "O",
              diferido: "BTNS",
              periodo: event?.periodoUSFQ?.toString(),
              correo_adicional: "",
              colegio: "",
              especialidad: "",
              envio: "N",
              usuario: event?.usuarioUSFQ?.toString(),
              reg_url_retorno: `${currentUrl}?EventAttendee=${newEventAttendee.id}`,
              reg_id_externo: newEventAttendee.id
            }];
            console.log("event: ",event)
            console.log("requestBody: ",requestBody)
            const trs = await postRegistroFinanciero(requestBody, accessToken);
            setTrs(trs); 
  
          } catch (error) {
            console.error("HandleSubmit:", error); 
          }
        }
      } else {
        console.log("Process canceled by the user");
      }   
    } else {
      console.log("Form is not valid");
    }
  };

  function showCustomPopup() {
    return new Promise((resolve) => {
      // Create a div acting as the popup
      const popup = document.createElement("div");
      popup.innerHTML = `
        <div class="popup-privacy-overlay"></div>
        <div class="popup-privacy">
          <div class="popup-privacy-description">
            <p class="title-transfer">En caso de transferencia o depósito:</p>
            <img src="${logo}" className="w-[60px] md:w-[70px] lg:w-[120px]" />
            <p class="subtitle-transfer">Cuenta Corriente: <span>1645005041<span></p>
            <p class="subtitle-transfer">Banco: <span>Bolivariano</span></p>
            <p class="subtitle-transfer">Beneficiario: <span>Universidad San Francisco de Quito</span></p>
            <p class="subtitle-transfer">RUC: <span>1791836154001</span></p>
          </div>
          <div class="wrap">
            <label for="confirmationCheckbox">
              Al seleccionar la casilla, confirmas tu aceptación de nuestra 
              <a href="https://www.usfq.edu.ec/es/privacy-policy" target="_blank" style="color: dodgerblue;">
                politica de privacidad
              </a>
              <input type="checkbox" id="confirmationCheckbox" style="margin-left:5px;transform: scale(1.3) translateY(0.5px);">
            </label>
          </div>
          <button id="redirectButton" disabled>Aceptar</button>
        </div>
      `;
  
      // Append the popup to the document body
      document.body.appendChild(popup);
  
      // Listen for changes in the checkbox
      const checkbox = document.getElementById("confirmationCheckbox");
      const redirectButton = document.getElementById("redirectButton");
  
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
          redirectButton.disabled = false;
        } else {
          redirectButton.disabled = true
        }
      });

      const popupOverlay = document.querySelector(".popup-privacy-overlay");
      if(popupOverlay) popupOverlay.addEventListener("click", () => {
        document.body.removeChild(popup);
      });
  
      // Add event listener for the redirect button
      redirectButton.addEventListener("click", () => {
        document.body.removeChild(popup);
        resolve(true);
      });
    });
  }

  const MAX_RETRIES = 3; 

  const getTokenFinancialAPI = async () => {
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

  const getTokenFinancial = async () => {
    let retries = 0;
  
    while (retries < MAX_RETRIES) {
      try {
        const accessToken = await getTokenFinancialAPI();
        if (accessToken) {
          return accessToken;
        }
      } catch (error) {
        console.error("Token retrieval attempt failed:", error);
        retries++;
        console.log(`Retrying token retrieval (${retries}/${MAX_RETRIES})...`);
      }
    }
  
    throw new Error(`Maximum number of token retrieval retries (${MAX_RETRIES}) exceeded.`);
  };

  const postRegistroFinancieroAPI = async (data, accessToken) => {
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
  const postRegistroFinanciero = async (data, accessToken) => {
    let retries = 0;

    while (retries < MAX_RETRIES) {
      try {
        const result = await postRegistroFinancieroAPI(data, accessToken);
        return result;
      } catch (error) {
        console.error("Retry attempt failed:", error);
        retries++;
        console.log(`Retrying (${retries}/${MAX_RETRIES})...`);
      }
    }

    throw new Error(`Maximum number of retries (${MAX_RETRIES}) exceeded.`);
  };

  const handleExport = async (isMobileDevice) => {
    try {  

      const tickets = document.querySelectorAll('[id^="pdf-content"]');
      const pdfOptions = {
          image: { type: 'jpeg', quality: 1 },
          margin: [5, -220, 0, 0],
          jsPDF: { unit: 'mm', format: [520, 340] }
      };
    
      const pdf = html2pdf().set(pdfOptions);
  
      for (const [index, ticket] of tickets.entries()) {
          await pdf?.from(ticket)?.toContainer().toCanvas().toPdf().get('pdf').then(function (pdf) {
              if (index != quantity - 1) {
                  pdf.addPage();
              }
          });
      }

      await pdf?.outputPdf().then(async function(pdf) {
          if (eventAttendee.ticket?.length == 0 || eventAttendee.ticket == null) {
              setUploadProgress(0);       
              const base64PDF = btoa(pdf);
              await savePDFStorage(base64PDF);
          } else {
            setSendEmail(true);
          }
      });


      if(!isMobileDevice){
        pdf?.save(`${props.landing.title + " - ticket "}.pdf`);
      }
    
    } catch(e) { 
        console.error("handleExport error: ", e); 
    }
  };

  async function savePDFStorage(ticket) {
    try {
        const resultUpload = await uploadData({
          key: eventAttendee.id + '_' + event.id + "_ticket.txt",
          data: ticket,
          options: {
            accessLevel: 'guest',
            metadata: {key: event.id},
          }
        }).result;

      setUploadProgress(100)
      console.log('Succeeded: ', resultUpload);

      const getUrlResult = await getUrl({
        key: eventAttendee.id + '_' + event.id + "_ticket.txt",
        options: {
          accessLevel: 'guest' ,
        },
      });

      const original = await DataStore.query(EventAttendee, eventAttendee.id);
      const updatedEventAttendee = await DataStore.save(
        EventAttendee.copyOf(original, updated => {
          updated.ticket = decodeURIComponent(getUrlResult.url.pathname.substring(1));
        })
      );

      sendTicketEmail();

    } catch (error) {
      console.error("Error uploading file: ", error);
    }
  }

  const sendTicketEmail = async () => {
    try{
       // Send email
      const payloadEmail = {
        eventAttendeeId: eventAttendee.id,
        "typePayment": "CARD",
        "statusPayment": "SUCCESSFUL"
      };
    
      const response = await fetch('https://edunvujidf.execute-api.sa-east-1.amazonaws.com/prod/trigger-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payloadEmail)
      });
      
      const data = await response.json()

      console.log("sendTicketEmail response :", data)

      setSendEmail(true)

    }catch(e){ 
      console.error("sendTicketEmail: ", e)
    }
  }

  const isMobileDevice = () => {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  };

  // TESTING multiple users creation
  // async function iterateWithDelay(userData) {
  //   for (let i = 0; i < 10; i++) {

  //     async function createAttende() {
  //       const attendee = await DataStore.save(new Attendee({}));
  //       return attendee;
  //     }

  //     // Make sure to await the creation of the attendee
  //     const attendee = await createAttende();

  //     const newEventAttendee = await DataStore.save(
  //       new EventAttendee({
  //         eventID: eventID,
  //         attendeeID: attendee.id,
  //         authorized: false,
  //         checkIn: false,
  //         formAnswers: userData,
  //         ticket: ``, 
  //         email: userData.find(item => item.name === 'email').userData[0].toString(),
  //         allowContact: false,
  //         quantity,
  //         scanned: 0,
  //         profileURL: `${domain}/usuario/${attendee.id}`
  //       })
  //     );
  //     console.log("nuevi newEventAttendee: ", i + newEventAttendee)
  //     await new Promise(resolve => setTimeout(resolve, 1000)); // 1000 milliseconds = 1 second
  //   }
  // }

  const clearErrorMessages = () => {
    const errorMessages = document.querySelectorAll(".error-message");
    errorMessages.forEach((error) => error.remove());
  };

  if (!formData) {
    return <p>Loading...</p>;
  }

  return (
    <div className={`campus-page `}>
      <div className="grid h-full">
        {!formRegister && !eventAttendee && (
          <>
            <Link
              onClick={() => {
                props.setShowRegister(false);
              }}
              className="gap mb-4 flex items-center font-medium text-brand-500 z-10	md:w-[20%] hover:text-navy-700 hover:no-underline dark:hover:text-white"
            >
              <MdChevronLeft className="h-7 w-7" /> Regresar
            </Link>

            <h2
              id="title-form"
              className="mb-[40px] md:mb-[60px] md:mt-[-60px] flex justify-center gap-2 text-4xl font-bold"
            >
              <HiOutlineDocumentText className="h-10 w-10" /> Formulario de
              Registro
            </h2>
            
            <div className="mx-auto w-full max-w-[1100px] py-[40px] px-[25px] md:px-[50px] box-shadow-0">
              
              {memoizedFormBuilder}


              {/* Start new invoice data fields  */}

              <div className="mt-3 mb-1 py-3">
                <label 
                  className="font-medium flex items-center cursor-pointer"
                  onClick={() => handleBillingCheckboxChange(!showBillingFields)}
                >
                  <div 
                    className={`w-5 h-5 mr-2 border border-gray-400 rounded flex items-center justify-center ${showBillingFields ? 'bg-blue-500' : 'bg-white'}`}
                  >
                    {showBillingFields && (
                      <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  Cambiar datos de facturación
                </label>
              </div>

              {showBillingFields && (
                <div className="rendered-form mt-3" id="billingFields">
                  <div className="formbuilder-select form-group field-tipo_identificacion">
                    <label htmlFor="tipo_identificacion" className="formbuilder-select-label">
                      Tipo de identificación
                    </label>
                    <select name="tipo_identificacion" className="form-control" required aria-required="true">
                      <option value="cedula" selected>Cédula</option>
                      <option value="pasaporte">Pasaporte</option>
                      <option value="ruc">RUC</option>
                    </select>
                  </div>
                  <div className="formbuilder-text form-group field-identificacion">
                    <label htmlFor="identificacion" className="formbuilder-text-label">
                      N° de Identificación
                    </label>
                    <input name="identificacion" className="form-control" type="text" id="identificacion_facturacion" required aria-required="true" />
                  </div>
                  <div className="formbuilder-text form-group field-email">
                    <label htmlFor="email" className="formbuilder-text-label">
                      Email
                    </label>
                    <input name="email" className="form-control" placeholder="correo@ejemplo.com" type="email" id="email_facturacion" required aria-required="true" />
                  </div>
                  <div className="formbuilder-text form-group field-nombres">
                    <label htmlFor="nombres" className="formbuilder-text-label">
                      Nombre completo o razón social
                    </label>
                    <input name="nombres" className="form-control" placeholder="Juan Pérez" type="text" id="nombres_facturacion" required aria-required="true" />
                  </div>
                  <div className="formbuilder-text form-group field-direccion">
                    <label htmlFor="direccion" className="formbuilder-text-label">
                      Dirección
                    </label>
                    <input name="direccion" className="form-control" placeholder="Calle Principal 123" type="text" id="direccion_facturacion" required aria-required="true" />
                  </div>
                  <div className="formbuilder-text form-group field-telefono">
                    <label htmlFor="telefono" className="formbuilder-text-label">
                      Teléfono
                    </label>
                    <input name="telefono" className="form-control" placeholder="+593 99 1234 567" type="text" id="telefono_facturacion" required aria-required="true" />
                  </div>
                </div>
              )}

              {/* End new invoice data fields  */}

              <button
                href="crear"
                type="submit"
                onClick={() => {
                  handleSubmit();
                }}
                className="clear-both	linear text-md mx-auto flex w-full max-w-[270px] items-center justify-center gap-1 rounded-xl bg-red-500 py-[12px] pl-3 pr-3 font-medium text-white transition duration-200 hover:bg-black"
              >
                Enviar y completar pago
              </button>
            </div>
          </>
        )}

        { !sendEmail && searchParams.get('EventAttendee') || uploadProgress !== 100 &&
          <div className="fixed bottom-0 left-0 right-0 top-0 z-50 flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-lightPrimary opacity-[100%] p-3">
            <div className="loader mb-4 h-16 w-16 rounded-full border-4 border-t-4 border-gray-200 ease-linear"></div>
            <h2 className="mb-2 text-center text-xl font-semibold text-black">
              Cargando...
            </h2>
            <p className="max-w-[500px] text-center text-black">
              Esto puede tardar unos segundos, por favor, no cierre esta página.
            </p>
          </div>
        }

        { !authorized && searchParams.get('EventAttendee') &&
          <div className="fixed bottom-0 left-0 right-0 top-0 z-50 flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-lightPrimary opacity-100 p-3">
            <img src={logo} className="w-[80px] mb-3 md:w-[90px] lg:w-[150px]" />
            <h2 className="mb-2 text-center text-xl font-semibold text-black">
              Su pago está siendo procesado actualmente
            </h2>
            <p className="max-w-[500px] text-center text-black">
              Agradecemos su comprensión y paciencia. En caso de transferencia o depósito, el pago se procesara dentro de 48 horas y el ticket se enviará a su correo electrónico.
            </p>
          </div>
        }

        {!authorized && formRegister && !searchParams.get('EventAttendee') &&
          <div className="fixed bottom-0 left-0 right-0 top-0 z-50 flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-lightPrimary opacity-[100%] p-3">
            <div className="loader mb-4 h-16 w-16 rounded-full border-4 border-t-4 border-gray-200 ease-linear"></div>
            <h2 className="mb-2 text-center text-2xl font-semibold text-black">
              Redirigiendo a la pasarela de pagos USFQ
            </h2>
            <p className="max-w-[500px] text-center text-black">
              Por favor no cierre esta página.
            </p>
          </div>
        }

        {authorized && eventAttendee && userData.length !== 0 && (
          <>
            <div 
              ref = {ticketsRef}  
              className="mb-[35px] flex flex-col items-center justify-center text-center"
            >
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
                  handleExport(false); 
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
                            {data.name === "nombres" && (
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
