import React, { useEffect, useState } from "react";
import { graphic } from "echarts";
import { MdBarChart } from "react-icons/md";
import Widget from "components/widget/Widget";
import { useNavigate } from "react-router-dom";
import { DataStore } from "aws-amplify";
import {
  Campus,
  Area,
  Career,
  Event,
  Attendee,
  EventAttendee,
  Form,
} from "models";
import Banner from "./components/Banner";
import Datepicker from "react-tailwindcss-datepicker";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { MdFileDownload } from "react-icons/md";
import { AiOutlineWarning } from "react-icons/ai";
import PieChartApache from "views/admin/reportes/components/PieChartApache";

const Reportes = () => {

  /*******************************************/
  /************** INIT VARIABLES *************/
  /*******************************************/

  const [campusList, setCampusList] = useState(null);
  const [campusSelectID, setCampusSelectID] = useState("");
  const [areaList, setAreaList] = useState(null);
  const [areaSelectID, setAreaSelectID] = useState(null);
  const [careerList, setCareerList] = useState(null);
  const [careerSelectID, setCareerSelectID] = useState(null);
  const [eventList, setEventList] = useState(null);
  const [eventSelectID, setEventSelectID] = useState(null);
  const [attendees, setAttendees] = useState(null);
  const [chartsData, setChartsData] = useState([]);

  const subAreaId = JSON.parse(localStorage.getItem("EVENTFLOW.subarea"))?.id;

  const navigate = useNavigate();
  const [totalCheckIn, setTotalCheckIn] = React.useState(0);
  const [totalRegistros, setTotalRegistros] = React.useState(0);

  const [optionTipo, setOptionTipo] = React.useState({
    xAxis: {
      type: "category",
      data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    },
    yAxis: {
      type: "value",
    },
    title: {
      text: "Tipo de participantes",
      subtext: "Real Time Data",
      left: "center",
      textStyle: {
        fontSize: 23,
      },
      subtextStyle: {
        fontSize: 14,
      },
    },
    color: new graphic.LinearGradient(0, 0, 0, 1, [
      { offset: 0, color: "#83bff6" },
      { offset: 0.5, color: "#188df0" },
      { offset: 1, color: "#188df0" },
    ]),
    tooltip: {
      trigger: "item",
    },
    legend: {
      orient: "horizontal",
      top: "bottom",
      textStyle: {
        fontSize: 14,
      },
    },
    series: [
      {
        name: "N° participantes",
        type: "bar",
        showBackground: true,
        data: [
          { value: 1048, name: "Search Engine" },
          { value: 735, name: "Direct" },
          { value: 580, name: "Email" },
          { value: 484, name: "Union Ads" },
          { value: 300, name: "Video Ads" },
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.5)",
          },
        },
      },
    ],
  });

  const [optionCargos, setOptionCargos] = React.useState({
    title: {
      text: "Cargos de participantes",
      subtext: "Real Time Data",
      left: "center",
      textStyle: {
        fontSize: 23,
      },
      subtextStyle: {
        fontSize: 14,
      },
    },
    color: ["#3C83F5", "#FCF054", "#C6BFFA", "#000000", "#C5CBD2"],
    tooltip: {
      trigger: "item",
    },
    legend: {
      orient: "horizontal",
      top: "bottom",
      textStyle: {
        fontSize: 14,
      },
    },
    series: [
      {
        name: "Access From",
        type: "pie",
        radius: "50%",
        data: [
          { value: 1048, name: "Search Engine" },
          { value: 735, name: "Direct" },
          { value: 580, name: "Email" },
          { value: 484, name: "Union Ads" },
          { value: 300, name: "Video Ads" },
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.5)",
          },
        },
      },
    ],
  });

  const [optionEdad, setOptionEdad] = React.useState({
    title: {
      text: "Edad de participantes",
      subtext: "Real Time Data",
      left: "center",
      textStyle: {
        fontSize: 23,
      },
      subtextStyle: {
        fontSize: 14,
      },
    },
    color: ["#3C83F5", "#FCF054", "#C6BFFA", "#000000", "#C5CBD2"],
    tooltip: {
      trigger: "item",
    },
    legend: {
      orient: "horizontal",
      top: "bottom",
      textStyle: {
        fontSize: 14,
      },
    },
    series: [
      {
        name: "Access From",
        type: "pie",
        radius: "50%",
        data: [
          { value: 1048, name: "Search Engine" },
          { value: 735, name: "Direct" },
          { value: 580, name: "Email" },
          { value: 484, name: "Union Ads" },
          { value: 300, name: "Video Ads" },
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.5)",
          },
        },
      },
    ],
  });

  /*******************************************/
  /************ FILTERS * GET DATA ***********/
  /*******************************************/

  // Get campus results as observer
  React.useEffect(() => {
    if (!subAreaId) {
      navigate(`/page/campus`);
    } else {
      const subscription  = DataStore.observeQuery(Campus).subscribe((results) => {
        console.log("Campus: ", results.items);
        if(results.items.length > 0){
          setCampusList(results.items);
          setCampusSelectID(results.items[0].id);
        }
      });
  
      if(campusList){
        subscription.unsubscribe();
      }
    }
  }, [navigate]);

  // Get area depending on the the campus ID
  React.useEffect(() => {
    DataStore.query(Area, (a) => a.campusID.eq(campusSelectID)).then(
      (results) => {
        if (results.length > 0) {
          setAreaList(results);
          setAreaSelectID(results[0].id);
          setChartsData([]);
        } else {
          setChartsData([]);
          setAreaSelectID("");
          setAreaList([{ title: "Vacio" }]);
        }
        setChartsData([]);
      }
    );

  }, [campusSelectID]);

  // Get subarea depending on the the area ID
  React.useEffect(() => {
    DataStore.query(Career, (c) => c.areaID.eq(areaSelectID)).then(
      (results) => {
        if (results.length > 0) {
          setChartsData([]);
          setCareerList(results);
          setCareerSelectID(results[0].id);
        } else {
          setChartsData([]);
          setCareerSelectID("");
          setCareerList([{ title: "Vacio" }]);
        }
        console.log("Career: ", results);
      }
    );
  }, [areaSelectID]);

  // Get events depending on the subarea ID
  React.useEffect(() => {
    DataStore.query(Event, (e) => e.careerID.eq(careerSelectID)).then(
      (results) => {
        if (results.length > 0) {
          setEventList(results);
          setEventSelectID(results[0].id);
        } else {
          // Reset
          setEventSelectID("");
          setEventList([{ title: "Vacio" }]);
          setOptionTipo((prevOption) => ({
            ...prevOption,
            series: [
              {
                ...prevOption.series[0],
                data: null,
              },
            ],
          }));
          setOptionCargos((prevOption) => ({
            ...prevOption,
            series: [
              {
                ...prevOption.series[0],
                data: null,
              },
            ],
          }));
          setOptionEdad((prevOption) => ({
            ...prevOption,
            series: [
              {
                ...prevOption.series[0],
                data: null,
              },
            ],
          }));
          setTotalCheckIn(null);
          setTotalRegistros(null);
        }
        console.log("Event: ", results);
      }
    );
  }, [careerSelectID]);

  // Get EventAttendee data on loading or selecting an event
  React.useEffect(() => {
    if (eventSelectID == 0) {
      const eventListID = eventList.map((event) => event.id);

      DataStore.query(EventAttendee).then((results) => {
        console.log("EventAttendee ALL: ",results)
        const filteredData = results.filter((item) =>
          eventListID.includes(item.eventID)
        );
      });

    } else {

      DataStore.query(Attendee, (a) =>
        a.EventAttendees.eventID.eq(eventSelectID)
      ).then((results) => {
        processChart(results, setOptionCargos, "position");
        processChart(results, setOptionEdad, "age");
        processChart(results, setOptionTipo, "type");
      });

      DataStore.query(EventAttendee, (e) => e.eventID.eq(eventSelectID)).then(
        (results) => {
          setChartsData([]);
          console.log("EventAttendee: ", results);
          if(results.length > 0){
            setTotalRegistros(results.length);
            setTotalCheckIn(
              results.filter((item) => item.checkIn === true).length
            );
            setAttendees(
              results.length > 0 ? results.map((item) => item.formAnswers) : null
            );
          } else {
            setTotalCheckIn(0);
            setTotalRegistros(0)
          }
        }
      );

    }
  }, [eventSelectID]);

  // Set charts with new data
  function processChart(results, setOptionFunction, type) {
    const countMap = {};
    let value;

    results.forEach((item) => {
      if (type == "position") value = item.position;
      if (type == "age") value = item.age;
      if (type == "type") value = item.type;
      if (countMap[value]) {
        countMap[value] += 1;
      } else {
        countMap[value] = 1;
      }
    });

    if (type == "type") {
      const processedData = Object.keys(countMap).map((value) => ({
        value: countMap[value],
        name: value,
        label: {
          fontSize: 15,
        },
      }));

      setOptionFunction((prevOption) => ({
        ...prevOption,
        xAxis: {
          type: "category",
          data: Object.keys(countMap),
        },
        yAxis: {
          type: "value",
        },
        series: [
          {
            ...prevOption.series[0],
            data: processedData,
          },
        ],
      }));
    } else {
      const processedData = Object.keys(countMap).map((value) => ({
        value: countMap[value],
        name: value,
        label: {
          fontSize: 15,
        },
      }));

      setOptionFunction((prevOption) => ({
        ...prevOption,
        series: [
          {
            ...prevOption.series[0],
            data: processedData,
          },
        ],
      }));
    }
  }

  /*******************************************/
  /*************** EXCEL EXPORT **************/
  /*******************************************/

  // Excel data flatten handler
  function flattenData(data) {
    const flattenedData = [];

    data.forEach((array) => {

      // We remove header and paragraph from array
      let filteredArray = array.filter(item => {
        let type = item.type;
        return type !== "header" && type !== "paragraph";
      });

      const flatArray = filteredArray.map((item) => {
        const flatItem = {
          Tipo: item.type,
          Campo: item.label,
          Valor: item.userData[0],
        };

        return flatItem;
      });

      flattenedData.push(flatArray);
    });

    return flattenedData;
  }

  // With header variant
  function exportToExcel(data, charsData) {
    if (!charsData || charsData.length == 0) {
      alert("No existen datos en el evento seleccionado");
      return;
    }

    const flattenedData = flattenData(data);
    const eventName = eventList.find((item) => item.id === eventSelectID).title;

    const header = [eventName]; // Add the header text

    const ws = XLSX.utils.json_to_sheet(flattenedData.flat());
    XLSX.utils.sheet_add_aoa(ws, [header], { origin: "A1" }); // Add the header at A1 position
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `${eventName}.xlsx`);
  }

  // Chart data handler
  function groupEventData(eventData, formData) {
    const groupedData = {};

    const updatedArray = eventData.map(questions => {
      return questions.map(question => {
        const matchingFormQuestion = formData.find(formQuestion => formQuestion.name.includes(question.name));
        if (matchingFormQuestion) {
          // Create a shallow copy of the object
          const modifiedQuestion = { ...question };
          // Modify the property in the copy
          modifiedQuestion.className = matchingFormQuestion.className;
          // Return the modified question
          return modifiedQuestion;
        } else {
          // If there is no match, return the question unchanged.
          return question;
        }
      });
    });

    if (updatedArray && updatedArray.length > 0) {
      // Iterate through each event item
      updatedArray.forEach( (eventItem, index) => {
        eventItem.forEach( question => {
          // Check if the question is required
          if (question.type === "number" || question.type === "select") {
            const label = question.label;
            const userData = question.userData[0]; // Assuming there's only one value in userData
            const match = question.className.match(/(.*)-chart/);
            const type = (match ? match[1] : "default") + '-chart';
            let options;

            // Determine the chart options based on the chart type
            if (type === "pie-chart") {
              options = {
                title: {
                  text: `${label}`,
                  subtext: "Real Time Data",
                  left: "center",
                  textStyle: {
                    fontSize: 23,
                  },
                  subtextStyle: {
                    fontSize: 14,
                  },
                },
                color: ["#3C83F5", "#FCF054", "#C6BFFA", "#000000", "#C5CBD2"],
                tooltip: {
                  trigger: "item",
                },
                legend: {
                  orient: "horizontal",
                  top: "bottom",
                  textStyle: {
                    fontSize: 14,
                  },
                },
                series: [
                  {
                    name: label,
                    type: "pie",
                    radius: "50%",
                    data: [], // This will be populated with userData and count
                    emphasis: {
                      itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: "rgba(0, 0, 0, 0.5)",
                      },
                    },
                  },
                ],
              };
            } else if (type === "bar-chart") {
              options = {
                xAxis: {
                  type: "category",
                  data: [], // Initialize with an empty array
                },
                yAxis: {
                  type: "value",
                },
                title: {
                  text: `${label}`,
                  subtext: "Real Time Data",
                  left: "center",
                  textStyle: {
                    fontSize: 23,
                  },
                  subtextStyle: {
                    fontSize: 14,
                  },
                },
                color: new graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: "rgb(200, 180, 255)" },         // Morado claro
                  { offset: 0.5, color: "rgb(167, 159, 254)" },       // Morado medio
                ]),
                tooltip: {
                  trigger: "item",
                },
                legend: {
                  orient: "horizontal",
                  top: "bottom",
                  textStyle: {
                    fontSize: 14,
                  },
                },
                series: [
                  {
                    type: "bar",
                    showBackground: true,
                    data: [], // This will be populated with userData and count
                    emphasis: {
                      itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: "rgba(0, 0, 0, 0.5)",
                      },
                    },
                  },
                ],
              };
            }

            // If no chart is selected dont push a chart.
            if(type != "no-chart"){
               
              // Check if an entry with the same label already exists in groupedData
              if (!groupedData[label]) {
                // If it doesn't exist, create a new entry with options and userData
                groupedData[label] = {
                  title: label,
                  type: type,
                  options: options,
                  userDataCounts: {}, // Object to store userData counts
                };
              }

              // Populate the chart data for the specific question
              console.log("groupedData: ",groupedData)
              const chartData = groupedData[label].options.series[0].data;
              const userDataCounts = groupedData[label].userDataCounts;
              let barChartXaxisData;
              if (type === "bar-chart") {
                barChartXaxisData = groupedData[label].options?.xAxis?.data;
              }
              if (userDataCounts[userData]) {
                userDataCounts[userData]++;
                if (index === eventData.length - 1 && groupedData[label]) {
                  const keys = Object.keys(userDataCounts);
                  const data = keys.map((key) => ({
                    name: key,
                    value: userDataCounts[key],
                  }));
                  groupedData[label].options.series[0].data = data;
                }
              } else {
                if (barChartXaxisData) {
                  barChartXaxisData.push(userData);
                }
                userDataCounts[userData] = 1;
                chartData.push({
                  name: userData,
                  value: 1,
                });
              }

              console.log("groupedData: ",groupedData)


            }

          }
        });
      });
    }

    // Convert the groupedData object to an array
    let groupedDataArray = Object.values(groupedData);

    return groupedDataArray;
  }

  // Use Effect  to execute events data
  useEffect(() => {
    if (attendees) {
      DataStore.query(Form, (f) => f.Event.id.eq(eventSelectID)).then((results) => {
        if(results.length > 0){

          // Obtain questions from Form only to match className and remove any informative field
          const filteredArray = results[0].questions.map(obj => ({
            className: obj.className,
            name: obj.name
          })).filter(item => {
            let type = item.type;
            return type !== "header" && type !== "paragraph" && Object.values(item).every(value => value !== undefined);
          });

          // Obtain questions from EventAttendees and remove any informative field
          let eventAttendes =  [];
          attendees.forEach(arrayInterno => {
            let nuevoArrayInterno = arrayInterno.filter(elemento => elemento.type !== "header" && elemento.type !== "paragraph");
            eventAttendes.push(nuevoArrayInterno);
          });

          const groupedData = groupEventData(eventAttendes, filteredArray);
          setChartsData(groupedData);
        }
      });
    }
  }, [attendees]);

  return (
    <div className="report-page">
      <Banner />
      <button
        href="crear"
        onClick={() => exportToExcel(attendees, chartsData)}
        className="linear mb-4 flex items-center gap-1 rounded-xl bg-green-500 py-[12px] pl-3 pr-3 text-sm font-medium text-white transition duration-200 hover:bg-black dark:bg-brand-400 dark:text-white dark:hover:bg-brand-300 dark:active:bg-green-200"
      >
        Exportal Excel <MdFileDownload className="h-5 w-5" />
      </button>
      <div className="filters mb-[35px] mt-3">
        <div className="relative flex w-full gap-5">
          <div className="flex w-full flex-col">
            <label>Campus</label>
            <select
              className="select-arrow w-full appearance-none text-ellipsis rounded-md border bg-white py-2.5 pl-3 pr-[40px] text-black shadow-sm	outline-none focus:border-indigo-600"
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

          <div className="flex w-full flex-col">
            <label>Área</label>
            <select
              className="select-arrow w-full appearance-none text-ellipsis rounded-md border bg-white py-2.5 pl-3 pr-[40px] text-black shadow-sm	outline-none focus:border-indigo-600"
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

          <div className="flex w-full flex-col">
            <label>Subárea</label>
            <select
              className="select-arrow w-full appearance-none text-ellipsis rounded-md border bg-white py-2.5 pl-3 pr-[40px] text-black shadow-sm	outline-none focus:border-indigo-600"
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

          <div className="flex w-full flex-col">
            <label>Eventos</label>
            <select
              className="select-arrow w-full appearance-none text-ellipsis rounded-md border bg-white py-2.5 pl-3 pr-[40px] text-black shadow-sm	outline-none focus:border-indigo-600"
              onChange={(e) => setEventSelectID(e.target.value)}
            >
              {/* <option value="0">
                  Todos los eventos
                </option> */}
              {eventList &&
                eventList.map((result) => (
                  <option key={result.id} value={result.id}>
                    {result.title}
                  </option>
                ))}
            </select>
          </div>

        </div>
      </div>

      {/* Card widget */}

      <div className="mt-3 grid grid-cols-1 gap-5 md:grid-cols-2">
        <Widget
          icon={<MdBarChart className="h-7 w-7" />}
          title={"Total Registros"}
          subtitle={totalRegistros}
          description={"Participante/s"}
        />
        <Widget
          icon={<MdBarChart className="h-6 w-6" />}
          title={"Total Check-in"}
          subtitle={totalCheckIn}
          description={"Participante/s"}
        />
        {/* <Widget
          icon={<MdBarChart className="h-7 w-7" />}
          title={"Total Ingresos"}
          subtitle={"$0"}
        /> */}
      </div>

      {/* Tables & Charts */}
      <div className="mt-5 grid grid-cols-1 gap-5 rounded-[20px] md:grid-cols-2">
        {chartsData &&
          chartsData?.map((chart, index) => (
            <PieChartApache key={index} option={chart.options} height="450px" />
          ))}
      </div>

      {chartsData.length == 0 && (
        <div className="!z-5 relative flex items-center	gap-2 rounded-[20px] bg-white bg-clip-border p-3 dark:!bg-navy-800 dark:text-white dark:shadow-none">
          <AiOutlineWarning /> No existen datos para el evento actual
        </div>
      )}
    </div>
  );
};

export default Reportes;
