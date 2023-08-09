import React,{ Component, createRef} from "react";
import { useNavigate, useParams } from "react-router-dom";
import Banner from "./components/Banner";
import { DataStore } from "aws-amplify";
import { Form } from "models"
import $ from "jquery";
window.jQuery = $;
window.$ = $;
require('jquery-ui-sortable');
require('formBuilder');

// En vez de useParams usar localStorage

const Dashboard = () => {

  const [form, setForm] = React.useState();
  const [formData, setFormData] = React.useState([]);
  const [formExist, setFormExist] = React.useState(false);
  const id = useParams().id;
  const navigate = useNavigate();

  React.useEffect(() => {
    
    if(!id || id === "no-id"){
      navigate(`/admin/eventos`);
      return 
    }

    DataStore.query(Form, (c) => c.formEventId.eq(id)).then( results => {
      if(results.length > 0){
        setForm(results[0])
        setFormData(results[0].questions);
        setFormExist(true);
        console.log(results[0])
      } else {
        console.log("No form data found");
      }
    });

  }, [id, navigate]);

  async function createEvent(formData) {
    await DataStore.save(
      new Form({
        "formEventId": id,
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
        createEvent(JSON.parse(formData));
      }
      
    };

    render() {
      return <div id="fb-editor" ref={this.fb} />;
    }

  }

  return (
    <div className="campus-page">
      <div className="mt-3 grid h-full">
        <Banner />
      </div>

      <FormBuilder />

    </div>
  );
};

export default Dashboard;
