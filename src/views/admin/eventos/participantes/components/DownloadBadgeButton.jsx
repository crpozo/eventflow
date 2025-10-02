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

      // Obtener URL del PDF desde S3
      const frontUrlResult = await getUrl({ key: badge.frontDesign });
      const frontUrl = frontUrlResult.url.toString();

      // Obtener datos del participante
      const participantData = getParticipantData(eventAttendee);

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

      // Llenar todos los campos del formulario
      let fieldsFound = 0;

      console.log('=== DEBUG CAMPOS PDF ===');
      console.log('Total campos en PDF:', fields.length);
      console.log('Datos del participante:', participantData);

      for (const field of fields) {
        const fieldName = field.getName();
        const fieldType = field.constructor.name;

        console.log(`Campo: "${fieldName}" | Tipo: ${fieldType} | Valor disponible:`, participantData[fieldName]);

        try {
          // Llenar campos de texto
          if (field.constructor.name === 'PDFTextField') {
            if (participantData[fieldName] !== undefined && participantData[fieldName] !== null) {
              const value = String(participantData[fieldName]);
              field.setText(value);
              console.log(`✓ Campo "${fieldName}" llenado con: "${value}"`);
              fieldsFound++;
            } else {
              console.log(`✗ Campo "${fieldName}" no tiene valor en participantData`);
            }
          }
          // Llenar campo de imagen para QR Code
          else if (fieldName === 'ProfileQrCode') {
            try {
              // Generar QR Code
              const QRCode = await import('qrcode');
              const qrDataUrl = await QRCode.toDataURL(participantData.ProfileQrCode || eventAttendee.profileURL, {
                width: 200,
                margin: 1,
              });

              // Convertir data URL a bytes
              const qrImageBytes = await fetch(qrDataUrl).then(res => res.arrayBuffer());
              const qrImage = await pdfDoc.embedPng(qrImageBytes);

              // Si es un botón de imagen
              if (field.constructor.name === 'PDFButton') {
                const appearance = field.acroField.getAppearanceCharacteristics();
                if (appearance) {
                  appearance.setNormalIcon(qrImage);
                }
              }

              fieldsFound++;
            } catch (qrError) {
              // Silent error
            }
          }
        } catch (e) {
          // Silent error
        }
      }

      // Aplanar el formulario para que no se pueda editar
      try {
        form.flatten();
      } catch (e) {
        // Silent error
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

      console.log('Campos del PDF:', fields.map(f => f.getName()));
      console.log('Datos del participante:', participantData);
      console.log('Campos llenados:', fieldsFound);

      console.log('=== RESULTADO ===');
      console.log('Campos llenados:', fieldsFound, 'de', fields.length);

      // Solo mostrar alerta si NO hay campos de formulario en el PDF
      if (fields.length === 0) {
        alert('Badge descargado. NOTA: El PDF no tiene campos de formulario, por lo que no se reemplazaron las variables.\n\nAgrega campos de formulario al PDF con nombres como: NameAttendee, Email, TheUniversityLabelReplacePurpose, ProfileQrCode');
      }
      // Mostrar advertencia si hay campos pero ninguno se llenó
      else if (fieldsFound === 0) {
        console.error('ERROR: Ningún campo fue llenado');
        console.error('Campos del PDF:', fields.map(f => `"${f.getName()}"`).join(', '));
        console.error('Keys de participantData:', Object.keys(participantData).join(', '));
        alert(`Badge descargado. ADVERTENCIA: El PDF tiene campos de formulario (${fields.map(f => f.getName()).join(', ')}) pero ninguno coincide con los datos disponibles.\n\nDatos disponibles: ${Object.keys(participantData).join(', ')}`);
      }

    } catch (error) {
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
          : 'bg-black hover:bg-brand-500 text-white'
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
