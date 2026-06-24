import React, { useEffect, useState } from "react";
import { graphic } from "echarts";
import { MdBarChart } from "react-icons/md";
import Widget from "components/widget/Widget";
import { useNavigate } from "react-router-dom";
import { DataStore } from 'aws-amplify/datastore';
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
import * as XLSX from "xlsx";
import { MdFileDownload } from "react-icons/md";
import PieChartApache from "views/admin/reportes/components/PieChartApache";
import { usePermissions } from "../../../providers/PermissionsProvider"


const Reportes = () => {

  // Strip HTML tags from strings (form labels sometimes contain markup)
  const stripHtml = (html) => {
    if (!html || typeof html !== 'string') return html;
    return html.replace(/<[^>]*>/g, '').trim();
  };

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
  const [eventAttendes, setEventAttendes] = useState(null);
  const [chartsData, setChartsData] = useState([]);
  const {
    isAdmin,
    isReportesOnly,
    loading: permLoading,
    eventIDsAllowed,
    canSeeCampus,
    canSeeArea,
    canSeeEvent,
  } = usePermissions();
  // Scope a list of events to what this user may see (admin / no-restriction ->
  // all). Used so a Reportes (or managed) user only sees their granted events.
  const scopeEvents = (list) =>
    !Array.isArray(list) ? list : list.filter((e) => canSeeEvent(e.id));

  // --- ADD: date filters state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // --- ADD: ISO helpers (end of day for endDate)
  const toStartISO = (d) => (d ? new Date(`${d}T00:00:00`).toISOString() : "");
  const toEndISO = (d) => (d ? new Date(`${d}T23:59:59`).toISOString() : "");

  const getEventDateISO = (ev) => {
    const raw =
      ev.startDate ||
      ev.date ||
      ev.start_at ||
      ev.start ||
      ev.createdAt ||
      null;
    if (!raw) return null;

    try {
      // Already ISO (AWSDateTime) or AWSDate (YYYY-MM-DD)
      if (typeof raw === "string" && (raw.includes("T") || /^\d{4}-\d{2}-\d{2}$/.test(raw))) {
        return raw;
      }
      const d = new Date(raw);
      return isNaN(d.getTime()) ? null : d.toISOString();
    } catch {
      return null;
    }
  };

  const subAreaId = JSON.parse(localStorage.getItem("EVENTFLOW.subarea"))?.id;

  const navigate = useNavigate();
  const [totalCheckIn, setTotalCheckIn] = React.useState(0);
  const [totalRegistros, setTotalRegistros] = React.useState(0);

  const [, setOptionTipo] = React.useState({
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

  const [, setOptionCargos] = React.useState({
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

  const [, setOptionEdad] = React.useState({
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

  // Get campus results as observeQueryr
  useEffect(() => {
    if (permLoading) return;

    // Allow access for: Admin, Reportes role, or users with subAreaId
    if (!isAdmin && !isReportesOnly && !subAreaId) {
      navigate("/page/campus");
      return;
    }

    const subscription = DataStore.observeQuery(Campus).subscribe((results) => {
      // Only campuses this user is allowed to see (admin -> all).
      const visible = results.items.filter((c) => canSeeCampus(c.id));
      if (visible.length > 0) {
        setCampusList(visible);
        setCampusSelectID(visible[0].id);
      }
    });

    return () => subscription.unsubscribe();
  }, [permLoading, isAdmin, isReportesOnly, subAreaId, navigate]);

  // Get areas for selected campus, filtered by date range (drives downstream filters)
  useEffect(() => {
    let alive = true;
    if (!campusSelectID) return;

    DataStore.query(Area, (a) => a.campusID.eq(campusSelectID)).then(async (allAreas) => {
      if (!alive) return;
      // Only areas this user is allowed to see (admin -> all).
      const areas = allAreas.filter((a) => canSeeArea(a.id));

      if (!areas.length) {
        // Reset everything if no areas
        setAreaList([{ id: "empty-area", title: "Vacío" }]); setAreaSelectID("");
        setCareerList([{ id: "empty-career", title: "Vacío" }]); setCareerSelectID("");
        setEventList([{ id: "empty-event", title: "Vacío" }]); setEventSelectID("");
        return;
      }

      // If no date filters, keep original behavior
      if (!startDate && !endDate) {
        setAreaList(areas);
        setAreaSelectID(areas[0].id);
        return;
      }

      // Date range filtering
      const areaIDs = new Set(areas.map((a) => a.id));
      const allCareers = await DataStore.query(Career);
      if (!alive) return;

      const careers = allCareers.filter((c) => areaIDs.has(c.areaID));
      const careerById = new Map(careers.map((c) => [c.id, c]));
      const careerIDs = new Set(careers.map((c) => c.id));

      const allEvents = await DataStore.query(Event);
      if (!alive) return;

      const startISO = toStartISO(startDate);
      const endISO = toEndISO(endDate);

      const inRange = allEvents.filter((ev) => {
        if (!careerIDs.has(ev.careerID)) return false;
        const iso = getEventDateISO(ev);
        if (!iso) return false;
        const after = startISO ? iso >= startISO : true;
        const before = endISO ? iso <= endISO : true;
        return after && before;
      });

      const areasWithEvents = new Set(
        inRange
          .map((ev) => careerById.get(ev.careerID)?.areaID)
          .filter(Boolean)
      );

      const filteredAreas = areas.filter((a) => areasWithEvents.has(a.id));

      if (filteredAreas.length) {
        setAreaList(filteredAreas);
        setAreaSelectID((prev) =>
          filteredAreas.some((a) => a.id === prev) ? prev : filteredAreas[0].id
        );
      } else {
        setAreaList([{ id: "empty-area", title: "Vacío" }]); setAreaSelectID("");
        setCareerList([{ id: "empty-career", title: "Vacío" }]); setCareerSelectID("");
        setEventList([{ id: "empty-event", title: "Vacío" }]); setEventSelectID("");
      }
    });

    return () => {
      alive = false;
    };
  }, [campusSelectID, startDate, endDate]);


  // Get careers for selected area, filtered by date range
  useEffect(() => {
    let alive = true;
    if (!areaSelectID) return;

    DataStore.query(Career, (c) => c.areaID.eq(areaSelectID)).then(async (careers) => {
      if (!alive) return;

      if (!careers.length) {
        setCareerList([{ id: "empty-career", title: "Vacío" }]); setCareerSelectID("");
        setEventList([{ id: "empty-event", title: "Vacío" }]); setEventSelectID("");
        return;
      }

      if (!startDate && !endDate) {
        setCareerList(careers);
        setCareerSelectID((prev) => (careers.some((c) => c.id === prev) ? prev : careers[0].id));
        return;
      }

      const careerIDs = new Set(careers.map((c) => c.id));
      const allEvents = await DataStore.query(Event);
      if (!alive) return;

      const startISO = toStartISO(startDate);
      const endISO = toEndISO(endDate);

      const inRange = allEvents.filter((ev) => {
        if (!careerIDs.has(ev.careerID)) return false;
        const iso = getEventDateISO(ev);
        if (!iso) return false;
        const after = startISO ? iso >= startISO : true;
        const before = endISO ? iso <= endISO : true;
        return after && before;
      });

      const careersWithEvents = new Set(inRange.map((ev) => ev.careerID));
      const filteredCareers = careers.filter((c) => careersWithEvents.has(c.id));

      if (filteredCareers.length) {
        setCareerList(filteredCareers);
        setCareerSelectID((prev) =>
          filteredCareers.some((c) => c.id === prev) ? prev : filteredCareers[0].id
        );
      } else {
        setCareerList([{ id: "empty-career", title: "Vacío" }]); setCareerSelectID("");
        setEventList([{ id: "empty-event", title: "Vacío" }]); setEventSelectID("");
      }
    });

    return () => {
      alive = false;
    };
  }, [areaSelectID, startDate, endDate]);


  // Get events depending on the subarea ID
  useEffect(() => {
    if (!careerSelectID) return;

    const startISO = toStartISO(startDate);
    const endISO = toEndISO(endDate);

    DataStore.query(Event, (ev) => ev.careerID.eq(careerSelectID)).then((results) => {
      // Only events this user is allowed to see (admin -> all).
      let filtered = scopeEvents(results);

      // Apply date range client-side if user picked dates
      if (startISO || endISO) {
        filtered = filtered.filter((ev) => {
          const iso = getEventDateISO(ev);
          if (!iso) return false; // exclude events without a valid date
          const afterStart = startISO ? iso >= startISO : true;
          const beforeEnd  = endISO   ? iso <= endISO   : true;
          return afterStart && beforeEnd;
        });
      }

      if (filtered.length > 0) {
        setEventList(filtered);
        setEventSelectID(filtered[0].id);
      } else {
        setEventSelectID("");
        setEventList([{ id: "empty-event", title: "Vacío" }]);
        setOptionTipo((prev) => ({ ...prev, series: [{ ...prev.series[0], data: null }] }));
        setOptionCargos((prev) => ({ ...prev, series: [{ ...prev.series[0], data: null }] }));
        setOptionEdad((prev) => ({ ...prev, series: [{ ...prev.series[0], data: null }] }));
        setTotalCheckIn(null);
        setTotalRegistros(null);
      }
    });
  }, [careerSelectID, startDate, endDate]);





  // Get EventAttendee data on loading or selecting an event
  React.useEffect(() => {
    if (eventSelectID === 0) {
      const eventListID = eventList.map((event) => event.id);


      DataStore.query(EventAttendee).then((results) => {
        const filtered = results.filter((item) =>
          eventListID.includes(item.eventID)
        );
        if (filtered.length > 0) {
          setTotalRegistros(filtered.length);
          setTotalCheckIn(filtered.filter(item => item.checkIn).length);
          setAttendees(filtered.map(item => item.formAnswers));
          setEventAttendes(filtered);
        } else {
          setTotalRegistros(0);
          setTotalCheckIn(0);
          setAttendees([]);
          setEventAttendes([]);
        }
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
          if(results.length > 0){
            setTotalRegistros(results.length);
            setTotalCheckIn(
              results.filter((item) => item.checkIn === true).length
            );
            setAttendees(
              results.length > 0 ? results.map((item) => item.formAnswers) : null
            );
            setEventAttendes(results.length > 0 ? results : null);
          } else {
            setTotalCheckIn(0);
            setTotalRegistros(0);
            setAttendees([]);
            setEventAttendes([]);
          }
        }
      );

    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventSelectID]);

  // Set charts with new data
  function processChart(results, setOptionFunction, type) {
    const countMap = {};
    let value;

    results.forEach((item) => {
      if (type === "position") value = item.position;
      if (type === "age") value = item.age;
      if (type === "type") value = item.type;
      if (countMap[value]) {
        countMap[value] += 1;
      } else {
        countMap[value] = 1;
      }
    });

    if (type === "type") {
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
          Campo: stripHtml(item.label),
          Valor: item.userData[0],
        };

        return flatItem;
      });

      flattenedData.push(flatArray);
    });

    return flattenedData;
  }

  // Generate excel using library XLSX 
  function exportToExcel(data, eventAttendees) {
    if (!data || data.length === 0) {
      alert("No hay datos para exportar en este evento.");
      return;
    }

    const flattenedData = flattenData(data);

    const formattedData = flattenedData.map((user) => {
        const attendee = eventAttendees.find(att => att.email === user.find(field => field.Campo === "Email").Valor);
        const checkInValue = attendee ? attendee.checkIn : false; // Si no encuentra al asistente, asigna false por defecto

        const userData = user.reduce((acc, item) => {
            acc[item.Campo] = item.Valor;
            return acc;
        }, {});

        userData["CheckIn"] = checkInValue; // Agregar el valor de CheckIn

        return userData;
    });

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Datos");

    const eventName = eventList.find((item) => item.id === eventSelectID).title;
    XLSX.writeFile(workbook, `${eventName}.xlsx`);
  }
  
  async function exportAllEventsToExcel() {
    try {
      // 1) Traer todos los eventos
      let allEvents = await DataStore.query(Event);
      // Acotar a lo que el usuario puede ver. Si tiene permisos por evento
      // (Reportes / managed), limitamos a esos; si no, al subárea (legacy).
      if (!isAdmin) {
        if (Array.isArray(eventIDsAllowed)) {
          const allow = new Set(eventIDsAllowed);
          allEvents = allEvents.filter((ev) => allow.has(ev.id));
        } else if (!isReportesOnly && subAreaId) {
          allEvents = allEvents.filter((ev) => ev.careerID === subAreaId);
        }
      }
      const eventMap = new Map(allEvents.map((e) => [e.id, e.title]));
      const eventIDs = new Set(allEvents.map((e) => e.id));

      // 2) Traer todos los EventAttendee y filtrar por los eventos elegibles
      const allEA = await DataStore.query(EventAttendee);
      const ea = allEA.filter((rec) => eventIDs.has(rec.eventID));
      if (!ea.length) {
        alert("No hay registros para exportar.");
        return;
      }

      // 3) Aplanar cada registro (formAnswers) en columnas
      const formatted = ea.map((rec) => {
        const answers = Array.isArray(rec.formAnswers) ? rec.formAnswers : [];
        const row = {};
        answers.forEach((field) => {
          if (!field || field.type === "header" || field.type === "paragraph") return;
          const label = field.label || field.name || "Campo";
          const value = Array.isArray(field.userData) ? field.userData[0] : field.userData;
          row[label] = value;
        });
        row["EventID"] = rec.eventID || "";
        row["EventTitle"] = eventMap.get(rec.eventID) || "";
        row["Email"] = rec.email || "";
        row["CheckIn"] = !!rec.checkIn;
        row["CreatedAt"] = rec.createdAt || "";
        return row;
      });

      // 4) Generar Excel
      const ws = XLSX.utils.json_to_sheet(formatted);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "EventAttendees");
      XLSX.writeFile(wb, "eventflow_all_event_attendees.xlsx");
    } catch (err) {
      console.error("Error exportando base completa:", err);
      alert("Ocurrió un error al exportar la base completa.");
    }
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
            if(!question.userData) return;
            const userData = question.userData[0]; // Assuming there's only one value in userData
            const match = question.className.match(/(.*)-chart/);
            const type = (match ? match[1] : "default") + '-chart';
            let options;

            // Determine the chart options based on the chart type
            if (type === "pie-chart") {
              options = {
                title: {
                  text: `${stripHtml(label)}`,
                  subtext: "Real Time Data",
                  left: "center",
                  textStyle: {
                    fontSize: 23,
                  },
                  subtextStyle: {
                    fontSize: 14,
                  },
                },
                color: ["#4E79A7", "#F28E2B", "#E15759", "#76B7B2", "#59A14F"],
                tooltip: {
                  trigger: "item",
                },
                series: [
                  {
                    name: stripHtml(label),
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
                  text: `${stripHtml(label)}`,
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
                  { offset: 0, color: "#F28E2B" },  // Rojo oscuro
                  { offset: 1, color: "#59A14F" } // Rojo más claro
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
            if(type !== "no-chart"){
               
              // Check if an entry with the same label already exists in groupedData
              if (!groupedData[label]) {
                // If it doesn't exist, create a new entry with options and userData
                groupedData[label] = {
                  title: stripHtml(label),
                  type: type,
                  options: options,
                  userDataCounts: {}, // Object to store userData counts
                };
              }

              // Populate the chart data for the specific question
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attendees]);

  return (
    <div className="report-page px-2 sm:px-0">
      <Banner />
      <div className="filters bg-white p-3 sm:p-4 mb-[35px] mt-3 rounded-[20px] border border-[#f2f2f2]">

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <h3 className="text-xl font-semibold text-gray-800 sm:mb-0">Filtros</h3>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:ml-auto">
            <button
              onClick={() => exportToExcel(attendees, eventAttendes)}
              className="linear flex items-center justify-center gap-1 rounded-xl bg-green-500 py-2.5 sm:py-[12px] px-3 sm:pl-3 sm:pr-3 text-xs sm:text-sm font-medium text-white transition duration-200 hover:bg-black whitespace-nowrap"
            >
              <span className="hidden sm:inline">Exportar evento actual</span>
              <span className="sm:hidden">Evento actual</span>
              <MdFileDownload className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <button
              onClick={exportAllEventsToExcel}
              className="linear flex items-center justify-center gap-1 rounded-xl bg-blue-500 py-2.5 sm:py-[12px] px-3 sm:pl-3 sm:pr-3 text-xs sm:text-sm font-medium text-white transition duration-200 hover:bg-black whitespace-nowrap"
            >
              <span className="hidden sm:inline">Exportar base completa</span>
              <span className="sm:hidden">Base completa</span>
              <MdFileDownload className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>

        <div className="relative flex flex-col sm:flex-row gap-2 sm:gap-5 mb-3 sm:mb-[15px]">
          <div className="flex flex-col sm:flex-initial min-w-0">
            <label className="mb-1 text-sm text-gray-800">Fecha inicio</label>
            <input
              type="date"
              className="w-full rounded-md border bg-white py-2 sm:py-2.5 pl-2 sm:pl-3 pr-2 sm:pr-[12px] text-sm text-black shadow-sm outline-none focus:border-indigo-600"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-initial min-w-0">
            <label className="mb-1 text-sm text-gray-800">Fecha fin</label>
            <input
              type="date"
              className="w-full rounded-md border bg-white py-2 sm:py-2.5 pl-2 sm:pl-3 pr-2 sm:pr-[12px] text-sm text-black shadow-sm outline-none focus:border-indigo-600"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          {/* Reset button */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => { setStartDate(""); setEndDate(""); }}
              className="w-full sm:w-auto h-[38px] sm:h-[42px] rounded-md border px-3 sm:px-4 text-xs sm:text-sm hover:bg-gray-50 whitespace-nowrap"
              aria-label="Resetear fechas"
            >
              Restablecer
            </button>
          </div>
        </div>


        <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-5">

          <div className="flex w-full flex-col min-w-0">
            <label className="mb-1 text-sm text-gray-800">Campus</label>
            <select
              className="select-arrow w-full appearance-none truncate rounded-md border bg-white py-2 sm:py-2.5 pl-2 sm:pl-3 pr-8 sm:pr-[40px] text-sm text-black shadow-sm outline-none focus:border-indigo-600"
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

          <div className="flex w-full flex-col min-w-0">
            <label className="mb-1 text-sm text-gray-800">Área</label>
            <select
              className="select-arrow w-full appearance-none truncate rounded-md border bg-white py-2 sm:py-2.5 pl-2 sm:pl-3 pr-8 sm:pr-[40px] text-sm text-black shadow-sm outline-none focus:border-indigo-600"
              onChange={(e) => setAreaSelectID(e.target.value)}
            >
              {areaList &&
                areaList.map((result) => {
                  return (
                    <option key={result.id} value={result.id}>
                      {result.title}
                    </option>
                  );
              })}
            </select>
          </div>

          <div className="flex w-full flex-col min-w-0">
            <label className="mb-1 text-sm text-gray-800">Subárea</label>
            <select
              className="select-arrow w-full appearance-none truncate rounded-md border bg-white py-2 sm:py-2.5 pl-2 sm:pl-3 pr-8 sm:pr-[40px] text-sm text-black shadow-sm outline-none focus:border-indigo-600"
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

          <div className="flex w-full flex-col min-w-0">
            <label className="mb-1 text-sm text-gray-800">Eventos</label>
            <select
              className="select-arrow w-full appearance-none truncate rounded-md border bg-white py-2 sm:py-2.5 pl-2 sm:pl-3 pr-8 sm:pr-[40px] text-sm text-black shadow-sm outline-none focus:border-indigo-600"
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
          title={"Total Bruto"}
          subtitle="$90"
          description={""}
        />
         <Widget
          icon={<MdBarChart className="h-7 w-7" />}
          title={"Total Neto"}
          subtitle="$90"
          description={""}
        /> */}
      </div>

      {/* Tables & Charts */}
      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
        {chartsData &&
          chartsData?.map((chart, index) => (
            <PieChartApache key={index} option={chart.options} height="450px" />
          ))}
      </div>
{/* 
      {chartsData.length == 0 && (
        <div className="!z-5 relative flex items-center	gap-2 rounded-[20px] bg-white bg-clip-border p-3 dark:!bg-navy-800 dark:text-white dark:shadow-none">
          <AiOutlineWarning /> No existen gráficos para el evento actual
        </div>
      )} */}
    </div>
  );
};

export default Reportes;
