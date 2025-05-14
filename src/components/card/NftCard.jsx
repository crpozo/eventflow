import Card from "components/card";
import { useLocation, useNavigate } from "react-router-dom";

const NftCard = ({ modelName, modelID, model, pathEdit, pathSelect, title, date, cat, color }) => {
  const { state } = useLocation();
  const id = state?.id;
  const navigate = useNavigate();

  function formatDate(dateString) {
    try {
      const date = new Date(dateString);
      const day = date.getDate();
      const month = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();
      return `${day} ${month}. ${year}`;
    } catch (e) {
      console.error("formatDate error: ", e);
    }
  }

  const handleSelect = () => {
    navigate(`${pathSelect}`);

    if (modelName && model) {
      localStorage.setItem(`EVENTFLOW.${modelName}`, JSON.stringify(model));
    }

    if (modelName === "campus") {
      localStorage.removeItem('EVENTFLOW.area');
      localStorage.removeItem('EVENTFLOW.subarea');
      localStorage.removeItem('EVENTFLOW.event');
    }

    if (modelName === "area") {
      localStorage.removeItem('EVENTFLOW.subarea');
      localStorage.removeItem('EVENTFLOW.event');
    }

    if (modelName === "subarea") {
      localStorage.removeItem('EVENTFLOW.event');
    }
  };

  return (
    <Card extra="flex flex-col w-full h-full p-0 bg-white border border-gray-200 shadow-sm hover:shadow-md transition">
      <div className="flex flex-col h-full">
        <div className={`h-[25px] w-full rounded-t-md ${color}`} />

        <div className="flex flex-col justify-between flex-1 p-4 gap-4">
          <div>
            <h3 className="text-xl text-gray-800 dark:text-white">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">
              Última actualización: {formatDate(date)}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-end">
            {pathEdit && (
              <button
                onClick={() => navigate(`${pathEdit}`, { state: { id: modelID } })}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-brand-500 text-[#909090] hover:text-white transition"
              >
                Editar
              </button>
            )}

            <button
              onClick={handleSelect}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-[#909090] hover:bg-brand-500 hover:text-white transition focus:outline-none"
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
