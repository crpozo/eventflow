import React,{ Component, createRef} from "react";
import { useNavigate } from "react-router-dom";
import Banner from "./components/Banner";
import { DataStore } from 'aws-amplify/datastore';
import { Form } from "models"
import {
  MdEditCalendar
} from "react-icons/md";
import $ from "jquery";
window.jQuery = $;
window.$ = $;
require('jquery-ui-sortable');
require('formBuilder');

const Dashboard = () => {

  const [form, setForm] = React.useState();
  const [formData, setFormData] = React.useState([]);
  const [formExist, setFormExist] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const navigate = useNavigate();
  const eventId = JSON.parse(localStorage.getItem("EVENTFLOW.event")).id;

  React.useEffect(() => {
    
    if(!eventId){
      navigate(`/admin`);
      return 
    }

    const sub = DataStore.observeQuery(Form, (f) =>
      f.formEventId.eq(eventId)
    ).subscribe(({ items }) => {
      if(items.length > 0){
        setForm(items[0])
        setFormData(items[0].questions);
        setFormExist(true);
        setLoading(false);
        console.log("Form observeQuery query: ", items[0])
      } else {
        console.log("No form data found");
      }
    });

    return () => {
      sub.unsubscribe();
    };

  }, [eventId, navigate]);

  async function createForm(formData) {
    await DataStore.save(
      new Form({
        "formEventId": eventId,
        "questions": formData,
      })
    );
    alert("Form creado con éxito");
  }

  async function updateForm(form, formData) {
    const updatedEvent= await DataStore.save(
      Form.copyOf(form, updated => {
        updated.questions = formData;
      })
    );
    setFormData(updatedEvent.questions);
    alert("Form actualizado con éxito");
  }
  
  class FormBuilder extends Component {

    fb = createRef();
    componentDidMount() {
      $(this.fb.current).formBuilder(
        { 
          formData,
          onSave: this.handleFormChange,
          i18n: {
            override: {
              'en-US': {
                save: 'Guardar',
                header: 'Titulo',
                dateField: 'Campo Fecha',
                number: 'Campo Número',
                paragraph: "Descripción",
                select: "Campo Seleccionar",
                text: "Campo texto",
                textArea: "Área texto",

              }
            }
          },
          typeUserAttrs: {
            select: {
              className: {
                label: 'Chart',
                options: {
                  'pie-chart form-control': 'Pie',
                  'bar-chart form-control': 'Bar',
                  'no-chart form-control': 'No chart',
                }
              }
            }
          },
          disableFields: ['autocomplete', 'button', 'hidden', 'radio-group', 'file', 'checkbox-group'],
          defaultFields: [
              {
                "type": "select",
                "required": true,
                "label": "Tipo de identificación",
                "name": "tipo_identificacion",
                "access": false,
                "multiple": false,
                "className": "no-chart form-control",
                "values": [
                    {
                        "label": "Cédula",
                        "value": "cedula",
                        "selected": true
                    },
                    {
                        "label": "Pasaporte",
                        "value": "pasaporte",
                        "selected": false
                    },
                    {
                        "label": "RUC",
                        "value": "ruc",
                        "selected": false
                    }
                ]
            },
            {
              "type": "text",
              "required": true,
              "label": "N° de Identificación",
              "className": "form-control",
              "name": "identificacion",
              "access": false,
              "subtype": "text"
            },
            {
              "type":"text",
              "required":true,
              "label":"Email",
              "className":"form-control",
              "access":false,
              "name":"email",
              "subtype":"email",
              "placeholder":"promero@yanbal.com",
            },
            {
              "type": "text",
              "required": true,
              "label": "Nombre y apellido",
              "placeholder": "Paula Romero",
              "className": "form-control",
              "name": "nombres",
              "access": false,
              "subtype": "text"
            },
            {
              "type": "text",
              "required": true,
              "label": "Dirección",
              "className": "form-control",
              "name": "direccion",
              "access": false,
              "subtype": "text"
            },
            {
              "type": "text",
              "required": true,
              "label": "Teléfono",
              "placeholder": "+593 99 5653 987",
              "className": "form-control",
              "name": "telefono",
              "access": false,
              "subtype": "text"
            }
          ],
          persistDefaultFields: true
        }
      );
    }

    handleFormChange = () => {

      const formData = $(this.fb.current).formBuilder('getData', 'json');
      console.log("formData: ", formData)
      if(formExist){
        if(formData){
          console.log("update")
          console.log("form: ", form)
          updateForm(form, JSON.parse(formData));
        }
      } else {
        console.log("crear")
        createForm(JSON.parse(formData));
      }
      
    };

    render() {
      return <div id="fb-editor" ref={this.fb} />;
    }

  }

  if (loading) {
    return (
      <div className="bottom-0 left-0 right-0 top-0 z-50 flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-lightPrimary opacity-[100%]">
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

  return (
    <div className="campus-page">
      <div className="grid h-full">
        <Banner />
      </div>
      <div className="!z-5 relative flex flex-col bg-white bg-clip-border shadow-card px-[14px] py-[20px] rounded-3xl sm:px-[14px] dark:!bg-navy-800 dark:text-white dark:shadow-none !z-5 overflow-hidden">
        <div className="flex items-center justify-between px-3 mb-[30px]">
            <p className="text-3xl flex items-center font-bold text-black dark:text-white">
              <MdEditCalendar className="h-12 w-12 mr-3" /> Acerca del Formulario
            </p>
          </div>
        <FormBuilder />
      </div>

    </div>
  );
};

export default Dashboard;
