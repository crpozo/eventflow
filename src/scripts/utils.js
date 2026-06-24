
import { useEffect, useState } from "react";

// Event times are stored as a fixed instant (UTC ISO). Display is DYNAMIC:
//  - TIMEZONE follows the viewer's BROWSER (no explicit timeZone) -> the wall
//    clock shifts per region (Quito vs Germany).
//  - LANGUAGE/FORMAT follows the PAGE's selected language (the ES/EN toggle),
//    passed in as `lang`, NOT the browser locale -> a Spanish page shows the
//    date in Spanish even on an English-locale browser. Defaults to Spanish.

// Map the app's language code (ES/EN) to an Intl locale.
const localeFor = (lang) =>
  String(lang || "ES").toUpperCase() === "EN" ? "en-US" : "es-EC";

// Dates
export const formatDateHour = (inputDate, lang) => {
  if (!inputDate) return "";
  try {
    const date = new Date(inputDate);
    if (isNaN(date.getTime())) return "";
    // Page language for format, browser timezone (no explicit timeZone).
    return new Intl.DateTimeFormat(localeFor(lang), {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch (e) {
    console.error("formatDateHour: ", e);
    return "";
  }
};

// Returns just the time portion ("09:00 am"), using the exact same hour/minute
// formatting as formatDateHour. Used to append an end time to a same-day event
// without repeating the weekday/date.
export const formatHour = (inputDate, lang) => {
  if (!inputDate) return "";
  try {
    const date = new Date(inputDate);
    if (isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat(localeFor(lang), {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch (e) {
    console.error("formatHour: ", e);
    return "";
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

// Longer form used on the ticket. Despite the name (kept for import stability)
// it localizes to the PAGE language (lang) for format and the browser timezone.
export const formatSpanishDate = (dateString, lang) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat(localeFor(lang), {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch (e) {
    console.error("formatSpanishDate: ", e);
    return "";
  }
};


// Validate Form

export const validateForm = (lang = "ES") => {
    const isEN = String(lang).toUpperCase() === "EN";
    const messages = {
      required: isEN
        ? "This field was not filled out correctly"
        : "El campo no se ha rellenado correctamente",
      digits13: isEN
        ? "This field requires 13 numeric digits"
        : "El campo requiere de 13 digitos númericos",
    };
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
        error.textContent = messages.required;
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
              error.textContent = messages.digits13;
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
