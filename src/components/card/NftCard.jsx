import Card from "components/card";
import { YearView } from "react-calendar";
import { useLocation, useNavigate } from "react-router-dom";

const NftCard = ({ propId, pathEdit, pathSelect, title, date, cat, color}) => {

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
      <div className="h-full w-full">
        <div className="relative w-full">
          <div className={`h-[50px] w-full rounded-t-md ${color}`}></div>
        </div>
              
        <div className="p-4">
          <div className="mb-5 flex items-center justify-between md:flex-col md:items-start lg:flex-row lg:justify-between xl:flex-col xl:items-start 3xl:flex-row 3xl:justify-between">
            <div className="mb-2">
              <p className="mt-1 mb-2 text-sm font-medium text-gray-500 md:mt-2">
                Última actualización: {formatDate(date)}
              </p>
              <p className="text-xl font-semibold text-black break-all	dark:text-white">
                {" "}
                {title}{" "}
              </p>
            </div>

          </div>

          <div className="flex items-start justify-end gap-2 flex-col sm:flex-row sm:items-center">
            {pathEdit &&
            <button
                onClick={() => {
                navigate(`${pathEdit}`, { state: { id: propId} });
                }}
                className="linear rounded-md bg-transparent px-4 py-2 text-base font-medium transition duration-200 border border-gray-600  hover:!bg-brand-500 hover:text-white active:bg-brand-700 focus:outline-brand-500  dark:bg-brand-400 dark:hover:bg-brand-300 dark:active:opacity-90"
              >
                Editar
            </button>
            }
            <button
              onClick={() => {
              navigate(`${pathSelect}`, { state: { id: propId} });
              }}
              className="linear rounded-md bg-transparent px-4 py-2 text-base font-medium transition duration-200 border border-gray-600  hover:!bg-brand-500 hover:text-white active:bg-brand-700 focus:outline-brand-500 dark:bg-brand-400 dark:hover:bg-brand-300 dark:active:opacity-90"
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
