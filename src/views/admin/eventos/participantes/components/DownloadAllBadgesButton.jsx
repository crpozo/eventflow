import React, { useState } from 'react';
import { MdDownload } from 'react-icons/md';
import { generateClient } from 'aws-amplify/api';
import { getBadge } from 'graphql/queries';
import { getUrl } from 'aws-amplify/storage';
import JSZip from 'jszip';

const client = generateClient();

const DownloadAllBadgesButton = ({ event, tableData }) => {
  const [isLoading, setIsLoading] = useState(false);

  const getParticipantData = (eventAttendee) => {
    const result = {
      ProfileQrCode: eventAttendee.profileURL || '',
    };

    try {
      if (eventAttendee.formAnswers && Array.isArray(eventAttendee.formAnswers)) {
        const fieldsWithData = eventAttendee.formAnswers.filter(
          field => field.userData && field.userData.length > 0
        );

        if (fieldsWithData.length > 0) {
          result.field_one = fieldsWithData[0].userData[0];
        }
        if (fieldsWithData.length > 1) {
          result.field_two = fieldsWithData[1].userData[0];
        }
        if (fieldsWithData.length > 2) {
          result.field_three = fieldsWithData[2].userData[0];
        }
      }
    } catch (e) {
      console.error('Error parseando formAnswers:', e);
    }

    try {
      if (eventAttendee.formAnswers && Array.isArray(eventAttendee.formAnswers)) {
        const formFieldsMap = {};
        eventAttendee.formAnswers.forEach(field => {
          if (field.userData && field.userData.length > 0) {
            formFieldsMap[field.name] = field.userData[0];
          }
        });

        const nameField = Object.keys(formFieldsMap).find(key =>
          key.toLowerCase().includes('nombre') ||
          key.toLowerCase().includes('name')
        );
        result.field_one = nameField ? formFieldsMap[nameField] : '';

        const universityField = Object.keys(formFieldsMap).find(key =>
          key.toLowerCase().includes('universidad') ||
          key.toLowerCase().includes('university')
        );
        result.field_two = universityField ? formFieldsMap[universityField] : '';

        const positionField = Object.keys(formFieldsMap).find(key =>
          key.toLowerCase().includes('cargo') ||
          key.toLowerCase().includes('position')
        );
        result.field_three = positionField ? formFieldsMap[positionField] : '';
      }
    } catch (e) {
      console.error('Error parseando formAnswers:', e);
    }

    return result;
  };

  const generateBadgePDF = async (eventAttendee, badge) => {
    const { PDFDocument, degrees } = await import('pdf-lib');

    const participantData = getParticipantData(eventAttendee);
    const finalPdfDoc = await PDFDocument.create();

    // Obtener URL del PDF frontal desde S3
    const frontUrlResult = await getUrl({ key: badge.frontDesign });
    const frontUrl = frontUrlResult.url.toString();

    // Descargar y cargar el PDF frontal
    const frontResponse = await fetch(frontUrl);
    const frontArrayBuffer = await frontResponse.arrayBuffer();
    const frontPdfDoc = await PDFDocument.load(frontArrayBuffer);

    // Obtener el formulario del PDF frontal
    const form = frontPdfDoc.getForm();
    const fields = form.getFields();

    // Llenar campos del formulario
    for (const field of fields) {
      const fieldName = field.getName();
      const fieldValue = participantData[fieldName];

      try {
        if (fieldName === 'ProfileQrCode') {
          try {
            const QRCode = await import('qrcode');
            const qrDataUrl = await QRCode.toDataURL(participantData.ProfileQrCode || eventAttendee.profileURL, {
              width: 200,
              margin: 1,
            });

            const qrImageBytes = await fetch(qrDataUrl).then(res => res.arrayBuffer());
            const qrImage = await frontPdfDoc.embedPng(qrImageBytes);

            if (field.constructor.name === 'PDFButton') {
              const appearance = field.acroField.getAppearanceCharacteristics();
              if (appearance) {
                appearance.setNormalIcon(qrImage);
              }
            }
          } catch (qrError) {
            console.log(`Error generando QR Code:`, qrError.message);
          }
        } else if (fieldValue !== undefined && fieldValue !== null) {
          let value = String(fieldValue);

          // Truncar texto si es muy largo
          if (value.length > 30) {
            value = value.substring(0, 27) + '...';
          }

          try {
            if (typeof field.setText === 'function') {
              field.setText(value);
            } else if (field.acroField) {
              try {
                const { PDFName, PDFString } = await import('pdf-lib');
                field.acroField.dict.set(PDFName.of('V'), PDFString.of(value));
              } catch (acroError) {
                console.log(`Error usando acroField:`, acroError.message);
              }
            }
          } catch (setTextError) {
            console.log(`Error al llenar campo:`, setTextError.message);
          }
        }
      } catch (e) {
        console.error(`Error procesando campo:`, e);
      }
    }

    // Aplanar el formulario
    try {
      form.flatten();
    } catch (e) {
      // Silent error
    }

    // Copiar página frontal
    const [frontPage] = await finalPdfDoc.copyPages(frontPdfDoc, [0]);
    finalPdfDoc.addPage(frontPage);

    // Si existe backDesign, agregarlo como segunda página rotada
    if (badge.backDesign) {
      try {
        const backUrlResult = await getUrl({ key: badge.backDesign });
        const backUrl = backUrlResult.url.toString();

        const backResponse = await fetch(backUrl);
        const backArrayBuffer = await backResponse.arrayBuffer();
        const backPdfDoc = await PDFDocument.load(backArrayBuffer);

        const [backPage] = await finalPdfDoc.copyPages(backPdfDoc, [0]);

        // Rotar la página trasera 180 grados
        const currentRotation = backPage.getRotation().angle;
        backPage.setRotation(degrees(currentRotation + 180));

        finalPdfDoc.addPage(backPage);
      } catch (backError) {
        console.error('Error al cargar el diseño posterior:', backError);
      }
    }

    // Guardar el PDF
    const pdfBytes = await finalPdfDoc.save();
    return pdfBytes;
  };

  const downloadAllBadges = async () => {
    if (!event || !event.eventBadgeId) {
      alert('No hay un diseño de badge configurado para este evento');
      return;
    }

    if (!tableData || tableData.length === 0) {
      alert('No hay participantes para descargar');
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

      // Crear archivo ZIP
      const zip = new JSZip();
      let successCount = 0;
      let errorCount = 0;

      // Generar badges para cada participante
      for (let i = 0; i < tableData.length; i++) {
        const row = tableData[i];
        const eventAttendee = row.eventAttendee;

        try {
          console.log(`Generando badge ${i + 1}/${tableData.length} para ${eventAttendee.email}`);

          const pdfBytes = await generateBadgePDF(eventAttendee, badge);

          // Obtener nombre para el archivo
          const participantData = getParticipantData(eventAttendee);
          const fileName = participantData.field_one
            ? `badge-${participantData.field_one.replace(/\s+/g, '-')}.pdf`
            : `badge-${eventAttendee.email.split('@')[0]}.pdf`;

          // Agregar al ZIP
          zip.file(fileName, pdfBytes);
          successCount++;
        } catch (error) {
          console.error(`Error generando badge para ${eventAttendee.email}:`, error);
          errorCount++;
        }
      }

      // Generar el archivo ZIP
      console.log('Generando archivo ZIP...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      // Descargar el ZIP
      const url = window.URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `badges-${event.title || 'evento'}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      alert(`Descarga completada!\n✓ ${successCount} badges generados\n${errorCount > 0 ? `✗ ${errorCount} errores` : ''}`);
    } catch (error) {
      console.error('Error al descargar badges:', error);
      alert('Error al descargar los badges: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={downloadAllBadges}
      disabled={isLoading}
      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isLoading
          ? 'bg-gray-400 cursor-not-allowed text-white'
          : 'bg-green-600 hover:bg-green-700 text-white'
      }`}
      title="Descargar Todos los Badges"
    >
      {isLoading ? (
        <>
          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Generando ZIP...</span>
        </>
      ) : (
        <>
          <MdDownload className="h-4 w-4" />
          <span>Descargar Todos</span>
        </>
      )}
    </button>
  );
};

export default DownloadAllBadgesButton;
