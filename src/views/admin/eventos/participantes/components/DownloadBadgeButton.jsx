import React, { useState } from 'react';
import { MdDownload } from 'react-icons/md';
import { generateClient } from 'aws-amplify/api';
import { getBadge } from 'graphql/queries';
import { getUrl } from 'aws-amplify/storage';

const client = generateClient();

const DownloadBadgeButton = ({ eventAttendee, event }) => {
  const [isLoading, setIsLoading] = useState(false);

  const getParticipantData = (eventAttendee) => {
    let formData = {};
    try {
      if (eventAttendee.formAnswers) {
        console.log("eventAttendee.formAnswers: ",eventAttendee.formAnswers)
        if (typeof eventAttendee.formAnswers === 'string') {
          formData = JSON.parse(eventAttendee.formAnswers);
        } else if (Array.isArray(eventAttendee.formAnswers)) {
          // Si formAnswers es un array (como en tu caso)
          formData = {};
          eventAttendee.formAnswers.forEach(field => {
            if (field.userData && field.userData.length > 0) {
              formData[field.name] = field.userData[0];
            }
          });
        } else {
          formData = eventAttendee.formAnswers;
        }
      }
    } catch (e) {
      console.error('Error parseando formAnswers:', e);
    }

    console.log('FormData extraído:', formData);

    return {
      NameAttendee: formData.nombres || formData.name || eventAttendee.email.split('@')[0],
      Email: formData.email || eventAttendee.email,
      TheUniversityLabelReplacePurpose: formData.university || formData.universidad || 'Universidad San Francisco de Quito',
      ProfileQrCode: eventAttendee.profileURL || '',
      Identificacion: formData.identificacion || '',
      TipoIdentificacion: formData.tipo_identificacion || '',
      Direccion: formData.direccion || '',
      Telefono: formData.telefono || '',
      // Agregar más campos según sea necesario
    };
  };

  const downloadBadge = async () => {
    if (!event || !event.eventBadgeId) {
      alert('No hay un diseño de badge configurado para este evento');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Obteniendo Badge del evento...');

      // Obtener el Badge del evento
      const badgeResponse = await client.graphql({
        query: getBadge,
        variables: { id: event.eventBadgeId }
      });

      const badge = badgeResponse.data.getBadge;

      if (!badge || !badge.frontDesign) {
        alert('No se encontró el diseño del badge');
        setIsLoading(false);
        return;
      }

      console.log('Badge encontrado:', badge);

      // Obtener URL del PDF desde S3
      const frontUrlResult = await getUrl({ key: badge.frontDesign });
      const frontUrl = frontUrlResult.url.toString();

      console.log('URL del badge:', frontUrl);

      // Obtener datos del participante
      const participantData = getParticipantData(eventAttendee);
      console.log('Datos del participante:', participantData);

      // Descargar el PDF
      const response = await fetch(frontUrl);
      const arrayBuffer = await response.arrayBuffer();

      // Importar pdf-lib dinámicamente para evitar errores de compilación
      const { PDFDocument } = await import('pdf-lib');

      // Cargar el PDF
      const pdfDoc = await PDFDocument.load(arrayBuffer);

      // Obtener el formulario del PDF
      const form = pdfDoc.getForm();
      const fields = form.getFields();

      console.log('Campos encontrados en el PDF:', fields.map(f => f.getName()));

      // Llenar solo el campo NameAttendee
      let fieldsFound = false;
      fields.forEach((field) => {
        const fieldName = field.getName();
        console.log(`Campo: ${fieldName}`);

        // Solo llenar NameAttendee, obviar el resto
        if (fieldName === 'NameAttendee') {
          try {
            if (field.constructor.name === 'PDFTextField') {
              field.setText(String(participantData.NameAttendee));
              fieldsFound = true;
              console.log(`Campo NameAttendee llenado con: ${participantData.NameAttendee}`);
            }
          } catch (e) {
            console.error(`Error llenando campo NameAttendee:`, e);
          }
        }
      });

      if (!fieldsFound) {
        console.warn('ADVERTENCIA: No se encontraron campos de formulario en el PDF.');
        console.warn('Para que funcione el reemplazo de variables, el PDF debe tener campos de formulario editables.');
        console.warn('Campos esperados:', Object.keys(participantData));
      }

      // Aplanar el formulario para que no se pueda editar
      try {
        form.flatten();
      } catch (e) {
        console.log('No se pudo aplanar el formulario:', e);
      }

      // Guardar el PDF modificado
      const pdfBytes = await pdfDoc.save();

      // Crear blob y descargar
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `badge-${participantData.NameAttendee.replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('Badge descargado exitosamente');

      if (!fieldsFound) {
        alert('Badge descargado. NOTA: El PDF no tiene campos de formulario, por lo que no se reemplazaron las variables. Por favor, crea el PDF con campos de formulario llamados: NameAttendee, Email, TheUniversityLabelReplacePurpose, ProfileQrCode');
      }

    } catch (error) {
      console.error('Error descargando badge:', error);
      alert('Error al descargar el badge: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={downloadBadge}
      disabled={isLoading}
      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isLoading
          ? 'bg-gray-400 cursor-not-allowed text-white'
          : 'bg-brand-500 hover:bg-brand-600 text-white'
      }`}
      title="Descargar Badge"
    >
      {isLoading ? (
        <>
          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Descargando...</span>
        </>
      ) : (
        <>
          <MdDownload className="h-4 w-4" />
          <span>Badge</span>
        </>
      )}
    </button>
  );
};

export default DownloadBadgeButton;
