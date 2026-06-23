// Static UI strings for the public landing pages (info page + registration
// flow). These are fixed labels (not user-generated content), so we keep a
// local ES/EN dictionary instead of calling a translation service for them.
// Dynamic, user-created content (event title, description, ticket names, ...)
// is translated on the fly via Amazon Translate (useAwsTranslation).

export const LANDING_UI = {
  ES: {
    // Header
    officialWeb: "Web oficial USFQ",
    // Event details
    eventDetails: "Detalles del evento",
    dateAndTime: "Fecha y hora",
    start: "Inicio",
    end: "Fin",
    quitoTime: "Hora de Quito (Ecuador continental)",
    location: "Ubicación",
    selectActivity: "Selecciona una actividad",
    confirmAttendance: "Confirma tu asistencia",
    plusTax: "+ IVA",
    empty: "Vacío",
    soldOut: "Entradas Agotadas",
    seeActivities: "Ver actividades",
    bookTicket: "Reservar ticket",
    registerInActivity: "Regístrate en una actividad",
    clickForMore: "Haz clic para más detalles",
    additionalNotes: "Notas adicionales",
    gallery: "Galería",
    partners: "Aliados",
    // Status screens
    loading: "Cargando...",
    eventNotActive: "El evento no se encuentra activo",
    eventFinished: "Evento finalizado!",
    dateUnavailable: "Esta fecha ya no está disponible.",

    // --- Registration / checkout flow ---
    back: "Regresar",
    registrationForm: "Formulario de Registro",
    loadingForm: "Cargando formulario...",
    changeBilling: "Cambiar datos de facturación",
    idType: "Tipo de identificación",
    idNumber: "N° de Identificación",
    email: "Email",
    fullNameOrCompany: "Nombre completo o razón social",
    address: "Dirección",
    phone: "Teléfono",
    register: "Registrarse",
    processingDoNotClose: "Cargando… No cerrar la página.",
    paymentProcessingTitle: "Su pago está siendo procesado actualmente",
    paymentProcessingText:
      "Agradecemos su comprensión y paciencia. En caso de transferencia o depósito, el pago se procesara dentro de 48 horas y el ticket se enviará a su correo electrónico.",
    redirectingTitle: "Redirigiendo a la pasarela de pagos USFQ",
    redirectingText: "Por favor no cierre esta página.",
    successTitle: "¡Registro exitoso!",
    successSubtitle:
      "Tu lugar ha sido confirmado. Presenta tu ticket el día del evento para ingresar.",
    successEmailCopy:
      "Hemos enviado una copia del ticket a tu correo electrónico.",
    successDownloadPdf:
      "También puedes descargar el PDF y guardarlo en tu dispositivo.",
    downloadPdf: "Descargar PDF",
  },
  EN: {
    // Header
    officialWeb: "Official USFQ website",
    // Event details
    eventDetails: "Event details",
    dateAndTime: "Date and time",
    start: "Start",
    end: "End",
    quitoTime: "Quito time (mainland Ecuador)",
    location: "Location",
    selectActivity: "Select an activity",
    confirmAttendance: "Confirm your attendance",
    plusTax: "+ VAT",
    empty: "Empty",
    soldOut: "Sold Out",
    seeActivities: "See activities",
    bookTicket: "Book ticket",
    registerInActivity: "Register for an activity",
    clickForMore: "Click for more details",
    additionalNotes: "Additional notes",
    gallery: "Gallery",
    partners: "Partners",
    // Status screens
    loading: "Loading...",
    eventNotActive: "This event is not active",
    eventFinished: "Event finished!",
    dateUnavailable: "This date is no longer available.",

    // --- Registration / checkout flow ---
    back: "Back",
    registrationForm: "Registration Form",
    loadingForm: "Loading form...",
    changeBilling: "Change billing information",
    idType: "ID type",
    idNumber: "ID number",
    email: "Email",
    fullNameOrCompany: "Full name or company name",
    address: "Address",
    phone: "Phone",
    register: "Register",
    processingDoNotClose: "Loading… Do not close the page.",
    paymentProcessingTitle: "Your payment is currently being processed",
    paymentProcessingText:
      "We appreciate your understanding and patience. In case of a transfer or deposit, the payment will be processed within 48 hours and the ticket will be sent to your email.",
    redirectingTitle: "Redirecting to the USFQ payment gateway",
    redirectingText: "Please do not close this page.",
    successTitle: "Registration successful!",
    successSubtitle:
      "Your spot has been confirmed. Show your ticket on the day of the event to enter.",
    successEmailCopy: "We have sent a copy of the ticket to your email.",
    successDownloadPdf:
      "You can also download the PDF and save it to your device.",
    downloadPdf: "Download PDF",
  },
};

// Helper: returns the UI dictionary for a language, defaulting to ES.
export const getLandingUI = (lang) =>
  LANDING_UI[(lang || "ES").toUpperCase()] || LANDING_UI.ES;
