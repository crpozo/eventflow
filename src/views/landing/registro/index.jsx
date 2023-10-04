import React, {
  Component,
  createRef,
  useState,
  useEffect,
  useRef,
} from "react";
import logo from "assets/img/usfq/logo.svg";
import QRCode from "react-qr-code";
import jsPDF from "jspdf";
import domtoimage from "dom-to-image";
import html2pdf from "html2pdf.js";
import { useParams, Link } from "react-router-dom";
import { HiOutlineDocumentText } from "react-icons/hi";
import { MdChevronLeft } from "react-icons/md";
import { DataStore } from "aws-amplify";
import { Form } from "models";
import $ from "jquery";
import { EventAttendee } from "models";
import { Attendee } from "models";

window.jQuery = $;
window.$ = $;
require("jquery-ui-sortable");
require("formBuilder");
require("formBuilder/dist/form-render.min.js");

const Registro = (props) => {
  const { userData, setUserData, quantity, eventID } = props;
  const [formData, setFormData] = React.useState([]);
  const [eventAttende, setEventAttende] = React.useState(null);
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

  // Using useEffect to listen for changes in formRegister
  useEffect(() => {
    if (formRegister) {
      // Calling handleExport when formRegister becomes true
      handleExport();
    }
  }, [formRegister]);

  if (!formData) {
    return <p>Loading...</p>;
  }

  const getTRS = async () => {
    try {
      const response = await fetch(
        "https://bvq7tg35iuv6lbgndbqbwwhgim0mpnum.lambda-url.sa-east-1.on.aws/"
      );
      if (!response.ok) {
        throw new Error(`HTTPS error! Status: ${response.status}`);
      }
      const responseData = await response.json();
      console.log("getTokenFinancial: ", responseData);
    } catch (err) {
      console.log("getTokenFinancial: ", err);
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
  // Download PDF Handler => A
  const downloadPdf = () => {
    const pdfContent = pdfContentRef.current;

    if (!pdfContent) {
      console.error("pdfContent not found");
      return;
    }

    // Remove border around QRCode component
    const qrCode = pdfContent.querySelector("#qrcode");
    if (qrCode) {
      qrCode.style.border = "none";
    }

    domtoimage
      .toPng(pdfContent, { quality: 1 })
      .then((dataUrl) => {
        const pdf = new jsPDF("p", "mm", "a4");
        const imgWidth = 210; // A4 page width in mm
        const imgHeight =
          (pdfContent.clientHeight * imgWidth) / pdfContent.clientWidth;

        pdf.addImage(dataUrl, "PNG", 0, 0, imgWidth, imgHeight);

        pdf.save("ticket.pdf");
      })
      .catch((error) => {
        console.error("Error while creating PDF:", error);
      });
  };

  // Download PDF Handler => Final
  let pdfExportComponent;

  const handleExportToPDF = () => {
    if (pdfExportComponent) {
      pdfExportComponent.save();
    }
  };

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

  const downloadQR = () => {
    const svg = document.getElementById("qrcode");
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = function () {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");

      const downloadLink = document.createElement("a");
      downloadLink.download = "qrcode";
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
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
          // Generate and save the PDF
          const pdfContent = pdfContentRef.current;
          const dataUrl = await domtoimage.toPng(pdfContent, { quality: 1 });
          const base64Pdf = dataUrl.split(",")[1];

          // Create and save the EventAttendee record with the base64 PDF
          const newEventAttendee = await DataStore.save(
            new EventAttendee({
              eventID: eventID,
              attendeeID: attendee.id,
              authorized: false,
              checkIn: false,
              formAnswers: userData,
              ticket: base64Pdf, // Store the PDF as a base64 string
              email: "",
              allowContact: false,
              quantity,
              scanned: 0,
            })
          );
          setEventAttende(newEventAttendee)
          setFormRegister(true);
          // get token from USFQ
          getTRS();

        } catch (error) {
          // Handle any errors that occur during PDF generation or saving
          console.error("Error while creating or saving PDF:", error);
        }
      }
    } else {
      // Form is not valid, you can display a message or take any other action.
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
                  // Crear Attende
                  // Crear EventAttendee
                  // Luego del pago autorizar
                }}
                className="linear text-md mx-auto flex w-full max-w-[270px] items-center justify-center gap-1 rounded-xl bg-red-500 py-[12px] pl-3 pr-3 font-medium text-white transition duration-200 hover:bg-black"
              >
                Enviar y completar pago
              </button>
            </div>
          </>
        )}

        {userData.length !== 0 && (
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
                // onClick={handleExportToPDF}
                // onClick={downloadPdf}
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
                      className=" flex w-full flex-col items-center justify-between gap-[30px] px-2 pb-3 pt-12"
                    >
                      {/* QrCode + name of event + Logo  */}
                      <div className="flex w-full flex-col items-center justify-start ">
                        {/* => QrCode + Name of event + Logo  */}
                        <div className="flex items-center justify-center bg-white p-1">
                          {eventAttende && 
                            <QRCode
                              id="qrcode"
                              className="mb-[40px]"
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
                      <div className="items-right flex w-full flex-col justify-end">
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
                          </div>
                        ))}
                        <p className="mb-1 mb-2 mt-3 text-right text-sm font-normal">
                          {props.event.location}
                        </p>
                        <p className="l-auto mb-1 ml-auto max-w-fit bg-black px-2 py-[3px] text-right text-sm font-normal text-white">
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
