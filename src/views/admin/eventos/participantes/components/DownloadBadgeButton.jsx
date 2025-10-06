import React, { useState } from 'react';
import { MdDownload } from 'react-icons/md';
import { generateClient } from 'aws-amplify/api';
import { getBadge } from 'graphql/queries';
import { getUrl } from 'aws-amplify/storage';

const client = generateClient();

const DownloadBadgeButton = ({ eventAttendee, event }) => {
  const [isLoading, setIsLoading] = useState(false);

  const getParticipantData = (eventAttendee) => {
    const result = {
      ProfileQrCode: eventAttendee.profileURL || '',
    };

    try {
      if (eventAttendee.formAnswers && Array.isArray(eventAttendee.formAnswers)) {
        console.log("eventAttendee.formAnswers: ", eventAttendee.formAnswers);

        // Crear un mapa de los campos del formulario
        const formFieldsMap = {};
        eventAttendee.formAnswers.forEach(field => {
          if (field.userData && field.userData.length > 0) {
            formFieldsMap[field.name] = field.userData[0];
          }
        });

        console.log("formFieldsMap: ", formFieldsMap);

        // Mapear campos específicos a field_one, field_two, field_three
        // Buscar por todas las variantes posibles

        // field_one: nombre (buscar variantes comunes)
        const nameField = Object.keys(formFieldsMap).find(key =>
          key.toLowerCase().includes('nombre') ||
          key.toLowerCase().includes('name')
        );
        result.field_one = nameField ? formFieldsMap[nameField] : '';

        // field_two: universidad
        const universityField = Object.keys(formFieldsMap).find(key =>
          key.toLowerCase().includes('universidad') ||
          key.toLowerCase().includes('university')
        );
        result.field_two = universityField ? formFieldsMap[universityField] : '';

        // field_three: cargo
        const positionField = Object.keys(formFieldsMap).find(key =>
          key.toLowerCase().includes('cargo') ||
          key.toLowerCase().includes('position')
        );
        result.field_three = positionField ? formFieldsMap[positionField] : '';
      }
    } catch (e) {
      console.error('Error parseando formAnswers:', e);
    }

    console.log('Datos del participante mapeados:', result);

    return result;
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

      // Importar pdf-lib dinámicamente para evitar errores de compilación
      const { PDFDocument } = await import('pdf-lib');

      // Obtener datos del participante
      const participantData = getParticipantData(eventAttendee);

      // Crear un nuevo documento PDF que contendrá ambas páginas
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

      // Llenar todos los campos del formulario
      let fieldsFound = 0;

      console.log('=== DEBUG CAMPOS PDF ===');
      console.log('Total campos en PDF:', fields.length);
      console.log('Datos del participante:', participantData);

      for (const field of fields) {
        const fieldName = field.getName();
        const fieldType = field.constructor.name;
        const fieldValue = participantData[fieldName];

        console.log(`Campo: "${fieldName}" | Tipo: ${fieldType} | Valor disponible:`, fieldValue);

        try {
          // Manejar campo de QR Code primero
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

              console.log(`✓ QR Code generado para "${fieldName}"`);
              fieldsFound++;
            } catch (qrError) {
              console.log(`✗ Error generando QR Code:`, qrError.message);
            }
          }
          // Intentar llenar cualquier otro campo de texto
          else if (fieldValue !== undefined && fieldValue !== null) {
            let value = String(fieldValue);

            // Truncar texto si es muy largo (más de 30 caracteres)
            if (value.length > 30) {
              const originalValue = value;
              value = value.substring(0, 27) + '...';
              console.log(`⚠ Texto truncado de ${originalValue.length} caracteres: "${originalValue}" → "${value}"`);
            }

            console.log(`Intentando llenar "${fieldName}" con valor: "${value}"`);
            console.log(`Métodos disponibles:`, Object.getOwnPropertyNames(Object.getPrototypeOf(field)));

            try {
              // Intentar setText (funciona para PDFTextField)
              if (typeof field.setText === 'function') {
                field.setText(value);
                console.log(`✓ Campo "${fieldName}" llenado con setText: "${value}"`);
                fieldsFound++;
              }
              // Si no tiene setText, intentar acceder directamente al acroField
              else if (field.acroField) {
                try {
                  const { PDFName, PDFString } = await import('pdf-lib');
                  field.acroField.dict.set(PDFName.of('V'), PDFString.of(value));
                  console.log(`✓ Campo "${fieldName}" llenado con acroField: "${value}"`);
                  fieldsFound++;
                } catch (acroError) {
                  console.log(`✗ Error usando acroField para "${fieldName}":`, acroError.message);
                }
              }
              else {
                console.log(`✗ Campo "${fieldName}" no tiene método setText ni acroField`);
              }
            } catch (setTextError) {
              console.log(`✗ Error al llenar "${fieldName}":`, setTextError.message);
            }
          } else {
            console.log(`⊘ Campo "${fieldName}" sin valor en participantData`);
          }
        } catch (e) {
          console.error(`Error procesando campo "${field.getName()}":`, e);
        }
      }

      // Aplanar el formulario para que no se pueda editar
      try {
        form.flatten();
      } catch (e) {
        // Silent error
      }

      // Copiar página frontal al documento final
      const [frontPage] = await finalPdfDoc.copyPages(frontPdfDoc, [0]);
      finalPdfDoc.addPage(frontPage);

      // Si existe backDesign, agregarlo como segunda página
      if (badge.backDesign) {
        try {
          const backUrlResult = await getUrl({ key: badge.backDesign });
          const backUrl = backUrlResult.url.toString();

          const backResponse = await fetch(backUrl);
          const backArrayBuffer = await backResponse.arrayBuffer();
          const backPdfDoc = await PDFDocument.load(backArrayBuffer);

          const [backPage] = await finalPdfDoc.copyPages(backPdfDoc, [0]);

          // Rotar la página trasera 180 grados
          const { degrees } = await import('pdf-lib');
          const currentRotation = backPage.getRotation().angle;
          backPage.setRotation(degrees(currentRotation + 180));

          finalPdfDoc.addPage(backPage);
          console.log('✓ Página trasera agregada y rotada 180 grados');
        } catch (backError) {
          console.error('Error al cargar el diseño posterior:', backError);
        }
      }

      // Guardar el PDF modificado
      const pdfBytes = await finalPdfDoc.save();

      // Crear blob y descargar
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fileName = participantData.field_one
        ? `badge-${participantData.field_one.replace(/\s+/g, '-')}.pdf`
        : `badge-${eventAttendee.email.split('@')[0]}.pdf`;
      link.download = fileName;
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
        alert('Badge descargado. NOTA: El PDF no tiene campos de formulario, por lo que no se reemplazaron las variables.\n\nAgrega campos de formulario al PDF con nombres como: field_one, field_two, field_three, ProfileQrCode');
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
