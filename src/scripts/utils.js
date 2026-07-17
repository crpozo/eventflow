
// Event times are stored as a fixed instant (UTC ISO). Display is pinned to the
// EVENT's own timezone (passed in as `tz`, an IANA zone) so EVERY viewer sees
// the same wall-clock as the venue — not their own browser time. A label like
// "(GMT-6)" is shown next to the time so it's unambiguous. The page LANGUAGE
// (ES/EN toggle, `lang`) still drives the locale/format. Default tz = mainland
// Ecuador (America/Guayaquil, GMT-5). Ecuador has no DST, so offsets are fixed.

const ECUADOR_DEFAULT_TZ = "America/Guayaquil";

// Map the app's language code (ES/EN) to an Intl locale.
const localeFor = (lang) =>
  String(lang || "ES").toUpperCase() === "EN" ? "en-US" : "es-EC";

// Safely read the event cached by the events table. Some pages have stored the
// literal string "undefined" (JSON.stringify(undefined)), which is truthy and
// makes a bare JSON.parse throw during render — white-screening the route.
export const readStoredEvent = () => {
  try {
    const raw = localStorage.getItem("EVENTFLOW.event");
    if (!raw || raw === "undefined") return null;
    return JSON.parse(raw);
  } catch (e) {
    // JSON corrupto en localStorage: se loguea y se trata como "sin evento".
    console.error("readStoredEvent: evento almacenado inválido", e);
    return null;
  }
};

// Short GMT label for an event timezone (for "(GMT-6)" next to the time).
export const tzLabel = (tz) =>
  tz === "Pacific/Galapagos" ? "GMT-6" : "GMT-5";

// City + GMT tag for the public landing pill ("Galápagos · GMT-6").
// Proper nouns: same label in ES/EN, no i18n needed.
export const tzCityLabel = (tz) =>
  tz === "Pacific/Galapagos" ? "Galápagos · GMT-6" : "Quito · GMT-5";

// Fixed UTC offset per Ecuador zone (no DST).
const tzOffset = (tz) => (tz === "Pacific/Galapagos" ? "-06:00" : "-05:00");

// Convert a naive datetime-local string ("2026-07-06T08:30") to a UTC ISO using
// the EVENT timezone's fixed offset, so "08:30" means 08:30 in the venue's zone.
export const eventLocalToISO = (value, tz) =>
  value
    ? new Date(`${String(value).slice(0, 16)}:00${tzOffset(tz)}`).toISOString()
    : "";

// Dates
export const formatDateHour = (inputDate, lang, tz = ECUADOR_DEFAULT_TZ) => {
  if (!inputDate) return "";
  try {
    const date = new Date(inputDate);
    if (Number.isNaN(date.getTime())) return "";
    // Page language for format; event timezone for the wall clock.
    return new Intl.DateTimeFormat(localeFor(lang), {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: tz || ECUADOR_DEFAULT_TZ,
    }).format(date);
  } catch (e) {
    console.error("formatDateHour: ", e);
    return "";
  }
};

// Returns just the time portion ("09:00 am"), using the exact same hour/minute
// formatting as formatDateHour. Used to append an end time to a same-day event
// without repeating the weekday/date.
export const formatHour = (inputDate, lang, tz = ECUADOR_DEFAULT_TZ) => {
  if (!inputDate) return "";
  try {
    const date = new Date(inputDate);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat(localeFor(lang), {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: tz || ECUADOR_DEFAULT_TZ,
    }).format(date);
  } catch (e) {
    console.error("formatHour: ", e);
    return "";
  }
};

export const formatDate = (inputDate) => {
  try {
    const date = inputDate ? new Date(inputDate) : new Date();
    
    if (Number.isNaN(date.getTime())) {
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
// it localizes to the PAGE language (lang) for format and the EVENT timezone.
export const formatSpanishDate = (dateString, lang, tz = ECUADOR_DEFAULT_TZ) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat(localeFor(lang), {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: tz || ECUADOR_DEFAULT_TZ,
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
        element.after(error);
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
              element.after(error);
            }
            break;   
        } 
      }
    });
    

    if(!isValid){
      debounce(form.scrollIntoView({ behavior: 'smooth' }), 400)
    }

    return isValid;
}

// Exportada para poder testearla directamente (no cambia su uso interno).
export function debounce(func, wait) {
  let timeout;
  return function (...args) {
      clearTimeout(timeout);
      // La arrow function conserva el `this` de la llamada sin aliasarlo.
      timeout = setTimeout(() => {
          func.apply(this, args);
      }, wait);
  };
}
