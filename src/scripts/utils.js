
import { useEffect, useState } from "react";

// Dates
export const formatDateHour = (inputDate) => {
  try {
    const daysOfWeek = [
      "Domingo",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
    ];
    const months = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];

    const date = new Date(inputDate);

    // Set the Ecuador timezone (America/Guayaquil)
    const options = {
      timeZone: 'America/Guayaquil',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    };

    const dateString = date.toLocaleString('es-EC', options);

    const dayOfWeek = daysOfWeek[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "pm" : "am";

    if (hours > 12) {
      hours -= 12;
    }

    hours = hours < 10 ? "0" + hours : hours;
    const formattedMinutes = minutes < 10 ? "0" + minutes : minutes;

    return `${dayOfWeek}, ${("0" + day).slice(-2)}/${(
      "0" + (date.getMonth() + 1)
    ).slice(-2)}/${year} - ${hours}:${formattedMinutes} ${ampm}`;
    
  } catch (e) {
    console.error("formatDateHour: ", e);
  }
};

export const formatDate = (inputDate) => {
  try {
    const date = inputDate ? new Date(inputDate) : new Date();
    
    if (isNaN(date.getTime())) {
      console.error("formatDate: Invalid date input");
      return null;
    }

    const day = ("0" + date.getUTCDate()).slice(-2);
    const month = ("0" + (date.getUTCMonth() + 1)).slice(-2);
    const year = date.getUTCFullYear();

    return `${day}/${month}/${year}`;
  } catch (e) {
    console.error("formatDate error: ", e);
    return null;
  }
};

export const formatSpanishDate = (dateString) => {
  try {
    const months = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];

    const days = [
      "Domingo",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
    ];

    const date = new Date(dateString);
    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes();

    const formattedDate = `${dayName}, ${monthName} ${month
      .toString()
      .padStart(2, "0")}/${day.toString().padStart(2, "0")}/${year} - ${hours
      .toString()
      .padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${
      hours >= 12 ? "PM" : "AM"
    }`;

    return formattedDate;
  } catch (e) {
    console.error("formatSpanishDate: ", e);
  }
};


// Validate Form

export const validateForm = (price) => {
    const form = document.querySelector("#fb-editor .rendered-form");
    const formElements = form.querySelectorAll("[required]");
    let isValid = true;
    let tipo_identificación = "";

    formElements.forEach((element) => {
      // Checking empty fields 
      if (!element.checkValidity()) {
        isValid = false;
        const error = document.createElement("div");
        error.className = "error-message text-red-500";
        error.textContent = "El campo no se ha rellenado correctamente";
        element.insertAdjacentElement("afterend", error);
      }
      // Check type of user identification 
      if(element.id == "tipo_identificacion"){
        tipo_identificación = element.options[element.selectedIndex].value;        
      }

      if(element.id == "identificacion"){
        switch (tipo_identificación) {
          case "cedula":
            // if(!/^\d{10}$/.test(element.value)){
            //   const error = document.createElement("div");
            //   error.className = "error-message text-red-500";
            //   error.textContent = "El campo requiere de 10 digitos númericos";
            //   element.insertAdjacentElement("afterend", error);
            // }
            break;
          case "pasaporte":
            break;
          case "ruc":
            if(!/^\d{13}$/.test(element.value)){
              const error = document.createElement("div");
              error.className = "error-message text-red-500";
              error.textContent = "El campo requiere de 13 digitos númericos";
              element.insertAdjacentElement("afterend", error);
            }
            break;   
        } 
      }
    });
    

    if(isValid == false){
      debounce(form.scrollIntoView({ behavior: 'smooth' }), 400)
    }

    return isValid;
}

function debounce(func, wait) {
  let timeout;
  return function() {
      const contexto = this;
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function() {
          func.apply(contexto, args);
      }, wait);
  };
}
