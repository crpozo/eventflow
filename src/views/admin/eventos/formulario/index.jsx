import React,{ Component, createRef} from "react";
import { useNavigate } from "react-router-dom";
import { DataStore } from 'aws-amplify/datastore';
import { Form } from "models"
import { EditableSection, useCanEditSection } from "components/sectionEdit";
import { PageHeader, Card } from "components/adminUi";
import { readStoredEvent } from "scripts/utils";
/* GRAPHQL */
import { generateClient } from 'aws-amplify/api';
import { getForm } from '../../../../graphql/queries';
import $ from "jquery";
window.jQuery = $;
window.$ = $;
require('jquery-ui-sortable');
require('formBuilder');

const Dashboard = () => {

  const [form, setForm] = React.useState();
  const [formData, setFormData] = React.useState([]);
  const [formExist, setFormExist] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();
  const storedEvent = readStoredEvent();
  const eventId = storedEvent?.id;
  const client = generateClient();
  const canEdit = useCanEditSection("formulario");

  React.useEffect( () => {

    async function startData() {
      const result = await client.graphql({ 
        query: getForm,
        variables: { id: eventId } 
      });
      if(result.data.getForm){
      }
    }

    // Set timet to load correctly all data
    setTimeout(() => {
      startData();
    }, 1000);

  }, [])

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
      } else {
        console.log("No form data found");
      }
    });

    return () => {
      sub.unsubscribe();
    };

  }, [eventId, navigate]);

  async function createForm(formData) {
    if (!canEdit) return;
    await DataStore.save(
      new Form({
        "formEventId": eventId,
        "questions": formData,
      })
    );
    alert("Form creado con éxito");
  }

  async function updateForm(form, formData) {
    if (!canEdit) return;
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
                    },
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
              "type": "text",
              "required": false,               
              "label": "Código Banner",
              "placeholder": "00216367",
              "className": "form-control",
              "name": "codigo_banner",
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
      if(formExist){
        if(formData){
          updateForm(form, JSON.parse(formData));
        }
      } else {
        createForm(JSON.parse(formData));
      }
      
    };

    render() {
      return <div id="fb-editor" ref={this.fb} />;
    }

  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] w-full flex-col items-center justify-center">
        <span className="loader"></span>
        <h2 className="mt-2 text-center text-xl text-black dark:text-white">
          Cargando...
        </h2>
      </div>
    );
  }

  return (
    <div className="campus-page mt-3">
      <PageHeader
        crumbs={[
          { label: "Eventos", to: "/admin/eventos" },
          { label: storedEvent?.title || "Evento" },
          { label: "Formulario" },
        ]}
        title="Formulario de registro"
        subtitle="Preguntas que responden los asistentes al inscribirse."
      />
      <Card>
        <EditableSection section="formulario">
          <FormBuilder />
        </EditableSection>
      </Card>
    </div>
  );
};

export default Dashboard;
