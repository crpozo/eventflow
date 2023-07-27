import React from "react";
import PieChartApache from "views/admin/reportes/components/PieChartApache";
import { IoMdHome } from "react-icons/io";
import { IoDocuments } from "react-icons/io5";
import { MdBarChart, MdDashboard } from "react-icons/md";
import Widget from "components/widget/Widget";
import DailyTraffic from "views/admin/default/components/DailyTraffic";
import { useNavigate} from "react-router-dom";
import { DataStore } from "aws-amplify";
import { Attendee } from "models"

const Dashboard = () => {

  // Get all event ids 
  // Agregar filtros y realizar GET con estos valores
  // Agregar datepicker

  const navigate = useNavigate();
  const id = "caede638-3700-4231-aaf5-71596b78a35f";

  React.useEffect( () => {
    const subAreaId = localStorage.getItem('subAreaId');
    if(!subAreaId){
      navigate(`/page/campus`);
    }
  }, [navigate]);

  const [option, setOption] = React.useState({
    title: {
      text: 'Referer of a Website',
      subtext: 'Fake Data',
      left: 'center'
    },
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: 'Access From',
        type: 'pie',
        radius: '50%',
        data: [
          { value: 1048, name: 'Search Engine' },
          { value: 735, name: 'Direct' },
          { value: 580, name: 'Email' },
          { value: 484, name: 'Union Ads' },
          { value: 300, name: 'Video Ads' }
        ], 
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  });

  // Get data from attendees via ID
  React.useEffect(() => {
   
    DataStore.query(Attendee, (a) => a.events.event.id.eq(id)).then( results => {
      console.log(results)
      const countMap = {};

      results.forEach(item => {
        const value = item.position;
        if (countMap[value]) {
          countMap[value] += 1;
        } else {
          countMap[value] = 1;
        }
      });
  
      // Crear un array en el formato esperado por el gráfico
      const processedData = Object.keys(countMap).map(value => ({
        value: countMap[value],
        name: value,
      }));

      setOption(prevOption => ({
        ...prevOption,
        series: [
          {
            ...prevOption.series[0],
            data: processedData,
          },
        ],
      }));

    });
  
  }, []);

  return (
    <div className="report-page">

      <div className="filters mt-3">
        <div className="relative w-full lg:max-w-sm">
          <select className="w-full p-2.5 text-gray-500 bg-white border rounded-md shadow-sm outline-none  appearance:none focus:border-indigo-600 select-arrow">
              <option>ReactJS Dropdown</option>
              <option>Laravel 9 with React</option>
              <option>React with Tailwind CSS</option>
              <option>React With Headless UI</option>
          </select>
        </div>
      </div>

      {/* Card widget */}

      <div className="mt-3 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-3 3xl:grid-cols-6">
        <Widget
          icon={<MdBarChart className="h-7 w-7" />}
          title={"Earnings"}
          subtitle={"$340.5"}
        />
        <Widget
          icon={<IoDocuments className="h-6 w-6" />}
          title={"Spend this month"}
          subtitle={"$642.39"}
        />
        <Widget
          icon={<MdBarChart className="h-7 w-7" />}
          title={"Sales"}
          subtitle={"$574.34"}
        />
        <Widget
          icon={<MdDashboard className="h-6 w-6" />}
          title={"Your Balance"}
          subtitle={"$1,000"}
        />
        <Widget
          icon={<MdBarChart className="h-7 w-7" />}
          title={"New Tasks"}
          subtitle={"145"}
        />
        <Widget
          icon={<IoMdHome className="h-6 w-6" />}
          title={"Total Projects"}
          subtitle={"$2433"}
        />
      </div>

      {/* Tables & Charts */}

      <div className="mt-5 grid grid-cols-1 gap-5">

        {/* Traffic chart & Pie Chart */}

        <div className="grid grid-cols-1 gap-5 rounded-[20px] md:grid-cols-2">
          <DailyTraffic />
          <PieChartApache option={option}/>
        </div>
        
      </div>
    </div>
  );
};

export default Dashboard;
