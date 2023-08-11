import ReactEcharts from "echarts-for-react"; 
import Card from "components/card";

const PieChartApache = (props) => {

  return (
    <Card extra="rounded-[20px] p-3">
      <div className="flex flex-row justify-between px-3 pt-2 mb-5">
        <div>
          <h4 className="text-lg font-bold text-navy-700 dark:text-white">
            Gráfico circular
          </h4>
        </div>

        {/* <div className="mb-6 flex items-center justify-center">
          <select className="mb-3 mr-2 flex items-center justify-center text-sm font-bold text-gray-600 hover:cursor-pointer dark:!bg-navy-800 dark:text-white">
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="weekly">Weekly</option>
          </select>
        </div> */}

      </div>

      <div className="mb-auto h-[220px] w-full">
        <ReactEcharts option={props.option} />
      </div>
    </Card>
  );
};

export default PieChartApache;
