import React from "react";
import PieChartApache from "views/admin/reportes/components/PieChartApache";
import { IoMdHome } from "react-icons/io";
import { IoDocuments } from "react-icons/io5";
import { MdBarChart, MdDashboard } from "react-icons/md";
import Widget from "components/widget/Widget";
import DailyTraffic from "views/admin/default/components/DailyTraffic";
import { useNavigate} from "react-router-dom";
import { DataStore } from "aws-amplify";
import { Campus, Area, Career, Event, Attendee } from "models"
import Banner from "./components/Banner";
import Datepicker from "react-tailwindcss-datepicker"; 
import {
  MdFileDownload,
} from "react-icons/md";

const Dashboard = () => {

  // Get all event ids 
  // Agregar filtros y realizar GET con estos valores
  // Agregar datepicker

  const navigate = useNavigate();

  const [campusList, setCampusList] = React.useState(null);
  const [campusSelectID, setCampusSelectID] = React.useState('');
  const [areaList, setAreaList] = React.useState(null);
  const [areaSelectID, setAreaSelectID] = React.useState(null);
  const [careerList, setCareerList] = React.useState(null);
  const [careerSelectID, setCareerSelectID] = React.useState(null);
  const [eventList, setEventList] = React.useState(null);
  const [eventSelectID, setEventSelectID] = React.useState(null);

  const id = "caede638-3700-4231-aaf5-71596b78a35f";
  const campusID = localStorage.getItem('campusID');
  const subAreaId = localStorage.getItem('subAreaID');

  const [value, setValue] = React.useState({ 
    startDate: new Date(), 
    endDate: new Date().setMonth(8) 
    }); 

  const handleValueChange = (newValue) => {
    console.log("newValue:", newValue); 
    setValue(newValue); 
  } 


  React.useEffect( () => {
    if(!subAreaId){
      navigate(`/page/campus`);
    }
  }, [navigate]);

  const [option, setOption] = React.useState({
    title: {
      text: 'Cargos de participantes',
      subtext: 'Real Time Data',
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

  React.useEffect(() => {

    DataStore.query(Campus).then( results => {
      setCampusList(results);
      setCampusSelectID(results[0].id);
      console.log("Campus: ",results)
    });
  }, [])

  // Get area depending on the the campus ID
  React.useEffect(() => {
    DataStore.query(Area, (a) => a.campusID.eq(campusSelectID)).then( results => {
      if(results.length > 0){
        setAreaList(results);
        setAreaSelectID(results[0].id);
      } else {
        setAreaSelectID('');
        setAreaList([ {title: "Vacio"} ]);
      }
      console.log("Area: ",results)
    });
  }, [campusSelectID]);

  // Get subarea depending on the the area ID
  React.useEffect(() => {
    DataStore.query(Career, (c) => c.areaID.eq(areaSelectID)).then( results => {
      if(results.length > 0){
        setCareerList(results);
        setCareerSelectID(results[0].id)
      } else {
        setCareerSelectID('')
        setCareerList([ {title: "Vacio"} ]);
      }
      console.log("Career: ",results)
    });
  }, [areaSelectID]);

  // Get events depending on the subarea ID
  React.useEffect(() => {
    DataStore.query(Event, (e) => e.careerID.eq(careerSelectID)).then( results => {
      if(results.length > 0){
        setEventList(results);
        setEventSelectID(results[0].id)
      } else {
        setEventSelectID('');
        setEventList([ {title: "Vacio"} ]);
      }
      console.log("Event: ",results)
    });
  }, [careerSelectID]);


  // Get Diagrams
  React.useEffect(() => {

    DataStore.query(Attendee, (a) => a.EventAttendees.eventID.eq(eventSelectID)).then( results => {
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
  
  }, [eventSelectID]);

  return (
    <div className="report-page">

      <Banner />

      <button href="crear" className="linear flex items-center gap-1 pr-3 pl-3 rounded-xl bg-green-500 py-[12px] text-sm font-medium text-white transition duration-200 mb-4 hover:bg-black dark:bg-brand-400 dark:text-white dark:hover:bg-brand-300 dark:active:bg-green-200">
        Exportal Excel <MdFileDownload className="h-5 w-5" />
      </button>
      <div className="filters mt-3 mb-[35px]">
        <div className="relative w-full flex gap-5">

          <div className="flex flex-col w-full">
            <label>Campus</label>
            <select
                className="w-full py-2.5 pl-3 pr-[40px] text-black bg-white border rounded-md shadow-sm outline-none appearance-none text-ellipsis	focus:border-indigo-600 select-arrow"
                onChange={(e) => setCampusSelectID(e.target.value)}
                value={campusSelectID}
              >
                {campusList &&
                  campusList.map((result) => (
                    <option key={result.id} value={result.id}>
                      {result.title}
                    </option>
                ))}
            </select>
          </div>

          <div className="flex flex-col w-full">
            <label>Área</label>
            <select
                className="w-full py-2.5 pl-3 pr-[40px] text-black bg-white border rounded-md shadow-sm outline-none appearance-none text-ellipsis	focus:border-indigo-600 select-arrow"
                onChange={(e) => setAreaSelectID(e.target.value)}
              >
                {areaList &&
                  areaList.map((result) => (
                    <option key={result.id} value={result.id}>
                      {result.title}
                    </option>
                ))}
            </select>
          </div>

          <div className="flex flex-col w-full">
            <label>Subárea</label>
            <select
                className="w-full py-2.5 pl-3 pr-[40px] text-black bg-white border rounded-md shadow-sm outline-none appearance-none text-ellipsis	focus:border-indigo-600 select-arrow"
                onChange={(e) => setCareerSelectID(e.target.value)}
              >
                {careerList &&
                  careerList.map((result) => (
                    <option key={result.id} value={result.id}>
                      {result.title}
                    </option>
                ))}
            </select>
          </div>

          <div className="flex flex-col w-full">
            <label>Eventos</label>
            <select
                className="w-full py-2.5 pl-3 pr-[40px] text-black bg-white border rounded-md shadow-sm outline-none appearance-none text-ellipsis	focus:border-indigo-600 select-arrow"
                onChange={(e) => setEventSelectID(e.target.value)}
              >
                {eventList &&
                  eventList.map((result) => (
                    <option key={result.id} value={result.id}>
                      {result.title}
                    </option>
                ))}
            </select>
          </div>

          <div className="date-filter flex flex-col w-full">
            <label>Fechas</label>
            <Datepicker 
              i18n={"es"} 
              value={value} 
              onChange={handleValueChange} 
            />
          </div>

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
