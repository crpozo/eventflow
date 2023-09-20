import React, { useEffect, useState } from "react";
import PieChartApache from "views/admin/reportes/components/PieChartApache";
import { graphic } from "echarts";
import { MdBarChart, MdDashboard } from "react-icons/md";
import Widget from "components/widget/Widget";
import { useNavigate } from "react-router-dom";
import { DataStore } from "aws-amplify";
import { Campus, Area, Career, Event, Attendee, EventAttendee } from "models";
import Banner from "./components/Banner";
import Datepicker from "react-tailwindcss-datepicker";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { MdFileDownload } from "react-icons/md";

const Dashboard = () => {

  const navigate = useNavigate();

  const [campusList, setCampusList] = React.useState(null);
  const [campusSelectID, setCampusSelectID] = React.useState("");
  const [areaList, setAreaList] = React.useState(null);
  const [areaSelectID, setAreaSelectID] = React.useState(null);
  const [careerList, setCareerList] = React.useState(null);
  const [careerSelectID, setCareerSelectID] = React.useState(null);
  const [eventList, setEventList] = React.useState(null);
  const [eventSelectID, setEventSelectID] = React.useState(null);
  const [attendees, setAttendees] = useState(null);
  const [chartsData, setChartsData] = useState([]);

  const id = "caede638-3700-4231-aaf5-71596b78a35f";
  const campusID = JSON.parse(localStorage.getItem("EVENTFLOW.campus")).id;
  const subAreaId = JSON.parse(localStorage.getItem("EVENTFLOW.subarea")).id;

  // const [value, setValue] = React.useState({
  //   startDate: new Date(),
  //   endDate: new Date().setMonth(8)
  //   });

  // const handleValueChange = (newValue) => {
  //   console.log("newValue:", newValue);
  //   setValue(newValue);
  // }

  React.useEffect(() => {
    if (!subAreaId) {
      navigate(`/page/campus`);
    }
  }, [navigate]);

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

  React.useEffect(() => {
    DataStore.query(Campus).then((results) => {
      setCampusList(results);
      setCampusSelectID(results[0].id);
      console.log("Campus: ", results);
    });
  }, []);

  // Get area depending on the the campus ID
  React.useEffect(() => {
    DataStore.query(Area, (a) => a.campusID.eq(campusSelectID)).then(
      (results) => {
        if (results.length > 0) {
          setAreaList(results);
          setAreaSelectID(results[0].id);
        } else {
          setAreaSelectID("");
          setAreaList([{ title: "Vacio" }]);
        }
        console.log("Area: ", results);
      }
    );
  }, [campusSelectID]);

  // Get subarea depending on the the area ID
  React.useEffect(() => {
    DataStore.query(Career, (c) => c.areaID.eq(areaSelectID)).then(
      (results) => {
        if (results.length > 0) {
          setCareerList(results);
          setCareerSelectID(results[0].id);
        } else {
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
          console.log("Event results: " + results);
          // setAttendees(results);
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

  // Get Diagrams
  React.useEffect(() => {
    if (eventSelectID == 0) {
      // let query = Amplify.DataStore.query(Attendee);

      // for (let i = 0; i < participants.length; i++) {
      //   query = query.or(Post.ID.eq(participants[i]));
      // }

      // console.log("eventList: ",eventList.map(event => event.id))
      const eventListID = eventList.map((event) => event.id);

      DataStore.query(EventAttendee).then((results) => {
        console.log(results);
        // console.log(results);
        const filteredData = results.filter((item) =>
          eventListID.includes(item.eventID)
        );

        /*
          console.log("resultados: ", filteredData);
          processChart(results, setOptionCargos);
          processChart(results, setOptionEdad);
        */
      });
    } else {
      DataStore.query(Attendee, (a) =>
        a.EventAttendees.eventID.eq(eventSelectID)
      ).then((results) => {
        // console.log(results);
        // Datos cargo de participantes
        setTotalRegistros(results.length);
        processChart(results, setOptionCargos, "position");
        processChart(results, setOptionEdad, "age");
        processChart(results, setOptionTipo, "type");
      });

      DataStore.query(EventAttendee, (e) => e.eventID.eq(eventSelectID)).then(
        (results) => {
          console.log("EventAttendee: ", results);
          setTotalCheckIn(
            results.filter((item) => item.checkIn === true).length
          );
          setAttendees(results.map((item) => item.formAnswers));
        }
      );
    }
  }, [eventSelectID]);

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

  // ==> Excel data flatten handler
  function flattenData(data) {
    const flattenedData = [];

    data.forEach((array) => {
      const flatArray = array.map((item) => {
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

  // ==> Export to excel handler
  function exportToExcel(data) {
    const flattenedData = flattenData(data);
    const ws = XLSX.utils.json_to_sheet(flattenedData.flat());
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const eventName = eventList.find((item) => item.id === eventSelectID).title;
    saveAs(blob, `${eventName}.xlsx`);
  }

  // ==> Chart data handler
  function groupEventData(eventData) {
    const groupedData = [];

    // Iterate through each event item
    eventData.forEach((eventItem) => {
      eventItem.forEach((question) => {
        // Check if the question is required
        if (question.type === "number" || question.type === "select") {
          const label = question.label;
          const userData = question.userData[0]; // Assuming there's only one value in userData
          const type = question.className.includes("bar-chart")
            ? "bar-chart"
            : "pie-chart";
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
                data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
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
                  name: label,
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

          // Check if an entry with the same label already exists in groupedData
          const existingEntry = groupedData.find(
            (entry) => entry.title === label
          );

          if (existingEntry) {
            // If it exists, find the userData entry
            const userDataEntry = existingEntry.options.series[0].data.find(
              (entry) => entry.name === userData
            );

            if (userDataEntry) {
              // If userData entry exists, increment the count
              userDataEntry.value++;
            } else {
              // If userData entry doesn't exist, create a new entry
              existingEntry.options.series[0].data.push({
                name: userData,
                value: 1,
              });
            }
          } else {
            // If it doesn't exist, create a new entry with options and userData
            groupedData.push({
              title: label,
              type: type,
              options: options,
            });
          }
        }
      });
    });

    return groupedData;
  }

  // ==> Use Effect  to execute events data
  useEffect(() => {
    if (attendees) {
      const groupedData = groupEventData(attendees);
      setChartsData(groupedData);
      console.log("chartsData: ",chartsData)
    }
  }, [attendees]);

  return (
    <div className="report-page">
      <Banner />
      <button
        href="crear"
        onClick={() => exportToExcel(attendees)}
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

          {/* <div className="date-filter flex flex-col w-full">
            <label>Fechas</label>
            <Datepicker 
              i18n={"es"} 
              value={value} 
              onChange={handleValueChange} 
            />
          </div> */}
        </div>
      </div>

      {/* Card widget */}

      <div className="mt-3 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
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
        <Widget
          icon={<MdBarChart className="h-7 w-7" />}
          title={"Total Ingresos"}
          subtitle={"$0"}
        />
      </div>

      {/* Tables & Charts */}
      <div className="mt-5 grid grid-cols-1 gap-5 rounded-[20px] md:grid-cols-2">
        {chartsData &&
          chartsData?.map((chart, index) => (
            <PieChartApache key={index} option={chart.options} height="450px" />
          ))}
          {chartsData.length == 0 && 
            <div className="!z-5 relative flex flex-col rounded-[10px] bg-white bg-clip-border dark:!bg-navy-800 dark:text-white dark:shadow-none rounded-[20px] p-3">
              No existen datos para el evento actual
            </div>
          }
      </div>

      {/* <div className="mt-5 grid grid-cols-1 gap-5">
        <div className="grid grid-cols-1 gap-5 rounded-[20px] md:grid-cols-2">
          <PieChartApache option={optionTipo} height="450px" />
          <PieChartApache option={optionEdad} height="450px" />
        </div>

        <div className="grid grid-cols-1 gap-5 rounded-[20px] md:grid-cols-2">
          <PieChartApache option={optionCargos} height="450px" />
        </div>
      </div> */}
    </div>
  );
};

export default Dashboard;
