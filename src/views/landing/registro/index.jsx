import React,{ Component, createRef} from "react";
import {  useParams } from "react-router-dom";
import Banner from "./components/Banner";
import { DataStore } from "aws-amplify";
import { Form } from "models"
import $ from "jquery";
window.jQuery = $;
window.$ = $;
require('jquery-ui-sortable');
require('formBuilder');
require('formBuilder/dist/form-render.min.js');

const Dashboard = () => {

  const [formData, setFormData] = React.useState([]);
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

  return (
    <div className="campus-page">
      <div className="mt-3 grid h-full">
        {/* NFt Banner */}
        <Banner />
        <FormBuilder />
      </div>
    </div>
  );
};

export default Dashboard;
