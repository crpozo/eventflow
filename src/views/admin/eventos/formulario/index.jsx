import React,{ Component, createRef} from "react";
import { useNavigate } from "react-router-dom";
import Banner from "./components/Banner";
import { DataStore } from "aws-amplify";
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
        console.log("Form: ", items[0])
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
                save: 'Guardar'
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
                }
              }
            }
          }
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

  return (
    <div className="campus-page">
      <div className="grid h-full">
        <Banner />
      </div>
      <div className="!z-5 relative flex flex-col bg-white bg-clip-border shadow-3xl shadow-shadow-500 px-[14px] py-[20px] rounded-3xl sm:px-[14px] dark:!bg-navy-800 dark:text-white dark:shadow-none !z-5 overflow-hidden">
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
