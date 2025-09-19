import React, { Component, createRef, useRef } from "react";
import logo from "assets/img/usfq/logo_2025.png";
import QRCode from "react-qr-code";
import domtoimage from "dom-to-image";
import html2pdf from "html2pdf.js";
import { useParams, Link, useNavigate } from "react-router-dom";
import { HiOutlineDocumentText } from "react-icons/hi";
import { MdChevronLeft } from "react-icons/md";
import { DataStore } from "aws-amplify/datastore";
import { Form } from "models";
import $, { event } from "jquery";
import { Attendee, EventAttendee } from "models";
import { validateForm, formatSpanishDate } from "scripts/utils";
import { uploadData, getUrl } from "aws-amplify/storage";
import { validateBannerCode } from "../../../services/nomina/validateBannerCode";

window.jQuery = $;
window.$ = $;
require("jquery-ui-sortable");
require("formBuilder");
require("formBuilder/dist/form-render.min.js");

const subeventosIds = [
  "364f6cfb-16a6-4f10-839f-e606df7b5537",
  "5eef9fae-24f6-49a5-871c-b84f381ce975",
  "da0fea1e-7517-4c62-97c4-970cc448ad9b",
  "c8df1315-8a36-43f1-ab5a-89f8a21b72b4",
  "219a2ee6-896b-4c46-8119-badd8e25d381",
  "91327434-221e-4e2f-82fa-41fdf5e69a93",
  "60ab0461-3802-4816-af77-b29aaaced2c4",
  "939722b8-9169-47c7-9cfc-64f8a40e0bd4",
  "88bc02e3-2162-4892-96b7-f0df45153efd",
  "674989ad-f5f0-4e9d-a1c5-916c825f24fd",
  "79123410-02da-487a-b26f-101c181aee88",
  "e67b8d27-2c63-407e-a139-beba70669b3a",
  "62f0cc8b-9abf-4b73-9976-bd9dfaeff7fc",
  "3a6a2bfa-24d5-44df-a883-d376649b27c8",
  "2960f399-7f97-4f2e-bdb2-5ab4ccdc3e58",
  "8bed927b-afb0-4aff-adeb-0c1691da51c9",
  "0174b708-bc60-4f40-b925-65ab2ba66807",
  "7f702324-9813-4074-a2b7-70cc1f612af1",
  "654d33cf-402b-495a-844f-61d72e1e4980",
  "b1b9897e-6e45-4d08-8d41-9080fb6b9b44"
];

const Registro = (props) => {

  const navigate = useNavigate();
  const { userData, setUserData, quantityProp, price, eventID, showRegister, setShowRegister, event, eventAttendeeProp} = props;
  const [formData, setFormData] = React.useState([]);
  const [eventAttendee, setEventAttendee] = React.useState(null);
  const [authorized, setAuthorized] = React.useState(false);
  const [trs, setTrs] = React.useState(null);
  const [formRegister, setFormRegister] = React.useState(false);
  const [quantity, setQuantity] = React.useState(quantityProp);
  const [ticketsArray, setTicketsArray] = React.useState(
    Array.from({ length: quantity }, (_, index) => index)
  );
  const [uploadProgress, setUploadProgress] = React.useState(100);
  const [changeBilling, setChangeBilling] = React.useState(false);
  const [showBillingFields, setShowBillingFields] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(true);
  const [formBuilderLoading, setFormBuilderLoading] = React.useState(true);
  const [formBuilderError, setFormBuilderError] = React.useState(null); 
  const [userConsentChecked, setUserConsentChecked] = React.useState(false);

  const currentUrl = window.location.href;
  const domain = new URL(currentUrl).origin;
  const id = useParams().id;
  const searchParams = new URLSearchParams(document.location.search);
  const pdfContentRef = useRef();
  const ticketsRef = useRef(null);
  const formRef = useRef(null);

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
      return (
        JSON.stringify(this.props.formData) !==
        JSON.stringify(nextProps.formData)
      );
    }

    render() {
      return <div id="fb-editor" ref={this.fb} />;
    }
  }

  const memoizedFormBuilder = React.useMemo(
    () => <FormBuilder formData={formData} />,
    [formData]
  );

  const handleBillingCheckboxChange = (state) => {
    setShowBillingFields(state);
    setChangeBilling(state);
  };

  React.useEffect(() => {
    if (eventAttendee && eventAttendee.ticket) {
      setUploadProgress(100);
    }
  }, [eventAttendee]);

  // EventAttende parameter + Graphql Data
  React.useEffect(() => {

    if (eventAttendeeProp) {
      setEventAttendee(eventAttendeeProp);
      setFormRegister(true);
      setShowRegister(true);
      setAuthorized(eventAttendeeProp.authorized);
      setUserData(JSON.parse(eventAttendeeProp.formAnswers));
      setQuantity(eventAttendeeProp.quantity);
      setTicketsArray(
        Array.from({ length: eventAttendeeProp.quantity }, (_, index) => index)
      );
    }
  }, [eventAttendeeProp]);

  React.useEffect(() => {
    
    const searchParams = new URLSearchParams(window.location.search);
    const hasEventAttendee = searchParams.get("EventAttendee");
    if (showRegister && formRef.current && !hasEventAttendee) {
      // Deactivate loading screen
      setIsProcessing(false);
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showRegister]);

  // Observer query form data
  React.useEffect(() => {
    setFormBuilderLoading(true);
    setFormBuilderError(null);
  
    const subQuestions = DataStore.observeQuery(Form, (c) =>
      c.formEventId.eq(id)
    ).subscribe((results) => {
  
      if (results.isSynced && results.items.length === 0) {
        setFormBuilderError("No se encontró un formulario asociado a este evento.");
        setFormBuilderLoading(false);
      } else if (results.items.length > 0) {
        const questions = results.items[0].questions;
        if (questions && questions.length > 0) {
          setFormData(questions);
          setFormBuilderLoading(false);
        } else {
          setFormBuilderError("El formulario no contiene preguntas para mostrar.");
          setFormBuilderLoading(false);
        }
      }
    });
  
    return () => subQuestions.unsubscribe();
  }, [id]);

  // Download PDF + handle mobile behavior
  React.useEffect(() => {
    if (authorized && ticketsRef.current) {      
      handleExport(isMobileDevice());
      ticketsRef.current.scrollIntoView({ behavior: "smooth" });
      const elementRect = ticketsRef.current.getBoundingClientRect();
      const desiredScrollPosition = window.scrollY + elementRect.top - 150;
      window.scrollTo({ top: desiredScrollPosition, behavior: "smooth" });
    }
  }, [authorized]);

  // Redirect after creating eventAttende and getting token USFQ
  React.useEffect(() => {
    if (trs && eventAttendee) {
      async function redirectUSFQ() {
        const domain = window.location.href;
        const redirectUrl = domain.includes("eventflow")
          ? "https://btnpagos.usfq.edu.ec/pagos/TIPO_TARJETA.ASPX?orgname=5&TRS="
          : "https://btnpagos.usfq.edu.ec/pagosx/TIPO_TARJETA.ASPX?orgname=5&TRS=";

        const delayPromise = () =>
          new Promise((resolve) => setTimeout(resolve, 3000));

        try {
          await delayPromise();
          window.location.href = `${redirectUrl}${trs}`;
        } catch (error) {
          console.error("Error in redirectUSFQ:", error);
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
      setIsProcessing(true);

      let userConfirmed;
      // Show popup terms and conditions + transaction details
      const isFree = props.landing.cost === 'Gratuito';
      if(!isFree)
        userConfirmed = await showCustomPopup();

      if (!isFree && userConfirmed || isFree) {

        const fbRender = document.querySelector("#fb-editor");
        let userData = $(fbRender).formRender("userData");

        if (changeBilling) {
          // Replace the billing information with the new values
          userData = userData.map((item) => {
            switch (item.name) {
              case "identificacion":
                return {
                  ...item,
                  userData: [
                    document.getElementById("identificacion_facturacion").value,
                  ],
                };
              case "nombres":
                return {
                  ...item,
                  userData: [
                    document.getElementById("nombres_facturacion").value,
                  ],
                };
              case "direccion":
                return {
                  ...item,
                  userData: [
                    document.getElementById("direccion_facturacion").value,
                  ],
                };
              case "telefono":
                return {
                  ...item,
                  userData: [
                    document.getElementById("telefono_facturacion").value,
                  ],
                };
              case "email":
                return {
                  ...item,
                  userData: [
                    document.getElementById("email_facturacion").value,
                  ],
                };
              default:
                return item;
            }
          });
        }

        setUserData(userData);

        const { ok } = await validateBannerCode(userData);

        if (!ok) {
          alert("El código banner o identificación CI no es válido");
          setIsProcessing(false);
          return; 
        }


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

            // Check if an EventAttendee with the same email already exists for this event
            const emailRaw = userData.find((item) => item.name === "email")?.userData[0];
            const email = emailRaw?.toLowerCase();

            const existing = await DataStore.query(EventAttendee, (ea) =>
              ea.email.eq(email)
            );

            const match = existing.find((att) => att.eventID === eventID);

            if (match) {
              alert("Ya existe un registro con este correo para este evento.");
              setIsProcessing(false);
              return;
            }

            const isSubevento = subeventosIds.includes(eventID);

            if (isSubevento) {
              const alreadyRegisteredInAnotherSubevento = existing.some(
                (att) => att.eventID !== eventID && subeventosIds.includes(att.eventID)
              );

              if (alreadyRegisteredInAnotherSubevento) {
                alert("Ya estás registrado en otra actividad. Solo se permite la inscripción a una única actividad.");
                setIsProcessing(false);
                return;
              }
            }

            // Create and save the EventAttendee record
            const newEventAttendee = await DataStore.save(
              new EventAttendee({
                eventID: eventID,
                attendeeID: attendee.id,
                authorized: isFree ? true : false,
                checkIn: false,
                formAnswers: userData,
                ticket: ``,
                email: userData
                  .find((item) => item.name === "email")
                  .userData[0].toString(),
                allowContact: false,
                quantity: quantityProp,
                scanned: 0,
                profileURL: `${domain}/usuario/${attendee.id}`,
              })
            );

            setEventAttendee(newEventAttendee);
            setFormRegister(true);

            // get token from USFQ
            if(!isFree){
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
              const trs = await postRegistroFinanciero(requestBody, accessToken);
              setTrs(trs); 
            } else {
              // Redirect to Eventflow
              setTimeout(() => {
                navigate(`?EventAttendee=${newEventAttendee.id}`);
              },2000)
            }
            
          } catch (error) {
            console.error("HandleSubmit:", error);
            setIsProcessing(false);
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
          redirectButton.disabled = true;
        }
      });

      const popupOverlay = document.querySelector(".popup-privacy-overlay");
      if (popupOverlay)
        popupOverlay.addEventListener("click", () => {
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

    throw new Error(
      `Maximum number of token retrieval retries (${MAX_RETRIES}) exceeded.`
    );
  };

  const postRegistroFinancieroAPI = async (data, accessToken) => {
    try {
      const response = await fetch(
        "https://wsexternal.usfq.edu.ec/WSFinancieroUSFQ/WSFinancieroUSFQ-DESA/financiero/PostRegistroExternos",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const errorResponseData = await response.json();
        throw new Error(`HTTPS error! Status: ${response.status}`);
      }

      const responseData = await response.json();

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
        image: { type: "jpeg", quality: 1 },
        margin: [5, -220, 0, 0],
        jsPDF: { unit: "mm", format: [520, 340] },
      };

      const pdf = html2pdf().set(pdfOptions);

      for (const [index, ticket] of tickets.entries()) {
        await pdf
          ?.from(ticket)
          ?.toContainer()
          .toCanvas()
          .toPdf()
          .get("pdf")
          .then(function (pdf) {
            if (index != quantity - 1) {
              pdf.addPage();
            }
          });
      }

      await pdf?.outputPdf().then(async function (pdf) {
        if (eventAttendee.ticket?.length == 0 || eventAttendee.ticket == null) {
          setUploadProgress(0);
          const base64PDF = btoa(pdf);
          await savePDFStorage(base64PDF);
        }
      });

      if (!isMobileDevice) {
        pdf?.save(`${props.landing.title + " - ticket "}.pdf`);
      }

      // Deactive loading screen
      setIsProcessing(false);

    } catch (e) {
      console.error("handleExport error: ", e);
    }
  };

  async function savePDFStorage(ticket) {
    try {
      
      if (eventAttendee.ticket && eventAttendee.ticket.length > 0) {
        setUploadProgress(100);
        setIsProcessing(false); 
        return;
      }

      const resultUpload = await uploadData({
        key: eventAttendee.id + "_" + event.id + "_ticket.txt",
        data: ticket,
        options: {
          accessLevel: "guest",
          metadata: { key: event.id },
        },
      }).result;

      setUploadProgress(100);

      const getUrlResult = await getUrl({
        key: eventAttendee.id + "_" + event.id + "_ticket.txt",
        options: {
          accessLevel: "guest",
        },
      });

      const original = await DataStore.query(EventAttendee, eventAttendee.id);
      const updatedEventAttendee = await DataStore.save(
        EventAttendee.copyOf(original, (updated) => {
          updated.ticket = decodeURIComponent(
            getUrlResult.url.pathname.substring(1)
          );
        })
      );

      sendTicketEmail();
      setIsProcessing(false);
    } catch (error) {
      console.error("Error uploading file: ", error);
      setIsProcessing(false);
    }
  }

  const sendTicketEmail = async () => {
    try {
      // Send email
      const payloadEmail = {
        eventAttendeeId: eventAttendee.id,
        typePayment: "CARD",
        statusPayment: "SUCCESSFUL",
      };

      const response = await fetch(
        "https://edunvujidf.execute-api.sa-east-1.amazonaws.com/prod/trigger-email",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payloadEmail),
        }
      );

      const data = await response.json();

    } catch (e) {
      console.error("sendTicketEmail: ", e);
    }
  };

  const isMobileDevice = () => {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  };

  const clearErrorMessages = () => {
    const errorMessages = document.querySelectorAll(".error-message");
    errorMessages.forEach((error) => error.remove());
  };

  if (!formData) {
    return <p>Loading...</p>;
  }

  return (
    <div className={`landing-page `}>
      <div className="grid h-full">
        {!formRegister && !eventAttendee && (
          <>
            <Link
              onClick={() => {
                props.setShowRegister(false);
              }}
              className="gap z-10 mb-4 flex items-center font-medium text-brand-500	hover:text-navy-700 hover:no-underline dark:hover:text-white md:w-[20%]"
            >
              <MdChevronLeft className="h-7 w-7" /> Regresar
            </Link>

            <h2
              id="title-form"
              className="mb-[30px] flex items-center justify-start md:justify-center gap-2 text-[25px] md:text-[40px] font-bold md:mb-[60px] md:mt-[-60px]"
            >
              <HiOutlineDocumentText className="h-10 w-10" /> Formulario de
              Registro
            </h2>
            
            <div 
              ref={formRef}
              className="d-flex flex-col	mx-auto w-full max-w-[1100px] py-[40px] px-[25px] md:px-[50px] box-shadow-0"
            >
              
            {formBuilderLoading ? (
              <div className="flex flex-col justify-center items-center">
                <span className="loader" />
                <p className="text-center mt-4">Cargando formulario...</p>
              </div>
            ) : formBuilderError ? (
              <p className="text-red-500 text-center">
                {formBuilderError}
              </p>
            ) : (
              memoizedFormBuilder
            )}

              {/* Start new invoice data fields  */}

              {props.landing.cost != 'Gratuito' && 
                <div className="mb-1 py-3">
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
              }

              {showBillingFields && (
                <div className="rendered-form mt-3" id="billingFields">
                  <div className="formbuilder-select form-group field-tipo_identificacion">
                    <label
                      htmlFor="tipo_identificacion"
                      className="formbuilder-select-label"
                    >
                      Tipo de identificación
                    </label>
                    <select
                      name="tipo_identificacion"
                      className="form-control"
                      required
                      aria-required="true"
                    >
                      <option value="cedula" selected>
                        Cédula
                      </option>
                      <option value="pasaporte">Pasaporte</option>
                      <option value="ruc">RUC</option>
                    </select>
                  </div>
                  <div className="formbuilder-text form-group field-identificacion">
                    <label
                      htmlFor="identificacion"
                      className="formbuilder-text-label"
                    >
                      N° de Identificación
                    </label>
                    <input
                      name="identificacion"
                      className="form-control"
                      type="text"
                      id="identificacion_facturacion"
                      required
                      aria-required="true"
                    />
                  </div>
                  <div className="formbuilder-text form-group field-email">
                    <label htmlFor="email" className="formbuilder-text-label">
                      Email
                    </label>
                    <input
                      name="email"
                      className="form-control"
                      placeholder="correo@ejemplo.com"
                      type="email"
                      id="email_facturacion"
                      required
                      aria-required="true"
                    />
                  </div>
                  <div className="formbuilder-text form-group field-nombres">
                    <label htmlFor="nombres" className="formbuilder-text-label">
                      Nombre completo o razón social
                    </label>
                    <input
                      name="nombres"
                      className="form-control"
                      placeholder="Juan Pérez"
                      type="text"
                      id="nombres_facturacion"
                      required
                      aria-required="true"
                    />
                  </div>
                  <div className="formbuilder-text form-group field-direccion">
                    <label
                      htmlFor="direccion"
                      className="formbuilder-text-label"
                    >
                      Dirección
                    </label>
                    <input
                      name="direccion"
                      className="form-control"
                      placeholder="Calle Principal 123"
                      type="text"
                      id="direccion_facturacion"
                      required
                      aria-required="true"
                    />
                  </div>
                  <div className="formbuilder-text form-group field-telefono">
                    <label
                      htmlFor="telefono"
                      className="formbuilder-text-label"
                    >
                      Teléfono
                    </label>
                    <input
                      name="telefono"
                      className="form-control"
                      placeholder="+593 99 1234 567"
                      type="text"
                      id="telefono_facturacion"
                      required
                      aria-required="true"
                    />
                  </div>
                </div>
              )}

              {/* Checkbox user consent  */}

              {props.landing.userConsentCheck && (
                <div className="mt-4 mb-1 checkbox-form">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      id="userConsentCheckbox"
                      required
                      checked={userConsentChecked}
                      onChange={(e) => setUserConsentChecked(e.target.checked)}
                      className="h-5 w-5 accent-red-600 cursor-pointer scale-[1.7] mt-1 mr-1"
                    />
                    <span
                      className="text-sm text-justify leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: props.landing.userConsentCheck }}
                    />
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={props.landing.userConsentCheck && !userConsentChecked}
                onClick={handleSubmit}
                className={`clear-both linear text-md mx-auto flex w-full max-w-[270px] items-center justify-center gap-1 rounded-xl py-[12px] pl-3 pr-3 font-medium transition duration-200 ${
                  !props.landing.userConsentCheck || userConsentChecked
                    ? 'bg-red-500 text-white hover:bg-black'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                } ${props.landing.cost === 'Gratuito' ? 'mt-[20px]' : ''}`}
              >
                Registrarse
              </button>
            </div>
          </>
        )}

        {
          isProcessing && (
            <div className="fixed bottom-0 left-0 right-0 top-[-10px] z-50 flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-lightPrimary opacity-[100%] p-3">
              <span className="loader"></span>
              <h2 className="mb-2 text-center text-xl text-black">
                Cargando… No cerrar la página.
              </h2>
            </div>
          )
        }

        {!authorized && searchParams.get("EventAttendee") && (
          <div className="fixed bottom-0 left-0 right-0 top-0 z-50 flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-lightPrimary p-3 opacity-100">
            <img
              src={logo}
              className="mb-3 w-[80px] md:w-[90px] lg:w-[150px]"
            />
            <h2 className="mb-2 text-center text-xl font-semibold text-black">
              Su pago está siendo procesado actualmente
            </h2>
            <p className="max-w-[500px] text-center text-black">
              Agradecemos su comprensión y paciencia. En caso de transferencia o
              depósito, el pago se procesara dentro de 48 horas y el ticket se
              enviará a su correo electrónico.
            </p>
          </div>
        )}

        {!authorized && formRegister && !searchParams.get('EventAttendee') && props.landing.cost != 'Gratuito' && 
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

        {authorized && eventAttendee && userData.length !== 0 && props.landing.cost === 'Gratuito' && (
          <>
            <div ref={ticketsRef} className="mb-[35px] flex flex-col items-center justify-center text-center">
              <h1 className="mb-3 text-2xl font-semibold">Registro exitoso!</h1>
              <p className="text-lg">
                Descarga tu ticket y presentalo el día del evento para ingresar.
              </p>
              <p className="mb-4 text-lg">
                Tu ticket también ha sido enviado por correo para su respaldo. 
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
              className={`mt-2 grid w-full ${quantity > 1 && "lg:grid-cols-3"} items-center gap-4`}
            >
              {ticketsArray.map((_, index) => (
                <div
                  id={`pdf-content-${index}`}
                  ref={pdfContentRef}
                  key={index}
                  className={`mb-4 flex w-full items-start justify-center ticket-${index}`}
                >
                  <div className="border-gray flex w-full max-w-[350px] items-center justify-start border border-solid pb-2">
                    <div
                      style={{
                        background: "rgb(255,255,255)",
                        background:
                          "linear-gradient(0deg, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 80%, #faf3e9f7 80%)",
                      }}
                      className="flex w-full flex-col items-center justify-between gap-[30px] px-2 pb-6 pt-8"
                    >
                      {/* QrCode + name of event + Logo */}
                      <div className="flex w-full flex-col items-center justify-start">
                        <div className="flex items-center justify-center bg-white p-1">
                          {eventAttendee.id && (
                            <QRCode
                              id="qrcode"
                              className="mb-[50px]"
                              size={170}
                              style={{ height: "auto" }}
                              value={eventAttendee.id}
                              viewBox={`0 0 200 200`}
                            />
                          )}
                        </div>
                        <img src={logo} className="w-[250px] mb-[50px]" />
                        <h1 className="mb-4 text-2xl max-w-[300px] font-bold text-center">
                          {props.landing.title}
                        </h1>
                      </div>
                      <div className="flex w-full flex-col items-center justify-center">
                        {userData.map((data, i) => (
                          <div key={i}>
                            {data.name === "nombres" && (
                              <p className="text-md w-full text-right font-bold capitalize">
                                {data.userData[0]}
                              </p>
                            )}
                          </div>
                        ))}
                        
                        <p className="mb-1 mb-2 text-right text-sm font-normal">
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
