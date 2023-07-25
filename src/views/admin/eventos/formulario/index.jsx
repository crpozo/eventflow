import React,{ Component, createRef} from "react";
import { useNavigate, useParams } from "react-router-dom";
import Banner from "./components/Banner";
import { DataStore } from "aws-amplify";
import { Event } from "models"
import $ from "jquery";
window.jQuery = $;
window.$ = $;
require('jquery-ui-sortable');
require('formBuilder');

  // Obtener json de las preguntas creadas y guardar en la base de datos: guardar en base de datos.
  // Al cargar de nuevo la página obtener el JSON de preguntas y cargar el form builder
  // En la landing cargar el json de la base de datos y mostrarlo listo para responderse.

const Dashboard = () => {

  const formData = [
    {
      type: "header",
      subtype: "h1",
      label: "formBuilder in React"
    },
    {
      type: "paragraph",
      label: "This is a demonstration of formBuilder running in a React project."
    }
  ];

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
      console.log("formData: ",formData);
    };

    render() {
      return <div id="fb-editor" ref={this.fb} />;
    }
  }

  const id = useParams().id;
  const navigate = useNavigate();

  React.useEffect(() => {
    console.log(id)
    if(!id || id === "no-id"){
      navigate(`/admin/eventos`);
      return 
    }    
  }, [id, navigate]);

  const handleSaveClick = () => {
    const formBuilder = $(document.getElementById("build-wrap")).formBuilder();
    formBuilder.actions.getData('json', true)
  };

  return (
    <div className="campus-page">
      <div className="mt-3 grid h-full">
        <Banner />
      </div>

      <FormBuilder />

      <button id="saveData" onClick={handleSaveClick}>
        Guardar
      </button>

      {/* <DemoBar />
      <ReactFormBuilder
        toolbarItems={items}
      /> */}
      
    </div>
  );
};

export default Dashboard;
