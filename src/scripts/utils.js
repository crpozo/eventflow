
export const formatDateHour = (inputDate) => {
  try{
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
    const dayOfWeek = daysOfWeek[date.getUTCDay()];
    const month = months[date.getUTCMonth()];
    const day = date.getUTCDate();
    const year = date.getUTCFullYear();
    let hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const ampm = hours >= 12 ? "pm" : "am";
  
    if (hours > 12) {
      hours -= 12;
    }
  
    hours = hours < 10 ? "0" + hours : hours;
    const formattedMinutes = minutes < 10 ? "0" + minutes : minutes;
  
    return `${dayOfWeek}, ${("0" + day).slice(-2)}/${(
      "0" +
      (date.getUTCMonth() + 1)
    ).slice(-2)}/${year} - ${hours}:${formattedMinutes} ${ampm}`;
    
  }catch(e) { console.error("formatDateHour: ",e)}
}


export const formatDate = (inputDate) => {
  try{
    const date = new Date(inputDate);
    const day = ("0" + date.getUTCDate()).slice(-2);
    const month = ("0" + (date.getUTCMonth() + 1)).slice(-2);
    const year = date.getUTCFullYear();

    return `${day}/${month}/${year}`;
    
  }catch(e) { console.error("formatDate: ",e)}
}
