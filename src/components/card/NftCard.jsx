import Card from "components/card";
import { useLocation, useNavigate } from "react-router-dom";

const NftCard = ({ modelName, modelID, model, pathEdit, pathSelect, title, date, cat, color}) => {

  const { state } = useLocation();
  const id = state?.id;
  const navigate = useNavigate();


  function formatDate(dateString){
    try{
      const date = new Date(dateString);
      const day = date.getDate();
      const month = date.toLocaleString('default', { month:'short' });
      const year = date.getFullYear();
      return `${day} ${month}. ${year}`
    }catch(e){ console.error("formatDate error: ", e)}
  }

  return (
    <Card
      extra={`flex flex-col w-full h-full p-0 bg-white  border border-gray-600`}
    >
      <div className="h-full w-full max-h-[305px]">
        <div className="relative w-full">
          <div className={`h-[25px] w-full rounded-t-md ${color}`}></div>
        </div>
              
        <div className="pt-2 pb-3 px-4">
          <div className="mb-5 flex items-center justify-between md:flex-col md:items-start lg:flex-row lg:justify-between xl:flex-col xl:items-start 3xl:flex-row 3xl:justify-between">
            <div className="mb-2">
              <p className="text-xl font-normal text-black dark:text-white">
                {" "}
                {title}{" "}
              </p>
              <p className="mt-1 mb-2 text-sm font-medium text-gray-500 md:mt-2">
                Última actualización: {formatDate(date)}
              </p>
            </div>

          </div>

          <div className="flex items-start justify-end gap-2 flex-col sm:flex-row sm:items-center">
            {pathEdit &&
            <button
                onClick={() => {
                  navigate(`${pathEdit}`, { state: { id: modelID }});
                }}
                className="linear rounded-md bg-transparent px-3 py-2 text-sm font-medium transition duration-200 border border-gray-600  hover:!bg-brand-500 hover:text-white active:bg-brand-700 focus:outline-brand-500  dark:bg-brand-400 dark:hover:bg-brand-300 dark:active:opacity-90"
              >
                Editar
            </button>
            }
            <button
              onClick={() => {
                navigate(`${pathSelect}`);
                if(modelName && model){
                  localStorage.setItem(`EVENTFLOW.${modelName}`, JSON.stringify(model))
                }
                if(modelName == "campus"){
                  window.localStorage.removeItem('EVENTFLOW.area');
                  window.localStorage.removeItem('EVENTFLOW.subarea');
                  window.localStorage.removeItem('EVENTFLOW.event');
                }
                if(modelName == "area"){
                  window.localStorage.removeItem('EVENTFLOW.subrea');
                  window.localStorage.removeItem('EVENTFLOW.event');
                }
                if(modelName == "subarea"){
                  window.localStorage.removeItem('EVENTFLOW.event');
                }
              }}
              className="linear rounded-md bg-transparent px-3 py-2 text-sm font-medium transition duration-200 border border-gray-600  hover:!bg-brand-500 hover:text-white active:bg-brand-700 focus:outline-brand-500 dark:bg-brand-400 dark:hover:bg-brand-300 dark:active:opacity-90"
            >
              {cat}
            </button>
          </div>

        </div>

      </div>
    </Card>
  );
};

export default NftCard;
