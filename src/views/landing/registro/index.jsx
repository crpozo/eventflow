import React,{ Component, createRef} from "react";
import logo from "assets/img/usfq/logo.svg";
import QRCode from "react-qr-code";
import {  useParams, Link } from "react-router-dom";
import { HiOutlineDocumentText } from "react-icons/hi";
import { MdChevronLeft } from "react-icons/md";
import { DataStore } from "aws-amplify";
import { Form } from "models"
import $ from "jquery";
window.jQuery = $;
window.$ = $;
require('jquery-ui-sortable');
require('formBuilder');
require('formBuilder/dist/form-render.min.js');

const Registro = ( props ) => {

  const [formData, setFormData] = React.useState([]);
  const [userData, setUserData] = React.useState([]);
  const [formRegister, setFormRegister] = React.useState(false);
  const id = useParams().id;

  React.useEffect(() => {
    // AWS amplify data 
    DataStore.query(Form, (c) => c.formEventId.eq(id)).then( results => {
      if(results.length > 0){
        setFormData(results[0].questions);
        console.log(results[0])
      } else {
        console.log("No form data found");
      }
    });
  }, [id]);

  if(!formData){
    return <p>Loading...</p>
  }

  class FormBuilder extends Component {

    fb = createRef();
    componentDidMount() {
      $(this.fb.current).formRender(
        { 
          dataType: 'json',
          formData
        }
      );
    }

    render() {
      return <div id="fb-editor" ref={this.fb} />;
    }
  }

  const handleSubmit = () => {
    clearErrorMessages(); 
    const isValid = validateForm();
  
    if (isValid) {
      const fbRender = document.querySelector("#fb-editor");
      const userData = $(fbRender).formRender("userData");
      setUserData(userData);
      console.log(userData);
      setFormRegister(true);
    } else {
      // Form is not valid, you can display a message or take any other action.
      console.log("Form is not valid");
    }
  };

  const validateForm = () => {
    const form = document.querySelector("#fb-editor .rendered-form");
    const formElements = form.querySelectorAll("[required]");
    let isValid = true;
  
    formElements.forEach((element) => {
      if (!element.checkValidity()) {
        isValid = false;
        // You can display error messages or handle errors as needed.
        // For example, you can show an error message for each invalid field.
        const error = document.createElement("div");
        error.className = "error-message";
        error.textContent = element.validationMessage;
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
    console.log("data:image/svg+xml;base64," + btoa(svgData))
  };

  return (
    <div className="campus-page">
      <div className="grid h-full">
        { !formRegister && 
        <>
          <Link
            onClick={() => {
              props.setShowRegister(false)
            }}
            className="flex gap items-center mb-4 font-medium text-brand-500 hover:no-underline hover:text-navy-700 dark:hover:text-white">
            <MdChevronLeft className="h-7 w-7" /> Regresar
          </Link>

          <h2 className="flex justify-center gap-2 text-4xl font-bold mb-5">
            <HiOutlineDocumentText className="h-10 w-10" /> Formulario de Registro
          </h2>
          <div className="w-full max-w-[1000px] mx-auto">
            <FormBuilder />
            <div className="mb-5"></div>
            <button href="crear" type="submit" onClick={() => {              
              handleSubmit();
              
              // Crear Attende
              // Crear EventAttendee
              // Luego del pago autorizar

            }}
            className="w-full max-w-[270px] mx-auto linear flex justify-center items-center gap-1 pr-3 pl-3 rounded-xl bg-red-500 py-[12px] text-md font-medium text-white transition duration-200 hover:bg-black">
              Enviar y completar pago
            </button>
          </div>
        </>
      }
      
      {userData.length !== 0 && (
        <>
          <div className="flex flex-col items-center justify-center mb-[35px] text-center">
            <h1 className="text-2xl mb-1">Compra éxitosa!</h1>
            <h2 className="text-xl mb-4">Descargue su ticket para escanearlo en el evento</h2>
            <button href="descargar" onClick={() => {
              downloadQR()
            }}
            className="w-full max-w-[270px] mx-auto linear flex justify-center items-center gap-1 pr-3 pl-3 rounded-xl bg-red-500 py-[12px] text-md font-medium text-white transition duration-200 hover:bg-black">
              Descargar PDF
            </button>
          </div>

          <div className="flex flex-col items-center justify-center md:w-[550px] max-w-[800px]
          border border-gray-500 rounded-sm mx-auto py-[30px] px-[30px] mb-4">
            
            <img src={logo} className="w-[150px] mb-4" />
            
            <h1 className="text-2xl font-bold mb-4">{props.landing.title}</h1>

            <QRCode
              id="qrcode"
              className="mb-[40px]"
              size={200}
              style={{ height: "auto" }}
              value="5fa09b0e-9fb1-4778-962b-fe1530b83e2c"
              viewBox={`0 0 200 200`}
            />

            <div className="w-full border border-gray-500 mb-[30px]"></div>
            {userData.map((data, i) => (
              <div key={i}>
                {data.name == "text-1692266990765-0" && <p className="text-xl mb-2" >{data.userData[0]}</p>}
                {data.name == "text-1692267033618-0" && <p className="text-lg mb-2">{data.userData[0]}</p>}
                {data.name == "text-1692267060603-0" && <p className="text-lg mb-2">{data.userData[0]}</p>}
              </div>
            ))}

            <p className="text-lg mb-2">Viernes, Junio 16/06/2023 - 18:00pm</p>
            <p className="text-lg mb-2">Universidad San Francisco de Quito, Campus Cumbayá</p>
          </div>
        </>
      )}

      </div>
    </div>
  );
};

export default Registro;
